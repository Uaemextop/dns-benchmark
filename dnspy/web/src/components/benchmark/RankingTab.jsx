import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { MdSpeed as SpeedIcon } from "react-icons/md";
import { FaChartBar as ChartIcon } from "react-icons/fa";
import { getRankDisplay, getScoreColor, getLatencyColor } from "./utils";

/**
 * Ranking tab — top servers sorted by score with medal display.
 */
export default function RankingTab({ topResults, onServerClick }) {
  const { t } = useTranslation();

  if (topResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-default-100 mb-4">
          <SpeedIcon className="w-8 h-8 text-default-300" />
        </div>
        <p className="text-default-400 font-medium">{t("gui.not_running")}</p>
        <p className="text-xs text-default-300 mt-1">
          {t("gui.not_running_hint")}
        </p>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-[500px]">
      <div className="flex flex-col gap-2">
        {topResults.slice(0, 20).map(([server, result], index) => (
          <div
            key={server}
            onClick={() => onServerClick(server, result)}
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
              <span
                className={`w-7 text-center ${
                  index < 3
                    ? "text-lg"
                    : "text-xs font-bold text-default-400"
                }`}
              >
                {getRankDisplay(index)}
              </span>
              <div className="min-w-0 flex-1">
                <Tooltip content={`${server} — ${t("gui.click_details")}`}>
                  <span className="text-sm font-medium truncate block max-w-[160px]">
                    {server}
                  </span>
                </Tooltip>
                {result.geocode && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Chip size="sm" variant="flat" className="h-4 text-tiny">
                      {result.geocode}
                    </Chip>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end gap-0.5">
                <span
                  className={`text-xs font-medium ${getLatencyColor(
                    result.latencyStats?.meanMs || 0
                  )}`}
                >
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
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          100 - (result.latencyStats?.meanMs || 0) / 5
                        )
                      )}%`,
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
  );
}
