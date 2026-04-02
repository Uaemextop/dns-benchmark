import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { FaList as ListIcon, FaChartBar as ChartIcon } from "react-icons/fa";
import { getRankDisplay, getScoreColor, getLatencyColor } from "./utils";

/**
 * All Results tab — full sorted table of alive servers.
 */
export default function AllResultsTab({ results, onServerClick }) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-default-100 mb-4">
          <ListIcon className="w-8 h-8 text-default-300" />
        </div>
        <p className="text-default-400 font-medium">{t("gui.no_results")}</p>
        <p className="text-xs text-default-300 mt-1">
          {t("gui.no_results_hint")}
        </p>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-default-500 border-b border-default-200 sticky top-0 bg-content1 z-10">
        <span className="w-7 text-center">#</span>
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

          return (
            <div
              key={server}
              onClick={() => onServerClick(server, result)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-default-50 border-b border-default-100 transition-colors cursor-pointer"
            >
              <span
                className={`w-7 text-center ${
                  index < 3 ? "text-base" : "text-xs text-default-400"
                }`}
              >
                {getRankDisplay(index)}
              </span>
              <div className="flex-1 min-w-0">
                <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                  <span className="text-sm truncate block max-w-[180px]">
                    {server}
                  </span>
                </Tooltip>
              </div>
              <span className="w-12 text-right hidden sm:block">
                {result.geocode && (
                  <Chip size="sm" variant="flat" className="h-4 text-tiny">
                    {result.geocode}
                  </Chip>
                )}
              </span>
              <span
                className={`w-14 text-right text-xs font-medium ${getLatencyColor(
                  result.latencyStats?.meanMs || 0
                )}`}
              >
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
  );
}
