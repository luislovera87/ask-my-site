import { toolsReady } from './webmcp/tools.js';
import { callRegisteredTool } from './webmcp/execute.js';
import { subscribe } from './state.js';
import { renderCatalog } from './ui/catalog.js';
import { renderCart } from './ui/cart.js';
import { renderActivityLog } from './ui/activity-log.js';
import { initChatPanel } from './ui/chat-panel.js';

const catalogEl = document.getElementById('catalog');
const cartEl = document.getElementById('cart');
const logEl = document.getElementById('activity-log');
const statusEl = document.getElementById('mcp-status');

function renderAll() {
  renderCart(cartEl);
  renderActivityLog(logEl);
}

renderCatalog(catalogEl);
renderAll();
subscribe(renderAll);

toolsReady
  .then(async () => {
    const tools = await document.modelContext.getTools();
    statusEl.textContent = `${tools.length} WebMCP tools registered on document.modelContext: ${tools
      .map((t) => t.name)
      .join(', ')}`;
  })
  .catch((err) => {
    statusEl.textContent = `Failed to register WebMCP tools: ${err.message}`;
  });

function wireDevForm(formId, buildArgs) {
  const form = document.getElementById(formId);
  const output = document.getElementById('dev-output');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const args = buildArgs(data);
    const toolName = form.dataset.tool ?? form.id.replace('form-', '');
    const result = await callRegisteredTool(toolName, args);
    output.textContent = `${toolName}(${JSON.stringify(args)}) ->\n${JSON.stringify(result, null, 2)}`;
  });
}

document.getElementById('form-search').dataset.tool = 'search_products';
document.getElementById('form-add').dataset.tool = 'add_to_cart';
document.getElementById('form-discount').dataset.tool = 'apply_discount_code';

wireDevForm('form-search', (data) => ({ query: data.get('query') }));
wireDevForm('form-add', (data) => ({
  product_id: data.get('product_id'),
  quantity: Number(data.get('quantity')) || 1,
}));
wireDevForm('form-discount', (data) => ({ code: data.get('code') }));

initChatPanel();

if (import.meta.env.DEV) {
  // Dev-only test hook (not present in a production build) so the chat
  // agent loop's tool_use -> execute -> tool_result wiring, and its error
  // classification, can be exercised against a mocked API response, without
  // a real Anthropic key. See README.
  Promise.all([import('./chat/agent.js'), import('@anthropic-ai/sdk')]).then(
    ([{ runAgentTurn, ChatError }, { default: Anthropic }]) => {
      window.__chatDevHooks = { runAgentTurn, ChatError, Anthropic };
    }
  );
}
