// ==UserScript==
// @name         SQL Equipment Import
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      2.0
// @description  Floating panel on phpMyAdmin that fetches equipment-import SQL templates from the Toolbox MariaDB (via toolbox-sql API), lets you edit unit rows + Modbus settings (RTU/TCP, multi-IP), and emits the full SQL ready to paste.
// @author       spenz91
// @match        *://*.plants.iwmac.local:*/secure/phpMyAdmin/*
// @run-at       document-end
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      toolbox.iwmac.local
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window) return;

    // ---------------- Config ----------------
    const API = 'http://toolbox.iwmac.local:8505/toolbox-sql';
    const DB = 'sql_equipment_import';
    const EDITABLE_SETTINGS = ['mb_mode', 'comm_baudrate', 'comm_parity']; // shown as inputs
    const PARITY_OPTS = [
        ['0', 'N (None)'], ['1', 'O (Odd)'], ['2', 'E (Even)'],
        ['3', 'M (Mark)'], ['4', 'S (Space)'],
    ];
    const MB_MODE_OPTS = [['0', 'RTU'], ['1', 'ASCII'], ['2', 'TCP'], ['3', 'TCP (alt)']];

    // ---------------- API ----------------
    function http(method, path, body) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method, url: API + (path || ''),
                headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
                data: body || null,
                timeout: 30000,
                onload: r => {
                    if (r.status >= 200 && r.status < 300) {
                        try { resolve(JSON.parse(r.responseText)); }
                        catch (_) { resolve(r.responseText); }
                    } else reject(new Error(`HTTP ${r.status}: ${r.responseText.slice(0, 300)}`));
                },
                onerror: () => reject(new Error('Network error — is the toolbox-sql API running?')),
                ontimeout: () => reject(new Error('Timeout talking to toolbox-sql API')),
            });
        });
    }
    const sqlExec = (sql) => http('POST', '', 'sql_command=' + encodeURIComponent(sql));
    const sqlEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''");

    // Result shape varies by API; normalise to array of plain objects.
    function rowsOf(res) {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.rows)) return res.rows;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.result)) return res.result;
        return [];
    }

    // ---------------- SQL parsing ----------------
    // Extract top-level (...) tuples from a VALUES blob, respecting '...' strings.
    function extractTuples(s) {
        const out = []; let i = 0, depth = 0, start = -1, inStr = false;
        while (i < s.length) {
            const c = s[i];
            if (inStr) {
                if (c === "'" && s[i + 1] === "'") { i += 2; continue; }
                if (c === "'") inStr = false;
                i++; continue;
            }
            if (c === "'") { inStr = true; i++; continue; }
            if (c === '(') { if (depth === 0) start = i + 1; depth++; i++; continue; }
            if (c === ')') { depth--; if (depth === 0) out.push(s.slice(start, i)); i++; continue; }
            i++;
        }
        return out;
    }
    // Split one tuple body by top-level commas, respecting '...'.
    function splitFields(t) {
        const out = []; let cur = '', inStr = false, paren = 0, i = 0;
        while (i < t.length) {
            const c = t[i];
            if (inStr) {
                if (c === "'" && t[i + 1] === "'") { cur += "''"; i += 2; continue; }
                if (c === "'") inStr = false;
                cur += c; i++; continue;
            }
            if (c === "'") { inStr = true; cur += c; i++; continue; }
            if (c === '(') { paren++; cur += c; i++; continue; }
            if (c === ')') { paren--; cur += c; i++; continue; }
            if (c === ',' && paren === 0) { out.push(cur.trim()); cur = ''; i++; continue; }
            cur += c; i++;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }
    // Strip surrounding single-quotes and unescape doubled single-quotes.
    function unq(v) {
        v = v.trim();
        if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") {
            return v.slice(1, -1).replace(/''/g, "'");
        }
        return v;
    }
    const q = (v) => "'" + sqlEsc(v) + "'";

    // Locate the iw_sys_plant_units REPLACE block.
    // Returns {start, end, header (cols), tuples (raw body strings), rows (parsed objects)}
    function parseBlock(sqlText, table) {
        const re = new RegExp(
            `REPLACE\\s+INTO\\s+\`${table}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);`,
            'i'
        );
        const m = re.exec(sqlText);
        if (!m) return null;
        const cols = m[1].split(',').map(s => s.trim().replace(/`/g, ''));
        const tuples = extractTuples(m[2]);
        const rows = tuples.map(t => {
            const f = splitFields(t);
            const o = {};
            cols.forEach((c, i) => o[c] = f[i] != null ? f[i].trim() : '');
            return o;
        });
        return { start: m.index, end: m.index + m[0].length, cols, tuples, rows, raw: m[0] };
    }

    // Build a unit-rows REPLACE block from edited rows (preserves original column order/types).
    function buildUnitsBlock(units, header) {
        const cols = header.cols;
        const ownerOf = (r) => r; // already strings from form / template
        const lines = units.map(u => {
            const vals = cols.map(col => {
                if (col === 'row_date') return 'NOW()';
                const raw = u._raw && u._raw[col] != null ? u._raw[col] : '';
                // Editable columns are unit_id / unit_name / driver_addr; others come from _raw verbatim.
                if (col === 'unit_id') return q(u.unit_id || '');
                if (col === 'unit_name') return q(u.unit_name || '');
                if (col === 'driver_addr' || col === 'driver_adr') return q(u.driver_addr || '');
                return raw || "''";
            });
            return '(' + vals.join(', ') + ')';
        });
        const colsSql = cols.map(c => '`' + c + '`').join(', ');
        return `REPLACE INTO \`iw_sys_plant_units\` (${colsSql}) VALUES\n${lines.join(',\n')};`;
    }

    // ---------------- UI ----------------
    const css = `
    #seii-panel{position:fixed;top:12px;right:12px;width:460px;z-index:2147483647;background:#fff;border:1px solid #888;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.25);font:12px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222}
    #seii-panel .hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#2b6cb0;color:#fff;border-radius:6px 6px 0 0;cursor:move;user-select:none}
    #seii-panel .hdr b{font-size:13px}
    #seii-panel .hdr button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:3px;padding:1px 7px;cursor:pointer;margin-left:4px}
    #seii-panel .tabs{display:flex;border-bottom:1px solid #ddd;background:#f7f7f7}
    #seii-panel .tabs button{flex:1;background:none;border:0;border-right:1px solid #ddd;padding:6px;cursor:pointer;font-weight:600}
    #seii-panel .tabs button.active{background:#fff;border-bottom:2px solid #2b6cb0}
    #seii-panel .body{padding:10px;max-height:78vh;overflow-y:auto}
    #seii-panel .pane{display:none}
    #seii-panel .pane.active{display:block}
    #seii-panel label{display:block;font-weight:600;margin:6px 0 2px}
    #seii-panel input,#seii-panel select,#seii-panel textarea{width:100%;box-sizing:border-box;padding:4px 6px;font:12px monospace;border:1px solid #bbb;border-radius:3px}
    #seii-panel textarea{font-family:Consolas,monospace;font-size:11px;min-height:140px;resize:vertical;white-space:pre}
    #seii-panel .row{display:flex;gap:4px;margin-bottom:3px;align-items:center}
    #seii-panel .row input{flex:1}
    #seii-panel .row button{width:28px}
    #seii-panel .ip-row input{flex:1}
    #seii-panel .actions{display:flex;gap:6px;margin-top:10px}
    #seii-panel .actions button{flex:1;padding:5px;cursor:pointer;border:1px solid #888;border-radius:3px;background:#f0f0f0}
    #seii-panel .actions button.primary{background:#2b6cb0;color:#fff;border-color:#2b6cb0}
    #seii-panel .status{margin-top:6px;min-height:14px}
    #seii-panel .ok{color:#2f855a;font-weight:600}
    #seii-panel .err{color:#c53030;font-weight:600}
    #seii-panel .small{font-size:11px;color:#666}
    #seii-panel .units th,#seii-panel .units td{font-size:11px;padding:2px 3px}
    #seii-panel .units input{font-size:11px;padding:2px 3px}
    #seii-toggle{position:fixed;top:12px;right:12px;z-index:2147483647;background:#2b6cb0;color:#fff;border:0;border-radius:4px;padding:4px 9px;cursor:pointer;font:12px -apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);display:none}
    #seii-panel hr{border:0;border-top:1px solid #eee;margin:10px 0}
    `;
    document.documentElement.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

    const panel = document.createElement('div');
    panel.id = 'seii-panel';
    panel.innerHTML = `
      <div class="hdr">
        <b>SQL Equipment Import</b>
        <span><button id="seii-hide" title="Hide">×</button></span>
      </div>
      <div class="tabs">
        <button data-tab="build" class="active">Builder</button>
        <button data-tab="manage">Manage templates</button>
      </div>
      <div class="body">
        <div class="pane active" data-pane="build">
          <div id="seii-conn" class="small">Connecting to toolbox-sql…</div>

          <label>Equipment template</label>
          <select id="seii-tpl"><option value="">— pick —</option></select>

          <div id="seii-form" style="display:none">
            <label>Unit rows <span class="small">(rename/add/remove)</span></label>
            <div id="seii-units"></div>
            <button id="seii-addunit" class="small" style="margin-top:3px;padding:2px 8px;cursor:pointer">+ Add unit</button>

            <div id="seii-settings"></div>

            <div id="seii-tcpwrap" style="display:none">
              <label>mb_tcp_servers <span class="small">(rows auto-numbered: 1;ip;..., 2;ip;...)</span></label>
              <div id="seii-ips"></div>
              <button id="seii-addip" class="small" style="margin-top:3px;padding:2px 8px;cursor:pointer">+ Add IP</button>
            </div>

            <div class="actions">
              <button id="seii-gen" class="primary">Generate SQL</button>
              <button id="seii-copy">Copy</button>
            </div>
            <div id="seii-status" class="status"></div>

            <label>SQL output</label>
            <textarea id="seii-out" readonly placeholder="Click Generate SQL…"></textarea>
          </div>
        </div>

        <div class="pane" data-pane="manage">
          <div id="seii-mconn" class="small"></div>

          <label>Saved templates</label>
          <div id="seii-list" class="small">…</div>

          <hr>

          <label>Import a template (.sql file)</label>
          <input type="file" id="seii-file" accept=".sql,text/plain">
          <label>Internal name <span class="small">(unique, e.g. SLV_105N4627-v2)</span></label>
          <input type="text" id="seii-iname" placeholder="e.g. SLV_105N4627-v2">
          <label>Display name</label>
          <input type="text" id="seii-idisp" placeholder="e.g. SLV 105N4627 v2">
          <label>Driver type <span class="small">(auto-detected on file load)</span></label>
          <input type="text" id="seii-idriver" placeholder="e.g. SLV">
          <div class="actions">
            <button id="seii-save" class="primary">Save to toolbox</button>
          </div>
          <div id="seii-mstatus" class="status"></div>
          <label>Preview</label>
          <textarea id="seii-prev" readonly placeholder="Pick a .sql file…"></textarea>
        </div>
      </div>
    `;
    document.documentElement.appendChild(panel);
    const toggle = document.createElement('button');
    toggle.id = 'seii-toggle'; toggle.textContent = 'SQL Import';
    document.documentElement.appendChild(toggle);

    const $ = id => document.getElementById(id);
    $('seii-hide').onclick = () => { panel.style.display = 'none'; toggle.style.display = 'block'; };
    toggle.onclick = () => { panel.style.display = ''; toggle.style.display = 'none'; };

    panel.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
        panel.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x === b));
        panel.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.dataset.pane === b.dataset.tab));
        if (b.dataset.tab === 'manage') refreshTemplateList();
    });

    // ---------- Drag ----------
    (function () {
        const hdr = panel.querySelector('.hdr');
        let sx, sy, ox, oy, drag = false;
        hdr.addEventListener('mousedown', e => {
            if (e.target.tagName === 'BUTTON') return;
            drag = true; const r = panel.getBoundingClientRect();
            sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!drag) return;
            panel.style.left = (ox + e.clientX - sx) + 'px';
            panel.style.top = (oy + e.clientY - sy) + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => { drag = false; });
    })();

    // ---------- Connection check + template list ----------
    let TEMPLATES = []; // [{id,name,display_name,driver_type}]
    let CURRENT = null; // {id, sqlText, unitsBlock, settingsBlock, parsedUnits, parsedSettings, ...}

    async function checkConnAndLoad() {
        const $c = $('seii-conn');
        try {
            const h = await http('GET', '/health');
            $c.innerHTML = `<span class="ok">toolbox-sql online.</span> Loading templates…`;
        } catch (e) {
            $c.innerHTML = `<span class="err">toolbox-sql offline: ${e.message}</span>`;
            return;
        }
        try {
            const res = await sqlExec(`SELECT id, name, display_name, driver_type FROM ${DB}.templates ORDER BY display_name`);
            TEMPLATES = rowsOf(res);
            const sel = $('seii-tpl');
            sel.innerHTML = '<option value="">— pick equipment —</option>' +
                TEMPLATES.map(t => `<option value="${t.id}">${escapeHtml(t.display_name)} (${escapeHtml(t.driver_type)})</option>`).join('');
            $c.innerHTML = `<span class="ok">${TEMPLATES.length} templates available.</span>`;
        } catch (e) {
            $c.innerHTML = `<span class="err">Load failed: ${e.message}</span> <span class="small">— check that the <code>${DB}</code> database exists (run db-setup.sql).</span>`;
        }
    }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    // ---------- Pick a template ----------
    $('seii-tpl').onchange = async () => {
        const id = +$('seii-tpl').value;
        if (!id) { $('seii-form').style.display = 'none'; return; }
        $('seii-conn').textContent = 'Loading template…';
        try {
            const r = await sqlExec(`SELECT id, name, sql_text FROM ${DB}.templates WHERE id=${id} LIMIT 1`);
            const row = rowsOf(r)[0];
            if (!row) throw new Error('Template not found');
            CURRENT = { id: row.id, name: row.name, sqlText: row.sql_text };
            CURRENT.units = parseBlock(CURRENT.sqlText, 'iw_sys_plant_units');
            CURRENT.settings = parseBlock(CURRENT.sqlText, 'iw_sys_plant_settings');
            renderForm();
            $('seii-form').style.display = '';
            $('seii-conn').innerHTML = `<span class="ok">Loaded ${escapeHtml(row.name)} (${CURRENT.units ? CURRENT.units.rows.length : 0} unit rows).</span>`;
        } catch (e) {
            $('seii-conn').innerHTML = `<span class="err">${e.message}</span>`;
        }
    };

    function renderForm() {
        // Units
        const u = $('seii-units');
        u.innerHTML = '';
        if (CURRENT.units && CURRENT.units.rows.length) {
            CURRENT.units.rows.forEach(r => addUnitRow({
                unit_id: unq(r.unit_id || ''),
                unit_name: unq(r.unit_name || ''),
                driver_addr: unq(r.driver_addr || r.driver_adr || ''),
                _raw: r,
            }));
        } else {
            addUnitRow({ unit_id: 'U01', unit_name: '', driver_addr: '0_1', _raw: null });
        }

        // Settings
        const s = $('seii-settings');
        s.innerHTML = '';
        if (CURRENT.settings) {
            const owner = unq(CURRENT.settings.rows[0] ? CURRENT.settings.rows[0].owner : '');
            CURRENT.settings.owner = owner;
            for (const key of EDITABLE_SETTINGS) {
                const r = CURRENT.settings.rows.find(x => unq(x.setting) === key);
                const cur = r ? unq(r.value) : '';
                const id = 'seii-set-' + key;
                let html = `<label>${key}</label>`;
                if (key === 'mb_mode') {
                    html += `<select id="${id}">${MB_MODE_OPTS.map(([v, t]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${v} — ${t}</option>`).join('')}</select>`;
                } else if (key === 'comm_parity') {
                    html += `<select id="${id}">${PARITY_OPTS.map(([v, t]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${v} — ${t}</option>`).join('')}</select>`;
                } else {
                    html += `<input type="text" id="${id}" value="${escapeHtml(cur)}">`;
                }
                const div = document.createElement('div');
                div.innerHTML = html;
                s.appendChild(div);
            }
            $('seii-set-mb_mode').addEventListener('change', syncTcpVisible);
            syncTcpVisible();
        }

        // TCP IPs
        $('seii-ips').innerHTML = '';
        addIpRow('192.168.10.100');
    }

    function addUnitRow(u) {
        const div = document.createElement('div');
        div.className = 'row';
        div.innerHTML = `
          <input class="seii-uid" placeholder="unit_id" value="${escapeHtml(u.unit_id)}" style="flex:0 0 70px">
          <input class="seii-uname" placeholder="unit_name" value="${escapeHtml(u.unit_name)}">
          <input class="seii-uaddr" placeholder="driver_addr" value="${escapeHtml(u.driver_addr)}" style="flex:0 0 70px">
          <button class="seii-urm" title="Remove">−</button>`;
        div.dataset.raw = u._raw ? JSON.stringify(u._raw) : '';
        $('seii-units').appendChild(div);
        div.querySelector('.seii-urm').onclick = () => {
            if ($('seii-units').children.length > 1) div.remove();
        };
    }
    $('seii-addunit').onclick = (e) => {
        e.preventDefault();
        addUnitRow({ unit_id: '', unit_name: '', driver_addr: '', _raw: null });
    };

    function addIpRow(ip) {
        const div = document.createElement('div');
        div.className = 'row ip-row';
        div.innerHTML = `<input class="seii-ip" placeholder="192.168.10.100" value="${escapeHtml(ip || '')}"><button class="seii-iprm" title="Remove">−</button>`;
        $('seii-ips').appendChild(div);
        div.querySelector('.seii-iprm').onclick = () => {
            if ($('seii-ips').children.length > 1) div.remove();
        };
    }
    $('seii-addip').onclick = (e) => { e.preventDefault(); addIpRow(''); };

    function syncTcpVisible() {
        const v = $('seii-set-mb_mode') ? $('seii-set-mb_mode').value : '0';
        $('seii-tcpwrap').style.display = (v === '2' || v === '3') ? '' : 'none';
    }

    // ---------- Generate output ----------
    function buildOutput() {
        if (!CURRENT) throw new Error('Pick a template first.');
        let out = CURRENT.sqlText;

        // Collect UI state
        const units = [...$('seii-units').children].map(div => ({
            unit_id: div.querySelector('.seii-uid').value.trim(),
            unit_name: div.querySelector('.seii-uname').value.trim(),
            driver_addr: div.querySelector('.seii-uaddr').value.trim(),
            _raw: div.dataset.raw ? JSON.parse(div.dataset.raw) : null,
        })).filter(u => u.unit_id);
        if (!units.length) throw new Error('At least one unit row is required.');

        const settingsValues = {};
        for (const k of EDITABLE_SETTINGS) {
            const el = $('seii-set-' + k);
            if (el) settingsValues[k] = el.value.trim();
        }
        const owner = (CURRENT.settings && CURRENT.settings.owner) || '';
        const isTcp = settingsValues.mb_mode === '2' || settingsValues.mb_mode === '3';
        const ips = [...document.querySelectorAll('.seii-ip')].map(i => i.value.trim()).filter(Boolean);
        const tcpServers = ips.map((ip, i) => `${i + 1};${ip};502;1000;2;1000`).join('\\r\\n') + (ips.length ? '\\r\\n' : '');

        // 1) Replace iw_sys_plant_units block
        if (CURRENT.units) {
            // For unit rows whose original came from the template, keep non-editable column values verbatim from _raw.
            const rebuilt = [];
            const cols = CURRENT.units.cols;
            for (const u of units) {
                const raw = u._raw || {};
                const vals = cols.map(col => {
                    if (col === 'row_date') return /NOW\(\)/i.test(raw[col] || '') ? raw[col] : "NOW()";
                    if (col === 'unit_id') return q(u.unit_id);
                    if (col === 'unit_name') return q(u.unit_name);
                    if (col === 'driver_addr' || col === 'driver_adr') return q(u.driver_addr);
                    return raw[col] != null && raw[col] !== '' ? raw[col] : "''";
                });
                rebuilt.push('(' + vals.join(', ') + ')');
            }
            const colsSql = cols.map(c => '`' + c + '`').join(', ');
            const block = `REPLACE INTO \`iw_sys_plant_units\` (${colsSql}) VALUES\n${rebuilt.join(',\n')};`;
            out = out.slice(0, CURRENT.units.start) + block + out.slice(CURRENT.units.end);
        }

        // 2) Patch settings (only the editable ones), and inject mb_tcp_servers if TCP
        const settingsBlock = parseBlock(out, 'iw_sys_plant_settings');
        if (settingsBlock) {
            const cols = settingsBlock.cols;
            const rows = settingsBlock.rows.map(r => ({ ...r })); // shallow copy
            // Update editable settings
            for (const k of EDITABLE_SETTINGS) {
                const idx = rows.findIndex(x => unq(x.setting) === k);
                if (idx >= 0) rows[idx].value = q(settingsValues[k]);
            }
            // mb_tcp_servers row
            if (isTcp) {
                const idx = rows.findIndex(x => unq(x.setting) === 'mb_tcp_servers');
                if (idx >= 0) {
                    rows[idx].value = q(tcpServers);
                } else {
                    const tpl = {};
                    cols.forEach(c => tpl[c] = "''");
                    if ('row_date' in tpl) tpl.row_date = 'NOW()';
                    if ('setting' in tpl) tpl.setting = q('mb_tcp_servers');
                    if ('owner' in tpl) tpl.owner = q(owner);
                    if ('value' in tpl) tpl.value = q(tcpServers);
                    if ('help_text' in tpl) tpl.help_text = q('ID;IPadr;IPport;ConnTout;ConnRetries;RequestTout');
                    rows.push(tpl);
                }
            }
            const lines = rows.map(r => '(' + cols.map(c => r[c] != null && r[c] !== '' ? r[c] : "''").join(', ') + ')');
            const colsSql = cols.map(c => '`' + c + '`').join(', ');
            const block = `REPLACE INTO \`iw_sys_plant_settings\` (${colsSql}) VALUES\n${lines.join(',\n')};`;
            out = out.slice(0, settingsBlock.start) + block + out.slice(settingsBlock.end);
        }

        return out;
    }

    $('seii-gen').onclick = () => {
        try {
            const sql = buildOutput();
            $('seii-out').value = sql;
            $('seii-status').innerHTML = '<span class="ok">SQL generated.</span>';
        } catch (e) {
            $('seii-status').innerHTML = `<span class="err">${e.message}</span>`;
        }
    };
    $('seii-copy').onclick = () => {
        try {
            let s = $('seii-out').value;
            if (!s) { s = buildOutput(); $('seii-out').value = s; }
            GM_setClipboard(s);
            $('seii-status').innerHTML = '<span class="ok">Copied to clipboard.</span>';
        } catch (e) {
            $('seii-status').innerHTML = `<span class="err">${e.message}</span>`;
        }
    };

    // ---------- Manage tab ----------
    async function refreshTemplateList() {
        const $m = $('seii-mconn');
        const $l = $('seii-list');
        try {
            const r = await sqlExec(`SELECT id, name, display_name, driver_type, LENGTH(sql_text) AS sz, updated_at FROM ${DB}.templates ORDER BY display_name`);
            const rows = rowsOf(r);
            $m.innerHTML = `<span class="ok">${rows.length} templates</span>`;
            if (!rows.length) { $l.textContent = '(none)'; return; }
            $l.innerHTML = rows.map(t => `
                <div class="row" data-id="${t.id}">
                  <span style="flex:1">${escapeHtml(t.display_name)} <span class="small">(${escapeHtml(t.driver_type)} · ${t.sz}B)</span></span>
                  <button class="seii-del" title="Delete">×</button>
                </div>`).join('');
            $l.querySelectorAll('.seii-del').forEach(b => b.onclick = async () => {
                const id = +b.parentNode.dataset.id;
                if (!confirm('Delete this template? This cannot be undone.')) return;
                await sqlExec(`DELETE FROM ${DB}.templates WHERE id=${id}`);
                refreshTemplateList(); checkConnAndLoad();
            });
        } catch (e) {
            $m.innerHTML = `<span class="err">${e.message}</span>`;
        }
    }
    $('seii-file').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
            const txt = fr.result;
            $('seii-prev').value = txt.slice(0, 4000) + (txt.length > 4000 ? '\n…(truncated for preview; full file will be saved)' : '');
            // auto-fill
            if (!$('seii-iname').value) $('seii-iname').value = f.name.replace(/\.sql$/i, '');
            if (!$('seii-idisp').value) $('seii-idisp').value = f.name.replace(/\.sql$/i, '').replace(/[_-]/g, ' ');
            // detect driver_type from the SQL (process_name in iw_sys_processes, fallback: 7th col of first units row)
            let drv = '';
            const pm = /REPLACE\s+INTO\s+`iw_sys_processes`[\s\S]*?VALUES[\s\S]*?\(\s*[^,]+,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([^']+)'/i.exec(txt);
            if (pm) drv = pm[1];
            if (!drv) {
                const ub = parseBlock(txt, 'iw_sys_plant_units');
                if (ub && ub.rows[0]) drv = unq(ub.rows[0].driver_type || '');
            }
            $('seii-idriver').value = drv;
            $('seii-prev').dataset.full = txt;
        };
        fr.readAsText(f);
    });
    $('seii-save').onclick = async () => {
        const name = $('seii-iname').value.trim();
        const disp = $('seii-idisp').value.trim();
        const drv = $('seii-idriver').value.trim();
        const sql = $('seii-prev').dataset.full || '';
        const $st = $('seii-mstatus');
        if (!name || !disp || !drv || !sql) {
            $st.innerHTML = '<span class="err">All fields + a .sql file are required.</span>'; return;
        }
        const totalLen = sql.length + name.length + disp.length + drv.length + 200;
        if (totalLen > 60000) {
            $st.innerHTML = `<span class="err">SQL too large (${sql.length}B). API max ~64KB per request — split into smaller templates or raise the API limit.</span>`;
            return;
        }
        try {
            $st.textContent = 'Saving…';
            await sqlExec(
                `REPLACE INTO ${DB}.templates (name, display_name, driver_type, sql_text) VALUES (` +
                `${q(name)}, ${q(disp)}, ${q(drv)}, ${q(sql)})`
            );
            $st.innerHTML = '<span class="ok">Saved.</span>';
            refreshTemplateList(); checkConnAndLoad();
        } catch (e) {
            $st.innerHTML = `<span class="err">Save failed: ${e.message}</span>`;
        }
    };

    // ---------- Boot ----------
    checkConnAndLoad();
})();
