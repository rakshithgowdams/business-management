import { useState, useRef, useCallback } from 'react';
import { Search, X, MessageSquare, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import type { SearchResult, ChatContact } from '../../../lib/messaging/types';
import { chatService } from '../../../lib/messaging/chatService';

interface Props {
  contacts: ChatContact[];
  onSelectConversation: (conversationId: string) => void;
  onStartDirect: (contact: ChatContact) => void;
  onAIQuery: (query: string) => void;
}

export default function MessageSearch({ contacts, onSelectConversation, onStartDirect, onAIQuery }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [matchedContacts, setMatchedContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setMatchedContacts([]);
      setShowResults(false);
      return;
    }

    setShowResults(true);

    const q = value.toLowerCase();
    const contactMatches = contacts.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q) ||
      (c.job_title || '').toLowerCase().includes(q)
    ).slice(0, 5);
    setMatchedContacts(contactMatches);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await chatService.searchMessages(value.trim());
      if (res.data) setResults(res.data);
      setLoading(false);
    }, 400);
  }, [contacts]);

  const handleAISubmit = () => {
    if (!query.trim()) return;
    onAIQuery(query.trim());
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleAISubmit();
    }
    if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text.length > 80 ? text.slice(0, 80) + '...' : text;
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + q.length + 30);
    const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
    const matchIdx = snippet.toLowerCase().indexOf(q.toLowerCase());
    if (matchIdx === -1) return snippet;
    return (
      <>
        {snippet.slice(0, matchIdx)}
        <span className="text-brand-300 font-medium bg-brand-500/15 px-0.5 rounded">{snippet.slice(matchIdx, matchIdx + q.length)}</span>
        {snippet.slice(matchIdx + q.length)}
      </>
    );
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search messages, people, or ask AI..."
          className="w-full pl-10 pr-20 py-2.5 bg-dark-700 border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/40 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setMatchedContacts([]); setShowResults(false); }}
            className="absolute right-12 p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleAISubmit}
          disabled={!query.trim()}
          className="absolute right-2 p-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 disabled:opacity-30 transition-colors"
          title="Ask AI (Cmd+Enter)"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {showResults && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowResults(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-white/[0.08] rounded-xl shadow-2xl z-40 max-h-[400px] overflow-y-auto">
            {matchedContacts.length > 0 && (
              <div className="p-2 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">People</p>
                {matchedContacts.map(contact => {
                  const pic = contact.chat_profile?.profile_pic_url || contact.avatar_url;
                  const name = contact.chat_profile?.display_name || contact.full_name;
                  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  const isOnline = contact.chat_profile?.is_online;

                  return (
                    <button
                      key={contact.id}
                      onClick={() => { onStartDirect(contact); setShowResults(false); }}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="relative shrink-0">
                        {pic ? (
                          <img src={pic} alt={name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                            contact.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          }`}>
                            {initials}
                          </div>
                        )}
                        {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-white truncate">{name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{contact.job_title || contact.role} {contact.department ? `- ${contact.department}` : ''}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        contact.role === 'management' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {contact.role === 'management' ? 'MGT' : 'EMP'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Searching messages...</span>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">Messages</p>
                {results.map(result => (
                  <button
                    key={result.id}
                    onClick={() => { onSelectConversation(result.conversation_id); setShowResults(false); }}
                    className="w-full flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-300">
                          {result.sender?.display_name || result.sender?.full_name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-600">in {result.conversation_name}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {highlightMatch(result.content, query)}
                      </p>
                      <span className="text-[10px] text-gray-600 mt-0.5 block">{formatTime(result.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && matchedContacts.length === 0 && query.trim().length >= 2 && (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results found</p>
                <button
                  onClick={handleAISubmit}
                  className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-brand-500/15 text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-500/25 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI instead
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
