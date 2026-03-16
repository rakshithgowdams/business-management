/*
  # Create Project Budget Tracker Module

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `name` (text) - project name
      - `client_name` (text) - client name
      - `category` (text) - AI Automation / AI Call Agent / Web Development / Branding / Content Creation / Other
      - `status` (text) - Active / On Hold / Completed / Overbudget
      - `budget` (numeric) - total budget amount
      - `revenue` (numeric) - what client is paying
      - `start_date` (date)
      - `end_date` (date)
      - `description` (text) - project scope
      - `tags` (text) - comma separated tags
      - `created_at` (timestamptz)

    - `project_expenses`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - `user_id` (uuid, FK to auth.users)
      - `amount` (numeric) - expense amount
      - `category` (text) - Tools & Software / Team & HR / Ads & Marketing / etc.
      - `description` (text)
      - `date` (date)
      - `payment_method` (text) - UPI / Cash / Card / Bank Transfer
      - `receipt_note` (text)
      - `created_at` (timestamptz)

    - `project_team`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - `user_id` (uuid, FK to auth.users)
      - `member_name` (text)
      - `role` (text)
      - `hours_worked` (numeric)
      - `rate_per_hour` (numeric)
      - `total_cost` (numeric) - auto-calculated
      - `date` (date)
      - `created_at` (timestamptz)

    - `project_tools`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - `user_id` (uuid, FK to auth.users)
      - `tool_name` (text)
      - `purpose` (text)
      - `cost_per_month` (numeric)
      - `months_used` (numeric)
      - `total_cost` (numeric) - auto-calculated
      - `billing_type` (text) - Monthly / One-time / Yearly
      - `created_at` (timestamptz)

    - `project_time_entries`
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - `user_id` (uuid, FK to auth.users)
      - `date` (date)
      - `task_description` (text)
      - `hours` (numeric)
      - `member_name` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can only access their own data
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  client_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  status text NOT NULL DEFAULT 'Active',
  budget numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  description text DEFAULT '',
  tags text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Miscellaneous',
  description text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'UPI',
  receipt_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project expenses"
  ON project_expenses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project expenses"
  ON project_expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project expenses"
  ON project_expenses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project expenses"
  ON project_expenses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  member_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Developer',
  hours_worked numeric NOT NULL DEFAULT 0,
  rate_per_hour numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project team"
  ON project_team FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project team"
  ON project_team FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project team"
  ON project_team FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project team"
  ON project_team FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tool_name text NOT NULL DEFAULT '',
  purpose text DEFAULT '',
  cost_per_month numeric NOT NULL DEFAULT 0,
  months_used numeric NOT NULL DEFAULT 1,
  total_cost numeric NOT NULL DEFAULT 0,
  billing_type text NOT NULL DEFAULT 'Monthly',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project tools"
  ON project_tools FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project tools"
  ON project_tools FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project tools"
  ON project_tools FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project tools"
  ON project_tools FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  task_description text NOT NULL DEFAULT '',
  hours numeric NOT NULL DEFAULT 0,
  member_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project time entries"
  ON project_time_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project time entries"
  ON project_time_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project time entries"
  ON project_time_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project time entries"
  ON project_time_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_user_id ON project_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tools_project_id ON project_tools(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_project_id ON project_time_entries(project_id);