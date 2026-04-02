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
import { getScoreColor, getLatencyColor } from "./utils";

/**
 * Modal dialog showing detailed charts & stats for a single DNS server.
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-primary" />
              <span>{server}</span>
              {result.geocode && (
                <Chip size="sm" variant="flat">
                  {result.geocode}
                </Chip>
              )}
              <Chip
                size="sm"
                color={getScoreColor(result.score?.total || 0)}
                variant="flat"
                className="font-bold"
              >
                {(result.score?.total || 0).toFixed(1)}
              </Chip>
            </div>
            {result.ip && (
              <span className="text-xs text-default-400">
                IP: {result.ip}
              </span>
            )}
          </ModalHeader>

          <ModalBody>
            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: t("gui.col_latency"),
                  value: `${result.latencyStats?.meanMs || 0}ms`,
                  color: getLatencyColor(result.latencyStats?.meanMs || 0),
                },
                {
                  label: "QPS",
                  value: (result.queriesPerSecond || 0).toFixed(1),
                  color: "text-cyan-600",
                },
                {
                  label: t("gui.col_success"),
                  value: `${successRate}%`,
                  color: "text-green-600",
                },
                {
                  label: t("gui.detail_requests"),
                  value: result.totalRequests || 0,
                  color: "text-blue-600",
                },
              ].map((metric, i) => (
                <Card key={i} className="border-none bg-default-50">
                  <CardBody className="p-3 text-center">
                    <p className="text-xs text-default-500">{metric.label}</p>
                    <p className={`text-xl font-bold ${metric.color}`}>
                      {metric.value}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none bg-default-50">
                <CardBody className="p-3">
                  <p className="text-sm font-medium mb-2">
                    {t("gui.detail_score_breakdown")}
                  </p>
                  <div style={{ height: 220 }}>
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none bg-default-50">
                <CardBody className="p-3">
                  <p className="text-sm font-medium mb-2">
                    {t("gui.detail_request_dist")}
                  </p>
                  <div
                    style={{ height: 220 }}
                    className="flex items-center justify-center"
                  >
                    <Doughnut data={donutData} options={doughnutOptions} />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Latency distribution */}
            <Card className="border-none bg-default-50 mt-4">
              <CardBody className="p-3">
                <p className="text-sm font-medium mb-2">
                  {t("gui.detail_latency_dist")}
                </p>
                <div style={{ height: 200 }}>
                  <Bar data={latencyData} options={barOptions} />
                </div>
              </CardBody>
            </Card>

            {/* Detailed stats table */}
            <Card className="border-none bg-default-50 mt-4">
              <CardBody className="p-3">
                <p className="text-sm font-medium mb-2">
                  {t("gui.detail_stats")}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {[
                    ["Min Latency", `${result.latencyStats?.minMs || 0}ms`],
                    ["P50 Latency", `${result.latencyStats?.p50Ms || 0}ms`],
                    ["P75 Latency", `${result.latencyStats?.p75Ms || 0}ms`],
                    ["P90 Latency", `${result.latencyStats?.p90Ms || 0}ms`],
                    ["P95 Latency", `${result.latencyStats?.p95Ms || 0}ms`],
                    ["P99 Latency", `${result.latencyStats?.p99Ms || 0}ms`],
                    ["Max Latency", `${result.latencyStats?.maxMs || 0}ms`],
                    ["Std Dev", `${result.latencyStats?.stdMs || 0}ms`],
                    [
                      t("gui.detail_duration"),
                      `${(result.benchmarkDurationSeconds || 0).toFixed(1)}s`,
                    ],
                    [
                      t("gui.detail_success"),
                      result.totalSuccessResponses || 0,
                    ],
                    [t("gui.detail_errors"), result.totalErrorResponses || 0],
                    [t("gui.detail_io_errors"), result.totalIOErrors || 0],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-default-500">{label}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              {t("gui.close")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
