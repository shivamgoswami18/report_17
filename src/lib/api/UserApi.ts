import type { AppDispatch, RootState } from "@/lib/store/store";
import { setError, setLoading } from "../store/slices/authSlice";
import { authData, multipartDataWithToken } from "./ApiService";
import {
  VIEW_PROFILE,
  EDIT_PROFILE,
  FILE_UPLOAD,
  BUSINESS_PROFILE,
} from "./ApiRoutes";
import {
  checkStatusCodeSuccess,
  commonLabels,
  errorHandler,
  finalApiMessage,
} from "@/components/constants/Common";
import {
  setProfile,
  setLoadingProfile,
  setUploadingFile,
  setUploadedFilePath,
  setUserProfile,
} from "../store/slices/userSlice";
import { setIsSubscriptionModalVisible } from "@/lib/store/slices/subscriptionSlice";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { BackendResp } from "@/types/backendResponse";

export const ViewProfile = () => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoadingProfile(true));
    try {
      const response = await authData.get(VIEW_PROFILE);
      const responseData = response?.data;
      const message = finalApiMessage(responseData);

      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        const profileData = responseData?.data;
        dispatch(setProfile(profileData));
        const state = getState();
        const hasUserDismissedModal = state.subscription?.hasUserDismissedModal;
        if (profileData?.plan_assigned === true) {
          dispatch(setIsSubscriptionModalVisible(false));
        } else if (
          profileData?.role === commonLabels.businessRole &&
          !hasUserDismissedModal
        ) {
          dispatch(setIsSubscriptionModalVisible(true));
        }
      } else {
        dispatch(setError(message));
        toast.error(message);
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      dispatch(setLoadingProfile(false));
    }
  };
};

export interface EditProfilePayload {
  userId?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  profile_image?: string | null;
  business_name?: string;
  description?: string;
  county?: string[];
  category?: string[];
  address?: {
    postalAddress?: {
      addressLine?: string;
      postPlace?: string;
      postalCode?: string;
    };
  };
  postal_code?: string;
  coordinates?: Array<{
    XCoordinate: number;
    YCoordinate: number;
  }>;
  org_no?: string;
  terms_condition?: string;
  user_notifications?: {
    offer?: boolean;
    message?: boolean;
    completed_project?: boolean;
  };
}

interface EditProfileParams {
  payload: EditProfilePayload;
  skipViewProfileRefresh?: boolean;
}

export const EditProfile = ({ payload, skipViewProfileRefresh }: EditProfileParams) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await authData.put(EDIT_PROFILE, payload);
      const responseData = response?.data;
      const message = finalApiMessage(responseData);

      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        dispatch(setProfile(responseData?.data));
        toast.success(message);
        if (!skipViewProfileRefresh) {
          dispatch(ViewProfile());
        }
        return true;
      } else {
        dispatch(setError(message));
        toast.error(message);
        return false;
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const UploadFile = (file: File) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setUploadingFile(true));
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await multipartDataWithToken.post(FILE_UPLOAD, formData);
      const responseData = response?.data;
      const message = finalApiMessage(responseData);

      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        const imagePath = responseData?.data?.imagePath?.[0];
        if (imagePath) {
          dispatch(setUploadedFilePath(imagePath));
          // toast.success(message);
          return imagePath;
        }
      } else {
        dispatch(setError(message));
        toast.error(message);
      }
      return null;
    } catch (error) {
      const axiosError = error as AxiosError<{
        message: string | string[];
        statusCode?: number;
      }>;
      type FileUploadData = { imagePath?: string[] };
      const responseData = axiosError.response?.data as
        | BackendResp<FileUploadData>
        | undefined;
      const statusCode =
        responseData?.statusCode || axiosError.response?.status;

      if (statusCode && checkStatusCodeSuccess(statusCode)) {
        const message = finalApiMessage(responseData);
        const imagePath = responseData?.data?.imagePath?.[0];

        if (imagePath) {
          dispatch(setUploadedFilePath(imagePath));
          toast.success(message);
          return imagePath;
        }
      } else {
        errorHandler(axiosError);
      }
      return null;
    } finally {
      dispatch(setUploadingFile(false));
    }
  };
};

export const businessProfile = (id: string) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await authData.get(BUSINESS_PROFILE(id));
      const responseData = response.data;
      const message = finalApiMessage(responseData);

      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        dispatch(setUserProfile(responseData.data));
      } else {
        toast.error(message);
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      dispatch(setLoading(false));
    }
  };
};
