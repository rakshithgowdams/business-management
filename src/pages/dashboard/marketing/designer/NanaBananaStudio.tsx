import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Upload, X, Check, Plus, Image as ImageIcon,
  ChevronDown, ChevronUp, Zap, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import {
  kiePost, extractTaskId, parseMarketPoll, pollKieTask,
} from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';

const MODEL = 'nano-banana-pro';

const ASPECT_RATIOS = [
  { key: '1:1',   label: '1:1',   desc: 'Square — Instagram, Profile' },
  { key: '4:3',   label: '4:3',   desc: 'Landscape — Classic' },
  { key: '3:4',   label: '3:4',   desc: 'Portrait — Mobile' },
  { key: '16:9',  label: '16:9',  desc: 'Widescreen — YouTube, Banner' },
  { key: '9:16',  label: '9:16',  desc: 'Vertical — Reels, TikTok, Story' },
  { key: '3:2',   label: '3:2',   desc: 'Photo — DSLR Standard' },
  { key: '2:3',   label: '2:3',   desc: 'Portrait — Pinterest, Print' },
  { key: '21:9',  label: '21:9',  desc: 'Ultrawide — Cinematic' },
];

const RESOLUTIONS = [
  { key: '1K',  label: '1K',  desc: '~1024px — Fast, preview' },
  { key: '2K',  label: '2K',  desc: '~2048px — High quality' },
  { key: '4K',  label: '4K',  desc: '~4096px — Ultra HD, print' },
];

const OUTPUT_FORMATS = [
  { key: 'png',  label: 'PNG',  desc: 'Lossless, transparency support' },
  { key: 'jpeg', label: 'JPEG', desc: 'Smaller file, no transparency' },
];

const DESIGN_STYLES = [
  'Photorealistic',
  'Cinematic',
  'Illustrated',
  'Minimalist',
  'Bold & Vibrant',
  'Dark Luxury',
  'Neon / Tech',
  'Retro / Vintage',
  'Nature & Organic',
  '3D Render',
  'Flat Design',
  'Comic / Manga',
];

interface RefImage {
  id: string;
  file: File | null;
  preview: string;
  url: string;
  uploading: boolean;
  failed: boolean;
}

function newRef(id: string): RefImage {
  return { id, file: null, preview: '', url: '', uploading: false, failed: false };
}

export default function NanaBananaStudio() {
  const { user } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1K');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  const [style, setStyle] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [refImages, setRefImages] = useState<RefImage[]>([newRef(crypto.randomUUID())]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const fileInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const uploadRef = async (id: string, file: File) => {
    if (!user) return;
    setRefImages((prev) =>
      prev.map((r) => r.id === id ? { ...r, file, preview: URL.createObjectURL(file), uploading: true, failed: false, url: '' } : r)
    );
    try {
      const result = await uploadMediaToStorage(
        user.id,
        `nb-ref-${crypto.randomUUID()}`,
        file,
        file.type,
      );
      const publicUrl = result?.publicUrl || '';
      if (!publicUrl) throw new Error('Upload failed');
      setRefImages((prev) =>
        prev.map((r) => r.id === id ? { ...r, url: publicUrl, uploading: false } : r)
      );
    } catch {
      setRefImages((prev) =>
        prev.map((r) => r.id === id ? { ...r, uploading: false, failed: true } : r)
      );
      toast.error('Reference image upload failed');
    }
  };

  const clearRef = (id: string) => {
    setRefImages((prev) => {
      const ref = prev.find((r) => r.id === id);
      if (ref?.preview) URL.revokeObjectURL(ref.preview);
      return prev.map((r) => r.id === id ? { ...newRef(id) } : r);
    });
  };

  const addRefSlot = () => {
    if (refImages.length >= 4) { toast.error('Maximum 4 reference images'); return; }
    setRefImages((prev) => [...prev, newRef(crypto.randomUUID())]);
  };

  const removeRefSlot = (id: string) => {
    if (refImages.length <= 1) return;
    clearRef(id);
    setRefImages((prev) => prev.filter((r) => r.id !== id));
  };

  const buildPrompt = () => {
    const parts = [prompt.trim()];
    if (style) parts.push(`Style: ${style}`);
    return parts.filter(Boolean).join('. ');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt'); return; }

    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }

    const uploadedRefs = refImages.filter((r) => r.url);
    const anyUploading = refImages.some((r) => r.uploading);
    if (anyUploading) { toast.error('Wait for all reference images to finish uploading'); return; }

    setGenerating(true);
    setResults([]);
    setProgress('Submitting to Nano Banana Pro...');

    try {
      const inputPayload: Record<string, unknown> = {
        prompt: buildPrompt(),
        aspect_ratio: aspectRatio,
        resolution,
        output_format: outputFormat,
        multi_shots: false,
      };

      if (negativePrompt.trim()) {
        inputPayload.negative_prompt = negativePrompt.trim();
      }

      if (uploadedRefs.length > 0) {
        inputPayload.image_input = uploadedRefs.map((r) => r.url);
      }

      const body: Record<string, unknown> = {
        model: MODEL,
        input: inputPayload,
      };

      const taskData = await kiePost('/api/v1/jobs/createTask', body, apiKey);
      const taskId = extractTaskId(taskData);

      if (!taskId) {
        const msg =
          (taskData as Record<string, unknown>)?.msg ||
          (taskData as Record<string, unknown>)?.message ||
          JSON.stringify(taskData).slice(0, 200);
        throw new Error(`No task ID returned: ${msg}`);
      }

      setProgress('Generating with Nano Banana Pro...');
      const urls = await pollKieTask(
        '/api/v1/jobs/recordInfo',
        taskId,
        apiKey,
        parseMarketPoll,
        (msg) => setProgress(msg),
      );

      setResults(urls);

      if (user) {
        for (const url of urls) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, url);
            await supabase.from('media_assets').insert({
              id: assetId,
              user_id: user.id,
              type: 'image',
              title: `Nano Banana Pro — ${prompt.slice(0, 60)}`,
              prompt: buildPrompt(),
              provider: 'kie_ai',
              status: 'completed',
              result_url: uploaded?.publicUrl || url,
              storage_path: uploaded?.path || null,
              file_size: uploaded?.size || 0,
              metadata: {
                source: 'nano_banana_studio',
                model: MODEL,
                aspect_ratio: aspectRatio,
                resolution,
                output_format: outputFormat,
                style,
                ref_count: uploadedRefs.length,
              },
            });
          } catch { /* non-critical */ }
        }
      }

      toast.success(`Generated ${urls.length} image${urls.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const readyRefs = refImages.filter((r) => r.url).length;
  const anyUploading = refImages.some((r) => r.uploading);

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 border border-[#F1C40F]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F1C40F]/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-[#F1C40F]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Nano Banana Pro</p>
            <p className="text-[11px] text-gray-400">Gemini 3 Pro · Multi-reference · Ultra-HD</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
          <Lock className="w-3 h-3 text-[#F1C40F]" />
          <span className="text-[10px] font-semibold text-[#F1C40F]">Locked Model</span>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-5">

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe your image in detail — subject, scene, mood, lighting, colors..."
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.key}
                onClick={() => setAspectRatio(r.key)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                  aspectRatio === r.key
                    ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                    : 'border-white/10 bg-dark-800/60 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <p className="text-sm font-bold">{r.label}</p>
                <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{r.desc.split('—')[0].trim()}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Resolution</label>
            <div className="flex flex-col gap-1.5">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.key}
                  onClick={() => setResolution(res.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    resolution === res.key
                      ? 'border-[#F1C40F] bg-[#F1C40F]/10'
                      : 'border-white/10 bg-dark-800/60 hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${resolution === res.key ? 'bg-[#F1C40F]' : 'bg-gray-600'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${resolution === res.key ? 'text-white' : 'text-gray-300'}`}>{res.label}</p>
                    <p className="text-[10px] text-gray-500">{res.desc}</p>
                  </div>
                  {resolution === res.key && <Check className="w-3.5 h-3.5 text-[#F1C40F] ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Output Format</label>
            <div className="flex flex-col gap-1.5">
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt.key}
                  onClick={() => setOutputFormat(fmt.key as 'png' | 'jpeg')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    outputFormat === fmt.key
                      ? 'border-[#F1C40F] bg-[#F1C40F]/10'
                      : 'border-white/10 bg-dark-800/60 hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${outputFormat === fmt.key ? 'bg-[#F1C40F]' : 'bg-gray-600'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${outputFormat === fmt.key ? 'text-white' : 'text-gray-300'}`}>{fmt.label}</p>
                    <p className="text-[10px] text-gray-500">{fmt.desc}</p>
                  </div>
                  {outputFormat === fmt.key && <Check className="w-3.5 h-3.5 text-[#F1C40F] ml-auto" />}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400 mt-4 mb-2 font-medium uppercase tracking-wider">Design Style</label>
            <div className="flex flex-wrap gap-1.5">
              {DESIGN_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(style === s ? '' : s)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    style === s
                      ? 'bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/30'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">
              Reference Images
              <span className="ml-2 text-[10px] text-gray-600 normal-case font-normal">
                {readyRefs > 0 ? `${readyRefs} ready` : 'optional'} · max 4
              </span>
            </label>
            <button
              onClick={addRefSlot}
              disabled={refImages.length >= 4}
              className="flex items-center gap-1 text-[11px] text-[#F1C40F] hover:text-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Image
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {refImages.map((ref, idx) => (
              <div key={ref.id} className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => fileInputRefs.current.set(ref.id, el)}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadRef(ref.id, f);
                    e.target.value = '';
                  }}
                />

                {ref.preview ? (
                  <div className="relative rounded-xl border border-white/10 overflow-hidden group">
                    <img src={ref.preview} alt={`Ref ${idx + 1}`} className="w-full h-32 object-cover" />
                    {ref.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {ref.url && !ref.uploading && (
                      <div className="absolute top-2 left-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" /> Ready
                        </span>
                      </div>
                    )}
                    {ref.failed && !ref.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <p className="text-red-400 text-[10px] font-medium">Upload failed</p>
                        <button
                          onClick={() => ref.file && uploadRef(ref.id, ref.file)}
                          className="text-[10px] text-white bg-red-500/80 px-3 py-1 rounded-lg"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {refImages.length > 1 && (
                        <button
                          onClick={() => removeRefSlot(ref.id)}
                          className="w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-black/50 text-[9px] text-gray-300 text-center">
                      Ref {idx + 1}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current.get(ref.id)?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/40 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <Upload className="w-5 h-5 text-gray-500 group-hover:text-[#F1C40F] transition-colors" />
                    <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                      Ref {idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-600">JPG · PNG · WebP</span>
                    {refImages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeRefSlot(ref.id); }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-dark-700 border border-white/10 text-gray-500 flex items-center justify-center hover:text-red-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {readyRefs > 0 && (
            <p className="text-[10px] text-gray-500 mt-2">
              {readyRefs} reference image{readyRefs > 1 ? 's' : ''} will be sent as <code className="text-[#F1C40F]/80 font-mono">image_input</code> to Nano Banana Pro
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  placeholder="What to avoid — blurry, low quality, watermark, text, deformed..."
                  className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 rounded-xl bg-dark-800/60 border border-white/5 font-mono text-[10px] text-gray-500 leading-relaxed break-all">
          <span className="text-gray-600">POST</span>{' '}
          <span className="text-[#F1C40F]/60">/api/v1/jobs/createTask</span>
          {' · '}
          <span className="text-white/60">model: {MODEL}</span>
          {' · '}
          <span className="text-cyan-400/60">ratio: {aspectRatio}</span>
          {' · '}
          <span className="text-emerald-400/60">res: {resolution}</span>
          {' · '}
          <span className="text-orange-400/60">fmt: {outputFormat}</span>
          {readyRefs > 0 && (
            <span className="text-purple-400/60"> · refs: {readyRefs}</span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim() || anyUploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20 active:scale-[0.99]"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="truncate max-w-xs text-sm">{progress || 'Generating...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate with Nano Banana Pro
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F1C40F]" />
              <h4 className="text-sm font-semibold text-white">Result{results.length > 1 ? 's' : ''}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/20">
                Nano Banana Pro
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>{aspectRatio}</span>
              <span>·</span>
              <span>{resolution}</span>
              <span>·</span>
              <span className="uppercase">{outputFormat}</span>
            </div>
          </div>

          <div className={`grid gap-4 ${results.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {results.map((url, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-white/5">
                <img
                  src={url}
                  alt={`Result ${i + 1}`}
                  className={`w-full object-cover ${
                    aspectRatio === '9:16' || aspectRatio === '2:3' || aspectRatio === '3:4'
                      ? 'aspect-[9/16]'
                      : aspectRatio === '1:1'
                        ? 'aspect-square'
                        : aspectRatio === '21:9'
                          ? 'aspect-[21/9]'
                          : 'aspect-video'
                  }`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={url}
                    download={`nano-banana-pro-${Date.now()}.${outputFormat}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download {outputFormat.toUpperCase()}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-white/5">
            <ImageIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <p className="text-[11px] text-gray-500">Saved to Media Gallery automatically</p>
          </div>
        </div>
      )}
    </div>
  );
}
