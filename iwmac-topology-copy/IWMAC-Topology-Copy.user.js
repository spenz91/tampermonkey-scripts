// ==UserScript==
// @name         IWMAC Topology Copy
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.5
// @description  Copy the IWMAC sys_tools topology to clipboard, or export to a real .xlsx with collapsible outline levels.
// @match        *://*.plants.iwmac.local:8080/secure/sys_tools/*
// @grant        GM_setClipboard
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
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

    function flash(captionId, msg, ok, durationMs) {
        const cap = document.getElementById(captionId);
        if (!cap) return;
        const orig = cap.dataset.origText || cap.textContent;
        cap.dataset.origText = orig;
        const origColor = cap.style.color;
        cap.textContent = msg;
        cap.style.color = ok ? '#2e7d32' : '#c62828';
        cap.style.fontWeight = 'bold';
        setTimeout(() => {
            cap.textContent = orig;
            cap.style.color = origColor;
            cap.style.fontWeight = '';
        }, durationMs || 1500);
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

    function xmlEsc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
        }[c]));
    }

    function colLetter(n) { // 1 -> A
        let s = '';
        while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
        return s;
    }

    function getJSZip() {
        // @require loads JSZip into the userscript sandbox; UMD may attach it to varying globals.
        try { if (typeof JSZip !== 'undefined' && JSZip) return JSZip; } catch (e) {}
        if (typeof globalThis !== 'undefined' && globalThis.JSZip) return globalThis.JSZip;
        if (typeof unsafeWindow !== 'undefined' && unsafeWindow.JSZip) return unsafeWindow.JSZip;
        if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
        return null;
    }

    // Real .xlsx with outlineLevel per row so Excel shows native +/- collapse buttons in the gutter.
    async function buildXlsx(rows) {
        const JSZipLib = getJSZip();
        if (!JSZipLib) throw new Error('JSZip not loaded (check @require)');

        const maxDepth = rows.reduce((m, r) => Math.max(m, r.depth), 0);

        const headers = ['Tree', 'Unit name', 'Owner', 'Status'];
        let sheetRows = '';

        // Header row (style s="1" = bold + grey)
        sheetRows += `<row r="1">` + headers.map((h, i) =>
            `<c r="${colLetter(i + 1)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xmlEsc(h)}</t></is></c>`
        ).join('') + `</row>`;

        rows.forEach((r, idx) => {
            const rowNum = idx + 2;
            const isGroup = !r.name && !r.owner && !r.status;
            const styleAttr = isGroup ? ' s="2"' : '';
            const outlineAttr = ` outlineLevel="${r.depth}"`;
            // Keep visible indentation inside the cell so the hierarchy still reads when expanded.
            const indentedTree = '    '.repeat(r.depth) + r.tree;
            const cells = [indentedTree, r.name, r.owner, r.status].map((v, i) =>
                `<c r="${colLetter(i + 1)}${rowNum}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`
            ).join('');
            sheetRows += `<row r="${rowNum}"${outlineAttr}>${cells}</row>`;
        });

        const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><outlinePr summaryBelow="0" summaryRight="0"/></sheetPr>
<sheetFormatPr defaultRowHeight="15" outlineLevelRow="${maxDepth}"/>
<cols>
<col min="1" max="1" width="36" customWidth="1"/>
<col min="2" max="2" width="32" customWidth="1"/>
<col min="3" max="3" width="14" customWidth="1"/>
<col min="4" max="4" width="10" customWidth="1"/>
</cols>
<sheetData>${sheetRows}</sheetData>
</worksheet>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEEEEE"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>`;

        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

        const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

        const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Topology" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

        const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

        const zip = new JSZipLib();
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rootRels);
        zip.file('xl/workbook.xml', workbookXml);
        zip.file('xl/_rels/workbook.xml.rels', workbookRels);
        zip.file('xl/styles.xml', stylesXml);
        zip.file('xl/worksheets/sheet1.xml', sheetXml);

        return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    async function onExport() {
        const cap = EXPORT_BTN_ID + '-cap';
        expandAll();
        await new Promise(r => setTimeout(r, 350));
        const rows = scrapeRows();
        if (!rows.length) { flash(cap, 'No rows found', false); return; }
        try {
            const blob = await buildXlsx(rows);
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().slice(0, 10);
            const a = document.createElement('a');
            a.href = url;
            a.download = `topology_${getPlantLabel()}_${today}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            flash(cap, `Exported ${rows.length} rows`, true);
        } catch (e) {
            console.error('[IWMAC Topology] Export failed', e);
            flash(cap, 'Export failed: ' + (e && e.message ? e.message : e), false, 5000);
        }
    }

    // Toolbar is rebuilt by w2ui when navigating between sidebar nodes — keep retrying.
    function ensureButton() {
        makeButton();
    }
    setInterval(ensureButton, 750);
    if (document.body) ensureButton();
    else window.addEventListener('DOMContentLoaded', ensureButton);
})();
