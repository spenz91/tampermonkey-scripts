# Rocketlane Project Notes

## Install

> Requires [Tampermonkey](https://www.tampermonkey.net/) browser extension.

### [Click here to install Rocketlane Project Notes](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-project-notes/rocketlane-project-notes.user.js)

The script auto-updates — when a new version is pushed here, Tampermonkey will update it automatically.

---

## AI Reference

> Compact context for Claude / AI assistants. Read this instead of the full script to save tokens.

## What it is

A Tampermonkey userscript (`rocketlane-project-notes.user.js`, v1.9.0) that adds a writable **Note** column to the Rocketlane Projects list (AG Grid). Notes persist to the Toolbox SQL API (`team_status.iw_project_notes`) with a local Tampermonkey storage fallback. The header shows live SQL save status (saving / saved / error) and exposes a `/health` connection test.

## Key constants

| Constant | Value |
|---|---|
| `STORAGE_KEY` | `tm_project_notes_v1` (GM storage — local note cache, JSON `{projectId: note}`) |
| `WIDTH_KEY` | `tm_project_notes_width_v1` (GM storage — saved column width) |
| `SQL_API_URL_KEY` | `tm_pn_sql_api_url_v1` (GM storage — configured API URL) |
| `SQL_API_URL_DEFAULT` | `http://toolbox.iwmac.local:8505/toolbox-sql` |
| `SQL_TABLE` | `team_status.iw_project_notes` |
| `REMOTE_REFRESH_MS` | `60000` (read-through poll from SQL) |
| `MIN_WIDTH` / `MAX_WIDTH` | `80` / `800` (column resize bounds in px) |
| `PINNED_LEFT_BASE` | `400` (base width of AG Grid pinned-left container) |

## Features

### Feature 1: Note column in the Projects grid

- Injects a new `Note` cell after the project name in every AG Grid row on the Projects list page.
- Empty cells show `Add note…` placeholder. Click a cell to edit inline.
- Header is labelled `Note` and is user-resizable via a drag handle (saved to GM storage).
- URLs in the note are rendered as blue `<a target="_blank">` links in the display cell (click to open in a new tab).
- No-op save: `setNote` skips the SQL round-trip when the trimmed value is unchanged.

### Feature 2: Expand popover (rich editor)

- Click the `⤢` icon in a cell (visible on hover) to open a roomy popover.
- Default size: `min(720px, 70vw) × min(480px, 70vh)`; min 320×260; drag the bottom-right corner to resize further.
- `⤢` button (or Alt+Enter) toggles maximize (90% × 85% centered).
- Ctrl/Cmd+Enter saves; Esc cancels; clicking outside saves and closes.

### Feature 3: Live link editor (contenteditable)

- Both the inline cell editor and the popover use a `contenteditable` div instead of a `<textarea>` so URLs render as real `<a>` elements **while you type**.
- URL regex: `/\b((?:https?:\/\/|www\.)[^\s<>"']+)/gi` with trailing-punctuation trimming (`. , ; : ! ? ) ]`).
- Click a URL to open it in a new tab. Hold **Alt** (Option) while clicking to place the caret inside the URL for editing.
- Re-tokenization runs on `input` via `requestAnimationFrame` with caret-offset preservation (`getEditorCaretOffset` / `setEditorCaretOffset` walk text nodes and count `<br>` as 1 char).
- Paste and drop are forced to plain text via `execCommand('insertText')`.
- Enter semantics: inline editor saves on Enter (Shift+Enter = newline); popover inserts a line break on Enter (Ctrl/Cmd+Enter = save).

### Feature 4: Header SQL save status + connection test

Injected into the `Note` header:

| Icon | Meaning |
|---|---|
| `…` | Pulsing gray — SQL request in flight |
| `✓` | Green — last save/delete succeeded (auto-fades) |
| `!` | Red — SQL call failed, note saved locally only. Click to see error details and retry. |
| `⚡` | Click to run `GET <api>/health` and report the result |
| `⚙` | Click to configure the SQL API URL (opens a prompt; runs health check afterward) |

`lastFailedSave` tracks `{projectId, text}` for one-click retry via the error dialog.

## SQL API contract

POST form-encoded `sql_command=<SQL>` to `http://toolbox.iwmac.local:8505/toolbox-sql`. The API only allows `SELECT/INSERT/UPDATE/DELETE` and returns JSON `{success, results: [{data|affected_rows, ...}], request_id, error}`.

| Operation | SQL |
|---|---|
| Read all | `SELECT project_id, note FROM team_status.iw_project_notes` |
| Upsert | Try `UPDATE ... SET note='...', updated_at='...' WHERE project_id='...'`; if `affected_rows = 0` and row doesn't exist, `INSERT INTO ... (project_id, note, updated_at) VALUES (...)` |
| Delete | `DELETE FROM team_status.iw_project_notes WHERE project_id='...'` |
| Health | `GET /toolbox-sql/health` — `200` OK, `503` MariaDB down |

String values are escaped with `escapeSqlString()` (`\` → `\\`, `'` → `''`). Timestamps use `nowIso()` (`YYYY-MM-DDTHH:MM:SS.mmm`, server-local time).

## Required SQL schema

Create once on the MariaDB host (the Toolbox SQL API blocks DDL):

```sql
CREATE DATABASE IF NOT EXISTS team_status
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_status.iw_project_notes (
  project_id  VARCHAR(64)   NOT NULL,
  note        TEXT          NOT NULL,
  updated_at  DATETIME(3)   NULL,
  PRIMARY KEY (project_id),
  KEY idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## SPA / grid injection

Rocketlane is a SPA with virtualized AG Grid rendering. The script:

- Runs `applyToGrid()` which scans `.ag-header-row-column`, `.ag-header-row`, `.ag-row` and injects `.tm-pn-header` / `.tm-pn-cell` absolutely-positioned overlays at `left = getCellRight(projectName)`.
- Shifts sibling cells right by `NOTE_WIDTH` via `data-tm-orig-left` attributes, and widens containers (`.ag-center-cols-container`, `.ag-pinned-left-cols-container`, etc.) via `data-tm-orig-width`.
- A `MutationObserver` on `document.body` queues a `requestAnimationFrame` to re-apply on DOM changes.
- `popstate` and `hashchange` listeners handle SPA navigation.
- `isProjectsPage()` checks `/\/projects(\b|\/|\?)/` against `location.pathname + location.search` so the column only appears on the Projects list.
- Project ids come from `row.getAttribute("row-id")` or a fallback `/\/projects\/(\d+)/` href match.

## Editor internals

| Function | Purpose |
|---|---|
| `createNoteEditor(initialText)` | Builds a `contenteditable` div with paste/drop normalization and rAF-throttled re-tokenization |
| `appendTextWithLinks(container, text, {editor})` | Splits plain text around URL matches and appends text nodes + `<a>` elements. Editor-mode anchors navigate via `window.open`; display-mode anchors `stopPropagation` so they don't trigger cell edit. |
| `renderEditorContent(root, text)` | Clears root, splits on `\n`, appends link-aware fragments separated by `<br>` |
| `getEditorText(root)` | Walks tree: text nodes append `textContent`, `<br>` → `\n`, block elements insert `\n` separators |
| `getEditorCaretOffset(root)` / `setEditorCaretOffset(root, n)` | Convert between caret Range and absolute text offset (counting `<br>` as 1 char) |

## Status indicator state machine

`setHeaderStatus(kind, title)` + two `setTimeout` handles in module scope:

- `kind='saving'` → immediate render, no auto-clear
- `kind='saved'` → render, after `SAVE_STATUS_HOLD_MS (1400)` add `.tm-pn-fade`, then after `SAVE_STATUS_FADE_MS (600)` remove
- `kind='error'` → render, sticky until user clicks or a new save starts
- Click on error badge → `window.confirm` with URL + failing project id + truncated note text; OK retries via `setNote(lastFailedSave.projectId, lastFailedSave.text)`

## Metadata

| Field | Value | Meaning |
|---|---|---|
| `@match` | `https://*.rocketlane.com/*` | Runs on any Rocketlane tenant |
| `@run-at` | `document-idle` | After the SPA mounts, safe to scan DOM |
| `@grant` | `GM_getValue`, `GM_setValue`, `GM_xmlhttpRequest` | GM storage + cross-origin POST |
| `@connect` | `toolbox.iwmac.local` | Tampermonkey cross-origin allow-list for the SQL API host |

## Files

| File | Purpose |
|---|---|
| `rocketlane-project-notes.user.js` | Main userscript (install in Tampermonkey) |
