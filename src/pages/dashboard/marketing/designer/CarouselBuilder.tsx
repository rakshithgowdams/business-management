import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Lock, Zap, Upload, X,
  Check, ChevronLeft, ChevronRight, LayoutGrid, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import { kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';
import { callGeminiFlash } from '../../../../lib/ai/gemini';

const MODEL = 'nano-banana-pro';

const SLIDE_COUNTS = [3, 4, 5, 6, 7, 10];

const CAROUSEL_TYPES = [
  { key: 'tips',        label: 'Tips & Tricks',    desc: '"5 Ways to..."',      icon: '💡' },
  { key: 'story',       label: 'Brand Story',      desc: '"How we started..."', icon: '📖' },
  { key: 'product',     label: 'Product Showcase', desc: 'Feature highlights',  icon: '🛍️' },
  { key: 'education',   label: 'Educational',      desc: 'Teach your audience', icon: '🎓' },
  { key: 'testimonial', label: 'Testimonials',     desc: 'Social proof',        icon: '⭐' },
  { key: 'before_after',label: 'Before & After',   desc: 'Transformation',      icon: '🔄' },
  { key: 'launch',      label: 'Product Launch',   desc: 'New release hype',    icon: '🚀' },
  { key: 'data',        label: 'Data & Stats',     desc: 'Infographic style',   icon: '📊' },
];

const VISUAL_STYLES = [
  { key: 'minimal',   label: 'Minimal',   color: '#E5E7EB' },
  { key: 'bold',      label: 'Bold',      color: '#EF4444' },
  { key: 'gradient',  label: 'Gradient',  color: '#8B5CF6' },
  { key: 'luxury',    label: 'Luxury',    color: '#F59E0B' },
  { key: 'neon',      label: 'Neon',      color: '#10B981' },
  { key: 'cinematic', label: 'Cinematic', color: '#3B82F6' },
];

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', ratio: '1:1',  desc: '1080×1080' },
  { key: 'linkedin',  label: 'LinkedIn',  ratio: '4:3',  desc: '1200×900' },
  { key: 'portrait',  label: 'Portrait',  ratio: '4:5',  desc: '1080×1350' },
];

interface SlideData {
  index: number;
  title: string;
  body: string;
  imageUrl: string;
  generating: boolean;
}

async function buildSlideStructure(
  topic: string,
  carouselType: string,
  slideCount: number,
  brandName: string,
): Promise<{ title: string; body: string }[]> {
  const typeMeta = CAROUSEL_TYPES.find((t) => t.key === carouselType)!;
  const sys = `You are a senior social media content strategist and conversion copywriter with 15+ years of experience creating viral carousel content for top brands.

TASK: Create the optimal ${slideCount}-slide carousel structure for maximum engagement and saves.

CAROUSEL BLUEPRINT:
- Format: ${typeMeta.label} — ${typeMeta.desc}
- Topic: ${topic}
${brandName ? `- Brand voice: ${brandName}` : ''}
- Total slides: ${slideCount}

CAROUSEL ARCHITECTURE RULES:
- Slide 1 (HOOK/COVER): Must stop the scroll. Use a bold promise, shocking stat, or irresistible question. This determines swipe rate.
- Slides 2 to ${slideCount - 1} (VALUE BODY): Deliver on the hook. Each slide = one clear idea. Progressive revelation — each slide must make the reader want the next.
- Slide ${slideCount} (CTA/CLOSER): Strong call-to-action. Save this post, follow for more, comment below, or direct offer.

COPYWRITING STANDARDS:
- Titles: Power words, numbers when applicable, curiosity gap, pattern interrupts. Max 6 words — punchy and memorable.
- Body text: Expand on title. Specific, actionable, surprising. Max 18 words. No filler words.
- Voice: Authoritative yet conversational. Avoid corporate jargon.

Output ONLY a valid JSON array with exactly ${slideCount} objects:
[{"title": "...", "body": "..."}, ...]

NO markdown fences, NO explanations, NO extra text — just the raw JSON array.`;

  try {
    const raw = await callGeminiFlash(sys, 'carousel_structure');
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return Array.from({ length: slideCount }, (_, i) => ({
      title: `Slide ${i + 1}`,
      body: `Key point ${i + 1} about ${topic}`,
    }));
  }
}

async function buildSlidePrompt(
  slideTitle: string,
  slideBody: string,
  slideIndex: number,
  totalSlides: number,
  topic: string,
  style: string,
  brandName: string,
  isFirst: boolean,
  isLast: boolean,
  hasRefs: boolean,
): Promise<string> {
  const slideRole = isFirst
    ? `COVER SLIDE (Slide 1/${totalSlides}) — This must be the most visually striking frame. The scroll-stopper. Dominant hero visual, bold graphic energy, immediate visual impact. Must communicate the core topic "${topic}" at a glance.`
    : isLast
    ? `FINAL SLIDE (Slide ${totalSlides}/${totalSlides}) — Closing frame. Warm, inviting, action-oriented energy. Slightly different layout to signal completion. Reserve prominent space for CTA text "${slideBody}". Must feel conclusive and motivating.`
    : `BODY SLIDE (Slide ${slideIndex + 1}/${totalSlides}) — Value delivery frame. Clear, focused, single-idea visual. Slightly calmer energy than cover but same visual DNA. Maintain perfect stylistic continuity with all other slides in this series.`;

  const sys = `You are a master visual director and AI prompt engineer specializing in cohesive social media carousel design for Nano Banana Pro (Gemini 3 Pro).

SLIDE ROLE: ${slideRole}

SLIDE CONTENT:
- Headline: "${slideTitle}"
- Supporting text: "${slideBody}"
- Series topic: ${topic}
${brandName ? `- Brand: ${brandName}` : ''}

VISUAL STYLE SYSTEM: ${style}
Define the complete visual language:
- Color palette: Specify primary, secondary, accent colors with relationships. Must be IDENTICAL across all ${totalSlides} slides.
- Typography zone: Reserve precise screen area for the headline text. Specify text safe zone dimensions and contrast background treatment.
- Layout grid: Describe exact element placement — rule of thirds, centered, asymmetric, etc.
- Background treatment: Gradient direction, texture, depth, ambient elements.
- Decorative system: Consistent geometric shapes, lines, icons, patterns that appear across all slides as series identifiers.

LIGHTING & DEPTH:
- Specify light source, quality, and direction.
- Depth of field setting (deep focus for infographic, shallow for lifestyle).
- Shadow type and softness.

${hasRefs ? `BRAND REFERENCE ENFORCEMENT:
Brand/style reference images are attached. You MUST extract and lock in:
- Exact brand color codes (sample from reference)
- Typography weight and feel
- Design motif and decorative system
- Color grading and tonal range
The output must be unmistakably the SAME BRAND as the reference across every slide.` : ''}

SERIES CONSISTENCY LOCK:
This is slide ${slideIndex + 1} of a ${totalSlides}-slide carousel. Every slide uses: same background system, same color palette, same font placement zone, same decorative elements, same lighting angle. Visual DNA must be identical — only the content area changes.

QUALITY DIRECTIVES: Ultra-HD, pixel-perfect graphic design, professional social media carousel, zero layout inconsistencies, commercial print quality, Nano Banana Pro optimized.

Write ONE continuous image generation prompt with NO headers, NO bullets, NO explanations. Max 280 words. Output ONLY the raw prompt.`;

  try {
    const result = await callGeminiFlash(sys, `carousel_slide_${slideIndex}`);
    return result.trim() || `${style} social media carousel slide ${slideIndex + 1}: ${slideTitle}. ${slideBody}. Consistent series design, ultra-HD, commercial quality.`;
  } catch {
    return `${style} social media carousel slide ${slideIndex + 1}: ${slideTitle}. ${slideBody}. Consistent series design, ultra-HD, commercial quality.`;
  }
}

export default function CarouselBuilder() {
  const { user } = useAuth();
  const fileInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const [topic, setTopic] = useState('');
  const [brandName, setBrandName] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [carouselType, setCarouselType] = useState('tips');
  const [visualStyle, setVisualStyle] = useState('minimal');
  const [platform, setPlatform] = useState('instagram');
  const [resolution, setResolution] = useState('2K');

  const [brandRef, setBrandRef] = useState({ preview: '', url: '', uploading: false, file: null as File | null });
  const [styleRef, setStyleRef] = useState({ preview: '', url: '', uploading: false, file: null as File | null });

  const [phase, setPhase] = useState<'setup' | 'preview' | 'generating' | 'done'>('setup');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [progress, setProgress] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const uploadImage = async (type: 'brand' | 'style', file: File) => {
    if (!user) { toast.error('Sign in to upload references'); return; }
    const setter = type === 'brand' ? setBrandRef : setStyleRef;
    setter((prev) => ({ ...prev, file, preview: URL.createObjectURL(file), uploading: true, url: '' }));
    try {
      const result = await uploadMediaToStorage(user.id, `carousel-ref-${type}-${crypto.randomUUID()}`, file, file.type);
      if (!result?.publicUrl) throw new Error('Upload failed');
      setter((prev) => ({ ...prev, url: result.publicUrl, uploading: false }));
    } catch {
      setter((prev) => ({ ...prev, uploading: false }));
      toast.error(`${type} reference upload failed`);
    }
  };

  const clearRef = (type: 'brand' | 'style') => {
    const setter = type === 'brand' ? setBrandRef : setStyleRef;
    setter({ preview: '', url: '', uploading: false, file: null });
  };

  const handleBuildStructure = async () => {
    if (!topic.trim()) { toast.error('Enter a carousel topic'); return; }
    setPhase('generating');
    setProgress('Building slide structure with AI...');
    try {
      const structure = await buildSlideStructure(topic, carouselType, slideCount, brandName);
      setSlides(structure.map((s, i) => ({ index: i, title: s.title, body: s.body, imageUrl: '', generating: false })));
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
    if (brandRef.uploading || styleRef.uploading) { toast.error('Wait for references to upload'); return; }

    setPhase('generating');
    const plt = PLATFORMS.find((p) => p.key === platform)!;
    const sty = VISUAL_STYLES.find((s) => s.key === visualStyle)!;
    const refs = [brandRef.url, styleRef.url].filter(Boolean);

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      setSlides((prev) => prev.map((s) => s.index === i ? { ...s, generating: true } : s));
      setProgress(`Generating slide ${i + 1} of ${slides.length}...`);
      try {
        const prompt = await buildSlidePrompt(
          slide.title, slide.body, i, slides.length, topic,
          sty.label, brandName, i === 0, i === slides.length - 1, refs.length > 0,
        );
        const inputPayload: Record<string, unknown> = {
          prompt, aspect_ratio: plt.ratio, resolution, output_format: 'png',
          negative_prompt: 'low quality, blurry, watermark, inconsistent style, amateur',
          multi_shots: false,
        };
        if (refs.length > 0) { inputPayload.image_input = refs; inputPayload.reference_images = refs; }

        const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) throw new Error('No task ID');
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
        const imageUrl = urls[0] || '';
        setSlides((prev) => prev.map((s) => s.index === i ? { ...s, imageUrl, generating: false } : s));

        if (user && imageUrl) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, imageUrl);
            await supabase.from('media_assets').insert({
              id: assetId, user_id: user.id, type: 'image',
              title: `Carousel: ${topic.slice(0, 40)} — Slide ${i + 1}`,
              prompt, provider: 'kie_ai', status: 'completed',
              result_url: uploaded?.publicUrl || imageUrl,
              storage_path: uploaded?.path || null, file_size: uploaded?.size || 0,
              metadata: { source: 'carousel_builder', model: MODEL, platform, visualStyle, slideIndex: i, totalSlides: slides.length },
            });
          } catch { /* non-critical */ }
        }
      } catch (err) {
        setSlides((prev) => prev.map((s) => s.index === i ? { ...s, generating: false } : s));
        toast.error(`Slide ${i + 1} failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
    setPhase('done');
    setProgress('');
    toast.success(`${slides.length}-slide carousel generated!`);
  };

  const handleRegenerateSlide = async (slideIndex: number) => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) return;
    const slide = slides[slideIndex];
    const plt = PLATFORMS.find((p) => p.key === platform)!;
    const sty = VISUAL_STYLES.find((s) => s.key === visualStyle)!;
    const refs = [brandRef.url, styleRef.url].filter(Boolean);
    setSlides((prev) => prev.map((s) => s.index === slideIndex ? { ...s, generating: true } : s));
    try {
      const prompt = await buildSlidePrompt(
        slide.title, slide.body, slideIndex, slides.length, topic,
        sty.label, brandName, slideIndex === 0, slideIndex === slides.length - 1, refs.length > 0,
      );
      const inputPayload: Record<string, unknown> = {
        prompt, aspect_ratio: plt.ratio, resolution, output_format: 'png',
        negative_prompt: 'low quality, blurry, watermark, inconsistent style',
        multi_shots: false,
      };
      if (refs.length > 0) { inputPayload.image_input = refs; inputPayload.reference_images = refs; }
      const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
      const taskId = extractTaskId(taskData);
      if (!taskId) throw new Error('No task ID');
      const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
      setSlides((prev) => prev.map((s) => s.index === slideIndex ? { ...s, imageUrl: urls[0] || '', generating: false } : s));
      toast.success(`Slide ${slideIndex + 1} regenerated`);
    } catch (err) {
      setSlides((prev) => prev.map((s) => s.index === slideIndex ? { ...s, generating: false } : s));
      toast.error(`Regen failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
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
          <p className="text-xs font-bold text-white">Carousel Builder · Nano Banana Pro</p>
          <p className="text-[10px] text-gray-500">AI structures slides · Generates each frame individually · Brand-consistent series</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
          <Lock className="w-2.5 h-2.5 text-[#F1C40F]" />
          <span className="text-[9px] font-bold text-[#F1C40F]">LOCKED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Carousel Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="5 habits that doubled our agency revenue in 2024"
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Brand Name (optional)</label>
                <input
                  type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Company"
                  className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Slide Count</label>
                <div className="flex gap-1 flex-wrap">
                  {SLIDE_COUNTS.map((c) => (
                    <button
                      key={c} onClick={() => setSlideCount(c)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        slideCount === c
                          ? 'bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/30'
                          : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Carousel Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CAROUSEL_TYPES.map((t) => (
                <button
                  key={t.key} onClick={() => setCarouselType(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
                    carouselType === t.key
                      ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                      : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                  }`}
                >
                  <span className="text-base leading-none">{t.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-tight">{t.label}</p>
                    <p className="text-[9px] text-gray-600 truncate">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Visual Style</label>
            <div className="grid grid-cols-3 gap-2">
              {VISUAL_STYLES.map((s) => (
                <button
                  key={s.key} onClick={() => setVisualStyle(s.key)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    visualStyle === s.key
                      ? 'border-[#F1C40F]/60 bg-[#F1C40F]/10 text-white'
                      : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: s.color }} />
                  <p className="text-[10px] font-semibold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Platform</label>
              <div className="flex flex-col gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key} onClick={() => setPlatform(p.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                      platform === p.key
                        ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                        : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-[9px] text-gray-600">{p.ratio}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Resolution</label>
              <div className="flex flex-col gap-1.5">
                {[{key:'1K',label:'1K',desc:'Fast'},{key:'2K',label:'2K',desc:'HD'},{key:'4K',label:'4K',desc:'Print'}].map((r) => (
                  <button
                    key={r.key} onClick={() => setResolution(r.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                      resolution === r.key
                        ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                        : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">{r.label}</span>
                    <span className="text-[9px] text-gray-600">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Brand References</label>
              <span className="text-[10px] text-gray-600">Injected into all slides</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['brand', 'style'] as const).map((type) => {
                const ref = type === 'brand' ? brandRef : styleRef;
                const labelText = type === 'brand' ? 'Brand / Logo' : 'Style Reference';
                return (
                  <div key={type}>
                    <input
                      type="file" accept="image/*" className="hidden"
                      ref={(el) => fileInputRefs.current.set(type, el)}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(type, f); e.target.value = ''; }}
                    />
                    {ref.preview ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                        <img src={ref.preview} alt={labelText} className="w-full h-full object-cover" />
                        {ref.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                        {ref.url && !ref.uploading && (
                          <div className="absolute top-1 left-1">
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30">
                              <Check className="w-2 h-2" /> Ready
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => clearRef(type)}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                        <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/80 bg-black/50 py-0.5">{labelText}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current.get(type)?.click()}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1"
                      >
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-[10px] text-gray-600">{labelText}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {phase === 'setup' ? (
            <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F1C40F]/10 flex items-center justify-center mb-4">
                <LayoutGrid className="w-7 h-7 text-[#F1C40F]/40" />
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">Configure your carousel</p>
              <p className="text-xs text-gray-600 mb-6 max-w-[240px]">AI builds the slide structure, then Nano Banana Pro generates each frame with brand consistency</p>
              <button
                onClick={handleBuildStructure}
                disabled={!topic.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20"
              >
                <Sparkles className="w-4 h-4" /> Build Slide Structure
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Slide Preview</h4>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">{completedCount}/{slides.length} done</span>
                  {phase === 'preview' && (
                    <button
                      onClick={handleBuildStructure}
                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Rebuild
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {slides.map((slide, i) => (
                  <button
                    key={i} onClick={() => setActiveSlide(i)}
                    className={`flex-shrink-0 w-12 rounded-lg overflow-hidden border-2 transition-all ${activeSlide === i ? 'border-[#F1C40F]' : 'border-white/10'}`}
                  >
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt={`Slide ${i + 1}`} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-dark-800 flex items-center justify-center">
                        {slide.generating
                          ? <Loader2 className="w-3 h-3 text-[#F1C40F] animate-spin" />
                          : <span className="text-[9px] text-gray-600 font-bold">{i + 1}</span>
                        }
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
                      <button
                        onClick={() => setActiveSlide((p) => Math.max(0, p - 1))}
                        disabled={activeSlide === 0}
                        className="p-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-gray-500 w-10 text-center">{activeSlide + 1}/{slides.length}</span>
                      <button
                        onClick={() => setActiveSlide((p) => Math.min(slides.length - 1, p + 1))}
                        disabled={activeSlide === slides.length - 1}
                        className="p-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {currentSlide.imageUrl ? (
                    <div className="group relative rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={currentSlide.imageUrl} alt={currentSlide.title}
                        className={`w-full object-cover ${plt.ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={currentSlide.imageUrl} download={`slide-${activeSlide + 1}.png`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <button
                          onClick={() => handleRegenerateSlide(activeSlide)}
                          disabled={currentSlide.generating}
                          className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Redo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full bg-dark-800/60 border border-white/5 rounded-xl flex items-center justify-center ${plt.ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}>
                      {currentSlide.generating
                        ? <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#F1C40F] animate-spin" /><p className="text-xs text-gray-500">Generating...</p></div>
                        : <div className="flex flex-col items-center gap-2"><LayoutGrid className="w-8 h-8 text-gray-700" /><p className="text-xs text-gray-600">Not yet generated</p></div>
                      }
                    </div>
                  )}
                </div>
              )}

              {phase === 'preview' && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleGenerateAll}
                    disabled={!topic.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> Generate All {slideCount} Slides
                  </button>
                  <p className="text-[10px] text-gray-600 text-center">Each slide generated individually with Nano Banana Pro</p>
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
              <h4 className="text-sm font-semibold text-white">{slides.length}-Slide Carousel Complete</h4>
            </div>
            <button
              onClick={() => { setPhase('setup'); setSlides([]); setTopic(''); }}
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-dark-800 border border-white/10"
            >
              New Carousel
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {slides.filter((s) => s.imageUrl).map((slide, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10">
                <img src={slide.imageUrl} alt={`Slide ${i + 1}`} className="w-full aspect-square object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
                  <p className="text-[8px] text-white/80 font-medium truncate">{slide.title}</p>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={slide.imageUrl} download={`slide-${i + 1}.png`} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 text-center">All slides saved to Media Gallery automatically</p>
        </div>
      )}
    </div>
  );
}
