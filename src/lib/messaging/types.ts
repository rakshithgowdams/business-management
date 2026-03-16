export interface ChatProfile {
  id: string;
  team_member_id: string;
  bio: string;
  profile_pic_url: string;
  display_name: string;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatContact {
  id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'management';
  department: string;
  job_title: string;
  avatar_url: string;
  is_active: boolean;
  chat_profile: {
    bio: string;
    profile_pic_url: string;
    display_name: string;
    is_online: boolean;
    last_seen_at: string;
  } | null;
  approval_status: 'none' | 'pending' | 'approved' | 'rejected' | 'not_required';
}

export interface MessageSender {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  profile_pic_url: string;
  display_name: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
  members: { id: string; name: string }[];
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'document' | 'voice' | 'system';

export interface ChatAttachment {
  file: File;
  preview?: string;
  type: MessageType;
  name: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  attachment_url: string;
  attachment_name: string;
  attachment_size: number;
  attachment_mime: string;
  reply_to_id: string | null;
  forwarded_from: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender: MessageSender | null;
  reply_to: {
    id: string;
    content: string;
    sender_id: string;
    message_type: string;
    sender: MessageSender | null;
  } | null;
  reactions?: MessageReaction[];
  is_pinned?: boolean;
  is_bookmarked?: boolean;
  _optimistic?: boolean;
  _uploadProgress?: number;
}

export interface ConversationMember {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  profile_pic_url: string;
  display_name: string;
  is_online: boolean;
}

export interface Conversation {
  id: string;
  owner_id: string;
  type: 'direct' | 'group';
  name: string;
  description: string;
  project_id: string | null;
  created_by: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message: {
    id: string;
    content: string;
    message_type: string;
    sender_id: string;
    created_at: string;
    is_deleted: boolean;
  } | null;
  unread_count: number;
  membership: {
    last_read_at: string;
    is_muted: boolean;
  } | null;
}

export interface MessageApproval {
  id: string;
  owner_id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
    department: string;
  } | null;
  target: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
    department: string;
  } | null;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
    department: string;
  } | null;
}

export interface TypingUser {
  team_member_id: string;
  name: string;
  updated_at: string;
}

export interface TeamStats {
  total_employees: number;
  online_employees: number;
  total_management: number;
  online_management: number;
}

export interface SearchResult {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
  conversation_id: string;
  conversation_name: string;
  sender: MessageSender | null;
}
