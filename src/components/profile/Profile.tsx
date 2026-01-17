"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import BaseInput from "@/components/base/BaseInput";
import BaseButton from "@/components/base/BaseButton";
import BaseFileUpload from "@/components/base/BaseFileUpload";
import BaseLoader from "@/components/base/BaseLoader";
import {
  InputFieldMailIcon,
  InputFieldUserIcon,
  InputFieldPhoneIcon,
  UploadIcon,
  SaveChangesArrowIcon,
  LocationPinIcon,
} from "@/assets/icons/CommonIcons";
import { getTranslationSync } from "@/i18n/i18n";

import {
  emailRegex,
  phoneRegex,
  validationMessages,
  inputPlaceHolder,
  nonDigitsRegex,
} from "@/components/constants/Validation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  ViewProfile,
  EditProfile,
  UploadFile,
  EditProfilePayload,
} from "@/lib/api/UserApi";
import { BaseImageURL } from "@/lib/api/ApiService";
import {
  errorHandler,
  handleProfileImageChange,
  invalidImageError,
} from "@/components/constants/Common";
import { getLocation } from "@/lib/api/ProjectApi";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const { profile, loadingProfile, uploadingFile } = useAppSelector(
    (state) => state.user
  );
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(ViewProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.profile_image) {
      setProfileImagePath(profile.profile_image);
      setProfileImagePreview(BaseImageURL + profile.profile_image);
    }
  }, [profile]);

  const handleImageChange = async (
    imageUrl: string | null,
    file: File | null
  ) => {
    if(invalidImageError(file)) return;
    await handleProfileImageChange({
      imageUrl,
      file,
      setProfileImagePath,
      setProfileImagePreview,
      upload: (uploadFile: File) => dispatch(UploadFile(uploadFile)),
      baseImageURL: BaseImageURL,
    });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone_number || "",
      city: profile?.address?.postalAddress?.postPlace || "",
      streetAddress: profile?.address?.postalAddress?.addressLine || "",
      postalCode: profile?.address?.postalAddress?.postalCode || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required(
        validationMessages.required(t("registerLabel.name"))
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

        if (values.name !== profile?.full_name) {
          payload.full_name = values.name;
        }

        if (values.email !== profile?.email) {
          payload.email = values.email;
        }

        if (values.phone !== profile?.phone_number) {
          payload.phone_number = values.phone;
        }

        if (profileImagePath !== profile?.profile_image) {
          payload.profile_image = profileImagePath;
        }
        payload.address = {
          postalAddress: {
            postPlace: values.city,
            postalCode: values.postalCode,
            addressLine: values.streetAddress,
          },
        };

        await dispatch(EditProfile({ payload }));
      } finally {
        setIsSaving(false);
      }
    },
  });

  const handlePostalCodeBlur = async (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    formik.handleBlur(e);
    const postalCode = formik.values.postalCode.trim();

    if (postalCode) {
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

  const hasChanges =
    formik.dirty || profileImagePath !== profile?.profile_image;

  // Updated class names for minimal, modern styling
  const labelClassName =
    "text-gray-600 text-sm font-medium mb-2 tracking-wide";
  const inputClassName =
    "w-full px-4 pl-10 py-3 bg-gray-50 border focus:shadow-none border-gray-200 rounded-lg focus:outline-none focus:border- transition duration-200 ease-in-out text-gray-900";

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 w-full max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <BaseLoader size="xl" className="text-teal-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-xl bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12">
        {/* Profile Image Section - Redesigned for cool, circular look */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative">
            <BaseFileUpload
              name="profileImage"
              accept="image/*"
              customUI={true}
              imagePreview={profileImagePreview}
              onImageChange={handleImageChange}
              containerClassName="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden"
              uploadPlaceholder={
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {uploadingFile ? (
                    <div className="animate-spin rounded-full h-8 w-8 "></div>
                  ) : (
                    <>
                      <UploadIcon className="text-gray-500 mb-2 w-6 h-6" />
                      <span className="text-gray-500 text-xs font-light">
                        {t("profilePageConstants.upload")}
                      </span>
                    </>
                  )}
                </div>
              }
              editButtonLabel={t("profilePageConstants.edit")}
              editButtonClassName="absolute bottom-0 left-0 right-0 bg-black border-none text-white text-xs py-1 rounded-full font-light hover:bg-opacity-80 transition duration-200"
              showEditButton={true}
            />
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* Form Grid - Simplified and more spaced out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <BaseInput
                label={t("profilePageConstants.companyName")}
                name="name"
                type="text"
                placeholder={inputPlaceHolder(t("profilePageConstants.companyName"))}
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
                icon={<InputFieldPhoneIcon className="w-5 h-5 text-gray-400" />}
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
                icon={<LocationPinIcon className="w-5 h-5 text-gray-400" />}
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

            <div className="space-y-6">
              <BaseInput
                label={t("logInLabel.email")}
                name="email"
                type="email"
                disabled
                placeholder={inputPlaceHolder(t("logInLabel.email"))}
                icon={<InputFieldMailIcon />}
                lowercase
                handleBlur={formik.handleBlur}
                value={formik.values.email}
                error={formik.errors.email}
                touched={formik.touched.email}
                fullWidth
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
                icon={<LocationPinIcon className="w-5 h-5 text-gray-400" />}
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
                icon={<LocationPinIcon className="w-5 h-5 text-gray-400" />}
                error={formik.errors.city}
                placeholder={inputPlaceHolder(t("profilePageConstants.city"))}
                labelClassName={labelClassName}
                className={inputClassName}
              />
            </div>
          </div>

          {/* Save Button - Modern gradient and animation */}
          <div className="flex justify-end mt-12">
            <BaseButton
              type="submit"
              disabled={!hasChanges || uploadingFile || isSaving}
              loader={isSaving}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 ease-in-out transform hover:scale-105 ${
                hasChanges && !uploadingFile && !isSaving
                  ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              label={t("profilePageConstants.saveChanges")}
              endIcon={
                !isSaving && (
                  <SaveChangesArrowIcon
                    className={`w-4 h-4 ${
                      hasChanges && !uploadingFile
                        ? "text-white"
                        : "text-gray-400"
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
};

export default Profile;
