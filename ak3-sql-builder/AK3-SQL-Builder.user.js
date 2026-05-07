// ==UserScript==
// @name         AK3 SQL Equipment Builder
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.0
// @description  Floating panel on phpMyAdmin to generate the SQL for adding a new equipment unit (iw_sys_plant_units + iw_sys_plant_settings), incl. multi-IP Modbus-TCP.
// @author       spenz91
// @match        *://*.plants.iwmac.local:*/secure/phpMyAdmin/*
// @run-at       document-end
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/ak3-sql-builder/AK3-SQL-Builder.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/ak3-sql-builder/AK3-SQL-Builder.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window) return;

    const EQUIPMENT = [
        { order_no: 'exhausto_OJ_v610', driver_type: 'OJEXHAUST', regulator_type: 'OJ', grp_name: 'exhausto_OJ_v610' },
    ];

    const PARITY = [
        { v: '0', t: 'N (None)' },
        { v: '1', t: 'O (Odd)' },
        { v: '2', t: 'E (Even)' },
        { v: '3', t: 'M (Mark)' },
        { v: '4', t: 'S (Space)' },
    ];

    const sqlEsc = (s) => String(s).replace(/'/g, "''");
    const pad = (n) => String(n).padStart(2, '0');
    const nowStamp = () => {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const css = `
    #ak3sb-panel { position: fixed; top: 12px; right: 12px; width: 380px; z-index: 2147483647;
        background: #fff; border: 1px solid #888; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,.25);
        font: 12px/1.4 -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #222; }
    #ak3sb-panel .hdr { display:flex; align-items:center; justify-content:space-between;
        padding: 7px 10px; background: #2b6cb0; color: #fff; border-radius: 6px 6px 0 0; cursor: move; user-select: none; }
    #ak3sb-panel .hdr b { font-size: 13px; }
    #ak3sb-panel .hdr button { background: transparent; color:#fff; border: 1px solid rgba(255,255,255,.6);
        border-radius: 3px; padding: 1px 7px; cursor: pointer; }
    #ak3sb-panel .body { padding: 10px; max-height: 75vh; overflow-y: auto; }
    #ak3sb-panel.collapsed .body { display: none; }
    #ak3sb-panel label { display:block; font-weight: 600; margin: 6px 0 2px; }
    #ak3sb-panel input[type=text], #ak3sb-panel select, #ak3sb-panel textarea {
        width: 100%; box-sizing: border-box; padding: 4px 6px; font: 12px monospace;
        border: 1px solid #bbb; border-radius: 3px; }
    #ak3sb-panel textarea { font-family: Consolas, monospace; font-size: 11px; min-height: 160px; resize: vertical; white-space: pre; }
    #ak3sb-panel .ip-row { display:flex; gap:4px; margin-bottom: 3px; }
    #ak3sb-panel .ip-row input { flex: 1; }
    #ak3sb-panel .ip-row button { width: 26px; }
    #ak3sb-panel .actions { display:flex; gap:6px; margin-top: 10px; }
    #ak3sb-panel .actions button { flex:1; padding: 5px; cursor: pointer; border: 1px solid #888; border-radius: 3px; background: #f0f0f0; }
    #ak3sb-panel .actions button.primary { background: #2b6cb0; color: #fff; border-color: #2b6cb0; }
    #ak3sb-panel .copied { color: #2f855a; font-weight: 600; }
    #ak3sb-toggle { position: fixed; top: 12px; right: 12px; z-index: 2147483647;
        background: #2b6cb0; color: #fff; border: 0; border-radius: 4px; padding: 4px 9px; cursor: pointer;
        font: 12px -apple-system, Segoe UI, Roboto, Arial, sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,.25); display: none; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.documentElement.appendChild(styleEl);

    const panel = document.createElement('div');
    panel.id = 'ak3sb-panel';
    panel.innerHTML = `
        <div class="hdr">
            <b>AK3 SQL Equipment Builder</b>
            <button id="ak3sb-hide" title="Hide">×</button>
        </div>
        <div class="body">
            <label>Equipment type</label>
            <select id="ak3sb-eq">
                ${EQUIPMENT.map(e => `<option value="${e.order_no}">${e.order_no} (${e.driver_type})</option>`).join('')}
            </select>

            <label>unit_id</label>
            <input type="text" id="ak3sb-unitid" value="V01">

            <label>unit_name</label>
            <input type="text" id="ak3sb-unitname" value="360.001Ventilasjon">

            <label>driver_addr</label>
            <input type="text" id="ak3sb-driveraddr" value="1_1">

            <label>mb_mode</label>
            <select id="ak3sb-mbmode">
                <option value="0">0 — RTU</option>
                <option value="2" selected>2 — TCP</option>
            </select>

            <label>comm_baudrate</label>
            <input type="text" id="ak3sb-baud" value="9600">

            <label>comm_parity</label>
            <select id="ak3sb-parity">
                ${PARITY.map(p => `<option value="${p.v}">${p.v} — ${p.t}</option>`).join('')}
            </select>

            <div id="ak3sb-tcp-wrap">
                <label>mb_tcp_servers (one IP per row)</label>
                <div id="ak3sb-ips"></div>
                <button id="ak3sb-addip" style="margin-top:4px;padding:3px 8px;cursor:pointer;">+ Add IP</button>
            </div>

            <div class="actions">
                <button id="ak3sb-gen" class="primary">Generate SQL</button>
                <button id="ak3sb-copy">Copy</button>
            </div>
            <div id="ak3sb-status" style="margin-top:6px;min-height:14px;"></div>

            <label>SQL output</label>
            <textarea id="ak3sb-out" readonly placeholder="Click Generate SQL…"></textarea>
        </div>
    `;
    document.documentElement.appendChild(panel);

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ak3sb-toggle';
    toggleBtn.textContent = 'AK3 SQL';
    document.documentElement.appendChild(toggleBtn);

    const $ = (id) => document.getElementById(id);

    $('ak3sb-hide').addEventListener('click', () => {
        panel.style.display = 'none';
        toggleBtn.style.display = 'block';
    });
    toggleBtn.addEventListener('click', () => {
        panel.style.display = '';
        toggleBtn.style.display = 'none';
    });

    const ipsEl = $('ak3sb-ips');
    const addIpRow = (ip = '') => {
        const row = document.createElement('div');
        row.className = 'ip-row';
        row.innerHTML = `<input type="text" class="ak3sb-ip" placeholder="192.168.10.100" value="${ip}"><button class="ak3sb-rmip" title="Remove">−</button>`;
        ipsEl.appendChild(row);
        row.querySelector('.ak3sb-rmip').addEventListener('click', () => {
            if (ipsEl.children.length > 1) row.remove();
        });
    };
    addIpRow('192.168.10.100');
    $('ak3sb-addip').addEventListener('click', (e) => { e.preventDefault(); addIpRow(''); });

    const mbModeEl = $('ak3sb-mbmode');
    const tcpWrap = $('ak3sb-tcp-wrap');
    const syncTcpVisible = () => { tcpWrap.style.display = mbModeEl.value === '2' ? '' : 'none'; };
    mbModeEl.addEventListener('change', syncTcpVisible);
    syncTcpVisible();

    const buildSql = () => {
        const eq = EQUIPMENT.find(e => e.order_no === $('ak3sb-eq').value);
        const ts = nowStamp();
        const unitId = sqlEsc($('ak3sb-unitid').value.trim());
        const unitName = sqlEsc($('ak3sb-unitname').value.trim());
        const driverAddr = sqlEsc($('ak3sb-driveraddr').value.trim());
        const mbMode = $('ak3sb-mbmode').value;
        const baud = sqlEsc($('ak3sb-baud').value.trim());
        const parity = $('ak3sb-parity').value;
        const owner = eq.driver_type;

        const ips = [...document.querySelectorAll('.ak3sb-ip')]
            .map(i => i.value.trim()).filter(Boolean);
        const tcpServers = ips.map((ip, idx) => `${idx + 1};${ip};502;1000;2;1000`).join('\\r\\n') + (ips.length ? '\\r\\n' : '');

        const settings = [
            { k: 'mb_mode', v: mbMode },
            { k: 'comm_baudrate', v: baud },
            { k: 'comm_parity', v: parity },
        ];
        if (mbMode === '2') {
            settings.push({ k: 'mb_tcp_servers', v: tcpServers });
        }

        const settingsValues = settings
            .map(s => `('${ts}','${sqlEsc(s.k)}','${sqlEsc(owner)}','${sqlEsc(s.v)}','','','')`)
            .join(',\n');

        return [
            `-- Generated by AK3 SQL Equipment Builder at ${ts}`,
            ``,
            `REPLACE INTO \`iw_sys_plant_units\` (\`row_date\`,\`active\`,\`blockout\`,\`unit_id\`,\`unit_name\`,\`grp_name\`,\`driver_type\`,\`driver_addr\`,\`regulator_type\`,\`order_no\`,\`view_order\`,\`driver_adr_extra\`,\`unit_extra\`) VALUES`,
            `('${ts}','1','0','${unitId}','${unitName}','${sqlEsc(eq.grp_name)}','${sqlEsc(eq.driver_type)}','${driverAddr}','${sqlEsc(eq.regulator_type)}','${sqlEsc(eq.order_no)}',0,'','');`,
            ``,
            `REPLACE INTO \`iw_sys_plant_settings\` (\`row_date\`,\`setting\`,\`owner\`,\`value\`,\`eng_unit\`,\`help_text\`,\`help_link\`) VALUES`,
            settingsValues + ';',
        ].join('\n');
    };

    $('ak3sb-gen').addEventListener('click', () => {
        const sql = buildSql();
        $('ak3sb-out').value = sql;
        $('ak3sb-status').innerHTML = '<span class="copied">SQL generated.</span>';
    });

    $('ak3sb-copy').addEventListener('click', () => {
        let sql = $('ak3sb-out').value;
        if (!sql) { sql = buildSql(); $('ak3sb-out').value = sql; }
        try {
            if (typeof GM_setClipboard === 'function') GM_setClipboard(sql);
            else navigator.clipboard.writeText(sql);
            $('ak3sb-status').innerHTML = '<span class="copied">Copied to clipboard.</span>';
        } catch (e) {
            $('ak3sb-status').textContent = 'Copy failed — select the textarea and copy manually.';
        }
    });

    (function makeDraggable() {
        const hdr = panel.querySelector('.hdr');
        let sx, sy, ox, oy, dragging = false;
        hdr.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            dragging = true;
            const r = panel.getBoundingClientRect();
            sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            panel.style.left = (ox + e.clientX - sx) + 'px';
            panel.style.top = (oy + e.clientY - sy) + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => { dragging = false; });
    })();
})();
