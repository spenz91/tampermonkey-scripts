// ==UserScript==
// @name         Oneflow Copy Products
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.4.0
// @description  Adds a sidebar button on Oneflow that copies product description + quantity (antall) from the tilbud PDF as rich HTML (bold headers + bullet list).
// @author       spenz91
// @match        https://app.oneflow.com/*
// @match        https://*.oneflow.com/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/oneflow-copy-products/oneflow-copy-products.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

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
                items.push({ type: 'bullet', desc, antall });
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

    function escapeHtml(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
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

    const COPY_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect><path d="M16 8V5.5C16 4.67157 15.3284 4 14.5 4H5.5C4.67157 4 4 4.67157 4 5.5V14.5C4 15.3284 4.67157 16 5.5 16H8" stroke="currentColor" stroke-width="1.5"></path></svg>';
    const CHECK_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12.5L10 17.5L19 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    const ERROR_SVG = '<svg fill="none" aria-hidden="true" height="24px" width="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';

    function flashButton(btn, ok) {
        btn.innerHTML = ok ? CHECK_SVG : ERROR_SVG;
        btn.style.color = ok ? '#0a7d3b' : '#c0392b';
        setTimeout(() => {
            btn.innerHTML = COPY_SVG;
            btn.style.color = '';
        }, 1500);
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

        // Fallback: copy selection of an off-screen element containing the HTML
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

    function buildButton(referenceTab) {
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.title = 'Kopier produkter (beskrivelse + antall)';
        btn.setAttribute('aria-label', 'Kopier produkter');
        // Match the vertical-tab styling so it blends with the existing icons.
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

    const obs = new MutationObserver(() => injectButton());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    injectButton();
})();
