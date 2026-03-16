/*
  # Create Video Templates and Custom Camera Movements

  1. New Tables
    - `video_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - template display name
      - `description` (text) - short description
      - `category` (text) - e.g. 'cinematic', 'product', 'social', etc.
      - `prompt_template` (text) - the base prompt with optional {subject} placeholder
      - `duration` (text) - default duration: '5', '10', '15'
      - `aspect_ratio` (text) - default aspect ratio
      - `kling_mode` (text) - 'std' or 'pro'
      - `camera_motion` (text) - default camera motion type
      - `camera_intensity` (integer) - 1-10
      - `sound` (boolean) - default sound on/off
      - `tags` (text[]) - searchable tags
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `custom_camera_movements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - movement display name
      - `value` (text) - the key sent to the API
      - `description` (text) - what the movement does
      - `category` (text) - grouping: 'push-pull', 'rotation', 'zoom', 'special'
      - `icon_name` (text) - lucide icon name for display
      - `intensity_default` (integer) - default intensity 1-10
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own records

  3. Notes
    - Both tables are per-user, fully isolated via RLS
    - Templates appear in Kling 3.0 Studio as quick-start presets
    - Camera movements appear in Kling 3.0 camera control mode
*/

CREATE TABLE IF NOT EXISTS video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  prompt_template text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '5',
  aspect_ratio text NOT NULL DEFAULT '16:9',
  kling_mode text NOT NULL DEFAULT 'std',
  camera_motion text NOT NULL DEFAULT 'static',
  camera_intensity integer NOT NULL DEFAULT 5,
  sound boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own video_templates"
  ON video_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video_templates"
  ON video_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video_templates"
  ON video_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video_templates"
  ON video_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_video_templates_user_id ON video_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_video_templates_category ON video_templates(category);

CREATE TABLE IF NOT EXISTS custom_camera_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'special',
  intensity_default integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_camera_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own custom_camera_movements"
  ON custom_camera_movements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom_camera_movements"
  ON custom_camera_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom_camera_movements"
  ON custom_camera_movements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom_camera_movements"
  ON custom_camera_movements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_camera_movements_user_id ON custom_camera_movements(user_id);
