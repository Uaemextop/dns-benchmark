import { useTranslation } from "react-i18next";
import { Card, CardBody, Progress, Chip } from "@nextui-org/react";
import { formatTime } from "./utils";

/**
 * Animated progress bar with real-time status during a benchmark.
 */
export default function ProgressBar({
  completed,
  total,
  currentServer,
  elapsedTime,
}) {
  const { t } = useTranslation();
  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-md">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-50" />
            </div>
            <span className="text-sm font-bold">{t("gui.running")}</span>
            <Chip size="sm" variant="flat" color="primary" className="font-mono text-tiny h-5">
              {completed}/{total}
            </Chip>
          </div>
          <span className="text-sm font-bold text-primary">
            {progressPercent}%
          </span>
        </div>
        <Progress
          aria-label="Benchmark progress"
          value={progressPercent}
          color="primary"
          className="max-w-full"
          size="md"
          classNames={{
            indicator: "bg-gradient-to-r from-blue-500 to-cyan-400",
          }}
        />
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          {currentServer && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-default-400">{t("gui.testing")}:</span>
              <Chip size="sm" variant="flat" color="primary" className="font-medium">
                {currentServer}
              </Chip>
            </div>
          )}
          {total > 0 && completed > 0 && (
            <Chip size="sm" variant="flat" className="text-tiny">
              ⏱ ~{formatTime(Math.round((elapsedTime / completed) * (total - completed)))}{" "}
              {t("gui.remaining")}
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
