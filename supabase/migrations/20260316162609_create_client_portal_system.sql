/*
  # Create Client Portal System

  A secure, credential-protected portal that business owners can use to share
  company portfolio, case studies, project progress, testimonials, documents,
  and service offerings with their clients.

  1. New Tables
    - `client_portals` - Portal configuration per client
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - the business owner
      - `client_id` (uuid, references clients) - linked client
      - `portal_name` (text) - display name for the portal
      - `portal_slug` (text) - unique URL-friendly identifier
      - `access_code` (text) - generated password/code for client login
      - `access_code_hash` (text) - hashed version for secure comparison
      - `is_active` (boolean) - toggle portal on/off
      - `expires_at` (timestamptz) - optional expiry date
      - `branding_logo_url` (text) - custom logo for portal
      - `branding_color` (text) - custom accent color
      - `welcome_message` (text) - custom welcome text
      - `company_description` (text) - about the company
      - `allowed_sections` (jsonb) - which sections are visible
      - `last_accessed_at` (timestamptz) - last client visit
      - `total_views` (integer) - visit counter
      - `created_at`, `updated_at` (timestamptz)

    - `portal_case_studies` - Before/after case studies
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `title` (text) - case study title
      - `client_name` (text) - client featured in case study
      - `industry` (text) - industry category
      - `challenge` (text) - the problem/challenge
      - `solution` (text) - the solution provided
      - `results` (text) - outcomes achieved
      - `before_image_url` (text) - before screenshot/image
      - `after_image_url` (text) - after screenshot/image
      - `before_metrics` (jsonb) - metrics before engagement
      - `after_metrics` (jsonb) - metrics after engagement
      - `tags` (text) - comma-separated tags
      - `testimonial_quote` (text) - client quote for this case study
      - `testimonial_author` (text) - quote attribution
      - `is_featured` (boolean) - highlight on portal
      - `sort_order` (integer) - display order
      - `is_visible` (boolean) - toggle visibility
      - `created_at`, `updated_at` (timestamptz)

    - `portal_portfolio_items` - Portfolio/work showcase
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `title` (text) - project title
      - `description` (text) - project description
      - `category` (text) - e.g. Web Design, Branding, Marketing
      - `thumbnail_url` (text) - main image
      - `gallery_urls` (jsonb) - array of additional images
      - `project_url` (text) - live URL if applicable
      - `technologies` (text) - tech/tools used
      - `completion_date` (date) - when completed
      - `is_featured` (boolean)
      - `sort_order` (integer)
      - `is_visible` (boolean)
      - `created_at`, `updated_at` (timestamptz)

    - `portal_testimonials` - Client testimonials
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `author_name` (text)
      - `author_title` (text) - designation
      - `author_company` (text)
      - `author_avatar_url` (text)
      - `quote` (text) - the testimonial text
      - `rating` (integer) - 1-5 stars
      - `project_name` (text) - related project
      - `is_featured` (boolean)
      - `sort_order` (integer)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `portal_shared_documents` - Documents shared with client
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `document_name` (text)
      - `document_type` (text) - proposal, contract, deliverable, report, other
      - `file_url` (text)
      - `file_size` (bigint)
      - `description` (text)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `portal_services` - Service offerings displayed on portal
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `service_name` (text)
      - `description` (text)
      - `icon` (text) - lucide icon name
      - `features` (jsonb) - array of feature strings
      - `price_range` (text) - optional pricing info
      - `sort_order` (integer)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `portal_team_members` - Team showcase
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `name` (text)
      - `title` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `sort_order` (integer)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `portal_shared_projects` - Link existing projects to portal
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `portal_id` (uuid, references client_portals)
      - `project_id` (uuid, references projects)
      - `show_timeline` (boolean) - show milestones
      - `show_budget` (boolean) - show budget info
      - `show_deliverables` (boolean)
      - `show_progress` (boolean) - show completion %
      - `custom_note` (text)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `portal_activity_log` - Track client engagement
      - `id` (uuid, primary key)
      - `portal_id` (uuid, references client_portals)
      - `action` (text) - login, view_portfolio, view_case_study, download_document, etc.
      - `resource_type` (text)
      - `resource_id` (uuid)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamptz)

    - `portal_sessions` - Session management for portal clients
      - `id` (uuid, primary key)
      - `portal_id` (uuid, references client_portals)
      - `session_token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Owner can manage their own portal data
    - Portal activity logs readable by owner

  3. Important Notes
    - Portal access uses slug + access_code (not Supabase auth)
    - Access codes are hashed server-side for security
    - Each portal can be toggled on/off and has optional expiry
    - Sections visibility controlled via `allowed_sections` JSON
*/

-- 1. Client Portals (main configuration table)
CREATE TABLE IF NOT EXISTS client_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  portal_name text NOT NULL DEFAULT '',
  portal_slug text NOT NULL,
  access_code text NOT NULL DEFAULT '',
  access_code_hash text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  branding_logo_url text DEFAULT '',
  branding_color text DEFAULT '#FF6B00',
  welcome_message text DEFAULT '',
  company_description text DEFAULT '',
  allowed_sections jsonb NOT NULL DEFAULT '{"portfolio":true,"case_studies":true,"testimonials":true,"services":true,"team":true,"documents":true,"project_progress":true}'::jsonb,
  last_accessed_at timestamptz,
  total_views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_portals_slug_unique UNIQUE (user_id, portal_slug)
);

ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their portals"
  ON client_portals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create portals"
  ON client_portals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their portals"
  ON client_portals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their portals"
  ON client_portals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_portals_user ON client_portals(user_id);
CREATE INDEX IF NOT EXISTS idx_client_portals_slug ON client_portals(portal_slug);
CREATE INDEX IF NOT EXISTS idx_client_portals_client ON client_portals(client_id);

-- 2. Portal Case Studies
CREATE TABLE IF NOT EXISTS portal_case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  client_name text DEFAULT '',
  industry text DEFAULT '',
  challenge text DEFAULT '',
  solution text DEFAULT '',
  results text DEFAULT '',
  before_image_url text DEFAULT '',
  after_image_url text DEFAULT '',
  before_metrics jsonb DEFAULT '[]'::jsonb,
  after_metrics jsonb DEFAULT '[]'::jsonb,
  tags text DEFAULT '',
  testimonial_quote text DEFAULT '',
  testimonial_author text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage case studies"
  ON portal_case_studies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create case studies"
  ON portal_case_studies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update case studies"
  ON portal_case_studies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete case studies"
  ON portal_case_studies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_case_studies_portal ON portal_case_studies(portal_id);

-- 3. Portal Portfolio Items
CREATE TABLE IF NOT EXISTS portal_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT '',
  thumbnail_url text DEFAULT '',
  gallery_urls jsonb DEFAULT '[]'::jsonb,
  project_url text DEFAULT '',
  technologies text DEFAULT '',
  completion_date date,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage portfolio items"
  ON portal_portfolio_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create portfolio items"
  ON portal_portfolio_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update portfolio items"
  ON portal_portfolio_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete portfolio items"
  ON portal_portfolio_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_portfolio_portal ON portal_portfolio_items(portal_id);

-- 4. Portal Testimonials
CREATE TABLE IF NOT EXISTS portal_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  author_title text DEFAULT '',
  author_company text DEFAULT '',
  author_avatar_url text DEFAULT '',
  quote text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  project_name text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage testimonials"
  ON portal_testimonials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create testimonials"
  ON portal_testimonials FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update testimonials"
  ON portal_testimonials FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete testimonials"
  ON portal_testimonials FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_testimonials_portal ON portal_testimonials(portal_id);

-- 5. Portal Shared Documents
CREATE TABLE IF NOT EXISTS portal_shared_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  document_name text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT 'other',
  file_url text DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  description text DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shared documents"
  ON portal_shared_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create shared documents"
  ON portal_shared_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update shared documents"
  ON portal_shared_documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete shared documents"
  ON portal_shared_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_shared_docs_portal ON portal_shared_documents(portal_id);

-- 6. Portal Services
CREATE TABLE IF NOT EXISTS portal_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  service_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  icon text DEFAULT 'briefcase',
  features jsonb DEFAULT '[]'::jsonb,
  price_range text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage services"
  ON portal_services FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create services"
  ON portal_services FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update services"
  ON portal_services FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete services"
  ON portal_services FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_services_portal ON portal_services(portal_id);

-- 7. Portal Team Members
CREATE TABLE IF NOT EXISTS portal_team_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  title text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_team_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage team showcase"
  ON portal_team_showcase FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create team showcase"
  ON portal_team_showcase FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update team showcase"
  ON portal_team_showcase FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete team showcase"
  ON portal_team_showcase FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_team_showcase_portal ON portal_team_showcase(portal_id);

-- 8. Portal Shared Projects (link existing projects)
CREATE TABLE IF NOT EXISTS portal_shared_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  show_timeline boolean NOT NULL DEFAULT true,
  show_budget boolean NOT NULL DEFAULT false,
  show_deliverables boolean NOT NULL DEFAULT true,
  show_progress boolean NOT NULL DEFAULT true,
  custom_note text DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_shared_projects_unique UNIQUE (portal_id, project_id)
);

ALTER TABLE portal_shared_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shared projects"
  ON portal_shared_projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create shared projects"
  ON portal_shared_projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update shared projects"
  ON portal_shared_projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete shared projects"
  ON portal_shared_projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_shared_projects_portal ON portal_shared_projects(portal_id);

-- 9. Portal Activity Log
CREATE TABLE IF NOT EXISTS portal_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  resource_type text DEFAULT '',
  resource_id uuid,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view portal activity via portal ownership"
  ON portal_activity_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = portal_activity_log.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert portal activity via portal ownership"
  ON portal_activity_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = portal_activity_log.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_portal_activity_portal ON portal_activity_log(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_created ON portal_activity_log(created_at);

-- 10. Portal Sessions
CREATE TABLE IF NOT EXISTS portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view portal sessions via portal ownership"
  ON portal_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = portal_sessions.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_portal ON portal_sessions(portal_id);
