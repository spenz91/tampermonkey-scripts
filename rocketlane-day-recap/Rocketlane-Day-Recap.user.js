// ==UserScript==
// @name         Rocketlane Day Recap
// @version      1.0
// @description  Pick a date on Rocketlane My Timesheet and see what plants/projects you logged that day, with hours and notes.
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js
// @match        https://kiona.rocketlane.com/timesheets/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const PANEL_ID = 'rl-day-recap-panel';
    const BTN_ID = 'rl-day-recap-fab';

    const css = `
        #${BTN_ID} {
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483640;
            background: #0f62fe; color: #fff; border: none; border-radius: 24px;
            padding: 10px 16px; font: 600 13px/1.2 'IBM Plex Sans', system-ui, sans-serif;
            box-shadow: 0 6px 18px rgba(0,0,0,.25); cursor: pointer;
        }
        #${BTN_ID}:hover { background: #0043ce; }
        #${PANEL_ID} {
            position: fixed; bottom: 70px; right: 20px; width: 460px; max-height: 70vh;
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
            padding: 6px 12px; background: #0f62fe; color: #fff; border: none;
            border-radius: 4px; cursor: pointer; font-weight: 600;
        }
        #${PANEL_ID} .controls button:hover { background: #0043ce; }
        #${PANEL_ID} .results { overflow: auto; padding: 6px 0; flex: 1; }
        #${PANEL_ID} .row {
            padding: 10px 14px; border-bottom: 1px solid #f0f0f0; cursor: pointer;
        }
        #${PANEL_ID} .row:hover { background: #f4f4f4; }
        #${PANEL_ID} .row .title { font-weight: 600; }
        #${PANEL_ID} .row .meta { color: #525252; font-size: 12px; margin-top: 2px; }
        #${PANEL_ID} .row .notes {
            margin-top: 6px; padding: 6px 8px; background: #f4f4f4;
            border-left: 3px solid #0f62fe; border-radius: 2px; white-space: pre-wrap;
        }
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

    function getReactProps(el) {
        const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
        return key ? el[key] : null;
    }

    function todayISO() {
        const d = new Date();
        const tz = d.getTimezoneOffset() * 60000;
        return new Date(d - tz).toISOString().slice(0, 10);
    }

    function fmtMinutes(min) {
        if (!min) return '0m';
        const h = Math.floor(min / 60), m = min % 60;
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h}h`;
        return `${m}m`;
    }

    // Extract entries for a given ISO date (YYYY-MM-DD).
    function collectEntries(isoDate) {
        const cells = document.querySelectorAll(`td[data-time-cell="${isoDate}"], div[data-time-cell="${isoDate}"]`);
        // The actual <td> carries the React props with timeEntries; the inner <div> carries data-time-cell.
        // Walk to the <td>.
        const results = [];
        cells.forEach(node => {
            const td = node.closest('td');
            if (!td) return;
            const tr = td.closest('tr');
            if (!tr) return;

            const nameEls = tr.querySelectorAll('[data-cy="timesheet.primary.name"]');
            const project = nameEls[0]?.textContent?.trim() || '(unknown project)';
            const work = nameEls[1]?.textContent?.trim() || '';

            const props = getReactProps(td);
            const entries = (props && Array.isArray(props.timeEntries)) ? props.timeEntries : [];

            // Fallback: read displayed value from the input
            const input = td.querySelector('input[type=text]');
            const displayed = input?.value && input.value !== '—' ? input.value : null;

            if (entries.length === 0 && !displayed) return; // empty cell
            if (entries.length === 0 && displayed) {
                results.push({ project, work, time: displayed, notes: [] });
                return;
            }

            const totalMin = entries.reduce((s, e) => s + (e.minutes || e.duration || 0), 0);
            const notes = entries
                .map(e => {
                    // Notes can live under a few different keys depending on Rocketlane version.
                    const raw = e.notes || e.note || e.description || e.comment || e.commentHtml || '';
                    return stripHtml(String(raw)).trim();
                })
                .filter(Boolean);

            results.push({
                project,
                work,
                time: totalMin ? fmtMinutes(totalMin) : (displayed || ''),
                notes,
                td,
            });
        });
        return results;
    }

    function stripHtml(s) {
        const div = document.createElement('div');
        div.innerHTML = s;
        return div.textContent || '';
    }

    function render(results, isoDate) {
        const list = document.querySelector(`#${PANEL_ID} .results`);
        const totalEl = document.querySelector(`#${PANEL_ID} .total`);
        list.innerHTML = '';
        if (!results.length) {
            list.innerHTML = `<div class="empty">No time logged for ${isoDate}.<br><small>Make sure the timesheet week containing this date is open.</small></div>`;
            totalEl.textContent = '';
            return;
        }
        results.forEach(r => {
            const div = document.createElement('div');
            div.className = 'row';
            const notesHtml = r.notes && r.notes.length
                ? r.notes.map(n => `<div class="notes">${escapeHtml(n)}</div>`).join('')
                : '';
            div.innerHTML = `
                <div class="title">${escapeHtml(r.project)}${r.work ? ' — ' + escapeHtml(r.work) : ''}</div>
                <div class="meta">${escapeHtml(r.time)}</div>
                ${notesHtml}
            `;
            div.addEventListener('click', () => {
                if (r.td) {
                    r.td.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    r.td.style.transition = 'box-shadow .4s';
                    r.td.style.boxShadow = 'inset 0 0 0 2px #0f62fe';
                    setTimeout(() => { r.td.style.boxShadow = ''; }, 1500);
                }
            });
            list.appendChild(div);
        });
        totalEl.textContent = `${results.length} entr${results.length === 1 ? 'y' : 'ies'}`;
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
                <strong>Day Recap</strong>
                <button data-action="close">×</button>
            </header>
            <div class="controls">
                <input type="date" value="${todayISO()}">
                <button data-action="find">Find</button>
            </div>
            <div class="results"></div>
            <div class="total"></div>
        `;
        document.body.appendChild(panel);

        const dateInput = panel.querySelector('input[type=date]');
        const run = () => {
            const iso = dateInput.value;
            if (!iso) return;
            render(collectEntries(iso), iso);
        };
        panel.querySelector('[data-action=find]').addEventListener('click', run);
        dateInput.addEventListener('change', run);
        panel.querySelector('[data-action=close]').addEventListener('click', () => panel.remove());

        // auto-run on open
        setTimeout(run, 50);
        return panel;
    }

    function buildButton() {
        if (document.getElementById(BTN_ID)) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = '📅 Day Recap';
        btn.addEventListener('click', () => {
            const existing = document.getElementById(PANEL_ID);
            if (existing) existing.remove();
            else buildPanel();
        });
        document.body.appendChild(btn);
    }

    function init() {
        injectStyle();
        buildButton();
    }

    // Rocketlane is a SPA — keep the button alive across route changes.
    const observer = new MutationObserver(() => {
        if (!document.getElementById(BTN_ID) && document.body) buildButton();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
