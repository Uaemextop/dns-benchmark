import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useFile } from "../../contexts/FileContext";
import { useDebounce } from "../../hooks/useDebounce";
import { SERVER_TYPES, ITEMS_PER_PAGE } from "../../constants";

/**
 * Custom hook that encapsulates all Analyze-view state and derived data.
 * Keeps the Analyze component focused on rendering.
 */
export function useAnalyze() {
  const { t } = useTranslation();
  const { file, jsonData } = useFile();
  const [selectedRegions, setSelectedRegions] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChart, setSelectedChart] = useState("scores");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [serverType, setServerType] = useState(SERVER_TYPES.ALL);

  // Initialise selected regions when data changes
  useEffect(() => {
    if (!jsonData) return;

    try {
      const regions = new Set();
      Object.values(jsonData).forEach((server) => {
        if (server?.geocode?.trim()) {
          regions.add(server.geocode);
        }
      });
      setSelectedRegions(regions);
    } catch (error) {
      console.error("Error processing jsonData:", error);
      toast.error(t("tip.data_load_failed"));
    }
  }, [jsonData, t]);

  // Compute available regions
  const availableRegions = useMemo(() => {
    if (!jsonData) return [];
    try {
      const regions = new Set();
      Object.values(jsonData).forEach((server) => {
        if (server?.geocode?.trim() && server?.score?.total > 0) {
          regions.add(server.geocode);
        }
      });
      return Array.from(regions);
    } catch (error) {
      console.error("Error getting available regions:", error);
      return [];
    }
  }, [jsonData]);

  const debouncedSelectedRegions = useDebounce(selectedRegions, 300);

  // Filtered data based on region + server type
  const filteredData = useMemo(() => {
    if (!jsonData) return {};
    try {
      return Object.fromEntries(
        Object.entries(jsonData).filter(([key, data]) => {
          const matchesRegion =
            data?.geocode &&
            debouncedSelectedRegions.has(data.geocode) &&
            data?.score?.total > 0;
          if (!matchesRegion) return false;
          if (serverType === SERVER_TYPES.ALL) return true;

          const url = (key || "").toLowerCase();

          switch (serverType) {
            case SERVER_TYPES.DoH:
              return (
                url.startsWith("https://") || url.includes("/dns-query")
              );
            case SERVER_TYPES.DoT:
              return url.startsWith("tls://") || url.endsWith(":853");
            case SERVER_TYPES.DoQ:
              return url.startsWith("quic://");
            case SERVER_TYPES.UDP:
              return (
                !url.startsWith("https://") &&
                !url.includes("/dns-query") &&
                !url.startsWith("tls://") &&
                !url.endsWith(":853") &&
                !url.startsWith("quic://")
              );
            default:
              return true;
          }
        })
      );
    } catch (error) {
      console.error("Error filtering data:", error);
      return {};
    }
  }, [jsonData, debouncedSelectedRegions, serverType]);

  // Chart data computation
  const chartData = useMemo(() => {
    const emptyChartData = {
      labels: [],
      datasets: [{ label: "", data: [], backgroundColor: "" }],
    };

    if (
      selectedRegions.size === 0 ||
      Object.keys(filteredData).length === 0
    )
      return emptyChartData;

    try {
      const filterAndSort = (labels, values, ascending = false) => {
        const filtered = labels
          .map((label, i) => ({ label, value: values[i] }))
          .filter((item) => item.value > 0)
          .sort((a, b) =>
            ascending ? a.value - b.value : b.value - a.value
          );

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedData = filtered.slice(startIndex, endIndex);

        return {
          labels: paginatedData.map((item) => item.label),
          values: paginatedData.map((item) => item.value),
        };
      };

      const labels = Object.keys(filteredData);
      const scores = labels.map(
        (server) => filteredData[server]?.score?.total ?? 0
      );
      const latencies = labels.map(
        (server) => filteredData[server]?.latencyStats?.meanMs ?? 0
      );
      const successRates = labels.map(
        (server) => filteredData[server]?.score?.successRate ?? 0
      );
      const qpsValues = labels.map(
        (server) => filteredData[server]?.queriesPerSecond ?? 0
      );

      const scoreData = filterAndSort(labels, scores);
      const latencyData = filterAndSort(labels, latencies, true);
      const successRateData = filterAndSort(labels, successRates);
      const qpsData = filterAndSort(labels, qpsValues);

      const getRandomColor = () => {
        const hue = Math.random() * 360;
        return `hsla(${hue}, 70%, 65%, 0.6)`;
      };

      return {
        scores: {
          labels: scoreData.labels,
          datasets: [
            {
              label: t("score.scores"),
              data: scoreData.values,
              backgroundColor: getRandomColor(),
            },
          ],
        },
        latencies: {
          labels: latencyData.labels,
          datasets: [
            {
              label: t("score.latencies"),
              data: latencyData.values,
              backgroundColor: getRandomColor(),
            },
          ],
        },
        successRates: {
          labels: successRateData.labels,
          datasets: [
            {
              label: t("score.successRates"),
              data: successRateData.values,
              backgroundColor: getRandomColor(),
            },
          ],
        },
        qps: {
          labels: qpsData.labels,
          datasets: [
            {
              label: t("score.qps"),
              data: qpsData.values,
              backgroundColor: getRandomColor(),
            },
          ],
        },
      };
    } catch (error) {
      console.error("Error generating chart data:", error);
      return emptyChartData;
    }
  }, [filteredData, selectedRegions, currentPage, t]);

  // Chart options
  const chartOptions = useMemo(
    () => ({
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          animation: { duration: 0 },
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw}`;
            },
          },
        },
      },
      responsive: true,
      indexAxis: "y",
      animation: { duration: 0 },
      onClick: (event, elements, chart) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const server = chart.data.labels[index];
          navigator.clipboard
            .writeText(server)
            .then(() => {
              toast.success(t("tip.copied"), {
                description: server,
                duration: 2000,
              });
            })
            .catch((error) => {
              console.error("Failed to copy:", error);
              toast.error(t("tip.copy_failed"));
            });
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ...(selectedChart === "latencies"
            ? {
                type: "logarithmic",
                min: 1,
                ticks: {
                  maxTicksLimit: 10,
                  callback: (value) => value + "ms",
                },
              }
            : selectedChart === "qps"
            ? {
                type: "logarithmic",
                min: 1,
                ticks: {
                  maxTicksLimit: 10,
                  callback: (value) => value.toLocaleString(),
                },
              }
            : {
                type: "linear",
                max: 100,
                ticks: { maxTicksLimit: 10 },
              }),
        },
        y: {
          beginAtZero: true,
          barThickness: (context) => {
            const dataLength = context.chart.data.labels.length;
            return Math.min(30, Math.max(15, 400 / dataLength));
          },
        },
      },
    }),
    [selectedChart, t]
  );

  // Region toggle handler
  const handleRegionToggle = (region, checked) => {
    const newSelected = new Set(selectedRegions);
    if (checked) {
      newSelected.add(region);
    } else {
      newSelected.delete(region);
    }
    setSelectedRegions(newSelected);
  };

  const handleSelectAll = (regions) => {
    setSelectedRegions(new Set(regions || availableRegions));
  };

  const handleClearAll = () => {
    setSelectedRegions(new Set());
  };

  return {
    file,
    jsonData,
    selectedRegions,
    searchQuery,
    setSearchQuery,
    selectedChart,
    setSelectedChart,
    currentPage,
    setCurrentPage,
    isFilterCollapsed,
    setIsFilterCollapsed,
    serverType,
    setServerType,
    availableRegions,
    filteredData,
    chartData,
    chartOptions,
    handleRegionToggle,
    handleSelectAll,
    handleClearAll,
  };
}
