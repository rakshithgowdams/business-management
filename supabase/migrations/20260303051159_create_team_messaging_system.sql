/*
  # Create Team Messaging System

  1. New Tables
    - `team_chat_profiles`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members) - the team member
      - `bio` (text) - user biography/about
      - `profile_pic_url` (text) - profile picture URL
      - `display_name` (text) - custom display name
      - `is_online` (boolean) - current online status
      - `last_seen_at` (timestamptz) - last activity timestamp
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `team_conversations`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users) - business owner scope
      - `type` (text) - 'direct' or 'group'
      - `name` (text) - group name (null for direct)
      - `description` (text) - group description
      - `project_id` (uuid) - linked project for project-based groups
      - `created_by` (uuid, references team_members) - who created it
      - `avatar_url` (text) - group avatar
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `team_conversation_members`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references team_conversations)
      - `team_member_id` (uuid, references team_members)
      - `role` (text) - 'admin' or 'member'
      - `joined_at` (timestamptz)
      - `last_read_at` (timestamptz) - for unread tracking
      - `is_muted` (boolean) - mute notifications

    - `team_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references team_conversations)
      - `sender_id` (uuid, references team_members)
      - `content` (text) - message text
      - `message_type` (text) - 'text', 'image', 'file', 'system'
      - `attachment_url` (text) - file/image URL
      - `attachment_name` (text) - file name
      - `reply_to_id` (uuid) - for reply threads
      - `is_edited` (boolean)
      - `is_deleted` (boolean) - soft delete
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `team_message_approvals`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users) - business owner scope
      - `requester_id` (uuid, references team_members) - employee requesting
      - `target_id` (uuid, references team_members) - management person to message
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `reason` (text) - reason for requesting access
      - `reviewed_by` (uuid) - who reviewed (owner or management)
      - `reviewed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `team_typing_indicators`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references team_conversations)
      - `team_member_id` (uuid, references team_members)
      - `updated_at` (timestamptz) - when they started typing

  2. Security
    - Enable RLS on all tables
    - Service role access for edge function operations
    - Conversations scoped by owner_id

  3. Important Notes
    - Employees cannot message management without approval
    - Management can message anyone freely
    - Management can create project-based group chats
    - All messaging scoped to the same business owner
    - Real-time via Supabase Realtime subscriptions + polling fallback
*/

CREATE TABLE IF NOT EXISTS team_chat_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio text NOT NULL DEFAULT '',
  profile_pic_url text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_chat_profiles_member ON team_chat_profiles(team_member_id);

ALTER TABLE team_chat_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages chat profiles"
  ON team_chat_profiles FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts chat profiles"
  ON team_chat_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates chat profiles"
  ON team_chat_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes chat profiles"
  ON team_chat_profiles FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS team_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  project_id uuid,
  created_by uuid REFERENCES team_members(id) ON DELETE SET NULL,
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_conversations_owner ON team_conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_conversations_type ON team_conversations(type);
CREATE INDEX IF NOT EXISTS idx_team_conversations_project ON team_conversations(project_id);

ALTER TABLE team_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages conversations"
  ON team_conversations FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts conversations"
  ON team_conversations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates conversations"
  ON team_conversations FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes conversations"
  ON team_conversations FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS team_conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES team_conversations(id) ON DELETE CASCADE NOT NULL,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false,
  UNIQUE(conversation_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_conv_members_conv ON team_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_conv_members_member ON team_conversation_members(team_member_id);

ALTER TABLE team_conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages conversation members"
  ON team_conversation_members FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts conversation members"
  ON team_conversation_members FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates conversation members"
  ON team_conversation_members FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes conversation members"
  ON team_conversation_members FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES team_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url text NOT NULL DEFAULT '',
  attachment_name text NOT NULL DEFAULT '',
  reply_to_id uuid REFERENCES team_messages(id) ON DELETE SET NULL,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_messages_conv ON team_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created ON team_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_reply ON team_messages(reply_to_id);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages messages"
  ON team_messages FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts messages"
  ON team_messages FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates messages"
  ON team_messages FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes messages"
  ON team_messages FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS team_message_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  requester_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text NOT NULL DEFAULT '',
  reviewed_by uuid REFERENCES team_members(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_team_approvals_owner ON team_message_approvals(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_approvals_requester ON team_message_approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_team_approvals_target ON team_message_approvals(target_id);
CREATE INDEX IF NOT EXISTS idx_team_approvals_status ON team_message_approvals(status);

ALTER TABLE team_message_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages approvals"
  ON team_message_approvals FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts approvals"
  ON team_message_approvals FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates approvals"
  ON team_message_approvals FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes approvals"
  ON team_message_approvals FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS team_typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES team_conversations(id) ON DELETE CASCADE NOT NULL,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, team_member_id)
);

ALTER TABLE team_typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages typing indicators"
  ON team_typing_indicators FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role inserts typing indicators"
  ON team_typing_indicators FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates typing indicators"
  ON team_typing_indicators FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role deletes typing indicators"
  ON team_typing_indicators FOR DELETE
  TO service_role
  USING (true);
