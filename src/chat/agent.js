import Anthropic from '@anthropic-ai/sdk';
import { callRegisteredTool, getAnthropicTools } from '../webmcp/execute.js';

export const MODELS = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  { id: 'claude-opus-5', label: 'Claude Opus 5' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
];

export const DEFAULT_MODEL = 'claude-sonnet-5';

const MAX_TOOL_ITERATIONS = 8;

export function createClient(apiKey) {
  return new Anthropic({
    apiKey,
    // Demo-only: this exposes the key to page JS. See README "Security note".
    // Also causes the SDK to send `anthropic-dangerous-direct-browser-access: true`,
    // which the API requires for any browser-origin request.
    dangerouslyAllowBrowser: true,
  });
}

export class ChatError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ChatError';
    this.kind = kind; // 'auth' | 'rate_limit' | 'network' | 'api' | 'unknown'
  }
}

function classifyError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return new ChatError(
      'auth',
      'Invalid or unauthorized API key (401). Check the key and try again.'
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new ChatError(
      'rate_limit',
      'Rate limited by the Anthropic API (429). Wait a moment and retry.'
    );
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new ChatError('network', `Network error reaching the Anthropic API: ${err.message}`);
  }
  if (err instanceof Anthropic.APIError) {
    return new ChatError('api', `Anthropic API error (${err.status ?? '?'}): ${err.message}`);
  }
  return new ChatError('unknown', err instanceof Error ? err.message : String(err));
}

/**
 * Runs one user turn to completion against the live WebMCP tool registry:
 * sends the message with tool definitions derived at call time from
 * document.modelContext.getTools(), executes any tool_use calls through the
 * real registered tool pipeline, feeds tool_result blocks back, and loops
 * until Claude returns a non-tool_use stop reason. Only custom tools are in
 * play here (no server tools), so any non-"tool_use" stop reason ends the turn.
 *
 * `createMessage`, `getTools`, and `executeTool` are injectable so the loop
 * can be exercised against a mocked API response without a real key/network
 * call — see the dev-only hook wired in main.js.
 */
export async function runAgentTurn({
  client,
  model,
  history,
  userText,
  onEvent = () => {},
  createMessage = (params) => client.messages.create(params),
  getTools = getAnthropicTools,
  executeTool = callRegisteredTool,
}) {
  const messages = [...history, { role: 'user', content: userText }];
  const tools = await getTools();

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    let response;
    try {
      response = await createMessage({ model, max_tokens: 16000, tools, messages });
    } catch (err) {
      throw classifyError(err);
    }

    messages.push({ role: 'assistant', content: response.content });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (text) {
      onEvent({ type: 'assistant_text', text, final: response.stop_reason !== 'tool_use' });
    }

    if (response.stop_reason !== 'tool_use') {
      return { messages, finalText: text, response };
    }

    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolResults = [];
    for (const block of toolUseBlocks) {
      onEvent({ type: 'tool_call', name: block.name, input: block.input });
      const result = await executeTool(block.name, block.input);
      onEvent({ type: 'tool_result', name: block.name, result });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result.content ?? [],
        is_error: Boolean(result.isError),
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  throw new ChatError(
    'unknown',
    `Stopped after ${MAX_TOOL_ITERATIONS} tool-call iterations without a final response.`
  );
}
