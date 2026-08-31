import { runAgentTurn, ChatError } from '../chat/agent.js';
import { fetchProxyStatus } from '../chat/proxy-client.js';
import { getAnthropicTools } from '../webmcp/execute.js';

const entries = []; // { type: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'error', ... }
let history = []; // Anthropic message history for this conversation
let sending = false;
let proxyConfigured = false;

function renderEntries(els) {
  if (entries.length === 0) {
    els.messages.innerHTML = `<p class="empty">No messages yet.</p>`;
    return;
  }
  els.messages.innerHTML = entries
    .map((e) => {
      if (e.type === 'user') return `<div class="chat-msg chat-msg-user">${escapeHtml(e.text)}</div>`;
      if (e.type === 'assistant')
        return `<div class="chat-msg chat-msg-assistant">${escapeHtml(e.text)}</div>`;
      if (e.type === 'tool_call')
        return `<div class="chat-msg chat-msg-tool">&#8594; calling <code>${escapeHtml(e.name)}</code>(<code>${escapeHtml(JSON.stringify(e.input))}</code>)</div>`;
      if (e.type === 'tool_result')
        return `<div class="chat-msg chat-msg-tool ${e.isError ? 'chat-msg-tool-error' : ''}">&#8592; <code>${escapeHtml(e.name)}</code> ${e.isError ? 'errored' : 'returned'}: ${escapeHtml(e.text)}</div>`;
      if (e.type === 'error')
        return `<div class="chat-msg chat-msg-error">${escapeHtml(e.text)}</div>`;
      return '';
    })
    .join('');
  els.messages.scrollTop = els.messages.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toolResultText(result) {
  const blocks = result.content ?? [];
  return blocks.map((b) => (b.type === 'text' ? b.text : JSON.stringify(b))).join(' ');
}

async function renderToolsNote(els) {
  try {
    const tools = await getAnthropicTools();
    els.toolsNote.textContent = tools.length
      ? `Tools visible to the agent (live from document.modelContext.getTools()): ${tools.map((t) => t.name).join(', ')}`
      : 'No WebMCP tools are currently registered.';
  } catch (err) {
    els.toolsNote.textContent = `Could not read registered tools: ${err.message}`;
  }
}

async function refreshProxyStatus(els) {
  const status = await fetchProxyStatus();
  proxyConfigured = Boolean(status.configured);
  if (status.unreachable) {
    els.status.textContent =
      '⚠️ Could not reach the local dev-server proxy. Is `npm run dev` running?';
  } else if (!proxyConfigured) {
    els.status.textContent =
      '⚠️ Server is missing ANTHROPIC_API_KEY — copy .env.example to .env, add your key, and restart the dev server.';
  } else {
    els.status.textContent = 'Chat is ready — model calls go through the local dev-server proxy.';
  }
  setSending(els, sending);
}

function setSending(els, isSending) {
  sending = isSending;
  els.input.disabled = isSending;
  els.send.disabled = isSending || !proxyConfigured;
}

export function initChatPanel() {
  const els = {
    status: document.getElementById('chat-proxy-status'),
    model: document.getElementById('chat-model'),
    messages: document.getElementById('chat-messages'),
    form: document.getElementById('chat-form'),
    input: document.getElementById('chat-input'),
    send: document.getElementById('chat-send'),
    toolsNote: document.getElementById('chat-tools-note'),
  };

  renderEntries(els);
  setSending(els, false);
  refreshProxyStatus(els);
  renderToolsNote(els);

  els.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!proxyConfigured) {
      await refreshProxyStatus(els); // pick up a .env added after page load
      if (!proxyConfigured) return;
    }
    const text = els.input.value.trim();
    if (!text) return;

    els.input.value = '';
    entries.push({ type: 'user', text });
    renderEntries(els);
    setSending(els, true);

    try {
      const result = await runAgentTurn({
        model: els.model.value,
        history,
        userText: text,
        onEvent: (event) => {
          if (event.type === 'assistant_text') {
            entries.push({ type: 'assistant', text: event.text });
          } else if (event.type === 'tool_call') {
            entries.push({ type: 'tool_call', name: event.name, input: event.input });
          } else if (event.type === 'tool_result') {
            entries.push({
              type: 'tool_result',
              name: event.name,
              text: toolResultText(event.result),
              isError: Boolean(event.result.isError),
            });
          }
          renderEntries(els);
        },
      });
      history = result.messages;
    } catch (err) {
      const message = err instanceof ChatError ? err.message : `Unexpected error: ${err.message}`;
      entries.push({ type: 'error', text: message });
      renderEntries(els);
    } finally {
      setSending(els, false);
    }
  });
}
