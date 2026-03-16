import { useState } from 'react';
import { ArrowRight, ExternalLink, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { setOpenRouterKey, getOpenRouterKey, OPENROUTER_URL } from '../../../lib/ai/models';

interface Props {
  onComplete: () => void;
}

export default function AISetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testKey = async () => {
    if (!keyInput.trim()) return;
    setTesting(true);
    setStatus('idle');
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyInput.trim()}`,
          'HTTP-Referer': 'https://mydesignnexus.com',
          'X-Title': 'MyFinance OS',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-6',
          messages: [{ role: 'user', content: 'Reply with: OK' }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        setOpenRouterKey(keyInput.trim());
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setTesting(false);
  };

  const saveAndFinish = () => {
    if (keyInput.trim() && !getOpenRouterKey()) {
      setOpenRouterKey(keyInput.trim());
    }
    setStep(2);
  };

  if (step === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🚀</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Setup Your AI Models</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          One API key gives you access to Claude, GPT-4o, GPT-5, Gemini, Perplexity Sonar, and 200+ more models. Takes 1 minute.
        </p>
        <div className="bg-dark-800 rounded-lg p-4 border border-green-500/20 mb-6 text-left">
          <p className="text-sm text-green-400 font-medium mb-1">How it works:</p>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li>1. Get a free OpenRouter API key</li>
            <li>2. Paste it below</li>
            <li>3. All 10+ AI models unlock instantly</li>
            <li className="text-green-400">New users get $5 free credits!</li>
          </ul>
        </div>
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 rounded-xl gradient-orange text-white font-semibold flex items-center gap-2 mx-auto"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="glass-card rounded-xl p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
            <span className="text-lg">🔑</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Enter Your OpenRouter Key</h2>
            <p className="text-xs text-gray-500">One key for Claude, GPT-4o, Gemini, Sonar & more</p>
          </div>
        </div>
        <ol className="text-sm text-gray-400 space-y-2 mb-5 pl-5 list-decimal">
          <li>
            Go to{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline inline-flex items-center gap-1">
              openrouter.ai/keys <ExternalLink className="w-3 h-3" />
            </a>{' '}
            -- Sign up free
          </li>
          <li>Click "Create Key"</li>
          <li>Copy key and paste below</li>
          <li className="text-green-400">Free $5 credits on signup!</li>
        </ol>
        <div className="relative mb-3">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => { setKeyInput(e.target.value); setStatus('idle'); }}
            placeholder="sk-or-v1-..."
            className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={testKey}
            disabled={!keyInput.trim() || testing}
            className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-50 flex items-center gap-1.5"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Test
          </button>
          <button
            onClick={saveAndFinish}
            disabled={!keyInput.trim()}
            className="px-4 py-2 rounded-lg gradient-orange text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            Save & Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {status === 'success' && (
          <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Connected -- All models unlocked!</p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Invalid key -- check and try again</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-8 h-8 text-green-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">You're All Set!</h2>
      <p className="text-sm text-gray-400 mb-4">
        Your single OpenRouter key now gives you access to all 10+ AI models. Smart Auto Mode is ON -- the app automatically picks the best model for each task.
      </p>
      <div className="bg-dark-800 rounded-lg p-3 mb-6 text-left">
        <p className="text-xs text-gray-500 mb-2">Models now available:</p>
        <div className="flex flex-wrap gap-1.5">
          {['Claude 4.6', 'GPT-4o', 'GPT-5', 'o3', 'Gemini Flash', 'Gemini Pro', 'Sonar Pro', 'Sonar Deep', 'Llama 70B'].map((m) => (
            <span key={m} className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{m}</span>
          ))}
        </div>
      </div>
      <button
        onClick={onComplete}
        className="px-6 py-3 rounded-xl gradient-orange text-white font-semibold"
      >
        Start Using AI
      </button>
    </div>
  );
}
