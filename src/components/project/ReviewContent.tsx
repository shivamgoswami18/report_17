"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "@/assets/icons/CommonIcons";
import StarRating from "@/components/common/StarRating";
import BaseProgressBar from "@/components/base/BaseProgressBar";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { RootState } from "@/lib/store/store";
import { ListOfReviewPayload, reviewList } from "@/lib/api/ReviewApi";
import BaseSkeleton from "../base/BaseSkeleton";
import PaginationInfo from "../common/PaginationInfo";
import { RatingCounts } from "@/lib/store/slices/reviewSlice";
import BaseMenu from "../base/BaseMenu";
import BaseButton from "../base/BaseButton";
import { FaRegUser } from "react-icons/fa";
import { MenuItem } from "primereact/menuitem";
import { formatDate } from "../constants/Common";

export interface Review {
  id: number;
  rating: number;
  tag: string;
  text: string;
  name: string;
  date: string;
}

export interface RatingBreakdown {
  stars: number;
  count: number;
  percentage: number;
}
interface ReviewContentProps {
  showTitle?: boolean;
  showFilter?: boolean;
  businessId?: string;
}
type SortOrder = "default" | "newest" | "oldest";

const t = (key: string, params?: Record<string, string>) =>
  getTranslationSync(key, params);
const ReviewContent = ({
  showTitle = false,
  showFilter = true,
  businessId,
}: ReviewContentProps) => {
  const dispatch = useAppDispatch();
  const [limit, setLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  const { reviewsData, loading } = useAppSelector(
    (state: RootState) => state.reviewState
  );

  const sortLabelsMap: Record<SortOrder, string> = {
    default: t("commonConstants.default"),
    newest: t("commonConstants.newest"),
    oldest: t("commonConstants.oldest"),
  };

  const sortOptions: MenuItem[] = [
    {
      label: sortLabelsMap.default,
      command: () => setSortOrder("default"),
      className: "border-0 bg-whitePrimary",
    },
    { separator: true },
    {
      label: sortLabelsMap.newest,
      command: () => setSortOrder("newest"),
      className: "border-0 bg-whitePrimary",
    },
    { separator: true },
    {
      label: sortLabelsMap.oldest,
      command: () => setSortOrder("oldest"),
      className: "border-0 bg-whitePrimary",
    },
  ];

  const selectedSortLabel = sortLabelsMap[sortOrder];

  let sortValue: "asc" | "desc" | "";

  if (sortOrder === "newest") {
    sortValue = "asc";
  } else if (sortOrder === "oldest") {
    sortValue = "desc";
  } else {
    sortValue = "";
  }
  const loggedInId = useAppSelector((state) => state.user.profile?._id);
  const id = businessId ?? loggedInId;
  const payload: ListOfReviewPayload = {
    sortKey: "createdAt",
    sortValue,
    page: 1,
    limit,
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
    setLimit(10);
  }, [sortOrder]);
  useEffect(() => {
    if (id) {
      dispatch(reviewList(id, { payload }));
    }
  }, [dispatch, id, limit, sortOrder]);
  const ratingCounts = (reviewsData?.ratingCounts ?? {}) as RatingCounts;
  const totalReviews = Object.values(ratingCounts).reduce(
    (sum, c) => sum + c,
    0
  );

  const isFirstLoad = loading && !reviewsData;
  const showListSkeleton = loading && (reviewsData?.items?.length ?? 0) > 0;

  if (isFirstLoad) {
    return <BaseSkeleton count={5} gap="10px" />;
  }
  const hasReviews = (reviewsData?.items?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-[16px]">
      {showTitle && (
        <h2 className="text-obsidianBlack text-opacity-50 text-textBase fullhd:text-titleSm font-light border-0 border-solid border-b px-[20px] py-[15px] border-graySoft border-opacity-40">
          {t("reviewPageConstants.review")}
        </h2>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 figmascreen:gap-[24px] gap-[16px] p-[20px]">
        <div className="lg:col-span-2 space-y-[10px] order-2 lg:order-1">
          {showListSkeleton && <BaseSkeleton count={3} gap="10px" />}
          {!hasReviews && (
            <div className="flex items-center justify-center px-[10px] sm:px-[16px]">
              <p className="text-obsidianBlack text-textBase fullhd:text-titleSm font-light text-center">
                {t("commonConstants.noReviewFound")}
              </p>
            </div>
          )}
          {!showListSkeleton &&
            reviewsData?.items?.map((review) => (
              <div
                key={review?._id}
                className="bg-white border-[2px] border-solid border-offWhite rounded-[16px] p-[10px] sm:p-[20px] flex justify-between"
              >
                <div>
                  <div className="flex items-center gap-[10px]">
                    <StarRating
                      rating={review?.rating}
                      starClassName="w-5 h-5"
                    />
                    <span className="text-deepTeal text-mini fullhd:text-textMd font-light xl:leading-[100%] xl:tracking-[0px]">
                      {review?.project_title}
                    </span>
                  </div>
                  <p className="text-obsidianBlack text-textMd fullhd:text-titleSm font-light mt-[10px] mb-[3px] lg:mt-[18px] lg:mb-[8px] xl:leading-[100%] xl:tracking-[0px] italic">
                    {review?.review_text}
                  </p>
                  <div className="flex gap-[5px] items-center">
                    <FaRegUser
                      size={14}
                      className="text-obsidianBlack text-opacity-70"
                    />
                    <span className="text-obsidianBlack text-textSm fullhd:text-textLg text-opacity-70 font-light xl:leading-[100%] xl:tracking-[0px]">
                      {review?.customer_name}
                    </span>
                  </div>
                </div>
                <div className="text-obsidianBlack text-mini fullhd:text-textMd text-opacity-40 font-light xl:leading-[100%] xl:tracking-[0px]">
                  {formatDate(review?.createdAt)}
                </div>
              </div>
            ))}
          <PaginationInfo
            currentCount={reviewsData?.items?.length ?? 0}
            totalCount={reviewsData?.totalCount ?? 0}
            itemLabel={t("projectDetailProfessionalProfileConstants.reviews")}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            className="pb-[20px]"
          />
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2">
          {showFilter && (
            <div className="mb-[10px] flex justify-end">
              <BaseMenu
                items={sortOptions}
                id="review_sort_menu"
                className="!absolute p-2 rounded !mt-[10px]"
              >
                <BaseButton className="rounded-[8px] border-[2px] border-lightGrayAlpha px-[16px] py-[6px] flex items-center justify-center cursor-pointer bg-white text-black text-sm">
                  {t("projectsPageConstants.sortBy")} : {selectedSortLabel}
                </BaseButton>
              </BaseMenu>
            </div>
          )}
          <div className="bg-white border-[2px] border-solid border-offWhite rounded-[16px]">
            <div className="flex justify-between items-center pt-[10px] sm:pt-[20px] px-[10px] sm:px-[20px] flex-wrap">
              <div className="flex items-center gap-[12px]">
                <span className="text-obsidianBlack font-light text-titleMid lg:text-titleXxxlPlus xl:leading-[100%] xl:tracking-[0px]">
                  {reviewsData?.averageRating.toFixed(1)}
                </span>
                <StarIcon
                  fill="#FFD700"
                  stroke="#FFD700"
                  className="w-[28px] h-[28px] lg:w-[42px] lg:h-[42px]"
                />
              </div>
              <div className="flex justify-center items-center">
                <p className="text-obsidianBlack text-opacity-40 text-textSm fullhd:text-textLg font-light xl:leading-[100%] xl:tracking-[0px]">
                  {reviewsData?.totalCount}{" "}
                  {t("projectDetailProfessionalProfileConstants.reviews")}
                </p>
              </div>
            </div>

            <div className="w-full h-[1px] bg-graySoft bg-opacity-40 my-[10px] lg:my-[18px]" />

            <div className="space-y-[10px] pb-[10px] sm:pb-[20px] px-[10px] sm:px-[20px]">
              {reviewsData &&
                Object.entries(ratingCounts)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([stars, count]) => {
                    const percentage =
                      totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                    return (
                      <div key={stars} className="flex items-center gap-[27px]">
                        <div className="flex items-center gap-[4px]">
                          <div className="w-[10px] h-[20px] flex items-center justify-center">
                            <span className="text-obsidianBlack text-textBase fullhd:text-titleSm font-light text-opacity-50">
                              {stars}
                            </span>
                          </div>
                          <StarIcon
                            fill="#FFD700"
                            stroke="#FFD700"
                            className="w-4 h-4"
                          />
                        </div>
                        <BaseProgressBar percentage={percentage} />
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewContent;
