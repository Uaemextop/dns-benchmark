import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Textarea,
  Switch,
  Slider,
  Divider,
  Button,
  Chip,
} from "@nextui-org/react";
import {
  FaPlay as PlayIcon,
  FaStop as StopIcon,
  FaCog as CogIcon,
} from "react-icons/fa";

/**
 * Configuration form for benchmark parameters with improved design.
 */
export default function ConfigPanel({
  isRunning,
  servers,
  setServers,
  useBuiltin,
  setUseBuiltin,
  duration,
  setDuration,
  isUnlimited,
  setIsUnlimited,
  concurrency,
  setConcurrency,
  workers,
  setWorkers,
  noAAAA,
  setNoAAAA,
  onStart,
  onStop,
}) {
  const { t } = useTranslation();

  return (
    <Card className="lg:w-[380px] flex-shrink-0 shadow-lg border-none">
      <CardHeader className="pb-2 px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <CogIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-base">
            {t("gui.configuration")}
          </span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-5 pt-1 px-5 pb-5">
        {/* Built-in servers toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-default-50 dark:bg-default-100/5">
          <div>
            <p className="text-sm font-semibold">
              {t("gui.use_builtin_servers")}
            </p>
            <p className="text-xs text-default-400 mt-0.5">
              {t("gui.use_builtin_servers_desc")}
            </p>
          </div>
          <Switch
            isSelected={useBuiltin}
            onValueChange={setUseBuiltin}
            size="sm"
            color="primary"
            isDisabled={isRunning}
          />
        </div>

        {/* Custom servers textarea */}
        <Textarea
          label={t("gui.custom_servers")}
          placeholder={t("gui.custom_servers_placeholder")}
          value={servers}
          onValueChange={setServers}
          minRows={3}
          maxRows={5}
          description={t("gui.custom_servers_desc")}
          isDisabled={isRunning}
          size="sm"
          classNames={{
            inputWrapper:
              "bg-default-100 dark:bg-default-50/10 hover:bg-default-200 shadow-none",
          }}
        />

        <Divider className="my-0" />

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{t("gui.duration")}</span>
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                variant="flat"
                color={isUnlimited ? "warning" : "default"}
                className="text-tiny"
              >
                {isUnlimited ? "∞" : `${duration}s`}
              </Chip>
              <Switch
                isSelected={isUnlimited}
                onValueChange={setIsUnlimited}
                size="sm"
                color="warning"
                isDisabled={isRunning}
              />
            </div>
          </div>
          {!isUnlimited ? (
            <Slider
              step={1}
              minValue={5}
              maxValue={120}
              value={duration}
              onChange={setDuration}
              className="max-w-full"
              size="sm"
              color="primary"
              isDisabled={isRunning}
              showSteps={false}
              marks={[
                { value: 5, label: "5s" },
                { value: 10, label: "10s" },
                { value: 30, label: "30s" },
                { value: 60, label: "1m" },
                { value: 120, label: "2m" },
              ]}
            />
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200/50 dark:border-warning-700/30">
              <span className="text-xs text-warning-600 dark:text-warning-400">
                ⚠️ {t("gui.unlimited_hint")}
              </span>
            </div>
          )}
        </div>

        {/* Concurrency */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">
              {t("gui.concurrency")}
            </span>
            <Chip size="sm" variant="flat" className="text-tiny">
              {concurrency}
            </Chip>
          </div>
          <Slider
            step={1}
            minValue={1}
            maxValue={50}
            value={concurrency}
            onChange={setConcurrency}
            className="max-w-full"
            size="sm"
            color="secondary"
            isDisabled={isRunning}
            marks={[
              { value: 1, label: "1" },
              { value: 10, label: "10" },
              { value: 25, label: "25" },
              { value: 50, label: "50" },
            ]}
          />
        </div>

        {/* Workers */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{t("gui.workers")}</span>
            <Chip size="sm" variant="flat" className="text-tiny">
              {workers}
            </Chip>
          </div>
          <Slider
            step={1}
            minValue={1}
            maxValue={50}
            value={workers}
            onChange={setWorkers}
            className="max-w-full"
            size="sm"
            color="success"
            isDisabled={isRunning}
            marks={[
              { value: 1, label: "1" },
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 50, label: "50" },
            ]}
          />
        </div>

        {/* No AAAA toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-default-50 dark:bg-default-100/5">
          <div>
            <p className="text-sm font-semibold">{t("gui.no_aaaa")}</p>
            <p className="text-xs text-default-400 mt-0.5">
              {t("gui.no_aaaa_desc")}
            </p>
          </div>
          <Switch
            isSelected={noAAAA}
            onValueChange={setNoAAAA}
            size="sm"
            isDisabled={isRunning}
          />
        </div>

        <Divider className="my-0" />

        {/* Start / Stop button */}
        {!isRunning ? (
          <Button
            color="primary"
            variant="shadow"
            startContent={<PlayIcon className="w-3.5 h-3.5" />}
            onClick={onStart}
            className="font-bold text-base h-12"
            size="lg"
            fullWidth
          >
            {t("gui.start_benchmark")}
          </Button>
        ) : (
          <Button
            color="danger"
            variant="shadow"
            startContent={<StopIcon className="w-3.5 h-3.5" />}
            onClick={onStop}
            className="font-bold text-base h-12"
            size="lg"
            fullWidth
          >
            {t("gui.stop_benchmark")}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
