/*
  # Create KIE Custom Models Table

  1. New Tables
    - `kie_custom_models`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - user-friendly label for the model
      - `model_id` (text) - the KIE API model identifier (e.g. "kling-3.0/video")
      - `category` (text) - model category: image, video, music, voice, edit
      - `endpoint` (text) - API endpoint path
      - `method` (text) - HTTP method (POST, GET, etc.)
      - `default_input` (jsonb) - default input parameters parsed from cURL
      - `input_schema` (jsonb) - describes each input field: type, required, default, options
      - `has_prompt` (boolean) - whether model accepts a text prompt
      - `has_image_input` (boolean) - whether model accepts image URLs/uploads
      - `has_callback` (boolean) - whether model supports callback URLs
      - `original_curl` (text) - the raw cURL command saved for reference
      - `notes` (text) - optional user notes
      - `is_active` (boolean) - soft toggle
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `kie_custom_models` table
    - Add policies for authenticated users to manage their own models
*/

CREATE TABLE IF NOT EXISTS kie_custom_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL DEFAULT '',
  model_id text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'image',
  endpoint text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT 'POST',
  default_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  has_prompt boolean NOT NULL DEFAULT false,
  has_image_input boolean NOT NULL DEFAULT false,
  has_callback boolean NOT NULL DEFAULT false,
  original_curl text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kie_custom_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom models"
  ON kie_custom_models FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom models"
  ON kie_custom_models FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom models"
  ON kie_custom_models FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom models"
  ON kie_custom_models FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
