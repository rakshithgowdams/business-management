/*
  # Create Clients Module

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `full_name` (text) - client full name
      - `company_name` (text) - company/business name
      - `client_type` (text) - Individual/Business/Startup/NGO/Government
      - `status` (text) - Active/Inactive/Lead/Blacklisted
      - `avatar_url` (text) - profile photo path
      - `tags` (text) - comma separated tags
      - `primary_phone` (text) - primary phone number
      - `whatsapp_number` (text) - WhatsApp number
      - `secondary_phone` (text) - secondary phone
      - `primary_email` (text) - primary email
      - `secondary_email` (text) - secondary email
      - `website` (text) - website URL
      - `street_address` (text)
      - `city` (text)
      - `state` (text)
      - `pincode` (text)
      - `country` (text) - default India
      - `gstin` (text)
      - `pan_number` (text)
      - `industry_type` (text)
      - `annual_budget_range` (text)
      - `bank_name` (text)
      - `account_number` (text)
      - `ifsc_code` (text)
      - `account_holder_name` (text)
      - `upi_id` (text)
      - `internal_notes` (text)
      - `source` (text) - how they found you
      - `referral_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `client_interactions`
      - `id` (uuid, primary key)
      - `client_id` (uuid, FK to clients)
      - `user_id` (uuid, FK to auth.users)
      - `interaction_type` (text) - Call/Email/Meeting/WhatsApp/Note
      - `description` (text)
      - `interaction_date` (timestamptz)
      - `follow_up_date` (date, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  company_name text DEFAULT '',
  client_type text NOT NULL DEFAULT 'Individual',
  status text NOT NULL DEFAULT 'Active',
  avatar_url text DEFAULT '',
  tags text DEFAULT '',
  primary_phone text NOT NULL DEFAULT '',
  whatsapp_number text DEFAULT '',
  secondary_phone text DEFAULT '',
  primary_email text NOT NULL DEFAULT '',
  secondary_email text DEFAULT '',
  website text DEFAULT '',
  street_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  pincode text DEFAULT '',
  country text DEFAULT 'India',
  gstin text DEFAULT '',
  pan_number text DEFAULT '',
  industry_type text DEFAULT '',
  annual_budget_range text DEFAULT '',
  bank_name text DEFAULT '',
  account_number text DEFAULT '',
  ifsc_code text DEFAULT '',
  account_holder_name text DEFAULT '',
  upi_id text DEFAULT '',
  internal_notes text DEFAULT '',
  source text DEFAULT '',
  referral_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE TABLE IF NOT EXISTS client_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  interaction_type text NOT NULL DEFAULT 'Note',
  description text DEFAULT '',
  interaction_date timestamptz DEFAULT now(),
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client interactions"
  ON client_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client interactions"
  ON client_interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client interactions"
  ON client_interactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client interactions"
  ON client_interactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_user_id ON client_interactions(user_id);