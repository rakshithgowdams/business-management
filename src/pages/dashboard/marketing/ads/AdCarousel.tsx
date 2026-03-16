import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Upload, X, Check, ChevronLeft, ChevronRight,
  LayoutGrid, RefreshCw, Video, Image as ImageIcon, Lock, Zap,
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

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', ratio: '1:1', desc: '1080×1080' },
  { key: 'facebook', label: 'Facebook', ratio: '4:3', desc: '1200×900' },
  { key: 'portrait', label: 'Portrait', ratio: '4:5', desc: '1080×1350' },
  { key: 'story', label: 'Story / Reel', ratio: '9:16', desc: '1080×1920' },
];

const OBJECTIVES = [
  { key: 'sales', label: 'Sales', desc: 'Drive purchases' },
  { key: 'awareness', label: 'Awareness', desc: 'Brand reach' },
  { key: 'leads', label: 'Lead Gen', desc: 'Capture contacts' },
  { key: 'engagement', label: 'Engagement', desc: 'Likes & saves' },
  { key: 'retargeting', label: 'Retargeting', desc: 'Re-engage visitors' },
];

const AD_STYLES = [
  { key: 'cinematic', label: 'Cinematic' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'bold', label: 'Bold & Direct' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'announcement', label: 'Announcement' },
];

const SLIDE_COUNTS = [3, 4, 5, 6, 8];
const VIDEO_DURATIONS = [5, 8, 10];

interface Slide {
  index: number;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  generating: boolean;
  converting: boolean;
}

async function buildCarouselStructure(brief: string, objective: string, slideCount: number, platform: string): Promise<{ title: string; body: string }[]> {
  const sys = `You are a senior performance advertising strategist. Create a ${slideCount}-slide ad carousel structure optimized for ${objective} on ${platform}.

RULES:
- Slide 1 (HOOK): Scroll-stopping hook. Bold claim, stat, or question. Stops the feed cold.
- Slides 2-${slideCount - 1} (VALUE): Each = one benefit/proof point. Problem → Solution → Outcome flow.
- Slide ${slideCount} (CTA): Clear action. "Shop Now", "Learn More", "Claim Offer", etc.

Output ONLY a JSON array with exactly ${slideCount} objects:
[{"title": "...", "body": "..."}, ...]
- title: max 6 words, punchy, uses power words
- body: max 18 words, specific benefit or proof
NO markdown fences, NO extra text.

Brief: ${brief}`;

  try {
    const raw = await callGeminiFlash(sys, 'ad_carousel_structure');
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return Array.from({ length: slideCount }, (_, i) => ({
      title: `Slide ${i + 1}`,
      body: `Key benefit ${i + 1}`,
    }));
  }
}

async function buildCarouselSlidePrompt(
  title: string, body: string, brief: string, style: string, platform: string,
  ratio: string, slideIndex: number, totalSlides: number, isFirst: boolean, isLast: boolean,
  hasRef: boolean,
): Promise<string> {
  const role = isFirst
    ? `COVER/HOOK slide (${slideIndex + 1}/${totalSlides}): Most visually striking. Scroll-stopper. Maximum impact.`
    : isLast
    ? `CTA CLOSER slide (${slideIndex + 1}/${totalSlides}): Action-oriented. Warm, inviting. Reserve prominent CTA space.`
    : `VALUE slide (${slideIndex + 1}/${totalSlides}): Clean, focused, single benefit. Same visual DNA as all other slides.`;

  const sys = `You are a master ad creative director and Nano Banana Pro prompt engineer. Write ONE image generation prompt for an ad carousel slide.

SLIDE ROLE: ${role}
SLIDE CONTENT: Headline: "${title}" | Supporting: "${body}"
PRODUCT/SERVICE: ${brief}
VISUAL STYLE: ${style}
PLATFORM: ${platform} (${ratio} aspect ratio)
${hasRef ? 'BRAND REFERENCE ATTACHED: Match exact colors, typography personality, and visual language from the reference.' : ''}

VISUAL SYSTEM (must be IDENTICAL across all ${totalSlides} slides):
- Locked color palette: primary + secondary + accent (specify hex-level consistency)
- Typography safe zone: reserve identical area for text overlay on every slide
- Background treatment: same gradient/texture/tone system across series
- Decorative elements: consistent geometric shapes or motifs
- Lighting: same direction and quality across all slides

SLIDE-SPECIFIC DIRECTION:
- ${isFirst ? 'Maximum contrast, bold composition, hero-product or powerful hero visual dominates 70% of frame' : isLast ? 'Softer energy, CTA landing pad with high-contrast button zone, clean background treatment' : 'Single clear focal point, benefit-driven visual metaphor or product in context'}

TECHNICAL: Ultra-HD, commercial advertising quality, Nano Banana Pro optimized, perfect for paid social ads.

Write ONE continuous prompt, no headers, no bullets. Max 280 words. Raw prompt only.`;

  try {
    const r = await callGeminiFlash(sys, `ad_carousel_slide_${slideIndex}`);
    return r.trim() || `${style} ad carousel slide: ${title}. ${body}. Professional advertising design, ultra-HD.`;
  } catch {
    return `${style} ad carousel slide: ${title}. ${body}. Professional advertising design, ultra-HD.`;
  }
}

async function buildCarouselVideoPrompt(imagePrompt: string, title: string, body: string, style: string): Promise<string> {
  const sys = `You are a Kling 3.0 video prompt engineer. Convert this static ad image prompt into a dynamic video motion prompt.

ORIGINAL IMAGE PROMPT (reference): ${imagePrompt}
SLIDE HEADLINE: "${title}"
SLIDE TEXT: "${body}"
STYLE: ${style}

Create a motion prompt that:
- Describes smooth, professional camera movement (slow push-in, gentle parallax, or subtle zoom)
- Specifies how product/hero element animates (gentle rotation, float, reveal)
- Describes particle effects or ambient motion (light rays, floating elements, blur bokeh shift)
- Maintains the exact visual style and mood of the image
- 5-8 seconds of clean, conversion-optimized ad motion
- Ends with the brand/CTA zone holding still for readability

Output ONLY the motion prompt. Max 120 words. Raw text, no structure.`;

  try {
    const r = await callGeminiFlash(sys, 'ad_carousel_video_prompt');
    return r.trim() || `Smooth slow push-in camera movement, subtle parallax on hero element, gentle ambient light motion, professional ad quality, holds on CTA zone.`;
  } catch {
    return `Smooth slow push-in camera movement, subtle parallax on hero element, gentle ambient light motion, professional ad quality, holds on CTA zone.`;
  }
}

export default function AdCarousel() {
  const { user } = useAuth();
  const refFileInput = useRef<HTMLInputElement | null>(null);

  const [brief, setBrief] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [objective, setObjective] = useState('sales');
  const [adStyle, setAdStyle] = useState('cinematic');
  const [slideCount, setSlideCount] = useState(5);
  const [generateVideos, setGenerateVideos] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5);
  const [resolution, setResolution] = useState('2K');

  const [brandRef, setBrandRef] = useState({ preview: '', url: '', uploading: false });
  const [phase, setPhase] = useState<'setup' | 'preview' | 'generating' | 'done'>('setup');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState('');

  const uploadBrandRef = async (file: File) => {
    if (!user) return;
    setBrandRef((p) => ({ ...p, preview: URL.createObjectURL(file), uploading: true, url: '' }));
    try {
      const r = await uploadMediaToStorage(user.id, `ad-carousel-ref-${crypto.randomUUID()}`, file, file.type);
      if (!r?.publicUrl) throw new Error('Upload failed');
      setBrandRef((p) => ({ ...p, url: r.publicUrl, uploading: false }));
    } catch {
      setBrandRef((p) => ({ ...p, uploading: false }));
      toast.error('Brand reference upload failed');
    }
  };

  const handleBuildStructure = async () => {
    if (!brief.trim()) { toast.error('Describe your product or service'); return; }
    setPhase('generating');
    setProgress('AI building carousel structure...');
    try {
      const plt = PLATFORMS.find((p) => p.key === platform)!;
      const structure = await buildCarouselStructure(brief, objective, slideCount, plt.label);
      setSlides(structure.map((s, i) => ({
        index: i, title: s.title, body: s.body,
        imageUrl: '', videoUrl: '', generating: false, converting: false,
      })));
      setPhase('preview');
      setActiveSlide(0);
    } catch {
      toast.error('Failed to build structure');
      setPhase('setup');
    }
    setProgress('');
  };

  const handleGenerateAll = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (brandRef.uploading) { toast.error('Wait for brand reference to upload'); return; }
    setPhase('generating');

    const plt = PLATFORMS.find((p) => p.key === platform)!;
    const sty = AD_STYLES.find((s) => s.key === adStyle)!;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      setSlides((prev) => prev.map((s) => s.index === i ? { ...s, generating: true } : s));
      setProgress(`Generating slide ${i + 1} of ${slides.length}...`);

      try {
        const imagePrompt = await buildCarouselSlidePrompt(
          slide.title, slide.body, brief, sty.label, plt.label, plt.ratio,
          i, slides.length, i === 0, i === slides.length - 1, !!brandRef.url,
        );

        const inputPayload: Record<string, unknown> = {
          prompt: imagePrompt, aspect_ratio: plt.ratio, resolution, output_format: 'png',
          negative_prompt: 'low quality, blurry, watermark, inconsistent style, amateur, text errors',
          multi_shots: false,
        };
        if (brandRef.url) {
          inputPayload.image_input = [brandRef.url];
          inputPayload.reference_images = [brandRef.url];
        }

        const taskData = await kiePost('/api/v1/jobs/createTask', { model: IMAGE_MODEL, input: inputPayload }, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) throw new Error('No task ID');
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
        const imageUrl = urls[0] || '';

        setSlides((prev) => prev.map((s) => s.index === i ? { ...s, imageUrl, generating: false } : s));

        if (generateVideos && imageUrl) {
          setSlides((prev) => prev.map((s) => s.index === i ? { ...s, converting: true } : s));
          setProgress(`Converting slide ${i + 1} to video...`);
          try {
            const videoPrompt = await buildCarouselVideoPrompt(imagePrompt, slide.title, slide.body, sty.label);
            const videoUrl = await generateVideo(imageUrl, videoPrompt, VIDEO_MODEL, videoDuration, plt.ratio, apiKey);
            setSlides((prev) => prev.map((s) => s.index === i ? { ...s, videoUrl, converting: false } : s));

            if (user && videoUrl) {
              try {
                const assetId = crypto.randomUUID();
                await supabase.from('media_assets').insert({
                  id: assetId, user_id: user.id, type: 'video',
                  title: `Ad Carousel Video: ${brief.slice(0, 40)} — Slide ${i + 1}`,
                  prompt: videoPrompt, provider: 'kie_ai', status: 'completed',
                  result_url: videoUrl, storage_path: null, file_size: 0,
                  metadata: { source: 'ads_carousel', model: VIDEO_MODEL, platform, objective, slideIndex: i },
                });
              } catch { /* non-critical */ }
            }
          } catch {
            setSlides((prev) => prev.map((s) => s.index === i ? { ...s, converting: false } : s));
          }
        }

        if (user && imageUrl) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, imageUrl);
            await supabase.from('media_assets').insert({
              id: assetId, user_id: user.id, type: 'image',
              title: `Ad Carousel: ${brief.slice(0, 40)} — Slide ${i + 1}`,
              prompt: imagePrompt, provider: 'kie_ai', status: 'completed',
              result_url: uploaded?.publicUrl || imageUrl,
              storage_path: uploaded?.path || null, file_size: uploaded?.size || 0,
              metadata: { source: 'ads_carousel', model: IMAGE_MODEL, platform, objective, slideIndex: i },
            });
          } catch { /* non-critical */ }
        }
      } catch (err) {
        setSlides((prev) => prev.map((s) => s.index === i ? { ...s, generating: false, converting: false } : s));
        toast.error(`Slide ${i + 1} failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    try {
      const completedSlides = slides.filter((s) => s.imageUrl);
      if (user && completedSlides.length > 0) {
        await supabase.from('ads_generator_history').insert({
          user_id: user.id, type: generateVideos ? 'carousel_video' : 'carousel_image',
          title: `${plt.label} Ad Carousel — ${brief.slice(0, 50)}`,
          brief, platform, objective, style: adStyle, prompt: '',
          result_urls: completedSlides.map((s) => generateVideos ? (s.videoUrl || s.imageUrl) : s.imageUrl),
          slide_count: slides.length, duration: generateVideos ? videoDuration : 0,
          aspect_ratio: plt.ratio, model_used: generateVideos ? VIDEO_MODEL : IMAGE_MODEL,
          metadata: { adStyle, slideCount: slides.length },
        });
      }
    } catch { /* non-critical */ }

    setPhase('done');
    setProgress('');
    toast.success(`${slides.length}-slide ad carousel complete!`);
  };

  const plt = PLATFORMS.find((p) => p.key === platform)!;
  const currentSlide = slides[activeSlide];
  const completedCount = slides.filter((s) => s.imageUrl).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 border border-[#F1C40F]/20">
        <div className="w-7 h-7 rounded-lg bg-[#F1C40F]/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-[#F1C40F]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Ad Carousel Generator · Nano Banana Pro + Kling 3.0</p>
          <p className="text-[10px] text-gray-500">AI structures slides · Generates each frame · Optional video conversion per slide</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
          <Lock className="w-2.5 h-2.5 text-[#F1C40F]" />
          <span className="text-[9px] font-bold text-[#F1C40F]">KIE.AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Product / Service Brief</label>
            <textarea
              value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
              placeholder="e.g. Premium protein powder for athletes — 30g protein per serving, 12 flavors, no artificial sweeteners, ships free over $50"
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Slide Count</label>
                <div className="flex gap-1 flex-wrap">
                  {SLIDE_COUNTS.map((c) => (
                    <button key={c} onClick={() => setSlideCount(c)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${slideCount === c ? 'bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/30' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Resolution</label>
                <div className="flex gap-1">
                  {['1K', '2K', '4K'].map((r) => (
                    <button key={r} onClick={() => setResolution(r)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${resolution === r ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-[#F1C40F]' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Platform</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p.key} onClick={() => setPlatform(p.key)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${platform === p.key ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <span className="text-xs font-semibold">{p.label}</span>
                  <span className="text-[9px] text-gray-600">{p.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Campaign Objective</label>
            <div className="grid grid-cols-3 gap-1.5">
              {OBJECTIVES.map((o) => (
                <button key={o.key} onClick={() => setObjective(o.key)}
                  className={`px-2 py-2.5 rounded-xl border text-center transition-all ${objective === o.key ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <p className="text-[10px] font-semibold">{o.label}</p>
                  <p className="text-[8px] text-gray-600 mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Visual Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {AD_STYLES.map((s) => (
                <button key={s.key} onClick={() => setAdStyle(s.key)}
                  className={`px-3 py-2 rounded-xl border text-center transition-all ${adStyle === s.key ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                  <p className="text-[10px] font-semibold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Video Conversion</label>
              <button onClick={() => setGenerateVideos((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-all ${generateVideos ? 'bg-[#F1C40F]/60' : 'bg-dark-700 border border-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${generateVideos ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {generateVideos && (
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5">Duration per Slide</label>
                <div className="flex gap-2">
                  {VIDEO_DURATIONS.map((d) => (
                    <button key={d} onClick={() => setVideoDuration(d)}
                      className={`flex-1 py-2 rounded-xl border text-center transition-all ${videoDuration === d ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white' : 'bg-dark-800 border-white/10 text-gray-400 hover:text-white'}`}>
                      <p className="text-sm font-bold">{d}s</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800/60 border border-white/5">
              <Video className="w-3 h-3 text-[#F1C40F]/60 flex-shrink-0" />
              <p className="text-[10px] text-gray-500">Each image slide is converted to motion video with Kling 3.0</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Brand Reference</label>
              <span className="text-[10px] text-gray-600">Applied to all slides</span>
            </div>
            <input type="file" accept="image/*" className="hidden" ref={refFileInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBrandRef(f); e.target.value = ''; }} />
            {brandRef.preview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                <img src={brandRef.preview} alt="Brand ref" className="w-full h-full object-cover" />
                {brandRef.uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                {brandRef.url && !brandRef.uploading && (
                  <div className="absolute top-1 left-1">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30"><Check className="w-2 h-2" /> Ready</span>
                  </div>
                )}
                <button onClick={() => setBrandRef({ preview: '', url: '', uploading: false })}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => refFileInput.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1">
                <Upload className="w-4 h-4 text-gray-600" />
                <span className="text-[10px] text-gray-600">Upload brand logo or reference image</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {phase === 'setup' ? (
            <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F1C40F]/10 flex items-center justify-center mb-4">
                <LayoutGrid className="w-7 h-7 text-[#F1C40F]/40" />
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">Configure your ad carousel</p>
              <p className="text-xs text-gray-600 mb-6 max-w-[260px]">AI builds conversion-optimized slide structure, then generates each frame with brand consistency</p>
              <button onClick={handleBuildStructure} disabled={!brief.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20">
                <Sparkles className="w-4 h-4" /> Build Slide Structure
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Ad Carousel Preview</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">{completedCount}/{slides.length} done</span>
                  {phase === 'preview' && (
                    <button onClick={handleBuildStructure} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors">
                      <RefreshCw className="w-3 h-3" /> Rebuild
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {slides.map((slide, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)}
                    className={`flex-shrink-0 w-12 rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i ? 'border-[#F1C40F]' : 'border-white/10'}`}>
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt={`Slide ${i + 1}`} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-dark-800 flex items-center justify-center">
                        {slide.generating || slide.converting
                          ? <Loader2 className="w-3 h-3 text-[#F1C40F] animate-spin" />
                          : <span className="text-[9px] text-gray-600 font-bold">{i + 1}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {currentSlide && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{currentSlide.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{currentSlide.body}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setActiveSlide((p) => Math.max(0, p - 1))} disabled={activeSlide === 0}
                        className="p-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-gray-500 w-10 text-center">{activeSlide + 1}/{slides.length}</span>
                      <button onClick={() => setActiveSlide((p) => Math.min(slides.length - 1, p + 1))} disabled={activeSlide === slides.length - 1}
                        className="p-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {currentSlide.imageUrl ? (
                    <div className="space-y-2">
                      <div className="group relative rounded-xl overflow-hidden border border-white/10">
                        <img src={currentSlide.imageUrl} alt={currentSlide.title}
                          className={`w-full object-cover ${plt.ratio === '1:1' ? 'aspect-square' : plt.ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a href={currentSlide.imageUrl} download={`ad-slide-${activeSlide + 1}.png`} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Image
                          </a>
                          {currentSlide.videoUrl && (
                            <a href={currentSlide.videoUrl} download={`ad-slide-${activeSlide + 1}.mp4`} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#F1C40F]/20 backdrop-blur text-[#F1C40F] text-xs font-medium flex items-center gap-1.5 hover:bg-[#F1C40F]/30 transition-colors">
                              <Video className="w-3.5 h-3.5" /> Video
                            </a>
                          )}
                        </div>
                      </div>
                      {currentSlide.videoUrl && (
                        <video src={currentSlide.videoUrl} controls autoPlay muted loop
                          className="w-full rounded-xl border border-[#F1C40F]/20" />
                      )}
                      {currentSlide.converting && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1C40F]/5 border border-[#F1C40F]/10">
                          <Loader2 className="w-3.5 h-3.5 text-[#F1C40F] animate-spin" />
                          <span className="text-[10px] text-[#F1C40F]/70">Converting to Kling 3.0 video...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`w-full bg-dark-800/60 border border-white/5 rounded-xl flex items-center justify-center ${plt.ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}>
                      {currentSlide.generating
                        ? <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#F1C40F] animate-spin" /><p className="text-xs text-gray-500">Generating...</p></div>
                        : <div className="flex flex-col items-center gap-2"><LayoutGrid className="w-8 h-8 text-gray-700" /><p className="text-xs text-gray-600">Not yet generated</p></div>}
                    </div>
                  )}
                </div>
              )}

              {phase === 'preview' && (
                <div className="space-y-2 pt-1">
                  <button onClick={handleGenerateAll} disabled={!brief.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
                    <Sparkles className="w-4 h-4" />
                    Generate {slideCount} Slides{generateVideos ? ' + Videos' : ''}
                  </button>
                  <p className="text-[10px] text-gray-600 text-center">
                    {generateVideos ? `Each slide: Nano Banana Pro image → Kling 3.0 ${videoDuration}s video` : 'Each slide generated individually with Nano Banana Pro'}
                  </p>
                </div>
              )}

              {phase === 'generating' && progress && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#F1C40F]/5 border border-[#F1C40F]/10">
                  <Loader2 className="w-4 h-4 text-[#F1C40F] animate-spin flex-shrink-0" />
                  <p className="text-xs text-[#F1C40F]/80">{progress}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {phase === 'done' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">{slides.length}-Slide Ad Carousel Complete</h4>
              {generateVideos && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/20">+ Videos</span>}
            </div>
            <button onClick={() => { setPhase('setup'); setSlides([]); setBrief(''); }}
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-dark-800 border border-white/10">
              New Carousel
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {slides.filter((s) => s.imageUrl).map((slide, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10">
                <img src={slide.imageUrl} alt={`Slide ${i + 1}`} className="w-full aspect-square object-cover" />
                {slide.videoUrl && (
                  <div className="absolute top-1 left-1">
                    <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#F1C40F]/80 text-black text-[7px] font-bold"><Video className="w-2 h-2" />VIDEO</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
                  <p className="text-[8px] text-white/80 font-medium truncate">{slide.title}</p>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <a href={slide.imageUrl} download={`slide-${i + 1}.png`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors">
                    <ImageIcon className="w-3 h-3" />
                  </a>
                  {slide.videoUrl && (
                    <a href={slide.videoUrl} download={`slide-${i + 1}.mp4`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#F1C40F]/20 backdrop-blur text-[#F1C40F] hover:bg-[#F1C40F]/30 transition-colors">
                      <Video className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 text-center">Saved to Ads History and Media Gallery</p>
        </div>
      )}
    </div>
  );
}
