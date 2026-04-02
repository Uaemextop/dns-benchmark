import { useTranslation } from "react-i18next";
import { Card, CardBody, Progress, Chip } from "@nextui-org/react";
import { formatTime } from "./utils";

/**
 * Animated progress bar shown while a benchmark is running.
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
    <Card className="border-none shadow-md">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{t("gui.running")}</span>
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
        />
        <div className="flex items-center justify-between mt-2">
          {currentServer && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-default-400">{t("gui.testing")}:</span>
              <Chip size="sm" variant="flat" color="primary">
                {currentServer}
              </Chip>
            </div>
          )}
          {total > 0 && completed > 0 && (
            <span className="text-xs text-default-400">
              ~
              {formatTime(
                Math.round((elapsedTime / completed) * (total - completed))
              )}{" "}
              {t("gui.remaining")}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
