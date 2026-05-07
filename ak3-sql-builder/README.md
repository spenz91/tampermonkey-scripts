# AK3 SQL Equipment Builder

A floating panel that overlays the phpMyAdmin frameset on IWMAC plant servers and generates the SQL needed to add a new equipment unit (`iw_sys_plant_units` + `iw_sys_plant_settings`).

## Install

[Click to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/ak3-sql-builder/AK3-SQL-Builder.user.js) (requires [Tampermonkey](https://www.tampermonkey.net/))

## Usage

1. Open the phpMyAdmin frameset on a plant (`*.plants.iwmac.local:*/secure/phpMyAdmin/...`).
2. The **AK3 SQL Equipment Builder** panel appears top-right. Hide it with `×` (small "AK3 SQL" button reopens it). Drag by the header to reposition.
3. Pick the equipment type, edit `unit_id` / `unit_name` / `driver_addr`.
4. Pick `mb_mode`:
   - `0 — RTU` → fills `comm_baudrate` + `comm_parity`.
   - `2 — TCP` → enter one or more IPs (use **+ Add IP**). Output is auto-numbered: `1;192.168.10.100;...`, `2;192.168.10.101;...`, etc.
5. Click **Generate SQL** → review in textarea → **Copy** → paste into the phpMyAdmin SQL tab and run.

## Notes (AI reference)

- Runs only on the top frameset window (`window.top === window`). The phpMyAdmin top page has no `<body>`, so the panel is appended to `document.documentElement` with `position: fixed`.
- Adding a new equipment type = one entry in the `EQUIPMENT` array at the top of the userscript.
- The script does **not** touch the per-driver `iw_par_*` / `iw_set_*` tables — those are assumed to already exist for the chosen equipment.
