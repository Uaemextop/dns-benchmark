import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useFile } from "../../contexts/FileContext";
import { useSSE } from "./useSSE";
import { useElapsedTimer } from "./useElapsedTimer";

/**
 * Central hook managing benchmark state, SSE, start/stop actions.
 * Keeps all benchmark logic in one place, out of the UI layer.
 */
export function useBenchmark(t) {
  const { setJsonData } = useFile();

  // Config state
  const [servers, setServers] = useState("");
  const [useBuiltin, setUseBuiltin] = useState(true);
  const [duration, setDuration] = useState(10);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [concurrency, setConcurrency] = useState(10);
  const [workers, setWorkers] = useState(20);
  const [noAAAA, setNoAAAA] = useState(false);

  // Benchmark run state
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentServer, setCurrentServer] = useState("");
  const [partialResults, setPartialResults] = useState({});
  const [activityLog, setActivityLog] = useState([]);

  const { elapsedTime, setElapsedTime, startTime, setStartTime } =
    useElapsedTimer(isRunning);

  // ── SSE event handlers ──────────────────────────────────────────────
  const handleSSEStatus = useCallback(
    (data) => {
      if (data.message === "running") {
        setIsRunning(true);
        setCompleted(data.completed);
        setTotal(data.total);
        setStartTime((prev) => prev ?? Date.now());
      } else if (data.message === "completed") {
        setIsRunning(false);
      }
    },
    [setStartTime]
  );

  const handleSSEProgress = useCallback((data) => {
    setCompleted(data.completed);
    setTotal(data.total);
    setCurrentServer(data.server);
    if (data.result) {
      setPartialResults((prev) => ({ ...prev, [data.server]: data.result }));
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
  }, []);

  const handleSSEComplete = useCallback(
    (data) => {
      setIsRunning(false);
      setCurrentServer("");
      if (data.results) {
        setJsonData(data.results);
        localStorage.setItem("dnsAnalyzerData", JSON.stringify(data.results));
        toast.success(t("gui.benchmark_complete"), {
          description: t("gui.benchmark_complete_desc"),
          duration: 5000,
          className: "dark:text-neutral-200",
        });
      }
    },
    [t, setJsonData]
  );

  const handleSSEError = useCallback(
    (data) => {
      setIsRunning(false);
      toast.error(t("gui.benchmark_error"), {
        description: data.message,
        duration: 5000,
        className: "dark:text-neutral-200",
      });
    },
    [t]
  );

  useSSE({
    onStatus: handleSSEStatus,
    onProgress: handleSSEProgress,
    onComplete: handleSSEComplete,
    onError: handleSSEError,
  });

  // ── Actions ─────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
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
          description: err.error || "Failed to start",
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
  }, [
    servers,
    useBuiltin,
    duration,
    isUnlimited,
    concurrency,
    workers,
    noAAAA,
    t,
    setElapsedTime,
    setStartTime,
  ]);

  const handleStop = useCallback(async () => {
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
  }, [t]);

  const handleExport = useCallback(() => {
    if (Object.keys(partialResults).length === 0) return;
    const blob = new Blob([JSON.stringify(partialResults, null, 2)], {
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
  }, [partialResults]);

  return {
    // Config
    servers,
    setServers,
    useBuiltin,
    setUseBuiltin,
    duration,
    setDuration,
    isUnlimited,
    setIsUnlimited,
    concurrency,
    setConcurrency,
    workers,
    setWorkers,
    noAAAA,
    setNoAAAA,
    // Run state
    isRunning,
    completed,
    total,
    currentServer,
    partialResults,
    activityLog,
    elapsedTime,
    // Actions
    handleStart,
    handleStop,
    handleExport,
  };
}
