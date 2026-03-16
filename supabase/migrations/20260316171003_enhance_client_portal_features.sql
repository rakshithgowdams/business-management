/*
  # Enhance Client Portal Features

  1. Modified Tables
    - `portal_shared_documents`
      - Add `file_path` (text) - storage path for uploaded files
      - Add `download_count` (integer) - track how many times a document was downloaded
      - Add `uploaded_via` (text) - 'url' or 'upload' to distinguish method

  2. New Tables
    - `portal_announcements` - Announcements/messages from business owner to client
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `title` (text) - announcement title
      - `message` (text) - announcement body
      - `priority` (text) - 'low', 'normal', 'high', 'urgent'
      - `is_pinned` (boolean) - pin to top
      - `is_visible` (boolean) - toggle visibility
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `portal_faq` - Frequently asked questions for the portal
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `question` (text) - the FAQ question
      - `answer` (text) - the answer
      - `sort_order` (integer) - display order
      - `is_visible` (boolean) - toggle visibility
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Add policies for owner access on new tables
    - Add policies for read access via portal sessions
*/

-- Add columns to portal_shared_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_shared_documents' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE portal_shared_documents ADD COLUMN file_path text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_shared_documents' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE portal_shared_documents ADD COLUMN download_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_shared_documents' AND column_name = 'uploaded_via'
  ) THEN
    ALTER TABLE portal_shared_documents ADD COLUMN uploaded_via text DEFAULT 'url';
  END IF;
END $$;

-- Create portal_announcements table
CREATE TABLE IF NOT EXISTS portal_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'normal',
  is_pinned boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own announcements"
  ON portal_announcements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert announcements"
  ON portal_announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own announcements"
  ON portal_announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own announcements"
  ON portal_announcements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_announcements_portal_id ON portal_announcements(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_announcements_user_id ON portal_announcements(user_id);

-- Create portal_faq table
CREATE TABLE IF NOT EXISTS portal_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portal_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own FAQs"
  ON portal_faq FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert FAQs"
  ON portal_faq FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own FAQs"
  ON portal_faq FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own FAQs"
  ON portal_faq FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_faq_portal_id ON portal_faq(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_faq_user_id ON portal_faq(user_id);

-- Create storage bucket for portal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('portal-documents', 'portal-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload portal documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'portal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view own portal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'portal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can delete own portal documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'portal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add announcements and faq to allowed_sections default
-- (existing portals keep their current settings, new ones will have these)
