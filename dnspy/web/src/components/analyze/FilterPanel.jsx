import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  ScrollShadow,
  Chip,
  Divider,
} from "@nextui-org/react";
import {
  FaSearch as SearchIcon,
} from "react-icons/fa";
import {
  IoIosArrowDown as CollapseIcon,
} from "react-icons/io";
import { SERVER_TYPES, REGION_GROUPS } from "../../constants";

/**
 * Left sidebar filter panel for the Analyze view.
 * Handles server type filtering, region quick-filters, and manual region selection.
 */
export default function FilterPanel({
  serverType,
  setServerType,
  selectedRegions,
  onRegionToggle,
  onSelectAll,
  onClearAll,
  availableRegions,
  searchQuery,
  setSearchQuery,
  isCollapsed,
  onToggleCollapse,
}) {
  const { t } = useTranslation();

  const filteredRegions = useMemo(
    () =>
      availableRegions.filter((region) =>
        region.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [availableRegions, searchQuery]
  );

  return (
    <Card
      className={`w-full md:w-[180px] shrink-0 transition-all duration-300 h-fit ${
        isCollapsed ? "h-[52px] overflow-hidden" : ""
      }`}
    >
      <CardHeader
        className="font-medium text-lg px-2 py-2 cursor-pointer hover:bg-default-100"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="w-4 h-4 m-2" />
          {t("tip.filters")}
        </div>
        <CollapseIcon
          className={`w-4 h-4 ml-auto transition-transform ${
            isCollapsed ? "rotate-0" : "rotate-180"
          }`}
        />
      </CardHeader>
      <CardBody
        className={`px-2 py-2 flex flex-col relative transition-all duration-300 ${
          isCollapsed
            ? "max-h-0 p-0 overflow-hidden opacity-0"
            : "max-h-[2000px]"
        }`}
      >
        {/* Server type chips */}
        <div className="text-sm text-default-500 mb-2">
          {t("tip.server_type")}
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {Object.values(SERVER_TYPES).map((type) => (
            <Chip
              key={type}
              variant={serverType === type ? "solid" : "flat"}
              color={serverType === type ? "primary" : "default"}
              className="cursor-pointer"
              onClick={() => setServerType(type)}
            >
              {type.toUpperCase()}
            </Chip>
          ))}
        </div>

        {/* Quick filter by region group */}
        <div className="text-sm text-default-500 mb-2">
          {t("tip.quick_filter")}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.entries(REGION_GROUPS).map(([key, group]) => (
            <Chip
              key={key}
              variant="flat"
              color="default"
              className="cursor-pointer"
              onClick={() => {
                const regions = availableRegions.filter(
                  (r) =>
                    group.regions.some((code) =>
                      r.toUpperCase().includes(code)
                    ) ||
                    REGION_GROUPS.GLOBAL.regions.some((code) =>
                      r.toUpperCase().includes(code)
                    )
                );
                onSelectAll(regions);
              }}
            >
              {t(`region.${key.toLowerCase()}`)}
            </Chip>
          ))}
        </div>
        <Divider className="my-2 mb-4" />

        {/* Manual region selection */}
        <div className="text-sm text-default-500 mb-2">
          {t("tip.manual_select")}
        </div>

        <Input
          placeholder={t("tip.search_region")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4" />}
          className="w-full mb-4"
        />
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => onSelectAll(availableRegions)}
            className="flex-1 px-1.5 py-1 text-sm bg-primary text-white rounded-lg"
          >
            {t("button.select_all")}
          </button>
          <button
            onClick={onClearAll}
            className="flex-1 px-1.5 py-1 text-sm bg-default-100 text-default-700 rounded-lg"
          >
            {t("button.clear_all")}
          </button>
        </div>
        <Divider className="my-2 mb-4" />

        <ScrollShadow id="region-scroll-container" className="flex-1">
          <div className="flex flex-wrap gap-1">
            {filteredRegions.map((region) => (
              <Chip
                key={region}
                variant={selectedRegions.has(region) ? "solid" : "flat"}
                color={selectedRegions.has(region) ? "primary" : "default"}
                className="cursor-pointer"
                onClick={() =>
                  onRegionToggle(region, !selectedRegions.has(region))
                }
              >
                {region}
              </Chip>
            ))}
          </div>
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
