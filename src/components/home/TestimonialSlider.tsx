"use client";

import { useState } from "react";
import BaseSlider from "@/components/base/BaseSlider";
import StarRating from "@/components/common/StarRating";
import SafeImage from "@/components/common/SafeImage";
import type { Testimonial } from "./WhatCustomersSaySection";

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

const TestimonialSlider = ({ testimonials }: TestimonialSliderProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <BaseSlider
      items={testimonials}
      onItemHover={setHoveredIndex}
      itemClassName="xxs:px-[12px] pb-[20px]"
      renderItem={(testimonial: Testimonial, index: number) => {
        const isHovered = hoveredIndex === index;

        return (
          <div
            className={`
              relative h-full rounded-2xl p-[14px] md:p-[20px] xl:p-[28px]
              bg-white/80 backdrop-blur-md
              border border-black/5
              transition-all duration-300 ease-out
            `}
          >
            {/* Rating */}
            <div className="mb-[10px] md:mb-[14px]">
              <StarRating rating={testimonial?.rating} />
            </div>

            {/* Text */}
            <p className="text-textSm md:text-textBase xl:text-textLg font-light text-obsidianBlack leading-relaxed md:leading-[28px] xl:leading-[32px] opacity-90 mb-[20px] md:mb-[36px]">
              {testimonial?.text}
            </p>

            {/* User */}
            <div className="flex items-center gap-[12px]">
              {testimonial?.imageUrl && (
                <SafeImage
                  src={testimonial.imageUrl}
                  alt={testimonial.name}
                  width={60}
                  height={60}
                  className="w-[32px] h-[32px] md:w-[42px] md:h-[42px] xl:w-[56px] xl:h-[56px] rounded-full object-cover border border-black/5"
                  unoptimized
                />
              )}

              <div className="flex flex-col">
                <p className="text-textBase lg:text-textLg font-medium text-obsidianBlack leading-none">
                  {testimonial?.name}
                </p>
                <p className="text-textSm lg:text-textBase font-light text-obsidianBlack/50 leading-none mt-[4px]">
                  {testimonial?.date}
                </p>
              </div>
            </div>

            {/* Subtle hover accent */}
            <span
              className={`
                pointer-events-none absolute inset-0 rounded-2xl
                transition-opacity duration-300
                ${isHovered ? "opacity-100" : "opacity-0"}
              `}
              style={{
                background:
                  "linear-gradient(180deg, rgba(16,138,0,0.06) 0%, rgba(16,138,0,0) 60%)",
              }}
            />
          </div>
        );
      }}
    />
  );

};

export default TestimonialSlider;
