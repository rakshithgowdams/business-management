/*
  # Create Website Leads Table

  ## Summary
  Creates a table to store contact form submissions from published websites.
  When a visitor fills out the contact form on a published website, their
  submission is saved here and visible to the website owner in their dashboard.

  ## New Tables
  - `website_leads`
    - `id` (uuid, primary key)
    - `project_id` (uuid, FK to website_projects) - which website the lead came from
    - `owner_user_id` (uuid, FK to auth.users) - the website owner
    - `name` (text) - visitor's name
    - `email` (text) - visitor's email
    - `phone` (text, nullable) - visitor's phone
    - `message` (text, nullable) - visitor's message
    - `section_label` (text) - which section/form submitted (e.g., "Contact Us", "Free Call")
    - `status` (text) - lead status: new, read, contacted, closed
    - `notes` (text, nullable) - owner notes about this lead
    - `submitted_at` (timestamptz)
    - `read_at` (timestamptz, nullable) - when owner first viewed it

  ## Security
  - RLS enabled
  - INSERT: public (no auth required - visitors submit contact forms)
  - SELECT: authenticated users can only view leads for their own projects
  - UPDATE: authenticated users can update status/notes on their own leads
  - DELETE: authenticated users can delete their own leads
*/

CREATE TABLE IF NOT EXISTS website_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  message text DEFAULT '',
  section_label text DEFAULT 'Contact Form',
  status text NOT NULL DEFAULT 'new',
  notes text DEFAULT '',
  submitted_at timestamptz DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_website_leads_project_id ON website_leads(project_id);
CREATE INDEX IF NOT EXISTS idx_website_leads_owner_user_id ON website_leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_website_leads_submitted_at ON website_leads(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_leads_status ON website_leads(status);

ALTER TABLE website_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a website lead"
  ON website_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view their website leads"
  ON website_leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their website leads"
  ON website_leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their website leads"
  ON website_leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);
