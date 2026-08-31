// In-memory only, by design: the key never touches disk and is never sent
// anywhere except api.anthropic.com (the SDK call site in agent.js). The one
// opt-in exception is sessionStorage, gated behind an explicit checkbox in
// the UI — never localStorage, never a default-on behavior.
const SESSION_KEY = 'ask-my-site:anthropic-key';

let apiKey = null;

export function getApiKey() {
  return apiKey;
}

export function hasApiKey() {
  return Boolean(apiKey);
}

export function setApiKey(rawKey, { remember = false } = {}) {
  apiKey = rawKey ? rawKey.trim() : null;
  try {
    if (remember && apiKey) {
      sessionStorage.setItem(SESSION_KEY, apiKey);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // sessionStorage unavailable (private mode, etc.) — in-memory key still works
  }
  return apiKey;
}

export function clearApiKey() {
  apiKey = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Call once on load to pick up a key remembered for this tab only. Never re-displays it. */
export function restoreRememberedKey() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      apiKey = stored;
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
