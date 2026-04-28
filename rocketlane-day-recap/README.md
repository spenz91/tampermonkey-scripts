# Rocketlane Day Recap

Adds a 🏭 **Day Recap** button on **pang.qxs** — pick a date and see every IWMAC plant you visited that day (plant_id, plant name, time of first action, and which actions you performed).

Rocketlane's My Timesheet gets a small button that just opens pang with the date pre-filled — pang has the live, authoritative plant data, so the recap runs there.

## Install

[Click here to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js) (requires Tampermonkey).

## Usage

### From pang
1. Open `http://tools.iwmac.local/pang.qxs`
2. Click 🏭 **Day Recap** (bottom-right)
3. Pick a date → **Search**
4. Lists every plant where you have actions logged on that date

By default, only your 50 recent plants are scanned (fast, ~2-3 sec). Tick **Scan all plants** to scan the full IWMAC inventory (~7600 plants, ~30 sec) for older visits.

### From Rocketlane
1. On `kiona.rocketlane.com/timesheets/...` click 🏭 **Day Recap**
2. Pick a date → **Open on pang ↗** opens pang in a new tab with the panel auto-populated

## How it works

Pang already loads `module_plants.coll.data` — the full plant inventory with names — into memory the moment `pang.qxs` opens. The script reads that directly. No SQL, no caches to maintain, no cross-origin sync issues.

For each plant in scope, it calls pang's existing `actions.php` with `method:"get_history"`. Same origin, your existing pang session cookie is used automatically.

## Why v4 is a clean break

v3.x tried to mirror pang's data into Tampermonkey storage so a panel on Rocketlane could read it. That ran into popup blockers, cross-origin localStorage walls, GM-storage sync gaps, and stale name caches. v4 sidesteps all of that by putting the panel where the data lives.

## Limitations

- "Recent plants" mode only scans your last 50 plants (pang's own recent list). Plants you haven't touched recently won't be queried unless you tick "Scan all plants".
- Pang's API is per-plant (`get_history(plant_id)`) — there's no server-side "list everything user X did on date Y" endpoint, so the script has to fan out. The full-scan mode does ~7600 requests at 8 in parallel.
