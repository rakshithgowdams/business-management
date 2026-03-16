export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  category: string;
  status: string;
  budget: number;
  revenue: number;
  start_date: string;
  end_date: string;
  description: string;
  tags: string;
  created_at: string;
}

export interface ProjectExpense {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  receipt_note: string;
  created_at: string;
}

export interface ProjectTeamEntry {
  id: string;
  project_id: string;
  user_id: string;
  member_name: string;
  phone: string;
  email: string;
  employment_type: string;
  role: string;
  hours_worked: number;
  rate_per_hour: number;
  total_cost: number;
  date: string;
  created_at: string;
}

export interface ProjectAgreement {
  id: string;
  project_id: string;
  user_id: string;
  team_member_id: string | null;
  title: string;
  agreement_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  notes: string;
  created_at: string;
}

export interface ProjectTool {
  id: string;
  project_id: string;
  user_id: string;
  tool_name: string;
  purpose: string;
  cost_per_month: number;
  months_used: number;
  total_cost: number;
  billing_type: string;
  created_at: string;
}

export interface ProjectTimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  task_description: string;
  hours: number;
  member_name: string;
  created_at: string;
}

export interface ProjectWithTotals extends Project {
  total_spent: number;
  total_hours: number;
}
