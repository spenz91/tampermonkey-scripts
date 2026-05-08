// ==UserScript==
// @name         SQL Equipment Import
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      4.1
// @description  Floating panel on phpMyAdmin: pick a driver-template from a GitHub-hosted manifest (or load a .sql file from disk), edit unit rows + Modbus settings (RTU/TCP, multi-IP), emit the full SQL ready to paste into the plant DB. No backend, no DB.
// @author       spenz91
// @match        *://*.plants.iwmac.local:*/secure/phpMyAdmin/*
// @run-at       document-end
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window) return;

    // ---------------- Config ----------------
    const REPO_BASE = 'https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/templates';
    const MANIFEST_URL = REPO_BASE + '/manifest.json';
    const EDITABLE_SETTINGS = ['mb_mode', 'comm_baudrate', 'comm_parity'];
    const PARITY_OPTS = [
        ['0', 'N (None)'], ['1', 'O (Odd)'], ['2', 'E (Even)'],
        ['3', 'M (Mark)'], ['4', 'S (Space)'],
    ];
    const MB_MODE_OPTS = [['0', 'RTU'], ['2', 'TCP']];
    const BAUDRATE_OPTS = ['9600', '19200', '38400', '57600', '115200'];

    // ---------------- SQL helpers ----------------
    const sqlEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''");
    const q = (v) => "'" + sqlEsc(v) + "'";

    // ---------------- HTTP (GitHub raw) ----------------
    function gmFetch(url) {
        return new Promise((resolve, reject) => {
            // cache-buster so freshly-pushed files are visible immediately
            const u = url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
            GM_xmlhttpRequest({
                method: 'GET', url: u, timeout: 30000,
                onload: r => {
                    if (r.status >= 200 && r.status < 300) resolve(r.responseText);
                    else reject(new Error(`HTTP ${r.status} fetching ${url}`));
                },
                onerror: () => reject(new Error('Network error fetching ' + url)),
                ontimeout: () => reject(new Error('Timeout fetching ' + url)),
            });
        });
    }

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
    function unq(v) {
        v = (v || '').trim();
        if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") {
            return v.slice(1, -1).replace(/''/g, "'");
        }
        return v;
    }
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

    // ---------------- UI ----------------
    const css = `
    #seii-panel{position:fixed;top:12px;right:12px;width:460px;height:auto;min-width:360px;min-height:120px;max-width:98vw;max-height:96vh;z-index:2147483647;background:#fff;border:1px solid #888;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.25);font:12px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222;resize:both;overflow:hidden;display:flex;flex-direction:column}
    #seii-panel .hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#2b6cb0;color:#fff;border-radius:6px 6px 0 0;cursor:move;user-select:none}
    #seii-panel .hdr b{font-size:13px}
    #seii-panel .hdr button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:3px;padding:1px 7px;cursor:pointer;margin-left:4px}
    #seii-panel .body{padding:10px;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column}
    #seii-panel #seii-form{display:flex;flex-direction:column;flex:1;min-height:0}
    #seii-panel #seii-form.show{display:flex}
    #seii-panel #seii-out{flex:1;min-height:120px}
    #seii-panel.collapsed .body{display:none}
    #seii-panel.collapsed{width:auto}
    #seii-panel label{display:block;font-weight:600;margin:6px 0 2px}
    #seii-panel input,#seii-panel select,#seii-panel textarea{width:100%;box-sizing:border-box;padding:4px 6px;font:12px monospace;border:1px solid #bbb;border-radius:3px}
    #seii-panel textarea{font-family:Consolas,monospace;font-size:11px;min-height:160px;resize:vertical;white-space:pre}
    #seii-panel .row{display:flex;gap:4px;margin-bottom:3px;align-items:center}
    #seii-panel .row input{flex:1}
    #seii-panel .row button{width:28px}
    #seii-panel .actions{display:flex;gap:6px;margin-top:10px}
    #seii-panel .actions button{flex:1;padding:5px;cursor:pointer;border:1px solid #888;border-radius:3px;background:#f0f0f0}
    #seii-panel .actions button.primary{background:#2b6cb0;color:#fff;border-color:#2b6cb0}
    #seii-panel .status{margin-top:6px;min-height:14px}
    #seii-panel .ok{color:#2f855a;font-weight:600}
    #seii-panel .err{color:#c53030;font-weight:600}
    #seii-panel .small{font-size:11px;color:#666}
    #seii-toggle{position:fixed;top:12px;right:12px;z-index:2147483647;background:#2b6cb0;color:#fff;border:0;border-radius:4px;padding:4px 9px;cursor:pointer;font:12px -apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);display:none}
    `;
    document.documentElement.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

    const panel = document.createElement('div');
    panel.id = 'seii-panel';
    panel.innerHTML = `
      <div class="hdr">
        <b>SQL Equipment Import</b>
        <span>
          <button id="seii-collapse" title="Collapse / expand">▸</button>
          <button id="seii-hide" title="Hide">×</button>
        </span>
      </div>
      <div class="body">
        <label>Driver template <span class="small">(from GitHub repo)</span></label>
        <div class="row">
          <select id="seii-tpl" style="flex:1"><option value="">— loading… —</option></select>
          <button id="seii-reload" title="Reload manifest" style="padding:2px 8px;cursor:pointer">↻</button>
        </div>

        <label class="small" style="margin-top:8px">…or load a .sql from disk</label>
        <input type="file" id="seii-file" accept=".sql,text/plain">
        <div id="seii-fileinfo" class="small">Pick a template above, or load a file from disk.</div>

        <div id="seii-form" style="display:none">
          <label>Unit rows <span class="small">(rename / add / remove)</span></label>
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
    `;
    document.documentElement.appendChild(panel);
    const toggle = document.createElement('button');
    toggle.id = 'seii-toggle'; toggle.textContent = 'SQL Import';
    document.documentElement.appendChild(toggle);

    const $ = id => document.getElementById(id);
    $('seii-hide').onclick = () => { panel.style.display = 'none'; toggle.style.display = 'block'; };
    toggle.onclick = () => { panel.style.display = ''; toggle.style.display = 'none'; };

    // Default: panel is collapsed when you visit a page; click ▸ (or the title bar) to expand.
    panel.classList.add('collapsed');
    function setCollapsed(c) {
        panel.classList.toggle('collapsed', c);
        $('seii-collapse').textContent = c ? '▸' : '▾';
    }
    $('seii-collapse').onclick = () => setCollapsed(!panel.classList.contains('collapsed'));

    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

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

    // ---------- Template state ----------
    let CURRENT = null; // { name, sqlText, units, settings }
    let MANIFEST = []; // [{name, display_name, driver_type, file}]

    function loadSqlText(name, sqlText) {
        CURRENT = { name, sqlText };
        CURRENT.units = parseBlock(sqlText, 'iw_sys_plant_units');
        CURRENT.settings = parseBlock(sqlText, 'iw_sys_plant_settings');
        $('seii-fileinfo').innerHTML =
            `<span class="ok">Loaded ${escapeHtml(name)}</span> ` +
            `<span class="small">(${sqlText.length} bytes, ${CURRENT.units ? CURRENT.units.rows.length : 0} unit rows)</span>`;
        renderForm();
        $('seii-form').style.display = '';
        $('seii-out').value = '';
        $('seii-status').textContent = '';
    }

    async function loadManifest() {
        const sel = $('seii-tpl');
        sel.innerHTML = '<option value="">— loading… —</option>';
        try {
            const txt = await gmFetch(MANIFEST_URL);
            const json = JSON.parse(txt);
            MANIFEST = (json && json.templates) || [];
            sel.innerHTML = '<option value="">— pick template —</option>' +
                MANIFEST.map((t, i) => `<option value="${i}">${escapeHtml(t.display_name)} (${escapeHtml(t.driver_type)})</option>`).join('');
            $('seii-fileinfo').innerHTML = `<span class="ok">${MANIFEST.length} templates available.</span> Pick one above, or load from disk.`;
        } catch (e) {
            sel.innerHTML = '<option value="">— manifest load failed —</option>';
            $('seii-fileinfo').innerHTML = `<span class="err">Manifest load failed: ${escapeHtml(e.message)}.</span> You can still load a .sql from disk below.`;
        }
    }

    $('seii-reload').onclick = (e) => { e.preventDefault(); loadManifest(); };

    $('seii-tpl').onchange = async () => {
        const idx = $('seii-tpl').value;
        if (idx === '') return;
        const t = MANIFEST[+idx]; if (!t) return;
        $('seii-fileinfo').textContent = 'Fetching ' + t.file + '…';
        try {
            const txt = await gmFetch(REPO_BASE + '/' + encodeURIComponent(t.file));
            loadSqlText(t.file, txt);
        } catch (e) {
            $('seii-fileinfo').innerHTML = `<span class="err">Fetch failed: ${escapeHtml(e.message)}</span>`;
        }
    };

    loadManifest();

    $('seii-file').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const fr = new FileReader();
        fr.onload = () => loadSqlText(f.name, fr.result);
        fr.readAsText(f);
    });

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
                } else if (key === 'comm_baudrate') {
                    const opts = BAUDRATE_OPTS.includes(cur) || !cur ? BAUDRATE_OPTS : [cur, ...BAUDRATE_OPTS];
                    html += `<select id="${id}">${opts.map(v => `<option value="${v}"${v === cur ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
                } else {
                    html += `<input type="text" id="${id}" value="${escapeHtml(cur)}">`;
                }
                const div = document.createElement('div');
                div.dataset.settingKey = key;
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
    function incLastNum(s) {
        return String(s).replace(/(\d+)(\D*)$/, (_, n, tail) => {
            const next = String(+n + 1).padStart(n.length, '0');
            return next + tail;
        });
    }
    $('seii-addunit').onclick = (e) => {
        e.preventDefault();
        const rows = $('seii-units').children;
        const last = rows[rows.length - 1];
        if (last) {
            addUnitRow({
                unit_id: incLastNum(last.querySelector('.seii-uid').value),
                unit_name: incLastNum(last.querySelector('.seii-uname').value),
                driver_addr: incLastNum(last.querySelector('.seii-uaddr').value),
                _raw: null,
            });
        } else {
            addUnitRow({ unit_id: '', unit_name: '', driver_addr: '', _raw: null });
        }
    };

    function addIpRow(ip) {
        const div = document.createElement('div');
        div.className = 'row';
        div.innerHTML = `<input class="seii-ip" placeholder="192.168.10.100" value="${escapeHtml(ip || '')}"><button class="seii-iprm" title="Remove">−</button>`;
        $('seii-ips').appendChild(div);
        div.querySelector('.seii-iprm').onclick = () => {
            if ($('seii-ips').children.length > 1) div.remove();
        };
    }
    $('seii-addip').onclick = (e) => { e.preventDefault(); addIpRow(''); };

    function syncTcpVisible() {
        const v = $('seii-set-mb_mode') ? $('seii-set-mb_mode').value : '0';
        const isTcp = v === '2';
        $('seii-tcpwrap').style.display = isTcp ? '' : 'none';
        for (const key of ['comm_baudrate', 'comm_parity']) {
            const wrap = document.querySelector(`#seii-settings [data-setting-key="${key}"]`);
            if (wrap) wrap.style.display = isTcp ? 'none' : '';
        }
    }

    // ---------- Generate output ----------
    function buildOutput() {
        if (!CURRENT) throw new Error('Load a .sql file first.');
        let out = CURRENT.sqlText;

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
        const isTcp = settingsValues.mb_mode === '2';
        const ips = [...document.querySelectorAll('.seii-ip')].map(i => i.value.trim()).filter(Boolean);
        const tcpServers = ips.map((ip, i) => `${i + 1};${ip};502;1000;2;1000`).join('\\r\\n') + (ips.length ? '\\r\\n' : '');

        // 1) Replace iw_sys_plant_units block
        if (CURRENT.units) {
            const cols = CURRENT.units.cols;
            const rebuilt = units.map(u => {
                const raw = u._raw || {};
                const vals = cols.map(col => {
                    if (col === 'row_date') return /NOW\(\)/i.test(raw[col] || '') ? raw[col] : "NOW()";
                    if (col === 'unit_id') return q(u.unit_id);
                    if (col === 'unit_name') return q(u.unit_name);
                    if (col === 'driver_addr' || col === 'driver_adr') return q(u.driver_addr);
                    return raw[col] != null && raw[col] !== '' ? raw[col] : "''";
                });
                return '(' + vals.join(', ') + ')';
            });
            const colsSql = cols.map(c => '`' + c + '`').join(', ');
            const block = `REPLACE INTO \`iw_sys_plant_units\` (${colsSql}) VALUES\n${rebuilt.join(',\n')};`;
            out = out.slice(0, CURRENT.units.start) + block + out.slice(CURRENT.units.end);
        }

        // 2) Patch settings (only the editable ones), and inject mb_tcp_servers if TCP
        const settingsBlock = parseBlock(out, 'iw_sys_plant_settings');
        if (settingsBlock) {
            const cols = settingsBlock.cols;
            const rows = settingsBlock.rows.map(r => ({ ...r }));
            for (const k of EDITABLE_SETTINGS) {
                const idx = rows.findIndex(x => unq(x.setting) === k);
                if (idx >= 0) rows[idx].value = q(settingsValues[k]);
            }
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
})();
