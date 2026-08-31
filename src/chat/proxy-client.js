export class ChatError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ChatError';
    this.kind = kind; // 'config' | 'auth' | 'rate_limit' | 'network' | 'api' | 'unknown'
  }
}

function classifyProxyError(status, data) {
  const type = data?.error?.type;
  const message = data?.error?.message || `HTTP ${status}`;
  if (type === 'missing_api_key') {
    return new ChatError('config', message);
  }
  if (type === 'proxy_error') {
    return new ChatError('network', message);
  }
  if (status === 401) {
    return new ChatError('auth', `Invalid or unauthorized API key (401): ${message}`);
  }
  if (status === 429) {
    return new ChatError('rate_limit', `Rate limited by the Anthropic API (429): ${message}`);
  }
  if (status >= 500) {
    return new ChatError('network', `Anthropic API / proxy error (${status}): ${message}`);
  }
  return new ChatError('api', `Anthropic API error (${status}): ${message}`);
}

/** GET /api/chat — lets the UI show a clear status without sending a message first. */
export async function fetchProxyStatus() {
  try {
    const res = await fetch('/api/chat');
    if (!res.ok) return { configured: false };
    return await res.json();
  } catch {
    return { configured: false, unreachable: true };
  }
}

/**
 * Sends one Messages API request through the local backend relay
 * (server/anthropic-proxy.js), which injects ANTHROPIC_API_KEY server-side.
 * This is the default `createMessage` for the agent loop in agent.js.
 */
export async function createMessageViaProxy(params) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    throw new ChatError('network', `Could not reach the local proxy: ${err.message}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ChatError('unknown', `Proxy returned a non-JSON response (status ${res.status}).`);
  }

  if (!res.ok) {
    throw classifyProxyError(res.status, data);
  }
  return data;
}
