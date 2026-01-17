export interface TypeOfWork {
  _id: string;
  name: string;
}

export interface UserNotifications {
  offer: boolean;
  message: boolean;
  completed_project: boolean;
}
export interface Category {
  _id: string;
  name: string;
  type_of_work: TypeOfWork[];
}

export interface County {
  county_id: string;
  county_name: string;
  municipalities: Municipality[];
}
export interface Municipality {
  municipality_id: string;
  municipality_name: string;
}

export interface PostalAddress {
  addressLine: string;
  postPlace: string;
  postalCode: string;
}

export interface Address {
  _id: string;
  postalAddress: PostalAddress;
}
export interface PlanInfo {
  plan_name: string;
  expire_date: string;
  total_clips: number;
  price: number;
}
export interface UserBusinessProfile {
  _id: string;
  full_name: string;
  email: string;
  phone_number: string;
  profile_image: string | null;
  business_name: string;
  county: County[];
  address: Address | null;
  org_no: string;
  category: Category[];
  plan_assigned: boolean;
  createdAt: string;
  payment_status: string;
  completedProjectCount: number;
  averageRating: number;
  totalReviewCount: number;
  description:string | null;
  plan_info: PlanInfo | null;
}