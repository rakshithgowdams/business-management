import type {
  ChatProfile,
  ChatContact,
  ChatMessage,
  Conversation,
  MessageApproval,
  TypingUser,
  TeamStats,
  SearchResult,
} from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-chat`;
const LS_SESSION_KEY = 'mfo_team_session';

async function chatFetch<T>(action: string, payload: Record<string, unknown> = {}): Promise<{ data?: T; error?: string }> {
  const session_token = localStorage.getItem(LS_SESSION_KEY);
  if (!session_token) return { error: 'Not authenticated' };

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, session_token, ...payload }),
  });

  const json = await res.json();
  if (!res.ok || json.error) return { error: json.error || 'Request failed' };
  return { data: json.data };
}

export const chatService = {
  getProfile: () => chatFetch<ChatProfile>('get-profile'),

  updateProfile: (updates: { bio?: string; profile_pic_url?: string; display_name?: string }) =>
    chatFetch<ChatProfile>('update-profile', updates),

  getContacts: () => chatFetch<ChatContact[]>('get-contacts'),

  getConversations: () => chatFetch<Conversation[]>('get-conversations'),

  getMessages: (conversation_id: string, before?: string, limit?: number) =>
    chatFetch<ChatMessage[]>('get-messages', { conversation_id, before, limit }),

  sendMessage: (params: {
    conversation_id: string;
    content: string;
    message_type?: string;
    attachment_url?: string;
    attachment_name?: string;
    attachment_size?: number;
    attachment_mime?: string;
    reply_to_id?: string;
  }) => chatFetch<ChatMessage>('send-message', params),

  startDirect: (target_member_id: string) =>
    chatFetch<{ conversation_id: string; existing: boolean }>('start-direct', { target_member_id }),

  createGroup: (params: { name: string; description?: string; project_id?: string; member_ids: string[] }) =>
    chatFetch<{ conversation_id: string }>('create-group', params),

  addGroupMembers: (conversation_id: string, member_ids: string[]) =>
    chatFetch<{ added: number }>('add-group-members', { conversation_id, member_ids }),

  requestApproval: (target_id: string, reason?: string) =>
    chatFetch<MessageApproval>('request-approval', { target_id, reason }),

  reviewApproval: (approval_id: string, status: 'approved' | 'rejected') =>
    chatFetch<MessageApproval>('review-approval', { approval_id, status }),

  getApprovals: () => chatFetch<MessageApproval[]>('get-approvals'),

  markRead: (conversation_id: string) => chatFetch('mark-read', { conversation_id }),

  setTyping: (conversation_id: string, is_typing: boolean) =>
    chatFetch('set-typing', { conversation_id, is_typing }),

  getTyping: (conversation_id: string) =>
    chatFetch<TypingUser[]>('get-typing', { conversation_id }),

  setOnline: (is_online: boolean) => chatFetch('set-online', { is_online }),

  pollUpdates: (conversation_ids: string[], since: string) =>
    chatFetch<{ new_messages: ChatMessage[]; updated_conversations: { id: string; updated_at: string }[] }>(
      'poll-updates',
      { conversation_ids, since }
    ),

  editMessage: (message_id: string, content: string) =>
    chatFetch<ChatMessage>('edit-message', { message_id, content }),

  deleteMessage: (message_id: string) =>
    chatFetch<ChatMessage>('delete-message', { message_id }),

  getTeamStats: () => chatFetch<TeamStats>('get-team-stats'),

  searchMessages: (query: string) =>
    chatFetch<SearchResult[]>('search-messages', { query }),

  reactToMessage: (message_id: string, emoji: string) =>
    chatFetch<{ added: boolean }>('react-to-message', { message_id, emoji }),

  pinMessage: (conversation_id: string, message_id: string) =>
    chatFetch<{ pinned: boolean }>('pin-message', { conversation_id, message_id }),

  getPinnedMessages: (conversation_id: string) =>
    chatFetch<ChatMessage[]>('get-pinned-messages', { conversation_id }),

  forwardMessage: (message_id: string, target_conversation_id: string) =>
    chatFetch<ChatMessage>('forward-message', { message_id, target_conversation_id }),

  bookmarkMessage: (message_id: string) =>
    chatFetch<{ bookmarked: boolean }>('bookmark-message', { message_id }),

  getBookmarks: () =>
    chatFetch<ChatMessage[]>('get-bookmarks'),
};
