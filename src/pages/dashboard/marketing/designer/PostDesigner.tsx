import { useState, useRef } from 'react';
import {
  Loader2, Sparkles, Download, RotateCcw, X, Upload, Lock,
  Zap, Image as ImageIcon, Check, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl, uploadMediaToStorage } from '../../../../lib/mediaDB';
import { kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { getApiKey } from '../../../../lib/apiKeys';
import { callGeminiFlash } from '../../../../lib/ai/gemini';

const MODEL = 'nano-banana-pro';

const PLATFORMS = [
  { key: 'ig_post',   label: 'Instagram Post',  ratio: '1:1',   icon: '📸', desc: '1080×1080' },
  { key: 'ig_story',  label: 'Instagram Story', ratio: '9:16',  icon: '📱', desc: '1080×1920' },
  { key: 'ig_reel',   label: 'Reels Cover',     ratio: '9:16',  icon: '🎬', desc: '1080×1920' },
  { key: 'linkedin',  label: 'LinkedIn Post',   ratio: '16:9',  icon: '💼', desc: '1200×628' },
  { key: 'twitter',   label: 'X / Twitter',     ratio: '16:9',  icon: '🐦', desc: '1600×900' },
  { key: 'facebook',  label: 'Facebook Post',   ratio: '4:3',   icon: '📘', desc: '1200×900' },
  { key: 'youtube',   label: 'YouTube Thumb',   ratio: '16:9',  icon: '▶️', desc: '1280×720' },
  { key: 'pinterest', label: 'Pinterest Pin',   ratio: '2:3',   icon: '📌', desc: '1000×1500' },
];

const DESIGN_STYLES = [
  { key: 'minimal',    label: 'Minimal Clean',    desc: 'White space, elegant typography' },
  { key: 'bold',       label: 'Bold & Vibrant',   desc: 'High contrast, punchy colors' },
  { key: 'cinematic',  label: 'Cinematic',        desc: 'Film-grade, dramatic lighting' },
  { key: 'gradient',   label: 'Gradient Rich',    desc: 'Smooth color transitions' },
  { key: 'luxury',     label: 'Luxury Premium',   desc: 'Dark tones, gold accents' },
  { key: 'neon',       label: 'Neon / Tech',      desc: 'Glowing edges, dark bg' },
  { key: '3d',         label: '3D Render',        desc: 'Dimensional, volumetric' },
  { key: 'illustrated',label: 'Illustrated',      desc: 'Hand-crafted, artistic' },
];

const RESOLUTIONS = [
  { key: '1K', label: '1K', desc: 'Fast preview' },
  { key: '2K', label: '2K', desc: 'High quality' },
  { key: '4K', label: '4K', desc: 'Print-ready' },
];

interface RefSlot {
  id: string;
  label: string;
  desc: string;
  preview: string;
  url: string;
  uploading: boolean;
  file: File | null;
}

function buildRefSlots(): RefSlot[] {
  return [
    { id: 'style',   label: 'Style Ref',   desc: 'Layout & tone',    preview: '', url: '', uploading: false, file: null },
    { id: 'brand',   label: 'Brand Ref',   desc: 'Logo & colors',    preview: '', url: '', uploading: false, file: null },
    { id: 'product', label: 'Product Ref', desc: 'Your product',     preview: '', url: '', uploading: false, file: null },
  ];
}

async function enhancePrompt(
  description: string,
  style: string,
  platformLabel: string,
  platformRatio: string,
  platformDimensions: string,
  headline: string,
  cta: string,
  hasRefs: boolean,
): Promise<string> {
  const sys = `You are a world-class senior art director and AI image prompt engineer specializing in social media visual design. You work exclusively with Nano Banana Pro (Gemini 3 Pro backbone) — a state-of-the-art text-to-image model that excels at photorealistic, commercial-grade visuals when given extremely detailed, structured prompts.

MASTER PROMPT FRAMEWORK — follow this structure precisely:

[COMPOSITION & LAYOUT]
Describe the exact layout grid. Specify safe zones for text. Define the visual hierarchy: hero element → supporting elements → background. Aspect ratio ${platformRatio} (${platformDimensions}). Rule-of-thirds or golden ratio alignment. Leave intentional negative space for ${headline ? `headline text "${headline}"` : 'brand breathing room'}.

[HERO VISUAL]
Describe the primary subject in extreme detail: materials, surface finish, scale, positioning within the frame, spatial relationship to camera.

[LIGHTING SETUP]
Specify: key light direction and quality (hard/soft/diffused), fill light ratio, rim/backlight presence, color temperature in Kelvin, catchlights, shadow direction and softness.

[COLOR PALETTE]
Name exact colors: primary brand color (hex or Pantone reference), secondary accent, background base, highlight tone. Specify color harmony type (complementary/analogous/triadic). Saturation and luminance targets.

[TYPOGRAPHY ZONES]
Reserve space for text overlays. Specify font weight feel (ultra-bold/serif/sans), size hierarchy, placement coordinates (top/center/bottom, left/right), contrast against background.

[ATMOSPHERE & MOOD]
Target emotional response. Cinematic depth of field (f-stop equivalent). Bokeh quality if applicable. Ambient particles (dust, light leaks, grain level 0-5%).

[TECHNICAL QUALITY DIRECTIVES]
Ultra-photorealistic. Commercial advertising photography standard. DCI-P3 wide color gamut. Zero compression artifacts. Tack-sharp focal plane. Award-winning ${platformLabel} social media creative. Nano Banana Pro optimized. ${style} aesthetic execution.

${hasRefs ? '[REFERENCE FIDELITY]\nReference images are attached — extract and match: exact brand colors (sample from logo/brand image), font personality, design language, visual tone, color grading, and compositional style. The output must feel like it belongs to the same brand family as the references.' : ''}

PLATFORM CONTEXT: ${platformLabel} — ${platformRatio} ratio (${platformDimensions}). Thumb-stopping first impression. Platform-native visual language. Optimized for ${platformLabel} feed algorithm engagement.
${cta ? `CTA ELEMENT: "${cta}" — design the visual to naturally guide the eye toward this action.` : ''}

Now write a single continuous image generation prompt (no headers, no bullets, no explanations) for this brief:
"${description}"

Output ONLY the raw prompt text. Maximum 320 words. Make it the best prompt ever written for this specific use case.`;

  try {
    const result = await callGeminiFlash(sys, 'post_designer_prompt');
    return result.trim() || description;
  } catch {
    return description;
  }
}

export default function PostDesigner() {
  const { user } = useAuth();
  const fileInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('ig_post');
  const [designStyle, setDesignStyle] = useState('minimal');
  const [resolution, setResolution] = useState('2K');
  const [headline, setHeadline] = useState('');
  const [cta, setCta] = useState('');
  const [refs, setRefs] = useState<RefSlot[]>(buildRefSlots());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const uploadRef = async (id: string, file: File) => {
    if (!user) { toast.error('Sign in to upload references'); return; }
    setRefs((prev) => prev.map((r) => r.id === id
      ? { ...r, file, preview: URL.createObjectURL(file), uploading: true, url: '' }
      : r
    ));
    try {
      const result = await uploadMediaToStorage(user.id, `post-ref-${crypto.randomUUID()}`, file, file.type);
      if (!result?.publicUrl) throw new Error('Upload failed');
      setRefs((prev) => prev.map((r) => r.id === id ? { ...r, url: result.publicUrl, uploading: false } : r));
    } catch {
      setRefs((prev) => prev.map((r) => r.id === id ? { ...r, uploading: false } : r));
      toast.error('Reference upload failed');
    }
  };

  const clearRef = (id: string) => {
    setRefs((prev) => prev.map((r) => r.id === id ? { ...r, preview: '', url: '', file: null, uploading: false } : r));
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!description.trim()) { toast.error('Describe your post design'); return; }
    if (refs.some((r) => r.uploading)) { toast.error('Wait for references to finish uploading'); return; }

    setGenerating(true);
    setResults([]);
    setEnhancedPrompt('');

    try {
      const plt = PLATFORMS.find((p) => p.key === platform)!;
      const sty = DESIGN_STYLES.find((s) => s.key === designStyle)!;
      const readyRefs = refs.filter((r) => r.url).map((r) => r.url);

      setProgress('Enhancing prompt with Gemini...');
      const prompt = await enhancePrompt(description, sty.label, plt.label, plt.ratio, plt.desc, headline, cta, readyRefs.length > 0);
      setEnhancedPrompt(prompt);

      const inputPayload: Record<string, unknown> = {
        prompt,
        aspect_ratio: plt.ratio,
        resolution,
        output_format: 'png',
        negative_prompt: 'low quality, blurry, pixelated, watermark, draft, amateur, distorted',
        multi_shots: false,
      };

      if (readyRefs.length > 0) {
        inputPayload.image_input = readyRefs;
        inputPayload.reference_images = readyRefs;
      }

      setProgress('Submitting to Nano Banana Pro...');
      const taskData = await kiePost('/api/v1/jobs/createTask', { model: MODEL, input: inputPayload }, apiKey);
      const taskId = extractTaskId(taskData);
      if (!taskId) throw new Error((taskData as Record<string, unknown>)?.msg as string || 'No task ID returned');

      const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll, (m) => setProgress(m));
      setResults(urls);

      if (user) {
        for (const url of urls) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, url);
            await supabase.from('media_assets').insert({
              id: assetId, user_id: user.id, type: 'image',
              title: `Post: ${description.slice(0, 60)}`,
              prompt, provider: 'kie_ai', status: 'completed',
              result_url: uploaded?.publicUrl || url,
              storage_path: uploaded?.path || null,
              file_size: uploaded?.size || 0,
              metadata: { source: 'post_designer', model: MODEL, platform, designStyle, resolution },
            });
          } catch { /* non-critical */ }
        }
      }
      toast.success('Post design generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const plt = PLATFORMS.find((p) => p.key === platform)!;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-2 space-y-4">

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 border border-[#F1C40F]/20">
          <div className="w-7 h-7 rounded-lg bg-[#F1C40F]/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#F1C40F]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Nano Banana Pro</p>
            <p className="text-[10px] text-gray-500">Gemini 3 Pro · Multi-reference · Ultra-HD</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
            <Lock className="w-2.5 h-2.5 text-[#F1C40F]" />
            <span className="text-[9px] font-bold text-[#F1C40F]">LOCKED</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Brief</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Promotional post for summer sale — bold orange brand, product photo focus, target: young professionals"
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F]/60 resize-none placeholder-gray-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Headline text</label>
              <input
                type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
                placeholder="Transform Your Business"
                className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">CTA text</label>
              <input
                type="text" value={cta} onChange={(e) => setCta(e.target.value)}
                placeholder="Get Started Today"
                className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#F1C40F]/60"
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Platform</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.key} onClick={() => setPlatform(p.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  platform === p.key
                    ? 'bg-[#F1C40F]/10 border border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight truncate">{p.label}</p>
                  <p className="text-[9px] text-gray-600">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Design Style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {DESIGN_STYLES.map((s) => (
              <button
                key={s.key} onClick={() => setDesignStyle(s.key)}
                className={`px-3 py-2.5 rounded-xl text-left transition-all border ${
                  designStyle === s.key
                    ? 'bg-[#F1C40F]/10 border-[#F1C40F]/40 text-white'
                    : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                }`}
              >
                <p className="text-[11px] font-semibold">{s.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Reference Images</label>
            <span className="text-[10px] text-gray-600">Optional · injected as image_input</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {refs.map((slot) => (
              <div key={slot.id}>
                <input
                  type="file" accept="image/*" className="hidden"
                  ref={(el) => fileInputRefs.current.set(slot.id, el)}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRef(slot.id, f); e.target.value = ''; }}
                />
                {slot.preview ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
                    {slot.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                    {slot.url && !slot.uploading && (
                      <div className="absolute top-1.5 left-1.5">
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30">
                          <Check className="w-2 h-2" /> Ready
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => clearRef(slot.id)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/80 bg-black/50 py-0.5">{slot.label}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current.get(slot.id)?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#F1C40F]/30 transition-colors bg-dark-800/40 flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-[9px] text-gray-600 text-center leading-tight px-1">{slot.label}</span>
                    <span className="text-[8px] text-gray-700">{slot.desc}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Resolution</label>
          <div className="flex gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r.key} onClick={() => setResolution(r.key)}
                className={`flex-1 py-2 rounded-xl border text-center transition-all ${
                  resolution === r.key
                    ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                    : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                <p className="text-sm font-bold">{r.label}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !description.trim() || refs.some((r) => r.uploading)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-yellow-500/20 active:scale-[0.99]"
        >
          {generating
            ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="truncate max-w-xs text-sm">{progress || 'Generating...'}</span></>
            : <><Sparkles className="w-5 h-5" /> Generate with Nano Banana Pro</>
          }
        </button>
      </div>

      <div className="xl:col-span-3 space-y-4">
        {enhancedPrompt && !generating && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#F1C40F]" />
              <span className="text-xs font-medium text-[#F1C40F]">Gemini-enhanced prompt</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-4">{enhancedPrompt}</p>
          </div>
        )}

        {results.length > 0 ? (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#F1C40F]" />
                <h4 className="text-sm font-semibold">Generated Design</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/20">
                  {plt.label}
                </span>
              </div>
              <span className="text-[10px] text-gray-500">{plt.ratio} · {resolution}</span>
            </div>

            <div className={results.length > 1 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
              {results.map((url, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={url}
                    alt={`Post design ${i + 1}`}
                    className={`w-full object-cover ${
                      plt.ratio === '9:16' || plt.ratio === '2:3' ? 'aspect-[9/16]'
                      : plt.ratio === '1:1' ? 'aspect-square'
                      : 'aspect-video'
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a
                      href={url} download={`post-design-${Date.now()}.png`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-2 hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleGenerate} disabled={generating}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Regenerate
              </button>
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-2">Saved to Media Gallery automatically</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center h-64 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1C40F]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-[#F1C40F]/40" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Your design will appear here</p>
            <p className="text-xs text-gray-600 mt-1">Configure settings and click Generate</p>
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1C40F]/5 border border-[#F1C40F]/10">
              <Zap className="w-3 h-3 text-[#F1C40F]/60" />
              <span className="text-[10px] text-[#F1C40F]/60">Powered by Nano Banana Pro · Gemini 3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
