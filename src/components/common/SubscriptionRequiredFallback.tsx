"use client";

import { useRouter } from "next/navigation";
import BaseButton from "@/components/base/BaseButton";
import { SubscriptionChipIcon } from "@/assets/icons/CommonIcons";
import { getTranslationSync } from "@/i18n/i18n";
import { routePath } from "@/components/constants/RoutePath";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

interface SubscriptionRequiredFallbackProps {
  readonly title?: string;
  readonly message?: string;
  readonly buttonText?: string;
  readonly redirectPath?: string;
}

export default function SubscriptionRequiredFallback({
  title,
  message,
  buttonText,
  redirectPath = routePath.subscription,
}: Readonly<SubscriptionRequiredFallbackProps>) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push(redirectPath);
  };

  const defaultTitle = t("commonConstants.subscriptionRequiredTitle");
  const defaultMessage = t("commonConstants.subscriptionRequiredMessage");
  const defaultButtonText = t("commonConstants.purchaseSubscription");

  return (
    <div className="flex items-center justify-center w-full my-auto min-h-screen">
      <div className="max-w-lg w-full bg-white rounded-[16px] shadow-lg p-4 sm:p-5 text-center">
        <div className="relative mb-8 flex justify-center">
          <SubscriptionChipIcon />
        </div>

        <h2 className="text-textMd sm:text-titleMid font-bold text-obsidianBlack mb-4">
          {title || defaultTitle}
        </h2>

        <p className="text-textBase sm:text-textMd text-charcoalGrey mb-8 leading-relaxed">
          {message || defaultMessage}
        </p>

        <div className="flex justify-center">
          <BaseButton
            onClick={handleRedirect}
            className="bg-deepTeal text-white text-textSm sm:text-textBase font-semibold py-3 px-8 rounded-lg border-none min-w-[200px]"
            label={buttonText || defaultButtonText}
          />
        </div>
      </div>
    </div>
  );
}
