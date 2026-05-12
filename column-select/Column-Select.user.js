// ==UserScript==
// @name         Column Select (Sublime-style)
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.0
// @description  Hold middle mouse button and drag to select a rectangular column of text (like Sublime). Releases copy the column to clipboard.
// @author       spenz91
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/column-select/Column-Select.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/column-select/Column-Select.user.js
// ==/UserScript==

(function () {
    'use strict';

    let dragging = false;
    let startX = 0, startY = 0;
    let box = null;
    let toastTimer = null;

    function makeBox() {
        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed',
            'z-index:2147483647',
            'pointer-events:none',
            'background:rgba(80,140,255,0.18)',
            'border:1px solid rgba(80,140,255,0.9)',
            'left:0;top:0;width:0;height:0',
        ].join(';');
        document.documentElement.appendChild(el);
        return el;
    }

    function updateBox(x1, y1, x2, y2) {
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = w + 'px';
        box.style.height = h + 'px';
    }

    function caretRangeAt(x, y) {
        if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
        if (document.caretPositionFromPoint) {
            const p = document.caretPositionFromPoint(x, y);
            if (!p) return null;
            const r = document.createRange();
            r.setStart(p.offsetNode, p.offset);
            r.setEnd(p.offsetNode, p.offset);
            return r;
        }
        return null;
    }

    function extractColumn(left, top, right, bottom) {
        // Sample horizontal scan lines; dedupe by the bounding rect of the resulting range
        const lines = [];
        const seen = new Set();
        const step = 2;
        for (let y = top; y <= bottom; y += step) {
            const startR = caretRangeAt(left, y);
            const endR = caretRangeAt(right, y);
            if (!startR || !endR) continue;

            const range = document.createRange();
            try {
                // Order start/end correctly
                const cmp = startR.compareBoundaryPoints(Range.START_TO_START, endR);
                if (cmp <= 0) {
                    range.setStart(startR.startContainer, startR.startOffset);
                    range.setEnd(endR.endContainer, endR.endOffset);
                } else {
                    range.setStart(endR.startContainer, endR.startOffset);
                    range.setEnd(startR.endContainer, startR.endOffset);
                }
            } catch (_) {
                continue;
            }

            const rect = range.getBoundingClientRect();
            // Dedupe by row position (rounded)
            const key = Math.round(rect.top) + ':' + Math.round(rect.bottom) + ':' + Math.round(rect.left) + ':' + Math.round(rect.right);
            if (seen.has(key)) continue;
            seen.add(key);

            const text = range.toString();
            if (text.length === 0) continue;
            lines.push({ y: rect.top, text });
        }
        // Sort top-to-bottom (mostly already sorted) and join
        lines.sort((a, b) => a.y - b.y);
        return lines.map(l => l.text).join('\n');
    }

    function toast(msg) {
        let t = document.getElementById('__colsel_toast');
        if (!t) {
            t = document.createElement('div');
            t.id = '__colsel_toast';
            t.style.cssText = [
                'position:fixed',
                'bottom:24px',
                'right:24px',
                'z-index:2147483647',
                'background:rgba(30,30,30,0.92)',
                'color:#fff',
                'font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif',
                'padding:8px 12px',
                'border-radius:6px',
                'box-shadow:0 4px 16px rgba(0,0,0,0.3)',
                'pointer-events:none',
                'transition:opacity .2s',
                'opacity:0',
            ].join(';');
            document.documentElement.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 1500);
    }

    function copy(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
            return Promise.resolve();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        ta.remove();
        return Promise.resolve();
    }

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 1) return; // middle only
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        box = makeBox();
        updateBox(startX, startY, startX, startY);
    }, true);

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        updateBox(startX, startY, e.clientX, e.clientY);
    }, true);

    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        const x2 = e.clientX, y2 = e.clientY;
        const left = Math.min(startX, x2);
        const right = Math.max(startX, x2);
        const top = Math.min(startY, y2);
        const bottom = Math.max(startY, y2);

        if (box) { box.remove(); box = null; }

        // Tiny drag = treat as click; ignore
        if (right - left < 3 && bottom - top < 3) return;

        const text = extractColumn(left, top, right, bottom);
        if (text) {
            copy(text);
            const n = text.split('\n').length;
            toast(`Copied ${n} line${n === 1 ? '' : 's'}`);
        } else {
            toast('No text in selection');
        }
    }

    document.addEventListener('mouseup', (e) => {
        if (e.button !== 1) return;
        if (dragging) {
            e.preventDefault();
            e.stopPropagation();
        }
        endDrag(e);
    }, true);

    // Suppress the default middle-click auto-scroll/paste behaviors while dragging
    document.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
})();
