import { useState, useEffect } from 'react';
import { Brain, Zap, Clock, DollarSign, CheckCircle, XCircle, ExternalLink, Search, Sparkles } from 'lucide-react';
import { MODELS, COST_PER_CALL, getOpenRouterKey, OPENROUTER_URL, type ModelConfig } from '../../../lib/ai/models';

interface ModelStatus {
  id: string;
  available: boolean;
  checked: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: 'from-[#d97706] to-[#b45309]',
  OpenAI: 'from-[#10a37f] to-[#0d8a6a]',
  Google: 'from-[#3b82f6] to-[#2563eb]',
  Perplexity: 'from-[#22c55e] to-[#16a34a]',
  Meta: 'from-[#60a5fa] to-[#3b82f6]',
  Mistral: 'from-[#f97316] to-[#ea580c]',
};

const SPEED_COLORS: Record<string, string> = {
  fast: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  slow: 'text-orange-400 bg-orange-500/10',
};

const SPEED_LABELS: Record<string, string> = {
  fast: 'Fast',
  medium: 'Medium',
  slow: 'Deep',
};

interface Props {
  usageCounts: Record<string, number>;
}

export default function ModelCatalog({ usageCounts }: Props) {
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ModelStatus>>({});
  const [checking, setChecking] = useState(false);

  const providers = [...new Set(Object.values(MODELS).map((m) => m.provider))];
  const models = Object.values(MODELS).filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase());
    const matchProvider = !providerFilter || m.provider === providerFilter;
    return matchSearch && matchProvider;
  });

  const checkAllModels = async () => {
    const key = getOpenRouterKey();
    if (!key) return;
    setChecking(true);
    const results: Record<string, ModelStatus> = {};

    for (const model of Object.values(MODELS)) {
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
            model: model.id,
            messages: [{ role: 'user', content: 'Reply OK' }],
            max_tokens: 5,
          }),
        });
        results[model.id] = { id: model.id, available: res.ok || res.status === 429, checked: true };
      } catch {
        results[model.id] = { id: model.id, available: false, checked: true };
      }
    }

    setStatuses(results);
    setChecking(false);
  };

  const costTierLabel = (tier: number) => {
    if (tier === 1) return { label: 'Budget', color: 'text-emerald-400' };
    if (tier === 2) return { label: 'Standard', color: 'text-yellow-400' };
    return { label: 'Premium', color: 'text-orange-400' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B00]/50"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setProviderFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!providerFilter ? 'gradient-orange text-white' : 'bg-dark-700 text-gray-400 hover:text-white border border-white/5'}`}
          >
            All
          </button>
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setProviderFilter(providerFilter === p ? null : p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${providerFilter === p ? 'gradient-orange text-white' : 'bg-dark-700 text-gray-400 hover:text-white border border-white/5'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map((model) => {
          const cost = COST_PER_CALL[model.id] || 0;
          const tier = costTierLabel(model.costTier);
          const status = statuses[model.id];
          const uses = usageCounts[model.name] || 0;

          return (
            <div key={model.key} className="glass-card rounded-xl overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className={`h-1 bg-gradient-to-r ${PROVIDER_COLORS[model.provider] || 'from-gray-500 to-gray-600'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-gray-400" />
                      <h3 className="font-semibold text-white text-sm">{model.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{model.provider}</p>
                  </div>
                  {status?.checked && (
                    <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {status.available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {status.available ? 'Online' : 'Offline'}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#FF9A00]" />
                  {model.bestFor}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <DollarSign className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                    <p className={`text-xs font-semibold ${tier.color}`}>{tier.label}</p>
                    <p className="text-[10px] text-gray-600">~{cost.toFixed(2)} INR</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <Zap className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                    <p className={`text-xs font-semibold px-1 rounded ${SPEED_COLORS[model.speedTier]}`}>{SPEED_LABELS[model.speedTier]}</p>
                    <p className="text-[10px] text-gray-600">Speed</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <Clock className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-white">{uses}</p>
                    <p className="text-[10px] text-gray-600">Calls</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600 font-mono">{model.id}</span>
                  <a
                    href={`https://openrouter.ai/models/${model.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-500 hover:text-[#FF6B00] flex items-center gap-1 transition-colors"
                  >
                    Details <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={checkAllModels}
          disabled={checking || !getOpenRouterKey()}
          className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
        >
          {checking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking Models...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Check Model Availability
            </>
          )}
        </button>
      </div>
    </div>
  );
}
