import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, X, Loader2, Bot, User, Copy, Check, Zap,
  AlertTriangle, RefreshCw, History, Plus, Trash2, ChevronLeft, Clock,
} from 'lucide-react';
import { getTeamAIStatus, isTeamSession, type TeamAIStatus } from '../../../lib/ai/teamApi';
import {
  getSessions, getSessionMessages, createSession, saveMessage,
  deleteSession, sendChatMessage,
  type ChatSession, type ChatMessage as DBChatMessage,
} from '../../../lib/ai/teamChatService';
import type { ChatContact } from '../../../lib/messaging/types';
import MarkdownRenderer from './MarkdownRenderer';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Props {
  contacts: ChatContact[];
  initialQuery?: string;
  onClose: () => void;
}

const SYSTEM_PROMPT = `You are a brilliant, highly capable AI assistant integrated into a team workspace application called MyFinance OS. You help team members with their work across all domains.

Your core traits:
- You give clear, well-structured, actionable responses
- You use markdown formatting (headings, bold, lists, code blocks) to make responses scannable and professional
- You are concise but thorough — never bloated, never incomplete
- You adapt your tone: casual for quick questions, formal for business documents
- When drafting content (emails, messages, reports), you provide ready-to-use output
- You think step-by-step for complex problems
- You use bullet points and numbered lists for clarity
- You never start with generic filler like "Sure!" or "Of course!" — you get straight to the point

You can help with:
- Drafting professional emails, messages, and documents
- Project planning and task breakdowns
- Data analysis and business insights
- Meeting agendas, notes, and follow-ups
- Creative brainstorming and problem solving
- Technical questions and code help
- Communication strategies
- Any workplace task the team member needs`;

export default function AIChatPanel({ contacts, initialQuery, onClose }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [aiStatus, setAiStatus] = useState<TeamAIStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasTeamSession = isTeamSession();

  const loadAIStatus = useCallback(async () => {
    if (!hasTeamSession) {
      setStatusLoading(false);
      return;
    }
    const s = await getTeamAIStatus();
    setAiStatus(s);
    setStatusLoading(false);
  }, [hasTeamSession]);

  useEffect(() => {
    loadAIStatus();
    const interval = setInterval(loadAIStatus, 60000);
    return () => clearInterval(interval);
  }, [loadAIStatus]);

  useEffect(() => {
    if (initialQuery && !statusLoading) {
      if (!hasTeamSession || (aiStatus?.ai_enabled && (aiStatus?.credits_remaining ?? 0) > 0)) {
        handleSend(initialQuery);
      }
    }
  }, [statusLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const onlineCount = contacts.filter(c => c.chat_profile?.is_online).length;
    const totalCount = contacts.length;
    const departments = [...new Set(contacts.map(c => c.department).filter(Boolean))];
    return `\nTeam context: ${totalCount} members (${onlineCount} online). Departments: ${departments.join(', ') || 'N/A'}.`;
  };

  const handleSend = async (content?: string) => {
    const text = content || input.trim();
    if (!text) return;

    if (hasTeamSession && aiStatus) {
      if (!aiStatus.ai_enabled) {
        setCreditError('AI access is disabled for your account. Contact your administrator.');
        return;
      }
      if (aiStatus.credits_remaining <= 0) {
        setCreditError('Daily credit limit reached. Your credits reset tomorrow.');
        return;
      }
    }

    setCreditError(null);
    const userMsg: AIMessage = { role: 'user', content: text, created_at: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let sessionId = activeSessionId;
    if (!sessionId) {
      const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
      const session = await createSession(title);
      if (session) {
        sessionId = session.id;
        setActiveSessionId(session.id);
        setActiveSessionTitle(session.title);
      }
    }

    if (sessionId) {
      await saveMessage(sessionId, 'user', text);
    }

    try {
      const conversationHistory = [
        { role: 'system', content: SYSTEM_PROMPT + buildContext() },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      if (hasTeamSession) {
        const result = await sendChatMessage(conversationHistory, sessionId || undefined);

        if (result.error && !result.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: result.error || 'An error occurred.', created_at: new Date().toISOString() }]);
        } else if (result.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: result.content!, created_at: new Date().toISOString() }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'I received your message but could not generate a response. Please check your AI settings.', created_at: new Date().toISOString() }]);
        }

        if (result.credits_remaining !== undefined) {
          setAiStatus(prev => prev ? {
            ...prev,
            credits_used: (prev.daily_limit - (result.credits_remaining ?? 0)),
            credits_remaining: result.credits_remaining ?? 0,
          } : prev);
        }
      } else {
        const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
        const res = await fetch(AI_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            prompt: text,
            chat_mode: true,
            conversation_history: conversationHistory,
            model: 'anthropic/claude-sonnet-4-6',
            max_tokens: 4000,
            temperature: 0.7,
          }),
        });

        const json = await res.json();
        const responseText = json.content || json.raw_content || json.data?.response || json.error || 'Could not generate a response.';
        setMessages(prev => [...prev, { role: 'assistant', content: responseText, created_at: new Date().toISOString() }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure AI is configured by your administrator.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    const data = await getSessions();
    setSessions(data);
    setSessionsLoading(false);
  };

  const openHistory = () => {
    setShowHistory(true);
    loadSessions();
  };

  const loadSession = async (session: ChatSession) => {
    setShowHistory(false);
    setActiveSessionId(session.id);
    setActiveSessionTitle(session.title);
    setMessages([]);
    setLoading(true);

    const msgs = await getSessionMessages(session.id);
    setMessages(msgs.map((m: DBChatMessage) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })));
    setLoading(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const ok = await deleteSession(sessionId);
    if (ok) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setActiveSessionTitle('');
        setMessages([]);
      }
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle('');
    setMessages([]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const suggestions = [
    'Draft a team meeting agenda for this week',
    'Write a professional project update email',
    'Create a task breakdown for a new feature',
    'Help me write a welcome message for a new team member',
  ];

  const isAIDisabled = hasTeamSession && aiStatus && !aiStatus.ai_enabled;
  const isCreditsExhausted = hasTeamSession && aiStatus && aiStatus.credits_remaining <= 0 && aiStatus.ai_enabled;
  const canSend = !loading && !isAIDisabled && !isCreditsExhausted;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-full bg-dark-900">
        <div className="h-14 bg-dark-800 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-white">Chat History</h3>
              <p className="text-[10px] text-gray-500">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={startNewChat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-400 border border-brand-500/20 rounded-lg hover:bg-brand-500/10 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <History className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
              <p className="text-xs text-gray-600 mt-1 text-center">Start a new chat and your conversations will be saved here automatically.</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] ${
                    activeSessionId === s.id ? 'bg-brand-500/10 border border-brand-500/15' : 'border border-transparent'
                  }`}
                  onClick={() => loadSession(s)}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600">{s.message_count} messages</span>
                      <span className="text-[10px] text-gray-700">|</span>
                      <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatSessionDate(s.last_message_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSession(s.id); }}
                    className="p-1.5 text-gray-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <div className="h-14 bg-dark-800 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {activeSessionTitle || 'AI Assistant'}
            </h3>
            <p className="text-[10px] text-gray-500">Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startNewChat} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors" title="New chat">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={openHistory} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors" title="Chat history">
            <History className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasTeamSession && !statusLoading && aiStatus && (
        <CreditStatusBar status={aiStatus} onRefresh={loadAIStatus} />
      )}

      {creditError && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-400">{creditError}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isAIDisabled ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">AI Access Disabled</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs">
              Your administrator has not enabled AI access for your account. Please contact them to get started.
            </p>
          </div>
        ) : isCreditsExhausted && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Credits Exhausted</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs">
              You've used all your daily AI credits. Your limit resets tomorrow.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">AI Assistant</h3>
            <p className="text-xs text-gray-500 text-center max-w-xs mb-6">
              Ask me anything -- draft emails, plan projects, analyze data, or get help with any task.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={!canSend}
                  className="text-left px-4 py-2.5 bg-dark-700 border border-white/[0.06] rounded-xl text-xs text-gray-300 hover:text-white hover:border-brand-500/30 hover:bg-dark-700/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-brand-600/20 border border-brand-500/20 rounded-tr-md'
                      : 'bg-dark-700 border border-white/[0.06] rounded-tl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p className="text-[13px] text-gray-100 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.created_at && (
                      <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                    )}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors rounded"
                      >
                        {copiedIdx === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === i ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-dark-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {loading && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-4 py-3 bg-dark-700 border border-white/[0.06] rounded-2xl rounded-tl-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-dark-800 border-t border-white/[0.06] shrink-0">
        {isCreditsExhausted && messages.length > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-[11px] text-amber-400">Daily credit limit reached. Resets tomorrow.</p>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isAIDisabled ? 'AI access is disabled...' : isCreditsExhausted ? 'Credits exhausted...' : 'Ask AI anything...'}
            className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none transition-colors disabled:opacity-40"
            rows={1}
            disabled={!canSend}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || !canSend}
            className="p-2.5 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 disabled:opacity-40 rounded-xl text-white transition-all duration-200 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditStatusBar({ status, onRefresh }: { status: TeamAIStatus; onRefresh: () => void }) {
  if (!status.ai_enabled) {
    return (
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-[11px] text-red-400">AI access disabled by administrator</p>
        </div>
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((status.credits_used / status.daily_limit) * 100));
  const isLow = status.credits_remaining < status.daily_limit * 0.2;
  const isDepleted = status.credits_remaining <= 0;

  return (
    <div className="mx-4 mt-3 px-3 py-2.5 rounded-lg bg-dark-800 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-medium text-gray-300">AI Credits</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold ${isDepleted ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
            {status.credits_remaining}/{status.daily_limit}
          </span>
          <button onClick={onRefresh} className="p-0.5 text-gray-600 hover:text-gray-400 transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDepleted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${100 - usagePercent}%` }}
        />
      </div>
      {isDepleted && (
        <p className="text-[10px] text-red-400 mt-1">Limit reached. Resets tomorrow.</p>
      )}
      {isLow && !isDepleted && (
        <p className="text-[10px] text-amber-400 mt-1">Credits running low.</p>
      )}
    </div>
  );
}
