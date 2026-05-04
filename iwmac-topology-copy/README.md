# IWMAC Topology Copy

Adds a **Copy Topology** button to the IWMAC `sys_tools` page that expands every node in the Topology grid and copies the full hierarchy to the clipboard as TSV.

## Install

[Click here to install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/iwmac-topology-copy/IWMAC-Topology-Copy.user.js)

## Match

`*://*.plants.iwmac.local:8080/secure/sys_tools/*` — works for any plant ID prefix (e.g. `6176`, `1234`, …).

## Output format

Tab-separated, with the Tree column indented by 2 spaces per depth level:

```
Tree	Unit name	Owner	Status
AK2
  192.168.10.20
    001:002	Kjølemaskin	AK2	OK
    001:003	Frysemaskin	AK2	OK
...
```

Paste straight into Excel / Sheets — the indentation stays in the first cell, the other three columns split correctly.

## How it works

1. Calls the grid's own `Open all` toolbar action (`w2ui.grid_topology_toolbar.click('open_all')`) to make sure every level is expanded.
2. Scrapes every `tr.w2ui-record` under `#grid_grid_topology_records`, reading the `title` attributes for Tree / Unit name / Owner and the text for Status.
3. Depth is derived from the number of `span.w2ui-show-children` placeholders in the Tree cell.
4. Writes the result via `GM_setClipboard` (falls back to `navigator.clipboard`).
