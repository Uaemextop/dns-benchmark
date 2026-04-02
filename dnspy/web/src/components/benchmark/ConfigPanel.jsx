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
} from "@nextui-org/react";
import {
  FaPlay as PlayIcon,
  FaStop as StopIcon,
  FaServer as ServerIcon,
} from "react-icons/fa";

/**
 * Configuration form for benchmark parameters.
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
    <Card className="lg:w-[360px] flex-shrink-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ServerIcon className="w-4 h-4 text-primary" />
          <span className="font-semibold">{t("gui.configuration")}</span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 pt-0">
        {/* Built-in servers toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {t("gui.use_builtin_servers")}
            </p>
            <p className="text-xs text-default-400">
              {t("gui.use_builtin_servers_desc")}
            </p>
          </div>
          <Switch
            isSelected={useBuiltin}
            onValueChange={setUseBuiltin}
            size="sm"
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
        />

        <Divider />

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">{t("gui.duration")}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-default-400">
                {t("gui.unlimited")}
              </span>
              <Switch
                isSelected={isUnlimited}
                onValueChange={setIsUnlimited}
                size="sm"
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
            <p className="text-xs text-warning-500 mt-1">
              {t("gui.unlimited_hint")}
            </p>
          )}
        </div>

        {/* Concurrency */}
        <Slider
          label={t("gui.concurrency")}
          step={1}
          minValue={1}
          maxValue={50}
          value={concurrency}
          onChange={setConcurrency}
          className="max-w-full"
          size="sm"
          isDisabled={isRunning}
          marks={[
            { value: 1, label: "1" },
            { value: 10, label: "10" },
            { value: 25, label: "25" },
            { value: 50, label: "50" },
          ]}
        />

        {/* Workers */}
        <Slider
          label={t("gui.workers")}
          step={1}
          minValue={1}
          maxValue={50}
          value={workers}
          onChange={setWorkers}
          className="max-w-full"
          size="sm"
          isDisabled={isRunning}
          marks={[
            { value: 1, label: "1" },
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 50, label: "50" },
          ]}
        />

        {/* No AAAA toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("gui.no_aaaa")}</p>
            <p className="text-xs text-default-400">{t("gui.no_aaaa_desc")}</p>
          </div>
          <Switch
            isSelected={noAAAA}
            onValueChange={setNoAAAA}
            size="sm"
            isDisabled={isRunning}
          />
        </div>

        <Divider />

        {/* Start / Stop button */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              color="primary"
              variant="shadow"
              startContent={<PlayIcon />}
              onClick={onStart}
              className="flex-1 font-semibold"
              size="lg"
            >
              {t("gui.start_benchmark")}
            </Button>
          ) : (
            <Button
              color="danger"
              variant="shadow"
              startContent={<StopIcon />}
              onClick={onStop}
              className="flex-1 font-semibold"
              size="lg"
            >
              {t("gui.stop_benchmark")}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
