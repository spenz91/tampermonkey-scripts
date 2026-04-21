// ==UserScript==
// @name         Oneflow + HubSpot Copy Products
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      2.0.0
// @description  Adds a copy button on Oneflow (copies product description + quantity from the tilbud PDF) and on HubSpot deal pages (copies the Line items card) as rich HTML with bold headers + bullet list.
// @author       spenz91
// @match        https://app.oneflow.com/*
// @match        https://*.oneflow.com/*
// @match        https://app.hubspot.com/*
// @match        https://app-eu1.hubspot.com/*
// @match        https://*.hubspot.com/*
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
    // Router: pick the right injector for the current host
    // ---------------------------------------------------------------------

    const host = location.hostname;
    const isHubSpot = /hubspot\.com$/i.test(host);
    const isOneflow = /oneflow\.com$/i.test(host);

    const tick = () => {
        if (isHubSpot) HUBSPOT.injectButton();
        if (isOneflow) ONEFLOW.injectButton();
    };

    const obs = new MutationObserver(tick);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    tick();
})();
