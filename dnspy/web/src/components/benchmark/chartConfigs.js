/**
 * Chart.js configuration builders for the server detail modal.
 * Improved with better colors, gradients, and responsive options.
 */

/** Build radar chart data for score breakdown. */
export function buildRadarData(result, t) {
  return {
    labels: [
      t("gui.detail_latency_score"),
      t("gui.detail_success_score"),
      t("gui.detail_error_score"),
      t("gui.detail_qps_score"),
    ],
    datasets: [
      {
        label: t("gui.col_score"),
        data: [
          result.score?.latency || 0,
          result.score?.successRate || 0,
          result.score?.errorRate || 0,
          result.score?.qps || 0,
        ],
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.9)",
        borderWidth: 2.5,
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
}

/** Build bar chart data for latency percentile distribution. */
export function buildLatencyBarData(result, t) {
  return {
    labels: ["Min", "P50", "P75", "P90", "P95", "P99", "Mean", "Max"],
    datasets: [
      {
        label: t("gui.col_latency") + " (ms)",
        data: [
          result.latencyStats?.minMs || 0,
          result.latencyStats?.p50Ms || 0,
          result.latencyStats?.p75Ms || 0,
          result.latencyStats?.p90Ms || 0,
          result.latencyStats?.p95Ms || 0,
          result.latencyStats?.p99Ms || 0,
          result.latencyStats?.meanMs || 0,
          result.latencyStats?.maxMs || 0,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.7)",
          "rgba(34, 197, 94, 0.6)",
          "rgba(234, 179, 8, 0.6)",
          "rgba(234, 179, 8, 0.7)",
          "rgba(249, 115, 22, 0.6)",
          "rgba(249, 115, 22, 0.7)",
          "rgba(99, 102, 241, 0.7)",
          "rgba(239, 68, 68, 0.7)",
        ],
        borderColor: [
          "#22c55e",
          "#22c55e",
          "#eab308",
          "#eab308",
          "#f97316",
          "#f97316",
          "#6366f1",
          "#ef4444",
        ],
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
}

/** Build doughnut chart data for request distribution. */
export function buildRequestDonutData(result, t) {
  return {
    labels: [
      t("gui.detail_success"),
      t("gui.detail_errors"),
      t("gui.detail_io_errors"),
    ],
    datasets: [
      {
        data: [
          result.totalSuccessResponses || 0,
          result.totalErrorResponses || 0,
          result.totalIOErrors || 0,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(249, 115, 22, 0.8)",
        ],
        hoverBackgroundColor: ["#22c55e", "#ef4444", "#f97316"],
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.8)",
        spacing: 2,
      },
    ],
  };
}

/** Common chart options with improved styling. */
export const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        font: { size: 10 },
        backdropColor: "transparent",
        color: "rgba(100, 116, 139, 0.7)",
      },
      pointLabels: {
        font: { size: 12, weight: "600" },
        color: "rgba(71, 85, 105, 0.9)",
      },
      grid: {
        color: "rgba(148, 163, 184, 0.15)",
      },
      angleLines: {
        color: "rgba(148, 163, 184, 0.15)",
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: { size: 11, weight: "500" },
        padding: 12,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

export const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => `${ctx.parsed.y} ms`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "ms",
        font: { size: 11, weight: "600" },
        color: "rgba(100, 116, 139, 0.8)",
      },
      grid: {
        color: "rgba(148, 163, 184, 0.1)",
      },
      ticks: {
        font: { size: 10 },
        color: "rgba(100, 116, 139, 0.7)",
      },
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 10, weight: "500" },
        color: "rgba(100, 116, 139, 0.8)",
      },
    },
  },
};
