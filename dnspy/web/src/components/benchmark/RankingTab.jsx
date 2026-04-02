import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { MdSpeed as SpeedIcon } from "react-icons/md";
import { FaChartBar as ChartIcon, FaCopy as CopyIcon } from "react-icons/fa";
import { toast } from "sonner";
import { getRankDisplay, getScoreColor, getLatencyColor, countryCodeToFlag } from "./utils";

/**
 * Ranking tab — top servers sorted by score with improved visual design.
 * Supports click-to-view-details and right-click/long-press to copy address.
 */
export default function RankingTab({ topResults, onServerClick }) {
  const { t } = useTranslation();

  const handleCopy = (e, server) => {
    e.stopPropagation();
    navigator.clipboard.writeText(server).then(() => {
      toast.success(t("tip.copied"), {
        description: server,
        duration: 2000,
      });
    }).catch(() => {
      toast.error(t("tip.copy_failed"));
    });
  };

  if (topResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-default-100 to-default-50 mb-4 shadow-inner">
          <SpeedIcon className="w-10 h-10 text-default-300" />
        </div>
        <p className="text-default-500 font-semibold text-base">
          {t("gui.not_running")}
        </p>
        <p className="text-sm text-default-400 mt-1 max-w-xs">
          {t("gui.not_running_hint")}
        </p>
      </div>
    );
  }

  const rankStyles = [
    "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30 border-amber-300/60 dark:border-amber-700/40 shadow-sm shadow-amber-200/50",
    "bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-slate-950/30 dark:via-gray-950/20 dark:to-slate-950/30 border-slate-300/60 dark:border-slate-700/40 shadow-sm shadow-slate-200/50",
    "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-orange-950/30 border-orange-300/60 dark:border-orange-700/40 shadow-sm shadow-orange-200/50",
  ];

  return (
    <ScrollShadow className="max-h-[520px]">
      <div className="flex flex-col gap-2">
        {topResults.slice(0, 30).map(([server, result], index) => {
          const latency = result.latencyStats?.meanMs || 0;
          const score = result.score?.total || 0;
          const qps = result.queriesPerSecond || 0;

          return (
            <div
              key={server}
              onClick={() => onServerClick(server, result)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                index < 3
                  ? rankStyles[index]
                  : "bg-content1 hover:bg-default-100 border-transparent hover:border-default-200/50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    index === 0
                      ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-400/40"
                      : index === 1
                      ? "bg-gradient-to-br from-slate-400 to-gray-500 text-white shadow-md shadow-slate-400/40"
                      : index === 2
                      ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-400/40"
                      : "bg-default-100 text-default-500"
                  }`}
                >
                  <span
                    className={`${
                      index < 3 ? "text-sm" : "text-xs font-bold"
                    }`}
                  >
                    {getRankDisplay(index)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                    <p className="text-sm font-semibold truncate max-w-[180px]">
                      {server}
                    </p>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {result.geocode && (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="h-4 text-tiny px-1.5"
                      >
                        {countryCodeToFlag(result.geocode)} {result.geocode}
                      </Chip>
                    )}
                    {result.ipAddress && (
                      <span className="text-tiny text-default-400 hidden lg:inline">
                        {result.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  <span
                    className={`text-xs font-bold ${getLatencyColor(latency)}`}
                  >
                    {latency}ms
                  </span>
                  <span className="text-tiny text-default-400 font-medium">
                    {qps.toFixed(0)} QPS
                  </span>
                </div>
                {/* Latency bar visualization */}
                <div className="hidden md:block w-16">
                  <div className="h-2 rounded-full bg-default-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        latency < 50
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : latency < 150
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                          : "bg-gradient-to-r from-red-400 to-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(8, 100 - latency / 5)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <Chip
                  size="sm"
                  color={getScoreColor(score)}
                  variant="shadow"
                  className="font-bold min-w-[52px] text-center"
                >
                  {score.toFixed(1)}
                </Chip>
                <Tooltip content={t("tip.copied")}>
                  <button
                    onClick={(e) => handleCopy(e, server)}
                    className="p-1 rounded-md hover:bg-default-200 transition-colors"
                    aria-label="Copy server address"
                  >
                    <CopyIcon className="w-3 h-3 text-default-400 hover:text-default-600" />
                  </button>
                </Tooltip>
                <ChartIcon className="w-3.5 h-3.5 text-default-300" />
              </div>
            </div>
          );
        })}
      </div>
    </ScrollShadow>
  );
}
