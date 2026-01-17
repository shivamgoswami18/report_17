"use client";

import React from "react";
import BaseModal from "../base/BaseModal";
import BaseButton from "../base/BaseButton";
import { CloseIcon } from "@/assets/icons/CommonIcons";
import ImageGallerySlider from "../base/Imagegalleryslider";
import { getTranslationSync } from "@/i18n/i18n";
import { handleImagePreview } from "@/components/constants/Common";

const t = (key: string, params?: Record<string, string>) =>
  getTranslationSync(key, params);

interface ProjectImagesModalProps {
  visible: boolean;
  onHide: () => void;
  images: string[];
  title?: string;
  project_id?: string;
}

const ProjectImagesModal: React.FC<ProjectImagesModalProps> = ({
  visible,
  onHide,
  images,
  title,
  project_id,
}) => {
  const headerContent = (
    <div className="px-[16px] sm:px-[20px] pt-[16px] sm:pt-[20px] flex items-center justify-between w-full">
      <h2 className="text-obsidianBlack text-textBase sm:text-textLg font-light xl:leading-[100%] xl:tracking-[0px]">
        {t("projectDetailsPageConstants.infoCardimagesAttached")} {" "}
        {project_id && (
          <>
            - {t("projectDetailsPageConstants.projectNumberPrefix")} {" "}
            {project_id}
          </>
        )}
      </h2>
      <BaseButton onClick={onHide} className="bg-transparent border-none">
        <CloseIcon className="text-obsidianBlack opacity-30" />
      </BaseButton>
    </div>
  );

  return (
    <BaseModal
      visible={visible}
      onHide={onHide}
      header={headerContent}
      footer={null}
      maxWidth="900px"
      className="w-full"
      showCloseIcon={true}
    >
      <div className="p-[16px] sm:p-[20px]">
        <ImageGallerySlider
          images={images}
          renderImageUrl={(imagePath) => handleImagePreview({ imagePath })}
          title={title}
        />
      </div>
    </BaseModal>
  );
};

export default ProjectImagesModal;