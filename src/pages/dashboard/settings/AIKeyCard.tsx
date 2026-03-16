import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { getOpenRouterKey, setOpenRouterKey, removeOpenRouterKey, OPENROUTER_URL } from '../../../lib/ai/models';
import { saveApiKey, deleteApiKey } from '../../../lib/ai/api';

interface Props {
  onStatusChange: () => void;
}

export default function AIKeyCard({ onStatusChange }: Props) {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const existingKey = getOpenRouterKey();
  const hasKey = !!existingKey;
  const maskedKey = existingKey ? 'sk-or-••••••••' + existingKey.slice(-4) : '';

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    const key = keyInput.trim();
    setOpenRouterKey(key);
    saveApiKey(key);
    setKeyInput('');
    setShowKey(false);
    setStatus('idle');
    setResponseTime(null);
    setSaving(false);
    onStatusChange();
  };

  const handleRemove = async () => {
    removeOpenRouterKey();
    deleteApiKey();
    setStatus('idle');
    setResponseTime(null);
    setKeyInput('');
    onStatusChange();
  };

  const handleTest = async () => {
    const key = existingKey || keyInput.trim();
    if (!key) return;

    if (!existingKey && keyInput.trim()) {
      setOpenRouterKey(keyInput.trim());
      saveApiKey(keyInput.trim());
      setKeyInput('');
      onStatusChange();
    }

    setTesting(true);
    setStatus('idle');
    setResponseTime(null);
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
          model: 'anthropic/claude-sonnet-4-6',
          messages: [{ role: 'user', content: 'Reply only: OpenRouter connected!' }],
          max_tokens: 20,
        }),
      });

      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setResponseTime(Math.round(performance.now() - start));
      setStatus('error');
    }
    setTesting(false);
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shrink-0">
          <span className="text-lg">🔑</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white">OpenRouter API Key</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            One key to access ALL AI models: Claude, GPT-4o, GPT-5, Gemini, Perplexity Sonar, o3 & 200+ more
          </p>
        </div>
        {hasKey && (
          <div className="shrink-0">
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {status === 'idle' && <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />}
          </div>
        )}
      </div>

      {hasKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 rounded-xl border border-white/5">
            <span className="text-sm text-gray-400 flex-1 font-mono">{maskedKey}</span>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              🧪 Test
            </button>
            <button
              onClick={handleRemove}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {status === 'success' && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Invalid Key
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}

          <div className="border-t border-white/5 pt-3">
            <p className="text-[11px] text-gray-600 mb-2">Replace key:</p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {keyInput && (
              <button onClick={handleSave} disabled={saving} className="mt-2 px-4 py-2 rounded-xl gradient-orange text-white text-xs font-semibold disabled:opacity-50">
                Save New Key
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || saving}
              className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              💾 Save Key
            </button>
            <button
              onClick={handleTest}
              disabled={!keyInput.trim() || testing}
              className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              🧪 Test Connection
            </button>
          </div>
          {status === 'success' && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Invalid Key
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
          >
            💡 Get your key at openrouter.ai/keys -- New users get $5 free credits! <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
