import { useTranslation } from "react-i18next";
import { Card, CardBody, Button, Chip } from "@nextui-org/react";
import {
  MdCheckCircle as CheckCircleIcon,
} from "react-icons/md";
import { FaTrophy as TrophyIcon } from "react-icons/fa";
import { getScoreColor } from "./utils";

/**
 * Banner shown after a benchmark completes, highlighting best server.
 */
export default function CompletionBanner({
  completed,
  deadCount,
  bestServer,
  onSwitchToAnalyze,
}) {
  const { t } = useTranslation();

  return (
    <Card className="border border-emerald-200/60 dark:border-emerald-700/40 bg-gradient-to-r from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/30 shadow-lg">
      <CardBody className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md shadow-emerald-500/30">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">
                {t("gui.benchmark_done", { count: completed })}
              </p>
              {deadCount > 0 && (
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  {t("gui.dead_filtered", { count: deadCount })}
                </p>
              )}
              {bestServer && (
                <div className="flex items-center gap-2 mt-1">
                  <TrophyIcon className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    {bestServer[0]}
                  </span>
                  <Chip
                    size="sm"
                    color={getScoreColor(bestServer[1].score?.total || 0)}
                    variant="flat"
                    className="font-bold h-4 text-tiny"
                  >
                    {(bestServer[1].score?.total || 0).toFixed(1)}
                  </Chip>
                </div>
              )}
            </div>
          </div>
          {onSwitchToAnalyze && (
            <Button
              size="sm"
              color="success"
              variant="shadow"
              onClick={onSwitchToAnalyze}
              className="font-semibold"
            >
              {t("gui.view_analysis")} →
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
