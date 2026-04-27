// ==UserScript==
// @name         Rocketlane Day Recap
// @version      2.1
// @description  Records every IWMAC plant page you visit, then shows them per day on Rocketlane My Timesheet.
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @match        https://kiona.rocketlane.com/timesheets/*
// @match        http://*.plants.iwmac.local:8080/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'visits';
    const MAX_VISITS = 5000;
    const PANEL_ID = 'rl-day-recap-panel';
    const BTN_ID = 'rl-day-recap-fab';

    const host = location.hostname;

    function recordVisit() {
        const m = host.match(/^(\d+)\.plants\.iwmac\.local$/);
        if (!m) return;
        const plant_id = m[1];

        // Best-effort plant name from the page
        const name =
            (document.querySelector('h1')?.textContent || '').trim() ||
            (document.title || '').trim() ||
            '';

        const visits = GM_getValue(STORAGE_KEY, []);
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10); // local-ish; refined on read

        // Dedupe: skip if same plant_id was logged within last 5 minutes
        const last = visits[visits.length - 1];
        if (last && last.plant_id === plant_id && (now - last.ts) < 5 * 60 * 1000) {
            // Update name if we now have a better one
            if (name && name !== last.name) {
                last.name = name;
                GM_setValue(STORAGE_KEY, visits);
            }
            return;
        }

        visits.push({ plant_id, name, ts: now });
        // Keep last MAX_VISITS only
        if (visits.length > MAX_VISITS) visits.splice(0, visits.length - MAX_VISITS);
        GM_setValue(STORAGE_KEY, visits);
    }

    function initRocketlane() {
        injectStyle();
        buildButton();
        const observer = new MutationObserver(() => {
            if (!document.getElementById(BTN_ID) && document.body) buildButton();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    const css = `
        #${BTN_ID} {
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483640;
            background: #0f62fe; color: #fff; border: none; border-radius: 24px;
            padding: 10px 16px; font: 600 13px/1.2 'IBM Plex Sans', system-ui, sans-serif;
            box-shadow: 0 6px 18px rgba(0,0,0,.25); cursor: pointer;
        }
        #${BTN_ID}:hover { background: #0043ce; }
        #${PANEL_ID} {
            position: fixed; bottom: 70px; right: 20px; width: 420px; max-height: 70vh;
            background: #fff; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,.25);
            font: 13px/1.4 'IBM Plex Sans', system-ui, sans-serif; color: #161616;
            z-index: 2147483641; display: flex; flex-direction: column; overflow: hidden;
        }
        #${PANEL_ID} header {
            padding: 10px 14px; background: #161616; color: #fff;
            display: flex; align-items: center; gap: 8px;
        }
        #${PANEL_ID} header strong { flex: 1; font-size: 14px; }
        #${PANEL_ID} header button {
            background: transparent; color: #fff; border: 1px solid #555;
            border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px;
        }
        #${PANEL_ID} .controls {
            padding: 10px 14px; border-bottom: 1px solid #e0e0e0;
            display: flex; gap: 8px; align-items: center;
        }
        #${PANEL_ID} .controls input[type=date] {
            flex: 1; padding: 6px 8px; border: 1px solid #c6c6c6; border-radius: 4px; font-size: 13px;
        }
        #${PANEL_ID} .results { overflow: auto; padding: 6px 0; flex: 1; }
        #${PANEL_ID} .row {
            padding: 10px 14px; border-bottom: 1px solid #f0f0f0;
            display: flex; gap: 10px; align-items: baseline;
        }
        #${PANEL_ID} .row a {
            color: #0f62fe; text-decoration: none; font-weight: 600;
            min-width: 60px;
        }
        #${PANEL_ID} .row a:hover { text-decoration: underline; }
        #${PANEL_ID} .row .name { flex: 1; }
        #${PANEL_ID} .row .time { color: #6f6f6f; font-size: 12px; white-space: nowrap; }
        #${PANEL_ID} .empty { padding: 20px; text-align: center; color: #6f6f6f; }
        #${PANEL_ID} .total {
            padding: 8px 14px; background: #f4f4f4; border-top: 1px solid #e0e0e0;
            font-weight: 600; text-align: right;
        }
    `;

    function injectStyle() {
        if (document.getElementById('rl-day-recap-style')) return;
        const s = document.createElement('style');
        s.id = 'rl-day-recap-style';
        s.textContent = css;
        document.head.appendChild(s);
    }

    function todayISO() {
        const d = new Date();
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d - tz).toISOString().slice(0, 10);
    }

    function tsToLocalISODate(ts) {
        const d = new Date(ts);
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(ts - tz).toISOString().slice(0, 10);
    }

    function tsToLocalTime(ts) {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getVisitsForDate(isoDate) {
        const all = GM_getValue(STORAGE_KEY, []);
        const onDay = all.filter(v => tsToLocalISODate(v.ts) === isoDate);
        // Group by plant_id, keep earliest visit time
        const map = new Map();
        for (const v of onDay) {
            const cur = map.get(v.plant_id);
            if (!cur || v.ts < cur.ts) {
                map.set(v.plant_id, { plant_id: v.plant_id, name: v.name || cur?.name || '', ts: v.ts });
            } else if (!cur.name && v.name) {
                cur.name = v.name;
            }
        }
        return [...map.values()].sort((a, b) => a.ts - b.ts);
    }

    function render(visits, isoDate) {
        const list = document.querySelector(`#${PANEL_ID} .results`);
        const totalEl = document.querySelector(`#${PANEL_ID} .total`);
        list.innerHTML = '';
        if (!visits.length) {
            list.innerHTML = `<div class="empty">No plant visits recorded for ${isoDate}.<br><small>Visits are tracked from the moment this script is installed.</small></div>`;
            totalEl.textContent = '';
            return;
        }
        visits.forEach(v => {
            const url = `http://${v.plant_id}.plants.iwmac.local:8080/`;
            const div = document.createElement('div');
            div.className = 'row';
            div.innerHTML = `
                <a href="${url}" target="_blank">${escapeHtml(v.plant_id)}</a>
                <div class="name">${escapeHtml(v.name || '(no name captured)')}</div>
                <div class="time">${tsToLocalTime(v.ts)}</div>
            `;
            list.appendChild(div);
        });
        totalEl.textContent = `${visits.length} plant${visits.length === 1 ? '' : 's'} visited`;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function buildPanel() {
        if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <header>
                <strong>Plants visited</strong>
                <button data-action="close">×</button>
            </header>
            <div class="controls">
                <input type="date" value="${todayISO()}">
            </div>
            <div class="results"></div>
            <div class="total"></div>
        `;
        document.body.appendChild(panel);

        const dateInput = panel.querySelector('input[type=date]');
        const run = () => render(getVisitsForDate(dateInput.value), dateInput.value);
        dateInput.addEventListener('change', run);
        panel.querySelector('[data-action=close]').addEventListener('click', () => panel.remove());
        run();
        return panel;
    }

    function buildButton() {
        if (document.getElementById(BTN_ID)) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = '🏭 Plants visited';
        btn.addEventListener('click', () => {
            const existing = document.getElementById(PANEL_ID);
            if (existing) existing.remove();
            else buildPanel();
        });
        document.body.appendChild(btn);
    }

    // ---------- Dispatch (after all consts are evaluated) ----------
    if (host.endsWith('.plants.iwmac.local')) {
        recordVisit();
    } else if (host === 'kiona.rocketlane.com') {
        initRocketlane();
    }
})();
