import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { MdTimelapse as TimelapseIcon } from "react-icons/md";
import { isAlive, getScoreColor, getLatencyColor, countryCodeToFlag } from "./utils";

/**
 * Live Feed tab — real-time activity log with improved visual design.
 */
export default function LiveFeedTab({
  activityLog,
  isRunning,
  onServerClick,
}) {
  const { t } = useTranslation();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog]);

  if (activityLog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-default-100 to-default-50 mb-4 shadow-inner">
          <TimelapseIcon className="w-10 h-10 text-default-300" />
        </div>
        <p className="text-default-500 font-semibold text-base">
          {t("gui.live_feed_empty")}
        </p>
        <p className="text-sm text-default-400 mt-1 max-w-xs">
          {t("gui.live_feed_hint")}
        </p>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-[520px]">
      <div className="flex flex-col gap-1.5">
        {activityLog.map((entry, i) => {
          const r = entry.result;
          const alive = isAlive(r);
          const isLatest = i === activityLog.length - 1 && isRunning;
          const successRate =
            r.totalRequests > 0
              ? (
                  (r.totalSuccessResponses / r.totalRequests) *
                  100
                ).toFixed(1)
              : "0.0";

          return (
            <div
              key={i}
              onClick={() => alive && onServerClick(entry.server, r)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 border ${
                !alive
                  ? "opacity-30 border-transparent"
                  : isLatest
                  ? "bg-primary-50/80 dark:bg-primary-950/30 border-primary-200/60 dark:border-primary-800/40 shadow-sm shadow-primary-200/30 cursor-pointer"
                  : "bg-content1 hover:bg-default-100 border-transparent hover:border-default-200/50 cursor-pointer"
              }`}
            >
              {/* Index */}
              <span className="text-tiny text-default-400 w-7 text-right flex-shrink-0 font-mono">
                {entry.index}
              </span>

              {/* Status dot */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !alive
                      ? "bg-default-300"
                      : (r.score?.total || 0) >= 60
                      ? "bg-green-500"
                      : (r.score?.total || 0) >= 30
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                {isLatest && alive && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-50" />
                )}
              </div>

              {/* Server name */}
              <div className="min-w-0 flex-1">
                <Tooltip content={entry.server}>
                  <span
                    className={`text-sm font-medium truncate block max-w-[200px] ${
                      !alive ? "line-through text-default-400" : ""
                    }`}
                  >
                    {entry.server}
                  </span>
                </Tooltip>
              </div>

              {/* Results */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.geocode && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="h-4 text-tiny hidden sm:flex"
                  >
                    {countryCodeToFlag(r.geocode)} {r.geocode}
                  </Chip>
                )}
                {alive ? (
                  <>
                    <span
                      className={`text-xs font-bold w-12 text-right ${getLatencyColor(
                        r.latencyStats?.meanMs || 0
                      )}`}
                    >
                      {r.latencyStats?.meanMs || 0}ms
                    </span>
                    <span className="text-xs text-default-400 w-10 text-right hidden sm:block font-medium">
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
                  <Chip
                    size="sm"
                    variant="flat"
                    color="danger"
                    className="text-tiny"
                  >
                    {t("gui.dead")}
                  </Chip>
                )}
                <span className="text-tiny text-default-300 w-14 text-right hidden md:block font-mono">
                  {entry.time}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </ScrollShadow>
  );
}
