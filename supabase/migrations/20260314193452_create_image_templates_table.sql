/*
  # Create Image Templates Table

  ## Purpose
  Stores reusable image generation templates that users can create in Settings
  and then apply in the Marketing Studio image generation tools.

  ## New Tables
  - `image_templates`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `name` (text) - template display name
    - `category` (text) - e.g. "Marketing", "UGC", "Product", "Social", "Custom"
    - `master_prompt` (text) - the master/base prompt for this template
    - `reference_image_url` (text, nullable) - stored reference image URL
    - `reference_image_path` (text, nullable) - storage path for cleanup
    - `tags` (text[]) - searchable tags
    - `default_model` (text, nullable) - preferred model id
    - `default_aspect_ratio` (text, nullable)
    - `default_style` (text, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled, users can only access their own templates
*/

CREATE TABLE IF NOT EXISTS image_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Custom',
  master_prompt text NOT NULL DEFAULT '',
  reference_image_url text,
  reference_image_path text,
  tags text[] DEFAULT '{}',
  default_model text,
  default_aspect_ratio text DEFAULT '1:1',
  default_style text DEFAULT 'Photorealistic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE image_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own image templates"
  ON image_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image templates"
  ON image_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own image templates"
  ON image_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own image templates"
  ON image_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_image_templates_user_id ON image_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_image_templates_category ON image_templates(category);
