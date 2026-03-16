import { useState, useRef, useEffect } from 'react';
import {
  Loader2, Download, Upload, X, Check, Video,
  User, Zap, Lock, Play, RefreshCw, Volume2, VolumeX,
  Settings2, ChevronDown, ChevronUp, Sparkles, FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadMediaToStorage, uploadFromUrl } from '../../../../lib/mediaDB';
import { kiePost, extractTaskId, parseMarketPoll, pollKieTask, generateVideo } from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';
import { callGeminiFlash } from '../../../../lib/ai/gemini';

const IMAGE_MODEL = 'nano-banana-pro';
const VIDEO_MODEL = 'kling-3.0/video';

const UGC_STYLES = [
  { key: 'selfie_review', label: 'Selfie Review', desc: 'Person holding product, direct eye contact', icon: '📱' },
  { key: 'unboxing', label: 'Unboxing', desc: 'Unwrapping product, authentic reveal moment', icon: '📦' },
  { key: 'before_after', label: 'Before & After', desc: 'Side-by-side transformation result', icon: '✨' },
  { key: 'routine', label: 'Daily Routine', desc: 'Product used naturally in daily life', icon: '🌅' },
  { key: 'testimonial', label: 'Testimonial', desc: 'Person speaking directly to camera', icon: '💬' },
  { key: 'tutorial', label: 'How-To Demo', desc: 'Step-by-step product usage', icon: '🎯' },
  { key: 'reaction', label: 'Reaction', desc: 'Genuine surprise or delight moment', icon: '😮' },
  { key: 'lifestyle', label: 'Lifestyle', desc: 'Product naturally integrated into scene', icon: '🌿' },
];

const ASPECT_RATIOS = [
  { key: '9:16', label: 'Portrait', desc: '9:16' },
  { key: '1:1', label: 'Square', desc: '1:1' },
  { key: '4:5', label: 'Feed', desc: '4:5' },
  { key: '16:9', label: 'Landscape', desc: '16:9' },
];

const DEMOGRAPHICS = [
  { key: 'gen_z', label: 'Gen Z', desc: '18-25, casual' },
  { key: 'millennial', label: 'Millennial', desc: '26-40, relatable' },
  { key: 'parent', label: 'Parent', desc: '28-45, warm' },
  { key: 'professional', label: 'Professional', desc: '30-55, polished' },
  { key: 'fitness', label: 'Fitness', desc: 'Active, athletic' },
  { key: 'beauty', label: 'Beauty', desc: 'Skincare-focused' },
];

const VIDEO_DURATIONS = [5, 8, 10];

interface UGCImage {
  id: string;
  imageUrl: string;
  prompt: string;
  generating: boolean;
}

interface VideoConfig {
  imageUrl: string;
  aspectRatio: string;
  mode: 'std' | 'pro';
  duration: number;
  prompt: string;
  negativePrompt: string;
  cfgScale: number;
  audioEnabled: boolean;
  multiShots: boolean;
  videoUrl: string;
  generating: boolean;
  showAdvanced: boolean;
}

async function buildUGCImagePrompt(
  brief: string, style: string, styleDesc: string, ratio: string,
  demographic: string, demographicDesc: string, hasProductRef: boolean, hasPersonRef: boolean,
): Promise<string> {
  const sys = `You are a UGC (User-Generated Content) photography director. Write a prompt for a clean, photorealistic UGC-style photograph.

CRITICAL — ABSOLUTE FORBIDDEN ELEMENTS (NEVER include these):
- NO social media UI (no likes, comments, hearts, play bars, progress bars, share buttons, follower counts, captions, hashtags)
- NO app overlays of any kind (no TikTok UI, Instagram UI, Reels UI, YouTube UI, recording indicators, phone screen with app)
- NO watermarks, text overlays, brand logos (except actual product label)
- ONLY a raw, clean real-world photograph

BRIEF: ${brief}
STYLE: ${style} — ${styleDesc}
RATIO: ${ratio}
CREATOR: ${demographic} (${demographicDesc})
${hasProductRef ? 'PRODUCT REF: Match exact product from reference image.' : ''}
${hasPersonRef ? 'PERSON REF: Use this person as the creator.' : ''}

PHOTO REQUIREMENTS:
- Real consumer photo aesthetic — NOT a model shoot, NOT professional advertising
- Natural window or ambient indoor light — no ring lights, no studio strobes
- Real home/lifestyle background (bathroom counter, kitchen, bedroom, outdoors) with natural depth
- Authentic skin texture, slight grain, natural color grading, phone-camera DOF quality
- ${demographic === 'gen_z' ? 'Young adult, casual clothing, no heavy makeup, spontaneous expression' : demographic === 'millennial' ? 'Adult, casual smart clothing, genuine warm smile' : demographic === 'parent' ? 'Parent, comfortable clothing, warm environment' : demographic === 'fitness' ? 'Athletic, activewear, energetic expression, gym/outdoor context' : demographic === 'beauty' ? 'Natural makeup, glowing skin, vanity/bathroom setting' : 'Professional adult, smart casual, confident natural expression'}
- Zero polished ad aesthetic — looks like a real person sharing a product they genuinely love

COMPOSITION — ${style.toUpperCase()}:
${style === 'selfie_review' ? 'Person holds product beside their face at arm-length, direct eye contact, genuine smile or mid-expression, product label readable' :
  style === 'unboxing' ? 'Hands unwrapping product from packaging on flat surface, box open, product being revealed, excited expression in background' :
  style === 'before_after' ? 'Split frame: left=before (problem), right=after (result with product). Same person, authentic transformation lighting' :
  style === 'routine' ? 'Person using product in real morning/evening routine, action shot applying/using product, no posing' :
  style === 'testimonial' ? 'Direct eye contact with camera, mid-speech expression, hands possibly gesturing, product visible in scene' :
  style === 'tutorial' ? 'Hands demonstrating product use step-in-progress, product prominently visible, clear instructional composition' :
  style === 'reaction' ? 'Genuine surprise or delight moment, eyebrows raised, authentic smile/amazement, product visible' :
  'Natural everyday scene, product present and being used, candid not posed, harmonious lifestyle context'}

Write ONE continuous raw prompt. No headers. No bullets. No markdown. Max 220 words.`;

  try {
    const r = await callGeminiFlash(sys, 'ugc_image_prompt');
    return r.trim() || `Clean authentic UGC photograph, ${style} style, real person in natural home environment with product (${brief}), no social media UI, phone camera quality, genuine consumer aesthetic.`;
  } catch {
    return `Clean authentic UGC photograph, ${style} style, real person in natural home environment with product (${brief}), no social media UI, phone camera quality, genuine consumer aesthetic.`;
  }
}

async function buildUGCVideoPrompt(imagePrompt: string, ugcStyle: string, brief: string): Promise<string> {
  const sys = `You are a Kling 3.0 image-to-video motion director specializing in authentic UGC content.

PHOTO CONTEXT: ${imagePrompt.slice(0, 200)}
UGC STYLE: ${ugcStyle}
PRODUCT: ${brief}

Write a Kling 3.0 motion prompt that brings this static UGC photo to life as a natural 5-10 second clip.

Required motion elements:
- Subtle natural hand-held camera drift (micro-movement, not tripod-locked)
- Person's authentic micro-movements: breathing rise and fall, natural blink, slight head adjustment
- ${ugcStyle === 'selfie_review' || ugcStyle === 'testimonial' ? 'Person begins speaking — natural mouth movement, small affirmative nod, expressive hand gesture' :
    ugcStyle === 'unboxing' ? 'Hands continue unwrapping motion, product lifts out smoothly, genuine discovery expression evolves' :
    ugcStyle === 'reaction' ? 'Expression deepens — smile widens, natural body language shifts forward, authentic emotional escalation' :
    ugcStyle === 'tutorial' ? 'Hands continue demonstrating application or usage, smooth purposeful motion' :
    'Ambient environment comes alive — subtle light variation, person makes natural micro-adjustment, scene breathes'}
- Background softly alive (gentle bokeh shift, light shimmer, ambient depth)
- ZERO UI overlays, ZERO app interface, ZERO social media elements — completely raw video

Output ONLY the motion prompt. Max 80 words. Plain text, no formatting.`;

  try {
    const r = await callGeminiFlash(sys, 'ugc_video_prompt');
    return r.trim() || `Subtle hand-held camera micro-drift, natural breathing motion, person's authentic micro-expressions come alive, gentle ambient background depth. Clean raw footage, no overlays.`;
  } catch {
    return `Subtle hand-held camera micro-drift, natural breathing motion, person's authentic micro-expressions come alive, gentle ambient background depth. Clean raw footage, no overlays.`;
  }
}

const DEFAULT_NEGATIVE_PROMPT =
  'social media ui, instagram ui, tiktok ui, reels ui, facebook ui, likes, heart icon, comment icon, share button, progress bar, play overlay, recording indicator, caption overlay, app interface, watermark, text overlay, brand logo, blur, distortion, low quality, artifacts, overexposed, underexposed';

const DEFAULT_VIDEO_NEGATIVE =
  'social media ui, app overlay, likes, comments, hearts, progress bar, recording indicator, watermark, text overlay, blur, distortion, artifacts, jitter, unstable, flicker, overexposed';

interface UGCCreatorProps {
  initialImageUrl?: string;
  initialImageTitle?: string;
}

export default function UGCCreator({ initialImageUrl, initialImageTitle }: UGCCreatorProps = {}) {
  const { user } = useAuth();
  const productFileRef = useRef<HTMLInputElement | null>(null);
  const personFileRef = useRef<HTMLInputElement | null>(null);

  const [brief, setBrief] = useState('');
  const [ugcStyle, setUgcStyle] = useState('selfie_review');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [demographic, setDemographic] = useState('millennial');
  const [resolution, setResolution] = useState('2K');

  const [productRef, setProductRef] = useState({ preview: '', url: '', uploading: false });
  const [personRef, setPersonRef] = useState({ preview: '', url: '', uploading: false });

  const [ugcImage, setUgcImage] = useState<UGCImage | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [fromGallery, setFromGallery] = useState(false);

  const [video, setVideo] = useState<VideoConfig>({
    imageUrl: '',
    aspectRatio: '9:16',
    mode: 'std',
    duration: 5,
    prompt: '',
    negativePrompt: DEFAULT_VIDEO_NEGATIVE,
    cfgScale: 0.5,
    audioEnabled: false,
    multiShots: false,
    videoUrl: '',
    generating: false,
    showAdvanced: false,
  });

  useEffect(() => {
    if (initialImageUrl) {
      setUgcImage({ id: crypto.randomUUID(), imageUrl: initialImageUrl, prompt: initialImageTitle || 'Gallery image', generating: false });
      setVideo((v) => ({ ...v, imageUrl: initialImageUrl, videoUrl: '' }));
      setFromGallery(true);
    }
  }, [initialImageUrl, initialImageTitle]);

  const uploadRef = async (type: 'product' | 'person', file: File) => {
    if (!user) return;
    const setter = type === 'product' ? setProductRef : setPersonRef;
    setter((p) => ({ ...p, preview: URL.createObjectURL(file), uploading: true, url: '' }));
    try {
      const r = await uploadMediaToStorage(user.id, `ugc-ref-${type}-${crypto.randomUUID()}`, file, file.type);
      if (!r?.publicUrl) throw new Error('Upload failed');
      setter((p) => ({ ...p, url: r.publicUrl, uploading: false }));
    } catch {
      setter((p) => ({ ...p, uploading: false }));
      toast.error(`${type} reference upload failed`);
    }
  };

  const handleGenerateImage = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!brief.trim()) { toast.error('Describe your product or service'); return; }
    if (productRef.uploading || personRef.uploading) { toast.error('Wait for uploads to complete'); return; }

    setGeneratingImage(true);
    setUgcImage({ id: crypto.randomUUID(), imageUrl: '', prompt: '', generating: true });
    setVideo((v) => ({ ...v, imageUrl: '', videoUrl: '' }));

    const demo = DEMOGRAPHICS.find((d) => d.key === demographic)!;
    const sty = UGC_STYLES.find((s) => s.key === ugcStyle)!;
    const refs = [productRef.url, personRef.url].filter(Boolean);

    try {
      const prompt = await buildUGCImagePrompt(
        brief, sty.label, sty.desc, aspectRatio,
        demo.label, demo.desc, !!productRef.url, !!personRef.url,
      );

      setUgcImage((p) => p ? { ...p, prompt } : null);

      const inputPayload: Record<string, unknown> = {
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        output_format: 'png',
        negative_prompt: DEFAULT_NEGATIVE_PROMPT,
        multi_shots: false,
      };
      if (refs.length > 0) {
        inputPayload.image_input = refs;
        inputPayload.reference_images = refs;
        if (productRef.url) inputPayload.product_image = productRef.url;
        if (personRef.url) inputPayload.subject_image = personRef.url;
      }

      const taskData = await kiePost('/api/v1/jobs/createTask', { model: IMAGE_MODEL, input: inputPayload }, apiKey);
      const taskId = extractTaskId(taskData);
      if (!taskId) throw new Error('No task ID returned');
      const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
      const imageUrl = urls[0] || '';

      setUgcImage({ id: crypto.randomUUID(), imageUrl, prompt, generating: false });
      setVideo((v) => ({ ...v, imageUrl, aspectRatio }));

      if (user && imageUrl) {
        try {
          const assetId = crypto.randomUUID();
          const uploaded = await uploadFromUrl(user.id, assetId, imageUrl);
          await supabase.from('media_assets').insert({
            id: assetId, user_id: user.id, type: 'image',
            title: `UGC: ${brief.slice(0, 40)}`,
            prompt, provider: 'kie_ai', status: 'completed',
            result_url: uploaded?.publicUrl || imageUrl,
            storage_path: uploaded?.path || null, file_size: uploaded?.size || 0,
            metadata: { source: 'ugc_creator', model: IMAGE_MODEL, aspectRatio, ugcStyle },
          });
        } catch { /* non-critical */ }
      }

      toast.success('UGC image generated! Now animate it below.');
    } catch (err) {
      setUgcImage((p) => p ? { ...p, generating: false } : null);
      toast.error(`Image failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleBuildPrompt = async () => {
    if (!ugcImage?.prompt && !brief) return;
    const sty = UGC_STYLES.find((s) => s.key === ugcStyle)!;
    const p = await buildUGCVideoPrompt(ugcImage?.prompt || brief, sty.label, brief);
    setVideo((v) => ({ ...v, prompt: p }));
    toast.success('Motion prompt generated');
  };

  const handleGenerateVideo = async () => {
    if (!video.imageUrl) { toast.error('Generate a UGC image first'); return; }
    if (!video.prompt.trim()) { toast.error('Enter a motion prompt or click the AI button to generate one'); return; }

    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }

    setVideo((v) => ({ ...v, generating: true, videoUrl: '' }));

    try {
      const videoUrl = await generateVideo(
        video.imageUrl,
        video.prompt,
        VIDEO_MODEL,
        video.duration,
        video.aspectRatio,
        apiKey,
        undefined,
        {
          mode: video.mode,
          negativePrompt: video.negativePrompt || undefined,
          cfgScale: video.cfgScale,
          audioEnabled: video.audioEnabled,
          multiShots: video.multiShots,
        },
      );

      setVideo((v) => ({ ...v, videoUrl, generating: false }));

      if (user && videoUrl) {
        try {
          await supabase.from('media_assets').insert({
            id: crypto.randomUUID(), user_id: user.id, type: 'video',
            title: `UGC Video: ${brief.slice(0, 40)}`,
            prompt: video.prompt, provider: 'kie_ai', status: 'completed',
            result_url: videoUrl, storage_path: null, file_size: 0,
            metadata: { source: 'ugc_creator', model: VIDEO_MODEL, aspectRatio: video.aspectRatio, ugcStyle, mode: video.mode },
          });
          await supabase.from('ads_generator_history').insert({
            user_id: user.id, type: 'ugc_video',
            title: `UGC Video: ${ugcStyle} — ${brief.slice(0, 40)}`,
            brief, platform: video.aspectRatio, objective: 'ugc', style: ugcStyle,
            prompt: video.prompt, result_urls: [videoUrl],
            slide_count: 1, duration: video.duration,
            aspect_ratio: video.aspectRatio, model_used: VIDEO_MODEL,
            metadata: { ugcStyle, mode: video.mode },
          });
        } catch { /* non-critical */ }
      }

      toast.success('UGC video generated!');
    } catch (err) {
      setVideo((v) => ({ ...v, generating: false }));
      toast.error(`Video failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-video';
  const videoAspectClass = video.aspectRatio === '1:1' ? 'aspect-square' : video.aspectRatio === '9:16' ? 'aspect-[9/16]' : video.aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-video';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">UGC Creator — 2-Step Flow</p>
          <p className="text-[10px] text-gray-500">Step 1: Generate clean UGC photo · Step 2: Animate with Kling 3.0</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400">KIE.AI</span>
        </div>
      </div>

      {fromGallery && ugcImage?.imageUrl && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-300">Image loaded from Gallery</p>
            <p className="text-[10px] text-gray-500 truncate">{initialImageTitle || 'Gallery image'} — skip to Step 2 to animate it</p>
          </div>
          <button
            onClick={() => { setUgcImage(null); setVideo((v) => ({ ...v, imageUrl: '', videoUrl: '' })); setFromGallery(false); }}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT PANEL — Image Config */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-emerald-400">1</span>
            </div>
            <h3 className="text-sm font-semibold text-white">UGC Photo Setup</h3>
            <span className="text-[10px] text-gray-500 ml-auto">Nano Banana Pro</span>
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Product Brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
              placeholder="e.g. Organic face serum, vitamin C + hyaluronic acid, brightens skin in 7 days, cruelty-free, $42"
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/60 resize-none placeholder-gray-600" />

            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5">Resolution</label>
              <div className="flex gap-1">
                {['1K', '2K', '4K'].map((r) => (
                  <button key={r} onClick={() => setResolution(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${resolution === r ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">UGC Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {UGC_STYLES.map((s) => (
                <button key={s.key} onClick={() => setUgcStyle(s.key)}
                  className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${ugcStyle === s.key ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <span className="text-base leading-none mt-0.5">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold leading-tight">{s.label}</p>
                    <p className="text-[8px] text-gray-600 mt-0.5 leading-tight">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ASPECT_RATIOS.map((r) => (
                <button key={r.key} onClick={() => setAspectRatio(r.key)}
                  className={`py-2 rounded-xl border text-center transition-all ${aspectRatio === r.key ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <p className="text-[9px] font-bold">{r.label}</p>
                  <p className="text-[8px] text-gray-600">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Creator Demographic</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMOGRAPHICS.map((d) => (
                <button key={d.key} onClick={() => setDemographic(d.key)}
                  className={`px-2 py-2 rounded-xl border text-center transition-all ${demographic === d.key ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <p className="text-[10px] font-semibold">{d.label}</p>
                  <p className="text-[8px] text-gray-600 mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Reference Images</label>
              <span className="text-[10px] text-gray-600">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['product', 'person'] as const).map((type) => {
                const ref = type === 'product' ? productRef : personRef;
                const fileRef = type === 'product' ? productFileRef : personFileRef;
                const label = type === 'product' ? 'Product Image' : 'Creator Person';
                return (
                  <div key={type}>
                    <input type="file" accept="image/*" className="hidden" ref={fileRef}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRef(type, f); e.target.value = ''; }} />
                    {ref.preview ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                        <img src={ref.preview} alt={label} className="w-full h-full object-cover" />
                        {ref.uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                        {ref.url && !ref.uploading && (
                          <div className="absolute top-1 left-1">
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30"><Check className="w-2 h-2" /> Ready</span>
                          </div>
                        )}
                        <button onClick={() => { const s = type === 'product' ? setProductRef : setPersonRef; s({ preview: '', url: '', uploading: false }); }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5" />
                        </button>
                        <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/80 bg-black/50 py-0.5">{label}</p>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1">
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-[10px] text-gray-600">{label}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleGenerateImage}
            disabled={generatingImage || !brief.trim() || productRef.uploading || personRef.uploading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99]">
            {generatingImage
              ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Generating UGC photo...</span></>
              : <><Zap className="w-5 h-5" /> Generate UGC Photo</>}
          </button>
        </div>

        {/* RIGHT PANEL — Results */}
        <div className="xl:col-span-3 space-y-5">

          {/* Step 1 Result — Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400">1</span>
                </div>
                <h3 className="text-sm font-semibold text-white">Generated UGC Photo</h3>
              </div>
              {ugcImage?.imageUrl && (
                <div className="flex items-center gap-2">
                  <a href={ugcImage.imageUrl} download="ugc-photo.png" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors">
                    <Download className="w-3 h-3" /> Download
                  </a>
                  <button onClick={handleGenerateImage} disabled={generatingImage}
                    className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors">
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                </div>
              )}
            </div>

            <div className={`relative rounded-xl overflow-hidden border-2 border-white/10 max-w-sm mx-auto`}>
              {ugcImage?.imageUrl ? (
                <img src={ugcImage.imageUrl} alt="UGC photo" className={`w-full object-cover object-top ${aspectClass}`} />
              ) : (
                <div className={`w-full bg-dark-800/60 flex items-center justify-center ${aspectClass} min-h-48`}>
                  {generatingImage
                    ? <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /><p className="text-xs text-gray-500">Generating clean UGC photo...</p></div>
                    : <div className="flex flex-col items-center gap-2"><User className="w-10 h-10 text-gray-700" /><p className="text-xs text-gray-600">UGC photo appears here</p></div>}
                </div>
              )}
            </div>
          </div>

          {/* Step 2 — Video Config */}
          <div className={`glass-card rounded-xl p-5 space-y-4 border transition-all ${ugcImage?.imageUrl ? 'border-emerald-500/20' : 'border-white/5 opacity-60'}`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-400">2</span>
              </div>
              <h3 className="text-sm font-semibold text-white">Animate to Video</h3>
              <span className="text-[10px] text-gray-500">Kling 3.0</span>
              {!ugcImage?.imageUrl && <span className="ml-auto text-[10px] text-gray-600">Generate photo first</span>}
            </div>

            {/* Video aspect ratio + duration + mode row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-1">
                  {ASPECT_RATIOS.map((r) => (
                    <button key={r.key} onClick={() => setVideo((v) => ({ ...v, aspectRatio: r.key }))}
                      className={`py-1.5 rounded-lg border text-center transition-all ${video.aspectRatio === r.key ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                      <p className="text-[8px] font-bold">{r.label}</p>
                      <p className="text-[7px] text-gray-600">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5">Duration</label>
                <div className="space-y-1">
                  {VIDEO_DURATIONS.map((d) => (
                    <button key={d} onClick={() => setVideo((v) => ({ ...v, duration: d }))}
                      className={`w-full py-1.5 rounded-lg border text-center text-xs font-bold transition-all ${video.duration === d ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5">Mode</label>
                <div className="space-y-1">
                  {(['std', 'pro'] as const).map((m) => (
                    <button key={m} onClick={() => setVideo((v) => ({ ...v, mode: m }))}
                      className={`w-full py-2 rounded-lg border text-center transition-all ${video.mode === m ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                      <p className="text-xs font-bold uppercase">{m}</p>
                      <p className="text-[8px] text-gray-600">{m === 'std' ? 'Standard' : 'Pro quality'}</p>
                    </button>
                  ))}
                </div>

                <label className="block text-[10px] text-gray-500 mt-2.5 mb-1">Sound & Shots</label>
                <div className="space-y-1">
                  <button onClick={() => setVideo((v) => ({ ...v, audioEnabled: !v.audioEnabled }))}
                    className={`w-full py-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${video.audioEnabled ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                    {video.audioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    <span className="text-[9px] font-bold">{video.audioEnabled ? 'Sound On' : 'No Sound'}</span>
                  </button>
                  <button onClick={() => setVideo((v) => ({ ...v, multiShots: !v.multiShots, audioEnabled: !v.multiShots ? true : v.audioEnabled }))}
                    className={`w-full py-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${video.multiShots ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                    <Video className="w-3 h-3" />
                    <span className="text-[9px] font-bold">{video.multiShots ? 'Multi-Shot' : 'Single Shot'}</span>
                  </button>
                </div>
                {video.multiShots && (
                  <p className="text-[8px] text-amber-400/70 mt-1 text-center leading-tight">Sound forced ON with multi-shot</p>
                )}
              </div>
            </div>

            {/* Motion prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Motion Prompt</label>
                <button onClick={handleBuildPrompt} disabled={!ugcImage?.imageUrl && !brief}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40">
                  <Sparkles className="w-3 h-3" /> AI Generate
                </button>
              </div>
              <textarea
                value={video.prompt}
                onChange={(e) => setVideo((v) => ({ ...v, prompt: e.target.value }))}
                rows={3}
                placeholder="Describe the motion: subtle hand-held camera drift, person begins speaking, gentle nod, product rotates slightly..."
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 resize-none placeholder-gray-600"
              />
            </div>

            {/* Advanced params toggle */}
            <button onClick={() => setVideo((v) => ({ ...v, showAdvanced: !v.showAdvanced }))}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-white transition-colors">
              <Settings2 className="w-3 h-3" />
              Advanced Parameters
              {video.showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {video.showAdvanced && (
              <div className="space-y-3 pt-1 border-t border-white/5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-gray-500">Negative Prompt</label>
                  </div>
                  <textarea
                    value={video.negativePrompt}
                    onChange={(e) => setVideo((v) => ({ ...v, negativePrompt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-[10px] focus:outline-none focus:border-emerald-500/60 resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-gray-500">CFG Scale</label>
                    <span className="text-[10px] text-white font-mono">{video.cfgScale.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={video.cfgScale}
                    onChange={(e) => setVideo((v) => ({ ...v, cfgScale: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                    <span>0.0 — More creative</span>
                    <span>1.0 — Strict to prompt</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5">
                  <p className="text-[9px] text-gray-600 font-medium mb-1.5">Kling 3.0 JSON Payload Preview</p>
                  <pre className="text-[8px] text-gray-500 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
{JSON.stringify({
  model: VIDEO_MODEL,
  input: {
    image_urls: ['[selected_image_url]'],
    prompt: video.prompt || '...',
    duration: String(video.duration),
    aspect_ratio: video.aspectRatio,
    mode: video.mode,
    sound: video.audioEnabled || video.multiShots,
    multi_shots: video.multiShots,
    ...(video.negativePrompt ? { negative_prompt: video.negativePrompt } : {}),
    cfg_scale: video.cfgScale,
  },
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Generate video button + output */}
            <button onClick={handleGenerateVideo}
              disabled={video.generating || !ugcImage?.imageUrl || !video.prompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
              {video.generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Animating with Kling 3.0...</>
                : <><Play className="w-4 h-4" /> Generate UGC Video</>}
            </button>

            {video.videoUrl && (
              <div className="space-y-3">
                <div className={`max-w-sm mx-auto rounded-xl overflow-hidden border border-emerald-500/30`}>
                  <video src={video.videoUrl} controls autoPlay muted loop
                    className={`w-full object-cover ${videoAspectClass}`} />
                </div>
                <a href={video.videoUrl} download="ugc-video.mp4" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download UGC Video
                </a>
              </div>
            )}
          </div>

          {!ugcImage && !generatingImage && (
            <div className="glass-card rounded-xl p-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-emerald-400/40" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Configure your brief and generate a clean UGC photo</p>
              <p className="text-xs text-gray-600 mt-1">Then animate it to video with full Kling 3.0 controls</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
