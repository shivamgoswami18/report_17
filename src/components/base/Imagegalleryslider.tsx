"use client";

import React, { useState } from "react";
import BaseButton from "../base/BaseButton";
import { NextImageIcon, PreviousImageIcon } from "@/assets/icons/CommonIcons";
import fallbackPng from "@/assets/images/fallBack.png";
import SafeImage from "@/components/common/SafeImage";

interface ImageGallerySliderProps {
  images: string[];
  renderImageUrl: (imagePath: string) => string | null;
  title?: string;
  imageClassName?: string;
  thumbnailClassName?: string;
}

const ImageGallerySlider: React.FC<ImageGallerySliderProps> = ({
  images,
  renderImageUrl,
  title,
  imageClassName = "",
  thumbnailClassName = "",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasImages = Array.isArray(images) && images.length > 0;
  const totalImages = images.length;

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev < totalImages - 1 ? prev + 1 : prev));
  };

  const goToImage = (index: number) => {
    setActiveIndex(index);
  };

  if (!hasImages) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="relative w-full max-w-[900px] bg-graySoft bg-opacity-30 rounded-[10px] overflow-hidden flex items-center justify-center">
          <SafeImage
            src={fallbackPng}
            fallbackSrc={fallbackPng}
            alt={title || "Fallback project image"}
            width={900}
            height={500}
            className={`w-full h-auto max-h-[60vh] object-contain ${imageClassName}`}
            unoptimized
          />
        </div>
      </div>
    );
  }

  const currentImageUrl = renderImageUrl(images[activeIndex]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full bg-graySoft bg-opacity-30 rounded-[10px] overflow-hidden">
        <div className="relative w-full flex items-center justify-center">
          {currentImageUrl ? (
            <SafeImage
              src={currentImageUrl}
              fallbackSrc={fallbackPng}
              alt={title || "Project image"}
              width={900}
              height={500}
              className={`w-full h-auto max-h-[60vh] object-contain ${imageClassName}`}
              unoptimized
            />
          ) : (
            <SafeImage
              src={fallbackPng}
              fallbackSrc={fallbackPng}
              alt={title || "Fallback project image"}
              width={900}
              height={500}
              className={`w-full h-auto max-h-[60vh] object-contain ${imageClassName}`}
              unoptimized
            />
          )}

          {totalImages > 1 && (
            <>
              <BaseButton
                onClick={goToPrevious}
                disabled={activeIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-obsidianBlack bg-opacity-70 hover:bg-opacity-90 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed border-none p-0"
              >
                <PreviousImageIcon />
              </BaseButton>

              <BaseButton
                onClick={goToNext}
                disabled={activeIndex === totalImages - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-obsidianBlack bg-opacity-70 hover:bg-opacity-90 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed border-none p-0"
              >
                <NextImageIcon />
              </BaseButton>
            </>
          )}
        </div>
      </div>

      {totalImages > 1 && (
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {images.map((item, index) => {
              const url = renderImageUrl(item);

              return (
                <BaseButton
                  key={`${item}-${index}`}
                  onClick={() => goToImage(index)}
                  className={`w-[100px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-[6px] overflow-hidden border ${
                    index === activeIndex
                      ? "border-deepTeal"
                      : "border-graySoft border-opacity-70"
                  } bg-white flex items-center justify-center relative p-0 transition-all duration-200 hover:border-deepTeal hover:border-opacity-70 ${thumbnailClassName}`}
                >
                  {url ? (
                    <SafeImage
                      src={url}
                      fallbackSrc={fallbackPng}
                      alt={title || `Project image thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <SafeImage
                      src={fallbackPng}
                      fallbackSrc={fallbackPng}
                      alt={title || `Project image thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </BaseButton>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallerySlider;
