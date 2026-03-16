/*
  # Team AI Access Control System

  1. New Tables
    - `team_ai_settings`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, FK to team_members, unique)
      - `owner_id` (uuid, FK to auth.users)
      - `ai_enabled` (boolean) - master toggle to enable/disable AI for this member
      - `daily_credit_limit` (integer) - max credits per day (10 credits = 100,000 tokens)
      - `assigned_model` (text) - specific model key assigned to this member (e.g. 'geminiFlash', 'claude')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `team_ai_credit_usage`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, FK to team_members)
      - `owner_id` (uuid, FK to auth.users)
      - `usage_date` (date) - the day of usage
      - `credits_used` (integer) - credits consumed that day
      - `tokens_used` (integer) - raw tokens consumed that day
      - `call_count` (integer) - number of AI calls made that day
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Owners can manage their own team members' AI settings
    - Team members cannot modify their own settings

  3. Important Notes
    - Credit system: 1 credit = 10,000 tokens
    - Daily limits reset at midnight (tracked by usage_date)
    - If ai_enabled is false, all AI calls are blocked for that member
    - If assigned_model is set, the member can only use that model
*/

CREATE TABLE IF NOT EXISTS team_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled boolean NOT NULL DEFAULT false,
  daily_credit_limit integer NOT NULL DEFAULT 500,
  assigned_model text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id)
);

ALTER TABLE team_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their team AI settings"
  ON team_ai_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert team AI settings"
  ON team_ai_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their team AI settings"
  ON team_ai_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their team AI settings"
  ON team_ai_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS team_ai_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  credits_used integer NOT NULL DEFAULT 0,
  tokens_used integer NOT NULL DEFAULT 0,
  call_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, usage_date)
);

ALTER TABLE team_ai_credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their team credit usage"
  ON team_ai_credit_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert team credit usage"
  ON team_ai_credit_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their team credit usage"
  ON team_ai_credit_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_team_ai_settings_member ON team_ai_settings(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_ai_settings_owner ON team_ai_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_ai_credit_usage_member_date ON team_ai_credit_usage(team_member_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_team_ai_credit_usage_owner ON team_ai_credit_usage(owner_id);
