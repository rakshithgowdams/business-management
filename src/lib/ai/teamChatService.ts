const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
const LS_SESSION_KEY = 'mfo_team_session';

function getTeamHeaders(): Record<string, string> {
  const token = localStorage.getItem(LS_SESSION_KEY);
  if (!token) throw new Error('No team session');
  return {
    'Content-Type': 'application/json',
    'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'X-Team-Token': token,
  };
}

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  model_used: string;
  created_at: string;
}

export async function getSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch(`${AI_PROXY_URL}?action=chat-sessions`, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return data.sessions || [];
  } catch {
    return [];
  }
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${AI_PROXY_URL}?action=chat-messages`, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function createSession(title: string): Promise<ChatSession | null> {
  try {
    const res = await fetch(`${AI_PROXY_URL}?action=chat-create-session`, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    return data.session || null;
  } catch {
    return null;
  }
}

export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, tokensUsed = 0, modelUsed = '') {
  try {
    await fetch(`${AI_PROXY_URL}?action=chat-save-message`, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({ session_id: sessionId, role, content, tokens_used: tokensUsed, model_used: modelUsed }),
    });
  } catch {
    // silent fail for persistence
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${AI_PROXY_URL}?action=chat-delete-session`, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export interface ChatAIResponse {
  content: string | null;
  error: string | null;
  tokens_used: number;
  model_used?: string;
  credits_used?: number;
  credits_remaining?: number;
  daily_limit?: number;
}

export async function sendChatMessage(
  conversationHistory: { role: string; content: string }[],
  sessionId?: string,
): Promise<ChatAIResponse> {
  try {
    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: getTeamHeaders(),
      body: JSON.stringify({
        prompt: conversationHistory[conversationHistory.length - 1]?.content || '',
        chat_mode: true,
        conversation_history: conversationHistory,
        session_id: sessionId,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return {
      content: data.content || null,
      error: data.error || null,
      tokens_used: data.tokens_used || 0,
      model_used: data.model_used,
      credits_used: data.credits_used,
      credits_remaining: data.credits_remaining,
      daily_limit: data.daily_limit,
    };
  } catch (err) {
    return {
      content: null,
      error: err instanceof Error ? err.message : 'Network error',
      tokens_used: 0,
    };
  }
}
