/**
 * Centralized API service layer.
 *
 * All HTTP calls to the backend are routed through this module so that
 * endpoint URLs, error handling, and request formatting live in one place.
 */

const API_BASE = "/api";

/**
 * Fetch the list of available DNS servers from the backend.
 * @returns {Promise<string[]>}
 */
export async function fetchServers() {
  const res = await fetch(`${API_BASE}/servers`);
  if (!res.ok) throw new Error("Failed to load server list");
  return res.json();
}

/**
 * Start a benchmark run.
 * @param {object} params
 * @param {string[]} params.servers
 * @param {boolean} params.useBuiltin
 * @param {number} params.duration
 * @param {number} params.concurrency
 * @param {number} params.workers
 * @param {boolean} params.noAAAA
 * @returns {Promise<{ status: string, total: number }>}
 */
export async function startBenchmark(params) {
  const res = await fetch(`${API_BASE}/benchmark/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Stop a running benchmark.
 * @returns {Promise<{ status: string, results: number }>}
 */
export async function stopBenchmark() {
  const res = await fetch(`${API_BASE}/benchmark/stop`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the latest benchmark results.
 * @returns {Promise<object>}
 */
export async function fetchResults() {
  const res = await fetch(`${API_BASE}/benchmark/results`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}

/**
 * Fetch benchmark history.
 * @returns {Promise<object[]>}
 */
export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/benchmark/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

/**
 * Create the SSE EventSource URL for streaming benchmark status.
 * @returns {string}
 */
export function getSSEUrl() {
  return `${API_BASE}/benchmark/status`;
}
