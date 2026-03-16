export interface PipelineDeal {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage: string;
  deal_value: number;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  lost_reason: string;
  source: string;
  priority: string;
  tags: string;
  internal_notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineDealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  activity_date: string;
  follow_up_date: string | null;
  created_at: string;
}

export interface OnboardingPipelineEntry {
  id: string;
  user_id: string;
  onboarding_id: string | null;
  client_id: string | null;
  client_name: string;
  client_email: string;
  current_stage: string;
  stage_entered_at: string;
  target_go_live_date: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStageChecklist {
  id: string;
  entry_id: string;
  user_id: string;
  stage_name: string;
  label: string;
  is_checked: boolean;
  checked_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProjectPipelineEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  client_name: string;
  stage: string;
  priority: string;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  budget: number;
  notes: string;
  tags: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  milestone_count?: number;
  milestone_done?: number;
}

export interface ProjectPipelineMilestone {
  id: string;
  entry_id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface ProjectPipelineDependency {
  id: string;
  user_id: string;
  entry_id: string;
  depends_on_id: string;
  created_at: string;
}
