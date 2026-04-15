// ==UserScript==
// @name         Rocketlane Enhancer
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Hide the timeline/calendar on Rocketlane project plan pages, and add a floating chat panel on the timeline page.
// @author       Thomas
// @match        https://kiona.rocketlane.com/projects/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================================
    // Feature 1: Hide the Gantt calendar/timeline on project pages
    // =========================================================================

    // Only run the hiding logic when we're on a specific project page
    // (URL has /projects/<number>/...), not the project list page (/projects alone).
    const PROJECT_URL_PATTERN = /^\/projects\/\d+(\/|$)/;

    const STYLE_ID = 'hide-rocketlane-calendar-style';

    const HIDE_CSS = `
        /* 1. Hide timeline body (gantt bars area) and its header (months/weeks row) */
        .b-grid-subgrid-normal,
        .b-grid-header-scroller-normal,
        #b-gantt-5-normalSubgrid-footer,
        .b-grid-footer-scroller-normal {
            display: none !important;
        }

        /* 2. Hide the splitter (draggable divider with collapse/expand buttons)
              in the header, body, footer, and virtual scroller rows */
        .b-grid-header-container > .b-grid-splitter,
        .b-grid-vertical-scroller > .b-grid-splitter,
        .b-grid-footer-container > .b-grid-splitter,
        .b-virtual-scrollers > .b-grid-splitter {
            display: none !important;
        }

        /* 3. Hide the gantt toolbar row (Baseline / Shift dates / zoom / etc.) */
        .toolbar__FilterBarWrapper-kUPJEs {
            display: none !important;
        }

        /* 4. Make the task list (left side) fill the full width */
        .b-grid-subgrid-locked {
            width: 100% !important;
            flex-basis: 100% !important;
            max-width: 100% !important;
        }
        .b-grid-header-scroller-locked,
        #b-gantt-5-lockedSubgrid-header,
        #b-gantt-5-lockedSubgrid-footer {
            width: 100% !important;
        }
    `;

    function applyStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = HIDE_CSS;
        document.head.appendChild(style);
    }

    function removeStyle() {
        const el = document.getElementById(STYLE_ID);
        if (el) el.remove();
    }

    const LS_CALENDAR_HIDDEN = 'rl-calendar-hidden';
    const TOGGLE_BTN_ID = 'rl-calendar-toggle-btn';

    function isCalendarHidden() {
        return localStorage.getItem(LS_CALENDAR_HIDDEN) !== '0';
    }

    function syncHideStyleForCurrentUrl() {
        if (PROJECT_URL_PATTERN.test(location.pathname)) {
            if (isCalendarHidden()) {
                if (document.head) applyStyle();
                else document.addEventListener('DOMContentLoaded', applyStyle, { once: true });
            } else {
                removeStyle();
            }
            if (document.body) injectToggleButton();
            else document.addEventListener('DOMContentLoaded', injectToggleButton, { once: true });
        } else {
            removeStyle();
            const btn = document.getElementById(TOGGLE_BTN_ID);
            if (btn) btn.remove();
        }
    }

    function updateToggleButton() {
        const btn = document.getElementById(TOGGLE_BTN_ID);
        if (!btn) return;
        const hidden = isCalendarHidden();
        btn.title = hidden ? 'Show calendar' : 'Hide calendar';
        btn.style.background = hidden ? 'var(--scarlet-gray-100, #e0e0e0)' : 'transparent';
    }

    function injectToggleButton() {
        if (document.getElementById(TOGGLE_BTN_ID)) { updateToggleButton(); return; }

        const presentBtn = document.querySelector('[data-cy="present_phase.exit"]');
        const container = presentBtn
            ? presentBtn.closest('.fullscreen__Action-fhhebC') || presentBtn.parentElement
            : null;
        if (!container) {
            setTimeout(injectToggleButton, 500);
            return;
        }

        const btn = document.createElement('button');
        btn.id = TOGGLE_BTN_ID;
        btn.type = 'button';
        btn.className = presentBtn.className;
        btn.innerHTML = `<span class="flex items-center rl-left-icon"><svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M26,4h-4V2h-2v2h-8V2h-2v2H6C4.9,4,4,4.9,4,6v20c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V6C28,4.9,27.1,4,26,4z M26,26H6V12h20V26z M26,10H6V6h4v2h2V6h8v2h2V6h4V10z"/></svg></span>`;

        btn.addEventListener('click', () => {
            const wasHidden = isCalendarHidden();
            localStorage.setItem(LS_CALENDAR_HIDDEN, wasHidden ? '0' : '1');
            if (wasHidden) removeStyle(); else applyStyle();
            updateToggleButton();
        });

        container.appendChild(btn);
        updateToggleButton();
    }

    // =========================================================================
    // Feature 2: Floating chat panel on the timeline page
    // =========================================================================

    // Two conversations the user can toggle between.
    // 12287338 = Private chat, 12287339 = General chat (Rocketlane default ordering).
    // If the IDs differ for other projects, update them here.
    const CONVERSATIONS = [
        { key: 'private', label: 'Private', id: 12287338 },
        { key: 'general', label: 'General', id: 12287339 },
    ];

    // Only show the floating chat on the timeline page:
    //   /projects/<projectId>/plan/timeline
    const TIMELINE_URL_PATTERN = /^\/projects\/(\d+)\/plan\/timeline(\/|$)/;

    // LocalStorage keys for remembering panel size, collapsed state, active convo
    const LS_COLLAPSED    = 'rl-floating-chat-collapsed';
    const LS_WIDTH        = 'rl-floating-chat-width';
    const LS_HEIGHT       = 'rl-floating-chat-height';
    const LS_ACTIVE_CONVO = 'rl-floating-chat-active-convo';

    const PANEL_ID = 'rl-floating-chat-panel';

    function getProjectIdFromTimelineUrl() {
        const m = location.pathname.match(TIMELINE_URL_PATTERN);
        return m ? m[1] : null;
    }

    function getActiveConversation() {
        const saved = localStorage.getItem(LS_ACTIVE_CONVO);
        return CONVERSATIONS.find(c => c.key === saved) || CONVERSATIONS[0];
    }

    function chatUrlFor(projectId, conversationId) {
        return `/projects/${projectId}/chat/${conversationId}`;
    }

    // Inject CSS into an iframe to show only the message list + composer.
    // Shared by every conversation iframe so the hiding stays consistent.
    function injectIframeStyles(frame) {
        try {
            const doc = frame.contentDocument;
            if (!doc) return;
            if (doc.getElementById('rl-chat-embed-style')) return; // already injected
            const style = doc.createElement('style');
            style.id = 'rl-chat-embed-style';
            style.textContent = `
                /* -- Hide app-level chrome (left nav, top bar) -- */
                aside,
                nav,
                header,
                [class*="SideNav"],
                [class*="TopBar"],
                [class*="AppHeader"],
                [class*="PageHeader"],
                [class*="Breadcrumb"],
                [class*="Navbar"] {
                    display: none !important;
                }

                /* -- Hide the chat page's own conversation-list sidebar,
                      the conversation title bar, and the draggable handle.
                      IMPORTANT: the sidebar is wrapped in an outer
                      .resizable__Wrapper / .resizable-wrapper that reserves
                      ~253px horizontally even when its contents are hidden,
                      so we have to kill the wrapper itself, not just its
                      children. -- */
                .resizable-wrapper,
                [class*="resizable__Wrapper"],
                [data-test-id="projects.conversations.sidebar"],
                [class*="project-spacesstyles__Sider"],
                [class*="new-conversation-action__Wrapper"],
                [class*="styles__Conversations-"],
                [class*="styles__ConversationList-"],
                [class*="ConversationList"],
                [class*="ChatSidebar"],
                [class*="ChatList"],
                [class*="ChannelList"],
                [class*="ChatHeader"],
                [class*="ConversationHeader"],
                [class*="resizable__DraggableHandle"],
                [class*="DraggableHandle"] {
                    display: none !important;
                    width: 0 !important;
                    min-width: 0 !important;
                    max-width: 0 !important;
                    flex: 0 0 0 !important;
                }

                /* -- Let the main chat pane fill the full iframe -- */
                html, body, #root, main,
                [class*="MainContent"],
                [class*="ChatContainer"],
                [class*="ChatPage"],
                [class*="ConversationView"] {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: 100% !important;
                    overflow: hidden !important;
                }

                /* -- Hide the conversation details banner (title, "created this
                      conversation" blurb, Add people / Copy link buttons) to
                      give more vertical space to the actual messages -- */
                [class*="ChannelDetailsWrapper"] {
                    display: none !important;
                }

                /* -- Keep: message list + composer (action bar) -- */
                [class*="MessageList"],
                [class*="MessagesList"],
                [class*="ConversationBody"],
                [class*="action-bar"] {
                    display: flex !important;
                }
            `;
            doc.head.appendChild(style);
        } catch (e) {
            console.warn('[rl-floating-chat] could not style iframe:', e);
        }
    }

    function buildPanel(projectId) {
        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        const collapsed = localStorage.getItem(LS_COLLAPSED) === '1';
        const width  = localStorage.getItem(LS_WIDTH)  || '420px';
        const height = localStorage.getItem(LS_HEIGHT) || '560px';

        panel.style.cssText = `
            position: fixed;
            right: 16px;
            bottom: 16px;
            width: ${width};
            height: ${collapsed ? '40px' : height};
            min-width: 280px;
            min-height: 40px;
            max-width: 90vw;
            max-height: 90vh;
            z-index: 2147483000;
            background: #fff;
            border: 1px solid #d0d7de;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            resize: both;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        `;

        // Header bar (drag + collapse/close buttons)
        const header = document.createElement('div');
        header.style.cssText = `
            flex: 0 0 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            background: #f6f8fa;
            border-bottom: 1px solid #d0d7de;
            cursor: move;
            user-select: none;
            font-size: 13px;
            font-weight: 600;
            color: #24292f;
        `;
        const activeConvo = getActiveConversation();
        const tabButtonsHtml = CONVERSATIONS.map(c => `
            <button type="button"
                data-role="convo-tab"
                data-convo-key="${c.key}"
                style="
                    border: 1px solid #d0d7de;
                    background: ${c.key === activeConvo.key ? '#0969da' : '#fff'};
                    color:      ${c.key === activeConvo.key ? '#fff'    : '#24292f'};
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 6px;
                    margin-right: 4px;
                ">${c.label}</button>
        `).join('');

        header.innerHTML = `
            <span style="display:flex;align-items:center;gap:6px;">
                <span>💬</span>
                ${tabButtonsHtml}
            </span>
            <span>
                <button type="button" data-role="collapse"
                    style="border:none;background:transparent;cursor:pointer;font-size:16px;padding:4px 8px;">
                    ${collapsed ? '▲' : '▼'}
                </button>
                <button type="button" data-role="close"
                    style="border:none;background:transparent;cursor:pointer;font-size:16px;padding:4px 8px;">
                    ✕
                </button>
            </span>
        `;

        // Container that holds one iframe per conversation. We mount them
        // all at once and just toggle visibility on tab-switch, so the
        // switch feels instant (no reload flash, no re-login, CKEditor
        // state in the other tab is preserved).
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            flex: 1 1 auto;
            position: relative;
            width: 100%;
            display: ${collapsed ? 'none' : 'block'};
            background: #fff;
        `;

        const iframesByKey = {};
        CONVERSATIONS.forEach(c => {
            const frame = document.createElement('iframe');
            frame.src = chatUrlFor(projectId, c.id);
            frame.dataset.convoKey = c.key;
            const isActive = c.key === activeConvo.key;
            frame.style.cssText = `
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                border: 0;
                background: #fff;
                opacity: ${isActive ? '1' : '0'};
                pointer-events: ${isActive ? 'auto' : 'none'};
                transition: opacity 120ms ease;
            `;
            frame.addEventListener('load', () => injectIframeStyles(frame));
            iframesByKey[c.key] = frame;
            iframeContainer.appendChild(frame);
        });

        panel.appendChild(header);
        panel.appendChild(iframeContainer);

        // --- Interactions ---
        header.querySelector('[data-role="collapse"]').addEventListener('click', () => {
            const isCollapsed = iframeContainer.style.display === 'none';
            if (isCollapsed) {
                iframeContainer.style.display = 'block';
                panel.style.height = localStorage.getItem(LS_HEIGHT) || '560px';
                header.querySelector('[data-role="collapse"]').textContent = '▼';
                localStorage.setItem(LS_COLLAPSED, '0');
            } else {
                // Remember current height before collapsing
                localStorage.setItem(LS_HEIGHT, panel.style.height || '560px');
                iframeContainer.style.display = 'none';
                panel.style.height = '40px';
                header.querySelector('[data-role="collapse"]').textContent = '▲';
                localStorage.setItem(LS_COLLAPSED, '1');
            }
        });

        header.querySelector('[data-role="close"]').addEventListener('click', () => {
            panel.remove();
        });

        // Conversation tab switching — instant fade between preloaded iframes.
        header.querySelectorAll('[data-role="convo-tab"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-convo-key');
                const convo = CONVERSATIONS.find(c => c.key === key);
                if (!convo) return;
                localStorage.setItem(LS_ACTIVE_CONVO, convo.key);

                // Update button styles
                header.querySelectorAll('[data-role="convo-tab"]').forEach(b => {
                    const isActive = b.getAttribute('data-convo-key') === convo.key;
                    b.style.background = isActive ? '#0969da' : '#fff';
                    b.style.color      = isActive ? '#fff'    : '#24292f';
                });

                // Cross-fade: show the chosen iframe, hide the others. Both
                // are already loaded so there's no network round-trip.
                Object.entries(iframesByKey).forEach(([k, frame]) => {
                    const isActive = k === convo.key;
                    frame.style.opacity = isActive ? '1' : '0';
                    frame.style.pointerEvents = isActive ? 'auto' : 'none';
                });
            });
        });

        // Block ALL iframes on the page during drag/resize so mouseup
        // is never swallowed by an iframe.
        let iframeOverlay = null;
        function blockIframes() {
            if (iframeOverlay) return;
            iframeOverlay = document.createElement('div');
            iframeOverlay.style.cssText =
                'position:fixed;inset:0;z-index:2147483001;cursor:inherit;';
            document.body.appendChild(iframeOverlay);
        }
        function unblockIframes() {
            if (iframeOverlay) { iframeOverlay.remove(); iframeOverlay = null; }
        }

        // --- Drag to move ---
        let dragging = false, startX = 0, startY = 0, startRight = 0, startBottom = 0;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startRight  = window.innerWidth  - rect.right;
            startBottom = window.innerHeight - rect.bottom;
            blockIframes();
            e.preventDefault();
        });

        // --- Edge & corner resize handles ---
        const edges = [
            { name: 'top',          cursor: 'ns-resize',   css: 'top:0;left:6px;right:6px;height:6px;' },
            { name: 'bottom',       cursor: 'ns-resize',   css: 'bottom:0;left:6px;right:6px;height:6px;' },
            { name: 'left',         cursor: 'ew-resize',   css: 'left:0;top:6px;bottom:6px;width:6px;' },
            { name: 'right',        cursor: 'ew-resize',   css: 'right:0;top:6px;bottom:6px;width:6px;' },
            { name: 'top-left',     cursor: 'nwse-resize', css: 'top:0;left:0;width:10px;height:10px;' },
            { name: 'top-right',    cursor: 'nesw-resize', css: 'top:0;right:0;width:10px;height:10px;' },
            { name: 'bottom-left',  cursor: 'nesw-resize', css: 'bottom:0;left:0;width:10px;height:10px;' },
            { name: 'bottom-right', cursor: 'nwse-resize', css: 'bottom:0;right:0;width:10px;height:10px;' },
        ];
        edges.forEach(({ name, cursor, css }) => {
            const h = document.createElement('div');
            h.dataset.resize = name;
            h.style.cssText = `position:absolute;${css}cursor:${cursor};z-index:10;`;
            panel.appendChild(h);
        });

        let resizing = false, resizeEdge = '', rStartX = 0, rStartY = 0;
        let rStartW = 0, rStartH = 0, rStartRight = 0, rStartBottom = 0;

        panel.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('[data-resize]');
            if (!handle) return;
            resizing = true;
            resizeEdge = handle.dataset.resize;
            rStartX = e.clientX;
            rStartY = e.clientY;
            const rect = panel.getBoundingClientRect();
            rStartW = rect.width;
            rStartH = rect.height;
            rStartRight  = parseFloat(panel.style.right)  || 0;
            rStartBottom = parseFloat(panel.style.bottom) || 0;
            blockIframes();
            e.preventDefault();
            e.stopPropagation();
        });

        // --- Shared mousemove / mouseup on window ---
        window.addEventListener('mousemove', (e) => {
            if (dragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                panel.style.right  = Math.max(0, startRight  - dx) + 'px';
                panel.style.bottom = Math.max(0, startBottom - dy) + 'px';
                return;
            }
            if (resizing) {
                const dx = e.clientX - rStartX;
                const dy = e.clientY - rStartY;
                const minW = 280, minH = 200;

                if (resizeEdge.includes('left')) {
                    panel.style.width = Math.max(minW, rStartW - dx) + 'px';
                }
                if (resizeEdge.includes('right')) {
                    const newW = Math.max(minW, rStartW + dx);
                    panel.style.width = newW + 'px';
                    panel.style.right = (rStartRight - (newW - rStartW)) + 'px';
                }
                if (resizeEdge.includes('top')) {
                    panel.style.height = Math.max(minH, rStartH - dy) + 'px';
                }
                if (resizeEdge.includes('bottom')) {
                    const newH = Math.max(minH, rStartH + dy);
                    panel.style.height = newH + 'px';
                    panel.style.bottom = (rStartBottom - (newH - rStartH)) + 'px';
                }
            }
        });

        function stopAll() {
            if (dragging || resizing) {
                dragging = false;
                resizing = false;
                unblockIframes();
                localStorage.setItem(LS_WIDTH,  panel.style.width);
                localStorage.setItem(LS_HEIGHT, panel.style.height);
            }
        }
        window.addEventListener('mouseup', stopAll);
        document.addEventListener('mouseup', stopAll);
        window.addEventListener('blur', stopAll);

        return panel;
    }

    function mountPanel() {
        if (document.getElementById(PANEL_ID)) return; // already mounted
        const projectId = getProjectIdFromTimelineUrl();
        if (!projectId) return;
        document.body.appendChild(buildPanel(projectId));
    }

    function unmountPanel() {
        const el = document.getElementById(PANEL_ID);
        if (el) el.remove();
    }

    function syncChatPanelForCurrentUrl() {
        if (TIMELINE_URL_PATTERN.test(location.pathname)) {
            if (document.body) mountPanel();
            else document.addEventListener('DOMContentLoaded', mountPanel, { once: true });
        } else {
            unmountPanel();
        }
    }

    // =========================================================================
    // SPA navigation: run both features on every client-side nav
    // =========================================================================

    function syncAll() {
        syncHideStyleForCurrentUrl();
        syncChatPanelForCurrentUrl();
    }

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () {
        origPush.apply(this, arguments);
        syncAll();
    };
    history.replaceState = function () {
        origReplace.apply(this, arguments);
        syncAll();
    };
    window.addEventListener('popstate', syncAll);

    syncAll();
})();
