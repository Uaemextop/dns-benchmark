import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  ScrollShadow,
  Chip,
  Button,
} from "@nextui-org/react";
import {
  FaHistory as HistoryIcon,
  FaChevronDown as ChevronDownIcon,
  FaChevronUp as ChevronUpIcon,
} from "react-icons/fa";
import { fetchHistory } from "../../services/api";
import { formatTime } from "./utils";

/**
 * Collapsible panel showing past benchmark runs.
 * Fetches from the backend history API on mount and when a benchmark completes.
 */
export default function HistoryPanel({ onLoadHistory }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (history.length === 0 && !loading) return null;

  return (
    <Card className="border border-default-200/50 shadow-sm">
      <CardHeader
        className="py-2 px-4 cursor-pointer hover:bg-default-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-default-100">
              <HistoryIcon className="w-3.5 h-3.5 text-default-500" />
            </div>
            <span className="text-sm font-semibold">{t("gui.history")}</span>
            <Chip size="sm" variant="flat" className="text-tiny">
              {history.length}
            </Chip>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-3 h-3 text-default-400" />
          ) : (
            <ChevronDownIcon className="w-3 h-3 text-default-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardBody className="pt-0 pb-3 px-4">
          <ScrollShadow className="max-h-[200px]">
            <div className="flex flex-col gap-2">
              {history.length === 0 ? (
                <p className="text-sm text-default-400 text-center py-4">
                  {t("gui.no_history")}
                </p>
              ) : (
                history
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {new Date(entry.startedAt).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Chip
                              size="sm"
                              variant="flat"
                              className="text-tiny h-4"
                            >
                              {entry.servers} {t("gui.history_servers")}
                            </Chip>
                            {entry.duration > 0 && (
                              <Chip
                                size="sm"
                                variant="flat"
                                className="text-tiny h-4"
                              >
                                {entry.duration}s {t("gui.history_duration")}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                      {onLoadHistory && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="text-tiny min-w-0 h-7"
                          onPress={() => onLoadHistory(entry.results)}
                        >
                          {t("gui.history_view")}
                        </Button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </ScrollShadow>
        </CardBody>
      )}
    </Card>
  );
}
