/*
  # Create Team AI Chat History

  1. New Tables
    - `team_ai_chat_sessions`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, FK to team_members)
      - `owner_id` (uuid, FK to auth.users)
      - `title` (text) - auto-generated from first message
      - `message_count` (integer) - total messages in session
      - `last_message_at` (timestamptz) - timestamp of last message
      - `created_at` (timestamptz)

    - `team_ai_chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, FK to team_ai_chat_sessions)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - the message content
      - `tokens_used` (integer) - tokens consumed by this message
      - `model_used` (text) - which AI model was used
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Policies allow team members to manage their own sessions/messages
    - Owner can view all sessions for their team members

  3. Indexes
    - session_id + created_at on messages for fast loading
    - team_member_id + created_at on sessions for listing
*/

CREATE TABLE IF NOT EXISTS team_ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  message_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES team_ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  tokens_used integer NOT NULL DEFAULT 0,
  model_used text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_ai_chat_sessions_member
  ON team_ai_chat_sessions(team_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_ai_chat_messages_session
  ON team_ai_chat_messages(session_id, created_at ASC);

CREATE POLICY "Team members can view own sessions"
  ON team_ai_chat_sessions FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Team members can insert own sessions"
  ON team_ai_chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update own sessions"
  ON team_ai_chat_sessions FOR UPDATE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Team members can delete own sessions"
  ON team_ai_chat_sessions FOR DELETE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE owner_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "Members can view messages in own sessions"
  ON team_ai_chat_messages FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM team_ai_chat_sessions
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE owner_id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert messages in own sessions"
  ON team_ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM team_ai_chat_sessions
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE owner_id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete messages in own sessions"
  ON team_ai_chat_messages FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM team_ai_chat_sessions
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE owner_id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );
