// ==UserScript==
// @name         Oneflow + HubSpot Copy Products
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      2.2.5
// @description  Adds a copy button on Oneflow (copies product description + quantity from the tilbud PDF) and on HubSpot deal pages (copies the Line items card) as rich HTML with bold headers + bullet list.
// @author       spenz91
// @match        https://app.oneflow.com/*
// @match        https://*.oneflow.com/*
// @match        https://app.hubspot.com/*
// @match        https://app-eu1.hubspot.com/*
// @match        https://*.hubspot.com/*
// @match        https://*.rocketlane.com/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Shared helpers
    // ---------------------------------------------------------------------

    function escapeHtml(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    const COPY_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect><path d="M16 8V5.5C16 4.67157 15.3284 4 14.5 4H5.5C4.67157 4 4 4.67157 4 5.5V14.5C4 15.3284 4.67157 16 5.5 16H8" stroke="currentColor" stroke-width="1.5"></path></svg>';
    const CHECK_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12.5L10 17.5L19 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    const ERROR_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';

    function svgAt(markup, size) {
        if (!size) return markup;
        return markup
            .replace(/height="[^"]*"/, 'height="' + size + '"')
            .replace(/width="[^"]*"/, 'width="' + size + '"');
    }

    async function copyRich(html, plain) {
        if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([plain], { type: 'text/plain' }),
                    }),
                ]);
                return true;
            } catch (e) {
                // fall through to execCommand path
            }
        }

        const holder = document.createElement('div');
        holder.contentEditable = 'true';
        holder.innerHTML = html;
        Object.assign(holder.style, {
            position: 'fixed',
            left: '-9999px',
            top: '0',
            opacity: '0',
        });
        document.body.appendChild(holder);
        const range = document.createRange();
        range.selectNodeContents(holder);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) {
            ok = false;
        }
        sel.removeAllRanges();
        document.body.removeChild(holder);

        if (!ok && typeof GM_setClipboard === 'function') {
            GM_setClipboard(plain, 'text');
            ok = true;
        }
        return ok;
    }

    // ---------------------------------------------------------------------
    // Oneflow
    // ---------------------------------------------------------------------

    const ONEFLOW = (function () {
        const BTN_ID = 'of-copy-products-btn';

        function parsePct(style, key) {
            const m = (style || '').match(new RegExp(key + ':\\s*([\\d.]+)%'));
            return m ? parseFloat(m[1]) : null;
        }

        function buildRows() {
            const spans = document.querySelectorAll(
                '.react-pdf__Page__textContent span[role="presentation"]'
            );
            if (!spans.length) return [];

            const byTop = new Map();
            for (const s of spans) {
                const style = s.getAttribute('style');
                const top = parsePct(style, 'top');
                const left = parsePct(style, 'left');
                if (top == null || left == null) continue;
                const key = (Math.round(top * 4) / 4).toFixed(2);
                if (!byTop.has(key)) byTop.set(key, []);
                byTop.get(key).push({ left, top, text: s.textContent });
            }

            return [...byTop.entries()]
                .map(([k, items]) => ({
                    top: parseFloat(k),
                    items: items.sort((a, b) => a.left - b.left),
                }))
                .sort((a, b) => a.top - b.top);
        }

        function extractItems() {
            const rows = buildRows();
            if (!rows.length) return [];

            const items = [];
            let started = false;

            for (const row of rows) {
                const rowText = row.items.map(i => i.text).join('').trim();
                if (!started) {
                    if (/Beskrivelse/i.test(rowText)) started = true;
                    continue;
                }
                if (/Installasjonkostnader|Listepris|Sum eks mva/i.test(rowText)) break;

                const desc = row.items
                    .filter(i => i.left < 45)
                    .map(i => i.text)
                    .join('')
                    .replace(/\s+/g, ' ')
                    .trim();

                const antallItem = row.items.find(
                    i => i.left > 74 && i.left < 84 && /\d+\s*pcs/i.test(i.text)
                );
                const antall = antallItem ? antallItem.text.trim() : '';

                if (!desc && !antall) continue;

                const isHeader = /^IWMAC\s+(Product|Modul):/i.test(desc);

                if (!desc && antall && items.length) {
                    const last = items[items.length - 1];
                    if (last.type === 'bullet') last.antall = antall;
                } else if (isHeader) {
                    items.push({ type: 'header', desc });
                } else if (desc) {
                    // Sub-item row (e.g. "- Maskinbilde") that happens to share its
                    // visual line with the parent's quantity: re-attribute the antall
                    // to the most recent parent bullet above.
                    const isSubItem = /^-\s/.test(desc);
                    if (
                        isSubItem &&
                        antall &&
                        items.length &&
                        items[items.length - 1].type === 'bullet' &&
                        !/^-\s/.test(items[items.length - 1].desc) &&
                        !items[items.length - 1].antall
                    ) {
                        items[items.length - 1].antall = antall;
                        items.push({ type: 'bullet', desc, antall: '' });
                    } else {
                        items.push({ type: 'bullet', desc, antall });
                    }
                }
            }

            // Merge lowercase continuation rows ("external sensor 2m") into the
            // previous bullet, inserting before any existing " | N pcs".
            for (let i = items.length - 1; i > 0; i--) {
                const cur = items[i];
                const prev = items[i - 1];
                if (
                    cur.type === 'bullet' &&
                    prev.type === 'bullet' &&
                    !cur.antall &&
                    /^[a-zæøå]/.test(cur.desc)
                ) {
                    prev.desc = prev.desc + ' ' + cur.desc;
                    items.splice(i, 1);
                }
            }

            return items;
        }

        function itemsToHtml(items) {
            let html = '<p><strong>Oneflow document info:</strong></p>';
            let inList = false;
            const openList = () => {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
            };
            const closeList = () => {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
            };

            for (const it of items) {
                if (it.type === 'header') {
                    closeList();
                    html += '<p><strong>' + escapeHtml(it.desc) + '</strong></p>';
                } else {
                    openList();
                    const tail = it.antall
                        ? ' &mdash; <strong>' + escapeHtml(it.antall) + '</strong>'
                        : '';
                    html += '<li>' + escapeHtml(it.desc) + tail + '</li>';
                }
            }
            closeList();
            return html;
        }

        function itemsToPlain(items) {
            const body = items
                .map(it => {
                    if (it.type === 'header') return it.desc;
                    return '• ' + it.desc + (it.antall ? ' — ' + it.antall : '');
                })
                .join('\n');
            return 'Oneflow document info:\n' + body;
        }

        function flashButton(btn, ok) {
            btn.innerHTML = ok ? CHECK_SVG : ERROR_SVG;
            btn.style.color = ok ? '#0a7d3b' : '#c0392b';
            setTimeout(() => {
                btn.innerHTML = COPY_SVG;
                btn.style.color = '';
            }, 1500);
        }

        function buildButton(referenceTab) {
            const btn = document.createElement('button');
            btn.id = BTN_ID;
            btn.type = 'button';
            btn.title = 'Copy products (description + quantity)';
            btn.setAttribute('aria-label', 'Copy products');
            if (referenceTab && referenceTab.className) {
                btn.className = referenceTab.className.replace(/_ActiveTabTrigger[^ ]*/g, '').trim();
            }
            btn.innerHTML = COPY_SVG;
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', async () => {
                const items = extractItems();
                if (!items.length) {
                    flashButton(btn, false);
                    return;
                }
                const html = itemsToHtml(items);
                const plain = itemsToPlain(items);
                const ok = await copyRich(html, plain);
                flashButton(btn, ok);
            });
            return btn;
        }

        function injectButton() {
            if (document.getElementById(BTN_ID)) return;
            const tabs = document.querySelector('[role="tablist"][aria-orientation="vertical"]');
            if (!tabs) return;
            const referenceTab = tabs.querySelector('button[role="tab"]');
            tabs.appendChild(buildButton(referenceTab));
        }

        return { injectButton };
    })();

    // ---------------------------------------------------------------------
    // HubSpot
    // ---------------------------------------------------------------------

    const HUBSPOT = (function () {
        const BTN_ID = 'hs-copy-line-items-btn';

        function findLineItemsCard() {
            const titles = document.querySelectorAll('span[data-selenium-test="crm-card-title"]');
            for (const t of titles) {
                if (!/line items/i.test(t.textContent || '')) continue;
                let n = t;
                while (n && n !== document.body) {
                    if (n.querySelector && n.querySelector('[data-test-id="line-items-card-line-item"]')) {
                        return n;
                    }
                    n = n.parentElement;
                }
                return t.closest('[class*="ExpandableWrapper"]') || t.parentElement;
            }
            return null;
        }

        function extractItems(card) {
            const rows = card.querySelectorAll('[data-test-id="line-items-card-line-item"]');
            const items = [];
            for (const row of rows) {
                const nameNode =
                    row.querySelector(
                        '[data-test-id="line-items-card-line-item-name-quantity"] .TruncateString__TruncateStringInner-gODLZE span'
                    ) ||
                    row.querySelector(
                        '[data-test-id="line-items-card-line-item-name-quantity"] p span > span'
                    );
                const qtyNode = row.querySelector('[data-test-id="line-items-card-line-item-quantity"]');

                const desc = (nameNode ? nameNode.textContent : '').replace(/\s+/g, ' ').trim();
                const qty = qtyNode ? (qtyNode.textContent || '').replace(/\s+/g, '').trim() : '';

                if (!desc && !qty) continue;
                items.push({ desc, qty });
            }
            return items;
        }

        function itemsToHtml(items) {
            let html = '<p><strong>HubSpot line items:</strong></p><ul>';
            for (const it of items) {
                const tail = it.qty
                    ? ' &mdash; <strong>' + escapeHtml(it.qty) + '</strong>'
                    : '';
                html += '<li>' + escapeHtml(it.desc) + tail + '</li>';
            }
            html += '</ul>';
            return html;
        }

        function itemsToPlain(items) {
            const body = items
                .map(it => '• ' + it.desc + (it.qty ? ' — ' + it.qty : ''))
                .join('\n');
            return 'HubSpot line items:\n' + body;
        }

        function renderButtonContent(btn, state) {
            let svg = svgAt(COPY_SVG, '16');
            let label = 'Copy';
            if (state === 'ok') { svg = svgAt(CHECK_SVG, '16'); label = 'Copied'; }
            else if (state === 'err') { svg = svgAt(ERROR_SVG, '16'); label = 'Failed'; }
            btn.innerHTML =
                '<span style="display:inline-flex;align-items:center;gap:4px;">' +
                svg + '<span>' + label + '</span></span>';
        }

        function flashButton(btn, ok) {
            renderButtonContent(btn, ok ? 'ok' : 'err');
            btn.style.color = ok ? '#0a7d3b' : '#c0392b';
            setTimeout(() => {
                renderButtonContent(btn, 'idle');
                btn.style.color = '';
            }, 1500);
        }

        function buildButton(referenceLink, card) {
            const btn = document.createElement('button');
            btn.id = BTN_ID;
            btn.type = 'button';
            btn.title = 'Copy line items (description + quantity)';
            btn.setAttribute('aria-label', 'Copy line items');
            if (referenceLink && referenceLink.className) {
                btn.className = referenceLink.className;
            }
            Object.assign(btn.style, {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 8px',
                marginRight: '4px',
                font: 'inherit',
            });
            renderButtonContent(btn, 'idle');
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const items = extractItems(card);
                if (!items.length) {
                    flashButton(btn, false);
                    return;
                }
                const html = itemsToHtml(items);
                const plain = itemsToPlain(items);
                const ok = await copyRich(html, plain);
                flashButton(btn, ok);
            });
            return btn;
        }

        function removeStaleButton() {
            const existing = document.getElementById(BTN_ID);
            if (!existing) return;
            const card = existing.closest('[class*="ExpandableWrapper"]');
            if (!card || !card.querySelector('span[data-selenium-test="crm-card-title"]')) {
                existing.remove();
            }
        }

        function injectButton() {
            removeStaleButton();
            if (document.getElementById(BTN_ID)) return;
            const card = findLineItemsCard();
            if (!card) return;

            const actions = card.querySelector('span[data-selenium-test="crm-card-actions"]');
            if (!actions) return;

            const editLink = actions.querySelector('a[data-test-id^="line-items-card-action"]');
            const flexContainer = editLink ? editLink.parentElement : null;

            const btn = buildButton(editLink, card);

            if (flexContainer && editLink) {
                flexContainer.insertBefore(btn, editLink);
            } else {
                actions.insertBefore(btn, actions.firstChild);
            }
        }

        return { injectButton };
    })();

    // ---------------------------------------------------------------------
    // Rocketlane: make the ag-grid cell-editor popup bigger and resizable
    // ---------------------------------------------------------------------

    const ROCKETLANE = (function () {
        const STYLE_ID = 'rl-popup-editor-resize-style';
        const TOOLTIP_ID = 'rl-custom-cell-tooltip';
        const DEFAULT_W = 640;
        const DEFAULT_H = 420;
        const TIP_MAX_W = 640;
        const TIP_MAX_H = 420;

        function injectStyle() {
            if (document.getElementById(STYLE_ID)) return;
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                /* hide default dark tooltips (ag-grid + other libs) */
                .ag-tooltip,
                .ag-tooltip-custom,
                [role="tooltip"]:not(#${TOOLTIP_ID}),
                [class*="Tooltip__"]:not(#${TOOLTIP_ID}),
                [class*="tooltip_"][class*="dark"],
                [class*="ant-tooltip"],
                [class*="rc-tooltip"] {
                    display: none !important;
                }
                /* floating light-blue outline anchored over the hovered cell */
                #rl-hover-focus-box {
                    position: fixed;
                    pointer-events: none;
                    border: 2px solid #60a5fa;
                    background: rgba(96, 165, 250, 0.08);
                    border-radius: 3px;
                    box-sizing: border-box;
                    z-index: 2147483646;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 120ms ease, left 80ms ease, top 80ms ease,
                                width 80ms ease, height 80ms ease;
                }
                #rl-hover-focus-box.is-visible {
                    opacity: 1;
                    visibility: visible;
                }
                /* custom hover tooltip matching the popup editor style */
                #${TOOLTIP_ID} {
                    position: fixed;
                    z-index: 2147483647;
                    background: #fff;
                    color: #1a1a1a;
                    border-radius: 6px;
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
                    padding: 12px 16px;
                    max-width: ${TIP_MAX_W}px;
                    max-height: ${TIP_MAX_H}px;
                    overflow: auto;
                    font-size: 13px;
                    line-height: 1.45;
                    box-sizing: border-box;
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transition: opacity 140ms ease, visibility 140ms;
                }
                #${TOOLTIP_ID}.is-visible {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                }
                #${TOOLTIP_ID} p { margin: 0 0 6px; }
                #${TOOLTIP_ID} p:last-child { margin-bottom: 0; }
                #${TOOLTIP_ID} ul,
                #${TOOLTIP_ID} ol { margin: 4px 0 6px; padding-left: 22px; }
                #${TOOLTIP_ID} li { margin: 2px 0; }
                .ag-popup-editor [data-field-type="MultiLineText"],
                .ag-popup-editor [data-field-type="SingleLineText"],
                .ag-popup-editor [data-field-type="RichText"] {
                    max-width: 95vw;
                    max-height: 90vh;
                    min-width: 320px;
                    min-height: 240px;
                    resize: both !important;
                    overflow: hidden !important;
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
                    border-radius: 6px;
                    background: #fff;
                    box-sizing: border-box !important;
                    padding: 0 !important;
                    position: relative !important;
                }
                .ag-popup-editor [data-field-type="MultiLineText"] > *,
                .ag-popup-editor [data-field-type="SingleLineText"] > *,
                .ag-popup-editor [data-field-type="RichText"] > * {
                    position: absolute !important;
                    inset: 0 !important;
                    width: auto !important;
                    height: auto !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-sizing: border-box !important;
                    display: block !important;
                }
                .ag-popup-editor [data-field-type] [id^="editor_"] {
                    position: absolute !important;
                    inset: 0 !important;
                    width: auto !important;
                    height: auto !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-sizing: border-box !important;
                    display: block !important;
                    max-height: none !important;
                    min-height: 0 !important;
                }
                .ag-popup-editor [data-field-type] .ck-editor__editable_inline,
                .ag-popup-editor [data-field-type] .ck.ck-editor__editable {
                    position: absolute !important;
                    inset: 0 !important;
                    width: auto !important;
                    height: auto !important;
                    margin: 0 !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    max-height: none !important;
                    min-height: 0 !important;
                    resize: none !important;
                    box-sizing: border-box !important;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        function applyInlineSize(wrapper) {
            if (!wrapper || wrapper.dataset.rlResized === '1') return;
            const fieldType = wrapper.getAttribute('data-field-type') || '';
            if (!/MultiLineText|RichText|SingleLineText/i.test(fieldType)) return;
            wrapper.dataset.rlResized = '1';
            wrapper.style.setProperty('width', DEFAULT_W + 'px');
            wrapper.style.setProperty('height', DEFAULT_H + 'px');

            const popup = wrapper.closest('.ag-popup-editor');
            if (popup) {
                const rect = popup.getBoundingClientRect();
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                if (rect.left + DEFAULT_W > vw - 8) {
                    const newLeft = Math.max(8, vw - DEFAULT_W - 16);
                    popup.style.left = newLeft + 'px';
                }
                if (rect.top + DEFAULT_H > vh - 8) {
                    const newTop = Math.max(8, vh - DEFAULT_H - 16);
                    popup.style.top = newTop + 'px';
                }
            }
        }

        function scanPopups() {
            const wrappers = document.querySelectorAll(
                '.ag-popup-editor [data-field-type]'
            );
            wrappers.forEach(applyInlineSize);
        }

        function sweepTitles() {
            document.querySelectorAll('.ag-cell[title], .ag-cell [title]').forEach((el) => {
                el.setAttribute('data-rl-title', el.getAttribute('title'));
                el.removeAttribute('title');
            });
            // Re-anchor the focus box to the current DOM cell matching hoverKey,
            // since ag-grid may recycle cell elements while the tooltip is open.
            if (hoverKey && focusBoxEl && focusBoxEl.classList.contains('is-visible')) {
                const cells = document.querySelectorAll('.ag-cell');
                for (const c of cells) {
                    if (cellKey(c) === hoverKey) {
                        if (c !== hoverCell) hoverCell = c;
                        const rect = c.getBoundingClientRect();
                        focusBoxEl.style.left = rect.left + 'px';
                        focusBoxEl.style.top = rect.top + 'px';
                        focusBoxEl.style.width = rect.width + 'px';
                        focusBoxEl.style.height = rect.height + 'px';
                        break;
                    }
                }
            }
        }

        let tipEl = null;
        let focusBoxEl = null;
        let hoverCell = null;
        let hoverKey = null;
        let hideTimer = null;

        // Stable identifier for a cell that survives ag-grid DOM recycling.
        function cellKey(cell) {
            if (!cell) return null;
            const row = cell.closest('[row-id]') ||
                        cell.closest('.ag-row');
            const colId = cell.getAttribute('col-id') || '';
            const rowId = row ? (row.getAttribute('row-id') ||
                                  row.getAttribute('row-index') || '') : '';
            if (!rowId && !colId) return null;
            return rowId + '|' + colId;
        }

        function cancelHide() {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        }
        function scheduleHide(delay) {
            cancelHide();
            hideTimer = setTimeout(() => {
                hideTimer = null;
                hideTip();
            }, delay != null ? delay : 120);
        }

        function ensureTip() {
            if (tipEl && document.body.contains(tipEl)) return tipEl;
            tipEl = document.createElement('div');
            tipEl.id = TOOLTIP_ID;
            tipEl.addEventListener('mouseenter', cancelHide);
            tipEl.addEventListener('mouseleave', (e) => {
                const to = e.relatedTarget;
                const toCell = to && to.closest && to.closest('.ag-cell');
                if (toCell && cellKey(toCell) === hoverKey) return;
                scheduleHide(120);
            });
            document.body.appendChild(tipEl);
            return tipEl;
        }

        function ensureFocusBox() {
            if (focusBoxEl && document.body.contains(focusBoxEl)) return focusBoxEl;
            focusBoxEl = document.createElement('div');
            focusBoxEl.id = 'rl-hover-focus-box';
            document.body.appendChild(focusBoxEl);
            return focusBoxEl;
        }

        function showFocusBox(cell) {
            const box = ensureFocusBox();
            const rect = cell.getBoundingClientRect();
            box.style.left = rect.left + 'px';
            box.style.top = rect.top + 'px';
            box.style.width = rect.width + 'px';
            box.style.height = rect.height + 'px';
            box.classList.add('is-visible');
        }

        function hideFocusBox() {
            if (focusBoxEl) focusBoxEl.classList.remove('is-visible');
        }

        function stripNativeTitles(root) {
            if (!root) return;
            if (root.hasAttribute && root.hasAttribute('title')) {
                root.setAttribute('data-rl-title', root.getAttribute('title'));
                root.removeAttribute('title');
            }
            if (root.querySelectorAll) {
                root.querySelectorAll('[title]').forEach((el) => {
                    el.setAttribute('data-rl-title', el.getAttribute('title'));
                    el.removeAttribute('title');
                });
            }
        }

        function cellHasRichContent(cell) {
            if (!cell) return false;
            const rich = cell.querySelector(
                '[class*="rich-text-editor"], .ck-content, [class*="multi-line-text"]'
            );
            if (rich && rich.textContent.trim().length > 0) return true;
            // also show for any cell whose text is visibly clipped
            const inner = cell.querySelector('.ag-cell-value') || cell;
            return inner.scrollWidth > inner.clientWidth + 1 ||
                   inner.scrollHeight > inner.clientHeight + 1;
        }

        function getCellHtml(cell) {
            const rich = cell.querySelector(
                '[class*="rich-text-editor"] .ck-content, .ck-content, [class*="rich-text-editor"]'
            );
            if (rich && rich.innerHTML.trim()) return rich.innerHTML;
            const inner = cell.querySelector('.ag-cell-value') || cell;
            return inner.innerHTML;
        }

        function positionTip(tip, cell) {
            const rect = cell.getBoundingClientRect();
            tip.style.left = '-9999px';
            tip.style.top = '0px';
            const tw = Math.min(TIP_MAX_W, tip.offsetWidth);
            const th = Math.min(TIP_MAX_H, tip.offsetHeight);
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            let left = rect.left;
            let top = rect.bottom + 4;
            if (left + tw > vw - 8) left = Math.max(8, vw - tw - 8);
            if (top + th > vh - 8) top = Math.max(8, rect.top - th - 4);
            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
        }

        function showTipFor(cell) {
            cancelHide();
            const tip = ensureTip();
            const key = cellKey(cell);
            hoverCell = cell;
            showFocusBox(cell);
            // Only re-render content when we move to a different logical cell.
            if (key !== hoverKey) {
                hoverKey = key;
                tip.innerHTML = getCellHtml(cell);
                positionTip(tip, cell);
            }
            tip.classList.add('is-visible');
        }

        function hideTip() {
            if (tipEl) tipEl.classList.remove('is-visible');
            hideFocusBox();
            hoverCell = null;
            hoverKey = null;
        }

        function isInTip(node) {
            return tipEl && node && (node === tipEl || tipEl.contains(node));
        }

        function onMouseOver(e) {
            const t = e.target;
            if (isInTip(t)) { cancelHide(); return; }

            const cell = t.closest && t.closest('.ag-cell');
            if (!cell) {
                scheduleHide(120);
                return;
            }

            // remove native browser tooltip ("black box") coming from title attrs
            stripNativeTitles(cell);

            // don't show tooltip while an editor popup is open
            if (document.querySelector('.ag-popup-editor')) {
                hideTip();
                return;
            }
            const key = cellKey(cell);
            if (key && key === hoverKey) {
                cancelHide();
                hoverCell = cell;
                showFocusBox(cell);
                return;
            }
            if (!cellHasRichContent(cell)) {
                scheduleHide(120);
                return;
            }
            showTipFor(cell);
        }

        function onMouseOut(e) {
            const to = e.relatedTarget;
            if (isInTip(to)) { cancelHide(); return; }
            const toCell = to && to.closest && to.closest('.ag-cell');
            if (toCell && cellKey(toCell) === hoverKey) { cancelHide(); return; }
            scheduleHide(120);
        }

        function installHover() {
            if (installHover._done) return;
            installHover._done = true;
            document.addEventListener('mouseover', onMouseOver, true);
            document.addEventListener('mouseout', onMouseOut, true);
            document.addEventListener('scroll', (e) => {
                if (isInTip(e.target)) return;
                hideTip();
            }, true);
            window.addEventListener('blur', hideTip);
            // sweep existing title attrs on grid cells
            stripNativeTitles(document.body);
        }

        return { injectStyle, scanPopups, installHover, sweepTitles };
    })();

    // ---------------------------------------------------------------------
    // Router: pick the right injector for the current host
    // ---------------------------------------------------------------------

    const host = location.hostname;
    const isHubSpot = /hubspot\.com$/i.test(host);
    const isOneflow = /oneflow\.com$/i.test(host);
    const isRocketlane = /rocketlane\.com$/i.test(host);

    if (isRocketlane) {
        ROCKETLANE.injectStyle();
        ROCKETLANE.installHover();
    }

    const tick = () => {
        if (isHubSpot) HUBSPOT.injectButton();
        if (isOneflow) ONEFLOW.injectButton();
        if (isRocketlane) {
            ROCKETLANE.scanPopups();
            ROCKETLANE.sweepTitles();
        }
    };

    const obs = new MutationObserver(tick);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    tick();
})();
