import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ProfileCounty } from "@/types/profile";
import { UserNotifications, UserBusinessProfile, PlanInfo } from "@/types/user";

interface Category {
  _id: string;
  name: string;
  type_of_work?: Array<{
    _id: string;
    name: string;
  }>;
}

interface Address {
  _id?: string;
  postalAddress?: {
    addressLine?: string;
    postPlace?: string;
    postalCode?: string;
  };
  visitorAddress?: {
    addressLine?: string;
    postPlace?: string;
    postalCode?: string;
  };
}

interface Coordinates {
  XCoordinate: number;
  YCoordinate: number;
}

export interface UserProfile {
  _id?: string;
  email?: string;
  role?: "business" | "customer";
  profile_image: string | null;
  is_active?: boolean;
  full_name?: string;
  business_name?: string | null;
  phone_number?: string;
  address?: Address | null;
  postal_code?: string | null;
  coordinates?: Coordinates[] | null;
  org_no?: string | null;
  terms_condition?: string | null;
  Portfolio?: string | null;
  status?: string;
  payment_status?: string;
  plan_assigned?: boolean;
  category?: Category[];
  county?: ProfileCounty[];
  total_clips?: number;
  location?: string | null;
  user_notifications?: UserNotifications;
  description?: string | null;
  plan_info: PlanInfo | null;
}

interface UserState {
  profile: UserProfile | null;
  loadingProfile: boolean;
  uploadingFile: boolean;
  uploadedFilePath: string | null;
  userProfile: UserBusinessProfile | null;
}

const initialState: UserState = {
  profile: null,
  loadingProfile: false,
  uploadingFile: false,
  uploadedFilePath: null,
  userProfile: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
    },
    setLoadingProfile(state, action: PayloadAction<boolean>) {
      state.loadingProfile = action.payload;
    },
    setUploadingFile(state, action: PayloadAction<boolean>) {
      state.uploadingFile = action.payload;
    },
    setUploadedFilePath(state, action: PayloadAction<string | null>) {
      state.uploadedFilePath = action.payload;
    },
    clearUploadedFile(state) {
      state.uploadedFilePath = null;
    },
    updateUserNotifications: (
      state,
      action: PayloadAction<UserNotifications>
    ) => {
      if (state.profile) {
        state.profile.user_notifications = action.payload;
      }
    },
    setUserProfile: (
      state,
      action: PayloadAction<UserBusinessProfile | null>
    ) => {
      state.userProfile = action.payload;
    },
  },
});

export const {
  setProfile,
  setLoadingProfile,
  setUploadingFile,
  setUploadedFilePath,
  clearUploadedFile,
  updateUserNotifications,
  setUserProfile,
} = userSlice.actions;

export default userSlice.reducer;
