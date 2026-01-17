import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ClipHistoryResponse,
  SubscriptionResponse,
} from "@/types/subscription";

interface SubscriptionState {
  subscriptions: SubscriptionResponse | null;
  clipHistory: ClipHistoryResponse | null;
  sendPlan: string | null;
  success: string | null;
  error: string | null;
  loading: boolean;
  isSubscriptionModalVisible: boolean;
  hasUserDismissedModal: boolean;
  historyLoader: boolean;
}

const initialState: SubscriptionState = {
  subscriptions: null,
  clipHistory: null,
  sendPlan: null,
  success: null,
  error: null,
  loading: false,
  isSubscriptionModalVisible: false,
  hasUserDismissedModal: false,
  historyLoader: false
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscriptions(state, action: PayloadAction<SubscriptionResponse>) {
      state.subscriptions = action.payload;
    },
    setHistory(state, action: PayloadAction<ClipHistoryResponse>) {
      state.clipHistory = action.payload;
    },
    setPlan(state, action: PayloadAction<string | null>) {
      state.sendPlan = action.payload;
    },
    setSuccess(state, action: PayloadAction<string | null>) {
      state.success = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setIsSubscriptionModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isSubscriptionModalVisible = action.payload;
    },
    setUserDismissedModal: (state) => {
      state.hasUserDismissedModal = true;
      state.isSubscriptionModalVisible = false;
    },
    setHistoryLoading: (state, action: PayloadAction<boolean>) => {
      state.historyLoader = action.payload;
    }
  },
});

export const {
  setSubscriptions,
  setHistory,
  setPlan,
  setSuccess,
  setError,
  clearError,
  clearSuccess,
  setLoading,
  setIsSubscriptionModalVisible,
  setUserDismissedModal,
  setHistoryLoading
} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
