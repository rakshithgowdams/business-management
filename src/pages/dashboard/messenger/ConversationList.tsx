import { useState } from 'react';
import {
  Search, Plus, Users, MessageSquare, Shield,
  MoreVertical, BellOff, ChevronDown, Briefcase, Circle,
  Bookmark,
} from 'lucide-react';
import type { Conversation, ChatContact, TeamStats } from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';

interface Props {
  conversations: Conversation[];
  contacts: ChatContact[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartDirect: (contact: ChatContact) => void;
  onCreateGroup: () => void;
  onOpenApprovals: () => void;
  onOpenProfile: () => void;
  onOpenDirectory: () => void;
  onOpenBookmarks: () => void;
  pendingApprovalCount: number;
  teamStats: TeamStats | null;
}

export default function ConversationList({
  conversations,
  contacts,
  activeConversationId,
  onSelectConversation,
  onStartDirect,
  onCreateGroup,
  onOpenApprovals,
  onOpenProfile,
  onOpenDirectory,
  onOpenBookmarks,
  pendingApprovalCount,
  teamStats,
}: Props) {
  const { member } = useTeamAuth();
  const [search, setSearch] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (conv.type === 'group') return conv.name.toLowerCase().includes(q);
    const otherMember = conv.members.find(m => m.id !== member?.id);
    const name = otherMember?.display_name || otherMember?.full_name || '';
    return name.toLowerCase().includes(q);
  });

  const filteredContacts = contacts.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name;
    const other = conv.members.find(m => m.id !== member?.id);
    return other?.display_name || other?.full_name || 'Unknown';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          <Users className="w-5 h-5" />
        </div>
      );
    }
    const other = conv.members.find(m => m.id !== member?.id);
    const pic = other?.profile_pic_url || other?.avatar_url;
    const name = other?.display_name || other?.full_name || '?';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isOnline = other?.is_online;

    return (
      <div className="relative shrink-0">
        {pic ? (
          <img src={pic} alt={name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            other?.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
          }`}>
            {initials}
          </div>
        )}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-dark-800" />
        )}
      </div>
    );
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.last_message) return 'No messages yet';
    if (conv.last_message.is_deleted) return 'Message deleted';
    if (conv.last_message.message_type === 'system') return conv.last_message.content;
    const typeLabels: Record<string, string> = {
      image: '\uD83D\uDCF7 Photo',
      video: '\uD83C\uDFA5 Video',
      audio: '\uD83C\uDFB5 Audio',
      voice: '\uD83C\uDF99\uFE0F Voice message',
      document: '\uD83D\uDCC4 Document',
      file: '\uD83D\uDCCE File',
    };
    const label = typeLabels[conv.last_message.message_type];
    if (label) {
      return conv.last_message.content
        ? `${label} - ${conv.last_message.content.slice(0, 30)}`
        : label;
    }
    return conv.last_message.content.length > 50
      ? conv.last_message.content.slice(0, 50) + '...'
      : conv.last_message.content;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-dark-800 border-r border-white/[0.06]">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Messages</h2>
          <div className="flex items-center gap-1">
            {pendingApprovalCount > 0 && (
              <button
                onClick={onOpenApprovals}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Approval Requests"
              >
                <Shield className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {pendingApprovalCount}
                </span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-dark-700 border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                    {member?.role === 'management' && (
                      <button
                        onClick={() => { onCreateGroup(); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        New Group
                      </button>
                    )}
                    <button
                      onClick={() => { setShowContacts(!showContacts); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      New Chat
                    </button>
                    <button
                      onClick={() => { onOpenDirectory(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Team Directory
                    </button>
                    <button
                      onClick={() => { onOpenBookmarks(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      Saved Messages
                    </button>
                    <button
                      onClick={() => { onOpenApprovals(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Approvals
                    </button>
                    <button
                      onClick={() => { onOpenProfile(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {teamStats && (
          <button
            onClick={onOpenDirectory}
            className="w-full grid grid-cols-2 gap-2 mb-3 group"
          >
            <div className="bg-dark-700/60 rounded-xl px-3 py-2 border border-white/[0.04] group-hover:border-blue-500/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Management</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{teamStats.total_management}</span>
                <div className="flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">{teamStats.online_management}</span>
                </div>
              </div>
            </div>
            <div className="bg-dark-700/60 rounded-xl px-3 py-2 border border-white/[0.04] group-hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Employees</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{teamStats.total_employees}</span>
                <div className="flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">{teamStats.online_employees}</span>
                </div>
              </div>
            </div>
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>

      {showContacts && (
        <div className="border-b border-white/[0.06]">
          <button
            onClick={() => setShowContacts(false)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-white/[0.03]"
          >
            <span>Contacts</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="max-h-64 overflow-y-auto">
            {filteredContacts.map(contact => {
              const pic = contact.chat_profile?.profile_pic_url || contact.avatar_url;
              const name = contact.chat_profile?.display_name || contact.full_name;
              const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              const isOnline = contact.chat_profile?.is_online;
              const needsApproval = contact.approval_status === 'none' && contact.role === 'management' && member?.role === 'employee';
              const pendingApproval = contact.approval_status === 'pending';
              const rejected = contact.approval_status === 'rejected';

              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    if (!needsApproval && !pendingApproval && !rejected) {
                      onStartDirect(contact);
                      setShowContacts(false);
                    }
                  }}
                  disabled={needsApproval || pendingApproval || rejected}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                >
                  <div className="relative shrink-0">
                    {pic ? (
                      <img src={pic} alt={name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        contact.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      }`}>
                        {initials}
                      </div>
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-white truncate">{name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{contact.job_title || contact.role}</p>
                  </div>
                  {needsApproval && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                      Needs Approval
                    </span>
                  )}
                  {pendingApproval && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                      Pending
                    </span>
                  )}
                  {rejected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                      Rejected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 text-center">
              {search ? 'No conversations found' : 'No conversations yet'}
            </p>
            <button
              onClick={() => setShowContacts(true)}
              className="mt-3 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600/[0.1] border-l-2 border-brand-500'
                    : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
              >
                {getConversationAvatar(conv)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                      {getConversationName(conv)}
                    </span>
                    {conv.last_message && (
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">
                      {getLastMessagePreview(conv)}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {conv.membership?.is_muted && (
                        <BellOff className="w-3 h-3 text-gray-600" />
                      )}
                      {conv.unread_count > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {conv.type === 'group' && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {conv.members.length} members
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
