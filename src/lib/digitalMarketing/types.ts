export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  channel: string;
  objective: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpc: number;
  ctr: number;
  roas: number;
  target_audience: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AdSet {
  id: string;
  user_id: string;
  campaign_id: string | null;
  name: string;
  platform: string;
  status: string;
  daily_budget: number;
  lifetime_budget: number;
  bid_strategy: string;
  bid_amount: number;
  targeting_age_min: number;
  targeting_age_max: number;
  targeting_genders: string;
  targeting_locations: string;
  targeting_interests: string;
  targeting_custom_audiences: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export interface Ad {
  id: string;
  user_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  name: string;
  platform: string;
  ad_format: string;
  status: string;
  headline: string;
  primary_text: string;
  description: string;
  cta: string;
  destination_url: string;
  media_url: string;
  media_type: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  relevance_score: number;
  notes: string;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export interface Keyword {
  id: string;
  user_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  keyword: string;
  match_type: string;
  status: string;
  bid: number;
  quality_score: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  avg_position: number;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export interface DMExpense {
  id: string;
  user_id: string;
  campaign_id: string | null;
  date: string;
  platform: string;
  expense_type: string;
  amount: number;
  currency: string;
  description: string;
  invoice_url: string;
  payment_method: string;
  status: string;
  notes: string;
  created_at: string;
  campaign?: Campaign;
}

export interface Lead {
  id: string;
  user_id: string;
  campaign_id: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  deal_value: number;
  notes: string;
  follow_up_date: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}

export interface MarketingEvent {
  id: string;
  user_id: string;
  name: string;
  event_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string;
  organizer: string;
  website: string;
  stall_cost: number;
  travel_cost: number;
  material_cost: number;
  other_cost: number;
  total_cost: number;
  leads_generated: number;
  deals_closed: number;
  revenue_generated: number;
  attendees_count: number;
  collateral_distributed: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Outreach {
  id: string;
  user_id: string;
  campaign_id: string | null;
  company_name: string;
  contact_name: string;
  contact_title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  channel: string;
  status: string;
  outreach_date: string | null;
  follow_up_date: string | null;
  deal_value: number;
  industry: string;
  company_size: string;
  notes: string;
  last_response: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
}
