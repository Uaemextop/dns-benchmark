import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  Chip,
  Button,
  Divider,
} from "@nextui-org/react";
import { FaChartBar as ChartIcon } from "react-icons/fa";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import {
  buildRadarData,
  buildLatencyBarData,
  buildRequestDonutData,
  radarOptions,
  doughnutOptions,
  barOptions,
} from "./chartConfigs";
import { getScoreColor, getLatencyColor, countryCodeToFlag } from "./utils";

/**
 * Modal dialog showing detailed charts & stats for a single DNS server.
 * Redesigned with improved layout, better colors, and cleaner typography.
 */
export default function ServerDetailModal({
  isOpen,
  onClose,
  server,
  result,
}) {
  const { t } = useTranslation();

  if (!server || !result) return null;

  const radarData = buildRadarData(result, t);
  const latencyData = buildLatencyBarData(result, t);
  const donutData = buildRequestDonutData(result, t);

  const successRate =
    result.totalRequests > 0
      ? (
          (result.totalSuccessResponses / result.totalRequests) *
          100
        ).toFixed(1)
      : "0";

  const score = result.score?.total || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        header: "border-b border-default-100",
        footer: "border-t border-default-100",
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-2 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md">
                <ChartIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold truncate">{server}</span>
                  {result.geocode && (
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={
                        <span className="text-base ml-0.5">{countryCodeToFlag(result.geocode)}</span>
                      }
                    >
                      {result.geocode}
                    </Chip>
                  )}
                  <Chip
                    size="sm"
                    color={getScoreColor(score)}
                    variant="shadow"
                    className="font-bold"
                  >
                    {score.toFixed(1)} pts
                  </Chip>
                </div>
                {result.ipAddress && (
                  <span className="text-xs text-default-400 font-mono">
                    IP: {result.ipAddress}
                  </span>
                )}
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            {/* Key metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: t("gui.col_latency"),
                  value: `${result.latencyStats?.meanMs || 0}ms`,
                  color: getLatencyColor(result.latencyStats?.meanMs || 0),
                  bg: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20",
                  border: "border-emerald-200/50 dark:border-emerald-800/30",
                },
                {
                  label: "QPS",
                  value: (result.queriesPerSecond || 0).toFixed(1),
                  color: "text-cyan-600 dark:text-cyan-400",
                  bg: "from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20",
                  border: "border-cyan-200/50 dark:border-cyan-800/30",
                },
                {
                  label: t("gui.col_success"),
                  value: `${successRate}%`,
                  color: "text-green-600 dark:text-green-400",
                  bg: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
                  border: "border-green-200/50 dark:border-green-800/30",
                },
                {
                  label: t("gui.detail_requests"),
                  value: (result.totalRequests || 0).toLocaleString(),
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
                  border: "border-blue-200/50 dark:border-blue-800/30",
                },
              ].map((metric, i) => (
                <Card
                  key={i}
                  className={`border ${metric.border} bg-gradient-to-br ${metric.bg} shadow-sm`}
                >
                  <CardBody className="p-3 text-center">
                    <p className="text-xs text-default-500 font-medium mb-1">
                      {metric.label}
                    </p>
                    <p className={`text-2xl font-extrabold ${metric.color}`}>
                      {metric.value}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>

            <Divider className="my-2" />

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score Radar */}
              <Card className="border border-default-200/50 shadow-sm">
                <CardBody className="p-4">
                  <p className="text-sm font-bold mb-3 text-default-700">
                    📊 {t("gui.detail_score_breakdown")}
                  </p>
                  <div style={{ height: 240 }}>
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                </CardBody>
              </Card>

              {/* Request Distribution */}
              <Card className="border border-default-200/50 shadow-sm">
                <CardBody className="p-4">
                  <p className="text-sm font-bold mb-3 text-default-700">
                    🎯 {t("gui.detail_request_dist")}
                  </p>
                  <div
                    style={{ height: 240 }}
                    className="flex items-center justify-center"
                  >
                    <Doughnut data={donutData} options={doughnutOptions} />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Latency Distribution */}
            <Card className="border border-default-200/50 shadow-sm">
              <CardBody className="p-4">
                <p className="text-sm font-bold mb-3 text-default-700">
                  ⏱ {t("gui.detail_latency_dist")}
                </p>
                <div style={{ height: 220 }}>
                  <Bar data={latencyData} options={barOptions} />
                </div>
              </CardBody>
            </Card>

            {/* Detailed stats table */}
            <Card className="border border-default-200/50 shadow-sm">
              <CardBody className="p-4">
                <p className="text-sm font-bold mb-3 text-default-700">
                  📋 {t("gui.detail_stats")}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                  {[
                    [
                      "Min Latency",
                      `${result.latencyStats?.minMs || 0}ms`,
                      "text-green-600",
                    ],
                    [
                      "P50 Latency",
                      `${result.latencyStats?.p50Ms || 0}ms`,
                      "text-green-600",
                    ],
                    [
                      "P75 Latency",
                      `${result.latencyStats?.p75Ms || 0}ms`,
                      "text-yellow-600",
                    ],
                    [
                      "P90 Latency",
                      `${result.latencyStats?.p90Ms || 0}ms`,
                      "text-yellow-600",
                    ],
                    [
                      "P95 Latency",
                      `${result.latencyStats?.p95Ms || 0}ms`,
                      "text-orange-600",
                    ],
                    [
                      "P99 Latency",
                      `${result.latencyStats?.p99Ms || 0}ms`,
                      "text-orange-600",
                    ],
                    [
                      "Max Latency",
                      `${result.latencyStats?.maxMs || 0}ms`,
                      "text-red-600",
                    ],
                    [
                      "Std Dev",
                      `${result.latencyStats?.stdMs || 0}ms`,
                      "text-default-600",
                    ],
                    [
                      t("gui.detail_duration"),
                      `${(result.benchmarkDurationSeconds || 0).toFixed(1)}s`,
                      "text-blue-600",
                    ],
                    [
                      t("gui.detail_success"),
                      (result.totalSuccessResponses || 0).toLocaleString(),
                      "text-green-600",
                    ],
                    [
                      t("gui.detail_errors"),
                      (result.totalErrorResponses || 0).toLocaleString(),
                      "text-red-600",
                    ],
                    [
                      t("gui.detail_io_errors"),
                      (result.totalIOErrors || 0).toLocaleString(),
                      "text-orange-600",
                    ],
                  ].map(([label, val, color], i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1.5 border-b border-default-100 last:border-0"
                    >
                      <span className="text-sm text-default-500">{label}</span>
                      <span className={`text-sm font-semibold ${color}`}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button
              color="primary"
              variant="flat"
              onPress={onClose}
              className="font-semibold"
            >
              {t("gui.close")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
