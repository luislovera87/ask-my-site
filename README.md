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
├── src/
│   ├── main.js              # wires state + UI + tool registration together
│   ├── data/products.js     # 8 hardcoded products
│   ├── webmcp/tools.js      # registers search_products, add_to_cart, apply_discount_code
│   ├── webmcp/execute.js    # shared "call the real registered tool" + tool-schema helper
│   ├── chat/api-key.js      # in-memory (+ opt-in sessionStorage) API key handling
│   ├── chat/agent.js        # Anthropic client + the tool_use -> execute -> tool_result loop
│   ├── ui/catalog.js        # product grid
│   ├── ui/cart.js           # cart + totals, re-renders on state change
│   ├── ui/activity-log.js   # "Agent Activity Log" panel
│   ├── ui/chat-panel.js     # chat UI: key entry, model select, message list
│   └── state.js             # shared in-memory store (cart, discount, activity log) + pub/sub
└── styles.css
```

## Setup

Requires Node 20+ (a dependency of `@mcp-b/global` requires it).

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

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
scripted demo. Paste your own [Anthropic API key](https://platform.claude.com/) into the field there
and ask it things like "search for coffee gear", "add the notebook to my cart", or "apply SAVE10".

How it works:

1. On send, the page builds the tool list for the API call by calling
   `document.modelContext.getTools()` **at that moment** — the same registry the catalog/cart/Dev
   Console/native-agent paths all use. Nothing about the tool schemas is hand-duplicated; if you edit
   `src/webmcp/tools.js`, the chat sees the change on the next message with no other code to update.
2. It calls the Anthropic Messages API (`client.messages.create`) with that tool list and the
   conversation so far.
3. If the model responds with `tool_use`, the page executes it through the exact same registered-tool
   pipeline the Dev Console uses (`src/webmcp/execute.js` — prefers the native
   `document.modelContext.executeTool` behind the WebMCP flag, falls back to
   `navigator.modelContextTesting.executeTool` otherwise), feeds the `tool_result` back, and loops
   until the model returns a final answer. Multiple tool calls in one turn are all executed and
   returned together, per the API's parallel-tool-use contract.
4. Every one of those tool calls lands in the Agent Activity Log automatically, because step 3 runs
   through each tool's real `execute()` handler — the same one wired up in `webmcp/tools.js` — not a
   shortcut.

**Why this demo is shaped this way:** the point of WebMCP is that a website *publishes* tools; the
agent (and its model, and its API key) is expected to live somewhere else entirely — a browser
extension, a separate app, a server. This chat panel puts a model in the page itself only so you can
see the whole loop working without installing a separate WebMCP client. It is a demonstration of the
tool-calling contract, not a template for how a production chat feature should be built.

### Security note — read this before pasting a real key

This chat panel calls `api.anthropic.com` **directly from the browser**, using the SDK's
`dangerouslyAllowBrowser: true` option (which is what makes the SDK send the
`anthropic-dangerous-direct-browser-access: true` header the API requires for any browser-origin
request). That means:

- Your API key is held as a plain JS variable in page memory. Any script that runs on this page — a
  browser extension, a dev-tools snippet, a future bug in this code — can read it.
- **Default behavior:** the key lives in memory only and is gone on refresh. Checking "remember for
  this tab only" also writes it to `sessionStorage` (cleared when the tab closes) — that's the only
  persistence option, and it's opt-in. The key is **never** written to `localStorage`, never sent
  anywhere except `api.anthropic.com`, and never committed to this repo.
- Use the **"Clear key"** button to wipe it from memory and `sessionStorage` immediately.
- **This pattern is fine for a local, single-user demo you run on your own machine and is not fine for
  a real product.** For anything beyond a demo, put a small server (even a one-route Vite dev-server
  proxy, or any tiny backend) between the browser and Anthropic, keep the key server-side in an
  uncommitted `.env`, and have the browser call your server instead. We didn't build it that way here
  specifically *because* the point of this feature is "paste a key, watch a real model call the page's
  published tools" — a proxy would move the key off the page but also move the API call off the page,
  which defeats the demo.

## Notes

- State (`src/state.js`) is a single in-memory object with a tiny pub/sub. All three tools — the Dev
  Console, and the chat agent loop — mutate it through the same functions the UI reads, so calling a
  tool updates the DOM reactively with no page reload.
- Refreshing the page resets the cart/discount/log/chat history (in-memory only, no persistence), by
  design for a demo.
- In dev mode (`npm run dev`), `window.__chatDevHooks` exposes the agent loop, its error type, and the
  Anthropic SDK export — used to exercise the `tool_use` → execute → `tool_result` loop and the
  401/429/network error paths against mocked API responses, without a real key. It's stripped from a
  production build (`import.meta.env.DEV`-gated).
