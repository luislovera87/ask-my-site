import { callRegisteredTool, getAnthropicTools } from '../webmcp/execute.js';
import { ChatError, createMessageViaProxy } from './proxy-client.js';

export const MODELS = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  { id: 'claude-opus-5', label: 'Claude Opus 5' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
];

export const DEFAULT_MODEL = 'claude-sonnet-5';

const MAX_TOOL_ITERATIONS = 8;

export { ChatError };

/**
 * Runs one user turn to completion against the live WebMCP tool registry:
 * sends the message with tool definitions derived at call time from
 * document.modelContext.getTools(), executes any tool_use calls through the
 * real registered tool pipeline, feeds tool_result blocks back, and loops
 * until Claude returns a non-tool_use stop reason. Only custom tools are in
 * play here (no server tools), so any non-"tool_use" stop reason ends the turn.
 *
 * The model call itself goes through the local backend proxy
 * (`createMessageViaProxy`, POST /api/chat) rather than an in-browser
 * Anthropic client — the API key lives server-side only. Tool execution
 * stays client-side, because the tools act on live page DOM/state.
 *
 * `createMessage`, `getTools`, and `executeTool` are injectable so the loop
 * can be exercised against a mocked API response without a real key/network
 * call — see the dev-only hook wired in main.js.
 */
export async function runAgentTurn({
  model,
  history,
  userText,
  onEvent = () => {},
  createMessage = createMessageViaProxy,
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
      throw err instanceof ChatError
        ? err
        : new ChatError('unknown', err instanceof Error ? err.message : String(err));
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
