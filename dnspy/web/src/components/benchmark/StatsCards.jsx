import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@nextui-org/react";
import {
  FaServer as ServerIcon,
  FaClock as ClockIcon,
} from "react-icons/fa";
import {
  MdSpeed as SpeedIcon,
  MdTimelapse as TimelapseIcon,
  MdCheckCircle as CheckCircleIcon,
} from "react-icons/md";
import { formatTime } from "./utils";

/**
 * Five live-updating stat cards shown during / after a benchmark.
 */
export default function StatsCards({
  completed,
  total,
  deadCount,
  avgLatency,
  avgSuccessRate,
  avgQPS,
  elapsedTime,
}) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: <ServerIcon className="w-3.5 h-3.5 text-blue-500" />,
      label: t("gui.servers_tested"),
      value: (
        <>
          {completed}
          <span className="text-sm font-normal text-default-400">/{total}</span>
        </>
      ),
      extra:
        deadCount > 0 ? (
          <p className="text-tiny text-default-400">
            {deadCount} {t("gui.dead_servers")}
          </p>
        ) : null,
      gradient:
        "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <TimelapseIcon className="w-3.5 h-3.5 text-green-500" />,
      label: t("gui.avg_latency"),
      value: (
        <>
          {avgLatency > 0 ? avgLatency.toFixed(0) : "\u2014"}
          <span className="text-sm font-normal text-default-400">ms</span>
        </>
      ),
      gradient:
        "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: <CheckCircleIcon className="w-3.5 h-3.5 text-purple-500" />,
      label: t("gui.avg_success"),
      value: (
        <>
          {avgSuccessRate > 0 ? avgSuccessRate.toFixed(1) : "\u2014"}
          <span className="text-sm font-normal text-default-400">%</span>
        </>
      ),
      gradient:
        "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: <SpeedIcon className="w-3.5 h-3.5 text-cyan-500" />,
      label: t("gui.avg_qps"),
      value: (
        <>
          {avgQPS > 0 ? avgQPS.toFixed(0) : "\u2014"}
          <span className="text-sm font-normal text-default-400">/s</span>
        </>
      ),
      gradient:
        "from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: <ClockIcon className="w-3.5 h-3.5 text-orange-500" />,
      label: t("gui.elapsed_time"),
      value: formatTime(elapsedTime),
      gradient:
        "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      textColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <Card
          key={i}
          className={`border-none bg-gradient-to-br ${c.gradient}`}
        >
          <CardBody className="p-3">
            <div className="flex items-center gap-2">
              {c.icon}
              <span className="text-xs text-default-500">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${c.textColor} mt-1`}>
              {c.value}
            </p>
            {c.extra}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
