/**
 * Application-wide constants.
 *
 * Centralising magic values, thresholds, and configuration options here avoids
 * scattering them across components and makes future changes trivial.
 */

// ── LocalStorage keys ────────────────────────────────────────────────────────
export const LOCAL_STORAGE_KEY = "dnsAnalyzerData";

// ── Benchmark defaults ───────────────────────────────────────────────────────
export const DEFAULT_DURATION = 10;
export const DEFAULT_CONCURRENCY = 10;
export const DEFAULT_WORKERS = 20;
export const MAX_DURATION = 120;
export const MIN_DURATION = 5;
export const MAX_CONCURRENCY = 50;
export const MAX_WORKERS = 50;
export const MAX_RANKING_DISPLAY = 30;

// ── Score thresholds ─────────────────────────────────────────────────────────
export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
};

// ── Latency thresholds (ms) ──────────────────────────────────────────────────
export const LATENCY_THRESHOLDS = {
  FAST: 50,
  MODERATE: 150,
  SLOW: 300,
};

// ── Server type filters ──────────────────────────────────────────────────────
export const SERVER_TYPES = {
  ALL: "all",
  UDP: "udp",
  DoH: "doh",
  DoT: "dot",
  DoQ: "doq",
};

// ── Region groups for the Analyze filter ─────────────────────────────────────
export const REGION_GROUPS = {
  ASIA: {
    name: "asia",
    regions: [
      "CN", "HK", "TW", "JP", "KR", "SG", "ID", "MY", "TH", "VN", "IN",
      "AU", "NZ", "BD", "AE",
    ],
  },
  AMERICAS: {
    name: "americas",
    regions: ["US", "CA", "BR", "MX", "AR", "CL"],
  },
  EUROPE: {
    name: "europe",
    regions: [
      "EU", "DE", "FR", "GB", "IT", "ES", "NL", "SE", "CH", "PL", "RU",
      "CZ", "CY", "RO", "NO", "FI", "SI", "IE", "LV", "HU", "TR", "MD",
      "LU", "BG", "EE", "AT", "IL",
    ],
  },
  CHINA: {
    name: "china",
    regions: ["CN", "HK", "TW", "MO"],
  },
  GLOBAL: {
    name: "global",
    regions: ["CDN", "CLOUDFLARE", "GOOGLE", "AKAMAI", "FASTLY"],
  },
};

// ── Pagination ───────────────────────────────────────────────────────────────
export const ITEMS_PER_PAGE = 150;

// ── SSE reconnect delay (ms) ─────────────────────────────────────────────────
export const SSE_RECONNECT_DELAY = 3000;
