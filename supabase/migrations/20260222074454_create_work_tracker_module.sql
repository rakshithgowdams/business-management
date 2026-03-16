/*
  # Create Work Tracker Module

  1. New Tables
    - `work_tasks` - main task records
      - All task fields including project/employee linking
      - Status: To Do / In Progress / In Review / Done / Cancelled
      - Priority: Critical / High / Medium / Low
      - Labels, estimated/logged hours

    - `work_subtasks` - sub-tasks within tasks
      - Checkbox-style checklist items

    - `work_time_logs` - time log entries per task
      - Hours, description, date, employee

    - `work_task_comments` - comments/activity log
      - Auto and manual comments

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS work_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  assigned_to_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'To Do',
  start_date date,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  estimated_hours numeric DEFAULT 0,
  logged_hours numeric DEFAULT 0,
  labels text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work tasks"
  ON work_tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work tasks"
  ON work_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work tasks"
  ON work_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own work tasks"
  ON work_tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_tasks_user_id ON work_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_project_id ON work_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assigned ON work_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks(status);

CREATE TABLE IF NOT EXISTS work_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES work_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  label text NOT NULL DEFAULT '',
  is_checked boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work subtasks"
  ON work_subtasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work subtasks"
  ON work_subtasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work subtasks"
  ON work_subtasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own work subtasks"
  ON work_subtasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_subtasks_task ON work_subtasks(task_id);

CREATE TABLE IF NOT EXISTS work_time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES work_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work time logs"
  ON work_time_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work time logs"
  ON work_time_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work time logs"
  ON work_time_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own work time logs"
  ON work_time_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_time_logs_task ON work_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_date ON work_time_logs(date);
CREATE INDEX IF NOT EXISTS idx_work_time_logs_employee ON work_time_logs(employee_id);

CREATE TABLE IF NOT EXISTS work_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES work_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  comment_type text NOT NULL DEFAULT 'comment',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work task comments"
  ON work_task_comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work task comments"
  ON work_task_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own work task comments"
  ON work_task_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_comments_task ON work_task_comments(task_id);