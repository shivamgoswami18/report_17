import { useMemo } from "react";
import { commonLabels, handleImagePreview } from "@/components/constants/Common";
import fallbackPng from "@/assets/images/fallBack.png";
import SafeImage from "@/components/common/SafeImage";
import { getTranslationSync } from "@/i18n/i18n";
import { ProjectStatusIcon } from "@/assets/icons/CommonIcons";

interface ProjectStatusCardProps {
  customer: {
    full_name: string;
    email?: string;
    phone_number?: string;
    profile_image?: string | null;
  };
  county?: { name?: string };
  offer?: {
    description?: string;
    amount?: number;
    estimated_duration?: string;
    status?: string;
    clips_used?: number;
  };
  offered: boolean;
  isCustomerRole?: boolean;
  step?: number;
}

const t = (key: string, params?: Record<string, string>) =>
  getTranslationSync(key, params);

function ProjectStatusCard({
  customer,
  county,
  offer,
  offered,
  isCustomerRole = false,
  step = 0,
}: Readonly<ProjectStatusCardProps>) {
  const projectStatusData = useMemo(
    () => [
      {
        id: 1,
        translationKey: "createProjectPageConstants.projectDescriptionPageConstants.projectDescription",
      },
      {
        id: 2,
        translationKey: "createProjectPageConstants.projectLocation",
      },
      {
        id: 3,
        translationKey: "createProjectPageConstants.contactDetails",
      },
    ],
    []
  );

  const statusDataWithCompletion = useMemo(
    () =>
      isCustomerRole
        ? projectStatusData.map((status) => ({
            ...status,
            isCompleted: status.id <= step,
          }))
        : [],
    [isCustomerRole, projectStatusData, step]
  );

  return (
    <div className="w-full lg:w-[30%] flex flex-col gap-[12px]">
      <div className="bg-mintUltraLight rounded-[16px]">
        <div className="text-obsidianBlack text-textBase sm:text-textBase font-light px-[16px] sm:px-[20px] py-[12px] sm:py-[17px] border-solid border-0 border-b border-white">
          {isCustomerRole
            ? t("projectDetailsPageConstants.statusCardProjectStatus")
            : t("projectDetailsPageConstants.customerDetails")}
        </div>
        {isCustomerRole ? (
          <ul className="space-y-[20px] sm:space-y-[26px] px-[16px] sm:px-[20px] py-[12px] sm:py-[17px]">
            {statusDataWithCompletion?.map((status, index) => (
              <li
                key={status?.id}
                className="relative flex items-center gap-[10px]"
              >
                {index !== statusDataWithCompletion.length - 1 && (
                  <span
                    className={`absolute left-[15px] sm:left-[18px] top-5 h-[40px] sm:h-[50px] w-[3px] ${
                      status?.isCompleted
                        ? "bg-deepTeal"
                        : "bg-deepTeal bg-opacity-10"
                    }`}
                  />
                )}

                <div
                  className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full z-10 flex-shrink-0 ${
                    status?.isCompleted ? "bg-deepTeal" : "bg-white"
                  }`}
                >
                  <ProjectStatusIcon
                    stroke={status?.isCompleted ? "white" : "black"}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-textSm sm:text-textBase font-light text-obsidianBlack mb-[2px]">
                    {t(status?.translationKey)}
                  </div>
                  <div className="text-mini text-opacity-40 font-light text-obsidianBlack">
                    {status?.isCompleted
                      ? t("projectDetailsPageConstants.completed")
                      : t("projectDetailsPageConstants.pending")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : offered ? (
          <>
            <div className="flex items-center gap-3 mt-2 px-[16px] sm:px-[20px] py-[12px] sm:py-[17px]">
              <div className="w-10 h-10 rounded-full bg-mintUltraLight flex items-center justify-center">
                <SafeImage
                  src={
                    handleImagePreview({ imagePath: customer?.profile_image }) ||
                    fallbackPng
                  }
                  fallbackSrc={fallbackPng}
                  alt={customer?.full_name}
                  className="w-full h-full object-cover rounded-full"
                  width={48}
                  height={48}
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="text-obsidianBlack text-base">
                  {customer?.full_name}
                </span>
                <span className="text-gray-500 text-mini">{county?.name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full mt-2 ">
              <div className="flex flex-col px-[16px] sm:px-[20px] sm:py-[9px]">
                <span className="text-mini text-gray-400">{t("logInLabel.email")}</span>
                <span className="text-textBase text-obsidianBlack">{customer?.email}</span>
              </div>
              <div className="flex flex-col px-[16px] sm:px-[20px] sm:py-[9px]">
                <span className="text-mini text-gray-400">{t("projectDetailsPageConstants.phone")}</span>
                <span className="text-textBase text-obsidianBlack">
                  {customer?.phone_number}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="px-[16px] sm:px-[20px] pb-[16px] sm:pb-[20px] text-textSm text-redPrimary font-light">
            {t("projectDetailsPageConstants.afterApplyingForThisProjectNote")}
          </div>
        )}
      </div>

      {offered && offer && (
        <div className="bg-mintUltraLight rounded-[16px]">
          <div className="text-obsidianBlack text-textBase sm:text-textBase font-light px-[16px] sm:px-[20px] py-[12px] sm:py-[17px] border-solid border-0 border-b border-white">
            {t("projectDetailsPageConstants.offeredDetails")}
          </div>
          <div className="flex flex-col gap-3 w-full mt-2 ">
            <div className="flex flex-col px-[16px] sm:px-[20px] sm:py-[9px]">
              <span className="text-mini text-gray-400">{t("projectDetailsPageConstants.amount")}</span>
              <span className="text-textBase text-obsidianBlack">
                {offer.amount != null
                  ? `${offer.amount} ${commonLabels.krone}`
                  : commonLabels.noDataDash}
              </span>
            </div>
            <div className="flex flex-col px-[16px] sm:px-[20px] sm:py-[9px]">
              <span className="text-mini text-gray-400">{t("projectDetailsPageConstants.timeLine")}</span>   
              <span className="text-textBase text-obsidianBlack">
                {offer.estimated_duration
                  ? `${offer.estimated_duration} ${t(
                      "projectDetailsPageConstants.daysSuffix"
                    )}`
                  : commonLabels.noDataDash}
              </span>
            </div>
            <div className="flex flex-col px-[16px] sm:px-[20px] sm:py-[9px]">
              <span className="text-mini text-gray-400">{t("projectDetailsPageConstants.descriptionTitle")}</span>
              <span className="text-textBase text-obsidianBlack">
                {offer.description && offer.description.trim()
                  ? offer.description
                  : commonLabels.noDataDash}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectStatusCard;
