// ==UserScript==
// @name         Rocketlane Project Notes Column
// @namespace    https://github.com/spenz91/tampermonkey-scripts
// @homepageURL  https://github.com/spenz91/tampermonkey-scripts
// @updateURL    https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-project-notes/rocketlane-project-notes.user.js
// @downloadURL  https://raw.githubusercontent.com/spenz91/tampermonkey-scripts/main/rocketlane-project-notes/rocketlane-project-notes.user.js
// @version      1.10.0
// @description  Adds a writable "Note" column before Status on the Rocketlane Projects list. Persists to toolbox SQL with local fallback, SQL save status on the header, /health test, and a rich editor with inline clickable URLs while you write.
// @author       Thomas
// @match        https://*.rocketlane.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      toolbox.iwmac.local
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "tm_project_notes_v1";
  const WIDTH_KEY = "tm_project_notes_width_v1";
  const SQL_API_URL_KEY = "tm_pn_sql_api_url_v1";
  const SQL_API_URL_DEFAULT = "http://toolbox.iwmac.local:8505/toolbox-sql";
  const SQL_TABLE = "team_status.iw_project_notes";
  const MIN_WIDTH = 80;
  const MAX_WIDTH = 800;
  const PINNED_LEFT_BASE = 400;
  const REMOTE_REFRESH_MS = 60000;
  const SAVE_STATUS_HOLD_MS = 1400;
  const SAVE_STATUS_FADE_MS = 600;

  let sqlApiUrl = GM_getValue(SQL_API_URL_KEY, SQL_API_URL_DEFAULT);
  let lastRemoteSyncMs = 0;

  let NOTE_WIDTH = readWidth();
  function readWidth() {
    const v = parseInt(GM_getValue(WIDTH_KEY, "220"), 10);
    if (isNaN(v)) return 220;
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, v));
  }
  function saveWidth(w) { GM_setValue(WIDTH_KEY, String(w)); }

  let observer = null;
  let notesCache = readLocalNotes();
  let headerStatus = null;
  let headerStatusFadeTimer = 0;
  let headerStatusRemoveTimer = 0;
  let nextSaveSeq = 0;
  const latestSaveSeqByProject = {};
  let lastFailedSave = null;

  function readLocalNotes() {
    try {
      const raw = GM_getValue(STORAGE_KEY, "{}");
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch (_e) {
      return {};
    }
  }

  function writeLocalNotes(obj) {
    notesCache = obj;
    GM_setValue(STORAGE_KEY, JSON.stringify(obj, null, 2));
  }

  function getNote(projectId) {
    return notesCache[projectId] || "";
  }

  function clearHeaderStatusTimers() {
    if (headerStatusFadeTimer) {
      window.clearTimeout(headerStatusFadeTimer);
      headerStatusFadeTimer = 0;
    }
    if (headerStatusRemoveTimer) {
      window.clearTimeout(headerStatusRemoveTimer);
      headerStatusRemoveTimer = 0;
    }
  }

  function renderHeaderStatus() {
    document.querySelectorAll(".tm-pn-header").forEach((header) => {
      let statusEl = header.querySelector(".tm-pn-status");
      if (!headerStatus) {
        if (statusEl) statusEl.remove();
        return;
      }

      if (!statusEl) {
        statusEl = document.createElement("span");
        statusEl.addEventListener("mousedown", (e) => e.stopPropagation());
        statusEl.addEventListener("click", onHeaderStatusClick);
        const cfgEl = header.querySelector(".tm-pn-cfg");
        if (cfgEl) header.insertBefore(statusEl, cfgEl);
        else header.appendChild(statusEl);
      }

      statusEl.className = "tm-pn-status";
      statusEl.title = headerStatus.title || "";
      statusEl.style.cursor = headerStatus.kind === "error" ? "pointer" : "default";

      if (headerStatus.kind === "saving") {
        statusEl.classList.add("tm-pn-saving");
        statusEl.textContent = "…";
        return;
      }
      if (headerStatus.kind === "saved") {
        statusEl.classList.add("tm-pn-saved");
        if (headerStatus.fade) statusEl.classList.add("tm-pn-fade");
        statusEl.textContent = "✓";
        return;
      }
      if (headerStatus.kind === "error") {
        statusEl.classList.add("tm-pn-error");
        statusEl.textContent = "!";
        return;
      }
      statusEl.remove();
    });
  }

  function onHeaderStatusClick(e) {
    e.stopPropagation();
    if (!headerStatus || headerStatus.kind !== "error") return;

    const fail = lastFailedSave;
    const details = headerStatus.title || "SQL save failed.";
    const lines = [details];
    lines.push("", `SQL API URL: ${sqlApiUrl || "(not set)"}`);
    if (fail) {
      const preview = (fail.text || "").slice(0, 120);
      lines.push(
        "",
        `Last failed note for project ${fail.projectId}:`,
        preview || "(empty — delete)"
      );
    }
    lines.push("", "Click OK to retry the last failed save, Cancel to dismiss.");

    const retry = window.confirm(lines.join("\n"));
    if (!retry || !fail) {
      if (!retry) setHeaderStatus(null);
      return;
    }
    setNote(fail.projectId, fail.text);
  }

  function setHeaderStatus(kind, title) {
    clearHeaderStatusTimers();
    if (!kind) {
      headerStatus = null;
      renderHeaderStatus();
      return;
    }

    headerStatus = { kind, title: title || "", fade: false };
    renderHeaderStatus();

    if (kind === "saved") {
      headerStatusFadeTimer = window.setTimeout(() => {
        if (!headerStatus || headerStatus.kind !== "saved") return;
        headerStatus.fade = true;
        renderHeaderStatus();
        headerStatusRemoveTimer = window.setTimeout(() => {
          if (!headerStatus || headerStatus.kind !== "saved") return;
          headerStatus = null;
          renderHeaderStatus();
        }, SAVE_STATUS_FADE_MS);
      }, SAVE_STATUS_HOLD_MS);
    }
  }

  function clearAllSyncStates() {
    clearHeaderStatusTimers();
    headerStatus = null;
    renderHeaderStatus();
  }

  function isSqlEnabled() {
    return typeof sqlApiUrl === "string" && sqlApiUrl.length > 0;
  }

  function escapeSqlString(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "''");
  }

  function nowIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  }

  function sqlApiPost(sqlCommand) {
    return new Promise((resolve, reject) => {
      const formData = `sql_command=${encodeURIComponent(sqlCommand)}`;
      GM_xmlhttpRequest({
        method: "POST",
        url: sqlApiUrl,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        data: formData,
        timeout: 15000,
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText || "{}");
            const reqId = data.request_id ? ` [${data.request_id}]` : "";
            if (res.status >= 400) {
              reject(new Error((data.error || `HTTP ${res.status}`) + reqId));
              return;
            }
            if (data.success && data.results) {
              resolve(data);
              return;
            }
            reject(new Error((data.error || "API error") + reqId));
          } catch (_e) {
            reject(new Error("Invalid API response"));
          }
        },
        onerror: () => reject(new Error("Network error")),
        ontimeout: () => reject(new Error("Timeout")),
      });
    });
  }

  async function sqlReadAll() {
    const sql = `SELECT project_id, note FROM ${SQL_TABLE}`;
    const res = await sqlApiPost(sql);
    const rows = res.results && res.results[0] && res.results[0].data ? res.results[0].data : [];
    const out = {};
    for (const row of rows) {
      const pid = String(row.project_id);
      const note = row.note || "";
      if (pid && note) out[pid] = note;
    }
    return out;
  }

  async function sqlUpsertNote(projectId, note) {
    const pidEsc = escapeSqlString(projectId);
    const noteEsc = escapeSqlString(note);
    const ts = escapeSqlString(nowIso());
    const updateSql = `UPDATE ${SQL_TABLE} SET note='${noteEsc}', updated_at='${ts}' WHERE project_id='${pidEsc}'`;
    const res = await sqlApiPost(updateSql);
    const updated = res.results && res.results[0] && res.results[0].affected_rows > 0;
    if (!updated) {
      const checkRes = await sqlApiPost(`SELECT 1 FROM ${SQL_TABLE} WHERE project_id='${pidEsc}' LIMIT 1`);
      const exists = checkRes.results && checkRes.results[0] && checkRes.results[0].data && checkRes.results[0].data.length > 0;
      if (!exists) {
        const insertSql = `INSERT INTO ${SQL_TABLE} (project_id, note, updated_at) VALUES ('${pidEsc}', '${noteEsc}', '${ts}')`;
        await sqlApiPost(insertSql);
      }
    }
  }

  async function sqlDeleteNote(projectId) {
    const pidEsc = escapeSqlString(projectId);
    await sqlApiPost(`DELETE FROM ${SQL_TABLE} WHERE project_id='${pidEsc}'`);
  }

  function sqlHealthCheck() {
    return new Promise((resolve) => {
      const base = (sqlApiUrl || "").replace(/\/+$/, "");
      if (!base) {
        resolve({ ok: false, message: "No SQL API URL configured." });
        return;
      }
      GM_xmlhttpRequest({
        method: "GET",
        url: base + "/health",
        timeout: 8000,
        onload: (res) => {
          if (res.status === 200) {
            resolve({ ok: true, message: `OK (HTTP 200) — ${base}/health` });
          } else if (res.status === 503) {
            resolve({ ok: false, message: `MariaDB down (HTTP 503) — ${base}/health` });
          } else {
            resolve({ ok: false, message: `Unexpected HTTP ${res.status} — ${base}/health` });
          }
        },
        onerror: () =>
          resolve({
            ok: false,
            message:
              `Network error reaching ${base}/health. ` +
              "Host not reachable from the browser (VPN off, DNS, firewall, or service down).",
          }),
        ontimeout: () =>
          resolve({ ok: false, message: `Timed out after 8s reaching ${base}/health` }),
      });
    });
  }

  async function testConnectionInteractive() {
    const base = sqlApiUrl || "(not set)";
    setHeaderStatus("saving", `Testing ${base}/health ...`);
    const result = await sqlHealthCheck();
    if (result.ok) {
      lastFailedSave = null;
      setHeaderStatus("saved", result.message);
      refreshFromSql(true);
    } else {
      try {
        console.warn("[Rocketlane Notes] Health check failed →", base, result.message);
      } catch (_ignored) {}
      setHeaderStatus(
        "error",
        `Toolbox SQL health check failed: ${result.message}. Click the ! for details.`
      );
    }
  }

  async function refreshFromSql(force) {
    if (!isSqlEnabled()) return;
    const now = Date.now();
    if (!force && now - lastRemoteSyncMs < REMOTE_REFRESH_MS && lastRemoteSyncMs > 0) return;
    try {
      const remote = await sqlReadAll();
      lastRemoteSyncMs = Date.now();
      writeLocalNotes(remote);
      document.querySelectorAll(".tm-pn-cell").forEach((cell) => {
        const pid = cell.getAttribute("data-project-id");
        if (pid && !cell.querySelector("textarea")) {
          renderCellText(cell, getNote(pid));
        }
      });
    } catch (_err) {
      // keep local cache silently
    }
  }

  async function setNote(projectId, text) {
    const trimmed = text && text.trim() ? text : "";
    const existing = notesCache[projectId] || "";
    if (trimmed === existing) return;

    const next = { ...notesCache };
    if (trimmed) next[projectId] = trimmed; else delete next[projectId];
    writeLocalNotes(next);

    const saveSeq = ++nextSaveSeq;
    latestSaveSeqByProject[projectId] = saveSeq;

    if (!isSqlEnabled()) {
      setHeaderStatus(null);
      return;
    }

    setHeaderStatus(
      "saving",
      trimmed ? "Saving note to SQL..." : "Removing note from SQL..."
    );

    try {
      if (trimmed) await sqlUpsertNote(projectId, trimmed);
      else await sqlDeleteNote(projectId);
      if (latestSaveSeqByProject[projectId] !== saveSeq) return;
      lastRemoteSyncMs = Date.now();
      lastFailedSave = null;
      setHeaderStatus(
        "saved",
        trimmed ? "Saved to SQL" : "Removed from SQL"
      );
    } catch (err) {
      if (latestSaveSeqByProject[projectId] !== saveSeq) return;
      const message = err && err.message ? err.message : "Unknown error";
      lastFailedSave = { projectId, text };
      try {
        console.warn(
          "[Rocketlane Notes] SQL save failed for project",
          projectId,
          "→",
          sqlApiUrl,
          err
        );
      } catch (_ignored) {}
      setHeaderStatus(
        "error",
        trimmed
          ? `Saved locally only. SQL save failed: ${message}. Click the ! for details.`
          : `Removed locally only. SQL delete failed: ${message}. Click the ! for details.`
      );
    }
  }

  function configureSqlInteractive() {
    const current = sqlApiUrl || SQL_API_URL_DEFAULT;
    const url = window.prompt("Toolbox SQL API URL (blank = local-only)", current);
    if (url === null) return;
    sqlApiUrl = url.trim();
    GM_setValue(SQL_API_URL_KEY, sqlApiUrl);
    clearAllSyncStates();
    lastRemoteSyncMs = 0;
    if (isSqlEnabled()) testConnectionInteractive();
    else refreshFromSql(true);
  }

  function isProjectsPage() {
    return /\/projects(\b|\/|\?)/.test(location.pathname + location.search);
  }

  function applyWidthStyles() {
    const total = PINNED_LEFT_BASE + NOTE_WIDTH;
    let s = document.getElementById("tm-pn-width-style");
    if (!s) {
      s = document.createElement("style");
      s.id = "tm-pn-width-style";
      document.head.appendChild(s);
    }
    s.textContent = `
      .ag-pinned-left-cols-container,
      .ag-pinned-left-header,
      .ag-horizontal-left-spacer {
        width: ${total}px !important;
        min-width: ${total}px !important;
        max-width: ${total}px !important;
      }
    `;
    document.querySelectorAll(".tm-pn-cell, .tm-pn-header").forEach((el) => {
      el.style.width = NOTE_WIDTH + "px";
    });
  }

  function ensureStyles() {
    applyWidthStyles();
    if (document.getElementById("tm-pn-style")) return;
    const css = `
      .tm-pn-cell {
        position: absolute;
        top: 0;
        display: flex;
        align-items: center;
        padding: 0 12px;
        height: 100%;
        box-sizing: border-box;
        font: inherit;
        color: inherit;
        border-right: 1px solid var(--table-border-color, #e0e0e0);
        cursor: default;
        overflow: hidden;
        z-index: 2;
        background: inherit;
      }
      .tm-pn-cell:hover {
        background: rgba(15, 98, 254, 0.04);
      }
      .tm-pn-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
        line-height: 1.3;
      }
      .tm-pn-link {
        color: #0f62fe;
        text-decoration: underline;
        cursor: pointer;
      }
      .tm-pn-link:hover {
        color: #0043ce;
        text-decoration: underline;
      }
      .tm-pn-text.tm-pn-empty {
        color: #9aa4b2;
        font-style: italic;
      }
      .tm-pn-textarea {
        flex: 1;
        width: 100%;
        height: 80%;
        padding: 4px 6px;
        border: 1px solid var(--brand-color, #0f62fe);
        border-radius: 4px;
        font: inherit;
        font-size: 13px;
        resize: none;
        outline: none;
        background: white;
        color: #161616;
        white-space: pre-wrap;
        overflow: auto;
        word-break: break-word;
      }
      .tm-pn-editor {
        white-space: pre-wrap;
        word-break: break-word;
      }
      .tm-pn-editor:focus {
        outline: none;
      }
      .tm-pn-editor a {
        color: #0f62fe;
        text-decoration: underline;
        cursor: pointer;
      }
      .tm-pn-editor a:hover {
        color: #0043ce;
      }
      .tm-pn-btn {
        flex: 0 0 auto;
        margin-left: 6px;
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 1px solid transparent;
        color: #525252;
        background: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.1s ease, background 0.1s ease, border-color 0.1s ease, color 0.1s ease;
        font-size: 16px;
        line-height: 1;
        user-select: none;
      }
      .tm-pn-cell:hover .tm-pn-btn,
      .tm-pn-btn:focus-visible {
        opacity: 1;
      }
      .tm-pn-btn:hover {
        background: rgba(15, 98, 254, 0.12);
        border-color: rgba(15, 98, 254, 0.3);
        color: #0f62fe;
      }
      .tm-pn-btn:active {
        background: rgba(15, 98, 254, 0.2);
      }
      .tm-pn-popover {
        position: fixed;
        z-index: 99999;
        background: white;
        border: 1px solid #c6c6c6;
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        padding: 10px;
        width: min(720px, 70vw);
        height: min(480px, 70vh);
        min-width: 320px;
        min-height: 260px;
        max-width: 95vw;
        max-height: 95vh;
        resize: both;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tm-pn-popover.tm-pn-popover-maximized {
        resize: none;
      }
      .tm-pn-popover-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: -4px -4px 0 0;
        gap: 8px;
      }
      .tm-pn-popover-hint {
        font-size: 11px;
        color: #9aa4b2;
        user-select: none;
      }
      .tm-pn-popover-max {
        padding: 0 6px !important;
        height: 20px;
        line-height: 18px;
        border: 1px solid transparent !important;
        background: transparent !important;
        color: #525252 !important;
        font-size: 13px !important;
      }
      .tm-pn-popover-max:hover {
        background: rgba(15, 98, 254, 0.1) !important;
        color: #0f62fe !important;
      }
      .tm-pn-popover .tm-pn-editor {
        width: 100%;
        flex: 1 1 auto;
        min-height: 200px;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #c6c6c6;
        border-radius: 4px;
        font: inherit;
        font-size: 13px;
        line-height: 1.4;
        outline: none;
        color: #161616;
        background: white;
        overflow: auto;
      }
      .tm-pn-popover .tm-pn-editor:focus {
        border-color: #0f62fe;
      }
      .tm-pn-popover-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }
      .tm-pn-popover button {
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid #c6c6c6;
        background: white;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        color: #161616;
      }
      .tm-pn-popover button.tm-pn-primary {
        background: #0f62fe;
        border-color: #0f62fe;
        color: white;
      }
      .tm-pn-popover button:hover {
        filter: brightness(0.95);
      }
      .tm-pn-status {
        flex: 0 0 auto;
        margin-left: 6px;
        width: 14px;
        height: 14px;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        line-height: 1;
        border-radius: 50%;
        font-weight: 700;
      }
      .tm-pn-status.tm-pn-saving {
        display: inline-flex;
        background: #e0e0e0;
        color: #525252;
        animation: tm-pn-pulse 1s infinite;
      }
      .tm-pn-status.tm-pn-saved {
        display: inline-flex;
        background: #24a148;
        color: white;
        transition: opacity 0.6s ease;
      }
      .tm-pn-status.tm-pn-saved.tm-pn-fade { opacity: 0; }
      .tm-pn-status.tm-pn-error {
        display: inline-flex;
        background: #da1e28;
        color: white;
      }
      @keyframes tm-pn-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .tm-pn-cfg {
        margin-left: 6px;
        cursor: pointer;
        color: #9aa4b2;
        font-size: 13px;
        opacity: 0.5;
        user-select: none;
      }
      .tm-pn-cfg:hover { opacity: 1; color: #0f62fe; }
      .tm-pn-resizer {
        position: absolute;
        top: 0;
        right: -3px;
        width: 6px;
        height: 100%;
        cursor: col-resize;
        z-index: 5;
      }
      .tm-pn-resizer:hover,
      .tm-pn-resizing .tm-pn-resizer {
        background: rgba(15, 98, 254, 0.35);
      }
      body.tm-pn-resizing,
      body.tm-pn-resizing * {
        cursor: col-resize !important;
        user-select: none !important;
      }
      .tm-pn-header {
        position: absolute;
        top: 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding: 0 12px;
        box-sizing: border-box;
        font-weight: 600;
        font-size: 12px;
        color: var(--text-secondary, #525252);
        border-right: 1px solid var(--table-border-color, #e0e0e0);
        z-index: 2;
        background: inherit;
      }
    `;
    const style = document.createElement("style");
    style.id = "tm-pn-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getProjectIdFromRow(row) {
    const id = row.getAttribute("row-id");
    if (id) return id;
    const link = row.querySelector('a[href*="/projects/"]');
    if (link) {
      const m = link.getAttribute("href").match(/\/projects\/(\d+)/);
      if (m) return m[1];
    }
    return null;
  }

  function getProjectNameCell(row) {
    return (
      row.querySelector('[col-id="projectName"]') ||
      row.querySelector('[col-id="project_name"]') ||
      row.querySelector('[col-id="name"]')
    );
  }

  function getCellRight(cell) {
    const left = parseFloat(cell.style.left) || 0;
    const width = parseFloat(cell.style.width) || cell.offsetWidth || 0;
    return left + width;
  }

  function shiftSiblingsAfter(parent, fromLeft) {
    const cells = parent.querySelectorAll(':scope > [col-id]');
    cells.forEach((c) => {
      if (c.classList.contains("tm-pn-cell")) return;
      const left = parseFloat(c.style.left);
      if (!isNaN(left) && left >= fromLeft) {
        if (!c.hasAttribute("data-tm-orig-left")) {
          c.setAttribute("data-tm-orig-left", String(left));
        }
        const orig = parseFloat(c.getAttribute("data-tm-orig-left"));
        c.style.left = orig + NOTE_WIDTH + "px";
      }
    });
  }

  function widenContainer(container) {
    if (!container) return;
    const w = parseFloat(container.style.width);
    if (!isNaN(w)) {
      if (!container.hasAttribute("data-tm-orig-width")) {
        container.setAttribute("data-tm-orig-width", String(w));
      }
      const orig = parseFloat(container.getAttribute("data-tm-orig-width"));
      container.style.width = orig + NOTE_WIDTH + "px";
    }
  }

  function startEdit(cellEl, projectId) {
    if (cellEl.querySelector(".tm-pn-editor")) return;
    const current = getNote(projectId);
    cellEl.innerHTML = "";
    const ed = createNoteEditor(current);
    ed.classList.add("tm-pn-textarea");
    cellEl.appendChild(ed);
    ed.focus();
    const selAll = document.createRange();
    selAll.selectNodeContents(ed);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(selAll);

    let cancelled = false;

    ed.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        ed.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelled = true;
        ed.blur();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
      }
      e.stopPropagation();
    });

    ed.addEventListener("click", (e) => e.stopPropagation());

    ed.addEventListener("blur", () => {
      const val = cancelled ? current : getEditorText(ed);
      if (!cancelled) setNote(projectId, val);
      renderCellText(cellEl, val);
    });
  }

  function appendTextWithLinks(container, text, opts) {
    const options = opts || {};
    const re = /\b((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
    let lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        container.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      let raw = match[0];
      let trailing = "";
      while (raw.length && /[).,;:!?\]]/.test(raw[raw.length - 1])) {
        trailing = raw[raw.length - 1] + trailing;
        raw = raw.slice(0, -1);
      }
      if (!raw) {
        container.appendChild(document.createTextNode(match[0]));
        lastIndex = re.lastIndex;
        continue;
      }

      const href = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = raw;
      a.className = "tm-pn-link";
      a.title = href;
      if (options.editor) {
        a.addEventListener("click", (e) => {
          if (e.altKey) return;
          e.preventDefault();
          e.stopPropagation();
          window.open(href, "_blank", "noopener,noreferrer");
        });
      } else {
        a.addEventListener("mousedown", (e) => e.stopPropagation());
        a.addEventListener("click", (e) => e.stopPropagation());
      }
      container.appendChild(a);

      if (trailing) container.appendChild(document.createTextNode(trailing));
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
      container.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function getEditorText(root) {
    let out = "";
    function walk(node) {
      if (node.nodeType === 3) {
        out += node.nodeValue;
      } else if (node.nodeName === "BR") {
        out += "\n";
      } else if (node.nodeType === 1) {
        const isBlock =
          node.nodeName === "DIV" ||
          node.nodeName === "P" ||
          node.nodeName === "LI";
        if (isBlock && out.length && !out.endsWith("\n")) out += "\n";
        for (const c of node.childNodes) walk(c);
      }
    }
    for (const c of root.childNodes) walk(c);
    return out;
  }

  function getEditorCaretOffset(root) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (range.endContainer !== root && !root.contains(range.endContainer)) return null;
    let offset = 0;
    let done = false;
    function countAll(node) {
      if (node.nodeType === 3) offset += node.nodeValue.length;
      else if (node.nodeName === "BR") offset += 1;
      else if (node.nodeType === 1) for (const c of node.childNodes) countAll(c);
    }
    function walk(node) {
      if (done) return;
      if (node === range.endContainer) {
        if (node.nodeType === 3) {
          offset += range.endOffset;
        } else {
          for (let i = 0; i < range.endOffset && i < node.childNodes.length; i++) {
            countAll(node.childNodes[i]);
          }
        }
        done = true;
        return;
      }
      if (node.nodeType === 3) offset += node.nodeValue.length;
      else if (node.nodeName === "BR") offset += 1;
      else if (node.nodeType === 1) {
        for (const c of node.childNodes) {
          walk(c);
          if (done) return;
        }
      }
    }
    walk(root);
    return done ? offset : null;
  }

  function setEditorCaretOffset(root, offset) {
    let remaining = offset;
    let targetNode = null;
    let targetOffset = 0;
    function walk(node) {
      if (targetNode) return;
      if (node.nodeType === 3) {
        const len = node.nodeValue.length;
        if (remaining <= len) {
          targetNode = node;
          targetOffset = remaining;
          return;
        }
        remaining -= len;
      } else if (node.nodeName === "BR") {
        if (remaining === 0) {
          const parent = node.parentNode;
          targetNode = parent;
          targetOffset = Array.prototype.indexOf.call(parent.childNodes, node);
          return;
        }
        remaining -= 1;
      } else if (node.nodeType === 1) {
        for (const c of node.childNodes) {
          walk(c);
          if (targetNode) return;
        }
      }
    }
    walk(root);
    if (!targetNode) {
      targetNode = root;
      targetOffset = root.childNodes.length;
    }
    try {
      const range = document.createRange();
      range.setStart(targetNode, targetOffset);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_e) {}
  }

  function renderEditorContent(root, text) {
    root.innerHTML = "";
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (i > 0) root.appendChild(document.createElement("br"));
      appendTextWithLinks(root, line, { editor: true });
    });
  }

  function createNoteEditor(initialText) {
    const ed = document.createElement("div");
    ed.className = "tm-pn-editor";
    ed.setAttribute("contenteditable", "true");
    ed.setAttribute("spellcheck", "false");
    ed.setAttribute(
      "title",
      "Click a URL to open it in a new tab. Hold Alt/Option to place the caret inside the URL instead."
    );
    renderEditorContent(ed, initialText || "");

    ed.addEventListener("paste", (e) => {
      e.preventDefault();
      const data =
        (e.clipboardData && e.clipboardData.getData("text/plain")) || "";
      document.execCommand("insertText", false, data);
    });

    ed.addEventListener("drop", (e) => {
      e.preventDefault();
      const data =
        (e.dataTransfer && e.dataTransfer.getData("text/plain")) || "";
      if (data) document.execCommand("insertText", false, data);
    });

    let rerendering = false;
    let scheduled = false;
    const scheduleRerender = () => {
      if (rerendering || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        const text = getEditorText(ed);
        const caret = getEditorCaretOffset(ed);
        rerendering = true;
        renderEditorContent(ed, text);
        rerendering = false;
        if (caret != null) setEditorCaretOffset(ed, caret);
      });
    };
    ed.addEventListener("input", scheduleRerender);

    return ed;
  }

  function renderCellText(cellEl, text) {
    cellEl.innerHTML = "";
    const span = document.createElement("span");
    if (text && text.trim()) {
      span.className = "tm-pn-text";
      appendTextWithLinks(span, text);
    } else {
      span.className = "tm-pn-text tm-pn-empty";
      span.textContent = "Add note…";
    }
    cellEl.appendChild(span);

    const edit = document.createElement("span");
    edit.className = "tm-pn-btn tm-pn-edit";
    edit.title = "Edit note";
    edit.textContent = "✎";
    edit.addEventListener("mousedown", (e) => e.stopPropagation());
    edit.addEventListener("click", (e) => {
      e.stopPropagation();
      const projectId = cellEl.getAttribute("data-project-id");
      startEdit(cellEl, projectId);
    });
    cellEl.appendChild(edit);

    const expand = document.createElement("span");
    expand.className = "tm-pn-btn tm-pn-expand";
    expand.title = "Expand";
    expand.textContent = "⤢";
    expand.addEventListener("mousedown", (e) => e.stopPropagation());
    expand.addEventListener("click", (e) => {
      e.stopPropagation();
      const projectId = cellEl.getAttribute("data-project-id");
      openPopover(cellEl, projectId);
    });
    cellEl.appendChild(expand);
  }

  let activePopover = null;
  function closePopover(save) {
    if (!activePopover) return;
    const { el, projectId, cellEl, ed, originalText } = activePopover;
    const val = save ? getEditorText(ed) : originalText;
    if (save) setNote(projectId, val);
    el.remove();
    document.removeEventListener("mousedown", activePopover.outsideHandler, true);
    activePopover = null;
    renderCellText(cellEl, save ? val : getNote(projectId));
  }

  function openPopover(cellEl, projectId) {
    if (activePopover) closePopover(false);
    const rect = cellEl.getBoundingClientRect();
    const current = getNote(projectId);

    const el = document.createElement("div");
    el.className = "tm-pn-popover";

    const toolbar = document.createElement("div");
    toolbar.className = "tm-pn-popover-toolbar";

    const hint = document.createElement("span");
    hint.className = "tm-pn-popover-hint";
    hint.textContent = "Click URLs to open • Alt+click to edit";
    toolbar.appendChild(hint);

    const maximize = document.createElement("button");
    maximize.type = "button";
    maximize.className = "tm-pn-popover-max";
    maximize.title = "Maximize / restore (Alt+Enter)";
    maximize.textContent = "⤢";
    toolbar.appendChild(maximize);
    el.appendChild(toolbar);

    const ed = createNoteEditor(current);
    el.appendChild(ed);

    const actions = document.createElement("div");
    actions.className = "tm-pn-popover-actions";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopover(false);
    });
    const save = document.createElement("button");
    save.className = "tm-pn-primary";
    save.textContent = "Save";
    save.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopover(true);
    });
    actions.appendChild(cancel);
    actions.appendChild(save);
    el.appendChild(actions);

    document.body.appendChild(el);

    let isMaximized = false;
    const position = () => {
      const popW = el.offsetWidth;
      const popH = el.offsetHeight;
      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
      if (top + popH > window.innerHeight - 8) top = rect.top - popH - 4;
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      el.style.left = left + "px";
      el.style.top = top + "px";
    };

    const toggleMaximize = () => {
      isMaximized = !isMaximized;
      if (isMaximized) {
        el.classList.add("tm-pn-popover-maximized");
        const w = Math.min(1200, Math.floor(window.innerWidth * 0.9));
        const h = Math.floor(window.innerHeight * 0.85);
        el.style.width = w + "px";
        el.style.height = h + "px";
        el.style.left = Math.floor((window.innerWidth - w) / 2) + "px";
        el.style.top = Math.floor((window.innerHeight - h) / 2) + "px";
        maximize.textContent = "⤡";
        maximize.title = "Restore (Alt+Enter)";
      } else {
        el.classList.remove("tm-pn-popover-maximized");
        el.style.width = "";
        el.style.height = "";
        position();
        maximize.textContent = "⤢";
        maximize.title = "Maximize (Alt+Enter)";
      }
      ed.focus();
    };

    maximize.addEventListener("mousedown", (e) => e.stopPropagation());
    maximize.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMaximize();
    });

    position();

    ed.focus();
    setEditorCaretOffset(ed, current.length);

    ed.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopover(false);
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        closePopover(true);
      } else if (e.key === "Enter" && e.altKey) {
        e.preventDefault();
        toggleMaximize();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
      }
      e.stopPropagation();
    });

    const outsideHandler = (e) => {
      if (!el.contains(e.target)) closePopover(true);
    };
    document.addEventListener("mousedown", outsideHandler, true);

    activePopover = { el, projectId, cellEl, ed, originalText: current, outsideHandler };
  }

  function injectCellIntoRow(row) {
    if (row.querySelector(".tm-pn-cell")) return;
    const nameCell = getProjectNameCell(row);
    if (!nameCell) return;
    const projectId = getProjectIdFromRow(row);
    if (!projectId) return;

    const insertLeft = getCellRight(nameCell);
    shiftSiblingsAfter(nameCell.parentElement, insertLeft);

    const cell = document.createElement("div");
    cell.className = "tm-pn-cell";
    cell.setAttribute("data-tm-note", "1");
    cell.setAttribute("data-project-id", projectId);
    cell.style.left = insertLeft + "px";
    cell.style.width = NOTE_WIDTH + "px";
    cell.style.height = nameCell.style.height || "100%";

    renderCellText(cell, getNote(projectId));

    nameCell.parentElement.appendChild(cell);
  }

  function injectHeaderInto(headerRow) {
    if (!headerRow) return;
    if (headerRow.querySelector(".tm-pn-header")) return;
    const nameHeader =
      headerRow.querySelector('[col-id="projectName"]') ||
      headerRow.querySelector('[col-id="project_name"]') ||
      headerRow.querySelector('[col-id="name"]');
    if (!nameHeader) return;

    const insertLeft = getCellRight(nameHeader);
    shiftSiblingsAfter(headerRow, insertLeft);

    const h = document.createElement("div");
    h.className = "tm-pn-header";
    h.setAttribute("data-tm-note-header", "1");
    h.style.left = insertLeft + "px";
    h.style.width = NOTE_WIDTH + "px";
    h.style.height = nameHeader.style.height || "100%";

    const label = document.createElement("span");
    label.className = "tm-pn-label";
    label.textContent = "Note";
    h.appendChild(label);

    const test = document.createElement("span");
    test.className = "tm-pn-cfg";
    test.title = "Test SQL connection (/health)";
    test.textContent = "⚡";
    test.addEventListener("mousedown", (e) => e.stopPropagation());
    test.addEventListener("click", (e) => {
      e.stopPropagation();
      testConnectionInteractive();
    });
    h.appendChild(test);

    const cfg = document.createElement("span");
    cfg.className = "tm-pn-cfg";
    cfg.title = "Configure SQL backend";
    cfg.textContent = "⚙";
    cfg.addEventListener("mousedown", (e) => e.stopPropagation());
    cfg.addEventListener("click", (e) => {
      e.stopPropagation();
      configureSqlInteractive();
    });
    h.appendChild(cfg);

    const resizer = document.createElement("div");
    resizer.className = "tm-pn-resizer";
    resizer.title = "Drag to resize";
    resizer.addEventListener("mousedown", startResize);
    h.appendChild(resizer);

    headerRow.appendChild(h);
    renderHeaderStatus();
  }

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = NOTE_WIDTH;
    document.body.classList.add("tm-pn-resizing");

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + dx));
      NOTE_WIDTH = next;
      applyWidthStyles();
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
      document.body.classList.remove("tm-pn-resizing");
      saveWidth(NOTE_WIDTH);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
  }

  function applyToGrid() {
    if (!isProjectsPage()) return;
    const grid = document.querySelector(".ag-root-wrapper");
    if (!grid) return;

    ensureStyles();

    const headerRows = document.querySelectorAll(
      ".ag-header-row-column, .ag-header-row"
    );
    headerRows.forEach(injectHeaderInto);

    const rows = document.querySelectorAll('.ag-row, [role="row"][row-id]');
    rows.forEach(injectCellIntoRow);

    const containers = document.querySelectorAll(
      ".ag-center-cols-container, .ag-center-cols-viewport > .ag-center-cols-container, .ag-pinned-left-cols-container, .ag-header-container, .ag-pinned-left-header"
    );
    containers.forEach((c) => {
      if (c.querySelector(".tm-pn-cell, .tm-pn-header")) widenContainer(c);
    });
  }

  function startObserver() {
    if (observer) return;
    let pending = false;
    const queue = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        applyToGrid();
      });
    };
    observer = new MutationObserver(queue);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", queue);
    window.addEventListener("hashchange", queue);
  }

  applyToGrid();
  startObserver();
  refreshFromSql(true);
})();
