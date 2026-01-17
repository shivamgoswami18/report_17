"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import BaseInput from "@/components/base/BaseInput";
import BaseSearchOptions, {
  SuggestionItem,
} from "@/components/base/BaseSearchOptions";
import BaseButton from "@/components/base/BaseButton";
import BaseCheckbox from "@/components/base/BaseCheckbox";
import {
  fetchCounties,
  fetchServiceCategories,
  register,
  searchBusiness,
  validateBusiness,
} from "@/lib/api/AuthApi";
import {
  emailRegex,
  inputPlaceHolder,
  phoneRegex,
  validationMessages,
  passwordRegex,
} from "@/components/constants/Validation";
import { routePath } from "@/components/constants/RoutePath";
import {
  InputFieldMailIcon,
  InputFieldUserIcon,
  InputFieldBusinessIcon,
  InputFieldPhoneIcon,
  HowItWorksArrowRightIcon,
  InputFieldPasswordIcon,
} from "@/assets/icons/CommonIcons";
import AuthBannerImage from "@/assets/images/auth_banner_image.png";
import Image from "next/image";
import { getTranslationSync } from "@/i18n/i18n";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectIsBusiness, setRole } from "@/lib/store/slices/authSlice";
import { commonLabels } from "@/components/constants/Common";
import BaseErrorMessage from "@/components/base/BaseErrorMessage";
import { useEffect, useState } from "react";
import BaseModal from "@/components/base/BaseModal";

export interface ServiceCategory {
  _id: string;
  name: string;
}
export interface Area {
  _id: string;
  name: string;
}

const Register = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const isBusiness = useAppSelector(selectIsBusiness);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showNextModal, setShowNextModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [allServiceCategories, setAllServiceCategories] = useState<
    ServiceCategory[]
  >([]);
  const [counties, setCounties] = useState<Area[]>([]);
  const [allCounties, setAllCounties] = useState<Area[]>([]);
  const [businessSuggestions, setBusinessSuggestions] = useState<
    { value: string; label: string; organizationNumber: string }[]
  >([]);
  const [businessSearchLoading, setBusinessSearchLoading] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [countySearchQuery, setCountySearchQuery] = useState("");

  const t = (key: string, params?: Record<string, string>) => {
    return getTranslationSync(key, params);
  };

  useEffect(() => {
    dispatch(setRole(commonLabels.businessRole));
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, countiesData] = await Promise.all([
          fetchServiceCategories("", 100000),
          fetchCounties("", 100000),
        ]);
        setServiceCategories(servicesData);
        setAllServiceCategories(servicesData);
        setCounties(countiesData);
        setAllCounties(countiesData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, []);

    const handleServiceSearch = async (query: string) => {
    setServiceSearchQuery(query);
    if (!query.trim()) {
      setServiceCategories(allServiceCategories);
      return;
    }

    try {
      const filteredServices = await fetchServiceCategories(query, 100000);
      setServiceCategories(filteredServices);
    } catch (error) {
      console.error("Error searching services:", error);
    }
  };

  const handleCountySearch = async (query: string) => {
    setCountySearchQuery(query);
    if (!query.trim()) {
      setCounties(allCounties);
      return;
    }

    try {
      const filteredCounties = await fetchCounties(query, 100000);
      setCounties(filteredCounties);
    } catch (error) {
      console.error("Error searching counties:", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      businessName: "",
      email: "",
      fullName: "",
      phoneNumber: "",
      orgNo: "",
      password: "",
      confirmPassword: "",
    },

    validationSchema: Yup.object({
      name: Yup.string(),

      businessName: isBusiness
        ? Yup.string().required(
            validationMessages.required(t("registerLabel.businessName"))
          )
        : Yup.string(),

      email: Yup.string()
        .required(validationMessages.required(t("logInLabel.email")))
        .matches(emailRegex, validationMessages.format(t("logInLabel.email"))),

      fullName: Yup.string().required(
            validationMessages.required(
              t(
                "createProjectPageConstants.contactDetailsPageConstants.fullName"
              )
            )
          ),
      phoneNumber: isBusiness
        ? Yup.string()
            .required(
              validationMessages.required(t("registerLabel.phoneNumber"))
            )
            .matches(phoneRegex, t("validation.format"))
        : Yup.string(),
      orgNo: isBusiness
        ? Yup.string().required(
            validationMessages.required(t("registerLabel.orgNo"))
          )
        : Yup.string(),
      password: isBusiness
        ? Yup.string()
        : Yup.string()
            .required(
              validationMessages.required(t("registerLabel.createPassword"))
            )
            .min(
              8,
              validationMessages.passwordLength(t("logInLabel.password"), "8")
            )
            .matches(
              passwordRegex,
              validationMessages.passwordComplexity(t("logInLabel.password"))
            ),
      confirmPassword: isBusiness
        ? Yup.string()
        : Yup.string()
            .required(
              validationMessages.required(t("registerLabel.confirmPassword"))
            )
            .oneOf(
              [Yup.ref("password")],
              validationMessages.passwordsMatch(
                t("logInLabel.password"),
                t("registerLabel.confirmPassword")
              )
            ),
    }),

    onSubmit: async () => {
      if (isBusiness) {
        if (!formik.values.orgNo) {
          formik.setFieldError(
            "businessName",
            validationMessages.required(t("registerLabel.orgNo"))
          );
          return;
        }

        const validationResult = (await dispatch(
          validateBusiness({
            email: formik.values.email,
            org_no: formik.values.orgNo,
          })
        )) as { success?: boolean } | undefined;

        if (!validationResult?.success) {
          return;
        }
        setShowServiceModal(true);
      } else {
        handleCustomerRegistration();
      }
    },
  });

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleAreaSelect = (countyId: string) => {
    setSelectedCounties((prev) => {
      if (prev.includes(countyId)) {
        return prev.filter((id) => id !== countyId);
      } else {
        return [...prev, countyId];
      }
    });
  };

  const handleNext = () => {
    if (selectedServices.length > 0) {
      setShowServiceModal(false);
      setShowNextModal(true);
    }
  };

  const handleBackToService = () => {
    setShowNextModal(false);
    setShowServiceModal(true);
  };

  const handleServiceModalCancel = () => {
    setShowServiceModal(false);
    setShowCancelModal(true);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setShowCancelModal(true);
  };

  const handleCountyModalClose = () => {
    setShowNextModal(false);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    setSelectedServices([]);
    setSelectedCounties([]);
    formik.resetForm();
  };

  const handleDontCancel = () => {
    setShowCancelModal(false);
    setShowServiceModal(true);
  };

  const businessDisplayValue = formik.values.businessName
    ? formik.values.businessName +
      (formik.values.orgNo ? ` - ${formik.values.orgNo}` : "")
    : "";

  const handleCustomerRegistration = () => {
    const payload = {
      role: "customer" as const,
      customerFields: {
        full_name: formik.values.fullName,
        email: formik.values.email,
        password: formik.values.password,
        confirmPassword: formik.values.confirmPassword,
      },
    };

    dispatch(
      register({
        formData: payload,
        navigate: (path: string = routePath.dashboard) => router.push(path),
      })
    );
  };

  const handleFinalSubmit = async () => {
    const payload = {
      role: "business" as const,
      businessFields: {
        business_name: formik.values.businessName,
        full_name: formik.values.fullName,
        email: formik.values.email,
        phone_number: formik.values.phoneNumber,
        county: selectedCounties,
        org_no: formik.values.orgNo,
        category: selectedServices,
      },
    };

    const result = (await dispatch(
      register({
        formData: payload,
        navigate: (path: string = routePath.logIn) => router.push(path),
      })
    )) as unknown as { success: boolean } | undefined;

    if (result?.success) {
      setShowNextModal(false);
      setSelectedServices([]);
      setSelectedCounties([]);
      router.push(routePath.logIn);
    }
  };

  const handleBusinessSearch = async (query: string) => {
    if (!query || !query.trim()) {
      setBusinessSuggestions([]);
      return;
    }

    setBusinessSearchLoading(true);
    try {
      const results = await searchBusiness(query);
      const formattedSuggestions = results.map((business) => ({
        value: business.name,
        label: `${business.name} - ${business.organizationNumber}`,
        organizationNumber: business.organizationNumber,
      }));
      setBusinessSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Error searching business:", error);
      setBusinessSuggestions([]);
    } finally {
      setBusinessSearchLoading(false);
    }
  };

  const handleBusinessSelect = (selectedBusiness: SuggestionItem) => {
    if (selectedBusiness && typeof selectedBusiness === "object") {
      if (selectedBusiness.organizationNumber) {
        formik.setFieldValue("businessName", selectedBusiness.value || "");
        formik.setFieldValue(
          "orgNo",
          selectedBusiness.organizationNumber || ""
        );
        setBusinessSuggestions([]);
      }
    }
  };

  const labelClassName =
    "text-stoneGray text-textSm fullhd:text-titleSm mb-[4px] xl:leading-[20px] space-y-[12px] xl:tracking-[0%]";
  const className =
    "font-light text-textBase fullhd:text-titleSm placeholder:fullhd:text-titleSm px-[38px] text-obsidianBlack rounded-[8px] py-[12px] border border-lightGrayGamma focus:ring-0 placeholder:text-stoneGray placeholder:text-opacity-50 placeholder:text-textSm placeholder:font-light xl:placeholder:[line-height:20px] xl:placeholder:tracking-[0%] xl:leading-[20px] xl:tracking-[0%]";

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white min-h-screen fullhd:min-h-[90vh] flex items-center justify-center px-4">
      <div className="max-w-container w-full flex items-center justify-center lg:justify-between gap-16">
        
      <div className="hidden lg:flex items-center justify-center xl:px-[70px] desktop:px-[100px] desktop:py-[30px] figmascreen::pl-[171px] figmascreen:pt-[166px] figmascreen:pb-[122px]">
          <Image
            src={AuthBannerImage}
            alt={t("logInPageConstants.authPageImageAlt")}
          />
        </div>
     <div className="flex mt-5 flex-col items-center justify-center w-full max-w-md">
          <div className="bg-white w-full px-8 py-10 rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] border border-slate-100">
             <div className="mb-8 text-center">
              <p className="text-sm tracking-widest uppercase text-slate-400 mb-2">
                {t("logInPageConstants.logo")}
              </p>

              <p className="text-2xl font-semibold text-slate-900 mb-1">
                {isBusiness
                  ? t("logInPageConstants.registerAsProfessional")
                  : t("registerPageConstants.createYourAccount")}
              </p>

              <p className="text-sm text-slate-500">
                {t("registerPageConstants.enterYourDetailsToCreateAnAccount")}
              </p>
            </div>


            <form onSubmit={formik.handleSubmit} className="space-y-[24px]">
              {isBusiness ? (
                <>
                  <div className="relative">
                    {businessSearchLoading && (
                      <div className="absolute inset-0 z-10 bg-white bg-opacity-60" />
                    )}
                    <div
                      className={
                        businessSearchLoading ? "opacity-50" : "opacity-100"
                      }
                    >
                      <BaseSearchOptions
                        label={t("registerLabel.businessName")}
                        name="businessName"
                        placeholder={inputPlaceHolder(
                          t("registerLabel.businessName")
                        )}
                        icon={<InputFieldBusinessIcon />}
                        onChange={(value) => {
                          formik.setFieldValue("businessName", value);
                          formik.setFieldValue("orgNo", "");
                        }}
                        onSelect={handleBusinessSelect}
                        handleBlur={formik.handleBlur}
                        value={businessDisplayValue}
                        error={formik.errors.businessName}
                        touched={formik.touched.businessName}
                        disabled={loading}
                        fullWidth
                        labelClassName={labelClassName}
                        className={className}
                        suggestions={businessSuggestions}
                        onSearch={handleBusinessSearch}
                        loading={businessSearchLoading}
                        debounceDelay={500}
                        minSearchLength={1}
                        itemTemplate={(item) => (
                          <div className="flex flex-col">
                            <span className="text-obsidianBlack text-textBase font-light xl:leading-[20px] xl:tracking-[0%]">
                              {item.value}
                            </span>
                            <span className="text-obsidianBlack text-opacity-60 text-textSm font-light xl:leading-[18px] xl:tracking-[0%]">
                              {t("registerLabel.orgNo")} -{" "}
                              {item.organizationNumber}
                            </span>
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  <BaseInput
                    label={t(
                      "createProjectPageConstants.contactDetailsPageConstants.fullName"
                    )}
                    name="fullName"
                    type="text"
                    placeholder={inputPlaceHolder(
                      t(
                        "createProjectPageConstants.contactDetailsPageConstants.fullName"
                      )
                    )}
                    icon={<InputFieldUserIcon />}
                    onChange={formik.handleChange}
                    handleBlur={formik.handleBlur}
                    value={formik.values.fullName}
                    error={formik.errors.fullName}
                    touched={formik.touched.fullName}
                    disabled={loading}
                    fullWidth
                    labelClassName={labelClassName}
                    className={className}
                  />

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
                    label={t("registerLabel.phoneNumber")}
                    name="phoneNumber"
                    type="text"
                    numbersOnly
                    placeholder={inputPlaceHolder(
                      t("registerLabel.phoneNumber")
                    )}
                    icon={<InputFieldPhoneIcon />}
                    onChange={formik.handleChange}
                    handleBlur={formik.handleBlur}
                    value={formik.values.phoneNumber}
                    error={formik.errors.phoneNumber}
                    touched={formik.touched.phoneNumber}
                    disabled={loading}
                    fullWidth
                    labelClassName={labelClassName}
                    className={className}
                  />
                  <div className="pt-[8px]">
                    <BaseCheckbox
                      name="register-agree-terms-business"
                      checked={false}
                      onChange={() => {}}
                      label={t(
                        "createProjectPageConstants.contactDetailsPageConstants.agreeTermsAndCondition"
                      )}
                      labelClassName="text-textSm text-obsidianBlack xl:leading-[20px] xl:tracking-[0%]"
                      checkboxClassName="mr-[4px]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <BaseInput
                    label={t(
                      "createProjectPageConstants.contactDetailsPageConstants.fullName"
                    )}
                    name="fullName"
                    type="text"
                    placeholder={inputPlaceHolder(
                      t(
                        "createProjectPageConstants.contactDetailsPageConstants.fullName"
                      )
                    )}
                    icon={<InputFieldUserIcon />}
                    onChange={formik.handleChange}
                    handleBlur={formik.handleBlur}
                    value={formik.values.fullName}
                    error={formik.errors.fullName}
                    touched={formik.touched.fullName}
                    disabled={loading}
                    fullWidth
                    labelClassName={labelClassName}
                    className={className}
                  />

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
                    label={t("registerLabel.createPassword")}
                    name="password"
                    type="password"
                    placeholder={inputPlaceHolder(
                      t("registerLabel.createPassword")
                    )}
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

                  <BaseInput
                    label={t("registerLabel.confirmPassword")}
                    name="confirmPassword"
                    type="password"
                    placeholder={inputPlaceHolder(
                      t("registerLabel.confirmPassword")
                    )}
                    icon={<InputFieldPasswordIcon />}
                    onChange={formik.handleChange}
                    handleBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                    error={formik.errors.confirmPassword}
                    touched={formik.touched.confirmPassword}
                    disabled={loading}
                    fullWidth
                    labelClassName={labelClassName}
                    className={className}
                  />
                  <div className="pt-[8px]">
                    <BaseCheckbox
                      name="register-agree-terms-customer"
                      checked={false}
                      onChange={() => {}}
                      label={t(
                        "createProjectPageConstants.contactDetailsPageConstants.agreeTermsAndCondition"
                      )}
                      labelClassName="text-textSm text-obsidianBlack xl:leading-[20px] xl:tracking-[0%]"
                      checkboxClassName="mr-[4px]"
                    />
                  </div>
                </>
              )}
              <BaseErrorMessage error={error} />
              <BaseButton
                type="submit"
                disabled={loading}
                loader={loading}
                className="w-full mt-[25px] bg-deepTeal text-white rounded-lg border-0 py-[13px] font-medium text-textBase xl:leading-[24px] xl:tracking-[0px] fullhd:text-textLg"
                label={t("logInPageConstants.registerNow")}
              />
            </form>
          </div>
          <div className="flex justify-center items-center mt-[24px] gap-[6px]">
            <p className="text-charcoalBlack font-light text-opacity-50 text-textSm fullhd:text-titleSm xl:leading-[20px] space-y-[12px] xl:tracking-[0%]">
              {t("registerPageConstants.alreadyHaveAnAccount")}
            </p>
            <BaseButton
              onClick={() => router.push(routePath.logIn)}
              className="text-obsidianBlack text-textSm fullhd:text-titleSm font-medium bg-transparent border-none focus:ring-0 p-0 text-base xl:leading-[20px] space-y-[12px] xl:tracking-[0%]"
              label={t("logInPageConstants.logIn")}
            />
          </div>
        </div>
      </div>

      <BaseModal
        visible={showServiceModal}
        onHide={handleServiceModalClose}
        header={t("registerLabel.selectServiceCategories")}
        maxWidth="600px"
        contentClassName="py-[12px] px-[12px]"
        footerClassName="py-4 px-6"
        headerClassName="py-4 px-6 text-lg font-semibold"
        searchEnabled={true}
        searchValue={serviceSearchQuery}
        onSearchChange={handleServiceSearch}
        searchPlaceholder={t("baseTableConstants.search")}
        footer={
          <div className="flex gap-[12px] justify-between">
            <BaseButton
              label={t("commonConstants.cancel")}
              onClick={handleServiceModalCancel}
              className="bg-transparent text-obsidianBlack border border-lightGrayGamma rounded-lg px-6 py-2"
            />
            <BaseButton
              label={t("commonConstants.next")}
              onClick={handleNext}
              endIcon={<HowItWorksArrowRightIcon />}
              disabled={selectedServices.length === 0}
              className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium disabled:opacity-50"
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {serviceCategories?.map((service) => (
            <div
              key={service._id}
              onClick={() => handleServiceSelect(service._id)}
              className={`px-[12px] py-[12px] rounded-lg border-2 text-center font-medium transition-all cursor-pointer ${
                selectedServices.includes(service._id)
                  ? "border-solid border-deepTeal bg-deepTeal bg-opacity-5 text-deepTeal"
                  : "border-solid border-lightGrayGamma bg-white text-obsidianBlack hover:border-deepTeal hover:border-opacity-50"
              }`}
            >
              {service.name}
            </div>
          ))}
        </div>
      </BaseModal>

      <BaseModal
        visible={showNextModal}
        onHide={handleCountyModalClose}
        header={t("registerLabel.selectServiceAreas")}
        maxWidth="600px"
        contentClassName="py-[12px] px-[12px]"
        footerClassName="py-4 px-6"
        headerClassName="py-4 px-6 text-lg font-semibold"
        searchEnabled={true}
        searchValue={countySearchQuery}
        onSearchChange={handleCountySearch}
        searchPlaceholder={t("baseTableConstants.search")}
        footer={
          <div className="flex gap-[12px] justify-between">
            <BaseButton
              label={t("commonConstants.back")}
              onClick={handleBackToService}
              className="bg-transparent text-obsidianBlack border border-lightGrayGamma rounded-lg px-6 py-2"
            />
            <BaseButton
              label={t("commonConstants.submit")}
              onClick={handleFinalSubmit}
              disabled={selectedCounties.length === 0 || loading}
              loader={loading}
              className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium disabled:opacity-50"
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {counties?.map((area) => (
            <div
              key={area._id}
              onClick={() => handleAreaSelect(area._id)}
              className={`px-[12px] py-[12px] rounded-lg border-2 text-center font-medium transition-all cursor-pointer ${
                selectedCounties.includes(area._id)
                  ? "border-solid border-deepTeal bg-deepTeal bg-opacity-5 text-deepTeal"
                  : "border-solid border-lightGrayGamma bg-white text-obsidianBlack hover:border-deepTeal hover:border-opacity-50"
              }`}
            >
              {area.name}
            </div>
          ))}
        </div>
      </BaseModal>

      <BaseModal
        visible={showCancelModal}
        onHide={handleConfirmCancel}
        header={t("registerLabel.cancelRegistration")}
        maxWidth="500px"
        contentClassName="py-4 px-6"
        footerClassName="py-4 px-6"
        headerClassName="py-4 px-6 text-lg font-semibold"
        showCloseIcon={false}
        footer={
          <div className="flex gap-[12px] justify-between">
            <BaseButton
              label={t("registerLabel.noContinue")}
              onClick={handleDontCancel}
              className="bg-deepTeal text-white rounded-lg border-0 px-6 py-2 font-medium"
            />
            <BaseButton
              label={t("registerLabel.login")}
              onClick={() => {
                router.push(routePath.logIn);
              }}
              className="bg-whitePrimary text-bluePrimary rounded-lg border-0 px-6 py-2 font-medium"
            />
            <BaseButton
              label={t("registerLabel.yesCancel")}
              onClick={handleConfirmCancel}
              className="bg-transparent text-redPrimary border border-redPrimary rounded-lg px-6 py-2 font-medium hover:bg-red-50"
            />
          </div>
        }
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-obsidianBlack">
            {t("registerLabel.doYouWantToCancel")}
          </h3>
          <p className="text-textSm text-obsidianBlack text-opacity-70">
            {t("registerLabel.areYouSure")}
          </p>
        </div>
      </BaseModal>
    </div>
  );
};

export default Register;
