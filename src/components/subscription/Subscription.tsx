"use client";
import { BackArrowIcon } from "@/assets/icons/CommonIcons";
import { getTranslationSync } from "@/i18n/i18n";
import { commonLabels, formatDate } from "../constants/Common";
import SubscriptionPackages from "./SubscriptionPackages";
import BaseButton from "../base/BaseButton";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useEffect, useState } from "react";
import { clipHistory, ClipHistoryPayload } from "@/lib/api/SubscriptionApi";
import PaginationInfo from "../common/PaginationInfo";
import { ClipHistory } from "@/types/subscription";
import { MenuItem } from "primereact/menuitem";
import BaseMenu from "../base/BaseMenu";
import BaseSkeleton from "../base/BaseSkeleton";

type SortOrder = "all" | "clipUsage" | "clipPurchased";
function Subscription() {
  const t = (key: string, params?: Record<string, string>) => {
    return getTranslationSync(key, params);
  };
  const router = useRouter();
  const dispatch = useAppDispatch();
  const clipUsageHistoryData = useAppSelector(
    (state) => state.subscription.clipHistory
  );
  const historyLoader = useAppSelector(
    (state) => state.subscription
  ).historyLoader;
  const [limit, setLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("all");
  const sortLabelsMap: Record<SortOrder, string> = {
    all: t("myOffersConstants.all"),
    clipUsage: t("subscriptionPageConstants.clipUsage"),
    clipPurchased: t("subscriptionPageConstants.clipPurchased"),
  };
  const usageTypeMap: Partial<Record<SortOrder, string>> = {
    clipUsage: commonLabels.appliedValue,
    clipPurchased: commonLabels.purchased,
  };
  const sortOptions: MenuItem[] = [
    {
      label: sortLabelsMap.all,
      command: () => setSortOrder("all"),
      className: "border-0 bg-white",
    },
    { separator: true },
    {
      label: sortLabelsMap.clipUsage,
      command: () => setSortOrder("clipUsage"),
      className: "border-0 bg-white",
    },
    { separator: true },
    {
      label: sortLabelsMap.clipPurchased,
      command: () => setSortOrder("clipPurchased"),
      className: "border-0 bg-white",
    },
  ];

  const selectedSortLabel = sortLabelsMap[sortOrder];
  const payload: ClipHistoryPayload = {
    sortKey: "_id",
    sortValue: "desc",
    page: 1,
    limit,
    ...(usageTypeMap[sortOrder] && {
      usageType: usageTypeMap[sortOrder],
    }),
  };
  const handleLoadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const newLimit = limit + 10;

    try {
      setLimit(newLimit);
    } finally {
      setIsLoadingMore(false);
    }
  };
  useEffect(() => {
    dispatch(clipHistory({ payload }));
  }, [dispatch, limit, sortOrder]);
  const getDisplayTitle = (item: ClipHistory): string => {
    if (item.usage_type === commonLabels.appliedValue) {
      return item.project_title || commonLabels.noDataDash;
    }

    if (item.usage_type === commonLabels.purchased) {
      return item.title || commonLabels.noDataDash;
    }

    return commonLabels.noDataDash;
  };

  const showInitialLoader =
    historyLoader && (clipUsageHistoryData?.items?.length ?? 0) === 0;

  if (showInitialLoader) return <BaseSkeleton count={5} gap="12px" />;
  return (
    <div>
      <div className="flex gap-4 items-center">
        <BaseButton
          className="bg-transparent border-none p-0"
          onClick={() => router.back()}
        >
          <BackArrowIcon size={24} />
        </BaseButton>
        <p className="text-obsidianBlack text-titleMid font-light xl:leading-[100%] xl:tracking-[0px]">
          {t("subscriptionPageConstants.subscriptionHeader")}
        </p>
      </div>
      <div className="mt-6 flex gap-6 flex-col lg:flex-row lg:gap-8 lg:items-stretch">
        <div className="w-full lg:w-[40%] bg-white rounded-[16px] shadow-[0px_8px_16px_0px_#108A0008] p-6">
          <SubscriptionPackages />
        </div>
        <div className="bg-white rounded-[16px] border-solid border-2 border-offWhite w-full lg:w-[60%]">
          <div className="border-solid border-b border-0 border-graySoft border-opacity-50 pb-0 p-6 flex justify-between flex-wrap gap-4">
            <p className="text-titleMid fullhd:text-titleMd font-light text-obsidianBlack xl:leading-[100%] xl:tracking-[0px]">
              {t("subscriptionPageConstants.clipUsageHistory")}
            </p>
            <div className="mb-4 flex justify-end">
              <BaseMenu
                items={sortOptions}
                id="clip_sort"
                className="!absolute p-2 rounded !mt-[10px]"
              >
                <BaseButton className="rounded-[8px] border-[2px] border-lightGrayAlpha px-4 py-2 flex items-center justify-center cursor-pointer bg-white text-black text-sm">
                  {t("projectsPageConstants.sortBy")} : {selectedSortLabel}
                </BaseButton>
              </BaseMenu>
            </div>
          </div>
          <div className="px-6">
            {historyLoader ? (
              <BaseSkeleton count={5} gap="12px" />
            ) : (
              clipUsageHistoryData?.items?.map((item, index) => {
                const isLastItem =
                  index === clipUsageHistoryData.items.length - 1;

                const isPurchased = item?.usage_type === commonLabels.purchased;

                const borderClass = isLastItem
                  ? ""
                  : "border-solid border-0 border-b border-graySoft border-opacity-50";

                const displayDate = item?.createdAt
                  ? formatDate(item.createdAt)
                  : commonLabels.noDataDash;

                const badgeClass = isPurchased
                  ? "bg-deepTeal bg-opacity-5 text-deepTeal"
                  : "bg-vividBlue bg-opacity-5 text-vividBlue";

                const textColorClass = isPurchased
                  ? "text-deepTeal"
                  : "text-redPrimary";

                const sign = isPurchased ? "+" : "-";

                const usageLabel = item?.usage_type
                  ? item.usage_type.charAt(0).toUpperCase() +
                    item.usage_type.slice(1)
                  : commonLabels.noDataDash;

                return (
                  <div
                    key={item?._id}
                    className={`py-4 flex justify-between ${borderClass}`}
                  >
                    <div>
                      <p className="text-obsidianBlack font-light text-textBase fullhd:text-titleSm xl:leading-[100%] xl:tracking-[0px]">
                        {getDisplayTitle(item)}
                      </p>

                      <p className="mt-1 text-obsidianBlack text-opacity-50 text-mini fullhd:text-textMd xl:leading-[100%] xl:tracking-[0px] font-light">
                        {displayDate}
                      </p>

                      <div
                        className={`mt-[3px] inline-flex items-center justify-center rounded-[14px] px-[12px] py-[4px] text-mini fullhd:text-textMd xl:leading-[100%] xl:tracking-[0px] font-light ${badgeClass}`}
                      >
                        {usageLabel}
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-textBase fullhd:text-titleSm xl:leading-[100%] xl:tracking-[0px] font-light mb-[2px] ${textColorClass}`}
                      >
                        {sign}
                        {item?.clips_used ?? 0}
                      </p>

                      <p className="text-obsidianBlack text-opacity-50 text-mini fullhd:text-textMd xl:leading-[100%] xl:tracking-[0px]">
                        {t("subscriptionPageConstants.clips")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <PaginationInfo
            currentCount={clipUsageHistoryData?.items?.length ?? 0}
            totalCount={clipUsageHistoryData?.totalCount ?? 0}
            itemLabel={t("subscriptionPageConstants.clipHistory")}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            className="pb-6"
          />
        </div>
      </div>
    </div>
  );
}

export default Subscription;