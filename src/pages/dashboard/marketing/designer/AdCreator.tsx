import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Upload, X, Lock, Zap, Check,
  Target, RefreshCw, Image as ImageIcon, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import { kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';
import { callGeminiFlash } from '../../../../lib/ai/gemini';

const MODEL = 'nano-banana-pro';

const AD_PLATFORMS = [
  { key: 'ig_feed',    label: 'Instagram Feed',   ratio: '1:1',  desc: '1080×1080', icon: '📸' },
  { key: 'ig_story',   label: 'Instagram Story',  ratio: '9:16', desc: '1080×1920', icon: '📱' },
  { key: 'fb_feed',    label: 'Facebook Feed',    ratio: '4:3',  desc: '1200×900',  icon: '📘' },
  { key: 'linkedin',   label: 'LinkedIn Sponsored',ratio: '16:9',desc: '1200×628',  icon: '💼' },
  { key: 'youtube',    label: 'YouTube Pre-roll',  ratio: '16:9', desc: '1280×720', icon: '▶️' },
  { key: 'google_display',label: 'Google Display', ratio: '4:3', desc: '300×250',   icon: '🔍' },
  { key: 'twitter',    label: 'X (Twitter)',       ratio: '16:9', desc: '1600×900', icon: '🐦' },
  { key: 'pinterest',  label: 'Pinterest',         ratio: '2:3',  desc: '1000×1500',icon: '📌' },
];

const AD_OBJECTIVES = [
  { key: 'sales',      label: 'Sales',          icon: '🛒', desc: 'Drive purchase' },
  { key: 'awareness',  label: 'Awareness',      icon: '👁️', desc: 'Brand visibility' },
  { key: 'leads',      label: 'Lead Gen',       icon: '📞', desc: 'Capture contacts' },
  { key: 'app',        label: 'App Install',    icon: '📥', desc: 'Mobile downloads' },
  { key: 'engagement', label: 'Engagement',     icon: '💬', desc: 'Likes & shares' },
  { key: 'traffic',    label: 'Traffic',        icon: '🌐', desc: 'Website visits' },
];

const AD_STYLES = [
  { key: 'cinematic',    label: 'Cinematic Product', desc: 'Dramatic, film-grade' },
  { key: 'minimal',      label: 'Clean Minimal',     desc: 'White space, elegant' },
  { key: 'bold',         label: 'Bold & Direct',     desc: 'High impact, urgent' },
  { key: 'lifestyle',    label: 'Lifestyle Photo',   desc: 'Real-world context' },
  { key: 'luxury',       label: 'Luxury Premium',    desc: 'Dark tones, gold' },
  { key: 'social_proof', label: 'Social Proof',      desc: 'Testimonial style' },
  { key: 'announcement', label: 'Announcement',      desc: 'Launch, offer reveal' },
  { key: 'ugc',          label: 'UGC Native',        desc: 'Organic, authentic' },
];

const VARIANT_COUNTS = [1, 2, 3];

interface RefImage {
  id: string;
  label: string;
  preview: string;
  url: string;
  uploading: boolean;
  file: File | null;
}

interface AdVariant {
  index: number;
  prompt: string;
  imageUrl: string;
  generating: boolean;
}

async function buildAdPrompt(
  productDesc: string,
  platformLabel: string,
  platformRatio: string,
  objectiveLabel: string,
  adStyleLabel: string,
  adStyleDesc: string,
  headline: string,
  offer: string,
  targetAudience: string,
  variantIndex: number,
  totalVariants: number,
  hasProductRef: boolean,
  hasBrandRef: boolean,
): Promise<string> {
  const variantDirective = totalVariants > 1
    ? `A/B VARIANT ${variantIndex + 1} OF ${totalVariants}:
Each variant must be visually DISTINCT while sharing brand identity and core message.
- Variant 1: Primary hero treatment — product/service as undeniable focal point
- Variant 2: Lifestyle/contextual treatment — product in use or environment-driven
- Variant 3: Emotion/outcome treatment — focus on the transformation or result
This is Variant ${variantIndex + 1} — apply the corresponding visual approach above.`
    : 'Single creative — execute the strongest possible visual treatment for maximum conversion.';

  const sys = `You are a legendary advertising creative director and performance marketing expert with $500M+ in managed ad spend. You specialize in AI-generated ad creatives that outperform human-designed ads on click-through rate and conversion.

You are writing prompts for Nano Banana Pro (Gemini 3 Pro), a world-class image generation model.

CAMPAIGN BRIEF:
- Product/Service: ${productDesc}
- Platform: ${platformLabel} (${platformRatio} aspect ratio)
- Campaign Objective: ${objectiveLabel}
- Creative Style: ${adStyleLabel} — ${adStyleDesc}
${headline ? `- Primary Headline: "${headline}"` : ''}
${offer ? `- Offer/CTA: "${offer}"` : ''}
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}

${variantDirective}

MASTER AD CREATIVE FRAMEWORK:

[VISUAL HIERARCHY — F-PATTERN / Z-PATTERN]
Design for the viewer's natural eye scan path. Primary attention anchor at top-left or top-center. Hero product/element dominates 60-70% of visual weight. Supporting elements in secondary zones. CTA area clearly reserved at bottom with contrast background treatment.

[HERO ELEMENT TREATMENT]
${hasProductRef ? 'CRITICAL: Product reference image attached — reproduce the EXACT product with pixel-perfect accuracy: identical colors, proportions, branding text, packaging details. No artistic license on product representation. Integrate it photorealistically into the scene.' : `Create the most compelling visual representation of: ${productDesc}. Make it aspirational, desirable, and directly relevant to ${targetAudience || 'the target audience'}.`}

[PLATFORM-NATIVE DESIGN PRINCIPLES — ${platformLabel}]
Optimize for ${platformLabel} feed behavior: thumb-stopping first frame, native-feeling (not obviously ad-like unless style requires), platform color temperature. Design for both sound-off and sound-on experiences (visual clarity without audio dependency).

[LIGHTING ARCHITECTURE]
Specify professional lighting setup: key light position and quality (softbox/ring/natural/neon), fill light ratio (1:2 to 1:8), rim light for product separation, color temperature in Kelvin (2700K warm to 6500K cool), specular highlights on product surfaces.

[COLOR PSYCHOLOGY FOR ${objectiveLabel.toUpperCase()}]
- Primary color: emotionally aligned with ${objectiveLabel} objective
- Accent color: contrast ratio minimum 4.5:1 against CTA elements
- Background: serves product, doesn't compete
- Color temperature: consistent throughout scene
${hasBrandRef ? '- BRAND COLORS: Extract exact palette from brand reference image. Apply as the definitive color system.' : ''}

[TYPOGRAPHY SAFE ZONES]
${headline ? `Reserve prominent space for headline "${headline}" — specify exact screen position, background treatment for legibility, and contrast ratio.` : 'Reserve clean zones for text overlay post-production.'}
${offer ? `CTA "${offer}" — design a visual "landing pad": contrasting shape, color, or negative space where this text will appear irresistibly clickable.` : ''}

[CONVERSION PSYCHOLOGY ELEMENTS]
- Visual urgency cues if applicable: scarcity framing, time-limited feel
- Social proof integration zone if style supports it
- Benefit visualization over feature display
- Emotional aspiration: show the OUTCOME, not just the product

[TECHNICAL EXCELLENCE]
Ultra-photorealistic. Award-winning commercial advertising photography. Zero compression artifacts. Tack-sharp hero element. Professional color grading with LUT-quality consistency. Nano Banana Pro optimized. 8K commercial output quality.

Write ONE continuous image generation prompt — no headers, no bullets, no structure markers, no explanations. This is a raw AI image prompt. Maximum 320 words. Make it the definitive prompt for this ad creative.`;

  try {
    const result = await callGeminiFlash(sys, `ad_creator_variant_${variantIndex}`);
    return result.trim() || `Professional ${adStyleLabel} ad for ${productDesc}. ${platformLabel} optimized. Ultra-HD commercial quality.`;
  } catch {
    return `Professional ${adStyleLabel} ad for ${productDesc}. ${platformLabel} optimized. Ultra-HD commercial quality.`;
  }
}

export default function AdCreator() {
  const { user } = useAuth();
  const productFileRef = useRef<HTMLInputElement | null>(null);
  const brandFileRef = useRef<HTMLInputElement | null>(null);
  const extraFileRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const [productDesc, setProductDesc] = useState('');
  const [headline, setHeadline] = useState('');
  const [offer, setOffer] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [adPlatform, setAdPlatform] = useState('ig_feed');
  const [objective, setObjective] = useState('sales');
  const [adStyle, setAdStyle] = useState('cinematic');
  const [variantCount, setVariantCount] = useState(2);
  const [resolution, setResolution] = useState('2K');

  const [productRef, setProductRef] = useState<RefImage>({ id: 'product', label: 'Product Image', preview: '', url: '', uploading: false, file: null });
  const [brandRef, setBrandRef] = useState<RefImage>({ id: 'brand', label: 'Brand / Logo', preview: '', url: '', uploading: false, file: null });

  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);

  const uploadRef = async (type: 'product' | 'brand', file: File) => {
    if (!user) { toast.error('Sign in to upload references'); return; }
    const setter = type === 'product' ? setProductRef : setBrandRef;
    setter((prev) => ({ ...prev, file, preview: URL.createObjectURL(file), uploading: true, url: '' }));
    try {
      const result = await uploadMediaToStorage(user.id, `ad-ref-${type}-${crypto.randomUUID()}`, file, file.type);
      if (!result?.publicUrl) throw new Error('Upload failed');
      setter((prev) => ({ ...prev, url: result.publicUrl, uploading: false }));
    } catch {
      setter((prev) => ({ ...prev, uploading: false }));
      toast.error(`${type} upload failed`);
    }
  };

  const clearRef = (type: 'product' | 'brand') => {
    const setter = type === 'product' ? setProductRef : setBrandRef;
    setter((prev) => ({ ...prev, preview: '', url: '', file: null, uploading: false }));
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!productDesc.trim()) { toast.error('Describe your product or service'); return; }
    if (productRef.uploading || brandRef.uploading) { toast.error('Wait for uploads to complete'); return; }

    setGenerating(true);
    setVariants([]);

    const plt = AD_PLATFORMS.find((p) => p.key === adPlatform)!;
    const obj = AD_OBJECTIVES.find((o) => o.key === objective)!;
    const sty = AD_STYLES.find((s) => s.key === adStyle)!;
    const refs = [productRef.url, brandRef.url].filter(Boolean);

    const initialVariants: AdVariant[] = Array.from({ length: variantCount }, (_, i) => ({
      index: i, prompt: '', imageUrl: '', generating: true,
    }));
    setVariants(initialVariants);

    for (let i = 0; i < variantCount; i++) {
      try {
        const prompt = await buildAdPrompt(
          productDesc, plt.label, plt.ratio, obj.label, sty.label, sty.desc,
          headline, offer, targetAudience, i, variantCount,
          !!productRef.url, !!brandRef.url,
        );

        setVariants((prev) => prev.map((v) => v.index === i ? { ...v, prompt } : v));

        const inputPayload: Record<string, unknown> = {
          prompt, aspect_ratio: plt.ratio, resolution, output_format: 'png',
          negative_prompt: 'low quality, blurry, pixelated, watermark, amateur, distorted, text errors',
          multi_shots: false,
        };
        if (refs.length > 0) {
          inputPayload.image_input = refs;
          inputPayload.reference_images = refs;
          if (productRef.url) { inputPayload.product_image = productRef.url; inputPayload.subject_image = productRef.url; }
          if (brandRef.url) { inputPayload.style_image = brandRef.url; }
        }

        const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) throw new Error('No task ID');
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
        const imageUrl = urls[0] || '';

        setVariants((prev) => prev.map((v) => v.index === i ? { ...v, imageUrl, generating: false } : v));

        if (user && imageUrl) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, imageUrl);
            await supabase.from('media_assets').insert({
              id: assetId, user_id: user.id, type: 'image',
              title: `Ad: ${productDesc.slice(0, 50)} — Variant ${i + 1}`,
              prompt, provider: 'kie_ai', status: 'completed',
              result_url: uploaded?.publicUrl || imageUrl,
              storage_path: uploaded?.path || null, file_size: uploaded?.size || 0,
              metadata: { source: 'ad_creator', model: MODEL, adPlatform, objective, adStyle, variant: i + 1, totalVariants: variantCount },
            });
          } catch { /* non-critical */ }
        }
      } catch (err) {
        setVariants((prev) => prev.map((v) => v.index === i ? { ...v, generating: false } : v));
        toast.error(`Variant ${i + 1} failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    setGenerating(false);
    toast.success(`${variantCount} ad variant${variantCount > 1 ? 's' : ''} generated!`);
  };

  const handleRegenerateVariant = async (idx: number) => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) return;
    const plt = AD_PLATFORMS.find((p) => p.key === adPlatform)!;
    const obj = AD_OBJECTIVES.find((o) => o.key === objective)!;
    const sty = AD_STYLES.find((s) => s.key === adStyle)!;
    const refs = [productRef.url, brandRef.url].filter(Boolean);
    setVariants((prev) => prev.map((v) => v.index === idx ? { ...v, generating: true } : v));
    try {
      const prompt = await buildAdPrompt(
        productDesc, plt.label, plt.ratio, obj.label, sty.label, sty.desc,
        headline, offer, targetAudience, idx, variantCount, !!productRef.url, !!brandRef.url,
      );
      const inputPayload: Record<string, unknown> = {
        prompt, aspect_ratio: plt.ratio, resolution, output_format: 'png',
        negative_prompt: 'low quality, blurry, watermark, amateur',
        multi_shots: false,
      };
      if (refs.length > 0) {
        inputPayload.image_input = refs; inputPayload.reference_images = refs;
        if (productRef.url) { inputPayload.product_image = productRef.url; inputPayload.subject_image = productRef.url; }
        if (brandRef.url) { inputPayload.style_image = brandRef.url; }
      }
      const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
      const taskId = extractTaskId(taskData);
      if (!taskId) throw new Error('No task ID');
      const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll);
      setVariants((prev) => prev.map((v) => v.index === idx ? { ...v, prompt, imageUrl: urls[0] || '', generating: false } : v));
      toast.success(`Variant ${idx + 1} regenerated`);
    } catch (err) {
      setVariants((prev) => prev.map((v) => v.index === idx ? { ...v, generating: false } : v));
      toast.error(`Regen failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const plt = AD_PLATFORMS.find((p) => p.key === adPlatform)!;
  const currentVariant = variants[activeVariant];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 border border-[#F1C40F]/20">
          <div className="w-7 h-7 rounded-lg bg-[#F1C40F]/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#F1C40F]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Ad Creator · Nano Banana Pro</p>
            <p className="text-[10px] text-gray-500">Platform-specific · A/B variants · Conversion-optimized creatives</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
            <Lock className="w-2.5 h-2.5 text-[#F1C40F]" />
            <span className="text-[9px] font-bold text-[#F1C40F]">LOCKED</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Product / Service</label>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            rows={2}
            placeholder="AI-powered CRM software for B2B sales teams — saves 3 hours/day, automates follow-ups"
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Ad Headline</label>
              <input
                type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
                placeholder="Close 2x More Deals"
                className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Offer / CTA</label>
              <input
                type="text" value={offer} onChange={(e) => setOffer(e.target.value)}
                placeholder="Start Free Trial"
                className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Target Audience</label>
            <input
              type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="B2B sales managers, 30-50, tech-savvy, SMB owners"
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Ad Platform</label>
          <div className="grid grid-cols-2 gap-1.5">
            {AD_PLATFORMS.map((p) => (
              <button
                key={p.key} onClick={() => setAdPlatform(p.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
                  adPlatform === p.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold leading-tight truncate">{p.label}</p>
                  <p className="text-[9px] text-gray-600">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Campaign Objective</label>
          <div className="grid grid-cols-3 gap-1.5">
            {AD_OBJECTIVES.map((o) => (
              <button
                key={o.key} onClick={() => setObjective(o.key)}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                  objective === o.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-lg leading-none mb-1">{o.icon}</span>
                <p className="text-[10px] font-semibold leading-tight">{o.label}</p>
                <p className="text-[8px] text-gray-600 mt-0.5">{o.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Ad Style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {AD_STYLES.map((s) => (
              <button
                key={s.key} onClick={() => setAdStyle(s.key)}
                className={`px-3 py-2.5 rounded-xl text-left border transition-all ${
                  adStyle === s.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-[11px] font-semibold">{s.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Reference Images</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['product', 'brand'] as const).map((type) => {
              const ref = type === 'product' ? productRef : brandRef;
              const fileRef = type === 'product' ? productFileRef : brandFileRef;
              return (
                <div key={type}>
                  <input
                    type="file" accept="image/*" className="hidden"
                    ref={fileRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRef(type, f); e.target.value = ''; }}
                  />
                  {ref.preview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                      <img src={ref.preview} alt={ref.label} className="w-full h-full object-cover" />
                      {ref.uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                      {ref.url && !ref.uploading && (
                        <div className="absolute top-1 left-1">
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30">
                            <Check className="w-2 h-2" /> Ready
                          </span>
                        </div>
                      )}
                      <button onClick={() => clearRef(type)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/80 bg-black/50 py-0.5">{ref.label}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1"
                    >
                      <Upload className="w-4 h-4 text-gray-600" />
                      <span className="text-[10px] text-gray-600">{ref.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] text-gray-500 font-medium">A/B Variants</label>
          </div>
          <div className="flex gap-2">
            {VARIANT_COUNTS.map((c) => (
              <button
                key={c} onClick={() => setVariantCount(c)}
                className={`flex-1 py-2.5 rounded-xl border text-center transition-all ${
                  variantCount === c
                    ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                    : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-sm font-bold">{c}</p>
                <p className="text-[9px] text-gray-500">{c === 1 ? 'Creative' : 'Variants'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Resolution</label>
          <div className="flex gap-2">
            {[{key:'1K',label:'1K',desc:'Fast'},{key:'2K',label:'2K',desc:'HD'},{key:'4K',label:'4K',desc:'Print'}].map((r) => (
              <button
                key={r.key} onClick={() => setResolution(r.key)}
                className={`flex-1 py-2 rounded-xl border text-center transition-all ${
                  resolution === r.key
                    ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                    : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-sm font-bold">{r.label}</p>
                <p className="text-[9px] text-gray-500">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !productDesc.trim() || productRef.uploading || brandRef.uploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20 active:scale-[0.99]"
        >
          {generating
            ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Generating {variantCount} variant{variantCount > 1 ? 's' : ''}...</span></>
            : <><Target className="w-5 h-5" /> Generate {variantCount > 1 ? `${variantCount} Ad Variants` : 'Ad Creative'}</>
          }
        </button>
      </div>

      <div className="xl:col-span-3 space-y-4">
        {variants.length > 0 ? (
          <>
            {variantCount > 1 && (
              <div className="flex items-center gap-2">
                {variants.map((v, i) => (
                  <button
                    key={i} onClick={() => setActiveVariant(i)}
                    className={`flex-1 py-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                      activeVariant === i
                        ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                        : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {v.generating
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : v.imageUrl
                        ? <Check className="w-3 h-3 text-emerald-400" />
                        : <div className="w-2 h-2 rounded-full bg-gray-600" />
                      }
                      Variant {i + 1}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentVariant && (
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#F1C40F]" />
                    <h4 className="text-sm font-semibold">
                      {variantCount > 1 ? `Variant ${currentVariant.index + 1}` : 'Ad Creative'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/20">
                      {plt.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{plt.ratio} · {resolution}</span>
                </div>

                {currentVariant.imageUrl ? (
                  <>
                    <div className="group relative rounded-xl overflow-hidden border border-white/10 mb-4">
                      <img
                        src={currentVariant.imageUrl}
                        alt={`Ad variant ${currentVariant.index + 1}`}
                        className={`w-full object-cover ${
                          plt.ratio === '9:16' || plt.ratio === '2:3' ? 'aspect-[9/16]'
                          : plt.ratio === '1:1' ? 'aspect-square'
                          : 'aspect-video'
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={currentVariant.imageUrl} download={`ad-variant-${currentVariant.index + 1}.png`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <button
                          onClick={() => handleRegenerateVariant(currentVariant.index)}
                          className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </button>
                      </div>
                    </div>

                    {currentVariant.prompt && (
                      <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-[#F1C40F]" />
                          <span className="text-[10px] text-[#F1C40F]">Gemini-enhanced ad prompt</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3">{currentVariant.prompt}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-full bg-dark-800/60 border border-white/5 rounded-xl flex items-center justify-center ${plt.ratio === '9:16' ? 'aspect-[9/16]' : plt.ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`}>
                    {currentVariant.generating
                      ? <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#F1C40F] animate-spin" /><p className="text-xs text-gray-500">Generating ad...</p></div>
                      : <div className="flex flex-col items-center gap-2"><ImageIcon className="w-8 h-8 text-gray-700" /><p className="text-xs text-gray-600">Waiting to generate</p></div>
                    }
                  </div>
                )}
              </div>
            )}

            {variantCount > 1 && variants.every((v) => v.imageUrl) && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">All Variants</h4>
                <div className="grid grid-cols-3 gap-2">
                  {variants.map((v, i) => (
                    <button key={i} onClick={() => setActiveVariant(i)} className={`relative rounded-xl overflow-hidden border-2 transition-all ${activeVariant === i ? 'border-[#F1C40F]' : 'border-white/10 hover:border-white/30'}`}>
                      <img src={v.imageUrl} alt={`Variant ${i + 1}`} className="w-full aspect-square object-cover" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white">V{i + 1}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center h-80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1C40F]/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-[#F1C40F]/40" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Your ad creatives will appear here</p>
            <p className="text-xs text-gray-600 mt-1">Configure your campaign and click Generate</p>
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1C40F]/5 border border-[#F1C40F]/10">
              <Zap className="w-3 h-3 text-[#F1C40F]/60" />
              <span className="text-[10px] text-[#F1C40F]/60">Conversion-optimized · Platform-native · A/B ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
