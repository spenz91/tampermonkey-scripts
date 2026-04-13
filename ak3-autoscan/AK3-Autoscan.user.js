// ==UserScript==
// @name         AK3 Auto Scan
// @version      6.5
// @description  Automate AK3 scanner setup workflow
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/ak3-autoscan/AK3-Autoscan.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/ak3-autoscan/AK3-Autoscan.user.js
// @match        http://*.plants.iwmac.local:8080/secure/ak3_setup/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      toolbox.iwmac.local
// @connect      toolbox.iwmac.local:8505
// @connect      tools.iwmac.local
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const X_CALLER = 'AK3-Autoscan';
    function makeUuid() {
        return (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
    }
    let _runId = makeUuid();
    let _runIdPlant = null;
    function ensureRunIdForPlant(plantId) {
        const pid = String(plantId || '');
        if (pid && _runIdPlant !== pid) {
            _runId = makeUuid();
            _runIdPlant = pid;
            try { log('New X-Run-Id for plant ' + pid + ': ' + _runId); } catch (e) {}
        }
        return _runId;
    }

    const LOCAL_IP  = '192.168.10.10';
    const REMOTE_IP = '192.168.10.20';
    const STATE_KEY = 'ak3_state';

    const getState = () => GM_getValue(STATE_KEY, null);
    const setState = (s) => GM_setValue(STATE_KEY, { ...s, ts: Date.now() });
    const clearState = () => GM_deleteValue(STATE_KEY);

    const LOG_KEY = 'ak3_log';
    function ts() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    function log(...a) {
        const line = '[' + ts() + '] ' + a.map(x =>
            typeof x === 'string' ? x : JSON.stringify(x)).join(' ');
        console.log('[AK3]', ...a);
        const arr = GM_getValue(LOG_KEY, []);
        arr.push(line);
        while (arr.length > 300) arr.shift();
        GM_setValue(LOG_KEY, arr);
        renderDebugPanel();
    }
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function describe(el) {
        if (!el) return '<null>';
        const txt = (el.value || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        const id  = el.id ? '#' + el.id : '';
        const cls = el.className && typeof el.className === 'string'
            ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
        return (txt ? '"' + txt + '" ' : '') + el.tagName.toLowerCase() + id + cls;
    }
    function clickEl(el, label) {
        log('Click → ' + (label || describe(el)));
        try { el.click(); } catch (e) {}
        // Dispatch a real MouseEvent too — some handlers don't react to .click().
        try {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        } catch (e) {}
        // If jQuery is present (it is on ak3_setup), also trigger via jQuery.
        try {
            const jq = window.jQuery || window.$;
            if (jq && typeof jq === 'function') jq(el).trigger('click');
        } catch (e) {}
    }

    // ---------- AK3 mode via direct SQL API (replaces pang.qxs round-trip) ----------
    function gmPost(url, body) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST', url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Caller': X_CALLER,
                    'X-Run-Id': _runId
                },
                data: body,
                onload: (r) => {
                    try { resolve(JSON.parse(r.responseText)); }
                    catch (e) { reject(new Error('Bad JSON: ' + r.responseText.slice(0, 200))); }
                },
                onerror: () => reject(new Error('Network error: ' + url)),
                ontimeout: () => reject(new Error('Timeout: ' + url))
            });
        });
    }

    async function setAk3Mode(plantId, mode) {
        // mode: 'ScannerMode' (timeout=100, interval=400) or 'StandardMode' (timeout=10, interval=4000)
        const values = mode === 'ScannerMode'
            ? { timeout: '100', interval: '400' }
            : { timeout: '10',  interval: '4000' };
        const sql =
            "UPDATE `iw_plant_server3`.`iw_sys_plant_settings` " +
            "SET `value` = CASE " +
            "WHEN `setting` = 'packet_timeout' THEN '" + values.timeout + "' " +
            "WHEN `setting` = 'packet_interval' THEN '" + values.interval + "' " +
            "ELSE `value` END, `row_date` = NOW() " +
            "WHERE `owner` = 'AK3' " +
            "AND `setting` IN ('packet_timeout', 'packet_interval');";
        ensureRunIdForPlant(plantId);
        log('SQL: set AK3 ' + mode + ' for plant ' + plantId +
            ' (packet_timeout=' + values.timeout + ', packet_interval=' + values.interval + ')');
        const params = new URLSearchParams();
        params.append('plant_id', String(plantId));
        params.append('sql_command', sql);
        const data = await gmPost('http://toolbox.iwmac.local:8505/plant-sql/', params.toString());
        if (!data || !data.success) {
            throw new Error('AK3 mode update failed: ' + JSON.stringify(data).slice(0, 200));
        }
        log('AK3 mode set to ' + mode + ' OK');
        try { await logPmaLocal(plantId); }
        catch (e) { log('pma_local log failed (non-fatal): ' + e.message); }
    }

    async function logPmaLocal(plantId) {
        ensureRunIdForPlant(plantId);
        const payload = [{
            jsonrpc: '2.0', method: 'log',
            params: { plant_id: String(plantId), action: 'pma_local' },
            id: 0
        }];
        await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'http://tools.iwmac.local/services/pang/actions.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
                    'X-Caller': X_CALLER,
                    'X-Run-Id': _runId
                },
                data: JSON.stringify(payload),
                onload: (r) => {
                    try {
                        const d = JSON.parse(r.responseText);
                        if (d && d.jsonrpc === '2.0' && d.result === true) { log('pma_local logged'); resolve(); }
                        else reject(new Error('pma_local non-success: ' + r.responseText.slice(0, 200)));
                    } catch (e) { reject(new Error('pma_local bad JSON')); }
                },
                onerror: () => reject(new Error('pma_local network error'))
            });
        });
    }

    function injectDebugPanel() {
        if (document.getElementById('ak3-debug-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'ak3-debug-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '10px', right: '10px', width: '380px',
            maxHeight: '70vh', zIndex: 999998, background: 'rgba(17,24,39,.95)',
            color: '#e5e7eb', font: '11px/1.4 monospace',
            border: '1px solid #374151', borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,.4)', display: 'flex',
            flexDirection: 'column'
        });
        panel.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;' +
            'padding:6px 8px;background:#1f2937;border-radius:6px 6px 0 0;">' +
            '<strong style="color:#10b981">AK3 Debug</strong>' +
            '<span><button id="ak3-debug-clear" style="margin-right:4px;cursor:pointer;' +
            'background:#374151;color:#fff;border:none;padding:2px 6px;border-radius:3px;">clear</button>' +
            '<button id="ak3-debug-toggle" style="margin-right:4px;cursor:pointer;background:#374151;color:#fff;' +
            'border:none;padding:2px 6px;border-radius:3px;">−</button>' +
            '<button id="ak3-debug-close" title="Close debug window" ' +
            'style="cursor:pointer;background:#dc2626;color:#fff;border:none;' +
            'padding:4px 12px;border-radius:3px;font-weight:700;font-size:14px;">× Close</button>' +
            '</span></div>' +
            '<pre id="ak3-debug-body" style="margin:0;padding:8px;overflow:auto;' +
            'flex:1;white-space:pre-wrap;word-break:break-word;"></pre>';
        document.body.appendChild(panel);
        panel.querySelector('#ak3-debug-clear').onclick = () => {
            GM_setValue(LOG_KEY, []);
            renderDebugPanel();
        };
        const body = panel.querySelector('#ak3-debug-body');
        panel.querySelector('#ak3-debug-toggle').onclick = (e) => {
            const hidden = body.style.display === 'none';
            body.style.display = hidden ? 'block' : 'none';
            e.target.textContent = hidden ? '−' : '+';
        };
        panel.querySelector('#ak3-debug-close').onclick = () => {
            GM_setValue('ak3_panel_closed', true);
            panel.remove();
        };
        renderDebugPanel();
    }
    function renderDebugPanel() {
        const body = document.getElementById('ak3-debug-body');
        if (!body) return;
        const arr = GM_getValue(LOG_KEY, []);
        body.textContent = arr.join('\n');
        body.scrollTop = body.scrollHeight;
    }

    function waitFor(selector, { timeout = 30000 } = {}) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const tick = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error('timeout: ' + selector));
                setTimeout(tick, 200);
            };
            tick();
        });
    }
    function waitForText(selector, text, { timeout = 30000 } = {}) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const tick = () => {
                const el = document.querySelector(selector);
                if (el && el.textContent.includes(text)) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error('timeout text: ' + text));
                setTimeout(tick, 200);
            };
            tick();
        });
    }
    function fail(msg) {
        alert('[AK3] STOPPED: ' + msg);
        clearState();
        throw new Error(msg);
    }
    function getPlantIdFromHost() {
        const m = location.host.match(/^(\d+)\.plants\.iwmac\.local/);
        return m ? m[1] : null;
    }
    function setInput(el, value) {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('keyup',  { bubbles: true }));
        el.dispatchEvent(new Event('blur',   { bubbles: true }));
        try {
            const jq = window.jQuery || window.$;
            if (jq && typeof jq === 'function') jq(el).trigger('input').trigger('change').trigger('keyup').trigger('blur');
        } catch (e) {}
    }
    function enableButton(el) {
        if (!el) return;
        try {
            el.disabled = false;
            el.removeAttribute('disabled');
            el.removeAttribute('aria-disabled');
            el.classList.remove('disabled');
            el.style.pointerEvents = 'auto';
            el.style.opacity = '1';
        } catch (e) {}
    }
    async function clickTab(id) {
        const li = await waitFor('li#' + id);
        clickEl(li, 'Tab: ' + (li.textContent || id).trim());
        await sleep(400);
    }
    // ---------- Inject Auto Scan button into side menu ----------
    function injectMenuButton() {
        const menu = document.getElementById('mainmenu');
        if (!menu || document.getElementById('ak3-autoscan')) return;
        const li = document.createElement('li');
        li.id = 'ak3-autoscan';
        li.textContent = '▶ Auto Scan';
        Object.assign(li.style, {
            background: '#16a34a', color: '#fff', fontWeight: '700',
            cursor: 'pointer', padding: '8px', marginBottom: '6px',
            borderRadius: '4px', textAlign: 'center'
        });
        li.onclick = async () => {
            const plantId = getPlantIdFromHost();
            if (!plantId) return alert('No plant id in host');
            GM_setValue(LOG_KEY, []);
            GM_deleteValue('ak3_panel_closed');
            injectDebugPanel();
            log('Auto Scan started for plant ' + plantId);
            try {
                await setAk3Mode(plantId, 'ScannerMode');
            } catch (e) {
                return fail('Failed to set ScannerMode: ' + e.message);
            }
            setState({ plantId, step: 'dbcheck' });
            runAk3Setup(false);
        };
        menu.insertBefore(li, menu.firstChild);
    }

    // ---------- Main workflow on ak3_setup (step-driven, survives reloads) ----------
    async function runAk3Setup(manual = false) {
        const plantId = getPlantIdFromHost();
        if (!plantId) return;
        let state = getState();
        if (manual) {
            state = { plantId, step: 'dbcheck' };
            setState(state);
        }
        if (!state || state.plantId !== plantId) return;

        try {
            while (true) {
                state = getState();
                if (!state) return;
                log('=== Step: ' + state.step + ' ===');

                if (state.step === 'dbcheck') {
                    log('Opening DB Sjekk tab');
                    await clickTab('databasetest');

                    // Wait for the test-box results to appear in the DOM
                    await waitFor('.test-box', { timeout: 10000 });
                    await sleep(500);

                    // Check each database individually by inspecting its own test-box text
                    const testBoxes = document.querySelectorAll('.test-box p');
                    let server3Ok = false;
                    let scannerOk = false;
                    testBoxes.forEach(p => {
                        const txt = p.textContent;
                        if (txt.includes('iw_plant_server3') && txt.includes('OK')) server3Ok = true;
                        if (txt.includes('iw_ak3_scanner') && txt.includes('OK')) scannerOk = true;
                    });
                    log('DB status — iw_plant_server3: ' + (server3Ok ? 'OK' : 'NOT OK') +
                        ', iw_ak3_scanner: ' + (scannerOk ? 'OK' : 'NOT OK'));

                    if (server3Ok && scannerOk) {
                        log('Both databases OK — skipping creation');
                    } else {
                        // Wait for the "Lag database" button to appear
                        try {
                            const createBtn = await waitFor('button#create_scan_db', { timeout: 10000 });
                            log('Scanner database missing — clicking "Lag database iw_ak3_scanner"');
                            clickEl(createBtn, 'Lag database iw_ak3_scanner');
                            log('Waiting for "Database opprettet" confirmation');
                            await waitForText('#message', 'Database opprettet', { timeout: 30000 });
                            log('Database created successfully');
                        } catch (e) {
                            log('No create button found — continuing anyway');
                        }
                    }

                    await sleep(500);
                    setState({ plantId, step: 'ipconfig' });
                }
                else if (state.step === 'ipconfig') {
                    // Save attempt number so we can cycle HTTPS on/off across reloads
                    const attempt = (state.ipAttempt || 0) + 1;
                    const httpsOn = (attempt % 2 === 1); // odd = HTTPS on, even = HTTPS off
                    const label = 'attempt ' + attempt + ' (HTTPS ' + (httpsOn ? 'ON' : 'OFF') + ')';

                    // Save state BEFORE doing anything so page reload resumes at ipconfig_wait
                    setState({ plantId, step: 'ipconfig_wait', ipAttempt: attempt });
                    log('--- IP Config ' + label + ' ---');

                    log('Opening IP Config tab');
                    await clickTab('ipconfig');

                    // Set IP addresses first
                    const local  = await waitFor('input#localIp');
                    const remote = await waitFor('input#remoteIp');
                    log('Setting localIp = ' + LOCAL_IP);
                    setInput(local,  LOCAL_IP);
                    local.value = LOCAL_IP;
                    log('Setting remoteIp = ' + REMOTE_IP);
                    setInput(remote, REMOTE_IP);
                    remote.value = REMOTE_IP;
                    await sleep(500);
                    // Verify IPs are set correctly
                    if (local.value !== LOCAL_IP) { local.value = LOCAL_IP; log('localIp re-forced'); }
                    if (remote.value !== REMOTE_IP) { remote.value = REMOTE_IP; log('remoteIp re-forced'); }
                    log('IPs confirmed — localIp: ' + local.value + ', remoteIp: ' + remote.value);

                    // Then toggle HTTPS
                    const h = await waitFor('input#httpsForm');
                    log('HTTPS checkbox found — checked: ' + h.checked);
                    if (httpsOn && !h.checked) {
                        log('Enabling HTTPS checkbox');
                        clickEl(h, 'HTTPS checkbox (on)');
                    } else if (!httpsOn && h.checked) {
                        log('Disabling HTTPS checkbox');
                        h.click();
                        if (h.checked) {
                            h.checked = false;
                            h.dispatchEvent(new Event('change', { bubbles: true }));
                            h.dispatchEvent(new Event('click',  { bubbles: true }));
                        }
                        log('HTTPS checkbox forced off (checked=' + h.checked + ')');
                    }
                    await sleep(300);

                    log('Clicking "Test tilkobling til AK-SM850"');
                    const ipFormBtn = await waitFor('input#ipForm');
                    enableButton(ipFormBtn);
                    clickEl(ipFormBtn, 'Test tilkobling til AK-SM850 (' + label + ')');
                    log('Waiting for test result (up to 30s)...');

                    // Poll for result — #remoteIpOk visible = success, #remoteIp.invalid = fail
                    const testResult = await new Promise((resolve) => {
                        const start = Date.now();
                        const tick = () => {
                            const okDiv = document.querySelector('#remoteIpOk');
                            if (okDiv && okDiv.style.display !== 'none') {
                                return resolve('ok');
                            }
                            const remoteInput = document.querySelector('#remoteIp');
                            if (remoteInput && remoteInput.classList.contains('invalid')) {
                                return resolve('invalid');
                            }
                            if (Date.now() - start > 30000) return resolve('timeout');
                            setTimeout(tick, 500);
                        };
                        tick();
                    });
                    log('Test result: ' + testResult);

                    if (testResult === 'ok') {
                        log('AK-SM 850 funnet! — waiting for Save button...');
                        const saveBtn = await waitFor('button#ipSave', { timeout: 15000 });
                        // Clear old message so we don't match stale text
                        const msgEl = document.querySelector('#message');
                        if (msgEl) { msgEl.textContent = ''; msgEl.classList.add('hidden'); }
                        log('Clicking Save');
                        clickEl(saveBtn, 'Lagre ip-adresser i scanner database');
                        log('Waiting for "IPer oppdatert"...');
                        await new Promise((resolve, reject) => {
                            const start = Date.now();
                            const tick = () => {
                                const el = document.querySelector('#message');
                                if (el && !el.classList.contains('hidden') && el.textContent.includes('IPer oppdatert')) {
                                    return resolve();
                                }
                                if (Date.now() - start > 30000) return reject(new Error('timeout'));
                                setTimeout(tick, 200);
                            };
                            tick();
                        });
                        log('IPer oppdatert — waiting 3s...');
                        await sleep(3000);
                        // Verify "Server config satt til" matches localIp
                        const localIpValue = document.querySelector('input#localIp') ? document.querySelector('input#localIp').value : LOCAL_IP;
                        const configEm = document.querySelector('#content em');
                        const serverConfig = configEm ? configEm.textContent : '';
                        log('Server config: ' + serverConfig + ' — localIp: ' + localIpValue);
                        if (serverConfig && !serverConfig.includes(localIpValue)) {
                            log('WARNING: Server config IP does not match localIp — retrying');
                            if (attempt < 4) {
                                setState({ plantId, step: 'ipconfig', ipAttempt: attempt });
                                await sleep(500);
                                continue;
                            }
                            log('Max attempts reached — continuing anyway');
                        }
                        log('IP config done — continuing to scan');
                        setState({ plantId, step: 'scan' });
                    } else {
                        // Test failed — retry with different HTTPS or fall back to manual
                        if (attempt >= 4) {
                            log('All 4 attempts failed — waiting for manual fix');
                            let banner = document.getElementById('ak3-manual-banner');
                            if (!banner) {
                                banner = document.createElement('div');
                                banner.id = 'ak3-manual-banner';
                                Object.assign(banner.style, {
                                    position: 'fixed', top: '10px', left: '50%',
                                    transform: 'translateX(-50%)', zIndex: 999999,
                                    background: '#f59e0b', color: '#000',
                                    padding: '10px 16px', borderRadius: '6px',
                                    fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,.3)'
                                });
                                banner.textContent = 'AK3: Check IPs and click Test then Lagre. Waiting for "IPer oppdatert"...';
                                document.body.appendChild(banner);
                            }
                            await waitForText('#message', 'IPer oppdatert', { timeout: 24 * 3600 * 1000 });
                            banner.remove();
                            const cont = confirm('IPer oppdatert ✓\n\nContinue Auto Scan?');
                            if (!cont) { clearState(); return; }
                            setState({ plantId, step: 'scan' });
                        } else {
                            log('Test failed on attempt ' + attempt + ' — retrying with HTTPS ' + (httpsOn ? 'OFF' : 'ON'));
                            setState({ plantId, step: 'ipconfig', ipAttempt: attempt });
                        }
                    }
                    await sleep(500);
                }
                else if (state.step === 'ipconfig_wait') {
                    // Page reload recovery — test button caused a reload
                    // Just retry from ipconfig with same attempt number
                    const attempt = state.ipAttempt || 1;
                    log('Page reloaded during IP test — resuming at attempt ' + attempt);
                    setState({ plantId, step: 'ipconfig', ipAttempt: attempt - 1 });
                }
                else if (state.step === 'scan') {
                    log('Opening Scan tab');
                    await clickTab('scan');
                    await sleep(500);
                    const scanBtn = await waitFor('input#scanButton');
                    clickEl(scanBtn, 'Scan anlegg');
                    log('Scan started — waiting for completion (up to 2 hours)');
                    log('scan triggered; polling iframe for completion');

                    const getIframeDoc = () => {
                        const f = document.querySelector('#scanWindow iframe, iframe[src*="iframe/scan"]');
                        try { return f && (f.contentDocument || f.contentWindow.document); }
                        catch { return null; }
                    };

                    await new Promise((resolve, reject) => {
                        const start = Date.now();
                        const tick = () => {
                            const doc = getIframeDoc();
                            if (doc) {
                                const pct = doc.querySelector('#percent');
                                const doneEl = doc.querySelector('#done');
                                if (pct && pct.textContent.includes('100%')) return resolve();
                                if (doneEl && doneEl.offsetParent !== null &&
                                    doneEl.textContent.includes('Scan done')) return resolve();
                            }
                            if (Date.now() - start > 7200000) return reject(new Error('scan timeout'));
                            setTimeout(tick, 500);
                        };
                        tick();
                    });
                    log('Scan completed');
                    await sleep(1200);
                    setState({ plantId, step: 'default_links' });
                }
                else if (state.step === 'default_links') {
                    log('Opening Default links tab');
                    await clickTab('default_links');
                    log('Waiting for "Sett alle til første med Therm" button');
                    clickEl(await waitFor('button#selectTherm', { timeout: 600000 }),
                            'Sett alle til første med "Therm" i navn');
                    await sleep(600);
                    clickEl(await waitFor('button#save_default_links', { timeout: 600000 }),
                            'Lagre default links');
                    log('Waiting for "Default links oppdatert" confirmation');
                    await waitForText('#message', 'Default links oppdatert', { timeout: 600000 });
                    log('Default links updated');
                    log('Waiting for loading message to disappear (up to 1 hour)...');
                    await new Promise((resolve, reject) => {
                        const start = Date.now();
                        const tick = () => {
                            const content = document.querySelector('#content');
                            if (!content || !content.textContent.includes('Vennligst vent mens default links laster')) {
                                return resolve();
                            }
                            if (Date.now() - start > 3600000) return reject(new Error('default links loading timeout'));
                            setTimeout(tick, 500);
                        };
                        tick();
                    });
                    log('Loading complete — ready to continue');
                    await sleep(500);
                    setState({ plantId, step: 'copyplant' });
                }
                else if (state.step === 'copyplant') {
                    log('Opening Kopier til anlegg tab');
                    await clickTab('copyplant');
                    log('Waiting for "Kopier og overskriv ALT" button');
                    clickEl(await waitFor('button#copy_db', { timeout: 600000 }),
                            'Kopier og overskriv ALT');
                    const maybeOk = document.querySelector('button.pang-confirm-ok');
                    if (maybeOk) { clickEl(maybeOk, 'Confirm OK (copy db)'); await sleep(300); }
                    log('Waiting for "Database kopiert" confirmation');
                    await waitForText('#message', 'Database kopiert', { timeout: 600000 });
                    log('Database copied');
                    await sleep(500);
                    setState({ plantId, step: 'activate' });
                }
                else if (state.step === 'activate') {
                    log('Opening Aktiver anlegg tab');
                    await clickTab('activate');
                    log('Waiting for "Aktiver alle" button');
                    clickEl(await waitFor('button#activateAllButton', { timeout: 600000 }),
                            'Aktiver alle');
                    log('Waiting for "Enheter aktivert" confirmation');
                    await waitForText('#message', 'Enheter aktivert', { timeout: 600000 });
                    log('Devices activated');
                    await sleep(500);
                    try {
                        await setAk3Mode(plantId, 'StandardMode');
                    } catch (e) {
                        return fail('Failed to set StandardMode: ' + e.message);
                    }
                    clearState();
                    log('AK3 Scan Completed for plant ' + plantId);
                    alert('AK3 Scan Completed ✔\nPlant ' + plantId);
                    return;
                }
                else {
                    return;
                }
            }
        } catch (e) {
            fail(e.message);
        }
    }

    // ---------- Router ----------
    // Only show the debug panel when an Auto Scan is in progress AND
    // the user hasn't manually closed it.
    if (getState() && !GM_getValue('ak3_panel_closed', false)) injectDebugPanel();

    if (getPlantIdFromHost()) {
        injectMenuButton();
    }
})();