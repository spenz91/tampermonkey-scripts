# Rocketlane Day Recap

On Rocketlane My Timesheet, adds a 🏭 **Plants visited** button — pick a date and see every IWMAC plant you opened in pang on that day (with timestamp and which actions you performed: `direct_plant`, `pma_local`, `start_vnc`, etc.).

## Install

[Click here to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js) (requires Tampermonkey).

## Usage

1. Install the script.
2. Open `http://tools.iwmac.local/pang.qxs` once — the script grabs your username and your last 50 recent plant IDs from pang's localStorage and saves them to Tampermonkey storage.
3. Open `https://kiona.rocketlane.com/timesheets/this-week/my-timesheet`.
4. Click **🏭 Plants visited** (bottom-right). Pick a date and click **Search**.
5. Panel queries pang's `get_history` for every known plant (in parallel) and lists the ones where you have activity on that day.

The plant name appears once you've opened that plant's admin page at least once (we capture the page title).

## Notes

- The script can only query plants it knows about. Initially that's the 50 from `pang.recent`. Every time you open pang or a plant page, the known-plants list grows. Run pang at least once to seed it.
- Past activity (before the script was installed) **is** recoverable for plants in your known list — pang's `get_history` returns the full server-side history per plant, so picking an old date works as long as pang has the record.
- All requests are made to `tools.iwmac.local` from the Rocketlane tab via `GM_xmlhttpRequest` — your existing pang session cookie is reused automatically.
- ~50 parallel-limited requests (8 at a time). Typical search completes in 2–5 seconds.

## How it works

- **`@match http://*.plants.iwmac.local:8080/*`** — captures `plant_id → page title` so we can show plant names. Adds the plant_id to the known-plants list.
- **`@match http://tools.iwmac.local/pang.qxs*`** — reads `pang.recent` and `pang.login.username` from pang's localStorage and unions them into Tampermonkey storage.
- **`@match https://kiona.rocketlane.com/timesheets/*`** — adds the floating button. On Search, calls `tools.iwmac.local/services/pang/actions.php` with `method:"get_history"` for every known plant_id, filters each result by `user == your username` and `date == picked date`, then renders.

## Limitations

- Pang has no per-user-across-plants query, so we have to fan out one request per known plant. Plants you've never opened won't be queried.
- Plant name is taken from the plant admin page's `<h1>` / `<title>`. If you've never opened a plant's admin page in this browser, the name shows as "(name not yet captured)".
