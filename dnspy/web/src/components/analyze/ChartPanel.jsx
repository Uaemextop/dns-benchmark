import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Pagination,
} from "@nextui-org/react";
import { Bar } from "react-chartjs-2";
import { ITEMS_PER_PAGE } from "../../constants";

/**
 * Chart panel displaying bar charts for various benchmark metrics.
 * Supports pagination when the dataset exceeds ITEMS_PER_PAGE.
 */
export default function ChartPanel({
  selectedChart,
  setSelectedChart,
  chartData,
  filteredData,
  currentPage,
  setCurrentPage,
  options,
  selectedRegions,
}) {
  const { t } = useTranslation();

  const emptyChartData = {
    labels: [],
    datasets: [{ label: "", data: [], backgroundColor: "" }],
  };

  const totalPages = useMemo(() => {
    if (!chartData?.[selectedChart]?.labels) return 1;
    const totalItems = Object.keys(filteredData).length;
    return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  }, [filteredData, chartData, selectedChart]);

  const chartHeight = useMemo(() => {
    if (!chartData?.[selectedChart]?.labels?.length) return 200;
    const dataLength = chartData[selectedChart].labels.length;
    return Math.max(200, dataLength * 20 + 100);
  }, [chartData, selectedChart]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Tabs
        selectedKey={selectedChart}
        onSelectionChange={(key) => {
          setSelectedChart(String(key));
          setCurrentPage(1);
          setTimeout(() => {
            document.activeElement?.blur();
          }, 0);
        }}
        className="mb-2"
      >
        <Tab key="scores" title={t("score.scores")} />
        <Tab key="latencies" title={t("score.latencies")} />
        <Tab key="successRates" title={t("score.successRates")} />
        <Tab key="qps" title={t("score.qps")} />
      </Tabs>

      {selectedRegions.size > 0 ? (
        <Card className="flex-1">
          <CardHeader className="py-4">
            <div className="w-full flex justify-between items-center ml-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {t(`score.${selectedChart}`)}
                </div>
                <div className="text-sm text-default-500 italic">
                  {t(`score.desc_${selectedChart}`)}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-default-500">
                    <span className="px-3 py-1.5 bg-default-100 rounded-lg font-medium">
                      {t("tip.showing_limited_data", {
                        count: ITEMS_PER_PAGE,
                      })}
                    </span>
                    <span className="text-default-400">·</span>
                    <span className="px-3 py-1.5 bg-default-100 rounded-lg font-medium">
                      {t("tip.total_items", {
                        total: Object.keys(filteredData).length,
                      })}
                    </span>
                  </div>
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    size="sm"
                    showControls
                    variant="bordered"
                    classNames={{
                      wrapper: "gap-1.5",
                      item: "w-8 h-8 bg-default-50 hover:bg-default-100",
                    }}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody style={{ height: `${chartHeight}px` }}>
            <Bar
              options={{
                ...options,
                maintainAspectRatio: false,
                layout: {
                  padding: {
                    left: 20,
                    right: 30,
                    top: 20,
                    bottom: 20,
                  },
                },
              }}
              data={chartData?.[selectedChart] || emptyChartData}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="flex justify-center items-center p-8">
          <p>{t("tip.no_region_selected")}</p>
        </div>
      )}
    </div>
  );
}
