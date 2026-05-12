// ==UserScript==
// @name         Column Select (Sublime-style)
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @version      1.1
// @description  Hold middle mouse button and drag to select a rectangular column of text (like Sublime). OCRs images/canvases in the selection. Copies result to clipboard.
// @author       spenz91
// @match        *://*/*
// @grant        GM_setClipboard
// @connect      unpkg.com
// @connect      cdn.jsdelivr.net
// @connect      *
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/column-select/Column-Select.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/column-select/Column-Select.user.js
// ==/UserScript==

(function () {
    'use strict';

    const TESSERACT_URL = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';

    let dragging = false;
    let startX = 0, startY = 0;
    let box = null;
    let toastTimer = null;
    let tesseractPromise = null;

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
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = Math.abs(x2 - x1) + 'px';
        box.style.height = Math.abs(y2 - y1) + 'px';
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

    // Returns [{ y, text }] of unique text rows whose horizontal slice falls in [left,right]
    function extractDomLines(left, top, right, bottom) {
        const lines = [];
        const seen = new Set();
        const step = 2;
        for (let y = top; y <= bottom; y += step) {
            const a = caretRangeAt(left, y);
            const b = caretRangeAt(right, y);
            if (!a || !b) continue;

            const range = document.createRange();
            try {
                const cmp = a.compareBoundaryPoints(Range.START_TO_START, b);
                if (cmp <= 0) {
                    range.setStart(a.startContainer, a.startOffset);
                    range.setEnd(b.endContainer, b.endOffset);
                } else {
                    range.setStart(b.startContainer, b.startOffset);
                    range.setEnd(a.endContainer, a.endOffset);
                }
            } catch (_) { continue; }

            const rect = range.getBoundingClientRect();
            const key = Math.round(rect.top) + ':' + Math.round(rect.bottom) + ':' + Math.round(rect.left) + ':' + Math.round(rect.right);
            if (seen.has(key)) continue;
            seen.add(key);

            const text = range.toString();
            if (!text) continue;
            lines.push({ y: rect.top, text });
        }
        return lines;
    }

    function ensureTesseract() {
        if (window.Tesseract) return Promise.resolve();
        if (tesseractPromise) return tesseractPromise;
        tesseractPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = TESSERACT_URL;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load Tesseract.js (CSP?)'));
            document.head.appendChild(s);
        });
        return tesseractPromise;
    }

    function cropToCanvas(el, r, ix1, iy1, ix2, iy2) {
        const cw = ix2 - ix1, ch = iy2 - iy1;
        if (cw < 4 || ch < 4) return null;

        const srcW = el.tagName === 'IMG' ? el.naturalWidth : el.width;
        const srcH = el.tagName === 'IMG' ? el.naturalHeight : el.height;
        if (!srcW || !srcH) return null;

        const scaleX = srcW / r.width;
        const scaleY = srcH / r.height;

        const sx = (ix1 - r.left) * scaleX;
        const sy = (iy1 - r.top) * scaleY;
        const sw = cw * scaleX;
        const sh = ch * scaleY;

        // Upscale destination for better OCR on small text
        const dpr = 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(cw * dpr));
        canvas.height = Math.max(1, Math.round(ch * dpr));
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        try {
            ctx.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            // Tripwire for canvas taint (CORS):
            ctx.getImageData(0, 0, 1, 1);
        } catch (_) {
            return null;
        }
        return canvas;
    }

    async function ocrImagesInRect(left, top, right, bottom) {
        const candidates = [...document.images, ...document.querySelectorAll('canvas')];
        const hits = [];
        for (const el of candidates) {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            if (r.right < left || r.left > right || r.bottom < top || r.top > bottom) continue;
            const ix1 = Math.max(r.left, left);
            const iy1 = Math.max(r.top, top);
            const ix2 = Math.min(r.right, right);
            const iy2 = Math.min(r.bottom, bottom);
            if (ix2 - ix1 < 4 || iy2 - iy1 < 4) continue;
            hits.push({ el, r, ix1, iy1, ix2, iy2 });
        }
        if (!hits.length) return [];

        let lib;
        try {
            await ensureTesseract();
            lib = window.Tesseract;
            if (!lib) throw new Error('Tesseract missing after load');
        } catch (e) {
            toast('OCR unavailable: ' + e.message);
            return [];
        }

        const out = [];
        for (const h of hits) {
            const canvas = cropToCanvas(h.el, h.r, h.ix1, h.iy1, h.ix2, h.iy2);
            if (!canvas) {
                toast('Skipped one image (CORS-tainted)');
                continue;
            }
            try {
                const res = await lib.recognize(canvas, 'eng');
                const text = (res && res.data && res.data.text || '').trim();
                if (text) out.push({ y: h.iy1, text });
            } catch (e) {
                console.warn('[column-select] OCR failed:', e);
            }
        }
        return out;
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
        toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
    }

    function copy(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
            return Promise.resolve();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
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
        if (e.button !== 1) return;
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

    async function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        const x2 = e.clientX, y2 = e.clientY;
        const left = Math.min(startX, x2);
        const right = Math.max(startX, x2);
        const top = Math.min(startY, y2);
        const bottom = Math.max(startY, y2);

        if (box) { box.remove(); box = null; }

        if (right - left < 3 && bottom - top < 3) return;

        const domLines = extractDomLines(left, top, right, bottom);

        // Detect whether any images/canvas are in the rect to decide if we should OCR
        const hasImageInRect = [...document.images, ...document.querySelectorAll('canvas')].some(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return false;
            return !(r.right < left || r.left > right || r.bottom < top || r.top > bottom);
        });

        let ocrLines = [];
        if (hasImageInRect) {
            toast('Running OCR…');
            ocrLines = await ocrImagesInRect(left, top, right, bottom);
        }

        const all = domLines.concat(ocrLines).sort((a, b) => a.y - b.y);
        const text = all.map(l => l.text).join('\n');

        if (text) {
            await copy(text);
            const n = text.split('\n').length;
            toast(`Copied ${n} line${n === 1 ? '' : 's'}${ocrLines.length ? ' (incl. OCR)' : ''}`);
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

    document.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
})();
