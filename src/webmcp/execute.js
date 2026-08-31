import { logActivity } from '../state.js';
import { toolsReady } from './tools.js';

/**
 * Executes a tool through the real registered WebMCP pipeline — never a
 * shortcut that bypasses schema validation or the tool's own execute().
 * Prefers the native `document.modelContext.executeTool` descriptor API
 * (Chromium, behind the WebMCP flag) and falls back to the
 * `navigator.modelContextTesting` shim (always available via the polyfill),
 * so the same call works with or without the flag enabled.
 */
export async function callRegisteredTool(toolName, args) {
  try {
    await toolsReady;
    const modelContext = document.modelContext;
    if (modelContext && typeof modelContext.executeTool === 'function') {
      const tools = await modelContext.getTools();
      const descriptor = tools.find((t) => t.name === toolName);
      if (!descriptor) throw new Error(`Tool "${toolName}" is not registered`);
      const resultJson = await modelContext.executeTool(descriptor, JSON.stringify(args));
      return resultJson ? JSON.parse(resultJson) : { content: [] };
    }
    if (navigator.modelContextTesting) {
      const resultJson = await navigator.modelContextTesting.executeTool(
        toolName,
        JSON.stringify(args)
      );
      return resultJson ? JSON.parse(resultJson) : { content: [] };
    }
    throw new Error('No WebMCP tool execution path is available in this browser');
  } catch (err) {
    // Only reached for infra failures upstream of the tool's own execute()
    // (unknown tool name, no execution path) — a tool's own business-logic
    // errors are already caught and logged inside withLogging (see
    // webmcp/tools.js), which returns { isError: true } instead of throwing.
    const message = err instanceof Error ? err.message : String(err);
    logActivity({ tool: toolName, args, result: { error: message }, isError: true });
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}

/** Tool descriptors from the live registry, mapped to Anthropic's tool-definition shape. */
export async function getAnthropicTools() {
  await toolsReady;
  const tools = await document.modelContext.getTools();
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema:
      typeof t.inputSchema === 'string'
        ? JSON.parse(t.inputSchema)
        : (t.inputSchema ?? { type: 'object', properties: {} }),
  }));
}
