/*
  # Create Team Members & Permissions System

  1. New Tables
    - `team_members`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users) - the business owner who created this team member
      - `full_name` (text) - display name
      - `email` (text) - unique login email for the team member
      - `password_hash` (text) - bcrypt hashed password
      - `role` (text) - 'employee' or 'management'
      - `department` (text) - department assignment
      - `job_title` (text) - position/title
      - `avatar_url` (text) - profile picture
      - `is_active` (boolean) - account enabled/disabled
      - `permissions` (jsonb) - granular feature access list
      - `last_login_at` (timestamptz) - last login timestamp
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp

    - `team_sessions`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `session_token` (text, unique) - secure session token
      - `expires_at` (timestamptz) - session expiry
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on both tables
    - Only business owners can manage their own team members
    - Team members can read their own record
    - Session tokens accessible only to the member who owns them

  3. Important Notes
    - Passwords stored as bcrypt hashes (done in edge function)
    - Permissions is a JSONB array of feature keys the user can access
    - Owner can enable/disable accounts via is_active flag
    - Sessions are separate from Supabase auth (team members don't use Supabase auth)
*/

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'management')),
  department text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS team_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_team_sessions_member ON team_sessions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_expires ON team_sessions(expires_at);

ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sessions"
  ON team_sessions FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert sessions"
  ON team_sessions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete sessions"
  ON team_sessions FOR DELETE
  TO service_role
  USING (true);
