export interface TaskAssignment {
  id: string;
  user_id: string;
  employee_id: string | null;
  assigned_by_role: string;
  assigned_to_role: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_hours: number;
  logged_hours: number;
  department: string;
  tags: string;
  attachments: { name: string; url: string }[];
  ai_analysis: AITaskAnalysis | null;
  recurrence: string;
  parent_task_id: string | null;
  progress_percent: number;
  created_at: string;
  updated_at: string;
  employee?: { full_name: string; job_role: string; department: string; work_email: string; personal_email: string };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  comment_type: string;
  created_at: string;
}

export interface TaskAlert {
  id: string;
  user_id: string;
  task_id: string | null;
  employee_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export interface TaskEmailLog {
  id: string;
  user_id: string;
  task_id: string | null;
  employee_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  email_type: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export interface TaskPerformanceMetric {
  id: string;
  user_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_overdue: number;
  avg_completion_hours: number;
  on_time_rate: number;
  quality_score: number;
  ai_summary: string;
  created_at: string;
}

export interface AITaskAnalysis {
  risk_tasks?: { task_title: string; risk_reason: string; suggestion: string }[];
  workload_analysis?: {
    overloaded_employees: string[];
    underutilized_employees: string[];
    balanced_employees: string[];
  };
  priority_recommendations?: { task_title: string; current_priority: string; suggested_priority: string; reason: string }[];
  deadline_alerts?: { task_title: string; days_remaining: number; risk_level: string; action: string }[];
  productivity_score?: number;
  summary?: string;
}

export interface AIPerformanceReview {
  overall_rating: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  summary: string;
  quality_score: number;
}
