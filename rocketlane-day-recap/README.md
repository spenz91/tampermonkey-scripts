# Rocketlane Day Recap

Tracks every IWMAC plant page you open, then on Rocketlane My Timesheet adds a 🏭 **Plants visited** button — pick a date and see the list of plants you opened that day.

## Install

[Click here to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js) (requires Tampermonkey).

## Usage

1. Install the script.
2. Use IWMAC normally — every time you open `http://<plant_id>.plants.iwmac.local:8080/...` the script silently records the visit (plant_id, page title, timestamp).
3. Open `https://kiona.rocketlane.com/timesheets/this-week/my-timesheet`.
4. Click **🏭 Plants visited** (bottom-right). Pick a date.
5. You get a list: plant_id (clickable link), plant name, time of first visit that day.

## Notes

- Visits are stored locally via `GM_setValue` (per-browser, per-Tampermonkey profile). Last 5000 visits are kept.
- Same plant within 5 minutes is deduped to one entry.
- **History before install:** none. Pang's API doesn't allow per-user log queries, so the script can only record visits going forward. Past visits won't appear.
- If you wipe the browser / Tampermonkey storage, the visit log is lost.

## How it works

- `@match http://*.plants.iwmac.local:8080/*` — extracts `plant_id` from the subdomain, grabs the page title as the plant name, appends to the `visits` array in `GM_setValue`.
- `@match https://kiona.rocketlane.com/timesheets/*` — adds the floating button + panel that reads the same `visits` array and filters by selected date.
