"use client";
import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import BannerImage from "@/assets/images/project_details_portfolio_banner_image.jpg";
import { getTranslationSync } from "@/i18n/i18n";
import BaseFileUpload from "../base/BaseFileUpload";

import {
  CreateProjectPlusIcon,
  InputFieldBusinessIcon,
  InputFieldMailIcon,
  InputFieldPhoneIcon,
  InputFieldUserIcon,
  LocationPinIcon,
  SaveChangesArrowIcon,
  UploadIcon,
} from "@/assets/icons/CommonIcons";
import BaseInput from "../base/BaseInput";
import BaseButton from "../base/BaseButton";
import BaseLoader from "../base/BaseLoader";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  emailRegex,
  phoneRegex,
  validationMessages,
  inputPlaceHolder,
  nonDigitsRegex,
} from "../constants/Validation";
import ServiceModal from "./ServiceModal";
import AreaModal from "./AreaModal";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  ViewProfile,
  EditProfile,
  UploadFile,
  EditProfilePayload,
} from "@/lib/api/UserApi";
import { BaseImageURL } from "@/lib/api/ApiService";
import {
  commonLabels,
  errorHandler,
  handleProfileImageChange,
  invalidImageError,
} from "@/components/constants/Common";
import { getLocation } from "@/lib/api/ProjectApi";
import { BaseCKEditor } from "../base/BaseCKEditor";
import Chip from "../project/Chip";
import { Area, ServiceCategory } from "../auth/Register";
import { fetchCounties, fetchServiceCategories } from "@/lib/api/AuthApi";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

function BusinessProfile() {
  const dispatch = useAppDispatch();
  const { profile, loadingProfile, uploadingFile } = useAppSelector(
    (state) => state.user
  );
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [services, setServices] = React.useState<string[]>([]);
  const [area, setArea] = useState<string[]>([]);
  const [initialServices, setInitialServices] = React.useState<string[]>([]);
  const [initialArea, setInitialArea] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [areaCategory, setAreaCategory] = useState<Area[]>([]);

  useEffect(() => {
    dispatch(ViewProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      formik.setValues({
        name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone_number || "",
        city: profile.address?.postalAddress?.postPlace || "",
        postalCode: profile.address?.postalAddress?.postalCode || "",
        streetAddress: profile.address?.postalAddress?.addressLine || "",
        bio: profile.description || "",
      });

      const imagePath = profile.profile_image;
      setProfileImagePath(imagePath);
      setProfileImagePreview(BaseImageURL + imagePath);

      const categoryIds = profile.category?.map((cat) => cat._id) || [];
      setServices(categoryIds);
      setInitialServices(categoryIds);

      const countyIds = profile.county?.map((c) => c.county_id) || [];
      setArea(countyIds);
      setInitialArea(countyIds);
    }
  }, [profile]);

  const handleImageChange = async (
    imageUrl: string | null,
    file: File | null
  ) => {
    if (invalidImageError(file)) return;
    await handleProfileImageChange({
      imageUrl,
      file,
      setProfileImagePath,
      setProfileImagePreview,
      upload: (uploadFile: File) => dispatch(UploadFile(uploadFile)),
      baseImageURL: BaseImageURL,
    });
  };
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await fetchServiceCategories("", 100000);
        setServiceCategories(data);
      } catch (e) {
        console.error(e);
      }
    };

    loadServices();
  }, []);
  useEffect(() => {
    const loadArea = async () => {
      try {
        const data = await fetchCounties("", 100000);
        setAreaCategory(data);
      } catch (e) {
        console.error(e);
      }
    };

    loadArea();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      streetAddress: "",
      postalCode: "",
      bio: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required(
        validationMessages.required(t("profilePageConstants.companyName"))
      ),
      email: Yup.string()
        .required(validationMessages.required(t("logInLabel.email")))
        .matches(emailRegex, validationMessages.format(t("logInLabel.email"))),
      phone: Yup.string()
        .required(validationMessages.required(t("profilePageConstants.phone")))
        .matches(
          phoneRegex,
          validationMessages.format(t("profilePageConstants.phone"))
        ),
      streetAddress: Yup.string().required(
        validationMessages.required(
          t(
            "createProjectPageConstants.projectLocationPageConstants.streetAddress"
          )
        )
      ),
      postalCode: Yup.string()
        .required(
          validationMessages.required(
            t(
              "createProjectPageConstants.projectLocationPageConstants.postalCode"
            )
          )
        )
        .min(
          4,
          validationMessages.format(
            t(
              "createProjectPageConstants.projectLocationPageConstants.postalCode"
            )
          )
        ),
      city: Yup.string().required(
        validationMessages.required(t("profilePageConstants.city"))
      ),
    }),
    onSubmit: async (values) => {
      setIsSaving(true);
      try {
        const payload: EditProfilePayload = {
          userId: profile?._id,
        };

        const initialName = profile?.full_name || "";
        const initialPhone = profile?.phone_number || "";
        const initialImage = profile?.profile_image ?? null;
        const initialDescription = profile?.description || "";
        const initialAddress = {
          city: profile?.address?.postalAddress?.postPlace || "",
          postalCode: profile?.address?.postalAddress?.postalCode || "",
          streetAddress: profile?.address?.postalAddress?.addressLine || "",
        };

        const hasAddressChanges =
          values.city !== initialAddress.city ||
          values.postalCode !== initialAddress.postalCode ||
          values.streetAddress !== initialAddress.streetAddress;

        if (values.name !== initialName) {
          payload.full_name = values.name;
        }

        if (values.phone !== initialPhone) {
          payload.phone_number = values.phone;
        }

        if (profileImagePath !== initialImage) {
          payload.profile_image = profileImagePath;
        }

        if (values.bio !== initialDescription) {
          payload.description = values.bio;
        }

        if (hasAddressChanges) {
          payload.address = {
            postalAddress: {
              postPlace: values.city,
              postalCode: values.postalCode,
              addressLine: values.streetAddress,
            },
          };
        }

        if (hasServiceChanges) {
          payload.category = services;
        }
        if (hasAreaChanges) {
          payload.county = area;
        }

        await dispatch(EditProfile({ payload }));
      } finally {
        setIsSaving(false);
      }
    },
  });

  const handleServiceChange = async (newServices: string[]) => {
    setServices(newServices);
  };

  const serviceMap = useMemo(() => {
    return serviceCategories.reduce((acc, service) => {
      acc[service._id] = service.name;
      return acc;
    }, {} as Record<string, string>);
  }, [serviceCategories]);
  const areaMap = useMemo(() => {
    return areaCategory.reduce((acc, county) => {
      acc[county._id] = county.name;
      return acc;
    }, {} as Record<string, string>);
  }, [areaCategory]);

  const handleAreaSave = async (newAreas: string[]) => {
    setArea(newAreas);
  };
  const handlePostalCodeBlur = async (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    formik.handleBlur(e);
    const postalCode = formik.values.postalCode.trim();

    if (postalCode.length === 4) {
      try {
        const locationData = await dispatch(getLocation(postalCode));
        if (locationData?.county) {
          formik.setFieldValue("city", locationData.county, true);
        } else {
          formik.setFieldValue("city", "");
        }
      } catch (error) {
        errorHandler(error);
      }
    }
  };
  const handlePostalCodeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const onlyDigits = e.target.value.replace(nonDigitsRegex, "").slice(0, 4);
    formik.setFieldValue("postalCode", onlyDigits);
  };

  const initialName = profile?.full_name || "";
  const initialEmail = profile?.email || "";
  const initialPhone = profile?.phone_number || "";
  const initialImage = profile?.profile_image ?? null;
  const initialCity = profile?.address?.postalAddress?.postPlace || "";
  const initialPostalCode = profile?.address?.postalAddress?.postalCode || "";
  const initialStreet = profile?.address?.postalAddress?.addressLine || "";
  const initialBio = profile?.description || "";

  const hasServiceChanges =
    JSON.stringify([...services].sort()) !==
    JSON.stringify([...initialServices].sort());
  const hasAreaChanges =
    JSON.stringify([...area].sort()) !==
    JSON.stringify([...initialArea].sort());
  const hasAtLeastOneServiceOrArea = services.length > 0 && area.length > 0;

  const hasChanges =
    hasAtLeastOneServiceOrArea &&
    (formik.values.name !== initialName ||
      formik.values.email !== initialEmail ||
      formik.values.phone !== initialPhone ||
      formik.values.city !== initialCity ||
      formik.values.postalCode !== initialPostalCode ||
      formik.values.streetAddress !== initialStreet ||
      formik.values.bio !== initialBio ||
      profileImagePath !== initialImage ||
      hasServiceChanges ||
      hasAreaChanges);

  const labelClassName =
    "text-stoneGray text-textSm mb-[4px] xl:leading-[20px] xl:tracking-[0%]";
  const inputClassName =
    "font-light text-textBase px-[38px] text-obsidianBlack rounded-[8px] py-[12px] border border-lightGrayGamma focus:ring-0 placeholder:text-obsidianBlack placeholder:text-opacity-30 placeholder:text-textSm placeholder:font-light xl:placeholder:[line-height:20px] xl:placeholder:tracking-[0%] xl:leading-[20px] xl:tracking-[0%]";

  if (loadingProfile) {
    return (
      <div className="rounded-[16px] bg-white shadow-[0px_8px_16px_0px_#108A0008] p-[20px] md:p-[40px] lg:p-[76px]">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <BaseLoader size="xl" className="mx-auto text-deepTeal" />
          </div>
        </div>
      </div>
    );
  }

  const handleRemoveService = (serviceId: string) => {
    setServices((prev) => prev.filter((id) => id !== serviceId));
  };

  const handleRemoveArea = (areaId: string) => {
    setArea((prev) => prev.filter((id) => id !== areaId));
  };

  return (
    <div className="rounded-[16px] bg-white shadow-[0px_8px_16px_0px_#108A0008] overflow-hidden">
      <div className="relative w-full">
        <div className="relative w-full h-[200px] rounded-t-[16px] overflow-hidden">
          <Image
            src={BannerImage}
            alt={t("projectDetailProfessionalProfileConstants.bannerImageAlt")}
            fill
            className="object-cover"
          />
          <div className="absolute top-[14px] right-[14px] bg-opacity-95 inline-flex px-[12px] py-[4px] bg-white text-deepTeal font-medium text-textBase xl:leading-[100%] xl:tracking-[0px] rounded-[8px]">
            {t("profilePageConstants.shareProfile")}
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-[200px] rounded-[60px] overflow-hidden -translate-y-1/2 z-10 border-solid border-white">
          <BaseFileUpload
            name="profileImage"
            accept="image/*"
            customUI={true}
            imagePreview={profileImagePreview}
            onImageChange={handleImageChange}
            containerClassName="relative w-[100px] h-[100px] lg:w-[114px] lg:h-[114px] bg-offWhite border-solid border border-lightGrayGamma overflow-visible"
            uploadPlaceholder={
              <div className="w-full h-full flex flex-col items-center justify-center">
                {uploadingFile ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deepTeal"></div>
                ) : (
                  <>
                    <UploadIcon className="text-stoneGray mb-[14px]" />
                    <span className="text-stoneGray text-textSm font-light xl:leading-[20px] xl:tracking-[0%]">
                      {t("profilePageConstants.upload")}
                    </span>
                  </>
                )}
              </div>
            }
            editButtonLabel={t("profilePageConstants.edit")}
            editButtonClassName="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0 text-white bg-obsidianBlack bg-opacity-75 text-textSm border-none rounded-t-[0px] rounded-b-[8px] font-light xl:leading-[20px] xl:tracking-[0%] w-[100px] h-[28px] px-2 py-1 cursor-pointer hover:bg-opacity-90 transition-all"
            showEditButton={true}
          />
        </div>
      </div>
      <div className="p-[20px] md:p-[40px] lg:p-[76px] mt-[33px]">
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
            <div className="space-y-[20px]">
              <BaseInput
                label={t("registerLabel.businessName")}
                name="business_name"
                type="text"
                placeholder={inputPlaceHolder(t("registerLabel.businessName"))}
                icon={<InputFieldBusinessIcon />}
                value={profile?.business_name || commonLabels.noDataDash}
                fullWidth
                disabled={true}
                labelClassName={labelClassName}
                className={inputClassName}
              />
              <BaseInput
                label={t("profilePageConstants.companyName")}
                name="name"
                type="text"
                placeholder={inputPlaceHolder(
                  t("profilePageConstants.companyName")
                )}
                icon={<InputFieldUserIcon />}
                onChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                value={formik.values.name}
                error={formik.errors.name}
                touched={formik.touched.name}
                fullWidth
                labelClassName={labelClassName}
                className={inputClassName}
              />
              <BaseInput
                label={t("profilePageConstants.phone")}
                name="phone"
                type="tel"
                placeholder={inputPlaceHolder(t("profilePageConstants.phone"))}
                icon={<InputFieldPhoneIcon />}
                onChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                value={formik.values.phone}
                error={formik.errors.phone}
                touched={formik.touched.phone}
                fullWidth
                labelClassName={labelClassName}
                className={inputClassName}
              />
              <BaseInput
                name="postalCode"
                label={t(
                  "createProjectPageConstants.projectLocationPageConstants.postalCode"
                )}
                value={formik.values.postalCode}
                onChange={handlePostalCodeChange}
                touched={formik.touched.postalCode}
                icon={<LocationPinIcon className="opacity-30" />}
                handleBlur={handlePostalCodeBlur}
                error={formik.errors.postalCode}
                placeholder={inputPlaceHolder(
                  t(
                    "createProjectPageConstants.projectLocationPageConstants.postalCode"
                  )
                )}
                labelClassName={labelClassName}
                className={inputClassName}
              />
            </div>

            <div className="space-y-[20px]">
              <BaseInput
                label={t("registerLabel.orgNo")}
                name="org_no"
                type="text"
                placeholder={inputPlaceHolder(t("registerLabel.orgNo"))}
                icon={<InputFieldMailIcon />}
                value={profile?.org_no || commonLabels.noDataDash}
                fullWidth
                disabled={true}
                labelClassName={labelClassName}
                className={inputClassName}
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
                fullWidth
                disabled={true}
                labelClassName={labelClassName}
                className={inputClassName}
              />
              <BaseInput
                name="streetAddress"
                label={t(
                  "createProjectPageConstants.projectLocationPageConstants.streetAddress"
                )}
                value={formik.values.streetAddress}
                onChange={formik.handleChange}
                icon={<LocationPinIcon className="opacity-30" />}
                handleBlur={formik.handleBlur}
                touched={formik.touched.streetAddress}
                error={formik.errors.streetAddress}
                placeholder={inputPlaceHolder(
                  t(
                    "createProjectPageConstants.projectLocationPageConstants.streetAddress"
                  )
                )}
                labelClassName={labelClassName}
                className={inputClassName}
              />
              <BaseInput
                name="city"
                label={t("profilePageConstants.city")}
                value={formik.values.city}
                disabled={true}
                touched={formik.touched.city}
                icon={<LocationPinIcon className="opacity-30" />}
                error={formik.errors.city}
                placeholder={inputPlaceHolder(t("profilePageConstants.city"))}
                labelClassName={labelClassName}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="my-[20px]">
            <BaseCKEditor
              formik={formik}
              name="bio"
              labelClassName={labelClassName}
              label={t("profilePageConstants.bio")}
              placeholder={t("profilePageConstants.bioPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 justify-between py-[24px] gap-[10px]">
            <div>
              <p className="text-obsidianBlack text-opacity-40 text-textSm xl:leading-[100%] xl:tracking-[0px] font-light pb-[16px]">
                {t("projectDetailProfessionalProfileConstants.servicesOffered")}
              </p>

              <div className="flex flex-wrap gap-[6px] mb-[6px]">
                {services.map((serviceId) => (
                  <Chip
                    key={serviceId}
                    label={serviceMap[serviceId]}
                    color="bluePrimary"
                    onRemove={() => handleRemoveService(serviceId)}
                  />
                ))}
              </div>

              <ServiceModal
                visible={showServiceModal}
                onClose={() => setShowServiceModal(false)}
                value={services}
                onChange={handleServiceChange}
              />

              <BaseButton
                type="button"
                label={t("profilePageConstants.addService")}
                startIcon={<CreateProjectPlusIcon />}
                onClick={() => setShowServiceModal(true)}
                className="border border-obsidianBlack border-opacity-10 bg-white text-obsidianBlack pl-[5px] pr-[10px] py-[5px] text-opacity-50 rounded-[8px]"
              />
            </div>

            <div>
              <p className="text-obsidianBlack text-opacity-40 text-textSm xl:leading-[100%] xl:tracking-[0px] font-light pb-[16px]">
                {t("projectDetailProfessionalProfileConstants.workAreas")}
              </p>
              <div className="flex flex-wrap gap-[6px] mb-[6px]">
                {area.map((areaId) => (
                  <Chip
                    key={areaId}
                    label={areaMap[areaId]}
                    color="orangeAccent"
                    onRemove={() => handleRemoveArea(areaId)}
                  />
                ))}
              </div>
              <AreaModal
                visible={showAreaModal}
                onClose={() => setShowAreaModal(false)}
                value={area}
                onChange={handleAreaSave}
              />
              <BaseButton
                type="button"
                label={t("profilePageConstants.addArea")}
                startIcon={<CreateProjectPlusIcon />}
                onClick={() => setShowAreaModal(true)}
                className="border border-obsidianBlack border-opacity-10 bg-white text-obsidianBlack pl-[5px] pr-[10px] py-[5px] text-opacity-50 rounded-[8px]"
              />
            </div>
          </div>
          <div className="flex justify-end mt-[30px] pb-[46px]">
            <BaseButton
              type="submit"
              disabled={!hasChanges || uploadingFile || isSaving}
              loader={isSaving}
              className={`${
                hasChanges && !uploadingFile && !isSaving
                  ? "text-white bg-deepTeal"
                  : "text-obsidianBlack text-opacity-25 bg-grayDelta"
              } gap-[4px] rounded-[8px] font-medium text-textSm border-none px-[15px] py-[10px] xl:leading-[100%] xl:tracking-[0px]`}
              label={t("profilePageConstants.saveChanges")}
              endIcon={
                !isSaving && (
                  <SaveChangesArrowIcon
                    className={`${
                      hasChanges && !uploadingFile
                        ? "text-white"
                        : "text-obsidianBlack text-opacity-25"
                    }`}
                  />
                )
              }
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default BusinessProfile;
