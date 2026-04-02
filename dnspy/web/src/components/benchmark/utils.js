/**
 * Utility functions for benchmark display formatting and scoring.
 */

import {
  SCORE_THRESHOLDS,
  LATENCY_THRESHOLDS,
} from "../../constants";

/** Format seconds into HH:MM:SS or MM:SS. */
export function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Check whether a result represents a live (non-dead) server. */
export function isAlive(r) {
  return (
    r &&
    r.score &&
    r.score.total > 0 &&
    r.latencyStats &&
    r.latencyStats.meanMs > 0
  );
}

/** Return a rank emoji or number string. */
export function getRankDisplay(index) {
  if (index === 0) return "\u{1F947}";
  if (index === 1) return "\u{1F948}";
  if (index === 2) return "\u{1F949}";
  return `#${index + 1}`;
}

/** Map score value to a NextUI color name. */
export function getScoreColor(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return "success";
  if (score >= SCORE_THRESHOLDS.GOOD) return "primary";
  if (score >= SCORE_THRESHOLDS.FAIR) return "warning";
  return "danger";
}

/**
 * Convert a 2-letter ISO 3166-1 alpha-2 country code to its flag emoji.
 * E.g., "US" → 🇺🇸, "DE" → 🇩🇪, "JP" → 🇯🇵
 * Returns empty string for invalid or missing codes.
 */
export function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  const cp1 = 0x1f1e6 + (upper.charCodeAt(0) - 65);
  const cp2 = 0x1f1e6 + (upper.charCodeAt(1) - 65);
  return String.fromCodePoint(cp1, cp2);
}

/** Map latency ms to a Tailwind text color class. */
export function getLatencyColor(ms) {
  if (ms < LATENCY_THRESHOLDS.FAST) return "text-green-500";
  if (ms < LATENCY_THRESHOLDS.MODERATE) return "text-yellow-500";
  if (ms < LATENCY_THRESHOLDS.SLOW) return "text-orange-500";
  return "text-red-500";
}

/** Compute aggregate statistics from alive result entries. */
export function computeStats(partialResults) {
  const allEntries = Object.entries(partialResults);
  const aliveEntries = allEntries.filter(([, r]) => isAlive(r));
  const deadCount = allEntries.length - aliveEntries.length;

  const avgLatency =
    aliveEntries.length > 0
      ? aliveEntries.reduce(
          (sum, [, r]) => sum + (r.latencyStats?.meanMs || 0),
          0
        ) / aliveEntries.length
      : 0;

  const avgSuccessRate =
    aliveEntries.length > 0
      ? aliveEntries.reduce((sum, [, r]) => {
          const total = r.totalRequests || 1;
          const success = r.totalSuccessResponses || 0;
          return sum + (success / total) * 100;
        }, 0) / aliveEntries.length
      : 0;

  const avgQPS =
    aliveEntries.length > 0
      ? aliveEntries.reduce(
          (sum, [, r]) => sum + (r.queriesPerSecond || 0),
          0
        ) / aliveEntries.length
      : 0;

  return { aliveEntries, deadCount, avgLatency, avgSuccessRate, avgQPS };
}
