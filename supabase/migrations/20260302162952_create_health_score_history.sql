/*
  # Create Health Score History Table

  1. New Tables
    - `health_score_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `score` (integer, overall score 0-100)
      - `metrics_snapshot` (jsonb, full metrics data at time of calculation)
      - `ai_insights` (jsonb, AI-generated insights at time of calculation)
      - `ai_actions` (jsonb, AI-generated action items)
      - `week_start` (date, the Monday of the week this score covers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `health_score_history`
    - Users can only read, insert, update, and delete their own history

  3. Notes
    - One score per user per week (unique constraint on user_id + week_start)
    - week_start is always a Monday to ensure weekly grouping
    - metrics_snapshot preserves the exact state of all 6 metrics at calculation time
    - Keeps unlimited history for long-term trend analysis
*/

CREATE TABLE IF NOT EXISTS health_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  metrics_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_insights jsonb DEFAULT NULL,
  ai_actions jsonb DEFAULT NULL,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_health_score_user_week
  ON health_score_history (user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_health_score_user_created
  ON health_score_history (user_id, created_at DESC);

ALTER TABLE health_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own health score history"
  ON health_score_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health score history"
  ON health_score_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health score history"
  ON health_score_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health score history"
  ON health_score_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
