import { supabase } from '../supabase';
import {
  getModelForTask, getOpenRouterKey, logUsage, MODELS, COST_PER_CALL,
  type TaskType, type ModelConfig,
} from './models';
import { isTeamSession, callTeamAI } from './teamApi';

const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export async function saveApiKey(apiKey: string): Promise<{ success: boolean; key_hint?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${AI_PROXY_URL}?action=save-key`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const err = JSON.parse(text);
        return { success: false, error: err.error || `Server error (${res.status})` };
      } catch {
        return { success: false, error: `Server error (${res.status})` };
      }
    }
    const data = await res.json();
    if (data.error) return { success: false, error: data.error };
    return { success: true, key_hint: data.key_hint };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getKeyInfo(): Promise<{ has_key: boolean; key_hint: string; updated_at: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${AI_PROXY_URL}?action=get-key-info`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) return { has_key: false, key_hint: '', updated_at: null };
    return await res.json();
  } catch {
    return { has_key: false, key_hint: '', updated_at: null };
  }
}

export async function deleteApiKey(): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${AI_PROXY_URL}?action=delete-key`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const err = JSON.parse(text);
        return { success: false, error: err.error || `Server error (${res.status})` };
      } catch {
        return { success: false, error: `Server error (${res.status})` };
      }
    }
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${AI_PROXY_URL}?action=test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function hasApiKey(): Promise<boolean> {
  if (getOpenRouterKey()) return true;
  const info = await getKeyInfo();
  return info.has_key;
}

export interface AIResponse {
  data: Record<string, unknown> | null;
  error: string | null;
  tokens_used: number;
  model_used?: string;
}

export async function callAI(prompt: string, retryOnFail = true, taskType?: TaskType, retryCount = 0): Promise<AIResponse> {
  if (isTeamSession()) {
    return callTeamAI(prompt, retryOnFail, retryCount);
  }

  const startTime = performance.now();
  const MAX_RETRIES = 2;

  try {
    const headers = await getAuthHeaders();
    const model: ModelConfig = taskType
      ? getModelForTask(taskType)
      : MODELS['claude'];

    const localKey = getOpenRouterKey();

    const body: Record<string, unknown> = {
      prompt,
      model: model.id,
    };

    if (localKey) {
      body.api_key = localKey;
    }

    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const durationMs = Math.round(performance.now() - startTime);

    if (json.needs_retry && retryOnFail && retryCount < MAX_RETRIES) {
      return callAI(prompt, true, taskType, retryCount + 1);
    }

    if (json.needs_retry) {
      const errorMsg = json.error || 'Failed to parse AI response. Please try again.';
      return { data: null, error: errorMsg, tokens_used: json.tokens_used || 0 };
    }

    const result: AIResponse = {
      data: json.data ?? null,
      error: json.error ?? null,
      tokens_used: json.tokens_used ?? 0,
      model_used: json.model_used || model.id,
    };

    if (taskType) {
      const estimatedCost = COST_PER_CALL[model.id] || 0.5;
      logUsage({
        timestamp: new Date().toISOString(),
        taskType,
        modelKey: model.key,
        modelName: model.name,
        tokensUsed: result.tokens_used,
        estimatedCost,
        durationMs,
        status: result.error ? 'error' : 'success',
      });
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: `Network error: ${msg}`, tokens_used: 0 };
  }
}

export function getModelNameForTask(taskType: TaskType): string {
  return getModelForTask(taskType).name;
}

const TASK_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-ai`;

export async function callTaskAI(
  payload: Record<string, unknown>,
  taskType: TaskType,
): Promise<{ data: Record<string, unknown> | null; error: string | null; tokens_used: number }> {
  const startTime = performance.now();

  try {
    const headers = await getAuthHeaders();
    const localKey = getOpenRouterKey();
    if (localKey) {
      payload.api_key = localKey;
    }

    const res = await fetch(TASK_AI_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    const durationMs = Math.round(performance.now() - startTime);
    const tokensUsed = json.tokens_used || 0;
    const hasError = !!json.error;

    logUsage({
      timestamp: new Date().toISOString(),
      taskType,
      modelKey: 'claude',
      modelName: 'Claude Sonnet 4',
      tokensUsed,
      estimatedCost: COST_PER_CALL['anthropic/claude-sonnet-4-6'] || 0.8,
      durationMs,
      status: hasError ? 'error' : 'success',
    });

    return {
      data: json.data ?? null,
      error: json.error ?? null,
      tokens_used: tokensUsed,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    logUsage({
      timestamp: new Date().toISOString(),
      taskType,
      modelKey: 'claude',
      modelName: 'Claude Sonnet 4',
      tokensUsed: 0,
      estimatedCost: COST_PER_CALL['anthropic/claude-sonnet-4-6'] || 0.8,
      durationMs,
      status: 'error',
    });
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: msg, tokens_used: 0 };
  }
}
