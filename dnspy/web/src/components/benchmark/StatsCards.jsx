import { useTranslation } from "react-i18next";
import { Card, CardBody, Chip } from "@nextui-org/react";
import {
  FaServer as ServerIcon,
  FaClock as ClockIcon,
  FaStar as StarIcon,
} from "react-icons/fa";
import {
  MdSpeed as SpeedIcon,
  MdTimelapse as TimelapseIcon,
  MdCheckCircle as CheckCircleIcon,
} from "react-icons/md";
import { formatTime, getScoreColor } from "./utils";

/**
 * Live-updating stat cards shown during / after a benchmark.
 * Includes a "Best Server" highlight card when results are available.
 */
export default function StatsCards({
  completed,
  total,
  deadCount,
  avgLatency,
  avgSuccessRate,
  avgQPS,
  elapsedTime,
  bestServer,
}) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: <ServerIcon className="w-4 h-4" />,
      label: t("gui.servers_tested"),
      value: (
        <>
          {completed}
          <span className="text-sm font-normal text-default-400">/{total}</span>
        </>
      ),
      extra:
        deadCount > 0 ? (
          <p className="text-tiny text-danger-400 mt-0.5">
            {deadCount} {t("gui.dead_servers")}
          </p>
        ) : null,
      iconBg: "bg-blue-500",
      gradient:
        "from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30",
      textColor: "text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200/50 dark:border-blue-800/50",
    },
    {
      icon: <TimelapseIcon className="w-4 h-4" />,
      label: t("gui.avg_latency"),
      value: (
        <>
          {avgLatency > 0 ? avgLatency.toFixed(0) : "\u2014"}
          <span className="text-sm font-normal text-default-400">ms</span>
        </>
      ),
      iconBg: "bg-emerald-500",
      gradient:
        "from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30",
      textColor: "text-emerald-700 dark:text-emerald-300",
      borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
    },
    {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      label: t("gui.avg_success"),
      value: (
        <>
          {avgSuccessRate > 0 ? avgSuccessRate.toFixed(1) : "\u2014"}
          <span className="text-sm font-normal text-default-400">%</span>
        </>
      ),
      iconBg: "bg-violet-500",
      gradient:
        "from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30",
      textColor: "text-violet-700 dark:text-violet-300",
      borderColor: "border-violet-200/50 dark:border-violet-800/50",
    },
    {
      icon: <SpeedIcon className="w-4 h-4" />,
      label: t("gui.avg_qps"),
      value: (
        <>
          {avgQPS > 0 ? avgQPS.toFixed(0) : "\u2014"}
          <span className="text-sm font-normal text-default-400">/s</span>
        </>
      ),
      iconBg: "bg-cyan-500",
      gradient:
        "from-cyan-50/80 to-sky-50/80 dark:from-cyan-950/30 dark:to-sky-950/30",
      textColor: "text-cyan-700 dark:text-cyan-300",
      borderColor: "border-cyan-200/50 dark:border-cyan-800/50",
    },
    {
      icon: <ClockIcon className="w-4 h-4" />,
      label: t("gui.elapsed_time"),
      value: formatTime(elapsedTime),
      iconBg: "bg-amber-500",
      gradient:
        "from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30",
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200/50 dark:border-amber-800/50",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Best server highlight */}
      {bestServer && (
        <Card className="border border-amber-200/60 dark:border-amber-700/40 bg-gradient-to-r from-amber-50/90 via-yellow-50/90 to-orange-50/90 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30 shadow-md">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30">
                  <StarIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {t("gui.best_server")}
                  </p>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    {bestServer[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {bestServer[1].geocode && (
                  <Chip size="sm" variant="flat" className="text-tiny">
                    {bestServer[1].geocode}
                  </Chip>
                )}
                <div className="text-right">
                  <p className="text-xs text-default-500">
                    {bestServer[1].latencyStats?.meanMs || 0}ms
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={getScoreColor(bestServer[1].score?.total || 0)}
                  variant="shadow"
                  className="font-bold"
                >
                  {(bestServer[1].score?.total || 0).toFixed(1)}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <Card
            key={i}
            className={`border ${c.borderColor} bg-gradient-to-br ${c.gradient} shadow-sm hover:shadow-md transition-shadow`}
          >
            <CardBody className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`${c.iconBg} text-white p-1 rounded-lg shadow-sm`}
                >
                  {c.icon}
                </div>
                <span className="text-xs text-default-500 font-medium">
                  {c.label}
                </span>
              </div>
              <p className={`text-xl font-bold ${c.textColor}`}>{c.value}</p>
              {c.extra}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
