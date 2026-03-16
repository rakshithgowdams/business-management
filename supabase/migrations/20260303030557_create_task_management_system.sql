/*
  # Task Management System

  Enterprise-level task assignment, tracking, alerts, and email communication system.

  1. New Tables
    - `task_assignments`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Business owner who created the task
      - `employee_id` (uuid, nullable) - Assigned employee
      - `assigned_by_role` (text) - Role of assigner: CEO, HR, Manager, Lead
      - `assigned_to_role` (text) - Role of assignee: HR, Manager, Employee, Intern
      - `title` (text) - Task title
      - `description` (text) - Detailed description
      - `category` (text) - HR Task, Manager Task, Employee Task, Company-wide, etc.
      - `priority` (text) - Critical, High, Medium, Low
      - `status` (text) - Pending, Assigned, In Progress, In Review, Completed, Overdue, Cancelled
      - `due_date` (timestamptz) - Deadline
      - `start_date` (timestamptz, nullable) - When work began
      - `completed_at` (timestamptz, nullable) - Completion timestamp
      - `estimated_hours` (numeric) - Estimated effort
      - `logged_hours` (numeric) - Actual effort
      - `department` (text) - Target department
      - `tags` (text) - Comma-separated tags
      - `attachments` (jsonb) - Array of file references
      - `ai_analysis` (jsonb) - AI-generated insights
      - `recurrence` (text) - none, daily, weekly, monthly
      - `parent_task_id` (uuid, nullable) - For subtasks
      - `progress_percent` (integer) - 0-100 progress
      - `created_at` / `updated_at` (timestamptz)

    - `task_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid) - Reference to task_assignments
      - `user_id` (uuid) - Comment author
      - `content` (text) - Comment text
      - `comment_type` (text) - comment, status_change, ai_suggestion
      - `created_at` (timestamptz)

    - `task_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Owner
      - `task_id` (uuid, nullable) - Related task
      - `employee_id` (uuid, nullable) - Related employee
      - `alert_type` (text) - deadline, overdue, performance, ai_insight, system
      - `severity` (text) - info, warning, critical
      - `title` (text) - Alert title
      - `message` (text) - Alert body
      - `is_read` (boolean) - Read status
      - `action_url` (text) - Link to relevant page
      - `created_at` (timestamptz)

    - `task_email_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Sender
      - `task_id` (uuid, nullable) - Related task
      - `employee_id` (uuid, nullable) - Recipient employee
      - `recipient_email` (text) - Email address
      - `subject` (text) - Email subject
      - `body` (text) - Email body (HTML)
      - `email_type` (text) - task_assignment, reminder, escalation, report, custom
      - `status` (text) - draft, queued, sent, failed
      - `sent_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

    - `task_performance_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Business owner
      - `employee_id` (uuid) - Employee being measured
      - `period_start` / `period_end` (date) - Measurement period
      - `tasks_assigned` (integer) - Count assigned
      - `tasks_completed` (integer) - Count completed
      - `tasks_overdue` (integer) - Count overdue
      - `avg_completion_hours` (numeric) - Average time to complete
      - `on_time_rate` (numeric) - Percentage completed on time
      - `quality_score` (numeric) - AI-assessed quality 0-100
      - `ai_summary` (text) - AI performance summary
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Policies restrict access to authenticated users who own the data
*/

-- Task Assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  assigned_by_role text NOT NULL DEFAULT 'CEO',
  assigned_to_role text NOT NULL DEFAULT 'Employee',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Employee Task',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  due_date timestamptz,
  start_date timestamptz,
  completed_at timestamptz,
  estimated_hours numeric NOT NULL DEFAULT 0,
  logged_hours numeric NOT NULL DEFAULT 0,
  department text NOT NULL DEFAULT '',
  tags text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis jsonb,
  recurrence text NOT NULL DEFAULT 'none',
  parent_task_id uuid REFERENCES task_assignments(id) ON DELETE SET NULL,
  progress_percent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task assignments"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task assignments"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task assignments"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task assignments"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  comment_type text NOT NULL DEFAULT 'comment',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task Alerts
CREATE TABLE IF NOT EXISTS task_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES task_assignments(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  alert_type text NOT NULL DEFAULT 'system',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  action_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON task_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON task_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON task_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON task_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task Email Logs
CREATE TABLE IF NOT EXISTS task_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES task_assignments(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  recipient_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  email_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON task_email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
  ON task_email_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email logs"
  ON task_email_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email logs"
  ON task_email_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task Performance Metrics
CREATE TABLE IF NOT EXISTS task_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  tasks_assigned integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_overdue integer NOT NULL DEFAULT 0,
  avg_completion_hours numeric NOT NULL DEFAULT 0,
  on_time_rate numeric NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 0,
  ai_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance metrics"
  ON task_performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics"
  ON task_performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance metrics"
  ON task_performance_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance metrics"
  ON task_performance_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_employee_id ON task_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_priority ON task_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_task_assignments_due_date ON task_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_task_assignments_category ON task_assignments(category);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_alerts_user_id ON task_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_task_alerts_is_read ON task_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_task_email_logs_user_id ON task_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_performance_metrics_employee_id ON task_performance_metrics(employee_id);
