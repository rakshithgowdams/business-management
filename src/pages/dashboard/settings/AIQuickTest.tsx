import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { MODELS, getOpenRouterKey, hasOpenRouterKey, OPENROUTER_URL, type ModelConfig } from '../../../lib/ai/models';

const REASONING_MODELS = new Set(['openai/o3', 'openai/o3-mini', 'openai/o4-mini', 'openai/gpt-5', 'openai/gpt-5-mini']);

interface TestResult {
  response: string;
  time: number;
  success: boolean;
}

export default function AIQuickTest() {
  const [selectedModelKey, setSelectedModelKey] = useState('claude');
  const [customPrompt, setCustomPrompt] = useState('What AI model are you? Reply in one sentence.');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const hasKey = hasOpenRouterKey();
  const selectedModel: ModelConfig = MODELS[selectedModelKey] || MODELS['claude'];

  const handleTest = async () => {
    const key = getOpenRouterKey();
    if (!key) return;

    setTesting(true);
    setResult(null);
    const start = performance.now();

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': 'https://mydesignnexus.com',
          'X-Title': 'MyFinance OS',
        },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [{ role: 'user', content: customPrompt }],
          ...(REASONING_MODELS.has(selectedModel.id)
            ? { max_completion_tokens: 200 }
            : { max_tokens: 150 }),
          temperature: 0.7,
        }),
      });

      const elapsed = Math.round(performance.now() - start);

      if (!res.ok) {
        setResult({ response: `Error: ${res.status}`, time: elapsed, success: false });
        setTesting(false);
        return;
      }

      const json = await res.json();
      const responseText = json.choices?.[0]?.message?.content || 'No response';
      const tokens = json.usage?.total_tokens || 0;

      setResult({
        response: responseText,
        time: elapsed,
        success: true,
      });

      if (tokens > 0) {
        setResult((prev) => prev ? { ...prev, response: `${prev.response}\n\n~${tokens} tokens` } : prev);
      }
    } catch {
      const elapsed = Math.round(performance.now() - start);
      setResult({ response: 'Network error', time: elapsed, success: false });
    }

    setTesting(false);
  };

  if (!hasKey) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
          🧪 Test Any Model
        </h2>
        <p className="text-xs text-gray-600 text-center py-6">Add your OpenRouter API key to test models.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        🧪 Test Any Model
      </h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Model</label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white hover:border-brand-500/30"
            >
              <span>{selectedModel.name} ({selectedModel.provider})</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-dark-700 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {Object.values(MODELS).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setSelectedModelKey(m.key); setShowDropdown(false); setResult(null); }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-white/5 text-sm border-b border-white/5 last:border-0 ${
                        m.key === selectedModelKey ? 'bg-brand-600/10 text-brand-400' : 'text-white'
                      }`}
                    >
                      {m.name} <span className="text-gray-500 text-xs">({m.provider})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Test Prompt</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={testing || !customPrompt.trim()}
          className="px-5 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {testing ? 'Running...' : 'Run Test'}
        </button>

        {result && (
          <div className={`rounded-xl p-4 border text-sm ${
            result.success
              ? 'bg-green-500/5 border-green-500/10 text-green-200'
              : 'bg-red-500/5 border-red-500/10 text-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
              <span className="text-xs text-gray-500">
                Time: {(result.time / 1000).toFixed(1)}s
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{result.response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
