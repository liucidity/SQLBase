const MAX_HISTORY = 20;
const key = uuid => `sqlbase_query_history_${uuid}`;

export function getHistory(databaseUuid) {
  if (!databaseUuid) return [];
  try {
    return JSON.parse(localStorage.getItem(key(databaseUuid))) || [];
  } catch {
    return [];
  }
}

export function addToHistory(databaseUuid, { sql, queryState, rowCount }) {
  if (!databaseUuid) return;
  const history = getHistory(databaseUuid);
  const entry = { sql, queryState, rowCount, timestamp: Date.now() };
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(key(databaseUuid), JSON.stringify(next));
  return next;
}

export function clearHistory(databaseUuid) {
  if (!databaseUuid) return;
  localStorage.removeItem(key(databaseUuid));
}

export function formatHistoryTimestamp(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}
