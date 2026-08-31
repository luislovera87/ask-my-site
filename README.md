# Ask My Site

A tiny Vite + vanilla JS storefront that demonstrates [WebMCP](https://webmachinelearning.github.io/webmcp/):
it registers three tools on `document.modelContext` using [`@mcp-b/global`](https://www.npmjs.com/package/@mcp-b/global),
so an AI agent (or any WebMCP client) can search products, add items to the cart, and apply a discount
code — with every call visibly mutating shared page state and logged in an on-page activity panel.

## Note on the `@mcp-b/global` API

The brief for this project assumed tools would be registered on `window.mcp`. That's not how the package
actually works: `@mcp-b/global` polyfills/wraps the real [WebMCP spec surface](https://webmachinelearning.github.io/webmcp/),
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
│   ├── ui/catalog.js        # product grid
│   ├── ui/cart.js           # cart + totals, re-renders on state change
│   ├── ui/activity-log.js   # "Agent Activity Log" panel
│   └── state.js             # shared in-memory store (cart, discount, activity log) + pub/sub
└── styles.css
```

## Setup

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

## Notes

- State (`src/state.js`) is a single in-memory object with a tiny pub/sub. All three tools — and the
  Dev Console — mutate it through the same functions the UI reads, so calling a tool updates the DOM
  reactively with no page reload.
- Refreshing the page resets the cart/discount/log (in-memory only, no persistence), by design for a
  demo.
