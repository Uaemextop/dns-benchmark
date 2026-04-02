import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@nextui-org/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from "chart.js";
import { Toaster } from "sonner";
import { IoIosArrowUp as ArrowUpIcon } from "react-icons/io";

import { FilterPanel, ChartPanel, useAnalyze } from "./analyze";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Analyze view — thin orchestrator that delegates to FilterPanel and ChartPanel.
 * All data logic lives in the useAnalyze hook.
 */
export default function Analyze() {
  const { t } = useTranslation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const analyze = useAnalyze();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!analyze.file && !analyze.jsonData) {
    return (
      <div id="analyze" className="p-4 flex justify-center">
        <Card isBlurred>
          <CardBody className="text-center">
            <p>{t("tip.please_upload_file")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div id="analyze" className="p-4 flex flex-col gap-4">
      <Toaster position="top-center" expand={false} richColors />
      <div className="flex flex-col md:flex-row gap-4">
        <FilterPanel
          serverType={analyze.serverType}
          setServerType={analyze.setServerType}
          selectedRegions={analyze.selectedRegions}
          onRegionToggle={analyze.handleRegionToggle}
          onSelectAll={analyze.handleSelectAll}
          onClearAll={analyze.handleClearAll}
          availableRegions={analyze.availableRegions}
          searchQuery={analyze.searchQuery}
          setSearchQuery={analyze.setSearchQuery}
          isCollapsed={analyze.isFilterCollapsed}
          onToggleCollapse={() =>
            analyze.setIsFilterCollapsed(!analyze.isFilterCollapsed)
          }
        />

        <ChartPanel
          selectedChart={analyze.selectedChart}
          setSelectedChart={analyze.setSelectedChart}
          chartData={analyze.chartData}
          filteredData={analyze.filteredData}
          currentPage={analyze.currentPage}
          setCurrentPage={analyze.setCurrentPage}
          options={analyze.chartOptions}
          selectedRegions={analyze.selectedRegions}
        />
      </div>

      {/* Scroll to top button */}
      <button
        onClick={handleScrollToTop}
        className={`fixed bottom-4 right-4 p-2 bg-default-100 rounded-full hover:bg-default-200 transition-all z-10 shadow-lg ${
          showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label={t("tip.back_to_top")}
      >
        <ArrowUpIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
