"use client";
import React, { useEffect, useState, useRef } from "react";
import BaseModal from "../base/BaseModal";
import { CloseIcon } from "@/assets/icons/CommonIcons";
import BaseButton from "../base/BaseButton";
import BaseInput from "../base/BaseInput";
import { getTranslationSync } from "@/i18n/i18n";
import { ProjectCardProps } from "@/types/project";
import { inputPlaceHolder } from "../constants/Validation";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { RootState } from "@/lib/store/store";
import { commonLabels, errorHandler } from "../constants/Common";
import { formatStatusLabel } from "../constants/Common";
import BasicInformation from "./BasicInformation";
import BaseTabs from "../base/BaseTab";
import OfferCard from "@/components/project/OfferCard";
import {
  ViewProject,
  ApplyProjectOffer,
  UpdateProjectStatus,
  ListOfReceivedOffer,
  CancelProject,
} from "@/lib/api/ProjectApi";
import BaseLoader from "../base/BaseLoader";
import AddReviewModal from "./AddReviewModal";

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};
interface ProjectDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  project: ProjectCardProps | null;
  onProjectUpdated?: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  visible,
  onHide,
  project,
  onProjectUpdated,
}) => {
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    offerPrice: "",
    timeline: "",
    message: "",
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasPendingReview, setHasPendingReview] = useState(false);

  const role = useAppSelector((state: RootState) => state.auth.role);
  const isLoading = useAppSelector(
    (state: RootState) => state.project.loadingProjectDetails
  );
  const currentProjectDetails = useAppSelector(
    (state: RootState) => state.project.currentProjectDetails
  );
  const offerItems = useAppSelector(
    (state: RootState) => state.project.receivedOffers?.items ?? []
  );
  const isSubmitting = useAppSelector((state: RootState) => state.auth.loading);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyNow = () => {
    if (currentProjectDetails?.offered) return;
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      offerPrice: "",
      timeline: "",
      message: "",
    });
  };

  const isBusinessRole = role === commonLabels?.businessRole;
  const isCustomerRole = role === commonLabels?.customerRole;

  const handleSubmit = () => {
    const amount = formData.offerPrice.trim()
      ? Number.parseFloat(formData.offerPrice)
      : 0;

    const payload = {
      customer_id: currentProjectDetails?.customer?._id ?? "",
      project_id: currentProjectDetails?._id ?? "",
      description: formData.message.trim() ?? "",
      estimated_duration: formData.timeline.trim() ?? "",
      amount: Number.isNaN(amount) ? 0 : amount ?? 0,
    };

    dispatch(ApplyProjectOffer({ payload }))
      .then(async () => {
        setShowForm(false);
        setFormData({
          offerPrice: "",
          timeline: "",
          message: "",
        });

        if (project?._id) {
          await dispatch(ViewProject(project._id));
        }

        if (onProjectUpdated) {
          onProjectUpdated();
        }
      })
      .catch((err) => {
        errorHandler(err);
      });
  };

  const handleUpdateProjectStatus = async () => {
    if (!project?._id || isSubmitting) return;

    await dispatch(
      UpdateProjectStatus({
        payload: {
          project_id: project._id,
          status: commonLabels.completedValue,
        },
      })
    );
    await dispatch(ViewProject(project._id));
    setShowReviewModal(true);
    setHasPendingReview(true);
  };
  const handleCancelProject = async () => {
    if (!currentProjectDetails?._id || isSubmitting) return;

    await dispatch(
      CancelProject({
        payload: {
          project_id: currentProjectDetails._id,
          status: commonLabels.publishedValue,
        },
      })
    );

    await dispatch(ViewProject(currentProjectDetails._id));
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const prevActiveIndexRef = useRef<number>(0);
  const businessId = offerItems[0]?.business_id;

  useEffect(() => {
    if (!visible) {
      setShowForm(false);
      setFormData({
        offerPrice: "",
        timeline: "",
        message: "",
      });
      setShowReviewModal(false);
      setHasPendingReview(false);
      setActiveIndex(0);
      prevActiveIndexRef.current = 0;
    } else if (visible && project?._id) {
      dispatch(ViewProject(project._id));
    }
  }, [visible, project?._id, dispatch]);

  useEffect(() => {
    if (visible && project?._id && isCustomerRole) {
      dispatch(
        ListOfReceivedOffer({
          projectId: project._id,
          payload: {
            sortKey: "_id",
            sortValue: "desc",
            page: 1,
            limit: 10,
          },
        })
      );
    }
  }, [visible, project?._id, isCustomerRole, dispatch]);

  useEffect(() => {
    if (
      visible &&
      project?._id &&
      activeIndex === 0 &&
      prevActiveIndexRef.current !== 0 &&
      isCustomerRole
    ) {
      dispatch(ViewProject(project._id));
    }
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex, visible, project?._id, dispatch, isCustomerRole]);

  const renderFooter = () => {
    if (isCustomerRole) {
      const isCompleted =
        currentProjectDetails?.status === commonLabels.completedValue;
      const isAssigned =
        currentProjectDetails?.status === commonLabels.assignedValue;
      return (
        <div className="flex justify-end gap-[12px]">
          {isCompleted && hasPendingReview && (
            <BaseButton
              label={t("reviewPageConstants.review")}
              onClick={() => setShowReviewModal(true)}
              className="w-full sm:w-auto sm:min-w-[200px] py-[10px] px-[24px] bg-obsidianBlack bg-opacity-5 border-none text-obsidianBlack text-opacity-50 rounded-[8px] text-textSm font-medium xl:leading-[100%] xl:tracking-[0px]"
            />
          )}
          {isAssigned && !isCompleted && (
            <BaseButton
              label={t("projectDetailsPageConstants.cancel")}
              onClick={handleCancelProject}
              loader={isSubmitting}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium transition duration-200 ease-in-out hover:bg-red-600 hover:shadow-md"
            />
          )}
          <BaseButton
            label={
              isCompleted
                ? t("myProjectsPageConstants.myProjectsCardCompleted")
                : t("projectDetailsPageConstants.statusCardButtonCompletedText")
            }
            onClick={handleUpdateProjectStatus}
            loader={isSubmitting}
            disabled={isCompleted || !businessId}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium transition duration-200 ease-in-out hover:shadow-md disabled:bg-gray-300 disabled:text-white"
          />
        </div>
      );
    }

    if (isBusinessRole) {
      const isOffered = currentProjectDetails?.offered === true;

      // Once an offer is applied, hide the apply/apply-form controls completely
      if (isOffered) {
        return null;
      }

      if (showForm && !isOffered) {
        return (
          <div className="flex gap-4 justify-between">
            <BaseButton
              label={t("projectDetailsPageConstants.cancel")}
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-medium transition duration-200 ease-in-out hover:bg-gray-300"
            />
            <BaseButton
              label={t("projectDetailsPageConstants.applyNow")}
              onClick={handleSubmit}
              loader={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium transition duration-200 ease-in-out hover:shadow-md"
            />
          </div>
        );
      }
      return (
        <div className="flex justify-end">
          <BaseButton
            label={t("projectDetailsPageConstants.applyNow")}
            onClick={handleApplyNow}
            loader={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium transition duration-200 ease-in-out hover:shadow-md"
          />
        </div>
      );
    }

    return null;
  };

  if (!project) return null;

  const customerTabs = [
    {
      label: t("sidebarConstants.basicInformation"),
      component: <BasicInformation isCustomerRole={isCustomerRole} />,
    },
    {
      label: t("projectDetailsPageConstants.receivedOfferTitle"),
      component: <OfferCard />,
    },
  ];

  const labelClassName = "text-gray-700 text-sm font-medium mb-2";
  const inputClassName =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition duration-200 ease-in-out text-gray-900 placeholder-gray-400";

  return (
    <>
      <BaseModal
        visible={visible}
        onHide={onHide}
        maxWidth="1000px"
        showCloseIcon={false}
        className="min-w-[280px] xxs:min-w-[350px] xs:min-w-[500px] sm:min-w-[600px] md:min-w-[750px] lg:min-w-[896px] bg-white rounded-2xl shadow-xl"
        header={
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-gray-900 text-lg font-semibold">
                {t("projectDetailsPageConstants.projectNumberPrefix")} {" "}
                {currentProjectDetails?.project_id || project?.project_id}
              </h2>
              {currentProjectDetails?.offer?.status && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800`}
                >
                  {formatStatusLabel(currentProjectDetails?.offer?.status)}
                </span>
              )}
            </div>
            <BaseButton onClick={onHide} className="bg-transparent border-none hover:bg-gray-100 rounded-full p-2">
              <CloseIcon className="text-gray-500 w-5 h-5" />
            </BaseButton>
          </div>
        }
        footer={
          <div className="w-full p-6 bg-gray-50 rounded-b-2xl">{renderFooter()}</div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <BaseLoader size="lg" className="text-teal-500" />
          </div>
        ) : (
          <>
            {isBusinessRole && <BasicInformation />}

            {isCustomerRole && (
              <>
                <div className="pb-0 border-b border-gray-200 bg-white p-6">
                  <BaseTabs
                    tabs={customerTabs.map((t) => t.label)}
                    activeIndex={activeIndex}
                    onChange={setActiveIndex}
                    className="!text-start !items-start !justify-start"
                    tabClassName="with-no-padding"
                  />
                </div>
                <div className="p-6">
                  {activeIndex === 0 ? (
                    <BasicInformation isCustomerRole={isCustomerRole} />
                  ) : (
                    customerTabs[activeIndex]?.component
                  )}
                </div>
              </>
            )}
            {showForm && isBusinessRole && !currentProjectDetails?.offered && (
              <div className="relative mt-8 pb-6 px-6">
                <div className="absolute left-0 right-0 h-px bg-gray-200" />
              </div>
            )}
            {showForm && isBusinessRole && !currentProjectDetails?.offered && (
              <div className="space-y-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BaseInput
                    name="offerPrice"
                    label={t("projectDetailsPageConstants.offerPrice")}
                    value={formData.offerPrice}
                    onChange={handleInputChange}
                    placeholder={inputPlaceHolder(
                      t("projectDetailsPageConstants.offerPrice")
                    )}
                    labelClassName={labelClassName}
                    className={inputClassName}
                    type="number"
                    fullWidth
                  />
                  <BaseInput
                    name="timeline"
                    label={t("projectDetailsPageConstants.timeLine")}
                    value={formData.timeline}
                    onChange={handleInputChange}
                    placeholder={inputPlaceHolder(
                      t("projectDetailsPageConstants.timeLine")
                    )}
                    labelClassName={labelClassName}
                    className={inputClassName}
                    type="number"
                    fullWidth
                    suffix={
                      Number(formData.timeline) > 1
                        ? t("projectDetailsPageConstants.daysSuffix")
                        : t("projectDetailsPageConstants.daySuffix")
                    }
                  />
                </div>
                <div>
                  <BaseInput
                    name="message"
                    label={t(
                      "settingsPageConstants.notificationsMessage.title"
                    )}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={inputPlaceHolder(
                      t("settingsPageConstants.notificationsMessage.title")
                    )}
                    labelClassName={labelClassName}
                    className={inputClassName}
                    type="textarea"
                    rows={4}
                    fullWidth
                  />
                </div>
              </div>
            )}
          </>
        )}
      </BaseModal>
      {isCustomerRole && showReviewModal && (
        <AddReviewModal
          visible={showReviewModal}
          onHide={() => setShowReviewModal(false)}
          projectId={project?._id}
          businessId={businessId}
          onSuccess={async () => {
            setShowReviewModal(false);
            setHasPendingReview(false);
            if (project?._id) {
              await dispatch(ViewProject(project._id));
            }
            if (onProjectUpdated) {
              onProjectUpdated();
            }
          }}
        />
      )}
    </>
  );
};

export default ProjectDetailsModal;