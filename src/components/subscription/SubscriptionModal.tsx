"use client";

import BaseModal from "@/components/base/BaseModal";
import SubscriptionPackages from "@/components/subscription/SubscriptionPackages";
import BaseButton from "../base/BaseButton";
import { CloseIcon } from "@/assets/icons/CommonIcons";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setUserDismissedModal } from "@/lib/store/slices/subscriptionSlice";

export default function SubscriptionModalWrapper() {
  const dispatch = useAppDispatch();
  const isSubscriptionModalVisible = useAppSelector(
    (state) => state.subscription.isSubscriptionModalVisible
  );
  const handleCloseModal = () => {
    dispatch(setUserDismissedModal());
  };

  return (
    <BaseModal
      visible={isSubscriptionModalVisible}
      onHide={handleCloseModal}
      maxWidth="1000px"
      showCloseIcon={false}
      header={
        <div className="flex items-end justify-end p-[10px] sm:p-[20px] border-0 border-solid border-b border-graySoft border-opacity-50">
          <BaseButton
            onClick={handleCloseModal}
            className="bg-transparent border-none"
          >
            <CloseIcon className="text-obsidianBlack opacity-30" />
          </BaseButton>
        </div>
      }
    >
      <div className="bg-white rounded-[16px] shadow-[0px_8px_16px_0px_#108A0008] p-[20px] xs:w-[400px] sm:w-[550px] lg:w-[600px] desktop:w-[650px] w-full">
        <SubscriptionPackages />
      </div>
    </BaseModal>
  );
}
