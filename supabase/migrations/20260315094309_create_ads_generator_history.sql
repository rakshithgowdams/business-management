/*
  # Ads Generator History Table

  ## Summary
  Creates a table to store all generated ads (carousel images, carousel videos, UGC images, UGC videos)
  and content strategy research results from the Ads Generator feature.

  ## New Tables
  - `ads_generator_history`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK → auth.users)
    - `type` (text) — 'carousel_image' | 'carousel_video' | 'ugc_image' | 'ugc_video' | 'content_strategy'
    - `title` (text) — human-readable label
    - `brief` (text) — original user brief/product description
    - `platform` (text) — target platform (instagram, facebook, etc.)
    - `objective` (text) — campaign objective
    - `style` (text) — visual style or UGC style
    - `prompt` (text) — AI-generated prompt used
    - `strategy_content` (jsonb) — full strategy output (for content_strategy type)
    - `result_urls` (text[]) — array of generated image/video URLs
    - `slide_count` (int) — for carousel types
    - `duration` (int) — video duration in seconds
    - `aspect_ratio` (text) — output aspect ratio
    - `model_used` (text) — kie model used
    - `metadata` (jsonb) — additional metadata
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only access their own records
*/

CREATE TABLE IF NOT EXISTS ads_generator_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'carousel_image',
  title text NOT NULL DEFAULT '',
  brief text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT '',
  objective text NOT NULL DEFAULT '',
  style text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  strategy_content jsonb,
  result_urls text[] NOT NULL DEFAULT '{}',
  slide_count int NOT NULL DEFAULT 1,
  duration int NOT NULL DEFAULT 5,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  model_used text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_generator_history_user_id ON ads_generator_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_generator_history_type ON ads_generator_history(type);
CREATE INDEX IF NOT EXISTS idx_ads_generator_history_created_at ON ads_generator_history(created_at DESC);

ALTER TABLE ads_generator_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own ads history"
  ON ads_generator_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ads history"
  ON ads_generator_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ads history"
  ON ads_generator_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
