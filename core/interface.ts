export interface Vendor {
  id: string;
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  images: string[];
  tags: string[];
  offersDrive: boolean;
  offersHome: boolean;
  paymentOptions: {
    cash: boolean;
    cashapp: boolean;
    credit: boolean;
    debit: boolean;
    paypal: boolean;
    tap: boolean;
    venmo: boolean;
    zelle: boolean;
  };
  socialmedia: string[];
  services?: {
    hair?: Record<string, boolean>;
    nails?: Record<string, boolean>;
    makeup?: Record<string, boolean>;
    [key: string]: Record<string, boolean> | undefined;
  };
  reviewCount?: number;
  averageRating?: number;
}

export interface DisplayVendor extends Vendor {
  city?: string;
  state?: string;
  description?: string;
  mapLocation?: {
    lat: number;
    lng: number;
  };
}