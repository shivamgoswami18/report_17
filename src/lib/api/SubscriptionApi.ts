import type { AppDispatch } from "@/lib/store/store";
import { authData } from "./ApiService";
import {
  CLIP_HISTORY,
  LIST_OF_SUBSCRIPTION,
  SEND_PLAN_REQUEST,
} from "./ApiRoutes";
import {
  checkStatusCodeSuccess,
  errorHandler,
  extractErrorMessage,
  finalApiMessage,
} from "@/components/constants/Common";
import { routePath } from "@/components/constants/RoutePath";
import {
  setHistory,
  setPlan,
  setSubscriptions,
  setError,
  setLoading,
  setUserDismissedModal,
  setHistoryLoading,
} from "../store/slices/subscriptionSlice";
import { toast } from "react-toastify";
interface ListOfSubscriptionData {
  status: string;
}
interface ListOfSubscriptionParams {
  payload: ListOfSubscriptionData;
}

export const listOfSubscriptions = ({ payload }: ListOfSubscriptionParams) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await authData.post(LIST_OF_SUBSCRIPTION, payload);
      const responseData = response.data;
      const message = responseData.message;
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        dispatch(setSubscriptions(responseData.data));
      } else {
        dispatch(setError(message));
      }
    } catch (error) {
      dispatch(setError(extractErrorMessage(error)));
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export interface ClipHistoryPayload {
  sortKey: string;
  sortValue: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  usageType?: string;
}

interface ClipHistoryParams {
  payload: ClipHistoryPayload;
}
export const clipHistory = ({ payload }: ClipHistoryParams) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setHistoryLoading(true));
    try {
      const response = await authData.post(CLIP_HISTORY, payload);
      const responseData = response.data;
      const message = responseData.message;
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        dispatch(setHistory(responseData.data));
      } else {
        dispatch(setError(message));
      }
    } catch (error) {
      dispatch(setError(extractErrorMessage(error)));
    } finally {
      dispatch(setHistoryLoading(false));
    }
  };
};

interface SendPlanRequestParams {
  subscriptionId: string;
  navigate: (path: string) => void;
}

export const sendPlanRequest = ({
  subscriptionId,
  navigate,
}: SendPlanRequestParams) => {
  return async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await authData.post(SEND_PLAN_REQUEST(subscriptionId));
      const responseData = response.data;
      const message = finalApiMessage(responseData);
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        dispatch(setPlan(responseData.data));
        dispatch(setUserDismissedModal());
        toast.success(message);
        navigate(routePath.projects);
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
