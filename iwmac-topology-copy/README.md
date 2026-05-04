# IWMAC Topology Copy

**Version: 1.5**

Adds two buttons to the IWMAC `sys_tools` topology toolbar:

- **Copy Topology** — expands every node and copies the hierarchy as a rich-text table (HTML for Zendesk/Gmail/Word, TSV fallback for Excel/Notepad).
- **Export to Excel** — downloads a real `.xlsx` with native +/- collapse buttons in the row gutter, mirroring the tree levels in the browser.

## Install

[Click here to install (latest, currently v1.5)](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js)

After installing, Tampermonkey auto-updates whenever a new version is pushed.

## Match

`*://*.plants.iwmac.local:8080/secure/sys_tools/*` — works for any plant ID prefix (e.g. `6176`, `1234`, …).

## Clipboard output

When you click **Copy Topology** the clipboard receives both formats simultaneously:

- `text/html` — formatted table with header row, grey group rows, indented Tree column. Pastes as a real table in Zendesk, Gmail, Word, etc.
- `text/plain` — TSV with 2-space indentation per depth level. Pastes cleanly into Excel/Sheets/Notepad.

## Excel export

Clicking **Export to Excel** downloads `topology_<plant>_<YYYY-MM-DD>.xlsx`. Each row gets an `outlineLevel` matching its depth in the tree, so Excel renders native outline buttons (1 / 2 / 3) in the gutter — click them to collapse/expand the same way you do in the browser.

Built as a real OOXML package using [JSZip](https://stuk.github.io/jszip/) (loaded via `@require`).

## How it works

1. Calls the grid's own *Open all* toolbar action (`w2ui.grid_topology_toolbar.click('open_all')`) so every level is expanded before scraping.
2. Scrapes every `tr.w2ui-record` under `#grid_grid_topology_records`, reading `title` attributes for Tree / Unit name / Owner and the text for Status.
3. Depth is derived from the number of `span.w2ui-show-children` placeholders in the Tree cell.
4. The button is injected as an extra `<td>` before `#tb_grid_topology_toolbar_right`, styled with the same `w2ui-button` markup as the built-in toolbar buttons.
