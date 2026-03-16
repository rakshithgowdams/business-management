export type CostTier = 1 | 2 | 3;

export type SpeedTier = 'fast' | 'medium' | 'slow';

export type TaskType =
  | 'web_research'
  | 'business_analysis'
  | 'roi_calculation'
  | 'cold_messages'
  | 'competitor_analysis'
  | 'proposal_writing'
  | 'quick_chat'
  | 'deep_market_research'
  | 'health_score'
  | 'weekly_summary'
  | 'content_creation'
  | 'cinematic_prompt'
  | 'carousel_design'
  | 'task_analysis'
  | 'email_compose'
  | 'task_suggestions'
  | 'performance_review'
  | 'receipt_scan';

export interface ModelConfig {
  id: string;
  key: string;
  name: string;
  provider: string;
  bestFor: string;
  costTier: CostTier;
  speedTier: SpeedTier;
}

export interface TaskConfig {
  key: TaskType;
  label: string;
  icon: string;
  description: string;
  recommendedModel: string;
  costTier: CostTier;
  speedTier: SpeedTier;
  options: TaskModelOption[];
}

export interface TaskModelOption {
  modelKey: string;
  recommended?: boolean;
  note: string;
}

export interface UsageLogEntry {
  timestamp: string;
  taskType: TaskType | string;
  modelKey: string;
  modelName: string;
  tokensUsed: number;
  estimatedCost: number;
  durationMs: number;
  status: 'success' | 'error';
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LS_KEY = 'mfo_key_openrouter';
const LS_SMART_AUTO = 'mfo_smart_auto_mode';
const LS_MODEL_SETTINGS = 'mfo_model_settings';
const LS_USAGE_LOG = 'mfo_ai_usage_log';

export { OPENROUTER_URL };

export const MODELS: Record<string, ModelConfig> = {
  claude: {
    id: 'anthropic/claude-sonnet-4-6',
    key: 'claude',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    bestFor: 'Best analysis & reasoning',
    costTier: 2,
    speedTier: 'medium',
  },
  gpt4o: {
    id: 'openai/gpt-4o',
    key: 'gpt4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    bestFor: 'Best copywriting',
    costTier: 2,
    speedTier: 'fast',
  },
  gpt5: {
    id: 'openai/gpt-5',
    key: 'gpt5',
    name: 'GPT-5',
    provider: 'OpenAI',
    bestFor: 'Most powerful',
    costTier: 3,
    speedTier: 'medium',
  },
  o3: {
    id: 'openai/o3',
    key: 'o3',
    name: 'o3',
    provider: 'OpenAI',
    bestFor: 'Best reasoning',
    costTier: 3,
    speedTier: 'slow',
  },
  geminiFlash: {
    id: 'google/gemini-2.5-flash',
    key: 'geminiFlash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    bestFor: 'Fastest & cheapest',
    costTier: 1,
    speedTier: 'fast',
  },
  geminiPro: {
    id: 'google/gemini-2.5-pro',
    key: 'geminiPro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    bestFor: 'Best long research',
    costTier: 2,
    speedTier: 'medium',
  },
  sonarPro: {
    id: 'perplexity/sonar-pro',
    key: 'sonarPro',
    name: 'Sonar Pro',
    provider: 'Perplexity',
    bestFor: 'Best web search',
    costTier: 1,
    speedTier: 'fast',
  },
  sonarDeepResearch: {
    id: 'perplexity/sonar-deep-research',
    key: 'sonarDeepResearch',
    name: 'Sonar Deep Research',
    provider: 'Perplexity',
    bestFor: 'Deep reports',
    costTier: 2,
    speedTier: 'slow',
  },
  sonar: {
    id: 'perplexity/sonar',
    key: 'sonar',
    name: 'Sonar',
    provider: 'Perplexity',
    bestFor: 'Fast web search',
    costTier: 1,
    speedTier: 'fast',
  },
  llama: {
    id: 'meta-llama/llama-3.3-70b-instruct',
    key: 'llama',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    bestFor: 'Free tier option',
    costTier: 1,
    speedTier: 'fast',
  },
  mistral: {
    id: 'mistralai/mistral-large-2512',
    key: 'mistral',
    name: 'Mistral Large',
    provider: 'Mistral',
    bestFor: 'European option',
    costTier: 2,
    speedTier: 'medium',
  },
};

export const SMART_AUTO_DEFAULTS: Record<TaskType, string> = {
  web_research: 'sonarPro',
  business_analysis: 'claude',
  roi_calculation: 'gpt4o',
  cold_messages: 'gpt4o',
  competitor_analysis: 'sonarPro',
  proposal_writing: 'claude',
  quick_chat: 'geminiFlash',
  deep_market_research: 'geminiPro',
  health_score: 'geminiFlash',
  weekly_summary: 'geminiFlash',
  content_creation: 'gpt4o',
  cinematic_prompt: 'claude',
  carousel_design: 'gpt4o',
  task_analysis: 'claude',
  email_compose: 'claude',
  task_suggestions: 'claude',
  performance_review: 'claude',
  receipt_scan: 'geminiFlash',
};

export const TASK_CONFIGS: TaskConfig[] = [
  {
    key: 'web_research',
    label: 'Web Research & URL Scanning',
    icon: '\u{1F310}',
    description: 'Scans client website, finds competitors, Google reviews in real-time',
    recommendedModel: 'sonarPro',
    costTier: 1,
    speedTier: 'fast',
    options: [
      { modelKey: 'sonarPro', recommended: true, note: 'Best: Real-time web + citations' },
      { modelKey: 'sonarDeepResearch', note: 'Deep: 50+ sources, full reports' },
      { modelKey: 'sonar', note: 'Basic: Fast web search' },
      { modelKey: 'gpt4o', note: 'Good: No real-time, uses training data' },
    ],
  },
  {
    key: 'business_analysis',
    label: 'Business Intelligence Analysis',
    icon: '\u{1F9E0}',
    description: 'Analyzes pain points, deal score, service recommendations',
    recommendedModel: 'claude',
    costTier: 2,
    speedTier: 'medium',
    options: [
      { modelKey: 'claude', recommended: true, note: 'Best: Deep reasoning + perfect JSON' },
      { modelKey: 'gpt4o', note: 'Great: Fast + smart analysis' },
      { modelKey: 'gpt5', note: 'Premium: Most powerful analysis' },
      { modelKey: 'geminiPro', note: 'Good: Long context, detailed' },
      { modelKey: 'geminiFlash', note: 'Budget: Fast, good quality' },
    ],
  },
  {
    key: 'roi_calculation',
    label: 'ROI Calculator',
    icon: '\u{1F4B0}',
    description: 'Calculates savings, revenue increase, payback period in \u20B9',
    recommendedModel: 'gpt4o',
    costTier: 2,
    speedTier: 'medium',
    options: [
      { modelKey: 'gpt4o', recommended: true, note: 'Best: Math + financial modeling' },
      { modelKey: 'claude', note: 'Great: Accurate calculations' },
      { modelKey: 'o3', note: 'Premium: Best reasoning model' },
      { modelKey: 'gpt5', note: 'Premium: Most accurate' },
      { modelKey: 'geminiFlash', note: 'Budget: Good enough for basic ROI' },
    ],
  },
  {
    key: 'cold_messages',
    label: 'Cold Message Generator',
    icon: '\u{1F4E8}',
    description: 'WhatsApp, Email, LinkedIn, Instagram outreach messages',
    recommendedModel: 'gpt4o',
    costTier: 2,
    speedTier: 'fast',
    options: [
      { modelKey: 'gpt4o', recommended: true, note: 'Best: Most human-like copywriting' },
      { modelKey: 'gpt5', note: 'Premium: Next-level persuasion' },
      { modelKey: 'claude', note: 'Great: Professional tone' },
      { modelKey: 'geminiFlash', note: 'Budget: Decent, very fast' },
      { modelKey: 'llama', note: 'Free tier: Basic messages' },
    ],
  },
  {
    key: 'competitor_analysis',
    label: 'Competitor Analysis',
    icon: '\u2694\uFE0F',
    description: 'Compares MyDesignNexus vs competitors, builds battle cards',
    recommendedModel: 'sonarPro',
    costTier: 1,
    speedTier: 'fast',
    options: [
      { modelKey: 'sonarPro', recommended: true, note: 'Best: Real-time competitor data' },
      { modelKey: 'sonarDeepResearch', note: 'Deep: Full competitor research report' },
      { modelKey: 'gpt4o', note: 'Good: Training data based' },
      { modelKey: 'claude', note: 'Good: Structured comparison tables' },
    ],
  },
  {
    key: 'proposal_writing',
    label: 'Proposal & Document Writer',
    icon: '\u{1F4C4}',
    description: 'Full personalized proposals, sales docs, agreements',
    recommendedModel: 'claude',
    costTier: 2,
    speedTier: 'medium',
    options: [
      { modelKey: 'claude', recommended: true, note: 'Best: Long-form structured documents' },
      { modelKey: 'gpt5', note: 'Premium: Excellent proposals' },
      { modelKey: 'gpt4o', note: 'Good: Fast proposals' },
      { modelKey: 'geminiPro', note: 'Good: Long detailed docs' },
    ],
  },
  {
    key: 'quick_chat',
    label: 'Quick Chat Assistant',
    icon: '\u{1F4AC}',
    description: 'Ask questions about your business data in plain English',
    recommendedModel: 'geminiFlash',
    costTier: 1,
    speedTier: 'fast',
    options: [
      { modelKey: 'geminiFlash', recommended: true, note: 'Best: Fastest + cheapest for chat' },
      { modelKey: 'claude', note: 'Great: Highest quality answers' },
      { modelKey: 'gpt4o', note: 'Great: Fast smart chat' },
      { modelKey: 'llama', note: 'Budget: Free tier available' },
    ],
  },
  {
    key: 'deep_market_research',
    label: 'Deep Market Research',
    icon: '\u{1F4CA}',
    description: 'Generate 20-50 page industry + market research reports',
    recommendedModel: 'geminiPro',
    costTier: 3,
    speedTier: 'slow',
    options: [
      { modelKey: 'geminiPro', recommended: true, note: 'Best: Comprehensive long reports' },
      { modelKey: 'sonarDeepResearch', note: 'Great: Real-time + cited sources' },
      { modelKey: 'gpt5', note: 'Premium: Specific actionable insights' },
      { modelKey: 'claude', note: 'Good: Best synthesis quality' },
    ],
  },
];

export const COST_LABELS: Record<CostTier, string> = {
  1: '\u20B9',
  2: '\u20B9\u20B9',
  3: '\u20B9\u20B9\u20B9',
};

export const SPEED_LABELS: Record<SpeedTier, { label: string; icon: string }> = {
  fast: { label: 'Fast', icon: '\u26A1' },
  medium: { label: 'Medium', icon: '\u{1F504}' },
  slow: { label: 'Deep', icon: '\u{1F422}' },
};

export const COST_PER_CALL: Record<string, number> = {
  'anthropic/claude-sonnet-4-6': 0.8,
  'openai/gpt-4o': 1.0,
  'openai/gpt-5': 2.5,
  'openai/o3': 3.5,
  'google/gemini-2.5-flash': 0.1,
  'google/gemini-2.5-pro': 1.2,
  'perplexity/sonar-pro': 0.3,
  'perplexity/sonar-deep-research': 0.8,
  'perplexity/sonar': 0.1,
  'meta-llama/llama-3.3-70b-instruct': 0.05,
  'mistralai/mistral-large-2512': 0.6,
};

export function getOpenRouterKey(): string | null {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    return atob(raw);
  } catch {
    return raw;
  }
}

export function setOpenRouterKey(key: string): void {
  localStorage.setItem(LS_KEY, btoa(key));
}

export function removeOpenRouterKey(): void {
  localStorage.removeItem(LS_KEY);
}

export function hasOpenRouterKey(): boolean {
  return !!getOpenRouterKey();
}

export function isSmartAutoEnabled(): boolean {
  return localStorage.getItem(LS_SMART_AUTO) !== 'false';
}

export function setSmartAutoEnabled(enabled: boolean): void {
  localStorage.setItem(LS_SMART_AUTO, String(enabled));
}

export function getModelForTask(taskType: TaskType): ModelConfig {
  const smartAuto = isSmartAutoEnabled();
  const settings: Record<string, string> = JSON.parse(
    localStorage.getItem(LS_MODEL_SETTINGS) || '{}'
  );
  const modelKey = smartAuto
    ? SMART_AUTO_DEFAULTS[taskType]
    : settings[taskType] || SMART_AUTO_DEFAULTS[taskType];
  return MODELS[modelKey] || MODELS[SMART_AUTO_DEFAULTS[taskType]];
}

export function getUserModelSettings(): Record<string, string> {
  return JSON.parse(localStorage.getItem(LS_MODEL_SETTINGS) || '{}');
}

export function setUserModelSettings(settings: Record<string, string>): void {
  localStorage.setItem(LS_MODEL_SETTINGS, JSON.stringify(settings));
}

export function logUsage(entry: UsageLogEntry): void {
  const log: UsageLogEntry[] = JSON.parse(localStorage.getItem(LS_USAGE_LOG) || '[]');
  log.push(entry);
  localStorage.setItem(LS_USAGE_LOG, JSON.stringify(log));

  persistUsageToDb(entry);
}

async function persistUsageToDb(entry: UsageLogEntry): Promise<void> {
  try {
    const { supabase } = await import('../supabase');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const modelConfig = Object.values(MODELS).find(m => m.key === entry.modelKey || m.name === entry.modelName);

    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      task_type: entry.taskType,
      model_name: entry.modelName,
      model_id: modelConfig?.id || entry.modelKey || '',
      tokens_used: entry.tokensUsed,
      estimated_cost: entry.estimatedCost,
      duration_ms: entry.durationMs,
      status: entry.status,
      module: entry.taskType,
    });
  } catch {
    // silent fail - local log is the fallback
  }
}

export function getUsageLog(): UsageLogEntry[] {
  return JSON.parse(localStorage.getItem(LS_USAGE_LOG) || '[]');
}

export function clearUsageLog(): void {
  localStorage.setItem(LS_USAGE_LOG, '[]');
}

export function getUsageStats(): {
  totalCalls: number;
  estimatedCost: number;
  mostUsedModel: string;
  mostUsedTask: string;
} {
  const log = getUsageLog();
  const now = new Date();
  const monthLog = log.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const modelCounts: Record<string, number> = {};
  const taskCounts: Record<string, number> = {};
  let totalCost = 0;

  for (const entry of monthLog) {
    modelCounts[entry.modelName] = (modelCounts[entry.modelName] || 0) + 1;
    taskCounts[entry.taskType] = (taskCounts[entry.taskType] || 0) + 1;
    totalCost += entry.estimatedCost;
  }

  const mostUsedModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  const mostUsedTask = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  return { totalCalls: monthLog.length, estimatedCost: totalCost, mostUsedModel, mostUsedTask };
}

export function exportUsageCSV(): string {
  const log = getUsageLog();
  const header = 'Date,Task,Model,Tokens,Est. Cost (INR),Duration (ms),Status';
  const rows = log.map((e) =>
    `${e.timestamp},${e.taskType},${e.modelName},${e.tokensUsed},${e.estimatedCost.toFixed(2)},${e.durationMs},${e.status}`
  );
  return [header, ...rows].join('\n');
}
