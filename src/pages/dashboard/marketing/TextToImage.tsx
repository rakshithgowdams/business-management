import { useState, useEffect, useRef } from 'react';
import { Loader2, Download, Sparkles, ChevronDown, Dna, History, LayoutTemplate, Info, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl } from '../../../lib/mediaDB';
import { extractTaskId, parseMarketPoll as sharedMarketPoll, parseFluxPoll, parse4oPoll as shared4oPoll } from '../../../lib/marketing/kieApi';
import { useCustomModels } from '../../../lib/marketing/useCustomModels';
import { detectCapabilities } from '../../../lib/marketing/modelCapabilities';
import type { AICharacter } from '../../../lib/marketing/types';
import type { ImageTemplate } from '../../../lib/marketing/imageModels';
import TemplateSelector from './TemplateSelector';

interface ModelDef {
  id: string;
  label: string;
  category: string;
  model: string;
  endpoint: string;
}

interface ImageSlot {
  index: number;
  status: 'idle' | 'generating' | 'done' | 'failed';
  url: string | null;
  elapsed: number;
}

const KIE_BASE = 'https://api.kie.ai';

const ALL_STYLES = [
  'None', 'Photorealistic', 'Digital Art', 'Oil Painting', 'Watercolor',
  'Anime', 'Comic Book', '3D Render', 'Minimalist',
  'Vintage', 'Neon', 'Sketch', 'Pop Art',
];

const ALL_ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
  { label: '21:9', value: '21:9' },
];

const RESOLUTIONS = ['1K', '2K', '3K', '4K'] as const;
type Resolution = typeof RESOLUTIONS[number];

const PROMPT_HISTORY_KEY = 'mfo_img_prompt_history';

function getPromptHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(PROMPT_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function addPromptToHistory(p: string) {
  const history = getPromptHistory().filter((h) => h !== p);
  history.unshift(p);
  localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function ImageSkeletonCard({ elapsed }: { elapsed: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-dark-800 aspect-square">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent animate-[shimmer_2s_ease-in-out_infinite]"
        style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#FF6B00]/30 border-t-[#FF6B00] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FF6B00]/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/80 animate-pulse">Generating</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{elapsed}s elapsed</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]/60"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, (elapsed / 30) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function GeneratedImageCard({ url, label, onDownload }: { url: string; label: string; onDownload: () => void }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-square animate-[fadeIn_0.5s_ease-out]">
      <img src={url} alt="Generated" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-sm font-medium hover:bg-white/25 transition-all border border-white/10"
        >
          <Download className="w-4 h-4" /> Download
        </button>
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/50 text-gray-300 backdrop-blur opacity-0 group-hover:opacity-100 transition-all">
        {label}
      </div>
    </div>
  );
}

interface TextToImageProps {
  onSlotsChange?: (slots: ImageSlot[], isGenerating: boolean) => void;
}

export default function TextToImage({ onSlotsChange }: TextToImageProps) {
  const { user } = useAuth();
  const rawCustomModels = useCustomModels(user?.id, ['text-to-image', 'image', 'text-to-image']);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('medium');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [count, setCount] = useState(1);
  const [selectedModel, setSelectedModel] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [isAnyGenerating, setIsAnyGenerating] = useState(false);
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [useCharacter, setUseCharacter] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<ImageTemplate | null>(null);
  const elapsedTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const abortRef = useRef(false);

  const customModels = rawCustomModels.filter(
    (cm) => cm.category === 'text-to-image' || cm.category === 'image'
  );

  const allModels: ModelDef[] = customModels.map((cm) => ({
    id: cm.id,
    label: cm.name,
    category: cm.category === 'text-to-image' ? 'Text to Image' : cm.category,
    model: cm.model_id,
    endpoint: cm.endpoint,
  }));

  const groupedCategories = [...new Set(allModels.map((m) => m.category))];

  useEffect(() => {
    if (allModels.length > 0 && !selectedModel) {
      setSelectedModel(allModels[0].id);
    }
  }, [allModels.length]);

  const selectedModelDef = allModels.find((m) => m.id === selectedModel);
  const activeCustomModel = customModels.find((cm) => cm.id === selectedModel);
  const capabilities = activeCustomModel ? detectCapabilities(activeCustomModel) : null;

  useEffect(() => { setPromptHistory(getPromptHistory()); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('ai_characters').select('*').eq('user_id', user.id).eq('status', 'trained')
      .then(({ data }) => { if (data) setCharacters(data as AICharacter[]); });
  }, [user]);

  useEffect(() => {
    if (!capabilities) return;
    if (capabilities.defaultAspectRatio) setAspectRatio(capabilities.defaultAspectRatio);
    if (capabilities.defaultQuality) setQuality(capabilities.defaultQuality === 'high' ? 'high' : 'medium');
    if (capabilities.defaultResolution) {
      const r = capabilities.defaultResolution.toUpperCase();
      if (RESOLUTIONS.includes(r as Resolution)) setResolution(r as Resolution);
    }
  }, [selectedModel]);

  useEffect(() => {
    return () => {
      elapsedTimers.current.forEach((t) => clearInterval(t));
    };
  }, []);

  useEffect(() => {
    onSlotsChange?.(slots, isAnyGenerating);
  }, [slots, isAnyGenerating]);

  const startElapsedTimer = (index: number) => {
    if (elapsedTimers.current.has(index)) clearInterval(elapsedTimers.current.get(index)!);
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSlots((prev) => prev.map((s) => s.index === index ? { ...s, elapsed } : s));
    }, 1000);
    elapsedTimers.current.set(index, t);
  };

  const stopElapsedTimer = (index: number) => {
    if (elapsedTimers.current.has(index)) {
      clearInterval(elapsedTimers.current.get(index)!);
      elapsedTimers.current.delete(index);
    }
  };

  const handleApplyTemplate = (t: ImageTemplate | null) => {
    if (!t) { setAppliedTemplate(null); return; }
    setAppliedTemplate(t);
    if (t.master_prompt) setPrompt(t.master_prompt);
    if (t.default_aspect_ratio) setAspectRatio(t.default_aspect_ratio);
    if (t.default_style) setStyle(t.default_style);
    if (t.default_model) {
      const found = allModels.find((m) => m.id === t.default_model);
      if (found) setSelectedModel(t.default_model);
    }
    toast.success(`Template "${t.name}" applied`);
  };

  const buildEnhancedPrompt = (): string => {
    const parts = [prompt];
    if (useCharacter && selectedCharacter) {
      const char = characters.find((c) => c.id === selectedCharacter);
      if (char) {
        parts.push(`Consistent character: ${char.name}`);
        if (char.signature_elements) parts.push(`Key features: ${char.signature_elements}`);
        if (char.style_notes) parts.push(`Appearance: ${char.style_notes}`);
        if (char.gender) parts.push(`Gender: ${char.gender}`);
      }
    }
    return parts.join('. ');
  };

  const buildRequestBody = (enhancedPrompt: string): Record<string, unknown> => {
    const styledPrompt = `${enhancedPrompt}${style !== 'None' ? `, ${style} style` : ''}`;
    if (!activeCustomModel) return {};

    const defaults = { ...activeCustomModel.default_input };
    const input = (defaults.input as Record<string, unknown>) || {};
    if (activeCustomModel.has_prompt) input.prompt = styledPrompt;
    if (input.aspect_ratio !== undefined) input.aspect_ratio = aspectRatio;
    if (capabilities?.hasResolution) input.resolution = resolution;
    defaults.input = input;
    if (activeCustomModel.model_id) defaults.model = activeCustomModel.model_id;
    return defaults;
  };

  const getEndpointUrl = (): string => {
    if (!activeCustomModel) return '';
    return `${KIE_BASE}${activeCustomModel.endpoint}`;
  };

  const getPollUrl = (): string => `${KIE_BASE}/api/v1/jobs/recordInfo`;

  const getPollParser = () => {
    if (!activeCustomModel) return sharedMarketPoll;
    const ep = activeCustomModel.endpoint || '';
    if (ep.includes('gpt4o') || ep.includes('4o')) return shared4oPoll;
    if (ep.includes('kontext')) return parseFluxPoll;
    return sharedMarketPoll;
  };

  const generateSingleImage = async (index: number, apiKey: string, enhancedPrompt: string): Promise<string | null> => {
    startElapsedTimer(index);
    try {
      const body = buildRequestBody(enhancedPrompt);
      const res = await fetch(getEndpointUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        stopElapsedTimer(index);
        setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
        toast.error(data.msg || data.message || data.error?.message || `Image ${index + 1} failed`);
        return null;
      }

      const taskId = extractTaskId(data);
      if (!taskId) {
        stopElapsedTimer(index);
        setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
        toast.error(`Image ${index + 1}: No task ID returned`);
        return null;
      }

      const url = await pollSingleTask(index, taskId, apiKey);
      return url;
    } catch (err) {
      stopElapsedTimer(index);
      setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
      toast.error(err instanceof Error ? err.message : `Image ${index + 1} failed`);
      return null;
    }
  };

  const pollSingleTask = async (index: number, taskId: string, apiKey: string): Promise<string | null> => {
    const pollParser = getPollParser();
    const pollUrl = getPollUrl();
    let attempts = 0;

    while (attempts < 120) {
      if (abortRef.current) {
        stopElapsedTimer(index);
        setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
        return null;
      }
      const waitTime = attempts < 5 ? 2000 : attempts < 20 ? 3000 : 5000;
      await new Promise((r) => setTimeout(r, waitTime));
      try {
        const res = await fetch(`${pollUrl}?taskId=${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const data = await res.json();
        const result = pollParser(data);
        if (result.done) {
          stopElapsedTimer(index);
          if (result.failed || result.urls.length === 0) {
            setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
            return null;
          }
          const url = result.urls[0];
          setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'done', url } : s));
          return url;
        }
      } catch { /* retry */ }
      attempts++;
    }

    stopElapsedTimer(index);
    setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
    return null;
  };

  const handleGenerate = async () => {
    if (!activeCustomModel) { toast.error('Select a model to generate'); return; }
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!prompt.trim()) { toast.error('Enter a prompt'); return; }

    abortRef.current = false;
    elapsedTimers.current.forEach((t) => clearInterval(t));
    elapsedTimers.current.clear();

    const initialSlots: ImageSlot[] = Array.from({ length: count }, (_, i) => ({
      index: i,
      status: 'generating',
      url: null,
      elapsed: 0,
    }));
    setSlots(initialSlots);
    setIsAnyGenerating(true);
    addPromptToHistory(prompt);
    setPromptHistory(getPromptHistory());

    const enhancedPrompt = buildEnhancedPrompt();

    try {
      const promises = Array.from({ length: count }, (_, i) => generateSingleImage(i, apiKey, enhancedPrompt));
      const results = await Promise.all(promises);
      const successUrls = results.filter((u): u is string => u !== null);

      if (successUrls.length > 0) {
        toast.success(`${successUrls.length} of ${count} image${count > 1 ? 's' : ''} generated`);
        await saveToGallery(successUrls);
      } else {
        toast.error('All image generations failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    }

    setIsAnyGenerating(false);
  };

  const handleCountSelect = (n: number) => {
    setCount(n);
    if (prompt.trim() && selectedModel && !isAnyGenerating) {
      setTimeout(() => {
        setCount(n);
      }, 0);
    }
  };

  const saveToGallery = async (urls: string[]) => {
    if (!user) return;
    for (const url of urls) {
      try {
        const assetId = crypto.randomUUID();
        const uploaded = await uploadFromUrl(user.id, assetId, url);
        await supabase.from('media_assets').insert({
          id: assetId, user_id: user.id, type: 'image', title: prompt.slice(0, 100),
          prompt, provider: 'kie_ai', status: 'completed',
          result_url: uploaded?.publicUrl || url, storage_path: uploaded?.path || null,
          file_size: uploaded?.size || 0,
          metadata: { style, aspectRatio, quality, model: selectedModel, template: appliedTemplate?.name || null },
        });
      } catch { /* non-critical */ }
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = `ai-image-${Date.now()}.png`; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const completedCount = slots.filter((s) => s.status === 'done').length;
  const generatingCount = slots.filter((s) => s.status === 'generating').length;

  if (allModels.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-[#FF6B00]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Text-to-Image Models Added</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          Add your custom text-to-image models via the API Console to start generating images.
          Go to <span className="text-[#FF6B00]">Settings &rarr; API Console</span> and add a model with type "Text to Image".
        </p>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-sm font-medium">
          <PlusCircle className="w-4 h-4" />
          Add Model in Settings &rarr; API Console
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes floatText {
          0%, 100% { transform: translateY(0px); opacity: 0.8; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>

      <div className="glass-card rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 inline mr-1" />Template
            </label>
            <TemplateSelector onApply={handleApplyTemplate} appliedId={appliedTemplate?.id} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">AI Model</label>
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
                    {selectedModelDef?.category || 'Custom'}
                  </span>
                  <span className="font-medium">{selectedModelDef?.label || 'Select a model'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
              </button>
              {showModelPicker && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dark-800 border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {groupedCategories.map((cat) => (
                    <div key={cat}>
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b border-white/5 sticky top-0 text-emerald-400 bg-emerald-500/5">{cat}</div>
                      {allModels.filter((m) => m.category === cat).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${m.id === selectedModel ? 'text-[#FF6B00] bg-[#FF6B00]/5' : 'text-gray-300'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{m.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400">CUSTOM</span>
                          </div>
                          {m.id === selectedModel && <span className="text-[10px] font-bold text-[#FF6B00]">SELECTED</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {capabilities && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-emerald-400 font-medium">Model Capabilities</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {capabilities.hasPrompt && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00]">Prompt</span>}
                  {capabilities.hasAspectRatio && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">Aspect Ratio</span>}
                  {capabilities.hasQuality && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400">Quality</span>}
                  {capabilities.hasResolution && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">Resolution</span>}
                  {capabilities.hasCount && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Count</span>}
                </div>
              </div>
            </div>
          )}

          {appliedTemplate?.reference_image_url && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FF6B00]/5 border border-[#FF6B00]/15">
              <img src={appliedTemplate.reference_image_url} alt="Template ref" className="w-14 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-[#FF6B00]">Template: {appliedTemplate.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{appliedTemplate.category}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Prompt
              {appliedTemplate && <span className="ml-2 text-[10px] text-[#FF6B00]">from template: {appliedTemplate.name}</span>}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe the image you want to create..."
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          {characters.length > 0 && (
            <div className="border border-white/5 rounded-xl p-4 bg-dark-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Dna className="w-4 h-4" />
                  <span className="font-medium">Use My Character</span>
                </div>
                <button
                  onClick={() => setUseCharacter(!useCharacter)}
                  className={`w-10 h-5 rounded-full transition-all relative ${useCharacter ? 'bg-[#FF6B00]' : 'bg-dark-700 border border-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCharacter ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {useCharacter && (
                <select value={selectedCharacter} onChange={(e) => setSelectedCharacter(e.target.value)} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00]">
                  <option value="">Select a character...</option>
                  {characters.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.character_type.replace('_', ' ')})</option>))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {ALL_STYLES.map((s) => (
                <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style === s ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {capabilities?.hasAspectRatio && (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ASPECT_RATIOS.map((ar) => (
                    <button key={ar.value} onClick={() => setAspectRatio(ar.value)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${aspectRatio === ar.value ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {capabilities?.hasQuality && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Quality</label>
                  <div className="flex gap-2">
                    {['medium', 'high'].map((q) => (
                      <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${quality === q ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Resolution</label>
                <div className="flex gap-1.5">
                  {RESOLUTIONS.map((r) => {
                    const supported = capabilities?.hasResolution ?? false;
                    const active = resolution === r && supported;
                    return (
                      <button
                        key={r}
                        onClick={() => supported && setResolution(r)}
                        disabled={!supported}
                        title={!supported ? 'This model does not support resolution control' : `Set output to ${r}`}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all
                          ${active ? 'gradient-orange text-white shadow-sm shadow-orange-500/30' : ''}
                          ${supported && !active ? 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-[#FF6B00]/30 cursor-pointer' : ''}
                          ${!supported ? 'bg-dark-900 border border-white/5 text-gray-700 cursor-not-allowed opacity-50' : ''}
                        `}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
                {!capabilities?.hasResolution && (
                  <p className="text-[10px] text-gray-600 mt-1">Model does not expose resolution control</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Count</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setCount(n);
                        if (prompt.trim() && selectedModel && !isAnyGenerating) {
                          setCount(n);
                        }
                      }}
                      disabled={isAnyGenerating}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${count === n ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                    >
                      {n}
                      {count === n && isAnyGenerating && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isAnyGenerating || !prompt.trim() || !selectedModel}
            className="w-full py-3.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#FF6B00]/20 active:scale-[0.99]"
          >
            {isAnyGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating {completedCount}/{count} images...</span>
                {generatingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">
                    {generatingCount} active
                  </span>
                )}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate {count > 1 ? `${count} Images` : 'Image'} with {selectedModelDef?.label || 'Model'}
                {capabilities?.hasResolution && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">{resolution}</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {promptHistory.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <History className="w-4 h-4" />
              <span className="font-medium">Recent Prompts</span>
              <span className="text-[10px] text-gray-500">({promptHistory.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
              {promptHistory.map((p, i) => (
                <button key={i} onClick={() => setPrompt(p)} className="px-3 py-1.5 rounded-lg bg-dark-800 border border-white/5 text-xs text-gray-400 hover:text-white hover:border-[#FF6B00]/30 transition-all truncate max-w-[280px]" title={p}>
                  {p.length > 50 ? p.slice(0, 50) + '...' : p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
