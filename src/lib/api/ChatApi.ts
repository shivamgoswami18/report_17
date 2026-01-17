import { authData } from "./ApiService";
import { CREATE_CHAT_SESSION, CHAT_LIST, UNREAD_COUNT } from "./ApiRoutes";
import {
  checkStatusCodeSuccess,
  errorHandler,
  finalApiMessage,
} from "@/components/constants/Common";
import { toast } from "react-toastify";

export interface CreateChatSessionPayload {
  receiver_id: string;
}

export interface CreateChatSessionResponse {
  id: string;
}

export interface ChatListPayload {
  sortKey?: string;
  sortValue?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ChatContact {
  _id: string;
  user_id: string;
  name: string;
  profile_image?: string | null;
  last_message?: string;
  updatedAt?: string;
}

export interface ChatListResponse {
  items: ChatContact[];
  totalCount: number;
  itemsCount: number;
  currentPage: number;
  totalPage: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const createChatSession = (payload: CreateChatSessionPayload) => {
  return async (): Promise<CreateChatSessionResponse | null> => {
    try {
      const response = await authData.post(CREATE_CHAT_SESSION, payload);
      const responseData = response?.data;
      const message = finalApiMessage(responseData);
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        return responseData?.data;
      } else {
        toast.error(message);
        return null;
      }
    } catch (error) {
      errorHandler(error);
      return null;
    }
  };
};

export const getChatList = (payload: ChatListPayload = {}) => {
  return async (): Promise<ChatListResponse | null> => {
    try {
      const response = await authData.post(CHAT_LIST, {
        payload,
      });
      const responseData = response?.data;
      const message = finalApiMessage(responseData);
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        return responseData?.data;
      } else {
        toast.error(message);
        return null;
      }
    } catch (error) {
      errorHandler(error);
      return null;
    }
  };
};

export const getUnreadCount = () => {
  return async (): Promise<number> => {
    try {
      const response = await authData.get(UNREAD_COUNT);
      const responseData = response?.data;
      if (checkStatusCodeSuccess(responseData?.statusCode)) {
        return responseData?.data?.count ?? 0;
      }
      return 0;
    } catch (error) {
      errorHandler(error);
      return 0;
    }
  };
};
