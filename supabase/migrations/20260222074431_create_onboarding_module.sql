/*
  # Create Onboarding Module

  1. New Tables
    - `onboardings` - main onboarding records
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `full_name` (text) - person being onboarded
      - `email` (text)
      - `phone` (text)
      - `role` (text) - role/designation
      - `onboarding_type` (text) - Client/Employee/Freelancer/Intern/Partner
      - `status` (text) - Not Started/In Progress/Completed/On Hold/Cancelled
      - `assigned_to` (text) - who handles onboarding
      - `start_date` (date)
      - `expected_end_date` (date)
      - `actual_end_date` (date, nullable)
      - `priority` (text) - High/Medium/Low
      - `internal_notes` (text)
      - `welcome_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `onboarding_checklist` - checklist items per onboarding
      - `id` (uuid, primary key)
      - `onboarding_id` (uuid, FK to onboardings)
      - `user_id` (uuid, FK to auth.users)
      - `label` (text) - checklist item text
      - `is_checked` (boolean)
      - `checked_at` (timestamptz, nullable)
      - `sort_order` (integer)
      - `created_at` (timestamptz)

    - `onboarding_documents` - document metadata
      - `id` (uuid, primary key)
      - `onboarding_id` (uuid, FK to onboardings)
      - `user_id` (uuid, FK to auth.users)
      - `doc_name` (text)
      - `doc_type` (text)
      - `file_path` (text) - storage path
      - `file_name` (text)
      - `file_size` (integer)
      - `is_required` (boolean)
      - `doc_status` (text) - Received/Pending/Rejected
      - `notes` (text)
      - `created_at` (timestamptz)

    - `onboarding_activities` - communication/activity log
      - `id` (uuid, primary key)
      - `onboarding_id` (uuid, FK to onboardings)
      - `user_id` (uuid, FK to auth.users)
      - `activity_type` (text) - Call/Email/WhatsApp/Meeting/Note/System
      - `description` (text)
      - `activity_date` (timestamptz)
      - `follow_up_date` (date, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data

  3. Storage
    - Create private `onboarding-documents` bucket
*/

CREATE TABLE IF NOT EXISTS onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT '',
  onboarding_type text NOT NULL DEFAULT 'Employee',
  status text NOT NULL DEFAULT 'Not Started',
  assigned_to text DEFAULT '',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date date NOT NULL DEFAULT CURRENT_DATE,
  actual_end_date date,
  priority text NOT NULL DEFAULT 'Medium',
  internal_notes text DEFAULT '',
  welcome_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboardings"
  ON onboardings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboardings"
  ON onboardings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboardings"
  ON onboardings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own onboardings"
  ON onboardings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboardings_user_id ON onboardings(user_id);
CREATE INDEX IF NOT EXISTS idx_onboardings_status ON onboardings(status);

CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES onboardings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  label text NOT NULL DEFAULT '',
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding checklist"
  ON onboarding_checklist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding checklist"
  ON onboarding_checklist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding checklist"
  ON onboarding_checklist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own onboarding checklist"
  ON onboarding_checklist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_onboarding ON onboarding_checklist(onboarding_id);

CREATE TABLE IF NOT EXISTS onboarding_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES onboardings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  doc_name text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'Other',
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size integer DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  doc_status text NOT NULL DEFAULT 'Pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding documents"
  ON onboarding_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding documents"
  ON onboarding_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding documents"
  ON onboarding_documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own onboarding documents"
  ON onboarding_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_docs_onboarding ON onboarding_documents(onboarding_id);

CREATE TABLE IF NOT EXISTS onboarding_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid REFERENCES onboardings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  activity_type text NOT NULL DEFAULT 'Note',
  description text DEFAULT '',
  activity_date timestamptz DEFAULT now(),
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding activities"
  ON onboarding_activities FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding activities"
  ON onboarding_activities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding activities"
  ON onboarding_activities FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own onboarding activities"
  ON onboarding_activities FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_activities_onboarding ON onboarding_activities(onboarding_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-documents',
  'onboarding-documents',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload onboarding documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'onboarding-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view onboarding documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onboarding-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete onboarding documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'onboarding-documents' AND (storage.foldername(name))[1] = auth.uid()::text);