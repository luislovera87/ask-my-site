# Prop Vault

A fully static, vanilla-JS e-commerce demo — a fictional shop selling 1,018 parody-inspired movie
props (capes, blasters, helmets, a car or two) — that also happens to publish
[WebMCP](https://webmachinelearning.github.io/webmcp/) tools on `document.modelContext` via
[`@mcp-b/global`](https://www.npmjs.com/package/@mcp-b/global): `search_products`, `add_to_cart`,
and `apply_discount_code`.

**The page itself never mentions WebMCP, MCP, or "agents" anywhere** — that's deliberate. The whole
point of WebMCP is that a site *publishes* tools; the agent that discovers and calls them (Claude,
ChatGPT, a browser extension) is expected to live somewhere else entirely, not be advertised on the
page. So this reads as a completely ordinary storefront to a human visitor — hero, search, category
filters, real "Add to cart" buttons, an interactive cart with quantity steppers and a discount code —
while the tools quietly exist underneath for anything that knows to look for them via
`document.modelContext.getTools()`.

## Project structure

```
ask-my-site/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js               # wires state + UI + tool registration together
│   ├── data/products.js      # 18 hand-written products + a deterministic generator for 1,000 more
│   ├── webmcp/tools.js       # registers search_products, add_to_cart, apply_discount_code
│   ├── webmcp/execute.js     # "call the real registered tool" helper
│   ├── ui/catalog.js         # product grid, category icons, rarity badges, search/filter, pagination
│   ├── ui/cart.js            # interactive cart: qty steppers, remove, discount code, totals
│   └── state.js              # shared in-memory store (cart, discount) + pub/sub
└── styles.css
```

## Setup

Requires Node 20+ (a dependency of `@mcp-b/global` requires it).

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`). Everything works immediately — no
`.env`, no key, no server to configure. It's a static site: `npm run build` produces a `dist/` folder
you can host anywhere, including GitHub Pages.

## The catalog

18 items are hand-written (`curated` in `src/data/products.js`) with real care put into their names,
descriptions, and the film each riffs on. The other 1,000 are generated deterministically at module
load from word banks (adjectives × category nouns × franchises × a rarity table weighted toward
common/rare) — same catalog on every load, not random, so search results and product IDs are stable
across reloads. Every product has a `tag` (category), a `rarity` (`common` / `rare` / `legendary`),
and an `inspiredBy` franchise line shown on its card.

The catalog panel paginates (24 at a time, "Load more") rather than rendering all 1,018 cards at once —
necessary at this scale, and also just normal e-commerce UX.

**Every item is an original, parody-inspired prop.** The "Inspired by" line names the film purely for
reference — nothing here is officially licensed, endorsed by, or affiliated with any studio or rights
holder, nothing is for sale, nothing ships. See the footer disclaimer on the page itself.

## The three WebMCP tools

| Tool | Args | Behavior |
| --- | --- | --- |
| `search_products` | `{ query: string }` | Matches product name or tag (case-insensitive substring); returns at most 20 results with a "+N more" note so a 1,018-item catalog never floods an agent's context |
| `add_to_cart` | `{ product_id: string, quantity?: number }` | Adds/increments a cart line; throws (→ tool error) if `product_id` doesn't exist |
| `apply_discount_code` | `{ code: string }` | Applies 10% off if `code === "SAVE10"` (case-insensitive); otherwise returns a tool error and leaves the cart untouched |

These are the same three tools whether they're called by a human clicking "Add to cart," the browser
console, or a real agent — `src/webmcp/execute.js` is the one code path everything goes through
(`document.modelContext.executeTool` behind the WebMCP flag, `navigator.modelContextTesting.executeTool`
otherwise), so nothing about the demo is a shortcut around the actual registered tool.

## Testing the tools without the Chrome WebMCP flag

There's no in-page dev console anymore (removed on purpose — see "why the page hides WebMCP" above).
To exercise a tool directly, open the browser console and call the testing shim
`@mcp-b/global` installs:

```js
const result = await navigator.modelContextTesting.executeTool('search_products', JSON.stringify({ query: 'blade' }));
JSON.parse(result);
```

This runs through the exact same registered tool — schema, `execute()` handler, state mutation — as a
real agent would.

## Testing with native Chrome WebMCP support (DevTools panel + real agents)

By default `@mcp-b/global` runs its own JS polyfill — invisible to Chrome's own tooling, so you won't
see anything under DevTools → Application → WebMCP, or find the site from a WebMCP-aware browser
extension, until you turn on Chrome's native implementation:

1. Go to `chrome://flags/#enable-webmcp-testing`, enable it, and relaunch Chrome (Chrome 149+; this is
   an active origin trial, so the exact flag may move — search `chrome://flags` for "WebMCP" if that
   link 404s).
2. Reload the app. `@mcp-b/global` auto-detects native support and wraps the real
   `document.modelContext` instead of its polyfill — no code change needed on our end.
3. Open DevTools → **Application → WebMCP**. The "Available Tools" pane should list
   `search_products`, `add_to_cart`, and `apply_discount_code`; "Invoked Tools" logs each call an agent
   makes, live.
4. A WebMCP-aware agent/extension connected to the tab will see the same three tools via `getTools()`
   and can call them directly — you'll see the catalog/cart update live in the page.

**If the panel still shows nothing** with the flag on: confirm `window.isSecureContext` is `true` in
the console (WebMCP requires HTTPS or `localhost`) and that you actually reloaded after flipping the
flag. There's no reliable way to detect native-vs-polyfill from page JS alone —
`document.modelContext.executeTool` exists on both, so don't use it as a signal.

## Notes

- State (`src/state.js`) is a single in-memory object with a tiny pub/sub. The WebMCP tools and the
  human-facing "Add to cart" / quantity / remove / discount controls all mutate it through the same
  functions, so either path updates the DOM reactively with no page reload.
- Refreshing the page resets the cart/discount (in-memory only, no persistence), by design for a demo.
- No backend, no API key, no secrets anywhere in this repo — it deploys as-is to GitHub Pages or any
  static host with no extra setup.
