/*
  # Create Agreement Builder Storage Table

  1. New Tables
    - `agreement_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text) - agreement title for list display
      - `subtitle` (text) - service type subtitle
      - `client_name` (text) - client name for list display
      - `total_amount` (numeric) - total agreement value
      - `status` (text) - draft, active, completed, cancelled
      - `draft_data` (jsonb) - full AgreementDraft JSON object
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `agreement_drafts` table
    - Add policies for authenticated users to manage their own data

  3. Notes
    - Stores the full agreement builder draft as JSONB for flexibility
    - Indexed on user_id and status for fast queries
*/

CREATE TABLE IF NOT EXISTS agreement_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agreement_drafts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agreement_drafts_user_id ON agreement_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_agreement_drafts_status ON agreement_drafts(status);

CREATE POLICY "Users can view own agreement drafts"
  ON agreement_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreement drafts"
  ON agreement_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agreement drafts"
  ON agreement_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agreement drafts"
  ON agreement_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
