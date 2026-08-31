# Ask My Site

A tiny Vite + vanilla JS storefront that demonstrates [WebMCP](https://webmachinelearning.github.io/webmcp/):
it registers three tools on `document.modelContext` using [`@mcp-b/global`](https://www.npmjs.com/package/@mcp-b/global),
so an AI agent (or any WebMCP client) can search products, add items to the cart, and apply a discount
code — with every call visibly mutating shared page state and logged in an on-page activity panel.

## Note on the `@mcp-b/global` API

It's a common assumption that a package like this would register tools on something like `window.mcp`.
It doesn't: `@mcp-b/global` polyfills/wraps the real [WebMCP spec surface](https://webmachinelearning.github.io/webmcp/),
`document.modelContext`. Tools are registered with:

```js
import '@mcp-b/global';

await document.modelContext.registerTool({
  name: 'my_tool',
  description: '...',
  inputSchema: { type: 'object', properties: { ... } },
  async execute(args) {
    return { content: [{ type: 'text', text: '...' }] };
  },
});
```

This app follows the real API — see `src/webmcp/tools.js`.

## Project structure

```
ask-my-site/
├── index.html
├── package.json
├── vite.config.js
├── .env.example              # copy to .env and fill in ANTHROPIC_API_KEY
├── server/
│   └── anthropic-proxy.js    # Vite dev/preview-server plugin: holds the key, relays POST /api/chat
├── src/
│   ├── main.js                # wires state + UI + tool registration together
│   ├── data/products.js       # 8 hardcoded products
│   ├── webmcp/tools.js        # registers search_products, add_to_cart, apply_discount_code
│   ├── webmcp/execute.js      # shared "call the real registered tool" + tool-schema helper
│   ├── chat/proxy-client.js   # fetch('/api/chat') + error classification (no key, no SDK client)
│   ├── chat/agent.js          # the tool_use -> execute -> tool_result loop
│   ├── ui/catalog.js          # product grid
│   ├── ui/cart.js             # cart + totals, re-renders on state change
│   ├── ui/activity-log.js     # "Agent Activity Log" panel
│   ├── ui/chat-panel.js       # chat UI: model select, message list, proxy status
│   └── state.js               # shared in-memory store (cart, discount, activity log) + pub/sub
└── styles.css
```

## Setup

Requires Node 20+ (a dependency of `@mcp-b/global` requires it).

```bash
npm install
cp .env.example .env    # then edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`). The catalog, cart, Dev Console, and
Activity Log all work with no key at all — only the chat panel needs `ANTHROPIC_API_KEY` set.

## The three WebMCP tools

| Tool | Args | Behavior |
| --- | --- | --- |
| `search_products` | `{ query: string }` | Matches product name or tag (case-insensitive substring) |
| `add_to_cart` | `{ product_id: string, quantity?: number }` | Adds/increments a cart line; throws (→ tool error) if `product_id` doesn't exist |
| `apply_discount_code` | `{ code: string }` | Applies 10% off if `code === "SAVE10"` (case-insensitive); otherwise returns a tool error and leaves the cart untouched |

Every call — success or failure — is appended to the **Agent Activity Log** panel with a timestamp, the
tool name, the raw arguments, and the result (or error message).

## Testing without the Chrome WebMCP flag

`@mcp-b/global` also installs `navigator.modelContextTesting`, a testing shim that mirrors whatever is
registered on `document.modelContext`. This app uses it to power a **Dev Console** panel on the page
itself (below the catalog/cart), with a small form per tool. Submitting a form calls:

```js
await navigator.modelContextTesting.executeTool(toolName, JSON.stringify(args));
```

This exercises the *exact same* registered tool — schema, `execute()` handler, state mutation, and
activity logging — as a real agent would, so you can verify the whole flow with zero browser flags.
Try:

- `search_products` with `query = "coffee"`
- `add_to_cart` with `product_id = "p2"`, `quantity = 2`
- `apply_discount_code` with `code = "NOPE"` (should log an error and leave totals unchanged)
- `apply_discount_code` with `code = "SAVE10"` (should apply 10% off)

## Testing with a real WebMCP agent in Chrome

To have an actual AI agent extension discover and call these tools via the native browser API instead
of the polyfill:

1. Use a recent Chromium build (Chrome or Edge) that ships the WebMCP origin trial / experimental flag.
2. Go to `chrome://flags`, search for **"WebMCP"** (may appear as "Enable WebMCP API" or similar —
   naming has shifted across Chrome versions since this is an active spec), enable it, and relaunch
   the browser.
3. Confirm activation: open DevTools console on the running app and check
   `'modelContext' in document` and `document.modelContext.executeTool`. If `executeTool` exists as a
   function, the native implementation is active (not just the polyfill).
4. With the app open at `http://localhost:5173`, connect a WebMCP-aware agent/extension to the tab. It
   will see `search_products`, `add_to_cart`, and `apply_discount_code` via `getTools()` and can call
   them directly — you should see the catalog/cart/log update live in the page, exactly as the Dev
   Console does.

If the flag isn't available in your Chrome build yet, the Dev Console above is a faithful stand-in:
it goes through the same `registerTool`/`execute` code path, just invoked via the testing shim instead
of a native agent connection.

## Chat with a real agent

Below the catalog/cart is a chat panel where an actual Claude model does the tool selection — not a
scripted demo. Set `ANTHROPIC_API_KEY` in `.env` (see Setup above) and ask it things like "search for
coffee gear", "add the notebook to my cart", or "apply SAVE10". The key never reaches the browser —
there's nothing to paste in the UI.

How it works:

1. On send, the page builds the tool list for the API call by calling
   `document.modelContext.getTools()` **at that moment** — the same registry the catalog/cart/Dev
   Console/native-agent paths all use. Nothing about the tool schemas is hand-duplicated; if you edit
   `src/webmcp/tools.js`, the chat sees the change on the next message with no other code to update.
2. The browser sends the tool list and conversation to `POST /api/chat` — a route on the same Vite dev
   server, not to Anthropic directly. `server/anthropic-proxy.js` is a small Vite plugin (`configureServer`
   / `configurePreviewServer` middleware) that reads `ANTHROPIC_API_KEY` server-side (via `loadEnv`, so
   it works for a plain, non-`VITE_`-prefixed variable), attaches it as `x-api-key`, and forwards the
   request to the real Anthropic Messages API, relaying the response back verbatim. It holds no
   conversation state of its own — it's a pass-through relay, not a second copy of the agent loop.
3. If the model responds with `tool_use`, **the browser** executes it through the exact same
   registered-tool pipeline the Dev Console uses (`src/webmcp/execute.js` — prefers the native
   `document.modelContext.executeTool` behind the WebMCP flag, falls back to
   `navigator.modelContextTesting.executeTool` otherwise), feeds the `tool_result` back, and loops
   until the model returns a final answer. Multiple tool calls in one turn are all executed and
   returned together, per the API's parallel-tool-use contract. **Tool execution deliberately stays
   client-side** — the tools act on live page DOM/state (the cart, the catalog) that only exists in the
   browser, so moving execution to the server would mean the server driving a browser it doesn't have.
4. Every one of those tool calls lands in the Agent Activity Log automatically, because step 3 runs
   through each tool's real `execute()` handler — the same one wired up in `webmcp/tools.js` — not a
   shortcut.

So the split is: **model call** goes through the server (key stays there); **tool execution** stays in
the browser (state stays there). The agentic loop itself — deciding when to call the model again after
a tool result — also stays client-side, since it's just orchestrating those two things.

### Why a backend, and what's still missing for production

Keeping `ANTHROPIC_API_KEY` server-side means page JavaScript, browser extensions, and anyone poking at
dev tools can no longer read it out of the page — that's the entire reason for this shape, and it's a
real improvement over an in-browser key. But **`/api/chat` itself has no authentication, no rate
limiting, and no per-user quota.** As shipped, anyone who can reach this dev server (anyone on your
LAN if it's exposed, anyone with the URL if it's deployed as-is) can call `/api/chat` freely and spend
your Anthropic quota — the key is off the page, but the endpoint that holds it is still wide open. A
real deployment would need, at minimum: authenticating callers of `/api/chat` (session/cookie, a
per-user token, or similar), rate limiting per caller, and probably request/response logging for abuse
review. None of that is implemented here — this is still a local, single-developer demo, just one
where the credential-handling mistake ("key in the browser") is fixed and the remaining-work list is
now about the proxy endpoint instead of the page.

## Notes

- State (`src/state.js`) is a single in-memory object with a tiny pub/sub. All three tools — the Dev
  Console, and the chat agent loop — mutate it through the same functions the UI reads, so calling a
  tool updates the DOM reactively with no page reload.
- Refreshing the page resets the cart/discount/log/chat history (in-memory only, no persistence), by
  design for a demo.
- If `ANTHROPIC_API_KEY` isn't set, the chat panel shows a clear status message (not a stack trace) and
  disables the Send button — the proxy also refuses `POST /api/chat` with a `503` and an explicit
  `missing_api_key` error type in that case.
- In dev mode (`npm run dev`), `window.__chatDevHooks` exposes the agent loop and its error type — used
  to exercise the `tool_use` → execute → `tool_result` loop and the 401/429/missing-key/network error
  paths against a mocked `createMessage`, without a real key or a running proxy. It's stripped from a
  production build (`import.meta.env.DEV`-gated).
