# Rocketlane Day Recap

Adds a floating **📅 Day Recap** button to the Rocketlane My Timesheet page. Pick a date and see every project/work entry you logged that day — including hours and any notes attached to each entry.

## Install

[Click here to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-day-recap/Rocketlane-Day-Recap.user.js) (requires Tampermonkey).

## Usage

1. Open `https://kiona.rocketlane.com/timesheets/this-week/my-timesheet` (or any week).
2. Click the **📅 Day Recap** button (bottom-right).
3. Pick a date (defaults to today). Click **Find**.
4. You get a list of every row that has time on that day: project name, work type, hours, and notes.
5. Click an entry to scroll/highlight the matching cell in the table.

> Only the currently loaded week is searched. Navigate to the right week first if the date you want is in another week.

## How it works

- Finds all `td` cells with `data-time-cell="YYYY-MM-DD"`.
- Reads the React props from each cell to extract `timeEntries` (minutes, notes).
- Falls back to the displayed input value if React props can't be read.
- Pulls the project + work-type names from the row's `[data-cy="timesheet.primary.name"]` elements.
