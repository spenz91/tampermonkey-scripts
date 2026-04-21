// ==UserScript==
// @name         Oneflow Copy Products
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.1.0
// @description  Adds a sidebar button on Oneflow that copies product description + quantity (antall) from the tilbud PDF.
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

    // Build rows from the rendered PDF text layer by grouping spans with similar top %.
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
            // round top to 0.25% buckets to group the same visual line
            const key = (Math.round(top * 4) / 4).toFixed(2);
            if (!byTop.has(key)) byTop.set(key, []);
            byTop.get(key).push({ left, top, text: s.textContent });
        }

        const rows = [...byTop.entries()]
            .map(([k, items]) => ({
                top: parseFloat(k),
                items: items.sort((a, b) => a.left - b.left),
            }))
            .sort((a, b) => a.top - b.top);

        return rows;
    }

    function extractProducts() {
        const rows = buildRows();
        if (!rows.length) return '';

        const out = [];
        let started = false;

        for (const row of rows) {
            const rowText = row.items.map(i => i.text).join('').trim();
            if (!started) {
                if (/Beskrivelse/i.test(rowText)) started = true;
                continue;
            }
            if (/Installasjonkostnader|Listepris|Sum eks mva/i.test(rowText)) break;

            // description = spans left of the price column
            const desc = row.items
                .filter(i => i.left < 45)
                .map(i => i.text)
                .join('')
                .replace(/\s+/g, ' ')
                .trim();

            // antall lives in the "Antall" column, roughly 75–83 %
            const antallItem = row.items.find(
                i => i.left > 74 && i.left < 84 && /\d+\s*pcs/i.test(i.text)
            );
            const antall = antallItem ? antallItem.text.trim() : '';

            if (!desc && !antall) continue;

            const isHeader = /^IWMAC\s+(Product|Modul):/i.test(desc);

            if (!desc && antall && out.length) {
                // row contains only the quantity — attach to previous line
                out[out.length - 1] = out[out.length - 1] + ' | ' + antall;
            } else if (isHeader) {
                out.push('**' + desc + '**');
            } else if (desc && antall) {
                out.push('- ' + desc + ' | ' + antall);
            } else if (desc) {
                out.push('- ' + desc);
            }
        }

        return out.join('\n');
    }

    function flashButton(btn, msg, ok) {
        const orig = btn.textContent;
        btn.textContent = msg;
        btn.style.color = ok ? '#0a7d3b' : '#c0392b';
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.color = '';
        }, 1500);
    }

    async function copyToClipboard(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
            return true;
        }
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        }
    }

    function buildButton() {
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.textContent = 'Kopier';
        btn.title = 'Kopier beskrivelser og antall';
        btn.setAttribute('aria-label', 'Kopier produkter');
        Object.assign(btn.style, {
            margin: '8px 4px',
            padding: '6px 4px',
            fontSize: '11px',
            fontWeight: '600',
            lineHeight: '1.2',
            cursor: 'pointer',
            border: '1px solid #013a4c',
            borderRadius: '6px',
            background: '#ffffff',
            color: '#013a4c',
            width: 'calc(100% - 8px)',
        });
        btn.addEventListener('click', async () => {
            const text = extractProducts();
            if (!text) {
                flashButton(btn, 'Fant ingen', false);
                return;
            }
            const ok = await copyToClipboard(text);
            flashButton(btn, ok ? 'Kopiert!' : 'Feil', ok);
        });
        return btn;
    }

    function injectButton() {
        if (document.getElementById(BTN_ID)) return;
        const tabs = document.querySelector('[role="tablist"][aria-orientation="vertical"]');
        if (!tabs) return;
        tabs.appendChild(buildButton());
    }

    const obs = new MutationObserver(() => injectButton());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    injectButton();
})();
