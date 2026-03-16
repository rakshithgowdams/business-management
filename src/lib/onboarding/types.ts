export interface Onboarding {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  onboarding_type: string;
  status: string;
  assigned_to: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  priority: string;
  internal_notes: string;
  welcome_message: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingChecklist {
  id: string;
  onboarding_id: string;
  user_id: string;
  label: string;
  is_checked: boolean;
  checked_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface OnboardingDocument {
  id: string;
  onboarding_id: string;
  user_id: string;
  doc_name: string;
  doc_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  is_required: boolean;
  doc_status: string;
  notes: string;
  created_at: string;
}

export interface OnboardingActivity {
  id: string;
  onboarding_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  activity_date: string;
  follow_up_date: string | null;
  created_at: string;
}
