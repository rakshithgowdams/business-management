import { useState, useRef, useEffect } from 'react';
import { Loader2, Wand2, Upload, Download, X, ChevronDown, LayoutTemplate, Info, PlusCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl, uploadMediaToStorage } from '../../../lib/mediaDB';
import { extractTaskId, parseMarketPoll, parseFluxPoll } from '../../../lib/marketing/kieApi';
import { useCustomModels } from '../../../lib/marketing/useCustomModels';
import { detectCapabilities } from '../../../lib/marketing/modelCapabilities';
import type { ImageTemplate } from '../../../lib/marketing/imageModels';
import TemplateSelector from './TemplateSelector';

const KIE_BASE = 'https://api.kie.ai';

const EDIT_PRESETS = [
  { label: 'Style Transfer', prompt: 'Transform the style of this image to a cinematic look' },
  { label: 'Background Change', prompt: 'Change the background to a professional studio setting' },
  { label: 'Color Grading', prompt: 'Apply warm cinematic color grading to enhance the mood' },
  { label: 'Object Removal', prompt: 'Remove the unwanted objects and fill naturally' },
  { label: 'Enhancement', prompt: 'Enhance quality, make it sharper and more vivid with better lighting' },
  { label: 'Artistic', prompt: 'Convert this image into an artistic oil painting style' },
  { label: 'Portrait Polish', prompt: 'Polish this portrait: enhance skin, improve lighting, professional finish' },
  { label: 'Product Focus', prompt: 'Make product stand out: enhance colors, clean background, studio quality' },
];

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
];

const RESOLUTIONS = ['1K', '2K', '3K', '4K'] as const;
type Resolution = typeof RESOLUTIONS[number];

interface ImageSlot {
  index: number;
  status: 'generating' | 'done' | 'failed';
  url: string | null;
  elapsed: number;
}

function SkeletonCard({ elapsed }: { elapsed: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-dark-800 aspect-square">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 animate-pulse" />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
          backgroundSize: '200% 100%',
          animation: 'iedShimmer 2s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-amber-400/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/80" style={{ animation: 'iedFloat 2s ease-in-out infinite' }}>
            Editing
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{elapsed}s elapsed</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
              style={{ animation: `iedBounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, (elapsed / 30) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultCard({ url, label, onDownload }: { url: string; label: string; onDownload: () => void }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-square" style={{ animation: 'iedFadeIn 0.5s ease-out' }}>
      <img src={url} alt="Edited" className="w-full h-full object-cover" />
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
      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  );
}

interface ImageEditingProps {
  onSlotsChange?: (slots: ImageSlot[], isGenerating: boolean) => void;
}

export default function ImageEditing({ onSlotsChange }: ImageEditingProps) {
  const { user } = useAuth();
  const rawCustomModels = useCustomModels(user?.id, ['image-editing', 'image-editing']);
  const [prompt, setPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState('');
  const [uploadedSourceUrl, setUploadedSourceUrl] = useState<string | null>(null);
  const [isUploadingSource, setIsUploadingSource] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [strength, setStrength] = useState(0.7);
  const [count, setCount] = useState(1);
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [isAnyGenerating, setIsAnyGenerating] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<ImageTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const elapsedTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const abortRef = useRef(false);

  const customModels = rawCustomModels.filter((cm) => cm.category === 'image-editing');
  const allModels = customModels.map((cm) => ({
    id: cm.id,
    label: cm.name,
    category: 'Image Editing',
    model: cm.model_id,
    endpoint: cm.endpoint,
  }));
  const groupedCategories = [...new Set(allModels.map((m) => m.category))];

  useEffect(() => {
    if (allModels.length > 0 && !selectedModelId) {
      setSelectedModelId(allModels[0].id);
    }
  }, [allModels.length]);

  const selectedModelDef = allModels.find((m) => m.id === selectedModelId);
  const activeCustomModel = customModels.find((cm) => cm.id === selectedModelId);
  const capabilities = activeCustomModel ? detectCapabilities(activeCustomModel) : null;

  useEffect(() => {
    if (!capabilities) return;
    if (capabilities.defaultAspectRatio) setAspectRatio(capabilities.defaultAspectRatio);
    if (capabilities.defaultStrength != null) setStrength(capabilities.defaultStrength);
    if (capabilities.defaultResolution) {
      const r = capabilities.defaultResolution.toUpperCase();
      if (RESOLUTIONS.includes(r as Resolution)) setResolution(r as Resolution);
    }
  }, [selectedModelId]);

  useEffect(() => {
    return () => { elapsedTimers.current.forEach((t) => clearInterval(t)); };
  }, []);

  useEffect(() => {
    onSlotsChange?.(slots, isAnyGenerating);
  }, [slots, isAnyGenerating]);

  const startElapsedTimer = (index: number) => {
    if (elapsedTimers.current.has(index)) clearInterval(elapsedTimers.current.get(index)!);
    const start = Date.now();
    const t = setInterval(() => {
      setSlots((prev) => prev.map((s) => s.index === index ? { ...s, elapsed: Math.floor((Date.now() - start) / 1000) } : s));
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
    if (t.default_model) {
      const found = allModels.find((m) => m.id === t.default_model);
      if (found) setSelectedModelId(t.default_model);
    }
    toast.success(`Template "${t.name}" applied`);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceImage(file);
    setSourcePreview(URL.createObjectURL(file));
    setSlots([]);
    setUploadedSourceUrl(null);
    await uploadSourceImage(file);
  };

  const uploadSourceImage = async (file: File) => {
    if (!user) { toast.error('Please log in first'); return; }
    setIsUploadingSource(true);
    try {
      const assetId = `ied-source-${crypto.randomUUID()}`;
      const result = await uploadMediaToStorage(user.id, assetId, file, file.type || 'image/jpeg');
      if (!result) { toast.error('Failed to upload source image'); return; }
      setUploadedSourceUrl(result.publicUrl);
      toast.success('Source image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingSource(false);
    }
  };

  const clearSource = () => {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourceImage(null);
    setSourcePreview('');
    setUploadedSourceUrl(null);
    setSlots([]);
  };

  const getEndpointAndPoll = () => {
    if (!activeCustomModel) return { endpoint: '', pollUrl: `${KIE_BASE}/api/v1/jobs/recordInfo`, parser: parseMarketPoll };
    const ep = activeCustomModel.endpoint || '';
    if (ep.includes('kontext')) {
      return { endpoint: `${KIE_BASE}${ep}`, pollUrl: `${KIE_BASE}/api/v1/flux/kontext/record-info`, parser: parseFluxPoll };
    }
    return { endpoint: `${KIE_BASE}${ep}`, pollUrl: `${KIE_BASE}/api/v1/jobs/recordInfo`, parser: parseMarketPoll };
  };

  const buildBody = (sourceUrl: string): Record<string, unknown> => {
    if (!activeCustomModel) return {};
    const body = { ...activeCustomModel.default_input };
    const input = (body.input as Record<string, unknown>) || {};
    if (activeCustomModel.has_prompt) input.prompt = prompt;
    input.image = sourceUrl;
    input.image_url = sourceUrl;
    input.image_urls = [sourceUrl];
    if (capabilities?.hasAspectRatio) input.aspect_ratio = aspectRatio;
    if (capabilities?.hasStrength) input.strength = strength;
    if (capabilities?.hasResolution) input.resolution = resolution;
    body.input = input;
    if (activeCustomModel.model_id) body.model = activeCustomModel.model_id;
    return body;
  };

  const generateSingle = async (index: number, apiKey: string, sourceUrl: string): Promise<string | null> => {
    startElapsedTimer(index);
    const { endpoint, pollUrl, parser } = getEndpointAndPoll();
    try {
      const body = buildBody(sourceUrl);
      const res = await fetch(endpoint, {
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
        toast.error(`Image ${index + 1}: no task ID returned`);
        return null;
      }
      return await pollSingle(index, taskId, apiKey, pollUrl, parser);
    } catch (err) {
      stopElapsedTimer(index);
      setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
      toast.error(err instanceof Error ? err.message : `Image ${index + 1} failed`);
      return null;
    }
  };

  const pollSingle = async (
    index: number,
    taskId: string,
    apiKey: string,
    pollUrl: string,
    parser: typeof parseMarketPoll
  ): Promise<string | null> => {
    let attempts = 0;
    while (attempts < 120) {
      if (abortRef.current) {
        stopElapsedTimer(index);
        setSlots((prev) => prev.map((s) => s.index === index ? { ...s, status: 'failed' } : s));
        return null;
      }
      const wait = attempts < 5 ? 2000 : attempts < 20 ? 3000 : 5000;
      await new Promise((r) => setTimeout(r, wait));
      try {
        const res = await fetch(`${pollUrl}?taskId=${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const data = await res.json();
        const result = parser(data);
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

  const handleProcess = async () => {
    if (!activeCustomModel) { toast.error('Select a model to edit'); return; }
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!sourceImage) { toast.error('Upload an image first'); return; }
    if (!uploadedSourceUrl) { toast.error('Source image is still uploading, please wait'); return; }
    if (!prompt.trim()) { toast.error('Enter editing instructions'); return; }

    abortRef.current = false;
    elapsedTimers.current.forEach((t) => clearInterval(t));
    elapsedTimers.current.clear();

    setSlots(Array.from({ length: count }, (_, i) => ({ index: i, status: 'generating', url: null, elapsed: 0 })));
    setIsAnyGenerating(true);

    try {
      const results = await Promise.all(
        Array.from({ length: count }, (_, i) => generateSingle(i, apiKey, uploadedSourceUrl))
      );
      const successUrls = results.filter((u): u is string => u !== null);
      if (successUrls.length > 0) {
        toast.success(`${successUrls.length} of ${count} image${count > 1 ? 's' : ''} edited`);
        await saveToGallery(successUrls);
      } else {
        toast.error('All edits failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Processing failed');
    }
    setIsAnyGenerating(false);
  };

  const saveToGallery = async (urls: string[]) => {
    if (!user) return;
    for (const url of urls) {
      try {
        const assetId = crypto.randomUUID();
        const uploaded = await uploadFromUrl(user.id, assetId, url);
        await supabase.from('media_assets').insert({
          id: assetId, user_id: user.id, type: 'edited', title: prompt.slice(0, 100),
          prompt, provider: 'kie_ai', status: 'completed',
          result_url: uploaded?.publicUrl || url, storage_path: uploaded?.path || null,
          file_size: uploaded?.size || 0,
          metadata: {
            model: selectedModelId, mode: 'image-editing', strength,
            resolution: capabilities?.hasResolution ? resolution : null,
            template: appliedTemplate?.name || null,
          },
        });
      } catch { /* non-critical */ }
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-edit-${Date.now()}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const completedCount = slots.filter((s) => s.status === 'done').length;
  const generatingCount = slots.filter((s) => s.status === 'generating').length;

  if (allModels.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Image Editing Models Added</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-6">
          Add your custom image editing models via the API Console to start editing images.
          Go to <span className="text-amber-400">Settings &rarr; API Console</span> and add a model with type "Image Editing".
        </p>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
          <PlusCircle className="w-4 h-4" />
          Add Model in Settings &rarr; API Console
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes iedShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes iedFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes iedBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes iedFloat { 0%, 100% { transform: translateY(0px); opacity: 0.8; } 50% { transform: translateY(-3px); opacity: 1; } }
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
            <label className="block text-xs text-gray-400 mb-1.5">AI Editing Model</label>
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400">
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
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b border-white/5 sticky top-0 text-amber-400 bg-amber-500/5">{cat}</div>
                      {allModels.filter((m) => m.category === cat).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModelId(m.id); setShowModelPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${m.id === selectedModelId ? 'text-amber-400 bg-amber-500/5' : 'text-gray-300'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{m.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400">CUSTOM</span>
                          </div>
                          {m.id === selectedModelId && <span className="text-[10px] font-bold text-amber-400">SELECTED</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {capabilities && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-amber-400 font-medium">Model Capabilities</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {capabilities.hasPrompt && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00]">Prompt</span>}
                  {capabilities.hasImageInput && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400">Image Input</span>}
                  {capabilities.hasAspectRatio && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">Aspect Ratio</span>}
                  {capabilities.hasStrength && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">Strength</span>}
                  {capabilities.hasResolution && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Resolution</span>}
                  {capabilities.hasCount && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400">Batch</span>}
                  {!capabilities.hasResolution && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-500">No Resolution Control</span>}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Source Image
              {isUploadingSource && (
                <span className="ml-2 text-[10px] text-amber-400 inline-flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                </span>
              )}
              {uploadedSourceUrl && !isUploadingSource && (
                <span className="ml-2 text-[10px] text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
              )}
            </label>
            {sourcePreview ? (
              <div className="relative inline-block">
                <div className="relative">
                  <img src={sourcePreview} alt="Source" className="max-w-xs max-h-64 rounded-xl border border-white/10" />
                  {isUploadingSource && (
                    <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                        <p className="text-xs text-amber-300 font-medium">Uploading to cloud...</p>
                      </div>
                    </div>
                  )}
                  {uploadedSourceUrl && !isUploadingSource && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-emerald-500/80 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Uploaded
                    </div>
                  )}
                </div>
                <button onClick={clearSource} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full max-w-xs h-48 rounded-xl border-2 border-dashed border-white/10 hover:border-amber-400/30 transition-colors group"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Upload Image to Edit</p>
                  <p className="text-[11px] text-gray-600 mt-1">JPG, PNG, WebP — auto-uploaded to cloud</p>
                </div>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {appliedTemplate?.reference_image_url && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <img src={appliedTemplate.reference_image_url} alt="Template ref" className="w-14 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400">Template Reference Image</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{appliedTemplate.name}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {EDIT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPrompt(preset.prompt)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${prompt === preset.prompt ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-amber-400 hover:border-amber-400/20'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Editing Instructions
              {appliedTemplate && <span className="ml-2 text-[10px] text-amber-400">from template: {appliedTemplate.name}</span>}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe what edits you want to make to the image..."
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {capabilities?.hasAspectRatio && (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${aspectRatio === ar.value ? 'bg-amber-500 text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {capabilities?.hasStrength && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Strength: {Math.round(strength * 100)}%</label>
                  <input
                    type="range" min="0.1" max="1" step="0.05" value={strength}
                    onChange={(e) => setStrength(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>Subtle</span><span>Strong</span>
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
                          ${active ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' : ''}
                          ${supported && !active ? 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/30 cursor-pointer' : ''}
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
                      onClick={() => setCount(n)}
                      disabled={isAnyGenerating}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40
                        ${count === n ? 'bg-amber-500 text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/30'}
                      `}
                    >
                      {n}
                      {count === n && isAnyGenerating && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={isAnyGenerating || !sourceImage || !uploadedSourceUrl || isUploadingSource || !prompt.trim() || !selectedModelId}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:from-amber-600 hover:to-orange-600 transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99]"
          >
            {isAnyGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Editing {completedCount}/{count} images...</span>
                {generatingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">{generatingCount} active</span>
                )}
              </>
            ) : isUploadingSource ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading source image...</span>
              </>
            ) : !uploadedSourceUrl && sourceImage ? (
              <>
                <Upload className="w-5 h-5" />
                <span>Waiting for upload...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Edit {count > 1 ? `${count} Images` : 'Image'} with {selectedModelDef?.label || 'Model'}
                {capabilities?.hasResolution && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">{resolution}</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
