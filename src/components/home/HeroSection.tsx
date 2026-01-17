import Link from "next/link";
import BaseButton from "../base/BaseButton";
import { getTranslationSync } from "@/i18n/i18n";
import BecomeAProfessionalButton from "./BecomeAProfessionalButton";
import { HOME_PAGE_STATS } from "@/lib/api/ApiRoutes";
import { get } from "@/lib/api/ServerApiService";
import { routePath } from "../constants/RoutePath";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import heavy animation components for better performance
const AnimatedOrbit = dynamic(() => import("./AnimatedOrbit"), {
  // ssr: false,
  // loading: () => <div className="w-[500px] h-[500px] animate-pulse bg-gray-200 rounded-full" />
});

const AnimatedParticles = dynamic(() => import("./AnimatedParticles"), {
  // ssr: false,
});

interface HomePageStats {
  completedProjects?: number;
  averageRating?: number;
}

const HeroSection = async () => {
  const t = (key: string, params?: Record<string, string>) => {
    return getTranslationSync(key, params);
  };

  let stats: HomePageStats = {
    completedProjects: undefined,
    averageRating: undefined,
  };

  try {
    const response = await get<HomePageStats>(HOME_PAGE_STATS, {
      cache: "no-store",
    });

    if (response.data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stats = {
        completedProjects:
          response.data.completedProjects ?? stats.completedProjects,
        averageRating: response.data.averageRating ?? stats.averageRating,
      };
    }
  } catch (error) {
    console.error("Failed to fetch home page stats", error);
  }

  return (
    <div className="w-full pt-10 bg-gradient-to-br from-aquaMist via-white to-teal-50 pb-[50px] md:pb-0 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative w-full mx-auto max-w-container flex flex-col xl:flex-row items-center justify-between p-[20px] xs:p-[40px] md:px-[80px] md:py-[50px] desktop:px-[152px] desktop:py-[77px]">
        {/* Left Content */}
        <div className="relative flex flex-col w-full xl:max-w-[50%] z-10">
          <div className="relative">
            {/* Floating badges animation */}
            <div className="absolute -top-6 -left-6">
              <div className="relative">
                <div className="absolute inset-0 bg-deepTeal rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            <h1 className="relative text-titleMid xxs:text-titleXl sm:text-titleXxl md:text-titleXxlPlus xl:text-titleHuge font-bold text-obsidianBlack xl:leading-[72px] xl:tracking-[-1px] animate-fade-in-up">
              {t("homePageConstants.findTrustedProfessionals")}
            </h1>
          </div>

          <p className="text-textBase sm:text-textMd md:text-textLg font-extraLight text-obsidianBlack my-[10px] xl:mt-[34px] xl:mb-[42px] xl:leading-[32px] tracking-[0px] animate-fade-in-up animation-delay-200">
            {t("homePageConstants.projectDescription")}
          </p>

          {/* Stats with animation */}
          
          <div className="flex flex-col xs:flex-row gap-[10px] xs:gap-[24px] animate-fade-in-up animation-delay-600">
            <Link href={routePath.createProjectSelectService}>
              <BaseButton
                label={t("homePageConstants.postAProjectFree")}
                className="
                  relative group overflow-hidden
                  text-textSm sm:text-textBase font-medium 
                  bg-gradient-to-r from-deepTeal via-teal-500 to-teal-600
                  border-none cursor-pointer text-white rounded-[12px] 
                  py-[18px] px-[25px] sm:px-[30px] xl:leading-[24px]
                  tracking-[0px] w-full xs:w-auto items-center justify-center

                  shadow-[0_10px_30px_rgba(13,148,136,0.35)]
                  transition-all duration-500 ease-out

                  hover:-translate-y-1.5 hover:scale-[1.03]
                  hover:shadow-[0_20px_50px_rgba(13,148,136,0.55)]

                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
                  before:translate-x-[-120%] before:skew-x-[-20deg]
                  before:transition-transform before:duration-700
                  group-hover:before:translate-x-[120%]"
              />
            </Link>

            <BecomeAProfessionalButton
              label={t("homeHeaderConstants.becomeAProfessional")}
              className="
                relative group overflow-hidden
                text-textSm sm:text-textBase font-medium 
                bg-white
                border-none cursor-pointer text-deepTeal rounded-[12px] 
                py-[18px] px-[25px] sm:px-[30px] xl:leading-[24px]
                tracking-[0px] w-full xs:w-auto items-center justify-center

                shadow-[0_10px_30px_rgba(13,148,136,0.15)]
                transition-all duration-500 ease-out

                hover:-translate-y-1.5 hover:scale-[1.03]
                hover:shadow-[0_20px_50px_rgba(13,148,136,0.25)]

                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
                before:translate-x-[-120%] before:skew-x-[-20deg]
                before:transition-transform before:duration-700
                group-hover:before:translate-x-[120%]"
            />
          </div>

        </div>

        {/* Right Animated Graphics */}
        <div className="relative w-full xl:max-w-[50%] flex justify-center xl:justify-end items-center mt-[50px] xl:mt-0">
          <div className="relative w-full max-w-[600px] h-[500px] xl:h-[600px]">
            <Suspense fallback={<div className="w-full h-full bg-gray-100 rounded-3xl animate-pulse" />}>
              {/* Main animated container */}
              <div className="relative w-full h-full">
                {/* Orbital animation */}
                <AnimatedOrbit />
                
                {/* Floating particle system */}
                <AnimatedParticles count={20} />
                
                {/* Central glowing element */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-deepTeal to-teal-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-32 h-32 bg-gradient-to-br from-deepTeal via-teal-400 to-teal-300 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                      <div className="relative text-white font-bold text-2xl animate-pulse">
                        ✓
                      </div>
                    </div>
                    
                    {/* Orbiting elements */}
                    <div className="absolute -top-12 -left-12 animate-float">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-100">
                        <span className="text-deepTeal text-[2rem] font-bold">👷</span>
                      </div>
                    </div>
                    <div className="absolute -top-12 -right-12 animate-float animation-delay-1000">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-100">
                        <span className="text-deepTeal text-[2rem] font-bold">🏠</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-12 -left-12 animate-float animation-delay-2000">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-100">
                        <span className="text-deepTeal text-[2rem] font-bold">🔧</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-12 -right-12 animate-float animation-delay-3000">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-teal-100">
                        <span className="text-deepTeal text-[2rem] font-bold">🎨</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Data flow lines */}
                <div className="absolute inset-0">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-deepTeal/30 to-transparent"
                      style={{
                        top: `${25 * (i + 1)}%`,
                        animation: `flow 3s ease-in-out infinite ${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;