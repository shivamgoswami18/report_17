"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import BaseToggle from "@/components/base/BaseToggle";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateNotifications } from "@/lib/api/SettingApi";
import BaseErrorMessage from "../base/BaseErrorMessage";
import { UserNotifications } from "@/types/user";
import { updateUserNotifications } from "@/lib/store/slices/userSlice";
import { RootState } from "@/lib/store/store";
import { commonLabels } from "../constants/Common";

const NotificationsSection = () => {
  const t = (key: string, params?: Record<string, string>) =>
    getTranslationSync(key, params);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.settingState);
  const [updatingKey, setUpdatingKey] = useState<
    keyof UserNotifications | null
  >(null);

  const notifications = useAppSelector(
    (state) => state.user.profile?.user_notifications
  );
  const userId = useAppSelector((state) => state.user.profile?._id);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const role = useAppSelector((state: RootState) => state.auth.role);

  const notificationConfig: {
    key: keyof UserNotifications;
    titleKey: string;
    descriptionKey: string;
  }[] = [
    {
      key: "offer",
      titleKey: "settingsPageConstants.notificationsOffer.title",
      descriptionKey:
        role === commonLabels.businessRole
          ? "settingsPageConstants.notificationsOffer.businessDescription"
          : "settingsPageConstants.notificationsOffer.description",
    },
    {
      key: "message",
      titleKey: "settingsPageConstants.notificationsMessage.title",
      descriptionKey: "settingsPageConstants.notificationsMessage.description",
    },
    {
      key: "completed_project",
      titleKey: "settingsPageConstants.notificationsProjectCompleted.title",
      descriptionKey:
        "settingsPageConstants.notificationsProjectCompleted.description",
    },
  ];
  const handleToggleChange = useCallback(
    (key: keyof UserNotifications, checked: boolean) => {
      if (!notifications || !userId) return;

      const updatedStates = {
        ...notifications,
        [key]: checked,
      };
      dispatch(updateUserNotifications(updatedStates));
      setUpdatingKey(key);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          await dispatch(
            updateNotifications({
              userId,
              user_notifications: updatedStates,
            })
          );
        } finally {
          setUpdatingKey(null);
        }
      }, 500);
    },
    [notifications, userId, dispatch]
  );
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-white rounded-[16px] px-[24px] py-[16px]">
      <h2 className="text-obsidianBlack text-opacity-40 text-textSm font-light mb-[16px] xl:leading-[100%] xl:tracking-[0px]">
        {t("settingsPageConstants.notifications")}
      </h2>

      <div className="mx-[-24px]">
        <hr className="border-0 border-b border-solid border-graySoft border-opacity-50" />
      </div>

      <div className="space-y-[20px] mt-[20px]">
        {notificationConfig?.map((notificationItem) => (
          <div
            key={notificationItem?.key}
            className="flex items-start justify-between gap-[10px] border-0 border-b border-solid border-graySoft border-opacity-50 last:border-b-0 pb-[20px] last:pb-0"
          >
            <div className="flex-1">
              <p className="text-obsidianBlack text-textBase font-light mb-[2px] xl:leading-[100%] xl:tracking-[0px]">
                {t(notificationItem?.titleKey)}
              </p>
              <p className="text-stoneGray text-textSm font-light xl:leading-[20px] xl:tracking-[0%]">
                {t(notificationItem?.descriptionKey)}
              </p>
            </div>
            <BaseToggle
              checked={notifications?.[notificationItem.key] || false}
              onChange={(checked) =>
                handleToggleChange(notificationItem.key, checked)
              }
              disabled={
                loading.notifications || updatingKey === notificationItem.key
              }
              loading={updatingKey === notificationItem.key}
            />
          </div>
        ))}
        <BaseErrorMessage error={error.notifications} />
      </div>
    </div>
  );
};

export default NotificationsSection;
