import { useState, useEffect } from 'react';
import { Terminal, Database, Loader2, Key, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { getApiKey, setApiKey, hasApiKeySet, syncKeyToSupabase, testKieAiKey } from '../../../../lib/apiKeys';
import { generateModelName, type ParsedCurl } from '../../../../lib/marketing/curlParser';
import CurlInputPanel from './CurlInputPanel';
import ApiPlayground from './ApiPlayground';
import SavedModelCard from './SavedModelCard';
import type { InputField } from '../../../../lib/marketing/curlParser';

interface CustomModel {
  id: string;
  name: string;
  model_id: string;
  category: string;
  endpoint: string;
  method: string;
  default_input: Record<string, unknown>;
  input_schema: InputField[];
  has_prompt: boolean;
  has_image_input: boolean;
  has_callback: boolean;
  original_curl: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

type ConsoleStep = 'paste' | 'playground' | 'save';

export default function ApiConsole() {
  const { user } = useAuth();
  const [models, setModels] = useState<CustomModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState<ConsoleStep>('paste');
  const [pendingParsed, setPendingParsed] = useState<ParsedCurl | null>(null);
  const [pendingCurl, setPendingCurl] = useState('');
  const [testResultUrls, setTestResultUrls] = useState<string[]>([]);

  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('image');
  const [saveNotes, setSaveNotes] = useState('');

  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [keyCredits, setKeyCredits] = useState<number | null>(null);
  const [savingKey, setSavingKey] = useState(false);

  const [currentKey, setCurrentKey] = useState('');
  const hasKey = hasApiKeySet('kie_ai');

  useEffect(() => {
    if (!user) return;
    loadModels();
    getApiKey('kie_ai').then(setCurrentKey);
  }, [user]);

  const loadModels = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('kie_custom_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setModels(data as CustomModel[]);
    setLoading(false);
  };

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setSavingKey(true);
    setKeyStatus('testing');

    const result = await testKieAiKey(key);
    if (result.success) {
      await setApiKey('kie_ai', key);
      await syncKeyToSupabase('kie_ai', key);
      setCurrentKey(key);
      setKeyStatus('ok');
      setKeyCredits(result.credits ?? null);
      setKeyInput('');
      setShowKey(false);
      toast.success('KIE AI key saved and verified');
    } else {
      setKeyStatus('error');
      toast.error(result.error || 'Invalid API key');
    }
    setSavingKey(false);
  };

  const handleParsed = (parsed: ParsedCurl, curl: string, subType?: string) => {
    setPendingParsed(parsed);
    setPendingCurl(curl);
    setSaveName(generateModelName(parsed));
    setSaveCategory(subType || parsed.category);
    setSaveNotes('');
    setTestResultUrls([]);
    setStep('playground');
  };

  const handleTestSuccess = (urls: string[]) => {
    setTestResultUrls(urls);
    setStep('save');
  };

  const handleTestSuccessWithRaw = (urls: string[], _raw: Record<string, unknown>) => {
    handleTestSuccess(urls);
  };

  const handleSave = async () => {
    if (!user || !pendingParsed) return;
    if (!saveName.trim()) { toast.error('Enter a model name'); return; }

    setSaving(true);
    const { error } = await supabase.from('kie_custom_models').insert({
      user_id: user.id,
      name: saveName.trim(),
      model_id: pendingParsed.modelId,
      category: saveCategory,
      endpoint: pendingParsed.endpoint,
      method: pendingParsed.method,
      default_input: pendingParsed.defaultInput,
      input_schema: pendingParsed.inputFields,
      has_prompt: pendingParsed.hasPrompt,
      has_image_input: pendingParsed.hasImageInput,
      has_callback: pendingParsed.hasCallback,
      original_curl: pendingCurl,
      notes: saveNotes,
    });

    if (error) {
      toast.error('Failed to save model');
    } else {
      toast.success('Model saved and available in generators');
      setStep('paste');
      setPendingParsed(null);
      setPendingCurl('');
      setTestResultUrls([]);
      await loadModels();
    }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggle = (id: string, active: boolean) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, is_active: active } : m)));
  };

  const handleRename = (id: string, name: string) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  };

  const resetToStep1 = () => {
    setStep('paste');
    setPendingParsed(null);
    setPendingCurl('');
    setTestResultUrls([]);
  };

  const categories = [
    'text-to-image', 'image-to-image', 'image-editing',
    'text-to-video', 'image-to-video', 'video-to-video', 'video-editing', 'speech-to-video', 'lip-sync',
    'text-to-music',
    'text-to-speech', 'speech-to-text', 'audio-to-audio',
  ];
  const activeCount = models.filter((m) => m.is_active).length;

  const masked = currentKey ? currentKey.slice(0, 6) + '........' + currentKey.slice(-4) : '';

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-sm font-semibold text-white">KIE AI API Key</span>
          </div>
          {hasKey && keyStatus === 'ok' && keyCredits !== null && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {keyCredits} credits
            </span>
          )}
          {hasKey && keyStatus === 'idle' && (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>

        {hasKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-lg border border-white/5">
              <span className="text-xs text-gray-400 flex-1 font-mono">{masked}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Replace with new key..."
                  className="w-full px-3 py-2 pr-8 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {keyInput && (
                <button
                  onClick={handleSaveKey}
                  disabled={savingKey}
                  className="px-3 py-2 rounded-lg gradient-orange text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  {savingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Save & Verify
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Enter your KIE AI API key to use the playground and all AI generation features.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setKeyStatus('idle'); }}
                  placeholder="kie_..."
                  className="w-full px-3 py-2.5 pr-8 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim() || savingKey}
                className="px-4 py-2.5 rounded-lg gradient-orange text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
              >
                {savingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                Save & Verify
              </button>
            </div>
            {keyStatus === 'error' && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Invalid key. Check and try again.
              </p>
            )}
            <a
              href="https://kie.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#FF6B00] hover:text-[#FF9A00]"
            >
              Get your API key at kie.ai <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-1">
        {['paste', 'playground', 'save'].map((s, i) => {
          const labels = ['1. Paste cURL', '2. Test in Playground', '3. Save Model'];
          const isActive = step === s;
          const isPast = ['paste', 'playground', 'save'].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20' :
                isPast ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' :
                'bg-dark-800/50 text-gray-500 border border-white/5'
              }`}>
                {isPast && !isActive ? <CheckCircle className="w-3 h-3" /> : null}
                <span>{labels[i]}</span>
              </div>
              {i < 2 && <div className={`w-6 h-px ${isPast ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
            </div>
          );
        })}
      </div>

      {step === 'paste' && (
        <div className="glass-card rounded-xl p-6">
          <CurlInputPanel onParsed={handleParsed} />
        </div>
      )}

      {step === 'playground' && pendingParsed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{generateModelName(pendingParsed)}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] uppercase">{pendingParsed.category}</span>
            </div>
            <button
              onClick={resetToStep1}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Start Over
            </button>
          </div>
          <ApiPlayground
            parsed={pendingParsed}
            apiKey={currentKey}
            onTestSuccess={handleTestSuccessWithRaw}
          />
        </div>
      )}

      {step === 'save' && pendingParsed && (
        <div className="glass-card rounded-xl p-6 border-2 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Test Passed -- Save This Model</h3>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Your cURL worked and returned {testResultUrls.length} result(s). Save this model to use it in Image, Video, and other generators.
          </p>

          {testResultUrls.length > 0 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
              {testResultUrls.map((url, i) => {
                const isVideo = url.includes('.mp4') || url.includes('video');
                return isVideo ? (
                  <video key={i} src={url} controls className="h-32 rounded-lg border border-white/10 flex-shrink-0" />
                ) : (
                  <img key={i} src={url} alt={`Result ${i}`} className="h-32 rounded-lg border border-white/10 object-cover flex-shrink-0" />
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Model Name</label>
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Kling 3.0 Video"
                className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSaveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      saveCategory === cat
                        ? 'gradient-orange text-white'
                        : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Selected: <span className="text-[#FF6B00] font-medium">{saveCategory}</span></p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                rows={2}
                placeholder="Any notes about this model..."
                className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-dark-900/50 rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Model ID</p>
                <p className="text-xs text-white font-mono mt-0.5 truncate">{pendingParsed.modelId}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Endpoint</p>
                <p className="text-xs text-gray-300 font-mono mt-0.5 truncate">{pendingParsed.endpoint}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Features</p>
                <div className="flex gap-1 mt-0.5">
                  {pendingParsed.hasPrompt && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#FF6B00]/10 text-[#FF6B00]">Prompt</span>}
                  {pendingParsed.hasImageInput && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400">Image</span>}
                  {pendingParsed.hasCallback && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400">Callback</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Save to My Models
              </button>
              <button
                onClick={() => setStep('playground')}
                className="px-5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors"
              >
                Re-test
              </button>
              <button
                onClick={resetToStep1}
                className="px-5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Saved Models</h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                {activeCount} active
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            Active models appear in Image, Video, and other generators
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No saved models yet</p>
            <p className="text-xs text-gray-600 mt-1">Paste a cURL above, test it in the playground, then save</p>
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((m) => (
              <SavedModelCard
                key={m.id}
                model={m}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
