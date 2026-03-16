const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
const LS_SESSION_KEY = 'mfo_team_session';

function getTeamToken(): string | null {
  return localStorage.getItem(LS_SESSION_KEY);
}

function getTeamHeaders(): Record<string, string> {
  const token = getTeamToken();
  if (!token) throw new Error('No team session');
  return {
    'Content-Type': 'application/json',
    'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'X-Team-Token': token,
  };
}

export interface TeamAIStatus {
  ai_enabled: boolean;
  daily_limit: number;
  credits_used: number;
  credits_remaining: number;
  assigned_model: string;
}

export interface TeamAIResponse {
  data: Record<string, unknown> | null;
  error: string | null;
  tokens_used: number;
  model_used?: string;
  credits_used?: number;
  credits_remaining?: number;
  daily_limit?: number;
}

export async function getTeamAIStatus(): Promise<TeamAIStatus | null> {
  try {
    const headers = getTeamHeaders();
    const res = await fetch(`${AI_PROXY_URL}?action=get-team-ai-status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json.error) return null;
    return json as TeamAIStatus;
  } catch {
    return null;
  }
}

export async function callTeamAI(
  prompt: string,
  retryOnFail = true,
  retryCount = 0,
): Promise<TeamAIResponse> {
  const MAX_RETRIES = 2;

  try {
    const headers = getTeamHeaders();

    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });

    const json = await res.json();

    if (json.needs_retry && retryOnFail && retryCount < MAX_RETRIES) {
      return callTeamAI(prompt, true, retryCount + 1);
    }

    if (json.needs_retry) {
      return {
        data: null,
        error: json.error || 'Failed to parse AI response. Please try again.',
        tokens_used: json.tokens_used || 0,
      };
    }

    return {
      data: json.data ?? null,
      error: json.error ?? null,
      tokens_used: json.tokens_used ?? 0,
      model_used: json.model_used,
      credits_used: json.credits_used,
      credits_remaining: json.credits_remaining,
      daily_limit: json.daily_limit,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: `Network error: ${msg}`, tokens_used: 0 };
  }
}

export function isTeamSession(): boolean {
  return !!getTeamToken();
}
