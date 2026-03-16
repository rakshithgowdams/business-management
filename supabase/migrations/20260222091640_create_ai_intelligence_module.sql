/*
  # Create AI Intelligence Module

  1. New Tables
    - `ai_analyses` - AI analysis records with all result types
    - `ai_business_profiles` - user's business profile for AI context

  2. Security
    - Enable RLS on both tables
    - Users can only CRUD their own data
*/

CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  business_name text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis_result jsonb,
  roi_result jsonb,
  outreach_result jsonb,
  competitor_result jsonb,
  proposal_result jsonb,
  deal_potential text NOT NULL DEFAULT 'Medium',
  estimated_deal_value text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_analyses"
  ON ai_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_analyses"
  ON ai_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_analyses"
  ON ai_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_analyses"
  ON ai_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name text NOT NULL DEFAULT 'MyDesignNexus',
  owner_name text NOT NULL DEFAULT 'Rakshith',
  city text NOT NULL DEFAULT 'Hassan/Mysuru, Karnataka',
  services_offered jsonb NOT NULL DEFAULT '["AI Automation", "AI Call Agent", "Web Development"]'::jsonb,
  price_ranges jsonb NOT NULL DEFAULT '{"AI Automation": "15000-150000", "AI Call Agent": "20000-200000", "Web Development": "8000-80000"}'::jsonb,
  usp text NOT NULL DEFAULT '',
  target_industries jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_stories jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_business_profiles"
  ON ai_business_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_business_profiles"
  ON ai_business_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_business_profiles"
  ON ai_business_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_business_profiles"
  ON ai_business_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_client_id ON ai_analyses(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_deal_potential ON ai_analyses(deal_potential);