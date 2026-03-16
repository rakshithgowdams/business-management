/*
  # Create Follow-up Sequences and History tables

  1. New Tables
    - `followup_sequences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - sequence name
      - `steps` (jsonb) - array of step objects with day, channel, action
      - `active` (boolean) - whether the sequence is active
      - `builtin` (boolean) - whether it's a prebuilt sequence
      - `builtin_key` (text) - unique key for builtin sequences per user
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `followup_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_name` (text)
      - `type` (text) - follow-up type (invoice_overdue, proposal_followup, etc.)
      - `channel` (text) - whatsapp, email, linkedin
      - `message_preview` (text)
      - `status` (text) - sent, pending, failed
      - `amount` (numeric) - optional amount associated
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own sequences and history
*/

CREATE TABLE IF NOT EXISTS followup_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT false,
  builtin boolean NOT NULL DEFAULT false,
  builtin_key text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequences"
  ON followup_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequences"
  ON followup_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequences"
  ON followup_sequences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sequences"
  ON followup_sequences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS followup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT '',
  message_preview text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent',
  amount numeric DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE followup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow-up history"
  ON followup_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follow-up history"
  ON followup_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-up history"
  ON followup_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follow-up history"
  ON followup_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
