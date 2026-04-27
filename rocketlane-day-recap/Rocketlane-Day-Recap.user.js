// ==UserScript==
// @name         Rocketlane Day Recap
// @version      3.5
// @description  On Rocketlane My Timesheet, pick a date and see all IWMAC plants you visited that day. Uses pang's get_history API across known plants.
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @match        https://kiona.rocketlane.com/timesheets/*
// @match        http://*.plants.iwmac.local:8080/*
// @match        http://tools.iwmac.local/pang.qxs*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      tools.iwmac.local
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const KEY_KNOWN_PLANTS = 'known_plants';   // [plant_id, ...]
    const KEY_PLANT_NAMES  = 'plant_names';    // { plant_id: name }
    const KEY_USERNAME     = 'pang_username';
    const PANEL_ID = 'rl-day-recap-panel';
    const BTN_ID   = 'rl-day-recap-fab';
    const PARALLEL = 8;

    const host = location.hostname;

    // ---------- Plant page: capture name ----------
    function recordPlantName() {
        const m = host.match(/^(\d+)\.plants\.iwmac\.local$/);
        if (!m) return;
        const plant_id = m[1];
        const name = (document.querySelector('h1')?.textContent || document.title || '').trim();
        const names = GM_getValue(KEY_PLANT_NAMES, {});
        if (name && names[plant_id] !== name) {
            names[plant_id] = name;
            GM_setValue(KEY_PLANT_NAMES, names);
        }
        // Also add to known_plants so it gets queried next time
        const known = new Set(GM_getValue(KEY_KNOWN_PLANTS, []));
        if (!known.has(plant_id)) {
            known.add(plant_id);
            GM_setValue(KEY_KNOWN_PLANTS, [...known]);
        }
    }

    // ---------- Pang page: pull recent list + username + plant names ----------
    function syncFromPang() {
        const finish = () => {
            if (window.name === 'rl_pang_sync') {
                setTimeout(() => { try { window.close(); } catch {} }, 250);
            }
        };
        try {
            const raw = localStorage.getItem('pang.recent');
            if (raw) {
                const recent = JSON.parse(raw);
                const known = new Set(GM_getValue(KEY_KNOWN_PLANTS, []));
                for (const id of recent) known.add(String(id));
                GM_setValue(KEY_KNOWN_PLANTS, [...known]);
            }
            const u = localStorage.getItem('pang.login.username');
            if (u) GM_setValue(KEY_USERNAME, JSON.parse(u));
        } catch (e) { console.warn('Day Recap: sync failed', e); }

        // Wait for pang's plants_table to populate, then harvest plant_id → name.
        let attempts = 0;
        const tryHarvest = () => {
            attempts++;
            try {
                const bodys = window.module_plants?.plants_table?.tableData?.bodys;
                if (Array.isArray(bodys) && bodys.length) {
                    const names = GM_getValue(KEY_PLANT_NAMES, {});
                    let added = 0;
                    for (const row of bodys) {
                        const u = row?.user;
                        if (!u || !u.plant_id || !u.name) continue;
                        if (names[u.plant_id] !== u.name) {
                            names[u.plant_id] = u.name;
                            added++;
                        }
                    }
                    if (added) GM_setValue(KEY_PLANT_NAMES, names);
                    finish();
                    return;
                }
            } catch {}
            if (attempts < 40) setTimeout(tryHarvest, 250); // up to ~10s
            else finish();
        };
        tryHarvest();
    }

    // From Rocketlane: open pang in a tiny popup to trigger syncFromPang inside it.
    // The popup closes itself once it has harvested both the recent list and plant names.
    function autoSyncFromPang(timeoutMs = 15000) {
        return new Promise(resolve => {
            const beforeKnown = GM_getValue(KEY_KNOWN_PLANTS, []).length;
            const w = window.open(
                'http://tools.iwmac.local/pang.qxs',
                'rl_pang_sync',
                'width=420,height=300,left=0,top=0'
            );
            if (!w) { resolve(false); return; }
            const start = Date.now();
            const tick = setInterval(() => {
                const closed = (() => { try { return w.closed; } catch { return false; } })();
                const timedOut = Date.now() - start > timeoutMs;
                if (closed || timedOut) {
                    clearInterval(tick);
                    try { w.close(); } catch {}
                    const grew = GM_getValue(KEY_KNOWN_PLANTS, []).length > beforeKnown;
                    resolve(grew);
                }
            }, 250);
        });
    }

    // ---------- Rocketlane: panel ----------
    function gmFetchHistory(plant_id) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'http://tools.iwmac.local/services/pang/actions.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: JSON.stringify([{ jsonrpc: '2.0', method: 'get_history', params: { plant_id: String(plant_id) }, id: 0 }]),
                onload: r => {
                    try {
                        const d = JSON.parse(r.responseText);
                        resolve(Array.isArray(d.result) ? d.result : []);
                    } catch { resolve([]); }
                },
                onerror: () => resolve([]),
                ontimeout: () => resolve([]),
                timeout: 15000,
            });
        });
    }

    // Run f(item) over items with limited parallelism. Calls onProgress(done, total).
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

    function normalizeUser(u) {
        return String(u || '').toLowerCase().split('@')[0].trim();
    }

    function tsFromPangDate(s) {
        // "2026-04-27 11:46:07" — treat as local time
        return new Date(s.replace(' ', 'T')).getTime();
    }

    function pangDateToISODate(s) {
        return s.slice(0, 10);
    }

    function todayISO() {
        // Today's date in Norway (Europe/Oslo)
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: NO_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        return parts; // en-CA emits YYYY-MM-DD
    }

    async function loadVisitsForDate(isoDate, onProgress) {
        const username = normalizeUser(GM_getValue(KEY_USERNAME, 'thomas.kvalvag'));
        const known = GM_getValue(KEY_KNOWN_PLANTS, []);
        const names = GM_getValue(KEY_PLANT_NAMES, {});

        if (known.length === 0) return { visits: [], username, scanned: 0 };

        const all = await pMap(known, async (pid) => {
            const entries = await gmFetchHistory(pid);
            const matches = entries.filter(e => {
                if (pangDateToISODate(e.date) !== isoDate) return false;
                return normalizeUser(e.user) === username;
            });
            if (matches.length === 0) return null;
            matches.sort((a, b) => tsFromPangDate(a.date) - tsFromPangDate(b.date));
            const actions = [...new Set(matches.map(m => m.action))];
            return {
                plant_id: pid,
                name: names[pid] || '',
                first_ts: tsFromPangDate(matches[0].date),
                actions,
                count: matches.length,
            };
        }, PARALLEL, onProgress);

        const visits = all.filter(Boolean).sort((a, b) => a.first_ts - b.first_ts);
        return { visits, username, scanned: known.length };
    }

    const NO_TZ = 'Europe/Oslo';
    const noTimeFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: NO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
    const noDateFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: NO_TZ, day: '2-digit', month: '2-digit', year: 'numeric' });

    function tsToLocalTime(ts) {
        return noTimeFmt.format(new Date(ts));
    }
    function isoToNorwegianDate(iso) {
        // iso = "YYYY-MM-DD" — display as "DD.MM.YYYY"
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
        const [y, m, d] = iso.split('-');
        return `${d}.${m}.${y}`;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
            position: fixed; bottom: 70px; right: 20px; width: 460px; max-height: 75vh;
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
        #${PANEL_ID} .controls button {
            padding: 6px 10px; background: #0f62fe; color: #fff; border: none;
            border-radius: 4px; cursor: pointer; font-weight: 600;
        }
        #${PANEL_ID} .controls button:disabled { background: #c6c6c6; cursor: wait; }
        #${PANEL_ID} .results { overflow: auto; padding: 4px 0; flex: 1; }
        #${PANEL_ID} .row {
            padding: 8px 14px; border-bottom: 1px solid #f0f0f0;
            display: flex; gap: 10px; align-items: baseline;
        }
        #${PANEL_ID} .row a {
            color: #0f62fe; text-decoration: none; font-weight: 600; min-width: 56px;
        }
        #${PANEL_ID} .row a:hover { text-decoration: underline; }
        #${PANEL_ID} .row .name { flex: 1; }
        #${PANEL_ID} .row .actions { color: #525252; font-size: 11px; }
        #${PANEL_ID} .row .time { color: #6f6f6f; font-size: 12px; white-space: nowrap; }
        #${PANEL_ID} .empty { padding: 20px; text-align: center; color: #6f6f6f; font-size: 12px; }
        #${PANEL_ID} .total {
            padding: 8px 14px; background: #f4f4f4; border-top: 1px solid #e0e0e0;
            font-size: 12px; color: #525252; display: flex; justify-content: space-between;
        }
        #${PANEL_ID} .progress { height: 3px; background: #e0e0e0; }
        #${PANEL_ID} .progress > div { height: 100%; background: #0f62fe; transition: width .15s; }
    `;

    function injectStyle() {
        if (document.getElementById('rl-day-recap-style')) return;
        const s = document.createElement('style');
        s.id = 'rl-day-recap-style';
        s.textContent = css;
        document.head.appendChild(s);
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
                <button data-action="search">Search</button>
                <button data-action="resync" title="Re-sync recent plant list from pang">↻</button>
            </div>
            <div class="progress"><div style="width:0%"></div></div>
            <div class="results"></div>
            <div class="total"></div>
        `;
        document.body.appendChild(panel);

        const dateInput = panel.querySelector('input[type=date]');
        const searchBtn = panel.querySelector('[data-action=search]');
        const resyncBtn = panel.querySelector('[data-action=resync]');
        const list      = panel.querySelector('.results');
        const totalEl   = panel.querySelector('.total');
        const progress  = panel.querySelector('.progress > div');

        const ensureKnown = async () => {
            const known = GM_getValue(KEY_KNOWN_PLANTS, []);
            if (known.length > 0) return true;
            list.innerHTML = '<div class="empty">Fetching your recent plants from pang…<br><small>(briefly opens pang in a small window)</small></div>';
            const ok = await autoSyncFromPang();
            return ok;
        };

        const run = async () => {
            searchBtn.disabled = true;
            resyncBtn.disabled = true;
            totalEl.textContent = '';
            progress.style.width = '0%';
            try {
                const ok = await ensureKnown();
                if (!ok) {
                    list.innerHTML = '<div class="empty">Could not fetch plant list. Make sure pop-ups are allowed for kiona.rocketlane.com, or open <a href="http://tools.iwmac.local/pang.qxs" target="_blank">pang</a> manually.</div>';
                    return;
                }
                list.innerHTML = '<div class="empty">Querying pang…</div>';
                const iso = dateInput.value;
                const { visits, username, scanned } = await loadVisitsForDate(iso, (done, total) => {
                    progress.style.width = Math.round(done / total * 100) + '%';
                });
                progress.style.width = '100%';
                renderVisits(list, visits, iso, scanned);
                totalEl.innerHTML =
                    `<span>${escapeHtml(username)} · ${isoToNorwegianDate(iso)}</span>` +
                    `<span>${visits.length} plant${visits.length === 1 ? '' : 's'} of ${scanned} scanned</span>`;
            } finally {
                searchBtn.disabled = false;
                resyncBtn.disabled = false;
                setTimeout(() => { progress.style.width = '0%'; }, 800);
            }
        };

        const resync = async () => {
            resyncBtn.disabled = true;
            searchBtn.disabled = true;
            list.innerHTML = '<div class="empty">Re-syncing recent plants from pang…</div>';
            await autoSyncFromPang();
            await run();
        };

        searchBtn.addEventListener('click', run);
        resyncBtn.addEventListener('click', resync);
        dateInput.addEventListener('change', run);
        panel.querySelector('[data-action=close]').addEventListener('click', () => panel.remove());
        run();
        return panel;
    }

    function renderVisits(list, visits, isoDate, scanned) {
        list.innerHTML = '';
        if (scanned === 0) {
            list.innerHTML = `<div class="empty">No plants known yet. Open <a href="http://tools.iwmac.local/pang.qxs" target="_blank">pang</a> once so the script can pick up your recent plants.</div>`;
            return;
        }
        if (visits.length === 0) {
            list.innerHTML = `<div class="empty">Nothing logged for ${isoToNorwegianDate(isoDate)} across ${scanned} known plants.</div>`;
            return;
        }
        visits.forEach(v => {
            const url = `http://tools.iwmac.local/pang.qxs?plant_id=${encodeURIComponent(v.plant_id)}`;
            const div = document.createElement('div');
            div.className = 'row';
            div.innerHTML = `
                <a href="${url}" target="_blank">${escapeHtml(v.plant_id)}</a>
                <div class="name">
                    ${escapeHtml(v.name || '(name not yet captured)')}
                    <div class="actions">${escapeHtml(v.actions.join(', '))}</div>
                </div>
                <div class="time">${tsToLocalTime(v.first_ts)}</div>
            `;
            list.appendChild(div);
        });
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

    function initRocketlane() {
        injectStyle();
        buildButton();
        const observer = new MutationObserver(() => {
            if (!document.getElementById(BTN_ID) && document.body) buildButton();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ---------- Dispatch ----------
    if (host.endsWith('.plants.iwmac.local')) {
        recordPlantName();
    } else if (host === 'tools.iwmac.local') {
        syncFromPang();
    } else if (host === 'kiona.rocketlane.com') {
        initRocketlane();
    }
})();
