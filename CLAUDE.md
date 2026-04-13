# Claude Code Guide — tampermonkey-scripts

## Repo overview

Public GitHub repo: `https://github.com/spenz91/tampermonkey-scripts`
Local path: `C:\Users\ThomasKvalvåg\Documents\ak3 scan`
Owner: spenz91

A collection of Tampermonkey userscripts with auto-update support. Each script lives in its own subfolder.

## Folder structure

```
tampermonkey-scripts/
├── README.md                        # Root index — table of all scripts with install links
├── CLAUDE.md                        # This file
├── ak3-autoscan/
│   ├── AK3-Autoscan.user.js        # The userscript (installed in Tampermonkey)
│   └── README.md                   # AI reference docs for this script
└── <future-script>/
    ├── <script>.user.js
    └── README.md
```

## How Tampermonkey auto-update works

Each `.user.js` file has these headers:
- `@updateURL` — Tampermonkey checks this URL periodically for version changes
- `@downloadURL` — Tampermonkey downloads the new script from here
- `@version` — Tampermonkey compares this to detect updates

URLs follow the pattern:
```
https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/<folder>/<script>.user.js
```

**IMPORTANT:** You MUST bump `@version` every time you push changes, otherwise users won't get the update.

## How to make changes

### 1. Edit the script
Make changes to the `.user.js` file in the correct subfolder.

### 2. Bump the version
In the `// ==UserScript==` header, increment `@version` (e.g. 5.2 → 5.3).

### 3. Update the subfolder README if needed
If workflow steps changed, update the AI reference README in the same folder.

### 4. Commit and push
```bash
cd "C:\Users\ThomasKvalvåg\Documents\ak3 scan"
git add <changed-files>
git commit -m "Description of changes"
git push
```

The `gh` CLI is installed and authenticated as `spenz91`.

## Adding a new script

1. Create a new folder: `mkdir <script-name>`
2. Add the `.user.js` file with these required headers:
   ```js
   // @namespace    https://github.com/spenz91/tampermonkey-scripts
   // @homepageURL  https://github.com/spenz91/tampermonkey-scripts
   // @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/<folder>/<script>.user.js
   // @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/<folder>/<script>.user.js
   ```
3. Add a `README.md` in the folder with an install link and AI reference docs
4. Add a row to the **root README.md** table:
   ```md
   | [Script Name](<folder>/) | Description | [Install](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/<folder>/<script>.user.js) |
   ```
5. Commit and push

## Git config

- Remote: `origin` → `https://github.com/spenz91/tampermonkey-scripts.git`
- Branch: `main`
- Auth: `gh` CLI authenticated as `spenz91`
- User: `spenz91` / `spenz91@users.noreply.github.com`
