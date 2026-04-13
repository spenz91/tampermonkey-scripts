# AK3-Autoscan

## Install

> Requires [Tampermonkey](https://www.tampermonkey.net/) browser extension.

### [Click here to install AK3 Auto Scan](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/AK3-Autoscan.user.js)

The script auto-updates — when a new version is pushed here, Tampermonkey will update it automatically.

---

## AI Reference

> Compact context for Claude / AI assistants. Read this instead of the full script to save tokens.

## What it is

A Tampermonkey userscript (`AK3-Autoscan.user.js`, v5.2) that automates the AK3 scanner setup workflow on `*.plants.iwmac.local:8080/secure/ak3_setup/*`.

## Key constants

| Constant | Value |
|---|---|
| `LOCAL_IP` | `192.168.10.10` |
| `REMOTE_IP` | `192.168.10.20` |
| `STATE_KEY` | `ak3_state` (GM storage) |
| `LOG_KEY` | `ak3_log` (GM storage, max 300 lines) |
| `X_CALLER` | `AK3-Autoscan` |

## Workflow steps (linear state machine)

Each step is persisted in GM storage so it survives page reloads.

### 1. `dbcheck`
- Opens the **DB Sjekk** tab (`li#databasetest`)
- If both `iw_plant_server3 : OK` and `iw_ak3_scanner : OK` are present, skips to next step
- If `button#create_scan_db` ("Lag database iw_ak3_scanner") exists, clicks it and waits for `"Database opprettet"` message
- Proceeds to ipconfig

### 2. `ipconfig`
- Opens the **IP Config** tab
- Sets `localIp` = `192.168.10.10`, `remoteIp` = `192.168.10.20`
- Enables HTTPS checkbox, clicks **"Test tilkobling til AK-SM850"**
- If test fails (no Save button), disables HTTPS and retries up to 5 times with increasing wait
- Clicks **"Lagre ip-adresser i scanner database"**, waits for `"IPer oppdatert"`
- If all retries fail, shows a yellow banner and waits indefinitely for user to fix manually

### 3. `scan`
- Opens the **Scan** tab, clicks **"Scan anlegg"**
- Polls an iframe for `#percent` reaching `100%` or `#done` containing `"Scan done"`
- **Timeout: 2 hours** (7,200,000 ms) — line ~474

### 4. `default_links`
- Opens **Default links** tab
- Clicks **"Sett alle til forste med Therm"** then **"Lagre default links"**
- Waits for `"Default links oppdatert"`

### 5. `copyplant`
- Opens **"Kopier til anlegg"** tab
- Clicks **"Kopier og overskriv ALT"**, auto-confirms dialog if present
- Waits for `"Database kopiert"`

### 6. `activate`
- Opens **"Aktiver anlegg"** tab, clicks **"Aktiver alle"**
- Waits for `"Enheter aktivert"`
- Sets AK3 mode back to **StandardMode**, clears state, shows completion alert

## AK3 mode switching

| Mode | packet_timeout | packet_interval |
|---|---|---|
| ScannerMode (before scan) | 100 | 400 |
| StandardMode (after scan) | 10 | 4000 |

Done via SQL UPDATE to `iw_plant_server3.iw_sys_plant_settings` through `http://toolbox.iwmac.local:8505/plant-sql/`.
Also logs `pma_local` via JSON-RPC to `http://tools.iwmac.local/services/pang/actions.php`.

## UI elements

- **"Auto Scan" button**: Green button injected at top of `#mainmenu` sidebar
- **Debug panel**: Fixed top-right overlay with timestamped log. Has clear/minimize/close buttons. Only shown during active scan.

## Helper functions

| Function | Purpose |
|---|---|
| `waitFor(selector, {timeout})` | Polls DOM for element, default 30s |
| `waitForText(selector, text, {timeout})` | Polls DOM for element containing text, default 30s |
| `clickEl(el)` | Clicks via `.click()`, `MouseEvent`, and jQuery `$.trigger()` |
| `setInput(el, value)` | Sets value via property descriptor + fires input/change/keyup/blur |
| `enableButton(el)` | Force-enables a disabled button |
| `gmPost(url, body)` | `GM_xmlhttpRequest` POST wrapper returning parsed JSON |
| `sleep(ms)` | Promise-based delay |
| `clickTab(id)` | Clicks `li#id` menu tab and waits 400ms |

## GM grants

`GM_setValue`, `GM_getValue`, `GM_deleteValue`, `GM_xmlhttpRequest`

## Files

| File | Purpose |
|---|---|
| `AK3-Autoscan.user.js` | Main userscript (install in Tampermonkey) |
| `Ak3.js.txt` | Backup/reference copy (may be outdated) |

## Failure handling

`fail(msg)` shows alert, clears state, throws to abort. Non-critical errors (e.g. `pma_local` logging) are caught and logged but don't stop the workflow.
