/*
  # Marketing Studio V2 Tables

  1. New Tables
    - `ai_characters` - Stores trained character profiles with reference photos
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - character display name
      - `character_type` (text) - brand_mascot, ai_influencer, real_person, etc.
      - `gender` (text)
      - `age_range` (text)
      - `style_notes` (text) - description of character appearance
      - `signature_elements` (text) - key recognizable features
      - `background_preference` (text)
      - `photos_count` (integer) - number of reference photos uploaded
      - `reference_paths` (jsonb) - array of storage paths in media-assets bucket
      - `status` (text) - training, ready, failed
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `workflow_templates` - Stores saved node-based workflow pipelines
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `nodes` (jsonb) - array of node definitions with positions
      - `connections` (jsonb) - array of connection definitions
      - `is_template` (boolean) - system template vs user-created
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `cinematic_sessions` - Persists cinematic studio workflow state
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - session name
      - `current_step` (integer) - 1-8
      - `state` (jsonb) - full workflow state (prompt, rig, frames, etc.)
      - `hero_frame_url` (text)
      - `hero_frame_path` (text)
      - `final_video_url` (text)
      - `final_video_path` (text)
      - `status` (text) - in_progress, completed, abandoned
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS ai_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  character_type text NOT NULL DEFAULT 'real_person',
  gender text NOT NULL DEFAULT '',
  age_range text NOT NULL DEFAULT '',
  style_notes text NOT NULL DEFAULT '',
  signature_elements text NOT NULL DEFAULT '',
  background_preference text NOT NULL DEFAULT 'contextual',
  photos_count integer NOT NULL DEFAULT 0,
  reference_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ready',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON ai_characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON ai_characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON ai_characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON ai_characters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  connections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON workflow_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflow_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflow_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cinematic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  current_step integer NOT NULL DEFAULT 1,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  hero_frame_url text,
  hero_frame_path text,
  final_video_url text,
  final_video_path text,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cinematic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cinematic sessions"
  ON cinematic_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cinematic sessions"
  ON cinematic_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cinematic sessions"
  ON cinematic_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cinematic sessions"
  ON cinematic_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
