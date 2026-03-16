/*
  # Create Business Pipeline System

  ## Overview
  This migration creates a comprehensive three-part business pipeline system:
  1. Sales CRM Pipeline — track deals from Lead to Won/Lost
  2. Onboarding Pipeline — visual stage tracker for client onboarding
  3. Project Pipeline — milestone-based project stage management

  ## New Tables

  ### Sales CRM
  1. `pipeline_deals` — master deal records with stage, value, probability
  2. `pipeline_deal_activities` — activity log per deal (calls, emails, notes, stage changes)

  ### Onboarding Pipeline
  3. `onboarding_pipeline_stages` — user-configurable stage definitions
  4. `onboarding_pipeline_entries` — one row per client in the funnel
  5. `onboarding_pipeline_stage_checklist` — checklist items per entry per stage

  ### Project Pipeline
  6. `project_pipeline_entries` — kanban entry wrapping/linking projects
  7. `project_pipeline_milestones` — deliverables/milestones per project entry
  8. `project_pipeline_dependencies` — dependency links between project entries

  ## Security
  All tables have RLS enabled with 4 policies each (SELECT, INSERT, UPDATE, DELETE)
  all scoped to auth.uid() = user_id

  ## Notes
  - No existing tables are modified
  - All FK references to existing tables use ON DELETE SET NULL / CASCADE
  - Default stage values match constants in the frontend lib
*/

-- ==================== SALES CRM ====================

CREATE TABLE IF NOT EXISTS pipeline_deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id           uuid REFERENCES clients(id) ON DELETE SET NULL,
  title               text NOT NULL,
  company_name        text NOT NULL DEFAULT '',
  contact_name        text NOT NULL DEFAULT '',
  contact_email       text NOT NULL DEFAULT '',
  contact_phone       text NOT NULL DEFAULT '',
  stage               text NOT NULL DEFAULT 'Lead',
  deal_value          numeric(15,2) NOT NULL DEFAULT 0,
  probability         integer NOT NULL DEFAULT 10,
  expected_close_date date,
  actual_close_date   date,
  lost_reason         text NOT NULL DEFAULT '',
  source              text NOT NULL DEFAULT '',
  priority            text NOT NULL DEFAULT 'Medium',
  tags                text NOT NULL DEFAULT '',
  internal_notes      text NOT NULL DEFAULT '',
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pipeline_deals_user_stage ON pipeline_deals (user_id, stage);

ALTER TABLE pipeline_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deals"
  ON pipeline_deals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals"
  ON pipeline_deals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals"
  ON pipeline_deals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deals"
  ON pipeline_deals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Deal Activities
CREATE TABLE IF NOT EXISTS pipeline_deal_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid NOT NULL REFERENCES pipeline_deals(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type   text NOT NULL DEFAULT 'Note',
  description     text NOT NULL DEFAULT '',
  activity_date   date NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date  date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pipeline_deal_activities_deal ON pipeline_deal_activities (deal_id);

ALTER TABLE pipeline_deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deal activities"
  ON pipeline_deal_activities FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deal activities"
  ON pipeline_deal_activities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deal activities"
  ON pipeline_deal_activities FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deal activities"
  ON pipeline_deal_activities FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ==================== ONBOARDING PIPELINE ====================

CREATE TABLE IF NOT EXISTS onboarding_pipeline_stages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name      text NOT NULL,
  stage_order     integer NOT NULL DEFAULT 0,
  color           text NOT NULL DEFAULT 'blue',
  checklist_template text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_pipeline_stages_user ON onboarding_pipeline_stages (user_id, stage_order);

ALTER TABLE onboarding_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding stages"
  ON onboarding_pipeline_stages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding stages"
  ON onboarding_pipeline_stages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding stages"
  ON onboarding_pipeline_stages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding stages"
  ON onboarding_pipeline_stages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Onboarding Pipeline Entries
CREATE TABLE IF NOT EXISTS onboarding_pipeline_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_id       uuid REFERENCES onboardings(id) ON DELETE SET NULL,
  client_id           uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name         text NOT NULL DEFAULT '',
  client_email        text NOT NULL DEFAULT '',
  current_stage       text NOT NULL DEFAULT 'Welcome',
  stage_entered_at    timestamptz NOT NULL DEFAULT now(),
  target_go_live_date date,
  notes               text NOT NULL DEFAULT '',
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_pipeline_entries_user ON onboarding_pipeline_entries (user_id, current_stage);

ALTER TABLE onboarding_pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding entries"
  ON onboarding_pipeline_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding entries"
  ON onboarding_pipeline_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding entries"
  ON onboarding_pipeline_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding entries"
  ON onboarding_pipeline_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Onboarding Stage Checklist
CREATE TABLE IF NOT EXISTS onboarding_pipeline_stage_checklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    uuid NOT NULL REFERENCES onboarding_pipeline_entries(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name  text NOT NULL,
  label       text NOT NULL,
  is_checked  boolean NOT NULL DEFAULT false,
  checked_at  timestamptz,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_stage_checklist_entry ON onboarding_pipeline_stage_checklist (entry_id, stage_name);

ALTER TABLE onboarding_pipeline_stage_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stage checklist"
  ON onboarding_pipeline_stage_checklist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage checklist"
  ON onboarding_pipeline_stage_checklist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stage checklist"
  ON onboarding_pipeline_stage_checklist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stage checklist"
  ON onboarding_pipeline_stage_checklist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ==================== PROJECT PIPELINE ====================

CREATE TABLE IF NOT EXISTS project_pipeline_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES projects(id) ON DELETE SET NULL,
  title             text NOT NULL,
  client_name       text NOT NULL DEFAULT '',
  stage             text NOT NULL DEFAULT 'Discovery',
  priority          text NOT NULL DEFAULT 'Medium',
  start_date        date,
  target_end_date   date,
  actual_end_date   date,
  budget            numeric(15,2) NOT NULL DEFAULT 0,
  notes             text NOT NULL DEFAULT '',
  tags              text NOT NULL DEFAULT '',
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_pipeline_entries_user ON project_pipeline_entries (user_id, stage);

ALTER TABLE project_pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project pipeline entries"
  ON project_pipeline_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project pipeline entries"
  ON project_pipeline_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project pipeline entries"
  ON project_pipeline_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project pipeline entries"
  ON project_pipeline_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Project Pipeline Milestones
CREATE TABLE IF NOT EXISTS project_pipeline_milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    uuid NOT NULL REFERENCES project_pipeline_entries(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date    date,
  status      text NOT NULL DEFAULT 'Pending',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_pipeline_milestones_entry ON project_pipeline_milestones (entry_id);

ALTER TABLE project_pipeline_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project milestones"
  ON project_pipeline_milestones FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project milestones"
  ON project_pipeline_milestones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project milestones"
  ON project_pipeline_milestones FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project milestones"
  ON project_pipeline_milestones FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Project Pipeline Dependencies
CREATE TABLE IF NOT EXISTS project_pipeline_dependencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id        uuid NOT NULL REFERENCES project_pipeline_entries(id) ON DELETE CASCADE,
  depends_on_id   uuid NOT NULL REFERENCES project_pipeline_entries(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, depends_on_id)
);

ALTER TABLE project_pipeline_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project dependencies"
  ON project_pipeline_dependencies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project dependencies"
  ON project_pipeline_dependencies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project dependencies"
  ON project_pipeline_dependencies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project dependencies"
  ON project_pipeline_dependencies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
