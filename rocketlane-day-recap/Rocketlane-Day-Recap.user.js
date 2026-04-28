// ==UserScript==
// @name         Rocketlane Day Recap
// @version      4.0
// @description  Pick a date and see every IWMAC plant you visited that day. The recap panel runs on pang.qxs (where it has direct access to pang's live plant inventory and authenticated session). Rocketlane gets a button that opens pang with the date pre-filled.
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @match        https://kiona.rocketlane.com/timesheets/*
// @match        http://tools.iwmac.local/pang.qxs*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const PANG_URL = 'http://tools.iwmac.local/pang.qxs';
    const PARALLEL = 8;
    const NO_TZ    = 'Europe/Oslo';
    const noTimeFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: NO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });

    // ---------- shared utils ----------
    const normalizeUser = (u) => String(u || '').toLowerCase().split('@')[0].trim();
    const tsFromPangDate = (s) => new Date(String(s).replace(' ', 'T')).getTime();
    const pangDateISO = (s) => String(s).slice(0, 10);
    const tsToTime = (ts) => noTimeFmt.format(new Date(ts));
    const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: NO_TZ, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
    const isoToNoDate = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('.') : iso;
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    async function pMap(items, f, parallel, onProgress) {
        const results = new Array(items.length);
        let i = 0, done = 0;
        const workers = Array.from({ length: Math.min(parallel, items.length) }, async () => {
            while (i < items.length) {
                const idx = i++;
                results[idx] = await f(items[idx], idx);
                done++;
                onProgress?.(done, items.length);
            }
        });
        await Promise.all(workers);
        return results;
    }

    // ---------- shared CSS (works in both contexts) ----------
    const FAB_ID   = 'rl-recap-fab';
    const PANEL_ID = 'rl-recap-panel';

    function injectStyle() {
        if (document.getElementById('rl-recap-style')) return;
        const s = document.createElement('style');
        s.id = 'rl-recap-style';
        s.textContent = `
            #${FAB_ID} {
                position: fixed; bottom: 20px; right: 20px; z-index: 2147483640;
                background: #0f62fe; color: #fff; border: none; border-radius: 24px;
                padding: 10px 16px; font: 600 13px/1.2 'IBM Plex Sans', system-ui, sans-serif;
                box-shadow: 0 6px 18px rgba(0,0,0,.25); cursor: pointer;
            }
            #${FAB_ID}:hover { background: #0043ce; }
            #${PANEL_ID} {
                position: fixed; bottom: 70px; right: 20px; width: 480px; max-height: 75vh;
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
                display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            }
            #${PANEL_ID} .controls input[type=date] {
                flex: 1; padding: 6px 8px; border: 1px solid #c6c6c6; border-radius: 4px; font-size: 13px;
            }
            #${PANEL_ID} .controls button {
                padding: 6px 12px; background: #0f62fe; color: #fff; border: none;
                border-radius: 4px; cursor: pointer; font-weight: 600;
            }
            #${PANEL_ID} .controls button:disabled { background: #c6c6c6; cursor: wait; }
            #${PANEL_ID} .controls label { font-size: 12px; color: #525252; display: flex; gap: 4px; align-items: center; }
            #${PANEL_ID} .progress { height: 3px; background: #e0e0e0; }
            #${PANEL_ID} .progress > div { height: 100%; background: #0f62fe; transition: width .15s; }
            #${PANEL_ID} .results { overflow: auto; flex: 1; }
            #${PANEL_ID} .row {
                padding: 8px 14px; border-bottom: 1px solid #f0f0f0;
                display: flex; gap: 10px; align-items: baseline;
            }
            #${PANEL_ID} .row a {
                color: #0f62fe; text-decoration: none; font-weight: 600; min-width: 56px;
            }
            #${PANEL_ID} .row a:hover { text-decoration: underline; }
            #${PANEL_ID} .row .name { flex: 1; }
            #${PANEL_ID} .row .actions { color: #525252; font-size: 11px; margin-top: 2px; }
            #${PANEL_ID} .row .time { color: #6f6f6f; font-size: 12px; white-space: nowrap; }
            #${PANEL_ID} .empty { padding: 20px; text-align: center; color: #6f6f6f; font-size: 12px; }
            #${PANEL_ID} .total {
                padding: 8px 14px; background: #f4f4f4; border-top: 1px solid #e0e0e0;
                font-size: 12px; color: #525252; display: flex; justify-content: space-between;
            }
        `;
        document.head.appendChild(s);
    }

    // ---------- pang side: the real panel ----------
    function pangFetchHistory(plant_id) {
        return fetch('/services/pang/actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: JSON.stringify([{ jsonrpc: '2.0', method: 'get_history', params: { plant_id: String(plant_id) }, id: 0 }]),
        }).then(r => r.json()).then(d => Array.isArray(d.result) ? d.result : []).catch(() => []);
    }

    function pangGetUsername() {
        try {
            const u = localStorage.getItem('pang.login.username');
            if (u) return JSON.parse(u);
        } catch {}
        return '';
    }

    function pangGetRecent() {
        try {
            const r = localStorage.getItem('pang.recent');
            if (r) return JSON.parse(r).map(String);
        } catch {}
        return [];
    }

    function pangPlantNamesById() {
        const map = new Map();
        const coll = window.module_plants?.coll?.data;
        if (Array.isArray(coll)) {
            for (const p of coll) {
                if (p?.plant_id && p?.name) map.set(String(p.plant_id), p.name);
            }
        }
        return map;
    }

    async function pangLoadVisits(isoDate, scope, onProgress) {
        const username = normalizeUser(pangGetUsername());
        const namesById = pangPlantNamesById();
        let plantIds;
        if (scope === 'all') {
            plantIds = [...namesById.keys()];
        } else {
            plantIds = pangGetRecent();
        }
        if (plantIds.length === 0) return { visits: [], username, scanned: 0 };

        const all = await pMap(plantIds, async (pid) => {
            const entries = await pangFetchHistory(pid);
            const matches = entries.filter(e => pangDateISO(e.date) === isoDate && normalizeUser(e.user) === username);
            if (matches.length === 0) return null;
            matches.sort((a, b) => tsFromPangDate(a.date) - tsFromPangDate(b.date));
            return {
                plant_id: pid,
                name: namesById.get(pid) || '',
                first_ts: tsFromPangDate(matches[0].date),
                actions: [...new Set(matches.map(m => m.action))],
                count: matches.length,
            };
        }, PARALLEL, onProgress);

        const visits = all.filter(Boolean).sort((a, b) => a.first_ts - b.first_ts);
        return { visits, username, scanned: plantIds.length };
    }

    function buildPangPanel(initialDate) {
        if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <header>
                <strong>Plants visited</strong>
                <button data-action="close">×</button>
            </header>
            <div class="controls">
                <input type="date" value="${initialDate || todayISO()}">
                <button data-action="search">Search</button>
                <label title="Scan all 7600+ plants pang knows about. Slower but finds visits to plants no longer in your recent list."><input type="checkbox" data-scope="all"> Scan all plants</label>
            </div>
            <div class="progress"><div style="width:0%"></div></div>
            <div class="results"></div>
            <div class="total"></div>
        `;
        document.body.appendChild(panel);

        const dateInput = panel.querySelector('input[type=date]');
        const searchBtn = panel.querySelector('[data-action=search]');
        const allBox    = panel.querySelector('[data-scope=all]');
        const list      = panel.querySelector('.results');
        const totalEl   = panel.querySelector('.total');
        const progress  = panel.querySelector('.progress > div');

        const run = async () => {
            searchBtn.disabled = true;
            list.innerHTML = '<div class="empty">Querying pang…</div>';
            totalEl.textContent = '';
            progress.style.width = '0%';
            const iso = dateInput.value;
            const scope = allBox.checked ? 'all' : 'recent';
            try {
                const { visits, username, scanned } = await pangLoadVisits(iso, scope, (d, t) => {
                    progress.style.width = Math.round(d / t * 100) + '%';
                });
                progress.style.width = '100%';
                renderVisits(list, visits, iso, scanned, scope);
                totalEl.innerHTML =
                    `<span>${escapeHtml(username || '(no user)')} · ${isoToNoDate(iso)}</span>` +
                    `<span>${visits.length} of ${scanned} ${scope === 'all' ? 'plants' : 'recent plants'} scanned</span>`;
            } finally {
                searchBtn.disabled = false;
                setTimeout(() => { progress.style.width = '0%'; }, 800);
            }
        };

        searchBtn.addEventListener('click', run);
        dateInput.addEventListener('change', run);
        allBox.addEventListener('change', run);
        panel.querySelector('[data-action=close]').addEventListener('click', () => panel.remove());
        run();
        return panel;
    }

    function renderVisits(list, visits, isoDate, scanned, scope) {
        list.innerHTML = '';
        if (scanned === 0) {
            list.innerHTML = `<div class="empty">Pang isn't fully loaded yet. Try again in a moment.</div>`;
            return;
        }
        if (visits.length === 0) {
            list.innerHTML = `<div class="empty">Nothing logged for ${isoToNoDate(isoDate)} across ${scanned} ${scope === 'all' ? 'plants' : 'recent plants'}.${scope === 'recent' ? '<br><small>Tip: tick "Scan all plants" to search the full inventory.</small>' : ''}</div>`;
            return;
        }
        visits.forEach(v => {
            const url = `${PANG_URL}#plant=${encodeURIComponent(v.plant_id)}`;
            const div = document.createElement('div');
            div.className = 'row';
            div.innerHTML = `
                <a href="${url}" target="_blank">${escapeHtml(v.plant_id)}</a>
                <div class="name">
                    ${escapeHtml(v.name || '(unnamed)')}
                    <div class="actions">${escapeHtml(v.actions.join(', '))}</div>
                </div>
                <div class="time">${tsToTime(v.first_ts)}</div>
            `;
            list.appendChild(div);
        });
    }

    function buildPangButton() {
        if (document.getElementById(FAB_ID)) return;
        const btn = document.createElement('button');
        btn.id = FAB_ID;
        btn.textContent = '🏭 Day Recap';
        btn.addEventListener('click', () => {
            const ex = document.getElementById(PANEL_ID);
            if (ex) ex.remove();
            else buildPangPanel();
        });
        document.body.appendChild(btn);
    }

    function initPang() {
        injectStyle();
        // If the URL hash carries a recap date (from a Rocketlane click), auto-open the panel.
        const m = location.hash.match(/recap=(\d{4}-\d{2}-\d{2})/);
        const initialDate = m ? m[1] : null;
        const open = () => {
            buildPangButton();
            if (initialDate) buildPangPanel(initialDate);
        };
        // Wait briefly so pang's coll.data has time to populate (it usually does so very quickly).
        if (window.module_plants?.coll?.data?.length > 100) {
            open();
        } else {
            let tries = 0;
            const check = () => {
                if (window.module_plants?.coll?.data?.length > 100 || tries > 40) { open(); return; }
                tries++;
                setTimeout(check, 250);
            };
            check();
        }
    }

    // ---------- rocketlane side: small redirector ----------
    function buildRocketlaneButton() {
        if (document.getElementById(FAB_ID)) return;
        const btn = document.createElement('button');
        btn.id = FAB_ID;
        btn.textContent = '🏭 Day Recap';
        btn.title = 'Open the plant-visit recap on pang';
        btn.addEventListener('click', () => {
            const ex = document.getElementById(PANEL_ID);
            if (ex) { ex.remove(); return; }
            buildRocketlanePanel();
        });
        document.body.appendChild(btn);
    }

    function buildRocketlanePanel() {
        if (document.getElementById(PANEL_ID)) return;
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.height = 'auto';
        panel.style.maxHeight = 'none';
        panel.innerHTML = `
            <header>
                <strong>Plants visited</strong>
                <button data-action="close">×</button>
            </header>
            <div class="controls">
                <input type="date" value="${todayISO()}">
                <button data-action="open">Open on pang ↗</button>
            </div>
            <div class="empty">
                The recap runs on <a href="${PANG_URL}" target="_blank">pang</a> (where the live plant data lives).<br>
                Pick a date and click <strong>Open on pang ↗</strong>.
            </div>
        `;
        document.body.appendChild(panel);

        const dateInput = panel.querySelector('input[type=date]');
        const openBtn   = panel.querySelector('[data-action=open]');
        openBtn.addEventListener('click', () => {
            const iso = dateInput.value || todayISO();
            window.open(`${PANG_URL}#recap=${encodeURIComponent(iso)}`, '_blank');
        });
        dateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') openBtn.click(); });
        panel.querySelector('[data-action=close]').addEventListener('click', () => panel.remove());
    }

    function initRocketlane() {
        injectStyle();
        buildRocketlaneButton();
        const observer = new MutationObserver(() => {
            if (!document.getElementById(FAB_ID) && document.body) buildRocketlaneButton();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ---------- dispatch ----------
    const host = location.hostname;
    if (host === 'tools.iwmac.local' && location.pathname === '/pang.qxs') {
        initPang();
    } else if (host === 'kiona.rocketlane.com') {
        initRocketlane();
    }
})();
