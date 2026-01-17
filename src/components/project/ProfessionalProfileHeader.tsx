import Image, { StaticImageData } from "next/image";
import BaseButton from "@/components/base/BaseButton";
import StatCard from "@/components/project/StatCard";
import Chip from "@/components/project/Chip";
import InfoItem from "@/components/project/InfoItem";
import { getTranslationSync } from "@/i18n/i18n";
import { LocationPinIcon, CalendarIcon } from "@/assets/icons/CommonIcons";
import { getProfessionalProfileStatsConfig } from "@/components/constants/ProfessionalProfile";
import { useAppSelector } from "@/lib/store/hooks";
import { useEffect, useState } from "react";
import { commonLabels, handleImagePreview } from "../constants/Common";
import { getYear } from "date-fns";
import BaseSkeleton from "../base/BaseSkeleton";
import projectDetailsBannerImage from "@/assets/images/project_details_portfolio_banner_image.jpg";
import projectDetailsUserImage from "@/assets/images/project_details_portfolio_user_image.jpg";
import SanitizedText from "../common/SanitizedText";
import { FaPhone } from "react-icons/fa6";
import { IoMailOutline } from "react-icons/io5";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const ProfessionalProfileHeader = () => {
  const { userProfile, loadingProfile } = useAppSelector((state) => state.user);
  const [profileImageSrc, setProfileImageSrc] = useState<
    string | StaticImageData | null
  >(null);
  const memberSinceText = userProfile?.createdAt
    ? `${t("projectDetailProfessionalProfileConstants.memberSince")} ${getYear(
        userProfile.createdAt
      )}`
    : commonLabels.noDataDash;

  const professionalProfileStats = getProfessionalProfileStatsConfig(
    userProfile?.completedProjectCount || 0,
    userProfile?.averageRating || 0,
    userProfile?.totalReviewCount || 0,
    t
  );

  const primaryInfoItems = [
    {
      id: 1,
      icon: <LocationPinIcon />,
      text: userProfile?.address?.postalAddress?.postPlace || commonLabels.norway,
    },
    {
      id: 2,
      icon: <CalendarIcon />,
      text: memberSinceText || commonLabels.noDataDash,
    },
  ];

  const contactInfoItems = [
    {
      id: 1,
      icon: <IoMailOutline/>,
      text: userProfile?.phone_number || commonLabels.noDataDash,
    },
    {
      id: 2,
      icon: <FaPhone className="font-light" />,
      text: userProfile?.email || commonLabels.noDataDash,
    },
  ];

  useEffect(() => {
    if (loadingProfile) return;

    const imageSrc = handleImagePreview({
      imagePath: userProfile?.profile_image,
    });

    if (imageSrc) {
      setProfileImageSrc(imageSrc);
    } else {
      setProfileImageSrc(projectDetailsUserImage);
    }
  }, [loadingProfile, userProfile]);
  if (loadingProfile) {
    return <BaseSkeleton width="100%" height="200px" count={10} gap="5px" />;
  }

  return (
    <div className="bg-white rounded-[16px]">
      <div className="relative w-full h-[200px] md:h-[300px] rounded-t-[16px] overflow-hidden mb-[-60px] md:mb-[-80px]">
        <Image
          src={projectDetailsBannerImage}
          alt={t("projectDetailProfessionalProfileConstants.bannerImageAlt")}
          fill
          className="object-cover"
        />
      </div>
      <div className="xl:flex xl:gap-[26px]">
        <div className="relative ml-[20px] md:ml-[60px] z-10">
          <div className="relative w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full border-solid border-[6px] border-white overflow-hidden">
            {profileImageSrc === null ? (
              <BaseSkeleton width="100%" height="100%" shape="circle" />
            ) : (
              <Image
                src={profileImageSrc}
                alt={t(
                  "projectDetailProfessionalProfileConstants.profileImageAlt"
                )}
                fill
                className="object-cover"
                unoptimized
                onError={() => {
                  setProfileImageSrc(projectDetailsUserImage);
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col figmascreen:flex-row figmascreen:justify-between xl:mt-[80px] gap-[10px] py-[20px] figmascreen:px-[0px] px-[20px] md:px-[40px]">
          <div className="flex flex-col">
            <h1 className="text-obsidianBlack font-medium text-titleMid xl:leading-[100%] xl:tracking-[0px]">
              {userProfile?.full_name}
            </h1>

            <div className="flex flex-col xs:flex-row xs:items-center gap-[10px] xs:gap-[30px] mt-[10px] mb-[24px]">
              {primaryInfoItems?.map((item) => (
                <InfoItem key={item?.id} icon={item?.icon} text={item?.text} />
              ))}
            </div>

            <p className="text-obsidianBlack text-textBase xs:text-textMd font-light max-w-3xl xl:leading-[100%] xl:tracking-[0px]">
              <SanitizedText text={userProfile?.description} />
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mt-[30px]">
              {loadingProfile ? (
                <BaseSkeleton count={3} direction="column" gap="5px"/>
              ) : (
                professionalProfileStats?.map((stat, index) => (
                  <StatCard
                    key={index}
                    label={stat?.label}
                    value={stat?.value}
                    icon={stat?.icon}
                    valuePostfix={stat?.valuePostfix}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:mt-[30px] figmascreen:mt-[0px] figmascreen:flex-col md:gap-[30px]">
            <div className="flex flex-col gap-[20px] mt-[24px] md:mt-[0px]">
              <div className="flex flex-col xs:flex-row md:flex-col gap-[10px] xs:gap-[12px]">
                {contactInfoItems?.map((item) => (
                  <InfoItem key={item?.id} icon={item?.icon} text={item?.text} />
                ))}
              </div>
              <div>
                <BaseButton
                  className="bg-deepTeal text-white border-none rounded-[8px] px-[25px] py-[10px] font-medium text-textSm xl:leading-[100%] xl:tracking-[0px]"
                  label={t(
                    "projectDetailProfessionalProfileConstants.sendMessage"
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[24px] mt-[24px] md:mt-[0px] figmascreen:mt-[24px]">
              <div className="flex flex-col gap-[7px]">
                <h3 className="text-obsidianBlack font-light text-textSm text-opacity-40 xl:leading-[100%] xl:tracking-[0px]">
                  {t(
                    "projectDetailProfessionalProfileConstants.servicesOffered"
                  )}
                </h3>
                <div className="flex flex-wrap gap-[6px]">
                  {userProfile?.category?.map((category) => (
                    <Chip
                      key={category._id}
                      label={category.name}
                      color="bluePrimary"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-[7px]">
                <h3 className="text-obsidianBlack font-light text-textSm text-opacity-40 xl:leading-[100%] xl:tracking-[0px]">
                  {t("projectDetailProfessionalProfileConstants.workAreas")}
                </h3>
                <div className="flex flex-wrap gap-[6px]">
                  {userProfile?.county?.map((county) => (
                    <Chip
                      key={county.county_id}
                      label={county.county_name}
                      color="orangeAccent"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfileHeader;
