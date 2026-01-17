"use client";
import { useAppSelector } from "@/lib/store/hooks";
import { ProfileTab, ProfileTabItem } from "../common/ProfileTab";
import Settings from "../settings/Settings";
import BusinessProfile from "./BusinessProfile";
import Profile from "./Profile";
import { RootState } from "@/lib/store/store";
import { useMemo, ReactNode } from "react";
import { commonLabels } from "../constants/Common";
import { getTranslationSync } from "@/i18n/i18n";
import ReviewContent from "../project/ReviewContent";
import { selectHasSubscription } from "@/lib/store/slices/authSlice";
import SubscriptionRequiredFallback from "../common/SubscriptionRequiredFallback";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

interface SubscriptionWrapperProps {
  children: ReactNode;
  hasSubscription: boolean;
}

const SubscriptionWrapper = ({
  children,
  hasSubscription,
}: SubscriptionWrapperProps) => {
  if (!hasSubscription) {
    return <SubscriptionRequiredFallback />;
  }

  return <>{children}</>;
};

const customerProfileTabs: ProfileTabItem[] = [
  {
    id: "basic information",
    label: t("sidebarConstants.basicInformation"),
    component: <Profile />,
  },
  {
    id: "security",
    label: t("sidebarConstants.settings"),
    component: <Settings />,
  },
];

function ProfileSidebar() {
  const role = useAppSelector((state: RootState) => state.auth.role);
  const hasSubscription = useAppSelector(selectHasSubscription);

  const businessProfileTabs: ProfileTabItem[] = useMemo(
    () => [
      {
        id: "business-info",
        label: t("sidebarConstants.basicInformation"),
        component: <BusinessProfile />,
      },
      {
        id: "settings",
        label: t("sidebarConstants.settings"),
        component: <Settings />,
      },
      {
        id: "review",
        label: t("projectDetailProfessionalProfileConstants.review"),
        component: (
          <SubscriptionWrapper hasSubscription={hasSubscription}>
            <ReviewContent />
          </SubscriptionWrapper>
        ),
      },
    ],
    [hasSubscription]
  );

  const tabs = useMemo(() => {
    if (role === commonLabels.businessRole) {
      return businessProfileTabs;
    }
    if (role === commonLabels.customerRole) {
      return customerProfileTabs;
    }
    return [];
  }, [role, businessProfileTabs]);

  return <ProfileTab items={tabs} defaultActiveId={tabs[0]?.id} />;
}

export default ProfileSidebar;
