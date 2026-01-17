import { useEffect, useState } from "react";
import { StarIcon } from "@/assets/icons/CommonIcons";
import BaseButton from "../base/BaseButton";
import { getTranslationSync } from "@/i18n/i18n";
import ProjectStatusCard from "./ProjectStatusCard";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { RootState } from "@/lib/store/store";
import type { OfferItem } from "@/lib/store/slices/projectSlice";
import {
  ListOfReceivedOffer,
  AcceptProjectOffer,
  ViewProject,
  CancelProject,
} from "@/lib/api/ProjectApi";
import BaseLoader from "../base/BaseLoader";
import PaginationInfo from "../common/PaginationInfo";
import user_image from "@/assets/images/user_dummy_image.png";
import { commonLabels, handleImagePreview } from "../constants/Common";
import SafeImage from "../common/SafeImage";
import BaseModal from "../base/BaseModal";
import Link from "next/link";
import { routePath } from "../constants/RoutePath";
import { useRouter } from "next/navigation";

type ProjectDetailsForOfferCard = {
  offered?: boolean;
  customer?: {
    full_name?: string;
    email?: string;
    phone_number?: string;
    profile_image?: string | null;
  };
  county?: {
    name?: string;
  };
  offer?: {
    description?: string;
    amount?: number;
    estimated_duration?: string;
    status?: string;
    clips_used?: number;
  } | null;
};

function OfferCard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentProjectDetails = useAppSelector(
    (state: RootState) => state.project.currentProjectDetails
  );
  const offerItems = useAppSelector(
    (state: RootState) => state.project.receivedOffers?.items ?? []
  );
  const totalCount = useAppSelector(
    (state: RootState) => state.project.receivedOffers?.totalCount ?? 0
  );
  const loadingOffers = useAppSelector(
    (state: RootState) => state.project.loadingOffers
  );
  const [limit, setLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [offerToAccept, setOfferToAccept] = useState<string | null>(null);
  const acceptingOffer = useAppSelector(
    (state: RootState) => state.project.acceptingOffer
  );

  const projectForCard: ProjectDetailsForOfferCard | null =
    (currentProjectDetails as unknown as ProjectDetailsForOfferCard | null) ??
    null;

  const isProjectCompleted =
    currentProjectDetails?.status === commonLabels.completedValue;

  const t = (key: string, params?: Record<string, string>) => {
    return getTranslationSync(key, params);
  };

  const fetchMoreOffers = async () => {
    if (isLoadingMore || !currentProjectDetails?._id) return;
    setIsLoadingMore(true);
    const newLimit = limit + 10;
    try {
      await dispatch(
        ListOfReceivedOffer({
          projectId: currentProjectDetails._id,
          payload: {
            sortKey: "_id",
            sortValue: "desc",
            page: 1,
            limit: newLimit,
          },
        })
      );
      setLimit(newLimit);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpenConfirmModal = (offerId: string) => {
    if (
      !offerId ||
      acceptingOffer ||
      acceptingOfferId ||
      !currentProjectDetails?._id
    )
      return;
    setOfferToAccept(offerId);
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setOfferToAccept(null);
  };

  const handleAcceptOffer = async () => {
    if (
      !offerToAccept ||
      acceptingOffer ||
      acceptingOfferId ||
      !currentProjectDetails?._id
    )
      return;
    setAcceptingOfferId(offerToAccept);
    try {
      await dispatch(
        AcceptProjectOffer({
          payload: {
            offer_id: offerToAccept,
            status: commonLabels.assignedValue,
          },
        })
      );
      await dispatch(ViewProject(currentProjectDetails._id));
      setShowConfirmModal(false);
    } finally {
      setAcceptingOfferId(null);
      setOfferToAccept(null);
    }
  };

  const handleCancelProject = async () => {
    if (!currentProjectDetails?._id) return;

    await dispatch(
      CancelProject({
        payload: {
          project_id: currentProjectDetails._id,
          status: commonLabels.publishedValue,
        },
      })
    );
    await dispatch(ViewProject(currentProjectDetails._id));
  };

  const handleChatClick = (businessId: string) => {
    if (!businessId) return;
    router.push(`${routePath.messages}?business_id=${businessId}`);
  };

  useEffect(() => {
    if (currentProjectDetails?._id) {
      setLimit(10);
      setAcceptingOfferId(null);
      setShowConfirmModal(false);
      setOfferToAccept(null);
      dispatch(
        ListOfReceivedOffer({
          projectId: currentProjectDetails._id,
          payload: {
            sortKey: "_id",
            sortValue: "desc",
            page: 1,
            limit: 10,
          },
        })
      );
    }
  }, [dispatch, currentProjectDetails?._id]);

  if (loadingOffers && !isLoadingMore) {
    return (
      <div className="flex items-center justify-center mt-[20px] px-[10px] sm:px-[16px] py-8">
        <BaseLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-[16px] shadow-sm flex flex-col lg:flex-row gap-[16px] p-[20px]">
      <div className="flex flex-col gap-[10px] lg:w-[70%]">
        {offerItems?.length > 0 ? (
          <>
            {offerItems?.map((offer: OfferItem) => {
              const isAssignedSingleOffer =
                offerItems?.length === 1 &&
                offer?.status === commonLabels.assignedValue;
              return (
                <div
                  key={offer?._id}
                  className="border-solid border-2 border-lightGrayAlpha rounded-[8px] bg-white flex flex-col"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4  p-[16px]">
                    {offer?.business_id && (
                      <Link
                        href={routePath.userProfileBase(offer?.business_id)}
                        className="no-underline"
                      >
                        <div className="flex gap-[8px] items-center">
                          <SafeImage
                            src={
                              (handleImagePreview({
                                imagePath: offer?.business_image,
                              }) ??
                                user_image?.src) ||
                              ""
                            }
                            alt={t(
                              "projectDetailsPageConstants.projectDetailsUserIconAlt"
                            )}
                            className="h-12 w-12 cursor-pointer rounded-full object-cover"
                            width={48}
                            height={48}
                            unoptimized
                          />

                          <div>
                            <p className="text-obsidianBlack xl:text-textMd xl:leading-[100%] xl:tracking-[0px]">
                              {offer?.business_name}
                            </p>
                            {(offer?.averageRating ?? 0) > 0 && (
                              <div className="flex gap-[5px] items-center">
                                <StarIcon className="h-4 w-4 mb-[1px]" />
                                <p className="text-textSm text-deepTeal xl:leading-[100%] xl:tracking-[0px]">
                                  {(offer?.averageRating ?? 0).toFixed(1)} (
                                  {offer?.totalReviewCount ?? 0}{" "}
                                  {t(
                                    "projectDetailsPageConstants.reviewsTitle"
                                  )}
                                  )
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}
                    <div className="flex gap-[10px] flex-wrap">
                      <BaseButton
                        className="bg-deepTeal/0 border focus:ring-0 border-deepTeal border-opacity-10 text-obsidianBlack px-[20px] py-[8px] lg:px-[34px] lg:py-[10px] rounded-[8px] text-textSm xl:leading-[100%] xl:tracking-[0px]"
                        label={t("projectDetailsPageConstants.chatButtonTitle")}
                        onClick={() =>
                          handleChatClick(offer?.business_id ?? "")
                        }
                      />
                      {!isProjectCompleted && (
                        <BaseButton
                          className={
                            isAssignedSingleOffer
                              ? "bg-red-600 focus:ring-0 border-0 text-white rounded-[8px] px-[20px] py-[8px] lg:px-[34px] lg:py-[10px] text-textSm xl:leading-[100%] xl:tracking-[0px]"
                              : "bg-deepTeal focus:ring-0 border-0 text-white rounded-[8px] px-[20px] py-[8px] lg:px-[34px] lg:py-[10px] text-textSm xl:leading-[100%] xl:tracking-[0px]"
                          }
                          label={
                            isAssignedSingleOffer
                              ? t("projectDetailsPageConstants.cancel")
                              : t(
                                  "projectDetailsPageConstants.acceptOfferButtonTitle"
                                )
                          }
                          onClick={() =>
                            isAssignedSingleOffer
                              ? handleCancelProject()
                              : handleOpenConfirmModal(offer?._id ?? "")
                          }
                          disabled={
                            !isAssignedSingleOffer &&
                            (acceptingOffer ||
                              acceptingOfferId === offer?._id ||
                              acceptingOfferId !== null)
                          }
                        />
                      )}
                    </div>
                  </div>

                  <hr className="border-0 border-solid border-b md:w-[470px] border-graySoft border-opacity-50" />

                  <div className="p-[16px]">
                    <div className="flex gap-[12px] xxs:gap-[80px] sm:gap-[150px] figmascreen:gap-[210px] mb-[30px]">
                      <div>
                        <p className="text-textSm text-obsidianBlack mb-[1px] text-opacity-40 xl:leading-[100%] xl:tracking-[0px]">
                          {t("projectDetailsPageConstants.offerPrice")}
                        </p>
                        <p className="text-obsidianBlack xl:text-textMd xl:leading-[100%] xl:tracking-[0px]">
                          {commonLabels.dollar}
                          {offer?.amount ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-textSm text-obsidianBlack text-opacity-40 xl:leading-[100%] xl:tracking-[0px] mb-[1px]">
                          {t("projectDetailsPageConstants.timeLine")}
                        </p>
                        <p className="text-obsidianBlack xl:text-textMd xl:leading-[100%] xl:tracking-[0px]">
                          {offer?.estimated_duration}{" "}
                          {t("projectDetailsPageConstants.daysSuffix")}
                        </p>
                      </div>
                    </div>

                    <p className="text-obsidianBlack xl:text-textMd xl:leading-[100%] xl:tracking-[0px]">
                      {offer?.description}
                    </p>
                  </div>
                </div>
              );
            })}
            {offerItems?.length > 1 && (
              <PaginationInfo
                currentCount={offerItems?.length ?? 0}
                totalCount={totalCount ?? 0}
                itemLabel={t("projectDetailsPageConstants.offers")}
                onLoadMore={fetchMoreOffers}
                isLoadingMore={isLoadingMore}
                className="mt-4"
              />
            )}
          </>
        ) : (
          <div className="text-obsidianBlack text-textBase font-light text-center">
            {t("commonConstants.noResultsFound")}
          </div>
        )}
      </div>
      {projectForCard?.offered && projectForCard.customer && (
        <ProjectStatusCard
          customer={{
            full_name: projectForCard.customer.full_name ?? "",
            email: projectForCard.customer.email ?? "",
            phone_number: projectForCard.customer.phone_number ?? "",
            profile_image: projectForCard.customer.profile_image ?? null,
          }}
          county={projectForCard.county}
          offered={true}
        />
      )}

      <BaseModal
        visible={showConfirmModal}
        onHide={handleCloseConfirmModal}
        header={t("dashboardHeaderPageConstants.areYouSure")}
        maxWidth="500px"
        contentClassName="py-4 px-6"
        footerClassName="py-4 px-6"
        headerClassName="py-4 px-6 text-center font-normal"
        footer={
          <div className="flex gap-[12px] justify-between">
            <BaseButton
              label={t("commonConstants.cancel")}
              onClick={handleCloseConfirmModal}
              className="bg-obsidianBlack bg-opacity-10 text-opacity-50 text-obsidianBlack border border-lightGrayGamma rounded-lg px-6 py-2 font-medium w-full"
            />
            <BaseButton
              label={t("myOffersConstants.assigned")}
              onClick={handleAcceptOffer}
              className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium w-full"
              loader={acceptingOffer && offerToAccept !== null}
              disabled={acceptingOffer}
            />
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-textSm text-obsidianBlack text-opacity-70 text-center">
            {t("myOffersConstants.acceptOfferConfirmation")}
          </p>
        </div>
      </BaseModal>
    </div>
  );
}

export default OfferCard;
