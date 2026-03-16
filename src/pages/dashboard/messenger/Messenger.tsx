import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Shield, Sparkles } from 'lucide-react';
import { chatService } from '../../../lib/messaging/chatService';
import type {
  Conversation,
  ChatContact,
  ChatMessage,
  ChatProfile,
  MessageApproval,
  TypingUser,
  TeamStats,
  MessageType,
} from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import CreateGroupModal from './CreateGroupModal';
import ApprovalPanel from './ApprovalPanel';
import ChatProfileEditor from './ChatProfileEditor';
import TeamDirectory from './TeamDirectory';
import MessageSearch from './MessageSearch';
import AIChatPanel from './AIChatPanel';
import ForwardMessageModal from './ForwardMessageModal';
import PinnedMessagesPanel from './PinnedMessagesPanel';
import { encryptMessage, decryptMessage } from '../../../lib/messaging/encryption';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 3000;
const TYPING_POLL_INTERVAL = 2000;
const STATS_POLL_INTERVAL = 15000;
const LS_SESSION_KEY = 'mfo_team_session';

export default function Messenger() {
  const { member, loading: authLoading } = useTeamAuth();
  const hasTeamSession = !!localStorage.getItem(LS_SESSION_KEY);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [approvals, setApprovals] = useState<MessageApproval[]>([]);
  const [profile, setProfile] = useState<ChatProfile | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>();
  const [showPinned, setShowPinned] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollTimeRef = useRef<string>(new Date().toISOString());

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const decryptMessages = async (msgs: ChatMessage[]): Promise<ChatMessage[]> => {
    return Promise.all(
      msgs.map(async (msg) => {
        if (msg.is_deleted || !msg.content) return msg;
        const decrypted = await decryptMessage(msg.content, msg.conversation_id);
        return { ...msg, content: decrypted };
      })
    );
  };

  const loadInitialData = useCallback(async () => {
    try {
      const [convRes, contactsRes, profileRes, approvalsRes, statsRes] = await Promise.all([
        chatService.getConversations(),
        chatService.getContacts(),
        chatService.getProfile(),
        chatService.getApprovals(),
        chatService.getTeamStats(),
      ]);

      if (convRes.data) setConversations(convRes.data);
      if (contactsRes.data) setContacts(contactsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      if (approvalsRes.data) setApprovals(approvalsRes.data);
      if (statsRes.data) setTeamStats(statsRes.data);

      await chatService.setOnline(true);
    } catch (err) {
      console.error('Failed to load messenger data:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    return () => {
      chatService.setOnline(false);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (typingPollRef.current) clearInterval(typingPollRef.current);
      if (statsPollRef.current) clearInterval(statsPollRef.current);
    };
  }, [loadInitialData]);

  useEffect(() => {
    if (statsPollRef.current) clearInterval(statsPollRef.current);

    statsPollRef.current = setInterval(async () => {
      const res = await chatService.getTeamStats();
      if (res.data) setTeamStats(res.data);
    }, STATS_POLL_INTERVAL);

    return () => {
      if (statsPollRef.current) clearInterval(statsPollRef.current);
    };
  }, []);

  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    if (conversations.length === 0) return;

    pollTimerRef.current = setInterval(async () => {
      const convIds = conversations.map(c => c.id);
      const result = await chatService.pollUpdates(convIds, lastPollTimeRef.current);
      lastPollTimeRef.current = new Date().toISOString();

      if (result.data) {
        if (result.data.new_messages.length > 0) {
          if (activeConversationId) {
            const newForActive = result.data.new_messages.filter(
              m => m.conversation_id === activeConversationId && m.sender_id !== member?.id
            );
            if (newForActive.length > 0) {
              const fullMessages = await chatService.getMessages(activeConversationId);
              if (fullMessages.data) {
                const decrypted = await decryptMessages(fullMessages.data);
                setMessages(decrypted);
              }
            }
          }

          const convRes = await chatService.getConversations();
          if (convRes.data) setConversations(convRes.data);
        }

        if (result.data.updated_conversations.length > 0) {
          const convRes = await chatService.getConversations();
          if (convRes.data) setConversations(convRes.data);
        }
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [conversations.length, activeConversationId, member?.id]);

  useEffect(() => {
    if (typingPollRef.current) clearInterval(typingPollRef.current);

    if (!activeConversationId) {
      setTypingUsers([]);
      return;
    }

    const pollTyping = async () => {
      const result = await chatService.getTyping(activeConversationId);
      if (result.data) setTypingUsers(result.data);
    };

    pollTyping();
    typingPollRef.current = setInterval(pollTyping, TYPING_POLL_INTERVAL);

    return () => {
      if (typingPollRef.current) clearInterval(typingPollRef.current);
    };
  }, [activeConversationId]);

  const selectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowMobileChat(true);
    setShowAIChat(false);
    setLoadingMessages(true);
    setHasMore(true);

    const result = await chatService.getMessages(conversationId);
    if (result.data) {
      const decrypted = await decryptMessages(result.data);
      setMessages(decrypted);
      setHasMore(result.data.length >= 50);
    }
    setLoadingMessages(false);

    await chatService.markRead(conversationId);
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
  };

  const loadMore = async () => {
    if (!activeConversationId || loadingMessages || !hasMore || messages.length === 0) return;
    setLoadingMessages(true);
    const oldestMessage = messages[0];
    const result = await chatService.getMessages(activeConversationId, oldestMessage.created_at);
    if (result.data) {
      if (result.data.length === 0) {
        setHasMore(false);
      } else {
        const decrypted = await decryptMessages(result.data);
        setMessages(prev => [...decrypted, ...prev]);
        setHasMore(result.data.length >= 50);
      }
    }
    setLoadingMessages(false);
  };

  const sendMessage = async (
    content: string,
    replyToId?: string,
    attachment?: { url: string; name: string; type: MessageType; size: number; mime: string },
  ) => {
    if (!activeConversationId) return;

    const tempId = `optimistic-text-${Date.now()}`;
    const isTextOnly = !attachment;

    if (isTextOnly && content.trim()) {
      const optimistic: ChatMessage = {
        id: tempId,
        conversation_id: activeConversationId,
        sender_id: member?.id || '',
        content,
        message_type: 'text',
        attachment_url: '',
        attachment_name: '',
        attachment_size: 0,
        attachment_mime: '',
        reply_to_id: replyToId || null,
        forwarded_from: null,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: member ? {
          id: member.id,
          full_name: member.full_name,
          avatar_url: member.avatar_url || '',
          role: member.role,
          profile_pic_url: '',
          display_name: '',
        } : null,
        reply_to: replyToId ? messages.find(m => m.id === replyToId) ? {
          id: replyToId,
          content: messages.find(m => m.id === replyToId)!.content,
          sender_id: messages.find(m => m.id === replyToId)!.sender_id,
          message_type: messages.find(m => m.id === replyToId)!.message_type,
          sender: messages.find(m => m.id === replyToId)!.sender,
        } : null : null,
        _optimistic: true,
      };
      setMessages(prev => [...prev, optimistic]);
    }

    const encryptedContent = content ? await encryptMessage(content, activeConversationId) : content;

    const result = await chatService.sendMessage({
      conversation_id: activeConversationId,
      content: encryptedContent,
      reply_to_id: replyToId,
      ...(attachment && {
        message_type: attachment.type,
        attachment_url: attachment.url,
        attachment_name: attachment.name,
        attachment_size: attachment.size,
        attachment_mime: attachment.mime,
      }),
    });

    if (result.error) {
      if (isTextOnly) setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(result.error);
      return;
    }

    const [fullMessages, convRes] = await Promise.all([
      chatService.getMessages(activeConversationId),
      chatService.getConversations(),
    ]);
    if (fullMessages.data) {
      const decrypted = await decryptMessages(fullMessages.data);
      setMessages(decrypted);
    }
    if (convRes.data) setConversations(convRes.data);
  };

  const addOptimisticMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const removeOptimisticMessage = (tempId: string) => {
    setMessages(prev => prev.filter(m => m.id !== tempId));
  };

  const editMessage = async (messageId: string, content: string) => {
    const result = await chatService.editMessage(messageId, content);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, content, is_edited: true } : m)
    );
  };

  const deleteMessage = async (messageId: string) => {
    const result = await chatService.deleteMessage(messageId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, is_deleted: true, content: '' } : m)
    );
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!activeConversationId) return;
    await chatService.setTyping(activeConversationId, isTyping);
  };

  const startDirect = async (contact: ChatContact) => {
    setActionLoading(true);
    setShowDirectory(false);
    const result = await chatService.startDirect(contact.id);
    if (result.error) {
      toast.error(result.error);
      setActionLoading(false);
      return;
    }
    if (result.data) {
      if (!result.data.existing) {
        const convRes = await chatService.getConversations();
        if (convRes.data) setConversations(convRes.data);
      }
      selectConversation(result.data.conversation_id);
    }
    setActionLoading(false);
  };

  const createGroup = async (params: { name: string; description: string; project_id?: string; member_ids: string[] }) => {
    setActionLoading(true);
    const result = await chatService.createGroup(params);
    if (result.error) {
      toast.error(result.error);
      setActionLoading(false);
      return;
    }
    if (result.data) {
      setShowCreateGroup(false);
      const convRes = await chatService.getConversations();
      if (convRes.data) setConversations(convRes.data);
      selectConversation(result.data.conversation_id);
      toast.success('Group created');
    }
    setActionLoading(false);
  };

  const requestApproval = async (targetId: string, reason: string) => {
    setActionLoading(true);
    const result = await chatService.requestApproval(targetId, reason);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Approval request sent');
      const appRes = await chatService.getApprovals();
      if (appRes.data) setApprovals(appRes.data);
      const contactsRes = await chatService.getContacts();
      if (contactsRes.data) setContacts(contactsRes.data);
    }
    setActionLoading(false);
  };

  const reviewApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    const result = await chatService.reviewApproval(approvalId, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Request ${status}`);
      const appRes = await chatService.getApprovals();
      if (appRes.data) setApprovals(appRes.data);
    }
    setActionLoading(false);
  };

  const saveProfile = async (updates: { bio?: string; profile_pic_url?: string; display_name?: string }) => {
    setActionLoading(true);
    const result = await chatService.updateProfile(updates);
    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.data) setProfile(result.data);
      toast.success('Profile updated');
      setShowProfileEditor(false);
    }
    setActionLoading(false);
  };

  const handleForward = async (messageId: string, targetConversationId: string) => {
    setActionLoading(true);
    const result = await chatService.forwardMessage(messageId, targetConversationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Message forwarded');
      setForwardingMessage(null);
      if (targetConversationId === activeConversationId) {
        const fullMessages = await chatService.getMessages(activeConversationId);
        if (fullMessages.data) {
          const decrypted = await decryptMessages(fullMessages.data);
          setMessages(decrypted);
        }
      }
    }
    setActionLoading(false);
  };

  const handleOpenBookmarks = async () => {
    toast('Saved messages coming soon', { icon: '🔖' });
  };

  const handleAIQuery = (query: string) => {
    setAiInitialQuery(query);
    setShowAIChat(true);
    setActiveConversationId(null);
  };

  const pendingApprovalCount = approvals.filter(a => a.status === 'pending').length;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading messenger...</p>
        </div>
      </div>
    );
  }

  if (!hasTeamSession || !member) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-10 h-10 text-brand-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Team Messenger</h3>
          <p className="text-sm text-gray-400 mb-4">
            The messenger is available when you're signed in as a team member. Please use the management or employee portal to access team conversations.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/management"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Management Portal
            </a>
            <a
              href="/employee"
              className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
            >
              Employee Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-dark-900 shadow-xl">
      <div className="px-4 py-3 bg-dark-800 border-b border-white/[0.06] shrink-0">
        <MessageSearch
          contacts={contacts}
          onSelectConversation={selectConversation}
          onStartDirect={startDirect}
          onAIQuery={handleAIQuery}
        />
      </div>

      <div className="flex-1 flex min-h-0">
        <div className={`w-full lg:w-[360px] shrink-0 ${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <ConversationList
            conversations={conversations}
            contacts={contacts}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onStartDirect={startDirect}
            onCreateGroup={() => setShowCreateGroup(true)}
            onOpenApprovals={() => setShowApprovals(true)}
            onOpenProfile={() => setShowProfileEditor(true)}
            onOpenDirectory={() => setShowDirectory(true)}
            onOpenBookmarks={handleOpenBookmarks}
            pendingApprovalCount={pendingApprovalCount}
            teamStats={teamStats}
          />
        </div>

        <div className={`flex-1 ${!showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col relative`}>
          {showAIChat ? (
            <AIChatPanel
              contacts={contacts}
              initialQuery={aiInitialQuery}
              onClose={() => { setShowAIChat(false); setAiInitialQuery(undefined); }}
            />
          ) : activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              typingUsers={typingUsers}
              onSendMessage={sendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onTyping={handleTyping}
              onBack={() => { setShowMobileChat(false); setActiveConversationId(null); }}
              onLoadMore={loadMore}
              onOpenPinned={() => setShowPinned(true)}
              onForwardMessage={setForwardingMessage}
              onOptimisticMessage={addOptimisticMessage}
              onRemoveOptimistic={removeOptimisticMessage}
              hasMore={hasMore}
              loading={loadingMessages}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-5">
                <MessageSquare className="w-10 h-10 text-brand-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Messenger</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm mb-1">
                Select a conversation or start a new chat with your team members.
              </p>
              <p className="text-xs text-gray-600 text-center max-w-sm mb-4">
                {member?.role === 'management'
                  ? 'You can message anyone and create project-based groups.'
                  : 'You can message other employees freely. To message management, request approval first.'}
              </p>
              <button
                onClick={() => { setShowAIChat(true); setAiInitialQuery(undefined); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500/20 to-cyan-500/20 border border-brand-500/30 text-brand-300 text-sm font-medium rounded-xl hover:from-brand-500/30 hover:to-cyan-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Chat with AI Assistant
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          contacts={contacts}
          onClose={() => setShowCreateGroup(false)}
          onCreate={createGroup}
          loading={actionLoading}
        />
      )}

      {showApprovals && (
        <ApprovalPanel
          approvals={approvals}
          contacts={contacts}
          onReview={reviewApproval}
          onRequestApproval={requestApproval}
          onClose={() => setShowApprovals(false)}
          loading={actionLoading}
        />
      )}

      {showProfileEditor && (
        <ChatProfileEditor
          profile={profile}
          onSave={saveProfile}
          onClose={() => setShowProfileEditor(false)}
          onOpenAIChat={() => { setShowAIChat(true); setActiveConversationId(null); setShowMobileChat(true); }}
          loading={actionLoading}
        />
      )}

      {showDirectory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden">
            <TeamDirectory
              contacts={contacts}
              teamStats={teamStats}
              onStartDirect={(contact) => {
                startDirect(contact);
                setShowDirectory(false);
              }}
              onClose={() => setShowDirectory(false)}
            />
          </div>
        </div>
      )}

      {showPinned && activeConversationId && (
        <PinnedMessagesPanel
          conversationId={activeConversationId}
          onClose={() => setShowPinned(false)}
          onJumpToMessage={() => setShowPinned(false)}
        />
      )}

      {forwardingMessage && (
        <ForwardMessageModal
          message={forwardingMessage}
          conversations={conversations}
          onForward={handleForward}
          onClose={() => setForwardingMessage(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
