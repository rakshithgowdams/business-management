/*
  # HR Management System - Complete Schema

  ## Overview
  Full HR management system covering recruitment, leave management, performance reviews,
  appraisals, and HR policies. Extends the existing employees module.

  ## New Tables
  1. hr_job_postings - Job openings (Full-time, Part-time, Freelancer)
  2. hr_applications - Applicant pipeline with stages
  3. hr_leave_types - Configurable leave categories
  4. hr_leave_requests - Employee leave applications and approvals
  5. hr_leave_balances - Leave balance tracking per employee per year
  6. hr_performance_reviews - Periodic performance evaluations
  7. hr_performance_goals - Individual goals within reviews
  8. hr_appraisals - Salary/role revision records
  9. hr_policies - Company HR policies and handbook

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- =============================================
-- 1. JOB POSTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'Full-time',
  work_location text NOT NULL DEFAULT 'Office',
  city text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  responsibilities text NOT NULL DEFAULT '',
  salary_min numeric(12,2) DEFAULT 0,
  salary_max numeric(12,2) DEFAULT 0,
  salary_currency text DEFAULT 'INR',
  experience_required text DEFAULT '',
  education_required text DEFAULT '',
  skills_required text DEFAULT '',
  openings_count integer DEFAULT 1,
  status text NOT NULL DEFAULT 'Draft',
  priority text NOT NULL DEFAULT 'Medium',
  application_deadline date,
  published_at timestamptz,
  internal_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own job postings"
  ON hr_job_postings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job postings"
  ON hr_job_postings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job postings"
  ON hr_job_postings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job postings"
  ON hr_job_postings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_job_postings_user ON hr_job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_job_postings_status ON hr_job_postings(status);

-- =============================================
-- 2. JOB APPLICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES hr_job_postings(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  current_location text DEFAULT '',
  current_company text DEFAULT '',
  applicant_role text DEFAULT '',
  experience_years numeric(4,1) DEFAULT 0,
  expected_salary numeric(12,2) DEFAULT 0,
  notice_period text DEFAULT '',
  source text NOT NULL DEFAULT 'Direct',
  resume_url text DEFAULT '',
  portfolio_url text DEFAULT '',
  linkedin_url text DEFAULT '',
  cover_letter text DEFAULT '',
  stage text NOT NULL DEFAULT 'Applied',
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  interview_date timestamptz,
  interview_notes text DEFAULT '',
  offer_amount numeric(12,2) DEFAULT 0,
  offer_date date,
  rejection_reason text DEFAULT '',
  internal_notes text DEFAULT '',
  tags text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own applications"
  ON hr_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON hr_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON hr_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON hr_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_applications_user ON hr_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_applications_job ON hr_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_hr_applications_stage ON hr_applications(stage);

-- =============================================
-- 3. LEAVE TYPES
-- =============================================
CREATE TABLE IF NOT EXISTS hr_leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  days_allowed integer NOT NULL DEFAULT 12,
  carry_forward boolean DEFAULT false,
  carry_forward_max integer DEFAULT 0,
  is_paid boolean DEFAULT true,
  applicable_to text DEFAULT 'All',
  color text DEFAULT '#3b82f6',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hr_leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own leave types"
  ON hr_leave_types FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave types"
  ON hr_leave_types FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave types"
  ON hr_leave_types FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave types"
  ON hr_leave_types FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_leave_types_user ON hr_leave_types(user_id);

-- =============================================
-- 4. LEAVE REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES hr_leave_types(id) ON DELETE SET NULL,
  leave_type_name text NOT NULL DEFAULT '',
  from_date date NOT NULL,
  to_date date NOT NULL,
  days_count numeric(4,1) NOT NULL DEFAULT 1,
  half_day boolean DEFAULT false,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending',
  approved_by text DEFAULT '',
  approved_at timestamptz,
  rejection_reason text DEFAULT '',
  attachments text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own leave requests"
  ON hr_leave_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave requests"
  ON hr_leave_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave requests"
  ON hr_leave_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave requests"
  ON hr_leave_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_user ON hr_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_employee ON hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_status ON hr_leave_requests(status);

-- =============================================
-- 5. LEAVE BALANCES
-- =============================================
CREATE TABLE IF NOT EXISTS hr_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES hr_leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  allocated integer NOT NULL DEFAULT 0,
  used numeric(5,1) NOT NULL DEFAULT 0,
  remaining numeric(5,1) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, year)
);

ALTER TABLE hr_leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own leave balances"
  ON hr_leave_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave balances"
  ON hr_leave_balances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave balances"
  ON hr_leave_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave balances"
  ON hr_leave_balances FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_leave_balances_user ON hr_leave_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_balances_employee ON hr_leave_balances(employee_id);

-- =============================================
-- 6. PERFORMANCE REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL DEFAULT '',
  review_period text NOT NULL DEFAULT '',
  review_type text NOT NULL DEFAULT 'Annual',
  reviewer_name text NOT NULL DEFAULT '',
  overall_rating numeric(3,1) DEFAULT 0,
  performance_score numeric(5,2) DEFAULT 0,
  goals_set integer DEFAULT 0,
  goals_achieved integer DEFAULT 0,
  strengths text DEFAULT '',
  areas_for_improvement text DEFAULT '',
  training_recommendations text DEFAULT '',
  manager_comments text DEFAULT '',
  employee_comments text DEFAULT '',
  status text NOT NULL DEFAULT 'Draft',
  review_date date,
  next_review_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own performance reviews"
  ON hr_performance_reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance reviews"
  ON hr_performance_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance reviews"
  ON hr_performance_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance reviews"
  ON hr_performance_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_performance_reviews_user ON hr_performance_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_performance_reviews_employee ON hr_performance_reviews(employee_id);

-- =============================================
-- 7. PERFORMANCE GOALS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_performance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id uuid REFERENCES hr_performance_reviews(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  goal_title text NOT NULL,
  description text DEFAULT '',
  target_date date,
  weight integer DEFAULT 10,
  achievement_pct integer DEFAULT 0,
  rating numeric(3,1) DEFAULT 0,
  goal_status text NOT NULL DEFAULT 'Pending',
  comments text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_performance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own performance goals"
  ON hr_performance_goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance goals"
  ON hr_performance_goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance goals"
  ON hr_performance_goals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance goals"
  ON hr_performance_goals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_performance_goals_review ON hr_performance_goals(review_id);

-- =============================================
-- 8. APPRAISALS
-- =============================================
CREATE TABLE IF NOT EXISTS hr_appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL DEFAULT '',
  effective_date date NOT NULL,
  appraisal_type text NOT NULL DEFAULT 'Salary Revision',
  old_salary numeric(12,2) DEFAULT 0,
  new_salary numeric(12,2) DEFAULT 0,
  increment_amount numeric(12,2) DEFAULT 0,
  increment_pct numeric(5,2) DEFAULT 0,
  old_role text DEFAULT '',
  new_role text DEFAULT '',
  old_designation text DEFAULT '',
  new_designation text DEFAULT '',
  reason text DEFAULT '',
  approved_by text DEFAULT '',
  letter_ref text DEFAULT '',
  notes text DEFAULT '',
  appraisal_status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_appraisals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own appraisals"
  ON hr_appraisals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appraisals"
  ON hr_appraisals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appraisals"
  ON hr_appraisals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appraisals"
  ON hr_appraisals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_appraisals_user ON hr_appraisals(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_appraisals_employee ON hr_appraisals(employee_id);

-- =============================================
-- 9. HR POLICIES
-- =============================================
CREATE TABLE IF NOT EXISTS hr_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  content text NOT NULL DEFAULT '',
  version text DEFAULT '1.0',
  is_published boolean DEFAULT false,
  applicable_to text DEFAULT 'All',
  effective_date date,
  review_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hr_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own policies"
  ON hr_policies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policies"
  ON hr_policies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own policies"
  ON hr_policies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own policies"
  ON hr_policies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hr_policies_user ON hr_policies(user_id);
