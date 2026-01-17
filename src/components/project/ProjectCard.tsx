"use client";

import { LocationIcon } from "@/assets/icons/CommonIcons";
import React from "react";
import SanitizedText from "../common/SanitizedText";
import { commonLabels } from "../constants/Common";
import { ProjectCardProps } from "@/types/project";
import { getTranslationSync } from "@/i18n/i18n";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project_id,
  category,
  description,
  location,
  timestamp,
  isLast = false,
  status,
  title,
  disabled = false,
  offered = false,
}) => {
  const getStatusColor = (status?: string) => {
    if (status === commonLabels?.publishedValue) {
      return "bg-goldenYellow bg-opacity-10 text-saffronYellow";
    }
    if (status === commonLabels?.assignedValue) {
      return "bg-vividBlue bg-opacity-10 text-vividBlue";
    }
    if (status === commonLabels?.completedValue) {
      return "bg-emrladGreen bg-opacity-10 text-emrladGreen";
    }
    if (status === commonLabels?.cancelledValue) {
      return "bg-stoneGray bg-opacity-10 text-stoneGray";
    }
    return "";
  };

  const formatStatusLabel = (value?: string | null) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <div
      className={`${
        isLast
          ? ""
          : "border-solid border-0 border-b border-obsidianBlack border-opacity-5"
      } ${
        disabled
          ? "cursor-not-allowed"
          : "cursor-pointer transition-colors duration-300 ease-in-out hover:bg-deepTeal hover:bg-opacity-5"
      } pt-[24px] px-[10px] sm:px-[16px] pb-[20px]`}
    >
      <div className="flex flex-col">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-[5px]">
          <div className="flex gap-[10px] flex-wrap">
            <h3 className="text-obsidianBlack text-textMd font-light xl:leading-[100%] xl:tracking-[0px]">
              {title}
            </h3>
            {status && (
              <p
                className={`inline-flex items-center justify-center px-[8px] py-[2px] rounded-[6px] text-mini xl:leading-[100%] xl:tracking-[0px] font-medium ${getStatusColor(
                  status
                )}`}
              >
                {formatStatusLabel(status)}
              </p>
            )}
            {offered && (
              <div className="inline-flex items-center justify-center rounded-[14px] px-[8px] py-[2px] text-mini xl:leading-[100%] xl:tracking-[0px] font-medium bg-vividBlue bg-opacity-10 text-vividBlue">
                {t("projectDetailsPageConstants.applied")}
              </div>
            )}
          </div>
          <p className="text-obsidianBlack text-textSm text-opacity-70 font-light xl:leading-[100%] xl:tracking-[0px]">
            {timestamp}
          </p>
        </div>
        <p className="text-obsidianBlack text-textSm text-opacity-70 mt-[5px] mb-[6px] font-light xl:leading-[100%] xl:tracking-[0px]">
          {category}
          {project_id && (
            <span className="ml-[8px]">
              ({project_id})
            </span>
          )}
        </p>
        <p className="max-w-[540px] text-obsidianBlack text-textSm text-opacity-50 font-light xl:leading-[100%] xl:tracking-[0px]">
          <SanitizedText text={description} />
        </p>
        <p className="mt-[10px] flex items-center gap-[6px]">
          <LocationIcon />{" "}
          <span className="text-obsidianBlack text-textSm text-opacity-30 font-light xl:leading-[12px] xl:tracking-[0%]">
            {" "}
            {location}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;
export type { ProjectCardProps } from "@/types/project";
