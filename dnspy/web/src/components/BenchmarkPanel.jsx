import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  useDisclosure,
} from "@nextui-org/react";
import { Toaster } from "sonner";
import {
  FaDownload as DownloadIcon,
  FaTrophy as TrophyIcon,
  FaList as ListIcon,
} from "react-icons/fa";
import { MdSpeed as SpeedIcon } from "react-icons/md";
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

import {
  useBenchmark,
  StatsCards,
  ProgressBar,
  CompletionBanner,
  ConfigPanel,
  RankingTab,
  LiveFeedTab,
  AllResultsTab,
  ServerDetailModal,
} from "./benchmark";
import { computeStats, isAlive } from "./benchmark/utils";

// Register Chart.js components (safe to call multiple times — Chart.js deduplicates)
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

/**
 * Main Benchmark panel — thin orchestrator that delegates to sub-components.
 */
export default function BenchmarkPanel({ onSwitchToAnalyze }) {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resultsTab, setResultsTab] = useState("ranking");
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  const benchmark = useBenchmark(t);

  const {
    isRunning,
    completed,
    total,
    currentServer,
    partialResults,
    activityLog,
    elapsedTime,
    handleExport,
  } = benchmark;

  // Derived data
  const { aliveEntries, deadCount, avgLatency, avgSuccessRate, avgQPS } =
    computeStats(partialResults);

  const topResults = [...aliveEntries].sort(
    (a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0)
  );
  const allResultsSorted = [...aliveEntries].sort(
    (a, b) => (b[1].score?.total || 0) - (a[1].score?.total || 0)
  );

  const hasResults = Object.keys(partialResults).length > 0;
  const isDone = !isRunning && completed > 0;

  const handleServerClick = (server, result) => {
    setSelectedServer(server);
    setSelectedResult(result);
    onOpen();
  };

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
                onClick={handleExport}
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
        <StatsCards
          completed={completed}
          total={total}
          deadCount={deadCount}
          avgLatency={avgLatency}
          avgSuccessRate={avgSuccessRate}
          avgQPS={avgQPS}
          elapsedTime={elapsedTime}
        />
      )}

      {/* Progress Bar */}
      {isRunning && (
        <ProgressBar
          completed={completed}
          total={total}
          currentServer={currentServer}
          elapsedTime={elapsedTime}
        />
      )}

      {/* Completion Banner */}
      {isDone && (
        <CompletionBanner
          completed={completed}
          deadCount={deadCount}
          onSwitchToAnalyze={onSwitchToAnalyze}
        />
      )}

      {/* Main layout: Config + Results */}
      <div className="flex flex-col lg:flex-row gap-4">
        <ConfigPanel
          isRunning={isRunning}
          servers={benchmark.servers}
          setServers={benchmark.setServers}
          useBuiltin={benchmark.useBuiltin}
          setUseBuiltin={benchmark.setUseBuiltin}
          duration={benchmark.duration}
          setDuration={benchmark.setDuration}
          isUnlimited={benchmark.isUnlimited}
          setIsUnlimited={benchmark.setIsUnlimited}
          concurrency={benchmark.concurrency}
          setConcurrency={benchmark.setConcurrency}
          workers={benchmark.workers}
          setWorkers={benchmark.setWorkers}
          noAAAA={benchmark.noAAAA}
          setNoAAAA={benchmark.setNoAAAA}
          onStart={benchmark.handleStart}
          onStop={benchmark.handleStop}
        />

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
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isRunning
                          ? "bg-green-500 animate-pulse"
                          : "bg-default-300"
                      }`}
                    />
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
            {resultsTab === "ranking" && (
              <RankingTab
                topResults={topResults}
                onServerClick={handleServerClick}
              />
            )}
            {resultsTab === "live" && (
              <LiveFeedTab
                activityLog={activityLog}
                isRunning={isRunning}
                onServerClick={handleServerClick}
              />
            )}
            {resultsTab === "all" && (
              <AllResultsTab
                results={allResultsSorted}
                onServerClick={handleServerClick}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Server Detail Modal */}
      <ServerDetailModal
        isOpen={isOpen}
        onClose={onClose}
        server={selectedServer}
        result={selectedResult}
      />
    </div>
  );
}
