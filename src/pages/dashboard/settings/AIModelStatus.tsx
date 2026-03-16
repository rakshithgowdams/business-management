import { useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { MODELS, COST_LABELS, SPEED_LABELS, hasOpenRouterKey, getOpenRouterKey, OPENROUTER_URL } from '../../../lib/ai/models';

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  OpenAI: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Google: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Perplexity: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Meta: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Mistral: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const REASONING_MODELS = new Set(['openai/o3', 'openai/o3-mini', 'openai/o4-mini', 'openai/gpt-5', 'openai/gpt-5-mini']);

function buildTestBody(modelId: string) {
  const isReasoning = REASONING_MODELS.has(modelId);
  const body: Record<string, unknown> = {
    model: modelId,
    messages: [{ role: 'user', content: 'Reply with one word: OK' }],
  };
  if (isReasoning) {
    body.max_completion_tokens = 50;
  } else {
    body.max_tokens = 20;
  }
  return body;
}

export default function AIModelStatus() {
  const hasKey = hasOpenRouterKey();
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleTestModel = async (modelKey: string, modelId: string) => {
    const key = getOpenRouterKey();
    if (!key) return;
    setTesting(modelKey);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': 'https://mydesignnexus.com',
          'X-Title': 'MyFinance OS',
        },
        body: JSON.stringify(buildTestBody(modelId)),
      });
      setTestResults((prev) => ({ ...prev, [modelKey]: res.ok }));
    } catch {
      setTestResults((prev) => ({ ...prev, [modelKey]: false }));
    }
    setTesting(null);
  };

  const modelEntries = Object.values(MODELS);

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        📡 Available Models via OpenRouter
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {modelEntries.map((model) => {
          const providerClass = PROVIDER_COLORS[model.provider] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
          const testResult = testResults[model.key];

          return (
            <div key={model.key} className="bg-dark-800 rounded-xl border border-white/5 p-3.5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white leading-tight">{model.name}</h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${providerClass}`}>
                  {model.provider}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">{model.bestFor}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{COST_LABELS[model.costTier]}</span>
                  <span className="text-[10px] text-gray-500">{SPEED_LABELS[model.speedTier].icon}</span>
                  {hasKey ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Available
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400">Add key</span>
                  )}
                </div>
                {hasKey && (
                  <button
                    onClick={() => handleTestModel(model.key, model.id)}
                    disabled={!!testing}
                    className="text-[10px] text-gray-500 hover:text-white disabled:opacity-50 flex items-center gap-1"
                  >
                    {testing === model.key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : testResult === true ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : testResult === false ? (
                      <XCircle className="w-3 h-3 text-red-400" />
                    ) : null}
                    Test
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
