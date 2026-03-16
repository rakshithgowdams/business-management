/*
  # Create Password Vault System

  1. New Tables
    - `password_vault`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, not null) - name of the account/service
      - `category` (text, not null) - social_media, subscription, banking, email, work, shopping, gaming, crypto, other
      - `username` (text) - login username or email
      - `encrypted_password` (text) - the stored password (encrypted client-side)
      - `website_url` (text) - URL for the service
      - `notes` (text) - additional notes
      - `is_favorite` (boolean, default false)
      - `last_used` (timestamptz) - last time user accessed this entry
      - `password_strength` (text) - weak, medium, strong, very_strong
      - `tags` (text[], default '{}') - custom tags for organization
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `password_vault` table
    - Users can only access their own password entries
    - Separate policies for SELECT, INSERT, UPDATE, DELETE
*/

CREATE TABLE IF NOT EXISTS password_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  username text DEFAULT '',
  encrypted_password text DEFAULT '',
  website_url text DEFAULT '',
  notes text DEFAULT '',
  is_favorite boolean DEFAULT false,
  last_used timestamptz,
  password_strength text DEFAULT 'medium',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_vault_user_id ON password_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_category ON password_vault(user_id, category);
CREATE INDEX IF NOT EXISTS idx_password_vault_favorite ON password_vault(user_id, is_favorite);

ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passwords"
  ON password_vault FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own passwords"
  ON password_vault FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords"
  ON password_vault FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords"
  ON password_vault FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_password_vault_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER password_vault_updated_at
  BEFORE UPDATE ON password_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_password_vault_updated_at();
