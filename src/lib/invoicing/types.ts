export interface LineItem {
  description: string;
  hsn_sac: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  gst_rate: number;
}

export interface BankDetails {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  from_business_name: string;
  from_address: string;
  from_gstin: string;
  from_email: string;
  from_phone: string;
  to_client_name: string;
  to_address: string;
  to_gstin: string;
  to_email: string;
  to_phone: string;
  invoice_date: string;
  due_date: string;
  discount: number;
  discount_type: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
  terms: string;
  currency: string;
  status: string;
  payment_terms: string;
  place_of_supply: string;
  po_number: string;
  theme_id: string;
  custom_theme: Record<string, unknown> | null;
  signatory_name: string;
  signatory_designation: string;
  items: LineItem[];
}

export interface Quotation {
  id: string;
  quote_number: string;
  from_business_name: string;
  from_address: string;
  from_gstin: string;
  from_email: string;
  from_phone: string;
  to_client_name: string;
  to_address: string;
  to_gstin: string;
  to_email: string;
  to_phone: string;
  quote_date: string;
  valid_until: string;
  discount: number;
  discount_type: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
  terms: string;
  currency: string;
  status: string;
  payment_terms: string;
  scope_of_work: string;
  delivery_timeline: string;
  theme_id: string;
  custom_theme: Record<string, unknown> | null;
  signatory_name: string;
  signatory_designation: string;
  items: LineItem[];
}
