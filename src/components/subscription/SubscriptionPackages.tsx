"use client";

import React, { useEffect, useState } from "react";
import {
  SubscriptionChipIcon,
  SubscriptionChipCheckedIcon,
} from "@/assets/icons/CommonIcons";
import BaseCheckbox from "../base/BaseCheckbox";
import BaseButton from "../base/BaseButton";
import { commonLabels, formatDate } from "../constants/Common";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  listOfSubscriptions,
  sendPlanRequest,
} from "@/lib/api/SubscriptionApi";
import { ViewProfile } from "@/lib/api/UserApi";
import { useRouter } from "next/navigation";
import BaseSkeleton from "../base/BaseSkeleton";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const SubscriptionPackages = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const subscriptions = useAppSelector(
    (state) => state.subscription.subscriptions
  );
  const user = useAppSelector((state) => state.user.profile);
  const isLoading = useAppSelector((state) => state.subscription.loading);
  const [showRenewPlans, setShowRenewPlans] = useState(false);

  useEffect(() => {
    dispatch(
      listOfSubscriptions({
        payload: {
          status: "pending",
        },
      })
    );
    dispatch(ViewProfile());
  }, [dispatch]);

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const handleSendRequest = () => {
    if (!selectedPackage) return;
    dispatch(
      sendPlanRequest({
        subscriptionId: selectedPackage,
        navigate: (path: string) => router.push(path),
      })
    );
  };
  useEffect(() => {
    if (!subscriptions?.items?.length) return;
    if (selectedPackage) return;

    const requestedPlan = subscriptions.items.find(
      (pkg) => pkg.plan_status === commonLabels.requested
    );

    if (requestedPlan?._id) {
      setSelectedPackage(requestedPlan._id);
    }
  }, [subscriptions?.items, selectedPackage]);
  const requestedPlan = subscriptions?.items?.find(
    (pkg) => pkg.plan_status === commonLabels.requested
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = user?.plan_info?.expire_date
    ? new Date(user.plan_info.expire_date)
    : null;

  if (expiryDate) expiryDate.setHours(0, 0, 0, 0);

  const daysLeft = expiryDate
    ? Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 10;
  if (isLoading) return <BaseSkeleton count={5} gap="12px" />;
  return (
    <div className="">
      <div className="bg-deepTeal bg-opacity-5 px-[20px] py-[16px] flex justify-between items-center gap-[20px] flex-wrap rounded-[16px] mb-[30px]">
        <div>
          <p className="text-obsidianBlack text-opacity-70 text-textSm fullhd:text-textLg xl:leading-[100%] xl:tacking-[0px] ">
            {t("subscriptionPageConstants.currentBalance")}
          </p>
          <p className="mt-[6px] font-medium desktop:text-titleLg md:text-titleMd xl:leading-[100%] xl:tracking-[0px] text-obsidianBlack">
            {user?.plan_info?.total_clips || 0}{" "}
            {t("subscriptionPageConstants.clips")}
          </p>
        </div>
        <SubscriptionChipIcon />
      </div>
      {user?.payment_status == commonLabels.paymentReceivedStatusValue &&
      !showRenewPlans ? (
        <>
          <div className="bg-deepTeal bg-opacity-5 rounded-[16px] border-solid border-2 border-offWhite p-[20px] mb-[20px]">
            <p className="text-obsidianBlack text-titleMid fullhd:text-titleMd font-medium mb-[8px]">
              {t("subscriptionPageConstants.currentPlan")}
            </p>

            <div className="flex justify-between text-textSm fullhd:text-textLg text-obsidianBlack mb-[8px] text-opacity-70 ">
              <p>{t("subscriptionPageConstants.membershipName")}</p>
              <p> {user?.plan_info?.plan_name}</p>
            </div>

            <div className="flex justify-between text-textSm fullhd:text-textLg text-obsidianBlack text-opacity-70 ">
              <span>{t("subscriptionPageConstants.totalClips")}</span>
              <span>{user?.plan_info?.total_clips}</span>
            </div>

            <div className="flex justify-between text-textSm fullhd:text-textLg text-obsidianBlack text-opacity-70 mt-[6px]">
              <span>{t("subscriptionPageConstants.expiryDate")}</span>
              <span>{formatDate(user?.plan_info?.expire_date)}</span>
            </div>

            <div className="flex justify-between text-textSm fullhd:text-textLg text-obsidianBlack text-opacity-70 mt-[6px]">
              <span>{t("subscriptionPageConstants.price")}</span>
              <span>
                {user?.plan_info?.price}
                {commonLabels.krone}
              </span>
            </div>
          </div>
          {isExpiringSoon && (
            <div className="flex justify-between items-center flex-wrap gap-[10px]">
              <p className="text-redPrimary text-mini fullhd:text-textLg font-light xl:leading-[100%] xl:tracking-[0px] opacity-70">
                {t("subscriptionPageConstants.planExpiringSoon", {
                  days: formatDate(user?.plan_info?.expire_date),
                })}
              </p>
              <BaseButton
                className="px-[13px] py-[6px] bg-deepTeal border-0 text-textSm rounded-[8px] xl:leading-[24px] xl:tracking-[0px] font-medium"
                label="Renew now"
                onClick={() => setShowRenewPlans(true)}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-[12px]">
            <p className="text-obsidianBlack text-opacity-40 text-textSm fullhd:text-textLg font-light xl:leading-[100%] xl:tacking-[0px]">
              {t("subscriptionPageConstants.choosePackage")}
            </p>
          </div>
          <div className="bg-white border-solid border-2 overflow-hidden border-offWhite rounded-[16px]">
            {subscriptions?.items?.map((pkg) => (
              <div
                key={pkg?._id}
                className={`${
                  selectedPackage === pkg?._id
                    ? "bg-deepTeal bg-opacity-5"
                    : "bg-white"
                }`}
              >
                <div className="mx-[20px] py-[20px] flex justify-between items-center border-solid border-0 border-b border-graySoft border-opacity-50">
                  <div className="flex gap-[14px]">
                    <BaseCheckbox
                      name={`package-${pkg?._id}`}
                      checked={selectedPackage === pkg?._id}
                      onChange={(checked) =>
                        setSelectedPackage(checked ? pkg?._id ?? "" : "")
                      }
                      checkboxClassName="border-2 border-offWhite"
                    />

                    <div className="flex gap-[6px] items-start">
                      <SubscriptionChipCheckedIcon />
                      <div>
                        <p className="text-obsidianBlack text-textBase fullhd:text-titleSm font-light mb-[2px] xl:leading-[100%] xl:tracking-[0px]">
                          {pkg?.package_name}
                        </p>
                        <p className="text-mini fullhd:text-textMd font-light text-obsidianBlack text-opacity-50 xl:leading-[100%] xl:tracking-[0px]">
                          {pkg?.monthly_duration}{" "}
                          {t("subscriptionPageConstants.perClip")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-deepTeal text-textSm sm:text-textBase font-medium xl:leading-[100%] xl:tracking-[0px]">
                    {pkg?.price}
                    {commonLabels?.krone}
                  </p>
                </div>
              </div>
            ))}
            <div className="px-[20px] pt-[16px] pb-[20px]">
              {requestedPlan ? (
                <p className="text-redPrimary text-textSm fullhd:text-textLg font-light leading-[150%]">
                  {t("commonConstants.subscriptionRequestSent")}
                </p>
              ) : (
                <div className="text-right">
                  <BaseButton
                    onClick={handleSendRequest}
                    disabled={!selectedPackage}
                    loader={isLoading}
                    label={t("subscriptionPageConstants.sendRequestButtonText")}
                    className="bg-deepTeal rounded-[8px] px-[26px] py-[10px] text-textSm fullhd:text-textLg font-medium border-0 xl:leading-[100%] xl:tracking-[0px]"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubscriptionPackages;
