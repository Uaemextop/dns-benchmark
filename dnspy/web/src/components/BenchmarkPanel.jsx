import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Textarea,
  Switch,
  Slider,
  Chip,
  Progress,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  ScrollShadow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Toaster, toast } from "sonner";
import {
  FaPlay as PlayIcon,
  FaStop as StopIcon,
  FaServer as ServerIcon,
  FaDownload as DownloadIcon,
  FaTrophy as TrophyIcon,
  FaClock as ClockIcon,
  FaList as ListIcon,
  FaInfoCircle as InfoIcon,
  FaChartBar as ChartIcon,
} from "react-icons/fa";
import {
  MdSpeed as SpeedIcon,
  MdTimelapse as TimelapseIcon,
  MdCheckCircle as CheckCircleIcon,
  MdClose as CloseIcon,
} from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

import { useFile } from "../contexts/FileContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

export default function BenchmarkPanel({ onSwitchToAnalyze }) {
  const { t } = useTranslation();
  const { setJsonData } = useFile();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Configuration state
  const [servers, setServers] = useState("");
  const [useBuiltin, setUseBuiltin] = useState(true);
  const [duration, setDuration] = useState(10);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [concurrency, setConcurrency] = useState(10);
  const [workers, setWorkers] = useState(20);
  const [noAAAA, setNoAAAA] = useState(false);

  // Benchmark state
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentServer, setCurrentServer] = useState("");
  const [partialResults, setPartialResults] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [resultsTab, setResultsTab] = useState("ranking");
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);
  const activityEndRef = useRef(null);

  // Auto-scroll activity log
  useEffect(() => {
    if (activityEndRef.current) {
      activityEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activityLog]);

  // Elapsed time counter
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, startTime]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Connect to SSE for real-time updates
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/benchmark/status");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "status":
            if (data.message === "running") {
              setIsRunning(true);
              setCompleted(data.completed);
              setTotal(data.total);
              if (!startTime) setStartTime(Date.now());
            } else if (data.message === "completed") {
              setIsRunning(false);
            }
            break;

          case "progress":
            setCompleted(data.completed);
            setTotal(data.total);
            setCurrentServer(data.server);
            if (data.result) {
              setPartialResults((prev) => ({
                ...prev,
                [data.server]: data.result,
              }));
              setActivityLog((prev) => [
                ...prev,
                {
                  server: data.server,
                  result: data.result,
                  time: new Date().toLocaleTimeString(),
                  index: data.completed,
                },
              ]);
            }
            break;

          case "complete":
            setIsRunning(false);
            setCurrentServer("");
            if (data.results) {
              setJsonData(data.results);
              localStorage.setItem(
                "dnsAnalyzerData",
                JSON.stringify(data.results)
              );
              toast.success(t("gui.benchmark_complete"), {
                description: t("gui.benchmark_complete_desc"),
                duration: 5000,
                className: "dark:text-neutral-200",
              });
            }
            break;

          case "error":
            setIsRunning(false);
            toast.error(t("gui.benchmark_error"), {
              description: data.message,
              duration: 5000,
              className: "dark:text-neutral-200",
            });
            break;
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          connectSSE();
        }
      }, 3000);
    };
  }, [t, setJsonData]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectSSE]);

  const handleStart = async () => {
    try {
      const serverList = servers
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("#"));

      const body = {
        servers: serverList.length > 0 ? serverList : [],
        useBuiltin,
        duration: isUnlimited ? 0 : duration,
        concurrency,
        workers,
        noAAAA,
      };

      const res = await fetch("/api/benchmark/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(t("gui.benchmark_error"), {
          description: err.error || "Failed to start benchmark",
          duration: 5000,
          className: "dark:text-neutral-200",
        });
        return;
      }

      const data = await res.json();
      setIsRunning(true);
      setCompleted(0);
      setTotal(data.total || 0);
      setPartialResults({});
      setCurrentServer("");
      setElapsedTime(0);
      setStartTime(Date.now());
      setActivityLog([]);

      toast.success(t("gui.benchmark_started"), {
        description: t("gui.benchmark_started_desc", { total: data.total }),
        duration: 3000,
        className: "dark:text-neutral-200",
      });
    } catch (err) {
      console.error("Start error:", err);
      toast.error(t("gui.benchmark_error"), {
        description: err.message,
        duration: 5000,
        className: "dark:text-neutral-200",
      });
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch("/api/benchmark/stop", { method: "POST" });
      if (res.ok) {
        setIsRunning(false);
        toast.info(t("gui.benchmark_stopped"), {
          duration: 2000,
          className: "dark:text-neutral-200",
        });
      }
    } catch (err) {
      console.error("Stop error:", err);
    }
  };

  const handleExportResults = () => {
    const allResults = partialResults;
    if (Object.keys(allResults).length === 0) return;

    const blob = new Blob([JSON.stringify(allResults, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dnspy_result_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleServerClick = (server, result) => {
    setSelectedServer(server);
    setSelectedResult(result);
    onOpen();
  };

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // Filter out dead DNS servers (score 0 or no latency)
  const isAlive = (r) =>
    r && r.score && r.score.total > 0 && r.latencyStats && r.latencyStats.meanMs > 0;

  // Compute aggregate stats from ALIVE partial results only
  const resultEntries = Object.entries(partialResults).filter(([, r]) => isAlive(r));
  const allEntries = Object.entries(partialResults);
  const deadCount = allEntries.length - resultEntries.length;

  const avgLatency =
    resultEntries.length > 0
      ? resultEntries.reduce(
          (sum, [, r]) => sum + (r.latencyStats?.meanMs || 0),
          0
        ) / resultEntries.length
      : 0;
  const avgSuccessRate =
    resultEntries.length > 0
      ? resultEntries.reduce((sum, [, r]) => {
          const t = r.totalRequests || 1;
          const s = r.totalSuccessResponses || 0;
          return sum + (s / t) * 100;
        }, 0) / resultEntries.length
      : 0;
  const avgQPS =
    resultEntries.length > 0
      ? resultEntries.reduce(
          (sum, [, r]) => sum + (r.queriesPerSecond || 0),
          0
        ) / resultEntries.length
      : 0;

  // Top results sorted by score (only alive servers)
  const topResults = [...resultEntries].sort(
    (a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0)
  );

  // All results sorted by score (only alive)
  const allResultsSorted = [...resultEntries].sort(
    (a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0)
  );

  const getRankDisplay = (index) => {
    if (index === 0) return "\u{1F947}";
    if (index === 1) return "\u{1F948}";
    if (index === 2) return "\u{1F949}";
    return `#${index + 1}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "primary";
    if (score >= 40) return "warning";
    return "danger";
  };

  const getLatencyColor = (ms) => {
    if (ms < 50) return "text-green-500";
    if (ms < 150) return "text-yellow-500";
    if (ms < 300) return "text-orange-500";
    return "text-red-500";
  };

  const hasResults = Object.keys(partialResults).length > 0;
  const isDone = !isRunning && completed > 0;

  // Detail modal chart data
  const detailCharts = selectedResult
    ? {
        // Score breakdown radar
        radar: {
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
                selectedResult.score?.latency || 0,
                selectedResult.score?.successRate || 0,
                selectedResult.score?.errorRate || 0,
                selectedResult.score?.qps || 0,
              ],
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              pointBackgroundColor: "rgba(59, 130, 246, 1)",
            },
          ],
        },
        // Latency distribution bar
        latencyBar: {
          labels: ["Min", "P50", "P75", "P90", "P95", "P99", "Mean", "Max"],
          datasets: [
            {
              label: t("gui.col_latency") + " (ms)",
              data: [
                selectedResult.latencyStats?.minMs || 0,
                selectedResult.latencyStats?.p50Ms || 0,
                selectedResult.latencyStats?.p75Ms || 0,
                selectedResult.latencyStats?.p90Ms || 0,
                selectedResult.latencyStats?.p95Ms || 0,
                selectedResult.latencyStats?.p99Ms || 0,
                selectedResult.latencyStats?.meanMs || 0,
                selectedResult.latencyStats?.maxMs || 0,
              ],
              backgroundColor: [
                "#22c55e", "#22c55e", "#eab308", "#eab308",
                "#f97316", "#f97316", "#3b82f6", "#ef4444",
              ],
              borderRadius: 4,
            },
          ],
        },
        // Request distribution donut
        requestDonut: {
          labels: [
            t("gui.detail_success"),
            t("gui.detail_errors"),
            t("gui.detail_io_errors"),
          ],
          datasets: [
            {
              data: [
                selectedResult.totalSuccessResponses || 0,
                selectedResult.totalErrorResponses || 0,
                selectedResult.totalIOErrors || 0,
              ],
              backgroundColor: ["#22c55e", "#ef4444", "#f97316"],
              borderWidth: 0,
            },
          ],
        },
      }
    : null;

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-6xl mx-auto">
      <Toaster position="top-center" expand={false} richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
            <SpeedIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {t("gui.title")}
            </h1>
            <p className="text-sm text-default-500">{t("gui.subtitle")}</p>
          </div>
        </div>
        {hasResults && (
          <div className="flex gap-2">
            <Tooltip content={t("gui.export_results")}>
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<DownloadIcon />}
                onClick={handleExportResults}
              >
                {t("gui.export")}
              </Button>
            </Tooltip>
            {isDone && onSwitchToAnalyze && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onClick={onSwitchToAnalyze}
              >
                {t("gui.view_analysis")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {(isRunning || hasResults) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <ServerIcon className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-default-500">
                  {t("gui.servers_tested")}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {completed}
                <span className="text-sm font-normal text-default-400">
                  /{total}
                </span>
              </p>
              {deadCount > 0 && (
                <p className="text-tiny text-default-400">
                  {deadCount} {t("gui.dead_servers")}
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="border-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <TimelapseIcon className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-default-500">
                  {t("gui.avg_latency")}
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {avgLatency > 0 ? avgLatency.toFixed(0) : "\u2014"}
                <span className="text-sm font-normal text-default-400">ms</span>
              </p>
            </CardBody>
          </Card>

          <Card className="border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs text-default-500">
                  {t("gui.avg_success")}
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {avgSuccessRate > 0 ? avgSuccessRate.toFixed(1) : "\u2014"}
                <span className="text-sm font-normal text-default-400">%</span>
              </p>
            </CardBody>
          </Card>

          <Card className="border-none bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <SpeedIcon className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs text-default-500">
                  {t("gui.avg_qps")}
                </span>
              </div>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                {avgQPS > 0 ? avgQPS.toFixed(0) : "\u2014"}
                <span className="text-sm font-normal text-default-400">/s</span>
              </p>
            </CardBody>
          </Card>

          <Card className="border-none bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs text-default-500">
                  {t("gui.elapsed_time")}
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatTime(elapsedTime)}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {isRunning && (
        <Card className="border-none shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">{t("gui.running")}</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {progressPercent}%
              </span>
            </div>
            <Progress
              aria-label="Benchmark progress"
              value={progressPercent}
              color="primary"
              className="max-w-full"
              size="md"
            />
            <div className="flex items-center justify-between mt-2">
              {currentServer && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-default-400">{t("gui.testing")}:</span>
                  <Chip size="sm" variant="flat" color="primary">
                    {currentServer}
                  </Chip>
                </div>
              )}
              {total > 0 && completed > 0 && (
                <span className="text-xs text-default-400">
                  ~{formatTime(Math.round((elapsedTime / completed) * (total - completed)))}{" "}
                  {t("gui.remaining")}
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Completed banner */}
      {isDone && (
        <Card className="border-none bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    {t("gui.benchmark_done", { count: completed })}
                  </p>
                  {deadCount > 0 && (
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">
                      {t("gui.dead_filtered", { count: deadCount })}
                    </p>
                  )}
                </div>
              </div>
              {onSwitchToAnalyze && (
                <Button size="sm" color="success" variant="flat" onClick={onSwitchToAnalyze}>
                  {t("gui.view_analysis")} →
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Configuration Panel */}
        <Card className="lg:w-[360px] flex-shrink-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold">{t("gui.configuration")}</span>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("gui.use_builtin_servers")}</p>
                <p className="text-xs text-default-400">{t("gui.use_builtin_servers_desc")}</p>
              </div>
              <Switch isSelected={useBuiltin} onValueChange={setUseBuiltin} size="sm" isDisabled={isRunning} />
            </div>

            <Textarea
              label={t("gui.custom_servers")}
              placeholder={t("gui.custom_servers_placeholder")}
              value={servers}
              onValueChange={setServers}
              minRows={3}
              maxRows={5}
              description={t("gui.custom_servers_desc")}
              isDisabled={isRunning}
              size="sm"
            />

            <Divider />

            <div className="flex flex-col gap-3">
              {/* Duration with Unlimited toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{t("gui.duration")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-default-400">{t("gui.unlimited")}</span>
                    <Switch
                      isSelected={isUnlimited}
                      onValueChange={setIsUnlimited}
                      size="sm"
                      isDisabled={isRunning}
                    />
                  </div>
                </div>
                {!isUnlimited && (
                  <Slider
                    step={1}
                    minValue={5}
                    maxValue={120}
                    value={duration}
                    onChange={setDuration}
                    className="max-w-full"
                    size="sm"
                    isDisabled={isRunning}
                    showSteps={false}
                    marks={[
                      { value: 5, label: "5s" },
                      { value: 10, label: "10s" },
                      { value: 30, label: "30s" },
                      { value: 60, label: "1m" },
                      { value: 120, label: "2m" },
                    ]}
                  />
                )}
                {isUnlimited && (
                  <p className="text-xs text-warning-500 mt-1">{t("gui.unlimited_hint")}</p>
                )}
              </div>

              <Slider
                label={t("gui.concurrency")}
                step={1}
                minValue={1}
                maxValue={50}
                value={concurrency}
                onChange={setConcurrency}
                className="max-w-full"
                size="sm"
                isDisabled={isRunning}
                marks={[
                  { value: 1, label: "1" },
                  { value: 10, label: "10" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                ]}
              />
              <Slider
                label={t("gui.workers")}
                step={1}
                minValue={1}
                maxValue={50}
                value={workers}
                onChange={setWorkers}
                className="max-w-full"
                size="sm"
                isDisabled={isRunning}
                marks={[
                  { value: 1, label: "1" },
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 50, label: "50" },
                ]}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("gui.no_aaaa")}</p>
                  <p className="text-xs text-default-400">{t("gui.no_aaaa_desc")}</p>
                </div>
                <Switch isSelected={noAAAA} onValueChange={setNoAAAA} size="sm" isDisabled={isRunning} />
              </div>
            </div>

            <Divider />

            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  color="primary"
                  variant="shadow"
                  startContent={<PlayIcon />}
                  onClick={handleStart}
                  className="flex-1 font-semibold"
                  size="lg"
                >
                  {t("gui.start_benchmark")}
                </Button>
              ) : (
                <Button
                  color="danger"
                  variant="shadow"
                  startContent={<StopIcon />}
                  onClick={handleStop}
                  className="flex-1 font-semibold"
                  size="lg"
                >
                  {t("gui.stop_benchmark")}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Results Panel */}
        <Card className="flex-1 shadow-md">
          <CardHeader className="pb-0">
            <Tabs
              selectedKey={resultsTab}
              onSelectionChange={(key) => setResultsTab(String(key))}
              variant="underlined"
              color="primary"
              size="sm"
            >
              <Tab
                key="ranking"
                title={
                  <div className="flex items-center gap-1.5">
                    <TrophyIcon className="w-3.5 h-3.5" />
                    <span>{t("gui.top_results")}</span>
                    {topResults.length > 0 && (
                      <Chip size="sm" variant="flat" className="h-5 min-w-0">
                        {topResults.length}
                      </Chip>
                    )}
                  </div>
                }
              />
              <Tab
                key="live"
                title={
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-default-300"}`} />
                    <span>{t("gui.live_feed")}</span>
                    {activityLog.length > 0 && (
                      <Chip size="sm" variant="flat" className="h-5 min-w-0">
                        {activityLog.length}
                      </Chip>
                    )}
                  </div>
                }
              />
              <Tab
                key="all"
                title={
                  <div className="flex items-center gap-1.5">
                    <ListIcon className="w-3.5 h-3.5" />
                    <span>{t("gui.all_results")}</span>
                    {allResultsSorted.length > 0 && (
                      <Chip size="sm" variant="flat" className="h-5 min-w-0">
                        {allResultsSorted.length}
                      </Chip>
                    )}
                  </div>
                }
              />
            </Tabs>
          </CardHeader>
          <CardBody className="pt-2">
            {/* Ranking Tab */}
            {resultsTab === "ranking" && (
              <>
                {topResults.length > 0 ? (
                  <ScrollShadow className="max-h-[500px]">
                    <div className="flex flex-col gap-2">
                      {topResults.slice(0, 20).map(([server, result], index) => (
                        <div
                          key={server}
                          onClick={() => handleServerClick(server, result)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                            index === 0
                              ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30 hover:shadow-md"
                              : index === 1
                              ? "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200/50 dark:border-slate-700/30 hover:shadow-md"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30 hover:shadow-md"
                              : "bg-default-50 hover:bg-default-100 border border-transparent hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-7 text-center ${index < 3 ? "text-lg" : "text-xs font-bold text-default-400"}`}>
                              {getRankDisplay(index)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                                <span className="text-sm font-medium truncate block max-w-[160px]">
                                  {server}
                                </span>
                              </Tooltip>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {result.geocode && (
                                  <Chip size="sm" variant="flat" className="h-4 text-tiny">
                                    {result.geocode}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="hidden sm:flex flex-col items-end gap-0.5">
                              <span className={`text-xs font-medium ${getLatencyColor(result.latencyStats?.meanMs || 0)}`}>
                                {result.latencyStats?.meanMs || 0}ms
                              </span>
                              <span className="text-tiny text-default-400">
                                {(result.queriesPerSecond || 0).toFixed(0)} QPS
                              </span>
                            </div>
                            <div className="hidden md:block w-14">
                              <div className="h-1.5 rounded-full bg-default-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    (result.latencyStats?.meanMs || 0) < 50
                                      ? "bg-green-500"
                                      : (result.latencyStats?.meanMs || 0) < 150
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, Math.max(5, 100 - (result.latencyStats?.meanMs || 0) / 5))}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <Chip
                              size="sm"
                              color={getScoreColor(result.score?.total || 0)}
                              variant="flat"
                              className="font-bold min-w-[52px] text-center"
                            >
                              {(result.score?.total || 0).toFixed(1)}
                            </Chip>
                            <ChartIcon className="w-3 h-3 text-default-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollShadow>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-default-100 mb-4">
                      <SpeedIcon className="w-8 h-8 text-default-300" />
                    </div>
                    <p className="text-default-400 font-medium">{t("gui.not_running")}</p>
                    <p className="text-xs text-default-300 mt-1">{t("gui.not_running_hint")}</p>
                  </div>
                )}
              </>
            )}

            {/* Live Feed Tab */}
            {resultsTab === "live" && (
              <>
                {activityLog.length > 0 ? (
                  <ScrollShadow className="max-h-[500px]">
                    <div className="flex flex-col gap-1">
                      {activityLog.map((entry, i) => {
                        const r = entry.result;
                        const alive = isAlive(r);
                        const successRate =
                          r.totalRequests > 0
                            ? ((r.totalSuccessResponses / r.totalRequests) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={i}
                            onClick={() => alive && handleServerClick(entry.server, r)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                              !alive
                                ? "opacity-40"
                                : i === activityLog.length - 1 && isRunning
                                ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30 cursor-pointer"
                                : "bg-default-50 hover:bg-default-100 cursor-pointer"
                            }`}
                          >
                            <span className="text-tiny text-default-400 w-6 text-right flex-shrink-0">
                              {entry.index}
                            </span>
                            <div
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                !alive
                                  ? "bg-default-300"
                                  : (r.score?.total || 0) >= 60
                                  ? "bg-green-500"
                                  : (r.score?.total || 0) >= 30
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <Tooltip content={entry.server}>
                                <span className={`text-sm truncate block max-w-[180px] ${!alive ? "line-through" : ""}`}>
                                  {entry.server}
                                </span>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {r.geocode && (
                                <Chip size="sm" variant="flat" className="h-4 text-tiny hidden sm:flex">
                                  {r.geocode}
                                </Chip>
                              )}
                              {alive ? (
                                <>
                                  <span className={`text-xs font-medium w-12 text-right ${getLatencyColor(r.latencyStats?.meanMs || 0)}`}>
                                    {r.latencyStats?.meanMs || 0}ms
                                  </span>
                                  <span className="text-xs text-default-400 w-10 text-right hidden sm:block">
                                    {successRate}%
                                  </span>
                                  <Chip
                                    size="sm"
                                    color={getScoreColor(r.score?.total || 0)}
                                    variant="flat"
                                    className="font-bold min-w-[44px] text-center"
                                  >
                                    {(r.score?.total || 0).toFixed(1)}
                                  </Chip>
                                </>
                              ) : (
                                <Chip size="sm" variant="flat" color="default" className="text-tiny">
                                  {t("gui.dead")}
                                </Chip>
                              )}
                              <span className="text-tiny text-default-300 w-14 text-right hidden md:block">
                                {entry.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={activityEndRef} />
                    </div>
                  </ScrollShadow>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-default-100 mb-4">
                      <TimelapseIcon className="w-8 h-8 text-default-300" />
                    </div>
                    <p className="text-default-400 font-medium">{t("gui.live_feed_empty")}</p>
                    <p className="text-xs text-default-300 mt-1">{t("gui.live_feed_hint")}</p>
                  </div>
                )}
              </>
            )}

            {/* All Results Tab */}
            {resultsTab === "all" && (
              <>
                {allResultsSorted.length > 0 ? (
                  <ScrollShadow className="max-h-[500px]">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-default-500 border-b border-default-200 sticky top-0 bg-content1 z-10">
                      <span className="w-7 text-center">#</span>
                      <span className="flex-1">{t("gui.col_server")}</span>
                      <span className="w-12 text-right hidden sm:block">{t("gui.col_region")}</span>
                      <span className="w-14 text-right">{t("gui.col_latency")}</span>
                      <span className="w-12 text-right hidden sm:block">QPS</span>
                      <span className="w-14 text-right hidden sm:block">{t("gui.col_success")}</span>
                      <span className="w-14 text-right">{t("gui.col_score")}</span>
                      <span className="w-5"></span>
                    </div>
                    <div className="flex flex-col">
                      {allResultsSorted.map(([server, result], index) => {
                        const successRate =
                          result.totalRequests > 0
                            ? ((result.totalSuccessResponses / result.totalRequests) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={server}
                            onClick={() => handleServerClick(server, result)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-default-50 border-b border-default-100 transition-colors cursor-pointer"
                          >
                            <span className={`w-7 text-center ${index < 3 ? "text-base" : "text-xs text-default-400"}`}>
                              {getRankDisplay(index)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                                <span className="text-sm truncate block max-w-[180px]">{server}</span>
                              </Tooltip>
                            </div>
                            <span className="w-12 text-right hidden sm:block">
                              {result.geocode && (
                                <Chip size="sm" variant="flat" className="h-4 text-tiny">
                                  {result.geocode}
                                </Chip>
                              )}
                            </span>
                            <span className={`w-14 text-right text-xs font-medium ${getLatencyColor(result.latencyStats?.meanMs || 0)}`}>
                              {result.latencyStats?.meanMs || 0}ms
                            </span>
                            <span className="w-12 text-right text-xs text-default-500 hidden sm:block">
                              {(result.queriesPerSecond || 0).toFixed(0)}
                            </span>
                            <span className="w-14 text-right text-xs text-default-500 hidden sm:block">
                              {successRate}%
                            </span>
                            <div className="w-14 flex justify-end">
                              <Chip
                                size="sm"
                                color={getScoreColor(result.score?.total || 0)}
                                variant="flat"
                                className="font-bold min-w-[44px] text-center"
                              >
                                {(result.score?.total || 0).toFixed(1)}
                              </Chip>
                            </div>
                            <ChartIcon className="w-3 h-3 text-default-300 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollShadow>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-default-100 mb-4">
                      <ListIcon className="w-8 h-8 text-default-300" />
                    </div>
                    <p className="text-default-400 font-medium">{t("gui.no_results")}</p>
                    <p className="text-xs text-default-300 mt-1">{t("gui.no_results_hint")}</p>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Server Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {selectedServer && selectedResult && detailCharts && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ChartIcon className="w-5 h-5 text-primary" />
                  <span>{selectedServer}</span>
                  {selectedResult.geocode && (
                    <Chip size="sm" variant="flat">{selectedResult.geocode}</Chip>
                  )}
                  <Chip size="sm" color={getScoreColor(selectedResult.score?.total || 0)} variant="flat" className="font-bold">
                    {(selectedResult.score?.total || 0).toFixed(1)}
                  </Chip>
                </div>
                {selectedResult.ip && (
                  <span className="text-xs text-default-400">IP: {selectedResult.ip}</span>
                )}
              </ModalHeader>
              <ModalBody>
                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3 text-center">
                      <p className="text-xs text-default-500">{t("gui.col_latency")}</p>
                      <p className={`text-xl font-bold ${getLatencyColor(selectedResult.latencyStats?.meanMs || 0)}`}>
                        {selectedResult.latencyStats?.meanMs || 0}ms
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3 text-center">
                      <p className="text-xs text-default-500">QPS</p>
                      <p className="text-xl font-bold text-cyan-600">
                        {(selectedResult.queriesPerSecond || 0).toFixed(1)}
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3 text-center">
                      <p className="text-xs text-default-500">{t("gui.col_success")}</p>
                      <p className="text-xl font-bold text-green-600">
                        {selectedResult.totalRequests > 0
                          ? ((selectedResult.totalSuccessResponses / selectedResult.totalRequests) * 100).toFixed(1)
                          : "0"}%
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3 text-center">
                      <p className="text-xs text-default-500">{t("gui.detail_requests")}</p>
                      <p className="text-xl font-bold text-blue-600">
                        {selectedResult.totalRequests || 0}
                      </p>
                    </CardBody>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Score Radar */}
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3">
                      <p className="text-sm font-medium mb-2">{t("gui.detail_score_breakdown")}</p>
                      <div style={{ height: 220 }}>
                        <Radar
                          data={detailCharts.radar}
                          options={{
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
                          }}
                        />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Request Distribution */}
                  <Card className="border-none bg-default-50">
                    <CardBody className="p-3">
                      <p className="text-sm font-medium mb-2">{t("gui.detail_request_dist")}</p>
                      <div style={{ height: 220 }} className="flex items-center justify-center">
                        <Doughnut
                          data={detailCharts.requestDonut}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: "60%",
                            plugins: {
                              legend: { position: "bottom", labels: { font: { size: 11 } } },
                            },
                          }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Latency Distribution */}
                <Card className="border-none bg-default-50 mt-4">
                  <CardBody className="p-3">
                    <p className="text-sm font-medium mb-2">{t("gui.detail_latency_dist")}</p>
                    <div style={{ height: 200 }}>
                      <Bar
                        data={detailCharts.latencyBar}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: { display: true, text: "ms", font: { size: 11 } },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* Detailed Stats */}
                <Card className="border-none bg-default-50 mt-4">
                  <CardBody className="p-3">
                    <p className="text-sm font-medium mb-2">{t("gui.detail_stats")}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-default-500">Min Latency</span><span>{selectedResult.latencyStats?.minMs || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">P50 Latency</span><span>{selectedResult.latencyStats?.p50Ms || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">P75 Latency</span><span>{selectedResult.latencyStats?.p75Ms || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">P90 Latency</span><span>{selectedResult.latencyStats?.p90Ms || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">P95 Latency</span><span>{selectedResult.latencyStats?.p95Ms || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">P99 Latency</span><span>{selectedResult.latencyStats?.p99Ms || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">Max Latency</span><span>{selectedResult.latencyStats?.maxMs || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">Std Dev</span><span>{selectedResult.latencyStats?.stdMs || 0}ms</span></div>
                      <div className="flex justify-between"><span className="text-default-500">{t("gui.detail_duration")}</span><span>{(selectedResult.benchmarkDurationSeconds || 0).toFixed(1)}s</span></div>
                      <div className="flex justify-between"><span className="text-default-500">{t("gui.detail_success")}</span><span>{selectedResult.totalSuccessResponses || 0}</span></div>
                      <div className="flex justify-between"><span className="text-default-500">{t("gui.detail_errors")}</span><span>{selectedResult.totalErrorResponses || 0}</span></div>
                      <div className="flex justify-between"><span className="text-default-500">{t("gui.detail_io_errors")}</span><span>{selectedResult.totalIOErrors || 0}</span></div>
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
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
