"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import BaseInput from "@/components/base/BaseInput";
import BaseButton from "@/components/base/BaseButton";
import { login } from "@/lib/api/AuthApi";
import {
  emailRegex,
  inputPlaceHolder,
  validationMessages,
} from "@/components/constants/Validation";
import { routePath } from "@/components/constants/RoutePath";
import {
  InputFieldMailIcon,
  InputFieldPasswordIcon,
} from "@/assets/icons/CommonIcons";
import AuthBannerImage from "@/assets/images/auth_banner_image.png";
import Image from "next/image";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectIsBusiness } from "@/lib/store/slices/authSlice";
import BaseErrorMessage from "@/components/base/BaseErrorMessage";
import { normalizeString } from "@/components/constants/Common";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

/* -------------------------------------------------------------------------- */
/*                            SHARED FORM LOGIC                               */
/* -------------------------------------------------------------------------- */

const useLoginForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .required(validationMessages.required(t("logInLabel.email")))
        .matches(emailRegex, validationMessages.format(t("logInLabel.email"))),
      password: Yup.string()
        .required(validationMessages.required(t("logInLabel.password"))),
    }),
    onSubmit: (values) => {
      dispatch(
        login({
          formData: {
            email: normalizeString(values.email),
            confirmPassword: values.password,
          },
          navigate: (path: string) => router.push(path),
        })
      );
    },
  });

  return { formik, loading, error, router };
};

/* -------------------------------------------------------------------------- */
/*                        VERSION 1 – ORIGINAL DESIGN                          */
/* -------------------------------------------------------------------------- */

export const LogInLegacy = () => {
  const isBusiness = useAppSelector(selectIsBusiness);
  const { formik, loading, error, router } = useLoginForm();

  const labelClassName =
    "text-stoneGray text-textSm fullhd:text-titleSm mb-[4px] xl:leading-[20px] space-y-[12px] xl:tracking-[0%]";
  const className =
    "font-light text-textBase fullhd:text-titleSm placeholder:fullhd:text-titleSm px-[38px] text-obsidianBlack rounded-[8px] py-[12px] border border-lightGrayGamma focus:ring-0 placeholder:text-stoneGray placeholder:text-opacity-50 placeholder:text-textSm placeholder:font-light xl:placeholder:[line-height:20px] xl:placeholder:tracking-[0%] xl:leading-[20px] xl:tracking-[0%]";

  return (
    <div className="bg-cyanGradient rounded-2xl md:min-h-screen fullhd:min-h-[90vh] flex flex-col justify-center items-center">
      <div className="max-w-container mx-auto flex items-center justify-center px-2 lg-px-[20px] py-10 lg:justify-between figmascreen:gap-[150px] widescreen:gap-[240px] gap-[40px]">
        <div className="hidden lg:flex items-center justify-center xl:px-[70px] desktop:px-[100px] desktop:py-[30px] figmascreen::pl-[171px] figmascreen:pt-[166px] figmascreen:pb-[122px]">
          <Image
            src={AuthBannerImage}
            alt={t("logInPageConstants.authPageImageAlt")}
          />
        </div>

        <div className="flex flex-col items-center justify-center xl:px-[50px] desktop:py-[35px] desktop:px-[70px] figmascreen:py-[192px] figmascreen:pr-[101px]">
          <div className="bg-white px-[30px] py-[30px] rounded-[16px] xl:min-w-[400px] desktop:min-w-[460px] fullhd:min-w-[560px]">
            <div className="mb-[30px]">
              <p className="text-textMd md:text-titleMid text-obsidianBlack font-bold mb-[24px]">
                {t("logInPageConstants.logo")}
              </p>
              <p className="text-textLg md:text-titleXxlPlusPlus text-obsidianBlack font-bold mb-[3px]">
                {isBusiness
                  ? t("logInPageConstants.loginAsProfessional")
                  : t("logInPageConstants.logIntoYourAccount")}
              </p>
              <p className="text-textSm text-obsidianBlack text-opacity-50">
                {isBusiness
                  ? t("logInPageConstants.loginToBrowseProjectsAndManageOffers")
                  : t("logInPageConstants.enterYourEmailAndPasswordToLogIn")}
              </p>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="space-y-[14px] mb-[25px]">
                <BaseInput
                  label={t("logInLabel.email")}
                  name="email"
                  type="email"
                  placeholder={inputPlaceHolder(t("logInLabel.email"))}
                  icon={<InputFieldMailIcon />}
                  onChange={formik.handleChange}
                  lowercase
                  handleBlur={formik.handleBlur}
                  value={formik.values.email}
                  error={formik.errors.email}
                  touched={formik.touched.email}
                  disabled={loading}
                  fullWidth
                  labelClassName={labelClassName}
                  className={className}
                />

                <BaseInput
                  label={t("logInLabel.password")}
                  name="password"
                  type="password"
                  placeholder={inputPlaceHolder(t("logInLabel.password"))}
                  icon={<InputFieldPasswordIcon />}
                  onChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  value={formik.values.password}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  disabled={loading}
                  fullWidth
                  labelClassName={labelClassName}
                  className={className}
                />

                <div className="flex items-center justify-end">
                  <BaseButton
                    onClick={() => router.push(routePath.forgotPassword)}
                    className="text-textSm bg-transparent border-none p-0"
                    label={t("logInPageConstants.forgotPassword")}
                  />
                </div>
              </div>

              <BaseErrorMessage error={error} />

              <BaseButton
                type="submit"
                disabled={loading}
                loader={loading}
                className="w-full bg-deepTeal text-white rounded-lg border-0 py-[13px]"
                label={t("logInPageConstants.logIn")}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        VERSION 2 – MINIMAL UI DESIGN                        */
/* -------------------------------------------------------------------------- */

export const LogInMinimal = () => {
  const isBusiness = useAppSelector(selectIsBusiness);
  const { formik, loading, error, router } = useLoginForm();

  const labelClassName =
    "text-stoneGray text-textSm mb-[4px] xl:leading-[20px] space-y-[12px] xl:tracking-[0%]";
  const className =
    "font-light text-textBase px-[38px] text-obsidianBlack rounded-[8px] py-[12px] border border-lightGrayGamma focus:ring-0 placeholder:text-stoneGray placeholder:text-opacity-50 placeholder:text-textSm";

  return (
    <div className="bg-gradient-to-br rounded-md from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-container w-full flex items-center justify-center lg:justify-between gap-16">

        {/* Left Image */}
        <div className="hidden lg:flex items-center justify-center">
          <Image
            src={AuthBannerImage}
            alt={t("logInPageConstants.authPageImageAlt")}
            className="ml-20 h-[450px] w-[400px]"
          />
        </div>

        {/* Right Card */}
        <div className="flex mt-5 flex-col items-center justify-center w-full max-w-md">
          <div className="bg-white w-full px-8 py-10 rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] border border-slate-100">

            <div className="mb-8 text-center">
              <p className="text-sm tracking-widest uppercase text-slate-400 mb-2">
                {t("logInPageConstants.logo")}
              </p>
              <p className="text-2xl font-semibold text-slate-900 mb-1">
                {isBusiness
                  ? t("logInPageConstants.loginAsProfessional")
                  : t("logInPageConstants.logIntoYourAccount")}
              </p>
              <p className="text-sm text-slate-500">
                {isBusiness
                  ? t("logInPageConstants.loginToBrowseProjectsAndManageOffers")
                  : t("logInPageConstants.enterYourEmailAndPasswordToLogIn")}
              </p>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="space-y-5 mb-6">
                <BaseInput
                  label={t("logInLabel.email")}
                  name="email"
                  type="email"
                  placeholder={inputPlaceHolder(t("logInLabel.email"))}
                  icon={<InputFieldMailIcon />}
                  onChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  value={formik.values.email}
                  error={formik.errors.email}
                  touched={formik.touched.email}
                  disabled={loading}
                  fullWidth
                  labelClassName={labelClassName}
                  className={className}
                />

                <BaseInput
                  label={t("logInLabel.password")}
                  name="password"
                  type="password"
                  placeholder={inputPlaceHolder(t("logInLabel.password"))}
                  icon={<InputFieldPasswordIcon />}
                  onChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  value={formik.values.password}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  disabled={loading}
                  fullWidth
                  labelClassName={labelClassName}
                  className={className}
                />

                <div className="flex justify-end">
                  <BaseButton
                    onClick={() => router.push(routePath.forgotPassword)}
                    className="text-sm text-slate-500 bg-transparent border-none p-0"
                    label={t("logInPageConstants.forgotPassword")}
                  />
                </div>
              </div>

              <BaseErrorMessage error={error} />

              <BaseButton
                type="submit"
                disabled={loading}
                loader={loading}
                className="w-full bg-deepTeal hover:bg-teal-700 text-white rounded-lg py-3 font-medium text-sm"
                label={t("logInPageConstants.logIn")}
              />
            </form>
          </div>

          <div className="flex justify-center items-center mt-6 gap-1">
            <p className="text-slate-500 text-sm">
              {t("logInPageConstants.doNotHaveAnAccount")}
            </p>
            <BaseButton
              onClick={() => router.push(routePath.register)}
              className="text-deepTeal text-sm font-medium bg-transparent border-none p-0 hover:underline"
              label={
                isBusiness
                  ? t("logInPageConstants.registerAsProfessional")
                  : t("logInPageConstants.registerNow")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         DEFAULT EXPORT (CHOOSE ONE)                         */
/* -------------------------------------------------------------------------- */

// Change this to switch designs
const LogIn = LogInMinimal; // or LogInLegacy

export default LogIn;
