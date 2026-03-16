import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Upload, X, Play, Image as ImageIcon,
  Video, Youtube, Smartphone, RefreshCw, Check, Instagram,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import { getApiKey } from '../../../../lib/apiKeys';
import {
  kiePost, kieGet, extractTaskId, parseMarketPoll,
  pollKieTask, parseMarketTaskId,
} from '../../../../lib/marketing/kieApi';

type BannerFormat = 'yt_banner' | 'yt_shorts' | 'ig_reel';
type GenMode = 'text_to_image' | 'image_to_image' | 'cinematic_video';

interface FormatDef {
  key: BannerFormat;
  label: string;
  sublabel: string;
  ratio: string;
  icon: React.ElementType;
  dims: string;
  color: string;
}

const FORMATS: FormatDef[] = [
  {
    key: 'yt_banner',
    label: 'YouTube Banner',
    sublabel: 'Channel Art — Landscape',
    ratio: '16:9',
    icon: Youtube,
    dims: '2560 × 1440',
    color: '#FF0000',
  },
  {
    key: 'yt_shorts',
    label: 'YouTube Shorts',
    sublabel: 'Vertical Thumbnail',
    ratio: '9:16',
    icon: Youtube,
    dims: '1080 × 1920',
    color: '#FF0000',
  },
  {
    key: 'ig_reel',
    label: 'Instagram Reel',
    sublabel: 'Vertical — Reels / Story',
    ratio: '9:16',
    icon: Instagram,
    dims: '1080 × 1920',
    color: '#E1306C',
  },
];

const T2I_MODELS = [
  { id: 'google/nano-banana', label: 'Nano Banana', sublabel: 'Gemini 2.5 Flash — fast & creative' },
  { id: 'google/nano-banana-pro', label: 'Nano Banana Pro', sublabel: 'Gemini 3 Pro — high quality' },
  { id: 'google/nano-banana-2', label: 'Nano Banana 2', sublabel: 'Gemini 3.1 Flash — latest' },
];

const I2I_MODELS = [
  { id: 'google/nano-banana-edit', label: 'Nano Banana Edit', sublabel: 'Reference-guided image editing' },
  { id: 'google/nano-banana-pro', label: 'Nano Banana Pro', sublabel: 'High-quality reference styling' },
];

const BANNER_STYLES = [
  { key: 'cinematic', label: 'Cinematic' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'bold_vibrant', label: 'Bold & Vibrant' },
  { key: 'dark_luxury', label: 'Dark Luxury' },
  { key: 'neon_tech', label: 'Neon / Tech' },
  { key: 'nature_organic', label: 'Nature & Organic' },
  { key: 'retro_vintage', label: 'Retro / Vintage' },
  { key: 'clean_corporate', label: 'Clean Corporate' },
];

export default function BannerGenerator() {
  const { user } = useAuth();

  const [format, setFormat] = useState<BannerFormat>('yt_banner');
  const [genMode, setGenMode] = useState<GenMode>('text_to_image');
  const [prompt, setPrompt] = useState('');
  const [channelName, setChannelName] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [t2iModel, setT2iModel] = useState('google/nano-banana-pro');
  const [i2iModel, setI2iModel] = useState('google/nano-banana-edit');

  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState('');
  const [refUrl, setRefUrl] = useState('');
  const [uploadingRef, setUploadingRef] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const [klingMode, setKlingMode] = useState<'std' | 'pro'>('std');
  const [klingDuration, setKlingDuration] = useState('5');
  const [sound, setSound] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [resultVideo, setResultVideo] = useState('');

  const selectedFormat = FORMATS.find((f) => f.key === format)!;

  const handleRefUpload = async (file: File) => {
    if (!user) return;
    setRefFile(file);
    setRefPreview(URL.createObjectURL(file));
    setRefUrl('');
    setUploadingRef(true);
    try {
      const result = await uploadMediaToStorage(
        user.id,
        `banner-ref-${crypto.randomUUID()}`,
        file,
        file.type
      );
      setRefUrl(result?.publicUrl || '');
      if (!result?.publicUrl) toast.error('Reference upload failed — try again');
    } catch {
      toast.error('Reference image upload failed');
    } finally {
      setUploadingRef(false);
    }
  };

  const clearRef = () => {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(null);
    setRefPreview('');
    setRefUrl('');
  };

  const buildPrompt = () => {
    const fmtLabel = selectedFormat.label;
    const platform = format === 'ig_reel' ? 'Instagram Reel' : 'YouTube';
    const styleDef = BANNER_STYLES.find((s) => s.key === style)?.label || style;
    return [
      `Professional ${fmtLabel} banner for ${platform}`,
      channelName.trim() && `Channel / Brand: "${channelName}"`,
      prompt.trim() || null,
      `Style: ${styleDef}`,
      `Aspect ratio ${selectedFormat.ratio}, ultra-high resolution, visually stunning, professional channel art`,
    ].filter(Boolean).join('. ');
  };

  const saveImageAsset = async (url: string, meta: Record<string, unknown>) => {
    if (!user) return;
    try {
      const id = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, id, url);
      await supabase.from('media_assets').insert({
        id, user_id: user.id, type: 'image',
        title: `${selectedFormat.label}${channelName ? ` — ${channelName}` : ''}`,
        prompt: buildPrompt(), provider: 'kie_ai', status: 'completed',
        result_url: uploaded?.publicUrl || url,
        storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: { source: 'banner_generator', format, genMode, ...meta },
      });
    } catch { /* non-critical */ }
  };

  const saveVideoAsset = async (url: string) => {
    if (!user) return;
    try {
      const id = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, id, url);
      await supabase.from('media_assets').insert({
        id, user_id: user.id, type: 'video',
        title: `${selectedFormat.label} Cinematic${channelName ? ` — ${channelName}` : ''}`,
        prompt: buildPrompt(), provider: 'kie_ai', status: 'completed',
        result_url: uploaded?.publicUrl || url,
        storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: { source: 'banner_generator', format, genMode: 'cinematic_video', model: 'kling-3.0', klingMode, klingDuration },
      });
    } catch { /* non-critical */ }
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!prompt.trim() && !channelName.trim()) { toast.error('Enter a banner description or channel name'); return; }

    if (genMode === 'image_to_image') {
      if (!refFile) { toast.error('Upload a reference image for Image-to-Image mode'); return; }
      if (uploadingRef) { toast.error('Reference image is still uploading, please wait'); return; }
      if (!refUrl) { toast.error('Reference image upload failed — re-upload and try again'); return; }
    }

    if (genMode === 'cinematic_video') {
      if (!refFile) { toast.error('Upload a source image for Cinematic Video mode'); return; }
      if (uploadingRef || !refUrl) { toast.error('Source image is still uploading, please wait'); return; }
    }

    setGenerating(true);
    setResultImages([]);
    setResultVideo('');
    setProgress('Submitting...');

    try {
      if (genMode === 'text_to_image') {
        const body = {
          model: t2iModel,
          input: {
            prompt: buildPrompt(),
            aspect_ratio: selectedFormat.ratio,
            resolution: '1K',
          },
        };
        const taskData = await kiePost('/api/v1/jobs/createTask', body, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) {
          const msg = (taskData as Record<string, unknown>)?.msg || (taskData as Record<string, unknown>)?.message || JSON.stringify(taskData).slice(0, 120);
          throw new Error(`Task ID not returned: ${msg}`);
        }
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll, setProgress);
        setResultImages(urls);
        for (const url of urls) await saveImageAsset(url, { t2iModel });
        toast.success('Banner generated!');

      } else if (genMode === 'image_to_image') {
        const body = {
          model: i2iModel,
          input: {
            prompt: buildPrompt(),
            image_url: refUrl,
            aspect_ratio: selectedFormat.ratio,
            resolution: '1K',
          },
        };
        const taskData = await kiePost('/api/v1/jobs/createTask', body, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) {
          const msg = (taskData as Record<string, unknown>)?.msg || (taskData as Record<string, unknown>)?.message || JSON.stringify(taskData).slice(0, 120);
          throw new Error(`Task ID not returned: ${msg}`);
        }
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll, setProgress);
        setResultImages(urls);
        for (const url of urls) await saveImageAsset(url, { i2iModel });
        toast.success('Banner generated from reference!');

      } else {
        const videoPrompt = [
          buildPrompt(),
          'Cinematic camera motion, smooth dolly, dynamic visual, professional intro animation, high production quality',
        ].join('. ');
        const body = {
          model: 'kling-3.0/video',
          input: {
            prompt: videoPrompt,
            image_urls: [refUrl],
            duration: klingDuration,
            aspect_ratio: selectedFormat.ratio,
            mode: klingMode,
            sound,
          },
        };
        const taskData = await kiePost('/api/v1/jobs/createTask', body, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) {
          const msg = (taskData as Record<string, unknown>)?.msg || (taskData as Record<string, unknown>)?.message || JSON.stringify(taskData).slice(0, 120);
          throw new Error(`Task ID not returned from Kling 3.0: ${msg}`);
        }
        setProgress('Generating cinematic video...');
        let attempts = 0;
        let videoUrl = '';
        while (attempts < 180) {
          const waitMs = attempts < 5 ? 3000 : attempts < 20 ? 5000 : 8000;
          await new Promise((r) => setTimeout(r, waitMs));
          try {
            const data = await kieGet(`/api/v1/jobs/recordInfo?taskId=${taskId}`, apiKey);
            const result = parseMarketPoll(data);
            if (result.done) {
              if (result.failed || result.urls.length === 0) throw new Error('Cinematic video generation failed');
              videoUrl = result.urls[0];
              break;
            }
            setProgress(`Generating video... (${attempts + 1} polls)`);
          } catch (e) {
            if (e instanceof Error && e.message !== 'Cinematic video generation failed') { /* retry */ }
            else throw e;
          }
          attempts++;
        }
        if (!videoUrl) throw new Error('Generation timed out');
        setResultVideo(videoUrl);
        await saveVideoAsset(videoUrl);
        toast.success('Cinematic banner video generated!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const isDisabled =
    generating ||
    (!prompt.trim() && !channelName.trim()) ||
    (genMode === 'image_to_image' && (!refFile || uploadingRef || !refUrl)) ||
    (genMode === 'cinematic_video' && (!refFile || uploadingRef || !refUrl));

  const isPortrait = selectedFormat.ratio === '9:16';

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 space-y-5">

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Platform & Format</label>
          <div className="grid grid-cols-3 gap-3">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={`flex flex-col gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  format === f.key
                    ? 'border-[#0891B2] bg-[#0891B2]/5'
                    : 'border-white/10 bg-dark-800/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: format === f.key ? `${f.color}20` : 'rgb(31 41 55)' }}
                  >
                    <f.icon
                      className="w-4 h-4"
                      style={{ color: format === f.key ? f.color : '#6B7280' }}
                    />
                  </div>
                  {format === f.key && <Check className="w-3.5 h-3.5 text-[#0891B2]" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${format === f.key ? 'text-white' : 'text-gray-300'}`}>{f.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{f.dims}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-dark-700 text-gray-400 border border-white/5">{f.ratio}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Generation Mode</label>
          <div className="flex gap-1.5">
            {([
              { key: 'text_to_image', label: 'Text to Image', icon: ImageIcon },
              { key: 'image_to_image', label: 'Image to Image', icon: RefreshCw },
              { key: 'cinematic_video', label: 'Cinematic Video', icon: Video },
            ] as { key: GenMode; label: string; icon: React.ElementType }[]).map((m) => (
              <button
                key={m.key}
                onClick={() => setGenMode(m.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-1 justify-center transition-all ${
                  genMode === m.key
                    ? 'bg-[#0891B2] text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <m.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2 text-[11px] text-gray-500">
            {['Text to Image', 'Image to Image', 'Cinematic Video'].map((l, i) => (
              <span key={i} className="flex-1 text-center">{l}</span>
            ))}
          </div>
          {genMode === 'cinematic_video' && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-[#FF6B00]/5 border border-[#FF6B00]/15">
              <p className="text-[11px] text-[#FF6B00]">Kling 3.0 — Upload a source image, then generate cinematic motion video for your banner</p>
            </div>
          )}
        </div>

        {(genMode === 'image_to_image' || genMode === 'cinematic_video') && (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              {genMode === 'cinematic_video' ? 'Source Image' : 'Reference Image'}
              {genMode === 'image_to_image' && <span className="ml-1 text-gray-600 font-normal">(required)</span>}
              {uploadingRef && (
                <span className="ml-2 text-[10px] text-[#0891B2] inline-flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                </span>
              )}
              {refUrl && !uploadingRef && (
                <span className="ml-2 text-[10px] text-emerald-400 inline-flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Ready
                </span>
              )}
              {refFile && !refUrl && !uploadingRef && (
                <span className="ml-2 text-[10px] text-red-400 inline-flex items-center gap-1">Upload failed — retry</span>
              )}
            </label>
            {refPreview ? (
              <div className="relative inline-block">
                <img src={refPreview} alt="Reference" className="max-w-[200px] max-h-48 rounded-xl border border-white/10 object-cover" />
                <button
                  onClick={clearRef}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                {!refUrl && !uploadingRef && (
                  <button
                    onClick={() => refFile && handleRefUpload(refFile)}
                    className="absolute bottom-2 left-2 right-2 py-1 rounded-lg bg-red-500/80 text-white text-[10px] font-medium text-center"
                  >
                    Retry Upload
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => refInputRef.current?.click()}
                className="flex items-center justify-center w-full max-w-xs h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-[#0891B2]/40 transition-colors group bg-dark-800/40"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#0891B2] mx-auto mb-1.5 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Upload Image</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">JPG, PNG, WebP</p>
                </div>
              </button>
            )}
            <input
              ref={refInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRefUpload(f); e.target.value = ''; }}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Channel / Brand Name</label>
          <input
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="e.g. TechWithRaj, StyleByNaina..."
            className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#0891B2]"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            {genMode === 'cinematic_video' ? 'Scene / Motion Description' : 'Banner Description'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              genMode === 'cinematic_video'
                ? 'Describe the scene motion — slow dolly, dramatic reveal, light particles, lens flare...'
                : 'Describe your banner — colors, mood, theme, background scene, atmosphere...'
            }
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#0891B2] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Visual Style</label>
          <div className="flex flex-wrap gap-1.5">
            {BANNER_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  style === s.key ? 'bg-[#0891B2] text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {genMode === 'text_to_image' && (
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">AI Model (Nano Banana)</label>
            <div className="space-y-1.5">
              {T2I_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setT2iModel(m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    t2iModel === m.id ? 'border-[#0891B2] bg-[#0891B2]/5' : 'border-white/10 bg-dark-800/40 hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t2iModel === m.id ? 'bg-[#0891B2]' : 'bg-gray-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${t2iModel === m.id ? 'text-white' : 'text-gray-300'}`}>{m.label}</p>
                    <p className="text-[11px] text-gray-500">{m.sublabel}</p>
                  </div>
                  {t2iModel === m.id && <Check className="w-3.5 h-3.5 text-[#0891B2] ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {genMode === 'image_to_image' && (
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">AI Model (Nano Banana)</label>
            <div className="space-y-1.5">
              {I2I_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setI2iModel(m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    i2iModel === m.id ? 'border-[#0891B2] bg-[#0891B2]/5' : 'border-white/10 bg-dark-800/40 hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i2iModel === m.id ? 'bg-[#0891B2]' : 'bg-gray-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${i2iModel === m.id ? 'text-white' : 'text-gray-300'}`}>{m.label}</p>
                    <p className="text-[11px] text-gray-500">{m.sublabel}</p>
                  </div>
                  {i2iModel === m.id && <Check className="w-3.5 h-3.5 text-[#0891B2] ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {genMode === 'cinematic_video' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Duration</label>
              <div className="flex gap-1.5">
                {['5', '10'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setKlingDuration(d)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      klingDuration === d ? 'bg-[#FF6B00] text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Quality</label>
              <div className="flex gap-1.5">
                {[{ v: 'std', l: 'Standard' }, { v: 'pro', l: 'Pro' }].map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setKlingMode(m.v as 'std' | 'pro')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      klingMode === m.v ? 'bg-[#FF6B00] text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <button
                  type="button"
                  onClick={() => setSound(!sound)}
                  className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${sound ? 'bg-[#FF6B00]' : 'bg-dark-700 border border-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${sound ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="text-xs text-gray-400">Add Sound Effects</span>
              </label>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0891B2] to-[#06B6D4] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.99]"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {progress || 'Generating...'}</>
          ) : genMode === 'cinematic_video' ? (
            <><Play className="w-5 h-5" /> Generate Cinematic Video (Kling 3.0)</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Banner</>
          )}
        </button>
      </div>

      {resultImages.length > 0 && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <selectedFormat.icon className="w-4 h-4" style={{ color: selectedFormat.color }} />
              <h4 className="text-sm font-semibold text-white">{selectedFormat.label} — Result</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Generated</span>
          </div>
          <div className="space-y-4">
            {resultImages.map((url, i) => (
              <div key={i} className={`group relative rounded-xl overflow-hidden border border-white/5 ${isPortrait ? 'max-w-sm mx-auto' : ''}`}>
                <img
                  src={url}
                  alt={`Banner ${i + 1}`}
                  className={`w-full object-cover ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={url}
                    download={`${format}-${Date.now()}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
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

      {resultVideo && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#FF6B00]" />
              <h4 className="text-sm font-semibold text-white">Cinematic {selectedFormat.label}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">Kling 3.0</span>
            </div>
            <button onClick={() => setResultVideo('')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
          </div>
          <video
            src={resultVideo}
            controls
            className={`rounded-xl border border-white/5 bg-black ${isPortrait ? 'max-w-sm mx-auto block max-h-[500px]' : 'w-full max-h-[420px]'}`}
          />
          <a
            href={resultVideo}
            download={`${format}-cinematic-${Date.now()}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] text-white text-sm font-medium w-full justify-center hover:shadow-lg hover:shadow-orange-500/20 transition-all"
          >
            <Download className="w-4 h-4" /> Download Video
          </a>
        </div>
      )}
    </div>
  );
}
