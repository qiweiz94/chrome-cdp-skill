# chrome-cdp

Let your AI agent inspect and interact with Chrome over the DevTools Protocol. It can attach to an isolated debug profile for safer automation, or to your **live Chrome session** when you explicitly accept the risk of exposing your current tabs, logged-in accounts, and page state.

Works out of the box with any Chrome installation. No browser automation framework, no separate browser instance, no re-login when you intentionally choose live-session mode.

## Why this matters

Most browser automation tools launch a fresh, isolated browser. This one can connect to the Chrome you're already running, so your agent can:

- Read pages you're logged into (Gmail, GitHub, internal tools, ...)
- Interact with tabs you're actively working in
- See the actual state of a page mid-workflow, not a clean reload

## Security model

This tool is intentionally powerful.

- Safe mode, recommended: run Chrome or Chrome for Testing with a dedicated debug profile or non-default `--user-data-dir`, then enable remote debugging there.
- Live-session mode, advanced and high-risk: connect to your everyday logged-in browser profile only when you trust the local machine and the agent using this skill.
- `eval` executes arbitrary JavaScript in the page context.
- `evalraw` can send arbitrary CDP commands.
- Remote debugging can expose authenticated browser state. Do not use this on shared or untrusted machines.
- `CDP_HOST` is restricted to loopback by default. To connect to a remote DevTools endpoint, set `CDP_ALLOW_REMOTE_HOST=1` as an explicit opt-in.

## Installation

### As a pi skill

```bash
pi install git:github.com/pasky/chrome-cdp-skill@v1.0.1
```

### For other agents (Amp, Claude Code, Cursor, etc.)

Clone or copy the `skills/chrome-cdp/` directory wherever your agent loads skills or context from. The only runtime dependency is **Node.js 22+** — no npm install needed.

### Enable remote debugging in Chrome

Navigate to `chrome://inspect/#remote-debugging` and toggle the switch. That's it.

For the safest setup, prefer an isolated browser profile or Chrome for Testing instead of your daily profile.

The CLI auto-detects Chrome, Chromium, Brave, Edge, and Vivaldi on macOS, Linux, and Windows. If your browser stores `DevToolsActivePort` in a non-standard location, set the `CDP_PORT_FILE` environment variable to the full path.

## Usage

```bash
scripts/cdp.mjs list                              # list open tabs
scripts/cdp.mjs shot   <target>                   # screenshot → runtime dir
scripts/cdp.mjs snap   <target>                   # accessibility tree (compact, semantic)
scripts/cdp.mjs html   <target> [".selector"]     # full HTML or scoped to CSS selector
scripts/cdp.mjs eval   <target> "expression"      # evaluate JS in page context
scripts/cdp.mjs nav    <target> https://...       # navigate and wait for load
scripts/cdp.mjs net    <target>                   # network resource timing
scripts/cdp.mjs click  <target> "selector"        # click element by CSS selector
scripts/cdp.mjs clickxy <target> <x> <y>          # click at CSS pixel coordinates
scripts/cdp.mjs type   <target> "text"            # type at focused element (works in cross-origin iframes)
scripts/cdp.mjs loadall <target> "selector"       # click "load more" until gone
scripts/cdp.mjs evalraw <target> <method> [json]  # raw CDP command passthrough
scripts/cdp.mjs open   [url]                      # open new tab (triggers Allow prompt)
scripts/cdp.mjs stop   [target]                   # stop daemon(s)
```

`<target>` is a unique prefix of the targetId shown by `list`.

`open [url]` now allows only `http://...`, `https://...`, or bare `open` with no URL, which uses `about:blank`.

## Why not chrome-devtools-mcp?

[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) reconnects on every command, so Chrome's "Allow debugging" modal can re-appear repeatedly and target enumeration times out with many tabs open. `chrome-cdp` holds one persistent daemon per tab — the modal fires once, and it handles 100+ tabs reliably.

## How it works

Connects directly to Chrome's remote debugging WebSocket — no Puppeteer, no intermediary. On first access to a tab, a lightweight background daemon is spawned that holds the session open. Chrome's "Allow debugging" modal appears once per tab; subsequent commands reuse the daemon silently. Daemons auto-exit after 20 minutes of inactivity.

This approach is also why it handles 100+ open tabs reliably, where tools built on Puppeteer often time out during target enumeration.

On Unix-like systems, daemon IPC is scoped by a private runtime directory and per-user socket permissions. On Windows, named-pipe security depends on OS defaults; treat Windows support as same-user local use only unless you have verified your host's pipe ACL behavior.
