/*
  # Add team member contact fields, employment category, and project agreements

  1. Modified Tables
    - `project_team`
      - Added `phone` (text)
      - Added `email` (text)
      - Added `employment_type` (text)

  2. New Tables
    - `project_agreements` - agreement documents linked to projects

  3. Storage
    - Create private `project-agreements` bucket

  4. Security
    - Enable RLS on project_agreements
    - Storage policies scoped to authenticated users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_team' AND column_name = 'phone'
  ) THEN
    ALTER TABLE project_team ADD COLUMN phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_team' AND column_name = 'email'
  ) THEN
    ALTER TABLE project_team ADD COLUMN email text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_team' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE project_team ADD COLUMN employment_type text DEFAULT 'Full-time';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  team_member_id uuid REFERENCES project_team(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  agreement_type text NOT NULL DEFAULT 'Project',
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project agreements"
  ON project_agreements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project agreements"
  ON project_agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project agreements"
  ON project_agreements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project agreements"
  ON project_agreements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_agreements_project_id ON project_agreements(project_id);
CREATE INDEX IF NOT EXISTS idx_project_agreements_user_id ON project_agreements(user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-agreements',
  'project-agreements',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload project agreements"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view project agreements"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update project agreements"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'project-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete project agreements"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-agreements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );