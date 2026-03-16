import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, Upload, X, Lock, Zap, Check,
  Box, RefreshCw, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import { kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';
import { callGeminiFlash } from '../../../../lib/ai/gemini';

const MODEL = 'nano-banana-pro';

const MOCKUP_CATEGORIES = [
  { key: 'devices',     label: 'Devices',        icon: '📱', desc: 'Phone, tablet, laptop, TV' },
  { key: 'apparel',     label: 'Apparel',         icon: '👕', desc: 'T-shirt, hoodie, cap' },
  { key: 'packaging',   label: 'Packaging',       icon: '📦', desc: 'Box, bottle, bag, label' },
  { key: 'print',       label: 'Print & Frames',  icon: '🖼️', desc: 'Canvas, poster, billboard' },
  { key: 'stationery',  label: 'Stationery',      icon: '📝', desc: 'Card, notebook, letterhead' },
  { key: 'merchandise', label: 'Merchandise',     icon: '☕', desc: 'Mug, tote, bag, pen' },
  { key: 'signage',     label: 'Signage',         icon: '🏢', desc: 'Storefront, banner, vehicle' },
  { key: 'digital',     label: 'Digital',         icon: '🖥️', desc: 'Website, app, UI screen' },
];

const MOCKUP_ITEMS: Record<string, { key: string; label: string; ratio: string }[]> = {
  devices: [
    { key: 'iphone_15_pro', label: 'iPhone 15 Pro', ratio: '9:16' },
    { key: 'samsung_s24',   label: 'Samsung S24',   ratio: '9:16' },
    { key: 'macbook_pro',   label: 'MacBook Pro',   ratio: '16:9' },
    { key: 'ipad_pro',      label: 'iPad Pro',      ratio: '4:3' },
    { key: 'desktop_monitor',label:'Desktop Monitor',ratio: '16:9' },
    { key: 'apple_watch',   label: 'Apple Watch',   ratio: '1:1' },
    { key: 'tv_screen',     label: 'Smart TV',      ratio: '16:9' },
    { key: 'airpods_case',  label: 'AirPods Case',  ratio: '1:1' },
  ],
  apparel: [
    { key: 'tshirt_front',  label: 'T-shirt Front', ratio: '3:4' },
    { key: 'tshirt_back',   label: 'T-shirt Back',  ratio: '3:4' },
    { key: 'hoodie',        label: 'Hoodie',        ratio: '3:4' },
    { key: 'cap',           label: 'Baseball Cap',  ratio: '4:3' },
    { key: 'polo_shirt',    label: 'Polo Shirt',    ratio: '3:4' },
    { key: 'jacket',        label: 'Jacket',        ratio: '3:4' },
  ],
  packaging: [
    { key: 'product_box',   label: 'Product Box',   ratio: '4:3' },
    { key: 'bottle',        label: 'Bottle Label',  ratio: '3:4' },
    { key: 'paper_bag',     label: 'Paper Bag',     ratio: '3:4' },
    { key: 'food_pack',     label: 'Food Packaging',ratio: '4:3' },
    { key: 'cosmetic_tube', label: 'Cosmetic Tube', ratio: '3:4' },
    { key: 'tin_can',       label: 'Tin Can',       ratio: '3:4' },
  ],
  print: [
    { key: 'canvas_print',  label: 'Canvas Print',  ratio: '4:3' },
    { key: 'framed_poster', label: 'Framed Poster', ratio: '3:4' },
    { key: 'billboard',     label: 'Billboard',     ratio: '16:9' },
    { key: 'roll_up',       label: 'Roll-Up Banner',ratio: '3:4' },
    { key: 'flyer',         label: 'Flyer / Leaflet',ratio: '3:4' },
  ],
  stationery: [
    { key: 'business_card', label: 'Business Card', ratio: '16:9' },
    { key: 'letterhead',    label: 'Letterhead A4', ratio: '3:4' },
    { key: 'notebook',      label: 'Notebook',      ratio: '3:4' },
    { key: 'envelope',      label: 'Envelope',      ratio: '16:9' },
  ],
  merchandise: [
    { key: 'mug',           label: 'Ceramic Mug',   ratio: '4:3' },
    { key: 'tote_bag',      label: 'Tote Bag',      ratio: '3:4' },
    { key: 'water_bottle',  label: 'Water Bottle',  ratio: '3:4' },
    { key: 'pen',           label: 'Branded Pen',   ratio: '4:3' },
  ],
  signage: [
    { key: 'storefront',    label: 'Storefront Sign', ratio: '4:3' },
    { key: 'banner_stand',  label: 'Banner Stand',    ratio: '3:4' },
    { key: 'vehicle_wrap',  label: 'Vehicle Wrap',    ratio: '16:9' },
  ],
  digital: [
    { key: 'website_hero',  label: 'Website Hero',    ratio: '16:9' },
    { key: 'app_screen',    label: 'App Screen',      ratio: '9:16' },
    { key: 'dashboard_ui',  label: 'Dashboard UI',    ratio: '16:9' },
    { key: 'social_profile',label: 'Social Profile',  ratio: '1:1' },
  ],
};

const ENVIRONMENTS = [
  { key: 'white_studio',  label: 'White Studio',   desc: 'Clean product photography' },
  { key: 'lifestyle',     label: 'Lifestyle',      desc: 'Real-world natural setting' },
  { key: 'office',        label: 'Office',         desc: 'Professional workspace' },
  { key: 'outdoor',       label: 'Outdoor',        desc: 'Natural light, outdoors' },
  { key: 'luxury',        label: 'Luxury',         desc: 'Premium dark background' },
  { key: 'urban',         label: 'Urban Street',   desc: 'City environment' },
  { key: 'tech',          label: 'Tech Minimal',   desc: 'Dark, neon tech aesthetic' },
  { key: 'nature',        label: 'Nature',         desc: 'Organic, earthy tones' },
];

const SHOT_ANGLES = [
  { key: 'front',   label: 'Front',   desc: 'Straight on' },
  { key: 'angle',   label: 'Angle',   desc: '3/4 view' },
  { key: 'top',     label: 'Flat Lay',desc: 'Top down' },
  { key: 'closeup', label: 'Close-up',desc: 'Detail shot' },
  { key: 'lifestyle',label:'In Use',  desc: 'Being used' },
];

async function buildMockupPrompt(
  mockupItemLabel: string,
  categoryLabel: string,
  environmentLabel: string,
  environmentDesc: string,
  shotAngle: string,
  aspectRatio: string,
  brandName: string,
  customDesc: string,
  hasDesignRef: boolean,
  hasBrandRef: boolean,
): Promise<string> {
  const sys = `You are a legendary commercial product photographer, CGI artist, and AI prompt engineer. You have produced product imagery for Fortune 500 brands, shot on Phase One cameras in professional studios, and now specialize in generating photorealistic product mockups using Nano Banana Pro (Gemini 3 Pro).

PRODUCT MOCKUP SPECIFICATIONS:
- Product: ${mockupItemLabel} (${categoryLabel})
- Environment: ${environmentLabel} — ${environmentDesc}
- Shot angle: ${shotAngle}
- Aspect ratio: ${aspectRatio}
${brandName ? `- Brand: ${brandName}` : ''}
${customDesc ? `- Art direction notes: ${customDesc}` : ''}

MASTER MOCKUP PROMPT FRAMEWORK:

[PRODUCT CONSTRUCTION]
Describe the ${mockupItemLabel} with engineering-level precision:
- Exact material: specify finish (matte/gloss/satin/brushed/anodized/cotton/polyester/etc.)
- Surface properties: reflectivity index, texture grain, hardness, translucency
- Structural geometry: edges (sharp/rounded/chamfered), thickness, form factor
- Color of base product if no design: neutral/natural for design placement visibility
- Physical scale and proportions in relation to environment

[DESIGN PLACEMENT — CRITICAL SECTION]
${hasDesignRef
  ? `DESIGN ARTWORK IS ATTACHED — this is the most important directive:
The attached design/artwork/logo MUST appear on the ${mockupItemLabel} surface.
- Apply EXACT perspective distortion matching the ${shotAngle} viewing angle
- Match surface curvature: the design wraps/bends/follows the product's 3D geometry
- Apply correct material interaction: ink absorption on fabric, UV print sheen on rigid surfaces, embossing depth on paper
- Shadow cast FROM the printed area onto surface micro-texture
- Ink/print edges are crisp, not blurred or anti-aliased beyond realistic print tolerance
- The design feels PHYSICALLY PRINTED/APPLIED, never digitally composited or floating
- Maintain 100% design fidelity — same colors, same proportions, same details as reference`
  : `Generate a clean, neutral ${mockupItemLabel} ready for design placement. Surface should be pristine and high-contrast-ready.`}

${hasBrandRef
  ? `BRAND IDENTITY APPLICATION:
Brand reference attached — extract and apply:
- Exact brand color palette (Pantone/hex equivalent from reference)
- Typography system weight and style character
- Brand visual language and decorative motifs
- Apply consistently across all exposed product surfaces`
  : ''}

[LIGHTING SETUP — PROFESSIONAL STUDIO GRADE]
Environment: ${environmentLabel} (${environmentDesc})
- Primary key light: specify position (overhead/45°/rim/natural window), quality (hard/soft/diffused), color temperature in Kelvin
- Fill light: ratio to key (1:2 to 1:4), wrap quality, shadow fill percentage
- Accent/rim light: product separation from background, edge definition
- Specular highlights: position and size on ${mockupItemLabel} surface
- Shadow: type (hard/soft/no shadow), direction, length, opacity
- Ambient occlusion: subtle contact shadows at base/edges

[SHOT COMPOSITION — ${shotAngle.toUpperCase()}]
- Camera position and lens perspective (50mm/85mm/macro equivalent)
- Product placement in frame: center/rule-of-thirds/dynamic
- Depth of field: ${categoryLabel === 'Devices' || categoryLabel === 'Print & Frames' ? 'deep focus for full product sharpness' : 'shallow DOF for subject isolation'}
- Background treatment: ${environmentDesc} — blur amount (f/2.8 to f/8 equivalent)
- Negative space and breathing room

[PHOTOREALISM DIRECTIVES]
- Micro surface imperfections (acceptable): subtle fingerprints on screens, slight fabric weave texture, label edge micro-curl — these add realism
- Zero CGI artifacts: no perfectly uniform lighting, no impossible reflections, no digital compositing signs
- Color science: accurate spectral response, no oversaturation, natural color rendition
- Final output: award-winning commercial product photography, Nano Banana Pro optimized, 8K ultra-HD, suitable for e-commerce hero image or print catalog

Write ONE continuous image generation prompt — no headers, no structure, no explanations. Raw prompt only. Maximum 340 words. Make it indistinguishable from a world-class product photography brief.`;

  try {
    const result = await callGeminiFlash(sys, 'mockup_prompt');
    return result.trim() || `Ultra-realistic ${mockupItemLabel} mockup, ${environmentLabel} environment, ${shotAngle} angle, professional product photography, commercial quality.`;
  } catch {
    return `Ultra-realistic ${mockupItemLabel} mockup, ${environmentLabel} environment, ${shotAngle} angle, professional product photography, commercial quality.`;
  }
}

export default function MockupStudio() {
  const { user } = useAuth();
  const designFileRef = useRef<HTMLInputElement | null>(null);
  const brandFileRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState('devices');
  const [mockupItem, setMockupItem] = useState('iphone_15_pro');
  const [environment, setEnvironment] = useState('white_studio');
  const [shotAngle, setShotAngle] = useState('angle');
  const [brandName, setBrandName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [resolution, setResolution] = useState('2K');
  const [generateCount, setGenerateCount] = useState(2);

  const [designRef, setDesignRef] = useState({ preview: '', url: '', uploading: false, file: null as File | null });
  const [brandRef, setBrandRef] = useState({ preview: '', url: '', uploading: false, file: null as File | null });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [activeResult, setActiveResult] = useState(0);

  const uploadRef = async (type: 'design' | 'brand', file: File) => {
    if (!user) { toast.error('Sign in to upload references'); return; }
    const setter = type === 'design' ? setDesignRef : setBrandRef;
    setter((prev) => ({ ...prev, file, preview: URL.createObjectURL(file), uploading: true, url: '' }));
    try {
      const result = await uploadMediaToStorage(user.id, `mockup-ref-${type}-${crypto.randomUUID()}`, file, file.type);
      if (!result?.publicUrl) throw new Error('Upload failed');
      setter((prev) => ({ ...prev, url: result.publicUrl, uploading: false }));
    } catch {
      setter((prev) => ({ ...prev, uploading: false }));
      toast.error(`${type} upload failed`);
    }
  };

  const clearRef = (type: 'design' | 'brand') => {
    const setter = type === 'design' ? setDesignRef : setBrandRef;
    setter({ preview: '', url: '', uploading: false, file: null });
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (designRef.uploading || brandRef.uploading) { toast.error('Wait for uploads to finish'); return; }

    setGenerating(true);
    setResults([]);
    setEnhancedPrompt('');

    try {
      const cat = MOCKUP_CATEGORIES.find((c) => c.key === category)!;
      const item = MOCKUP_ITEMS[category]?.find((i) => i.key === mockupItem) || MOCKUP_ITEMS[category]?.[0];
      const env = ENVIRONMENTS.find((e) => e.key === environment)!;
      const angle = SHOT_ANGLES.find((a) => a.key === shotAngle)!;
      const refs = [designRef.url, brandRef.url].filter(Boolean);

      setProgress('Building mockup prompt with Gemini...');
      const prompt = await buildMockupPrompt(
        item?.label || mockupItem, cat.label, env.label, env.desc,
        `${angle.label} (${angle.desc})`, item?.ratio || '4:3',
        brandName, customDesc, !!designRef.url, !!brandRef.url,
      );
      setEnhancedPrompt(prompt);

      const generatedUrls: string[] = [];
      for (let i = 0; i < generateCount; i++) {
        setProgress(`Generating mockup ${i + 1} of ${generateCount}...`);
        const inputPayload: Record<string, unknown> = {
          prompt,
          aspect_ratio: item?.ratio || '4:3',
          resolution,
          output_format: 'png',
          negative_prompt: 'floating design, pasted image, flat overlay, low quality, blurry, distorted, amateur, unrealistic materials',
          multi_shots: false,
        };
        if (refs.length > 0) {
          inputPayload.image_input = refs;
          inputPayload.reference_images = refs;
          if (designRef.url) { inputPayload.design_image = designRef.url; inputPayload.subject_image = designRef.url; }
          if (brandRef.url) { inputPayload.style_image = brandRef.url; }
        }

        const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
        const taskId = extractTaskId(taskData);
        if (!taskId) throw new Error(`Mockup ${i + 1}: No task ID`);
        const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll, (m) => setProgress(`${i + 1}/${generateCount}: ${m}`));
        if (urls[0]) generatedUrls.push(urls[0]);
      }

      if (generatedUrls.length === 0) throw new Error('No mockups generated');
      setResults(generatedUrls);
      setActiveResult(0);

      if (user) {
        for (const url of generatedUrls) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, url);
            await supabase.from('media_assets').insert({
              id: assetId, user_id: user.id, type: 'image',
              title: `Mockup: ${item?.label || mockupItem} — ${env.label}`,
              prompt, provider: 'kie_ai', status: 'completed',
              result_url: uploaded?.publicUrl || url,
              storage_path: uploaded?.path || null, file_size: uploaded?.size || 0,
              metadata: { source: 'mockup_studio', model: MODEL, category, mockupItem, environment, shotAngle, resolution },
            });
          } catch { /* non-critical */ }
        }
      }
      toast.success(`${generatedUrls.length} mockup${generatedUrls.length > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const currentItems = MOCKUP_ITEMS[category] || [];
  const currentItem = currentItems.find((i) => i.key === mockupItem) || currentItems[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 border border-[#F1C40F]/20">
          <div className="w-7 h-7 rounded-lg bg-[#F1C40F]/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#F1C40F]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Mockup Studio · Nano Banana Pro</p>
            <p className="text-[10px] text-gray-500">Upload your design · AI places it on any product · Photorealistic output</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
            <Lock className="w-2.5 h-2.5 text-[#F1C40F]" />
            <span className="text-[9px] font-bold text-[#F1C40F]">LOCKED</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Product Category</label>
          <div className="grid grid-cols-2 gap-1.5">
            {MOCKUP_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setCategory(cat.key);
                  const items = MOCKUP_ITEMS[cat.key];
                  if (items?.length) setMockupItem(items[0].key);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
                  category === cat.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight">{cat.label}</p>
                  <p className="text-[9px] text-gray-600 truncate">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Mockup Item</label>
          <div className="grid grid-cols-2 gap-1.5">
            {currentItems.map((item) => (
              <button
                key={item.key} onClick={() => setMockupItem(item.key)}
                className={`px-3 py-2 rounded-xl text-left border transition-all ${
                  mockupItem === item.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-[11px] font-semibold">{item.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{item.ratio}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Environment</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.key} onClick={() => setEnvironment(env.key)}
                className={`px-3 py-2.5 rounded-xl text-left border transition-all ${
                  environment === env.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-[11px] font-semibold">{env.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{env.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Shot Angle</label>
          <div className="flex gap-1.5 flex-wrap">
            {SHOT_ANGLES.map((a) => (
              <button
                key={a.key} onClick={() => setShotAngle(a.key)}
                className={`px-3 py-2 rounded-xl border transition-all text-center ${
                  shotAngle === a.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-[11px] font-semibold">{a.label}</p>
                <p className="text-[9px] text-gray-600">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Design References</label>
          <div className="grid grid-cols-2 gap-2">
            {(['design', 'brand'] as const).map((type) => {
              const ref = type === 'design' ? designRef : brandRef;
              const fileRef = type === 'design' ? designFileRef : brandFileRef;
              const labelText = type === 'design' ? 'Your Design / Art' : 'Brand / Logo';
              return (
                <div key={type}>
                  <input
                    type="file" accept="image/*" className="hidden"
                    ref={fileRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRef(type, f); e.target.value = ''; }}
                  />
                  {ref.preview ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                      <img src={ref.preview} alt={labelText} className="w-full h-full object-cover" />
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
                      <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/80 bg-black/50 py-0.5">{labelText}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-gray-600" />
                      <span className="text-[10px] text-gray-600 text-center leading-tight px-2">{labelText}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Brand Name (optional)</label>
            <input
              type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Brand"
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Custom notes (optional)</label>
            <input
              type="text" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Black colorway, matte finish, autumn leaves background"
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Variations</label>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((c) => (
                  <button key={c} onClick={() => setGenerateCount(c)}
                    className={`flex-1 py-2 rounded-xl border text-center transition-all ${generateCount === c ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white' : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'}`}>
                    <p className="text-sm font-bold">{c}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Resolution</label>
              <div className="flex gap-1.5">
                {[{key:'1K',label:'1K'},{key:'2K',label:'2K'},{key:'4K',label:'4K'}].map((r) => (
                  <button key={r.key} onClick={() => setResolution(r.key)}
                    className={`flex-1 py-2 rounded-xl border text-center transition-all ${resolution === r.key ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white' : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'}`}>
                    <p className="text-sm font-bold">{r.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || designRef.uploading || brandRef.uploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20 active:scale-[0.99]"
        >
          {generating
            ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="truncate max-w-xs text-sm">{progress || 'Generating...'}</span></>
            : <><Box className="w-5 h-5" /> Generate {generateCount > 1 ? `${generateCount} Mockups` : 'Mockup'}</>
          }
        </button>
      </div>

      <div className="xl:col-span-3 space-y-4">
        {enhancedPrompt && !generating && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F1C40F]" />
              <span className="text-xs font-medium text-[#F1C40F]">Gemini-enhanced mockup prompt</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">{enhancedPrompt}</p>
          </div>
        )}

        {results.length > 0 ? (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#F1C40F]" />
                <h4 className="text-sm font-semibold">Mockup Result</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/20">
                  {currentItem?.label}
                </span>
              </div>
              {results.length > 1 && (
                <div className="flex items-center gap-1">
                  {results.map((_, i) => (
                    <button
                      key={i} onClick={() => setActiveResult(i)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        activeResult === i
                          ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                          : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="group relative rounded-xl overflow-hidden border border-white/10 mb-4">
              <img
                src={results[activeResult]}
                alt="Generated mockup"
                className={`w-full object-cover ${
                  currentItem?.ratio === '9:16' || currentItem?.ratio === '3:4' ? 'aspect-[3/4]'
                  : currentItem?.ratio === '1:1' ? 'aspect-square'
                  : 'aspect-video'
                }`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a
                  href={results[activeResult]} download={`mockup-${Date.now()}.png`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={handleGenerate} disabled={generating}
                  className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> New Variation
                </button>
              </div>
            </div>

            {results.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {results.map((url, i) => (
                  <button key={i} onClick={() => setActiveResult(i)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${activeResult === i ? 'border-[#F1C40F]' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={url} alt={`Variation ${i + 1}`} className="w-full aspect-square object-cover" />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-white">{i + 1}</div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-600 text-center mt-3">Saved to Media Gallery automatically</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center h-80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1C40F]/10 flex items-center justify-center mx-auto mb-4">
              <Box className="w-7 h-7 text-[#F1C40F]/40" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Your mockup will appear here</p>
            <p className="text-xs text-gray-600 mt-1 max-w-[240px]">Upload your design, select a product and environment, then generate</p>
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1C40F]/5 border border-[#F1C40F]/10">
              <Zap className="w-3 h-3 text-[#F1C40F]/60" />
              <span className="text-[10px] text-[#F1C40F]/60">Design-on-product · Photorealistic · 8K commercial quality</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
