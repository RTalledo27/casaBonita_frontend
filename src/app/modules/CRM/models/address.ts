export interface Address {
  address_id: number;
  client_id: number;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
}
