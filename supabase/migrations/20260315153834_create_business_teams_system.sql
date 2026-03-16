/*
  # Create Business Teams System

  ## Summary
  Adds a business team management system where users can create teams 
  (Sales Team, Development Team, etc.) and manage team members.
  Teams can also be assigned to projects.

  ## New Tables

  ### `business_teams`
  - User-created teams like "Sales Team", "Dev Team"
  - Has name, description, color, status

  ### `business_team_members`
  - Members belonging to a business_team
  - Stores role, employment type, hourly rate, contact info

  ### `project_business_teams`
  - Junction table: links projects to business_teams

  ## Security
  - RLS enabled on all tables
  - All policies use auth.uid() = owner_id
*/

CREATE TABLE IF NOT EXISTS business_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#FF6B00',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own business teams"
  ON business_teams FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own business teams"
  ON business_teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own business teams"
  ON business_teams FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own business teams"
  ON business_teams FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS business_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_team_id uuid NOT NULL REFERENCES business_teams(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  role text DEFAULT '',
  employment_type text DEFAULT 'Full-time',
  hourly_rate numeric DEFAULT 0,
  avatar_color text DEFAULT '#3B82F6',
  notes text DEFAULT '',
  status text DEFAULT 'active',
  joined_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own business team members"
  ON business_team_members FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own business team members"
  ON business_team_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own business team members"
  ON business_team_members FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own business team members"
  ON business_team_members FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS project_business_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  business_team_id uuid NOT NULL REFERENCES business_teams(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(project_id, business_team_id)
);

ALTER TABLE project_business_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own project business teams"
  ON project_business_teams FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own project business teams"
  ON project_business_teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own project business teams"
  ON project_business_teams FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own project business teams"
  ON project_business_teams FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_business_teams_owner_id ON business_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_team_members_team_id ON business_team_members(business_team_id);
CREATE INDEX IF NOT EXISTS idx_business_team_members_owner_id ON business_team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_business_teams_project_id ON project_business_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_business_teams_team_id ON project_business_teams(business_team_id);
