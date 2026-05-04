// ==UserScript==
// @name         IWMAC Topology Copy
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.0
// @description  Adds a button to copy the entire IWMAC sys_tools topology (fully expanded) to the clipboard as TSV.
// @match        *://*.plants.iwmac.local:8080/secure/sys_tools/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js
// ==/UserScript==

(function () {
    'use strict';

    const BTN_ID = 'iwmac-topo-copy-btn';

    function makeButton() {
        if (document.getElementById(BTN_ID)) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = 'Copy Topology';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '6px',
            right: '12px',
            zIndex: 999999,
            padding: '6px 12px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            font: '13px sans-serif',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
        });
        btn.addEventListener('click', onCopy);
        document.body.appendChild(btn);
    }

    function flash(msg, ok) {
        const btn = document.getElementById(BTN_ID);
        if (!btn) return;
        const orig = btn.textContent;
        const origBg = btn.style.background;
        btn.textContent = msg;
        btn.style.background = ok ? '#2e7d32' : '#c62828';
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.background = origBg;
        }, 1500);
    }

    function expandAll() {
        // Use the grid's own toolbar action so virtualized rows render.
        try {
            const w2 = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).w2ui;
            if (w2 && w2.grid_topology_toolbar && typeof w2.grid_topology_toolbar.click === 'function') {
                w2.grid_topology_toolbar.click('open_all');
                return true;
            }
        } catch (e) {}
        const fallback = document.querySelector('#tb_grid_topology_toolbar_item_open_all table.w2ui-button');
        if (fallback) { fallback.click(); return true; }
        return false;
    }

    function scrapeRows() {
        const rows = document.querySelectorAll('#grid_grid_topology_records tr.w2ui-record');
        const out = [];
        rows.forEach(tr => {
            const treeCellDiv = tr.querySelector('td[col="0"] > div');
            if (!treeCellDiv) return;
            const spans = treeCellDiv.querySelectorAll('span.w2ui-show-children').length;
            const depth = Math.max(0, spans - 1);
            const tree = treeCellDiv.getAttribute('title') || '';
            const name = tr.querySelector('td[col="1"] > div')?.getAttribute('title') || '';
            const owner = tr.querySelector('td[col="2"] > div')?.getAttribute('title') || '';
            const status = tr.querySelector('td[col="3"] > div')?.textContent.trim() || '';
            out.push({ depth, tree, name, owner, status });
        });
        return out;
    }

    function buildTSV(rows) {
        const lines = ['Tree\tUnit name\tOwner\tStatus'];
        for (const r of rows) {
            const indented = '  '.repeat(r.depth) + r.tree;
            lines.push([indented, r.name, r.owner, r.status].join('\t'));
        }
        return lines.join('\n');
    }

    async function onCopy() {
        expandAll();
        // Wait briefly for the grid to render expanded rows.
        await new Promise(r => setTimeout(r, 350));
        const rows = scrapeRows();
        if (!rows.length) { flash('No rows found', false); return; }
        const tsv = buildTSV(rows);
        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(tsv, { type: 'text', mimetype: 'text/plain' });
            } else {
                await navigator.clipboard.writeText(tsv);
            }
            flash(`Copied ${rows.length} rows`, true);
        } catch (e) {
            console.error('Clipboard write failed', e);
            flash('Copy failed', false);
        }
    }

    // Topology view lives inside the sys_tools page; just always show the button.
    if (document.body) makeButton();
    else window.addEventListener('DOMContentLoaded', makeButton);
})();
