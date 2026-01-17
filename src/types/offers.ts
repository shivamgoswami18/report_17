export type OfferStatus = "pending" | "assigned" | "rejected" | "completed" | "cancelled";

export interface OfferData extends Record<string, unknown> {
  id: string;
  projectId?: string;
  projectName: string;
  customer: string;
  offerPrice: string;
  status: OfferStatus;
  date: string;
}
