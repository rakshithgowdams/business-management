import { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getApiKey,
  setApiKey,
  hasApiKeySet,
  removeApiKey,
  syncKeyToSupabase,
  removeKeyFromSupabase,
  testKieAiKey,
  testElevenLabsKey,
  testMetaKey,
  type KeyName,
} from '../../../lib/apiKeys';

interface Props {
  name: KeyName;
  title: string;
  description: string;
  placeholder: string;
  icon: string;
  docsUrl?: string;
  docsLabel?: string;
  onStatusChange?: () => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const TESTABLE_KEYS: KeyName[] = ['kie_ai', 'elevenlabs', 'meta'];

export default function IntegrationKeyCard({ name, title, description, placeholder, icon, docsUrl, docsLabel, onStatusChange }: Props) {
  const [input, setInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const [existing, setExisting] = useState('');

  const hasKey = hasApiKeySet(name);
  const masked = existing ? existing.slice(0, 6) + '••••' + existing.slice(-4) : '';

  useEffect(() => {
    getApiKey(name).then(setExisting);
  }, [name, version]);
  const canTest = TESTABLE_KEYS.includes(name);

  const testKey = async (key: string) => {
    setTestStatus('testing');
    setTestMsg('');

    let result: { success: boolean; error?: string; credits?: number };

    if (name === 'kie_ai') {
      result = await testKieAiKey(key);
      if (result.success && result.credits !== undefined) {
        setTestMsg(`Connected - ${result.credits} credits`);
      }
    } else if (name === 'elevenlabs') {
      result = await testElevenLabsKey(key);
    } else if (name === 'meta') {
      result = await testMetaKey(key);
    } else {
      result = { success: true };
    }

    if (result.success) {
      setTestStatus('success');
      if (!testMsg) setTestMsg('Connected');
    } else {
      setTestStatus('error');
      setTestMsg(result.error || 'Invalid key');
    }

    return result.success;
  };

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);

    const key = input.trim();
    await setApiKey(name, key);
    await syncKeyToSupabase(name, key);

    if (canTest) {
      const ok = await testKey(key);
      if (ok) {
        toast.success(`${title} key saved and verified`);
      } else {
        toast.error(`${title} key saved but verification failed`);
      }
    } else {
      toast.success(`${title} key saved`);
    }

    setInput('');
    setShowKey(false);
    setSaving(false);
    setVersion((v) => v + 1);
    onStatusChange?.();
  };

  const handleRemove = async () => {
    removeApiKey(name);
    await removeKeyFromSupabase(name);
    setTestStatus('idle');
    setTestMsg('');
    setInput('');
    setVersion((v) => v + 1);
    onStatusChange?.();
    toast.success(`${title} key removed`);
  };

  const handleTest = async () => {
    const key = (await getApiKey(name)) || input.trim();
    if (!key) return;
    await testKey(key);
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-dark-800 border border-white/10 flex items-center justify-center shrink-0">
          <span className="text-base">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="shrink-0 mt-0.5">
          {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
          {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
          {testStatus === 'idle' && hasKey && <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />}
        </div>
      </div>

      {hasKey ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-lg border border-white/5">
            <span className="text-xs text-gray-400 flex-1 font-mono">{masked}</span>
            {canTest && (
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing'}
                className="px-2 py-1 rounded text-[10px] font-medium border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1"
              >
                {testStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Test
              </button>
            )}
            <button onClick={handleRemove} className="p-1 rounded text-gray-500 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {testStatus !== 'idle' && testMsg && (
            <p className={`text-[11px] flex items-center gap-1 ${testStatus === 'success' ? 'text-green-400' : testStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
              {testStatus === 'success' && <CheckCircle className="w-3 h-3" />}
              {testStatus === 'error' && <XCircle className="w-3 h-3" />}
              {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {testMsg}
            </p>
          )}

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Replace key..."
              className="w-full px-3 py-2 pr-8 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {input && (
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save & Verify
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 pr-8 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!input.trim() || saving}
            className="px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            {canTest ? 'Save & Verify' : 'Save Key'}
          </button>

          {testStatus !== 'idle' && testMsg && (
            <p className={`text-[11px] flex items-center gap-1 ${testStatus === 'success' ? 'text-green-400' : testStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
              {testStatus === 'success' && <CheckCircle className="w-3 h-3" />}
              {testStatus === 'error' && <XCircle className="w-3 h-3" />}
              {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {testMsg}
            </p>
          )}

          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300">
              {docsLabel || 'Get your key'} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
