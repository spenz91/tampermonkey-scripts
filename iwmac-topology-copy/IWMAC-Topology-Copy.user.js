// ==UserScript==
// @name         IWMAC Topology Copy
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.3
// @description  Adds a button to copy the entire IWMAC sys_tools topology (fully expanded) to the clipboard as TSV.
// @match        *://*.plants.iwmac.local:8080/secure/sys_tools/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js
// ==/UserScript==

(function () {
    'use strict';

    const COPY_BTN_ID   = 'iwmac-topo-copy-btn';
    const EXPORT_BTN_ID = 'iwmac-topo-export-btn';

    function buildToolbarButton(tdId, captionId, iconChar, captionText, onClick) {
        const td = document.createElement('td');
        td.id = tdId;
        td.valign = 'middle';
        td.style.cssText = 'padding-right:8px;';
        td.innerHTML = `
            <div>
                <table cellpadding="0" cellspacing="0" class="w2ui-button">
                    <tbody><tr><td>
                        <table cellpadding="1" cellspacing="0"><tbody><tr>
                            <td><div class="w2ui-tb-image"><span style="display:inline-block;font-size:14px;line-height:14px;">${iconChar}</span></div></td>
                            <td id="${captionId}" class="w2ui-tb-text w2ui-tb-caption" nowrap="nowrap">${captionText}</td>
                        </tr></tbody></table>
                    </td></tr></tbody>
                </table>
            </div>`;
        const btn = td.querySelector('table.w2ui-button');
        btn.addEventListener('mouseenter', () => btn.classList.add('over'));
        btn.addEventListener('mouseleave', () => btn.classList.remove('over', 'down'));
        btn.addEventListener('mousedown',  () => btn.classList.add('down'));
        btn.addEventListener('mouseup',    () => btn.classList.remove('down'));
        btn.addEventListener('click', onClick);
        return td;
    }

    // Build w2ui-style toolbar buttons and inject them into the topology toolbar's right-aligned cell.
    function makeButton() {
        const host = document.getElementById('tb_grid_topology_toolbar_right');
        if (!host) return;

        if (!document.getElementById(COPY_BTN_ID)) {
            const copyTd = buildToolbarButton(
                COPY_BTN_ID, COPY_BTN_ID + '-cap',
                '&#128203;', 'Copy Topology', onCopy
            );
            host.parentNode.insertBefore(copyTd, host);
        }
        if (!document.getElementById(EXPORT_BTN_ID)) {
            const expTd = buildToolbarButton(
                EXPORT_BTN_ID, EXPORT_BTN_ID + '-cap',
                '&#128190;', 'Export to Excel', onExport
            );
            host.parentNode.insertBefore(expTd, host);
        }
    }

    function flash(captionId, msg, ok) {
        const cap = document.getElementById(captionId);
        if (!cap) return;
        const orig = cap.textContent;
        const origColor = cap.style.color;
        cap.textContent = msg;
        cap.style.color = ok ? '#2e7d32' : '#c62828';
        cap.style.fontWeight = 'bold';
        setTimeout(() => {
            cap.textContent = orig;
            cap.style.color = origColor;
            cap.style.fontWeight = '';
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

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function buildHTML(rows) {
        const tableStyle = 'border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;';
        const thStyle = 'border:1px solid #999;padding:4px 8px;background:#eee;text-align:left;';
        const tdStyle = 'border:1px solid #ccc;padding:3px 8px;';
        const indent = '    '; // non-breaking spaces survive HTML pasting
        let html = `<table style="${tableStyle}"><thead><tr>` +
            `<th style="${thStyle}">Tree</th>` +
            `<th style="${thStyle}">Unit name</th>` +
            `<th style="${thStyle}">Owner</th>` +
            `<th style="${thStyle}">Status</th>` +
            `</tr></thead><tbody>`;
        for (const r of rows) {
            const isGroup = !r.name && !r.owner && !r.status;
            const rowBg = isGroup ? 'background:#f5f5f5;font-weight:bold;' : '';
            const treeCell = indent.repeat(r.depth) + esc(r.tree);
            html += `<tr style="${rowBg}">` +
                `<td style="${tdStyle}">${treeCell}</td>` +
                `<td style="${tdStyle}">${esc(r.name)}</td>` +
                `<td style="${tdStyle}">${esc(r.owner)}</td>` +
                `<td style="${tdStyle}">${esc(r.status)}</td>` +
                `</tr>`;
        }
        html += '</tbody></table>';
        return html;
    }

    async function writeRichClipboard(html, tsv) {
        // Preferred: write both HTML (for Zendesk / Gmail / Word) and plain text (for Excel / Notepad).
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            try {
                await navigator.clipboard.write([new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([tsv], { type: 'text/plain' })
                })]);
                return true;
            } catch (e) { /* fall through */ }
        }
        // Fallback: synthetic copy event with both formats.
        try {
            const handler = (e) => {
                e.preventDefault();
                e.clipboardData.setData('text/html', html);
                e.clipboardData.setData('text/plain', tsv);
            };
            document.addEventListener('copy', handler, { once: true });
            const ok = document.execCommand('copy');
            return ok;
        } catch (e) { return false; }
    }

    async function onCopy() {
        const cap = COPY_BTN_ID + '-cap';
        expandAll();
        await new Promise(r => setTimeout(r, 350));
        const rows = scrapeRows();
        if (!rows.length) { flash(cap, 'No rows found', false); return; }
        const tsv = buildTSV(rows);
        const html = buildHTML(rows);
        try {
            const ok = await writeRichClipboard(html, tsv);
            if (!ok) {
                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(html, { type: 'text', mimetype: 'text/html' });
                } else {
                    await navigator.clipboard.writeText(tsv);
                }
            }
            flash(cap, `Copied ${rows.length} rows`, true);
        } catch (e) {
            console.error('Clipboard write failed', e);
            flash(cap, 'Copy failed', false);
        }
    }

    function getPlantLabel() {
        // Header shows e.g. "6176 - Extra Moi"
        const el = document.querySelector('.plant_info');
        const raw = (el && el.textContent || '').trim();
        return raw.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_') || 'topology';
    }

    function buildXlsHtmlDocument(rows) {
        // Excel happily opens an HTML document saved with .xls — preserves headers, borders, indentation.
        const tableHtml = buildHTML(rows);
        return '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
               'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
               'xmlns="http://www.w3.org/TR/REC-html40">' +
               '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml>' +
               '<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
               '<x:Name>Topology</x:Name><x:WorksheetOptions><x:DisplayGridlines/>' +
               '</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>' +
               '</xml><![endif]--></head><body>' + tableHtml + '</body></html>';
    }

    function onExport() {
        const cap = EXPORT_BTN_ID + '-cap';
        expandAll();
        setTimeout(() => {
            const rows = scrapeRows();
            if (!rows.length) { flash(cap, 'No rows found', false); return; }
            try {
                const doc = buildXlsHtmlDocument(rows);
                const blob = new Blob(['﻿', doc], { type: 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob);
                const today = new Date().toISOString().slice(0, 10);
                const a = document.createElement('a');
                a.href = url;
                a.download = `topology_${getPlantLabel()}_${today}.xls`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                flash(cap, `Exported ${rows.length} rows`, true);
            } catch (e) {
                console.error('Export failed', e);
                flash(cap, 'Export failed', false);
            }
        }, 350);
    }

    // Toolbar is rebuilt by w2ui when navigating between sidebar nodes — keep retrying.
    function ensureButton() {
        makeButton();
    }
    setInterval(ensureButton, 750);
    if (document.body) ensureButton();
    else window.addEventListener('DOMContentLoaded', ensureButton);
})();
