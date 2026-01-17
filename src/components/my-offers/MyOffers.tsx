"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import BaseTable, { ColumnConfig } from "../base/BaseTable";
import BaseTabs from "../base/BaseTab";
import { BaseSkeletonTable } from "../base/BaseSkeleton";
import { fetchOffers } from "@/lib/store/slices/myOffersSlice";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { OfferData } from "@/types/offers";
import { selectHasSubscription } from "@/lib/store/slices/authSlice";
import SubscriptionRequiredFallback from "../common/SubscriptionRequiredFallback";
import PaginationInfo from "../common/PaginationInfo";
import { commonLabels, getOfferStatusClasses, formatStatusLabel } from "../constants/Common";
import { EyeIcon } from "@/assets/icons/CommonIcons";
import ProjectDetailsModal from "../project/ProjectDetailsModal";
import { ProjectCardProps } from "@/types/project";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const MyOffers = () => {
  const dispatch = useAppDispatch();
  const hasSubscription = useAppSelector(selectHasSubscription);
  const { offers, loading, totalCount, currentPage } = useAppSelector(
    (state) => state.offers
  );

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("_id");
  const [sortValue, setSortValue] = useState<"asc" | "desc">("desc");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectCardProps | null>(null);
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);

  const tabConfigs = useMemo(
    () => [
      { label: t("myOffersConstants.all"), value: "all" },
      { label: t("myOffersConstants.assigned"), value: "assigned" },
      { label: t("myOffersConstants.pending"), value: "pending" },
      { label: t("myOffersConstants.rejected"), value: "rejected" },
      { label: t("myOffersConstants.completed"), value: "completed" },
      { label: t("myOffersConstants.cancelled"), value: "cancelled" },
    ],
    []
  );

  const tabs = useMemo(() => tabConfigs?.map((tab) => tab.label), [tabConfigs]);

  const fetchData = useCallback(() => {
    // Skip if we're in the middle of a load more operation
    if (isLoadingMoreRef.current) {
      return;
    }

    const currentTab = tabConfigs[activeTabIndex]?.value ?? "all";
    const status = currentTab === "all" ? undefined : currentTab;

    dispatch(
      fetchOffers({
        sortKey,
        sortValue,
        page,
        limit,
        search,
        status,
      })
    );
  }, [
    dispatch,
    activeTabIndex,
    page,
    limit,
    search,
    sortKey,
    sortValue,
    tabConfigs,
  ]);

  useEffect(() => {
    if (hasSubscription) {
      fetchData();
    }
  }, [fetchData, hasSubscription]);

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    setPage(1);
    // setLimit(10);
  };

  const handleViewProject = (offer: OfferData) => {
    const projectIdentifier = offer.projectId;
    if (!projectIdentifier) return;

    setSelectedProject({ _id: projectIdentifier });
    setIsProjectModalVisible(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalVisible(false);
    setSelectedProject(null);
  };

  // const handlePageChange = (first: number, rows: number) => {
  //   setPage(Math.floor(first / rows) + 1);
  //   setLimit(rows);
  // };

  const handleSearchChange = (searchText: string) => {
    setSearch(searchText);
    setPage(1);
    // setLimit(10);
  };

  const handleSortChange = (field: string, order: 1 | -1 | 0) => {
    const fieldMap: Record<string, string> = {
      projectName: "project_title",
      customer: "customer_name",
      offerPrice: "amount",
      status: "status",
      date: "createdAt",
    };

    const apiField = fieldMap[field] || field;

    if (order === 0) {
      setSortKey("_id");
      setSortValue("desc");
    } else {
      setSortKey(apiField);
      setSortValue(order === 1 ? "asc" : "desc");
    }
    setPage(1);
  };

  const fetchMoreOffers = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    isLoadingMoreRef.current = true;

    const newLimit = limit + 10;
    try {
      const currentTab = tabConfigs[activeTabIndex]?.value ?? "all";
      const status = currentTab === "all" ? undefined : currentTab;

      await dispatch(
        fetchOffers({
          sortKey,
          sortValue,
          page: 1,
          limit: newLimit,
          search,
          status,
        })
      );
      setLimit(newLimit);
    } finally {
      setIsLoadingMore(false);
      // Reset the ref after a small delay to ensure state update completes
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 100);
    }
  };

  const getStatusBadge = (status: OfferData["status"]) => {
    const classes = getOfferStatusClasses(status);

    return (
      <span
        className={`px-3 py-1 rounded-full text-textBase font-textBase ${classes}`}
      >
        {formatStatusLabel(status)}
      </span>
    );
  };
  const getCellValue = (
    value: string,
    fallback: string = commonLabels.noDataDash
  ) => {
    return value || fallback;
  };

  const columns: ColumnConfig<OfferData>[] = [
    {
      field: "projectName",
      header: t("myOffersConstants.projectName"),
      sortable: false,
      body: (rowData) => getCellValue(rowData.projectName),
    },
    {
      field: "customer",
      header: t("myOffersConstants.customer"),
      sortable: false,
      body: (rowData) => getCellValue(rowData.customer),
    },
    {
      field: "offerPrice",
      header: t("myOffersConstants.offerPrice"),
      sortable: false,
      body: (rowData) => getCellValue(rowData.offerPrice),
    },
    {
      field: "status",
      header: t("myOffersConstants.status"),
      sortable: false,
      body: (rowData) => getStatusBadge(rowData.status),
    },
    {
      field: "date",
      header: t("myOffersConstants.date"),
      sortable: false,
      body: (rowData) => getCellValue(rowData.date),
    },
    {
      field: "actions",
      header: t("myOffersConstants.actions"),
      sortable: false,
      body: (rowData) => (
        <div className="flex items-center justify-center">
          <div className="relative inline-flex items-center group">
            <EyeIcon
              className="cursor-pointer"
              onClick={() => handleViewProject(rowData)}
            />
            <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-obsidianBlack px-2 py-1 text-[14px] font-light text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
              {t("myOffersConstants.view")}
            </span>
          </div>
        </div>
      ),
    },
  ];

  if (!hasSubscription) {
    return <SubscriptionRequiredFallback />;
  }

  return (
    <div>
      <BaseTabs
        tabs={tabs}
        activeIndex={activeTabIndex}
        onChange={handleTabChange}
        className="rounded-t-[16px] p-4 bg-white pb-0 border-0 border-b border-solid border-graySoft border-opacity-50"
      />
      <div className="relative">
        {loading && !isLoadingMore && (
          <div className="absolute inset-0 z-10">
            <BaseSkeletonTable
              rows={10}
              columns={6}
              showHeader={true}
              className="h-full"
            />
          </div>
        )}

        <div
          className={loading && !isLoadingMore ? "opacity-0" : "opacity-100"}
        >
          <BaseTable
            data={offers}
            columns={columns}
            searchable={true}
            searchPlaceholder={t("myOffersConstants.searchOffers")}
            emptyMessage={t("myOffersConstants.noOffersFound")}
            serverSide={true}
            totalRecords={totalCount}
            // onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            externalSearchValue={search}
            showPagination={false}
            showItemsPerPage={false}
            showResultsCount={false}
            removeLastRowBorder={true}
          />
        </div>
      </div>

      {offers?.length > 0 && (
        <PaginationInfo
          currentCount={offers?.length ?? 0}
          totalCount={totalCount}
          itemLabel={t("myOffersConstants.offers")}
          onLoadMore={fetchMoreOffers}
          isLoadingMore={isLoadingMore}
          className="pb-[20px] pt-[20px]"
        />
      )}

      <ProjectDetailsModal
        visible={isProjectModalVisible}
        onHide={handleCloseProjectModal}
        project={selectedProject}
      />
    </div>
  );
};

export default MyOffers;
