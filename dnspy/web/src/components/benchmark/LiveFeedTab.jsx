import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollShadow, Tooltip, Chip } from "@nextui-org/react";
import { MdTimelapse as TimelapseIcon } from "react-icons/md";
import { isAlive, getScoreColor, getLatencyColor } from "./utils";

/**
 * Live Feed tab — real-time activity log with auto-scroll.
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-default-100 mb-4">
          <TimelapseIcon className="w-8 h-8 text-default-300" />
        </div>
        <p className="text-default-400 font-medium">
          {t("gui.live_feed_empty")}
        </p>
        <p className="text-xs text-default-300 mt-1">
          {t("gui.live_feed_hint")}
        </p>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-[500px]">
      <div className="flex flex-col gap-1">
        {activityLog.map((entry, i) => {
          const r = entry.result;
          const alive = isAlive(r);
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
                  <span
                    className={`text-sm truncate block max-w-[180px] ${
                      !alive ? "line-through" : ""
                    }`}
                  >
                    {entry.server}
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.geocode && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="h-4 text-tiny hidden sm:flex"
                  >
                    {r.geocode}
                  </Chip>
                )}
                {alive ? (
                  <>
                    <span
                      className={`text-xs font-medium w-12 text-right ${getLatencyColor(
                        r.latencyStats?.meanMs || 0
                      )}`}
                    >
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
                  <Chip
                    size="sm"
                    variant="flat"
                    color="default"
                    className="text-tiny"
                  >
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
        <div ref={endRef} />
      </div>
    </ScrollShadow>
  );
}
