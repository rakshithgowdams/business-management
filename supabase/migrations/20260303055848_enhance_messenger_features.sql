/*
  # Enhance Messenger Features

  1. New Tables
    - `team_message_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references team_messages)
      - `team_member_id` (uuid, references team_members)
      - `emoji` (text) - the reaction emoji
      - `created_at` (timestamptz)
    - `team_pinned_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references team_conversations)
      - `message_id` (uuid, references team_messages)
      - `pinned_by` (uuid, references team_members)
      - `created_at` (timestamptz)
    - `team_message_bookmarks`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references team_messages)
      - `team_member_id` (uuid, references team_members)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `team_messages` - Add `forwarded_from` column for message forwarding

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated access through service role (edge function pattern)

  4. Important Notes
    - Reactions use a unique constraint on (message_id, team_member_id, emoji) to prevent duplicate reactions
    - Pinned messages use a unique constraint on (conversation_id, message_id) to prevent duplicate pins
    - Bookmarks use a unique constraint on (message_id, team_member_id)
*/

CREATE TABLE IF NOT EXISTS team_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, team_member_id, emoji)
);

ALTER TABLE team_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on team_message_reactions"
  ON team_message_reactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS team_pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES team_conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, message_id)
);

ALTER TABLE team_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on team_pinned_messages"
  ON team_pinned_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS team_message_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, team_member_id)
);

ALTER TABLE team_message_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on team_message_bookmarks"
  ON team_message_bookmarks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_messages' AND column_name = 'forwarded_from'
  ) THEN
    ALTER TABLE team_messages ADD COLUMN forwarded_from uuid REFERENCES team_messages(id) ON DELETE SET NULL;
  END IF;
END $$;
