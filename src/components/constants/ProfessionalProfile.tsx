import {
  ProjectDetailPortfolioCheckmarkIcon,
  ProjectDetailPortfolioStarIcon,
  ProjectDetailPortfolioReviewIcon,
  StarIcon,
} from "@/assets/icons/CommonIcons";
import { ReactNode } from "react";
interface ProfessionalProfileStatConfig {
  label: string;
  value: number;
  icon: ReactNode;
  valuePostfix?: ReactNode;
}

export const getProfessionalProfileStatsConfig = (
  completedJobs: number,
  averageRating: number,
  totalReviews: number,
  t: (key: string, params?: Record<string, string>) => string
): ProfessionalProfileStatConfig[] => {
  return [
    {
      label: t("projectDetailProfessionalProfileConstants.completedJobs"),
      value: completedJobs,
      icon: <ProjectDetailPortfolioCheckmarkIcon />,
    },
    {
      label: t("projectDetailProfessionalProfileConstants.averageRating"),
      value: averageRating,
      icon: <ProjectDetailPortfolioStarIcon />,
      valuePostfix: <StarIcon className="w-[16px] h-[16px]" />,
    },
    {
      label: t("projectDetailProfessionalProfileConstants.totalReviews"),
      value: totalReviews,
      icon: <ProjectDetailPortfolioReviewIcon />,
    },
  ];
};
