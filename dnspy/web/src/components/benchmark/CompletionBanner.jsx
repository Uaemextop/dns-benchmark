import { useTranslation } from "react-i18next";
import { Card, CardBody, Button } from "@nextui-org/react";
import { MdCheckCircle as CheckCircleIcon } from "react-icons/md";

/**
 * Banner shown after a benchmark completes.
 */
export default function CompletionBanner({
  completed,
  deadCount,
  onSwitchToAnalyze,
}) {
  const { t } = useTranslation();

  return (
    <Card className="border-none bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-md">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">
                {t("gui.benchmark_done", { count: completed })}
              </p>
              {deadCount > 0 && (
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  {t("gui.dead_filtered", { count: deadCount })}
                </p>
              )}
            </div>
          </div>
          {onSwitchToAnalyze && (
            <Button
              size="sm"
              color="success"
              variant="flat"
              onClick={onSwitchToAnalyze}
            >
              {t("gui.view_analysis")} →
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
