export interface JobPosting {
  id: string;
  user_id: string;
  title: string;
  department: string;
  employment_type: string;
  location: string;
  work_mode: string;
  experience_min: number;
  experience_max: number;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string;
  responsibilities: string;
  skills_required: string;
  status: string;
  openings: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_posting_id: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_role: string;
  source: string;
  resume_url: string;
  portfolio_url: string;
  linkedin_url: string;
  cover_letter: string;
  stage: string;
  status: string;
  rating: number;
  interviewer_notes: string;
  expected_salary: number;
  offered_salary: number;
  offer_date: string | null;
  joining_date: string | null;
  rejection_reason: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  job_posting?: JobPosting;
}

export interface LeaveType {
  id: string;
  user_id: string;
  name: string;
  code: string;
  color: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_forward: number;
  requires_approval: boolean;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string;
  is_half_day: boolean;
  half_day_session: string;
  documents: string[];
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
  employee_name?: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
}

export interface PerformanceReview {
  id: string;
  user_id: string;
  employee_id: string;
  reviewer_id: string | null;
  review_period: string;
  review_type: string;
  status: string;
  overall_rating: number;
  performance_score: number;
  goals_achieved: number;
  kpi_score: number;
  communication_rating: number;
  teamwork_rating: number;
  initiative_rating: number;
  technical_rating: number;
  strengths: string;
  areas_of_improvement: string;
  reviewer_comments: string;
  employee_comments: string;
  review_date: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

export interface PerformanceGoal {
  id: string;
  user_id: string;
  review_id: string | null;
  employee_id: string;
  title: string;
  description: string;
  category: string;
  target_value: string;
  actual_value: string;
  weight: number;
  status: string;
  due_date: string | null;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appraisal {
  id: string;
  user_id: string;
  employee_id: string;
  review_id: string | null;
  appraisal_type: string;
  effective_date: string;
  previous_salary: number;
  new_salary: number;
  increment_percentage: number;
  increment_amount: number;
  previous_role: string;
  new_role: string;
  new_department: string;
  bonus_amount: number;
  reason: string;
  notes: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

export interface HRPolicy {
  id: string;
  user_id: string;
  title: string;
  category: string;
  content: string;
  version: string;
  status: string;
  effective_date: string | null;
  review_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ApplicationStage = 'Applied' | 'Screening' | 'Interview' | 'Technical' | 'HR Round' | 'Offer' | 'Hired' | 'Rejected';
export type JobStatus = 'Draft' | 'Active' | 'Paused' | 'Closed' | 'Filled';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type ReviewStatus = 'Draft' | 'In Progress' | 'Completed' | 'Acknowledged';
export type AppraisalType = 'Salary Increment' | 'Promotion' | 'Demotion' | 'Role Change' | 'Bonus' | 'Combined';
