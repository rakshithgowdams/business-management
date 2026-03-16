export interface AIFormData {
  business_name: string;
  owner_name: string;
  business_type: string;
  city: string;
  state: string;
  years_in_business: string;
  team_size: string;
  monthly_revenue: string;
  website_url: string;
  instagram_handle: string;
  linkedin_url: string;
  google_business_name: string;
  facebook_page_url: string;
  pain_points: string[];
  competitor_1_name: string;
  competitor_1_website: string;
  competitor_2_name: string;
  competitor_2_website: string;
  competitor_does_better: string;
  client_does_better: string;
  budget: string;
  urgency: string;
  decision_maker: string;
  additional_notes: string;
  heard_from: string;
}

export interface PainPoint {
  pain: string;
  impact: string;
  cost_estimate: string;
  urgency: string;
}

export interface ServiceRecommendation {
  service: string;
  priority: number;
  why_they_need_it: string;
  specific_solution: string;
  estimated_price: string;
  implementation_time: string;
  roi_timeline: string;
}

export interface BuyingPsychology {
  primary_motivation: string;
  main_objection: string;
  objection_handler: string;
  best_closing_angle: string;
  trust_builders: string[];
}

export interface AnalysisResult {
  business_summary: string;
  digital_maturity_score: number;
  digital_maturity_label: string;
  urgency_score: number;
  deal_potential: string;
  estimated_deal_value: string;
  top_pain_points: PainPoint[];
  service_recommendations: ServiceRecommendation[];
  personal_pain_points: string[];
  professional_pain_points: string[];
  business_pain_points: string[];
  buying_psychology: BuyingPsychology;
  competitor_weaknesses: string[];
  quick_wins: string[];
}

export interface ROIItem {
  service: string;
  current_cost_annually: string;
  time_saved_weekly: string;
  money_saved_monthly: string;
  revenue_increase_monthly: string;
  total_annual_benefit: string;
  service_cost: string;
  payback_period: string;
  three_year_roi: string;
  roi_percentage: string;
  roi_proof_example: string;
}

export interface ROIResult {
  roi_calculations: ROIItem[];
  total_opportunity_cost: string;
  total_investment_needed: string;
  total_annual_savings: string;
  breakeven_months: number;
}

export interface OutreachMessage {
  tone: string;
  message: string;
  length: string;
  best_time_to_send?: string;
}

export interface FollowUpStep {
  day: number;
  channel: string;
  message: string;
}

export interface OutreachResult {
  whatsapp_message_1: OutreachMessage;
  whatsapp_message_2: OutreachMessage;
  whatsapp_message_3: OutreachMessage;
  email_subject_1: string;
  email_body_1: string;
  email_subject_2: string;
  email_body_2: string;
  linkedin_message: string;
  instagram_dm: string;
  follow_up_sequence: FollowUpStep[];
}

export interface ComparisonRow {
  criteria: string;
  mydesignnexus: string;
  typical_agency: string;
  freelancer: string;
  doing_nothing: string;
  winner: string;
}

export interface UnfairAdvantage {
  advantage: string;
  explanation: string;
}

export interface CompetitorResult {
  comparison_table: ComparisonRow[];
  our_unfair_advantages: UnfairAdvantage[];
  why_not_cheap_freelancer: string;
  why_not_big_agency: string;
  why_not_diy: string;
  our_guarantee: string;
  risk_reversal: string;
}

export interface ProposalService {
  service_name: string;
  what_we_will_build: string;
  how_it_solves_their_pain: string;
  timeline: string;
  investment: string;
  whats_included: string[];
  success_metric: string;
}

export interface ProposalResult {
  proposal: {
    title: string;
    executive_summary: string;
    current_situation: { heading: string; content: string };
    vision: { heading: string; content: string };
    services_proposed: ProposalService[];
    implementation_plan: { week: string; activities: string }[];
    investment_summary: {
      total_investment: string;
      payment_terms: string;
      what_happens_if_they_wait: string;
    };
    social_proof: {
      relevant_case_study: string;
      testimonial_style: string;
      results_achieved: string;
    };
    faq: { question: string; answer: string }[];
    next_steps: string[];
    closing_message: string;
  };
}

export interface AIAnalysis {
  id: string;
  user_id: string;
  client_id: string | null;
  business_name: string;
  business_type: string;
  owner_name: string;
  city: string;
  state: string;
  form_data: AIFormData;
  analysis_result: AnalysisResult | null;
  roi_result: ROIResult | null;
  outreach_result: OutreachResult | null;
  competitor_result: CompetitorResult | null;
  proposal_result: ProposalResult | null;
  deal_potential: string;
  estimated_deal_value: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AIBusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  city: string;
  services_offered: string[];
  price_ranges: Record<string, string>;
  usp: string;
  target_industries: string[];
  success_stories: { title: string; description: string }[];
  testimonials: { name: string; text: string }[];
}
