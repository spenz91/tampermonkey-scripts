# SQL Equipment Import

A floating panel that overlays the phpMyAdmin frameset on IWMAC plant servers. Load a driver-template `.sql` from disk, edit unit rows + Modbus settings (RTU/TCP, multi-IP) in the form, and emit the full SQL ready to paste into the plant DB. The rest of the template (CREATE TABLE, parameter rows, set rows, processes, order_no, …) is emitted verbatim.

No database, no API. Everything happens client-side in the browser.

## Install

[Click to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js) (requires [Tampermonkey](https://www.tampermonkey.net/))

## Usage

1. Open phpMyAdmin on a plant (`*.plants.iwmac.local:*/secure/phpMyAdmin/...`) and select the plant DB. The panel appears top-right (drag header to move; `×` hides; click "SQL Import" to reopen).
2. Click **Driver template (.sql file)** → pick the driver SQL from disk (e.g. `SLV_105N4627-v2.sql`). The form populates from the file:
   - **Unit rows** — pre-filled from the `iw_sys_plant_units` block in the template; rename / add (`+`) / remove (`−`).
   - **mb_mode** (RTU/TCP/…), **comm_baudrate**, **comm_parity** — pre-filled from the template's `iw_sys_plant_settings`; edit as needed.
   - **mb_tcp_servers** — only shown when mb_mode is TCP. One IP per row, auto-numbered: `1;ip;502;1000;2;1000`, `2;ip;...`, etc.
3. Click **Generate SQL** → review in textarea → **Copy** → paste into the phpMyAdmin SQL tab → Run.

The output is the full template SQL with the unit-rows block rebuilt from the form and the editable settings patched in place. When TCP is selected, an `mb_tcp_servers` row is injected into `iw_sys_plant_settings` (or its existing value updated). Everything else in the template is emitted byte-for-byte.

## Notes (AI reference)

- Runs only on the top frameset window (`window.top === window`); the phpMyAdmin top page has no `<body>`, so the panel is appended to `document.documentElement` with `position: fixed`.
- The runtime SQL parser (`parseBlock` + `extractTuples` + `splitFields`) is single-quote-aware (`''` escape) and locates `iw_sys_plant_units` and `iw_sys_plant_settings` by name. Editable fields are looked up by column name (`unit_id`, `unit_name`, `driver_addr` / `driver_adr`, plus the named `EDITABLE_SETTINGS`).
- Single-quote escaping doubles `'` → `''`; backslashes are escaped as `\\` to be safe across MariaDB modes.
- The script never talks to a backend — `@grant` is `GM_setClipboard` only, no `@connect`.
