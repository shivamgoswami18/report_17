"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import BaseDropdown from "../base/BaseDropdown";
import BaseButton from "../base/BaseButton";
import BaseCheckbox from "../base/BaseCheckbox";
import { ChevronDownIcon } from "@/assets/icons/CommonIcons";
import HierarchicalCheckboxGroup from "./HierarchicalCheckboxGroup";
import { useHierarchicalFilter } from "./useHierarchicalFilter";
import {
  SORT_OPTIONS,
  filterPrefixesConstants,
  sortValuesConstants,
  ParentItem,
} from "../constants/Projects";
import { commonLabels } from "../constants/Common";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppSelector } from "@/lib/store/hooks";
import type { UserProfile } from "@/lib/store/slices/userSlice";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const transformCategoriesToServices = (
  categories?: UserProfile["category"]
): ParentItem[] => {
  if (!categories || categories?.length === 0) {
    return [];
  }

  return categories?.map((category) => ({
    id: category?._id,
    name: category?.name,
    children: (category?.type_of_work ?? [])?.map((work) => ({
      id: work?._id,
      name: work?.name,
    })),
  }));
};

const transformCountiesToLocationStates = (
  counties?: UserProfile["county"]
): ParentItem[] => {
  if (!counties || counties?.length === 0) {
    return [];
  }

  return counties?.map((county) => ({
    id: county?.county_id,
    name: county?.county_name,
    children: (county?.municipalities ?? [])
      ?.filter((municipality) => municipality?.is_active)
      ?.map((municipality) => ({
        id: municipality?.municipality_id,
        name: municipality?.municipality_name,
      })),
  }));
};

export interface ProjectFilterParams {
  serviceParents: string[];
  serviceChildren: string[];
  locationParents: string[];
  locationChildren: string[];
  budgetRange: string;
  sort: string;
  status?: string;
}

interface ProjectsFilterSectionProps {
  onFilterChange?: (filters: ProjectFilterParams) => void;
  disabled?: boolean;
}

const ProjectsFilterSection = ({
  onFilterChange,
  disabled = false,
}: ProjectsFilterSectionProps) => {
  const profileData = useAppSelector((state) => state?.user?.profile);

  const servicesData = useMemo(() => {
    return transformCategoriesToServices(profileData?.category);
  }, [profileData?.category]);

  const locationData = useMemo(() => {
    return transformCountiesToLocationStates(profileData?.county);
  }, [profileData?.county]);

  const serviceFilter = useHierarchicalFilter(servicesData);
  const locationFilter = useHierarchicalFilter(locationData);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>(
    sortValuesConstants.newest
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const filterValues = useMemo<ProjectFilterParams>(
    () => ({
      serviceParents: Array.from(serviceFilter.selectedParents),
      serviceChildren: Array.from(serviceFilter.selectedChildren),
      locationParents: Array.from(locationFilter.selectedParents),
      locationChildren: Array.from(locationFilter.selectedChildren),
      budgetRange: selectedBudgetRange,
      sort: selectedSort,
      ...(selectedStatus ? { status: selectedStatus } : {}),
    }),
    [
      serviceFilter.selectedParents,
      serviceFilter.selectedChildren,
      locationFilter.selectedParents,
      locationFilter.selectedChildren,
      selectedBudgetRange,
      selectedSort,
      selectedStatus,
    ]
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleFilterSubmit = useCallback(
    (filters: ProjectFilterParams) => {
      if (onFilterChange) {
        onFilterChange(filters);
      }
    },
    [onFilterChange]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleFilterSubmit(filterValues);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filterValues, handleFilterSubmit]);

  const handleResetAll = () => {
    serviceFilter.reset();
    locationFilter.reset();
    setSelectedBudgetRange("");
    setSelectedSort(sortValuesConstants.newest);
    setSelectedStatus("");
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(selectedStatus === status ? "" : status);
  };

  const getStatusLabelClassName = useCallback((statusValue: string) => {
    const baseClasses = "flex items-center text-textBase font-light xl:leading-[100%] xl:tracking-[0px]";
    const colorClass = selectedStatus === statusValue ? "text-deepTeal" : "text-obsidianBlack";
    return `${baseClasses} ${colorClass}`;
  }, [selectedStatus]);

  const getStatusCheckboxClassName = useCallback((statusValue: string) => {
    return selectedStatus === statusValue
      ? "[&_.p-checkbox-box]:bg-deepTeal [&_.p-checkbox-box]:border-deepTeal"
      : "";
  }, [selectedStatus]);

  return (
    <div className="w-full bg-white rounded-[16px] border border-lightGrayGamma px-[10px] py-[10px] sm:px-[16px] sm:py-[14px]">
      <div
        className={`flex items-center justify-between transition-all duration-300 ${
          isExpanded ? "mb-[24px]" : "mb-0"
        } md:mb-[24px]`}
      >
        <BaseButton
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-[8px] cursor-pointer md:cursor-default bg-transparent border-none p-0 text-left hover:bg-transparent focus:bg-transparent focus:outline-none active:bg-transparent"
        >
          <h2 className="text-obsidianBlack text-textBase font-light xl:leading-[100%] xl:tracking-[0px]">
            {t("projectsPageConstants.filters")}
          </h2>
          <div className="md:hidden flex justify-center items-center">
            {isExpanded ? (
              <ChevronDownIcon className="rotate-180 w-[16px] h-[16px] text-obsidianBlack" />
            ) : (
              <ChevronDownIcon className="w-[16px] h-[16px] text-obsidianBlack" />
            )}
          </div>
        </BaseButton>
        {isExpanded && (
          <BaseButton
            onClick={handleResetAll}
            disabled={disabled}
            className="bg-transparent border-none text-obsidianBlack text-textBase font-light xl:leading-[100%] xl:tracking-[0px]"
            label={t("projectsPageConstants.resetAll")}
          />
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:transition-none ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } md:max-h-none md:opacity-100 md:block`}
      >
        <div>
          <HierarchicalCheckboxGroup
            label={t("projectsPageConstants.service")}
            items={servicesData}
            selectedParents={serviceFilter.selectedParents}
            selectedChildren={serviceFilter.selectedChildren}
            onParentChange={serviceFilter.handleParentChange}
            onChildChange={serviceFilter.handleChildChange}
            parentNamePrefix={filterPrefixesConstants.service.parentNamePrefix}
            childNamePrefix={filterPrefixesConstants.service.childNamePrefix}
            disabled={disabled}
          />
        </div>

        <div className="my-[30px]">
          <HierarchicalCheckboxGroup
            label={t("projectsPageConstants.location")}
            items={locationData}
            selectedParents={locationFilter.selectedParents}
            selectedChildren={locationFilter.selectedChildren}
            onParentChange={locationFilter.handleParentChange}
            onChildChange={locationFilter.handleChildChange}
            parentNamePrefix={filterPrefixesConstants.location.parentNamePrefix}
            childNamePrefix={filterPrefixesConstants.location.childNamePrefix}
            disabled={disabled}
          />
        </div>

        {/* Temporarily commented out budget range filter */}
        {/* <div className="mb-[24px]">
          <div className="text-obsidianBlack text-textSm text-opacity-40 font-light mb-[12px] xl:leading-[100%] xl:tracking-[0px]">
            {t("projectsPageConstants.budgetRange")}
          </div>
          <div className="space-y-[10px]">
            {BUDGET_RANGES?.map((range) => {
              const isSelected = selectedBudgetRange === range?.id;
              return (
                <BaseCheckbox
                  key={range?.id}
                  name={`${filterPrefixesConstants.budget.prefix}${range?.id}`}
                  checked={isSelected}
                  onChange={() => handleBudgetRangeChange(range?.id)}
                  label={range?.label}
                  disabled={disabled}
                  labelClassName={`flex items-center text-textBase font-light xl:leading-[100%] xl:tracking-[0px] ${
                    isSelected ? "text-deepTeal" : "text-obsidianBlack"
                  }`}
                  checkboxClassName={
                    isSelected
                      ? "[&_.p-checkbox-box]:bg-deepTeal [&_.p-checkbox-box]:border-deepTeal"
                      : ""
                  }
                />
              );
            })}
          </div>
        </div> */}

        <div className="mb-[24px]">
          <div className="text-obsidianBlack text-textSm text-opacity-40 font-light mb-[12px] xl:leading-[100%] xl:tracking-[0px]">
            {t("myOffersConstants.status")}
          </div>
          <div className="space-y-[10px]">
            <BaseCheckbox
              name="status-applied"
              checked={selectedStatus === commonLabels.appliedValue}
              onChange={() => handleStatusChange(commonLabels.appliedValue)}
              label={t("projectDetailsPageConstants.applied")}
              disabled={disabled}
              labelClassName={getStatusLabelClassName(commonLabels.appliedValue)}
              checkboxClassName={getStatusCheckboxClassName(commonLabels.appliedValue)}
            />
            <BaseCheckbox
              name="status-yet-to-view"
              checked={selectedStatus === commonLabels.publishedValue}
              onChange={() => handleStatusChange(commonLabels.publishedValue)}
              label={t("projectsPageConstants.yetToView")}
              disabled={disabled}
              labelClassName={getStatusLabelClassName(commonLabels.publishedValue)}
              checkboxClassName={getStatusCheckboxClassName(commonLabels.publishedValue)}
            />
          </div>
        </div>

        <div>
          <BaseDropdown
            label={t("projectsPageConstants.sortBy")}
            name="sort"
            value={selectedSort}
            onChange={setSelectedSort}
            options={SORT_OPTIONS}
            placeholder={t("projectsPageConstants.newestFirst")}
            fullWidth
            disabled={disabled}
            labelClassName="text-obsidianBlack text-textSm text-opacity-40 font-light mb-[12px] xl:leading-[100%] xl:tracking-[0px]"
            endIcon={
              <ChevronDownIcon className="w-[16px] h-[16px] text-obsidianBlack" />
            }
            className="py-[11px] px-[12px]"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsFilterSection;
