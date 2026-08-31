import { getState } from '../state.js';

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function renderValue(value) {
  if (value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function renderActivityLog(container) {
  const { activityLog } = getState();

  if (activityLog.length === 0) {
    container.innerHTML = `<p class="empty">No tool calls yet. Waiting for an agent (or the dev console) to call a tool.</p>`;
    return;
  }

  container.innerHTML = `
    <ul class="log-list">
      ${activityLog
        .map(
          (entry) => `
        <li class="log-entry ${entry.isError ? 'log-error' : 'log-ok'}">
          <div class="log-line1">
            <span class="log-time">${timeFmt.format(entry.timestamp)}</span>
            <span class="log-tool">${entry.tool}</span>
            <span class="log-status">${entry.isError ? 'error' : 'ok'}</span>
          </div>
          <div class="log-args">args: <code>${renderValue(entry.args)}</code></div>
          <div class="log-result">result: <code>${renderValue(entry.result)}</code></div>
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}
