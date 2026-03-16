export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string;
  client_type: string;
  status: string;
  avatar_url: string;
  tags: string;
  primary_phone: string;
  whatsapp_number: string;
  secondary_phone: string;
  primary_email: string;
  secondary_email: string;
  website: string;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin: string;
  pan_number: string;
  industry_type: string;
  annual_budget_range: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  upi_id: string;
  internal_notes: string;
  source: string;
  referral_name: string;
  created_at: string;
  updated_at: string;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  user_id: string;
  interaction_type: string;
  description: string;
  interaction_date: string;
  follow_up_date: string | null;
  created_at: string;
}
