import { useState } from 'react';
import { X, Forward, Search, Check, Users, Loader2 } from 'lucide-react';
import type { Conversation, ChatMessage } from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';

interface Props {
  message: ChatMessage;
  conversations: Conversation[];
  onForward: (messageId: string, targetConversationId: string) => void;
  onClose: () => void;
  loading: boolean;
}

export default function ForwardMessageModal({ message, conversations, onForward, onClose, loading }: Props) {
  const { member } = useTeamAuth();
  const [search, setSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const filtered = conversations.filter(c => {
    if (c.id === message.conversation_id) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (c.type === 'group') return c.name.toLowerCase().includes(q);
    const other = c.members.find(m => m.id !== member?.id);
    const name = other?.display_name || other?.full_name || '';
    return name.toLowerCase().includes(q);
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name;
    const other = conv.members.find(m => m.id !== member?.id);
    return other?.display_name || other?.full_name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Forward className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Forward Message</h3>
              <p className="text-xs text-gray-500">Choose a conversation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="bg-dark-700 border border-white/[0.06] rounded-xl p-3 mb-3">
            <p className="text-[10px] text-gray-500 mb-1">Message to forward:</p>
            <p className="text-xs text-gray-300 line-clamp-2">{message.content}</p>
          </div>

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

        <div className="max-h-64 overflow-y-auto px-5 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No conversations found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map(conv => {
                const isSelected = selectedConvId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isSelected ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {conv.type === 'group' ? (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                    ) : (
                      (() => {
                        const other = conv.members.find(m => m.id !== member?.id);
                        const initials = (other?.display_name || other?.full_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            other?.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          }`}>
                            {initials}
                          </div>
                        );
                      })()
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-white truncate">{getConversationName(conv)}</p>
                      <p className="text-[11px] text-gray-500">{conv.type === 'group' ? `${conv.members.length} members` : conv.type}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => selectedConvId && onForward(message.id, selectedConvId)}
            disabled={!selectedConvId || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Forward className="w-4 h-4" />}
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
