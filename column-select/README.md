# Column Select (Sublime-style)

Hold the **middle mouse button** and drag to draw a rectangular selection over text on any page. On release, the column-selected text is copied to your clipboard — same feel as `Shift+RMB`/middle-drag column selection in Sublime Text.

[Install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/column-select/Column-Select.user.js)

## How it works

1. Press and hold middle mouse button anywhere on a page.
2. Drag — a blue rectangle visualizes the column area.
3. Release — for each text line intersecting the rectangle, the script extracts only the characters within the column range and joins them with newlines.
4. Result is copied to clipboard; a small toast confirms the line count.

Middle-click auto-scroll is suppressed only while dragging — a plain middle-click without drag is treated as a non-event (no copy, no scroll). If you rely on middle-click for tab-opening on links, that still works on most browsers since `auxclick` runs after `mouseup`; if a site or your workflow needs it untouched, restrict the `@match` to specific URLs.

## Technical notes

- Uses `document.caretRangeFromPoint` (Chrome/Edge) / `caretPositionFromPoint` (Firefox) to map pixel coords to character offsets, then samples horizontal scan-lines top-to-bottom and dedupes by row rect.
- Falls back through `GM_setClipboard` → `navigator.clipboard` → hidden `<textarea>` + `execCommand('copy')`.
- Works on plain rendered text (HTML, `<pre>`, code blocks). Not designed for `<textarea>`/`<input>` — those have their own selection model.
