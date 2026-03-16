/*
  # Create Marketing Studio & SMM Agent Tables

  1. New Tables
    - `media_assets` - Stores metadata for generated media (images, videos, music, voice)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - image, video, music, voice, edited
      - `title` (text)
      - `prompt` (text) - the prompt used to generate
      - `provider` (text) - kie_ai, elevenlabs, etc.
      - `status` (text) - pending, processing, completed, failed
      - `task_id` (text) - external API task ID for polling
      - `result_url` (text) - URL of the generated asset
      - `thumbnail_url` (text)
      - `metadata` (jsonb) - extra info like duration, dimensions, etc.
      - `file_size` (bigint)
      - `created_at` (timestamptz)

    - `scheduled_posts` - Social media posts to publish
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `platform` (text) - instagram, facebook
      - `post_type` (text) - image, reel, carousel
      - `caption` (text)
      - `media_urls` (jsonb) - array of media URLs
      - `hashtags` (text[])
      - `scheduled_at` (timestamptz)
      - `published_at` (timestamptz)
      - `status` (text) - draft, scheduled, published, failed
      - `ig_post_id` (text) - Instagram post ID after publishing
      - `error_message` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `content_plans` - AI-generated 30-day content plans
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `plan_data` (jsonb) - full plan with daily content
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text) - draft, active, completed
      - `created_at` (timestamptz)

    - `smm_workflows` - Automation workflows
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `workflow_type` (text) - preset or custom
      - `trigger_config` (jsonb)
      - `action_config` (jsonb)
      - `is_active` (boolean)
      - `last_run_at` (timestamptz)
      - `run_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_usage_logs` - Central AI usage tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `task_type` (text)
      - `model_name` (text)
      - `model_id` (text)
      - `tokens_used` (integer)
      - `estimated_cost` (numeric)
      - `duration_ms` (integer)
      - `status` (text)
      - `module` (text) - marketing_studio, smm_agent, ai_intelligence, etc.
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users to manage their own data
*/

-- media_assets
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL DEFAULT 'image',
  title text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  task_id text,
  result_url text,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  file_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media assets"
  ON media_assets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media assets"
  ON media_assets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media assets"
  ON media_assets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media assets"
  ON media_assets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);

-- scheduled_posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  post_type text NOT NULL DEFAULT 'image',
  caption text NOT NULL DEFAULT '',
  media_urls jsonb DEFAULT '[]'::jsonb,
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  ig_post_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts"
  ON scheduled_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts"
  ON scheduled_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- content_plans
CREATE TABLE IF NOT EXISTS content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL DEFAULT '',
  plan_data jsonb DEFAULT '{}'::jsonb,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content plans"
  ON content_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content plans"
  ON content_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content plans"
  ON content_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content plans"
  ON content_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);

-- smm_workflows
CREATE TABLE IF NOT EXISTS smm_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  workflow_type text NOT NULL DEFAULT 'preset',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  action_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smm_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows"
  ON smm_workflows FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON smm_workflows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON smm_workflows FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON smm_workflows FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_smm_workflows_user_id ON smm_workflows(user_id);

-- ai_usage_logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  task_type text NOT NULL DEFAULT '',
  model_name text NOT NULL DEFAULT '',
  model_id text NOT NULL DEFAULT '',
  tokens_used integer DEFAULT 0,
  estimated_cost numeric(10,4) DEFAULT 0,
  duration_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  module text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON ai_usage_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own usage logs"
  ON ai_usage_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_module ON ai_usage_logs(module);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
