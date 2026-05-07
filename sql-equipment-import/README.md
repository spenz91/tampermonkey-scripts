# SQL Equipment Import

A floating panel that overlays the phpMyAdmin frameset on IWMAC plant servers and emits the full equipment-import SQL. Templates live in a Toolbox MariaDB database (`sql_equipment_import`); the script talks to it via the toolbox-sql HTTP API. Editable parts of the template (unit rows, Modbus settings, multi-IP TCP) are surfaced in the UI; everything else (CREATE TABLE, parameter rows, etc.) is emitted verbatim.

## Install

[Click to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/sql-equipment-import/SQL-Equipment-Import.user.js) (requires [Tampermonkey](https://www.tampermonkey.net/))

## One-time database setup

Run [db-setup.sql](db-setup.sql) **once** on the Toolbox MariaDB (HeidiSQL / mysql CLI / local phpMyAdmin) — it creates the `sql_equipment_import` database and `templates` table. It can't run via the toolbox-sql API because `CREATE` is blocked there.

## Architecture

- API: `http://toolbox.iwmac.local:8505/toolbox-sql` (toolbox-sql, allows SELECT/INSERT/UPDATE/DELETE; max 64 KB per request)
- DB: `sql_equipment_import`
- Table: `templates(id, name, display_name, driver_type, sql_text, notes, created_at, updated_at)`
- The userscript uses `GM_xmlhttpRequest` (with `@connect toolbox.iwmac.local`) to bypass browser CORS.

## Usage

### Builder tab

1. Open phpMyAdmin on a plant. The panel appears top-right (drag header to move; `×` hides; click "SQL Import" to reopen).
2. Pick an equipment template from the dropdown (loaded from the Toolbox DB on script start).
3. The form populates from the template:
   - **Unit rows** — pre-filled from `iw_sys_plant_units` in the template; rename / add (`+`) / remove (`−`).
   - **mb_mode** (RTU/TCP/…), **comm_baudrate**, **comm_parity** — pre-filled from the template's settings; edit as needed.
   - **mb_tcp_servers** — only shown when mb_mode is TCP. One IP per row, auto-numbered: `1;ip;502;1000;2;1000`, `2;ip;...`, etc.
4. **Generate SQL** → review in textarea → **Copy** → paste into the phpMyAdmin SQL tab and run.

The output is the full template SQL with the unit-rows block rebuilt from the form, the editable settings patched in place, and (when TCP) an `mb_tcp_servers` row injected into the `iw_sys_plant_settings` block. All other content (`iw_par_*`, `iw_set_*`, `iw_sys_processes`, `iw_sys_order_no`, etc.) is emitted as-is.

### Manage templates tab

- **Saved templates** — lists what's in the DB, with a `×` to delete each.
- **Import a template** — pick a `.sql` file from disk, the script auto-fills the internal name / display name / driver_type (parsed from `iw_sys_processes` or the units block); click **Save to toolbox** to `REPLACE INTO templates`.

## Notes (AI reference)

- Runs only on the top frameset window (`window.top === window`); the phpMyAdmin top page has no `<body>`, so the panel is appended to `document.documentElement` with `position: fixed`.
- Template parsing is done at runtime from `sql_text` (no separate JSON metadata column). Editable fields are located by name (`unit_id`, `unit_name`, `driver_addr`, and the named settings in `EDITABLE_SETTINGS`).
- API result shape is normalised via `rowsOf()` (handles `rows`/`data`/`result`/raw array variants).
- Single-quote escaping doubles `'` → `''`; backslashes are escaped as `\\` to be safe across MariaDB modes.
- 64 KB API request cap is checked client-side before INSERT (`sql.length + ~200 < 60000`); larger templates need to be split or the API limit raised.
