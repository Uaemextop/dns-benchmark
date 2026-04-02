import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { FaList as ListIcon, FaChartBar as ChartIcon } from "react-icons/fa";
import { getRankDisplay, getScoreColor, getLatencyColor } from "./utils";

/**
 * All Results tab — full sorted table of alive servers with improved design.
 */
export default function AllResultsTab({ results, onServerClick }) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-default-100 to-default-50 mb-4 shadow-inner">
          <ListIcon className="w-10 h-10 text-default-300" />
        </div>
        <p className="text-default-500 font-semibold text-base">
          {t("gui.no_results")}
        </p>
        <p className="text-sm text-default-400 mt-1 max-w-xs">
          {t("gui.no_results_hint")}
        </p>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-default-500 border-b-2 border-default-200 sticky top-0 bg-content1 z-10 uppercase tracking-wider">
        <span className="w-8 text-center">#</span>
        <span className="flex-1">{t("gui.col_server")}</span>
        <span className="w-12 text-right hidden sm:block">
          {t("gui.col_region")}
        </span>
        <span className="w-14 text-right">{t("gui.col_latency")}</span>
        <span className="w-12 text-right hidden sm:block">QPS</span>
        <span className="w-14 text-right hidden sm:block">
          {t("gui.col_success")}
        </span>
        <span className="w-14 text-right">{t("gui.col_score")}</span>
        <span className="w-5" />
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {results.map(([server, result], index) => {
          const successRate =
            result.totalRequests > 0
              ? (
                  (result.totalSuccessResponses / result.totalRequests) *
                  100
                ).toFixed(1)
              : "0.0";
          const latency = result.latencyStats?.meanMs || 0;
          const score = result.score?.total || 0;

          return (
            <div
              key={server}
              onClick={() => onServerClick(server, result)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b border-default-100 transition-all cursor-pointer ${
                index < 3
                  ? "hover:bg-primary-50/50 dark:hover:bg-primary-950/20"
                  : "hover:bg-default-50"
              }`}
            >
              <div
                className={`w-8 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  index === 0
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : index === 1
                    ? "bg-slate-100 dark:bg-slate-900/30"
                    : index === 2
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : ""
                }`}
              >
                <span
                  className={`${
                    index < 3
                      ? "text-sm"
                      : "text-xs font-bold text-default-400"
                  }`}
                >
                  {getRankDisplay(index)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                  <span className="text-sm font-medium truncate block max-w-[200px]">
                    {server}
                  </span>
                </Tooltip>
              </div>
              <span className="w-12 text-right hidden sm:block">
                {result.geocode && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="h-4 text-tiny px-1.5"
                  >
                    {result.geocode}
                  </Chip>
                )}
              </span>
              <span
                className={`w-14 text-right text-xs font-bold ${getLatencyColor(
                  latency
                )}`}
              >
                {latency}ms
              </span>
              <span className="w-12 text-right text-xs text-default-500 hidden sm:block font-medium">
                {(result.queriesPerSecond || 0).toFixed(0)}
              </span>
              <span className="w-14 text-right text-xs text-default-500 hidden sm:block font-medium">
                {successRate}%
              </span>
              <div className="w-14 flex justify-end">
                <Chip
                  size="sm"
                  color={getScoreColor(score)}
                  variant="flat"
                  className="font-bold min-w-[44px] text-center"
                >
                  {score.toFixed(1)}
                </Chip>
              </div>
              <ChartIcon className="w-3.5 h-3.5 text-default-300 flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </ScrollShadow>
  );
}
