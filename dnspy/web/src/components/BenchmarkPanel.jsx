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
} from "@nextui-org/react";
import { Toaster, toast } from "sonner";
import {
  FaPlay as PlayIcon,
  FaStop as StopIcon,
  FaServer as ServerIcon,
  FaDownload as DownloadIcon,
  FaTrophy as TrophyIcon,
  FaClock as ClockIcon,
} from "react-icons/fa";
import {
  MdSpeed as SpeedIcon,
  MdTimelapse as TimelapseIcon,
  MdCheckCircle as CheckCircleIcon,
} from "react-icons/md";

import { useFile } from "../contexts/FileContext";

export default function BenchmarkPanel({ onSwitchToAnalyze }) {
  const { t } = useTranslation();
  const { setJsonData } = useFile();

  // Configuration state
  const [servers, setServers] = useState("");
  const [useBuiltin, setUseBuiltin] = useState(true);
  const [duration, setDuration] = useState(10);
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

  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);

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

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
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
        duration,
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
      await fetch("/api/benchmark/stop", { method: "POST" });
      toast.info(t("gui.benchmark_stopping"), {
        duration: 2000,
        className: "dark:text-neutral-200",
      });
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
    a.download = `dnspy_result_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // Compute aggregate stats from partial results
  const resultEntries = Object.entries(partialResults).filter(
    ([, r]) => r && r.score
  );
  const avgLatency =
    resultEntries.length > 0
      ? resultEntries.reduce(
          (sum, [, r]) => sum + (r.statistics?.latencyAvgMs || 0),
          0
        ) / resultEntries.length
      : 0;
  const avgSuccessRate =
    resultEntries.length > 0
      ? resultEntries.reduce(
          (sum, [, r]) => sum + (r.statistics?.successRate || 0),
          0
        ) / resultEntries.length
      : 0;

  // Get top results sorted by score
  const topResults = resultEntries
    .filter(([, r]) => r.score && r.score.total > 0)
    .sort((a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0))
    .slice(0, 10);

  // Rank medal helper
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

  const hasResults = Object.keys(partialResults).length > 0;
  const isDone = !isRunning && completed > 0;

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-5xl mx-auto">
      <Toaster position="top-center" expand={false} richColors />

      {/* Header with gradient */}
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

      {/* Stats Cards - visible when running or done */}
      {(isRunning || hasResults) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Servers Tested */}
          <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <ServerIcon className="w-4 h-4 text-blue-500" />
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
            </CardBody>
          </Card>

          {/* Avg Latency */}
          <Card className="border-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <TimelapseIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-default-500">
                  {t("gui.avg_latency")}
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {avgLatency > 0 ? avgLatency.toFixed(1) : "\u2014"}
                <span className="text-sm font-normal text-default-400">ms</span>
              </p>
            </CardBody>
          </Card>

          {/* Avg Success Rate */}
          <Card className="border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-purple-500" />
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

          {/* Elapsed Time */}
          <Card className="border-none bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-orange-500" />
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

      {/* Progress Bar - when running */}
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
                  <span className="text-default-400">
                    {t("gui.testing")}:
                  </span>
                  <Chip size="sm" variant="flat" color="primary">
                    {currentServer}
                  </Chip>
                </div>
              )}
              {total > 0 && completed > 0 && (
                <span className="text-xs text-default-400">
                  ~{formatTime(Math.round(((elapsedTime / completed) * (total - completed))))} {t("gui.remaining")}
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
                </div>
              </div>
              {onSwitchToAnalyze && (
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  onClick={onSwitchToAnalyze}
                >
                  {t("gui.view_analysis")} →
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Configuration Panel */}
        <Card className="lg:w-[380px] flex-shrink-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold">{t("gui.configuration")}</span>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 pt-0">
            {/* Use Built-in Servers */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {t("gui.use_builtin_servers")}
                </p>
                <p className="text-xs text-default-400">
                  {t("gui.use_builtin_servers_desc")}
                </p>
              </div>
              <Switch
                isSelected={useBuiltin}
                onValueChange={setUseBuiltin}
                size="sm"
                isDisabled={isRunning}
              />
            </div>

            {/* Custom Servers */}
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

            {/* Test Parameters */}
            <div className="flex flex-col gap-3">
              <Slider
                label={t("gui.duration")}
                step={1}
                minValue={5}
                maxValue={60}
                value={duration}
                onChange={setDuration}
                className="max-w-full"
                size="sm"
                isDisabled={isRunning}
                showSteps
                marks={[
                  { value: 5, label: "5s" },
                  { value: 10, label: "10s" },
                  { value: 30, label: "30s" },
                  { value: 60, label: "60s" },
                ]}
              />

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
                  <p className="text-xs text-default-400">
                    {t("gui.no_aaaa_desc")}
                  </p>
                </div>
                <Switch
                  isSelected={noAAAA}
                  onValueChange={setNoAAAA}
                  size="sm"
                  isDisabled={isRunning}
                />
              </div>
            </div>

            <Divider />

            {/* Action Buttons */}
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

        {/* Live Results Panel */}
        <Card className="flex-1 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{t("gui.top_results")}</span>
              </div>
              {topResults.length > 0 && (
                <Chip size="sm" variant="flat" color="default">
                  {topResults.length} {t("gui.servers_shown")}
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {topResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {topResults.map(([server, result], index) => (
                  <div
                    key={server}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      index === 0
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30"
                        : index === 1
                        ? "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200/50 dark:border-slate-700/30"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30"
                        : "bg-default-50 hover:bg-default-100 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-base w-7 text-center ${
                          index < 3 ? "text-lg" : "text-xs font-bold text-default-400"
                        }`}
                      >
                        {getRankDisplay(index)}
                      </span>
                      <div className="min-w-0">
                        <Tooltip content={server}>
                          <span className="text-sm font-medium truncate block max-w-[180px]">
                            {server}
                          </span>
                        </Tooltip>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {result.geocode && (
                            <Chip
                              size="sm"
                              variant="flat"
                              className="h-4 text-tiny"
                            >
                              {result.geocode}
                            </Chip>
                          )}
                          {result.statistics?.latencyAvgMs != null && (
                            <span className="text-tiny text-default-400">
                              {result.statistics.latencyAvgMs.toFixed(1)}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Mini latency bar */}
                      <div className="hidden md:block w-16">
                        <div className="h-1.5 rounded-full bg-default-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (result.statistics?.latencyAvgMs || 0) < 50
                                ? "bg-green-500"
                                : (result.statistics?.latencyAvgMs || 0) < 150
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(5, 100 - (result.statistics?.latencyAvgMs || 0) / 5))}%`,
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-default-100 mb-4">
                  <SpeedIcon className="w-8 h-8 text-default-300" />
                </div>
                <p className="text-default-400 font-medium">
                  {t("gui.not_running")}
                </p>
                <p className="text-xs text-default-300 mt-1">
                  {t("gui.not_running_hint")}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
