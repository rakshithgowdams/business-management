import { useState, useEffect } from 'react';
import { Pin, X, Loader2, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../../../lib/messaging/types';
import { chatService } from '../../../lib/messaging/chatService';

interface Props {
  conversationId: string;
  onClose: () => void;
  onJumpToMessage: (conversationId: string) => void;
}

export default function PinnedMessagesPanel({ conversationId, onClose, onJumpToMessage }: Props) {
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPinned();
  }, [conversationId]);

  const loadPinned = async () => {
    setLoading(true);
    const res = await chatService.getPinnedMessages(conversationId);
    if (res.data) setPinnedMessages(res.data);
    setLoading(false);
  };

  const handleUnpin = async (messageId: string) => {
    await chatService.pinMessage(conversationId, messageId);
    setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Pin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Pinned Messages</h3>
              <p className="text-xs text-gray-500">{pinnedMessages.length} pinned</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-center py-12">
              <Pin className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No pinned messages</p>
              <p className="text-xs text-gray-600 mt-1">Pin important messages to find them easily</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="bg-dark-700 border border-white/[0.06] rounded-xl p-3 group">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const name = msg.sender?.display_name || msg.sender?.full_name || '?';
                      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      const isManagement = msg.sender?.role === 'management';
                      return (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                          isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        }`}>
                          {initials}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-300">
                          {msg.sender?.display_name || msg.sender?.full_name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {msg.is_deleted ? 'This message was deleted' : msg.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onJumpToMessage(msg.conversation_id)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Jump to message
                    </button>
                    <button
                      onClick={() => handleUnpin(msg.id)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Pin className="w-3 h-3" />
                      Unpin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
