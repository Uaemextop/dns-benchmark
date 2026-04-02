/**
 * Chart.js configuration builders for the server detail modal.
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
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
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
          "#22c55e",
          "#22c55e",
          "#eab308",
          "#eab308",
          "#f97316",
          "#f97316",
          "#3b82f6",
          "#ef4444",
        ],
        borderRadius: 4,
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
        backgroundColor: ["#22c55e", "#ef4444", "#f97316"],
        borderWidth: 0,
      },
    ],
  };
}

/** Common chart options. */
export const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: { stepSize: 20, font: { size: 10 } },
      pointLabels: { font: { size: 11 } },
    },
  },
  plugins: { legend: { display: false } },
};

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: { position: "bottom", labels: { font: { size: 11 } } },
  },
};

export const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: "ms", font: { size: 11 } },
    },
  },
};
