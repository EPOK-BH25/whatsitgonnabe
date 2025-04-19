export interface Vendor {
  id: string;
  businessName: string;
  address: string;
  email: string;
  tags: string[];
  images: string[];
  paymentOptions: Record<string, boolean>;
  city: string;
  state: string;
}
