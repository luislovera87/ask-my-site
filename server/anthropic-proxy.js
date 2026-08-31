import { loadEnv } from 'vite';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Thin credential-holding relay: injects ANTHROPIC_API_KEY server-side and
 * forwards the client's messages/tools/model payload to the real Anthropic
 * Messages API as-is. Holds no conversation state and does not execute
 * tools — the agentic loop and tool execution stay client-side (see
 * src/chat/agent.js and src/webmcp/execute.js), because the tools act on
 * live page DOM/state that only exists in the browser.
 *
 * GET  /api/chat -> { configured: boolean } — lets the UI show an
 *                    actionable status without needing to send a message.
 * POST /api/chat -> forwards the request body to the Anthropic Messages API
 *                    and relays its status/body back verbatim.
 */
function createAnthropicProxyMiddleware(getApiKey) {
  return async function anthropicProxyMiddleware(req, res, next) {
    if (req.method === 'GET') {
      sendJson(res, 200, { configured: Boolean(getApiKey()) });
      return;
    }
    if (req.method !== 'POST') {
      next();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      sendJson(res, 503, {
        error: {
          type: 'missing_api_key',
          message:
            'ANTHROPIC_API_KEY is not set on the server. Create a .env file from .env.example and restart the dev server.',
        },
      });
      return;
    }

    let bodyText;
    try {
      bodyText = await readBody(req);
    } catch (err) {
      sendJson(res, 400, {
        error: { type: 'invalid_request', message: `Could not read request body: ${err.message}` },
      });
      return;
    }

    try {
      const upstream = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: bodyText,
      });
      const upstreamText = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
      res.end(upstreamText);
    } catch (err) {
      sendJson(res, 502, {
        error: {
          type: 'proxy_error',
          message: `Could not reach the Anthropic API: ${err instanceof Error ? err.message : String(err)}`,
        },
      });
    }
  };
}

/**
 * Vite plugin: reads ANTHROPIC_API_KEY from .env (via loadEnv, so it works
 * for non-VITE_-prefixed vars) or the shell environment, and mounts the
 * proxy on both the dev server and the preview server (so it also works
 * after `npm run build && npm run preview`, not just `npm run dev`).
 */
export function anthropicProxyPlugin() {
  let apiKey;

  return {
    name: 'anthropic-proxy',
    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    },
    configureServer(server) {
      server.middlewares.use('/api/chat', createAnthropicProxyMiddleware(() => apiKey));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', createAnthropicProxyMiddleware(() => apiKey));
    },
  };
}
