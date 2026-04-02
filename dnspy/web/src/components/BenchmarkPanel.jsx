import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
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
} from "react-icons/fa";
import { MdSpeed as SpeedIcon } from "react-icons/md";

import { useFile } from "../contexts/FileContext";

export default function BenchmarkPanel() {
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

  const eventSourceRef = useRef(null);

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
      // Reconnect after a delay
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

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // Get top results so far, sorted by score
  const topResults = Object.entries(partialResults)
    .filter(([, r]) => r && r.score && r.score.total > 0)
    .sort((a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0))
    .slice(0, 10);

  return (
    <div className="p-4 flex flex-col gap-4 max-w-4xl mx-auto">
      <Toaster position="top-center" expand={false} richColors />

      {/* Header */}
      <div className="flex items-center gap-3">
        <SpeedIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("gui.title")}</h1>
          <p className="text-sm text-default-500">{t("gui.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Configuration Panel */}
        <Card className="flex-1">
          <CardHeader className="font-medium text-lg">
            <ServerIcon className="w-5 h-5 mr-2" />
            {t("gui.configuration")}
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
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
              />
            </div>

            {/* Custom Servers */}
            <Textarea
              label={t("gui.custom_servers")}
              placeholder={t("gui.custom_servers_placeholder")}
              value={servers}
              onValueChange={setServers}
              minRows={3}
              maxRows={6}
              description={t("gui.custom_servers_desc")}
            />

            <Divider />

            {/* Test Parameters */}
            <div className="flex flex-col gap-4">
              <Slider
                label={t("gui.duration")}
                step={1}
                minValue={5}
                maxValue={60}
                value={duration}
                onChange={setDuration}
                className="max-w-full"
                size="sm"
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
                  className="flex-1"
                >
                  {t("gui.start_benchmark")}
                </Button>
              ) : (
                <Button
                  color="danger"
                  variant="shadow"
                  startContent={<StopIcon />}
                  onClick={handleStop}
                  className="flex-1"
                >
                  {t("gui.stop_benchmark")}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Progress & Live Results Panel */}
        <Card className="flex-1">
          <CardHeader className="font-medium text-lg">
            {t("gui.progress")}
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {isRunning ? (
              <>
                <Progress
                  aria-label="Benchmark progress"
                  value={progressPercent}
                  color="primary"
                  showValueLabel
                  className="max-w-full"
                />
                <div className="flex justify-between text-sm text-default-500">
                  <span>
                    {completed} / {total} {t("gui.servers_tested")}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                {currentServer && (
                  <div className="text-sm">
                    <span className="text-default-400">
                      {t("gui.testing")}:{" "}
                    </span>
                    <Chip size="sm" variant="flat" color="primary">
                      {currentServer}
                    </Chip>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-default-400 py-4">
                {completed > 0 ? (
                  <p>
                    ✅ {t("gui.benchmark_done", { count: completed })}
                  </p>
                ) : (
                  <p>{t("gui.not_running")}</p>
                )}
              </div>
            )}

            {/* Live Top Results */}
            {topResults.length > 0 && (
              <>
                <Divider />
                <div className="text-sm font-medium">
                  {t("gui.top_results")}
                </div>
                <div className="flex flex-col gap-1.5">
                  {topResults.map(([server, result], index) => (
                    <div
                      key={server}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-default-400 w-5">
                          #{index + 1}
                        </span>
                        <Tooltip content={server}>
                          <span className="text-xs truncate max-w-[200px]">
                            {server}
                          </span>
                        </Tooltip>
                        {result.geocode && (
                          <Chip size="sm" variant="flat" className="h-5">
                            {result.geocode}
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          color={
                            result.score.total >= 70
                              ? "success"
                              : result.score.total >= 40
                              ? "warning"
                              : "danger"
                          }
                          variant="flat"
                        >
                          {result.score.total.toFixed(1)}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
