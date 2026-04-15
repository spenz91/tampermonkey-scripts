# Rocketlane Enhancer

## Install

> Requires [Tampermonkey](https://www.tampermonkey.net/) browser extension.

### [Click here to install Rocketlane Enhancer](https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-enhancer/rocketlane-enhancer.user.js)

The script auto-updates — when a new version is pushed here, Tampermonkey will update it automatically.

---

## AI Reference

> Compact context for Claude / AI assistants. Read this instead of the full script to save tokens.

## What it is

A Tampermonkey userscript (`rocketlane-enhancer.user.js`, v2.0) that customizes the Rocketlane project management UI at `kiona.rocketlane.com`. It hides the Gantt calendar/timeline and adds a floating chat panel on the timeline page.

## Key constants

| Constant | Value |
|---|---|
| `PROJECT_URL_PATTERN` | `/^\/projects\/\d+(\/|$)/` |
| `STYLE_ID` | `hide-rocketlane-calendar-style` |
| `LS_CALENDAR_HIDDEN` | `rl-calendar-hidden` (localStorage) |
| `LS_COLLAPSED` | `rl-floating-chat-collapsed` (localStorage) |
| `LS_WIDTH` / `LS_HEIGHT` | `rl-floating-chat-width` / `rl-floating-chat-height` (localStorage) |
| `LS_ACTIVE_CONVO` | `rl-floating-chat-active-convo` (localStorage) |
| `PROJECT_ID` | `1177803` (hardcoded) |

## Features

### Feature 1: Hide Gantt calendar/timeline

- Hides the right-side Gantt chart (timeline bars, month/week headers, splitter divider, toolbar row)
- Task list on the left expands to fill full width
- **Calendar toggle button** (calendar icon) injected next to the "Present" button
- Preference saved to `localStorage` and persists across page loads

### Feature 2: Floating chat panel

- Appears on the timeline page (`/projects/<id>/plan/timeline`)
- Loads project chat conversations in iframes without leaving the timeline view

| Capability | Detail |
|---|---|
| Conversation tabs | Private and General — instant switch (both iframes preloaded) |
| Draggable | Grab the header bar to move the panel |
| Resizable | Drag any edge or corner (8 resize handles) |
| Collapsible | Arrow button collapses to header bar only |
| Closable | X button removes the panel entirely |
| Persistent | Size, collapsed state, and active tab saved to `localStorage` |

## SPA navigation handling

Rocketlane is a single-page app. The script patches `history.pushState` and `history.replaceState` and listens to `popstate` to re-evaluate features on every URL change.

## Iframe CSS injection

The script injects CSS into chat iframes to hide unnecessary UI (navigation tabs, sidebar, conversation banner). A `MutationObserver` re-injects styles if the SPA removes them.

## Conversations

Hardcoded near the top of the script:

```javascript
const CONVERSATIONS = [
    { key: 'private', label: 'Private', id: 12287338 },
    { key: 'general', label: 'General', id: 12287339 },
];
```

Update the IDs if your project uses different conversations. Find IDs in the URL when opening a chat (`/chat/<id>`).

## localStorage keys

| Key | Purpose |
|---|---|
| `rl-calendar-hidden` | Gantt calendar hidden (`1`) or shown (`0`) |
| `rl-floating-chat-collapsed` | Chat panel collapsed state |
| `rl-floating-chat-width` | Saved chat panel width |
| `rl-floating-chat-height` | Saved chat panel height |
| `rl-floating-chat-active-convo` | Active conversation tab (`private` or `general`) |

## Metadata

| Field | Value | Meaning |
|---|---|---|
| `@match` | `https://kiona.rocketlane.com/projects/*` | Only runs on Kiona's Rocketlane project pages |
| `@run-at` | `document-start` | Injects before the page DOM is built |
| `@grant` | `GM_addStyle` | Tampermonkey API for adding CSS |

## Files

| File | Purpose |
|---|---|
| `rocketlane-enhancer.user.js` | Main userscript (install in Tampermonkey) |
