export interface WorkTask {
  id: string;
  user_id: string;
  project_id: string | null;
  assigned_to_id: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  start_date: string | null;
  due_date: string;
  estimated_hours: number;
  logged_hours: number;
  labels: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkSubtask {
  id: string;
  task_id: string;
  user_id: string;
  label: string;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
}

export interface WorkTimeLog {
  id: string;
  task_id: string;
  user_id: string;
  employee_id: string | null;
  date: string;
  hours: number;
  description: string;
  created_at: string;
}

export interface WorkTaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment_type: string;
  content: string;
  created_at: string;
}
