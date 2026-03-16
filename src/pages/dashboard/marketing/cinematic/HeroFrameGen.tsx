import { useState } from 'react';
import { Loader2, Film, Image, Copy, Check as CheckIcon, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl } from '../../../../lib/mediaDB';
import { getKieKey, kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { callGeminiFlash } from '../../../../lib/ai/gemini';
import { CAMERA_BODIES, LENS_TYPES } from '../../../../lib/marketing/constants';
import type { CinematicSession } from '../../../../lib/marketing/types';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
}

const FRAME_COUNTS = [1, 2, 4];
const LOCKED_MODEL = 'nano-banana-pro';
const LOCKED_MODEL_LABEL = 'Nano Banana Pro';

const HERO_ASPECT_RATIOS = [
  { key: '16:9', label: '16:9', desc: 'Widescreen / Cinema' },
  { key: '9:16', label: '9:16', desc: 'Vertical / Reels / Story' },
];

async function enhancePromptWithGemini(
  rawPrompt: string,
  cameraDetails: string,
  hasStyleRef: boolean,
  hasCharacterRef: boolean,
  characterLock = false
): Promise<string> {
  const refContext: string[] = [];
  if (hasStyleRef) refContext.push('a STYLE REFERENCE IMAGE is attached — you must explicitly instruct the model to match its exact visual tone, color palette, lighting quality, mood, and overall aesthetic');
  if (hasCharacterRef) {
    const lockNote = characterLock
      ? 'a CHARACTER REFERENCE IMAGE is attached with LOCK enabled — CRITICAL: the prompt must explicitly demand exact face replication, preserve every facial feature, skin tone, hair, and distinctive physical traits with zero deviation'
      : 'a CHARACTER REFERENCE IMAGE is attached — the prompt must instruct the model to closely match the person\'s face, skin tone, hair, and physical appearance';
    refContext.push(lockNote);
  }

  const refInstruction = refContext.length > 0
    ? `\n\nREFERENCE IMAGES ATTACHED (${refContext.length}):\n${refContext.map((r, i) => `${i + 1}. ${r}`).join('\n')}\nCRITICAL: You MUST weave explicit reference-matching directives into the prompt body — do not mention "reference image" directly, instead describe the appearance attributes in detail as if you are describing what to render.`
    : '';

  const systemPrompt = `You are a world-class cinematic prompt engineer for professional film and advertising production.
Your task: Write an ultra-detailed, vivid cinematic image generation prompt from the user's scene description and camera setup.

Rules:
- Output ONLY the final enhanced prompt — no explanations, no quotes, no markdown
- Maximum 350 words
- ALWAYS include: precise lighting setup, mood, atmosphere, color palette and grading, composition, depth of field, texture details, background atmosphere
- Add professional cinematography vocabulary: bokeh quality, lens compression, focal plane, shadow detail, highlight rolloff
- Include skin/fabric/material texture descriptors for subjects
- End with quality reinforcers: ultra-photorealistic, shot on RED Monstro, RAW post-process, cinematic DCI-P3 color space, film grain texture, 8K resolution, award-winning photography${refInstruction}

User scene: ${rawPrompt}
Camera setup: ${cameraDetails}`;

  try {
    const enhanced = await callGeminiFlash(systemPrompt, 'cinematic_prompt');
    return enhanced.trim() || rawPrompt;
  } catch {
    return rawPrompt;
  }
}

export default function HeroFrameGen({ session, update, onNext }: Props) {
  const { user } = useAuth();
  const [frameCount, setFrameCount] = useState(2);
  const [heroAspectRatio, setHeroAspectRatio] = useState<'16:9' | '9:16'>(
    (session.cameraRig.aspectRatio as '16:9' | '9:16') || '16:9'
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [copied, setCopied] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState('');

  const cameraBody = CAMERA_BODIES.find((b) => b.key === session.cameraRig.body);
  const lens = LENS_TYPES.find((l) => l.key === session.cameraRig.lens);

  const buildCameraDetails = () => {
    const parts: string[] = [];
    if (cameraBody) parts.push(`Shot on ${cameraBody.label}`);
    if (lens) parts.push(`${lens.label} lens`);
    parts.push(`${session.cameraRig.focalLength}mm focal length`);
    parts.push(`${session.cameraRig.aperture} aperture`);
    parts.push(`${session.cameraRig.filmLook}`);
    parts.push('Cinematic, photorealistic, 8K resolution, ultra-detailed');
    return parts.join(', ');
  };

  const buildDisplayPrompt = () => {
    const base = session.enhancedPrompt || session.prompt;
    const camera = buildCameraDetails();
    return `${base}, ${camera}`;
  };

  const buildReferenceImages = (): { style: string | null; character: string | null } => {
    return {
      style: session.styleReference || null,
      character: session.subjectReference || null,
    };
  };

  const buildImageInputArray = (): string[] => {
    const refs: string[] = [];
    if (session.styleReference) refs.push(session.styleReference);
    if (session.subjectReference) refs.push(session.subjectReference);
    return refs;
  };

  const handleGenerate = async () => {
    const apiKey = await getKieKey();
    if (!apiKey) {
      toast.error('Add your Kie.ai API key in Settings > Integrations');
      return;
    }

    const basePrompt = session.prompt || session.enhancedPrompt;
    if (!basePrompt.trim()) {
      toast.error('No scene description. Go back to Step 1.');
      return;
    }

    setGenerating(true);
    setEnhancedPreview('');

    try {
      setProgress('Enhancing prompt with Gemini Flash...');
      const cameraDetails = buildCameraDetails();
      const refs = buildReferenceImages();
      const enhanced = await enhancePromptWithGemini(
        basePrompt,
        cameraDetails,
        !!refs.style,
        !!refs.character,
        session.characterLock
      );
      setEnhancedPreview(enhanced);

      const imageInputs = buildImageInputArray();
      const generatedUrls: string[] = [];

      for (let i = 0; i < frameCount; i++) {
        setProgress(`Submitting frame ${i + 1} of ${frameCount} to Kie.ai...`);

        const inputPayload: Record<string, unknown> = {
          prompt: enhanced,
          aspect_ratio: heroAspectRatio,
          resolution: '1K',
          output_format: 'png',
          multi_shots: false,
        };

        if (imageInputs.length > 0) {
          inputPayload.image_input = imageInputs;
          inputPayload.reference_images = imageInputs;
          if (refs.style) inputPayload.style_image = refs.style;
          if (refs.character) {
            inputPayload.character_image = refs.character;
            inputPayload.subject_image = refs.character;
          }
        }

        const body: Record<string, unknown> = {
          model: LOCKED_MODEL,
          input: inputPayload,
        };

        const data = await kiePost('/api/v1/jobs/createTask', body, apiKey);
        const taskId = extractTaskId(data);

        if (!taskId) {
          const apiMsg =
            (data as Record<string, unknown>)?.msg ||
            (data as Record<string, unknown>)?.message ||
            JSON.stringify(data).slice(0, 300);
          throw new Error(`Frame ${i + 1} failed — API response: ${apiMsg}`);
        }

        setProgress(`Generating frame ${i + 1} of ${frameCount}...`);
        const urls = await pollKieTask(
          '/api/v1/jobs/recordInfo',
          taskId,
          apiKey,
          parseMarketPoll,
          (msg) => setProgress(`Frame ${i + 1}/${frameCount}: ${msg}`),
        );

        if (urls[0]) generatedUrls.push(urls[0]);
      }

      if (generatedUrls.length === 0) throw new Error('No frames were generated');

      const permanentUrls: string[] = [];
      if (user) {
        setProgress('Saving frames to your media library...');
        for (const url of generatedUrls) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, url);
            const permanentUrl = uploaded?.publicUrl || url;
            permanentUrls.push(permanentUrl);
            await supabase.from('media_assets').insert({
              id: assetId,
              user_id: user.id,
              type: 'image',
              title: `Hero Frame: ${session.prompt.slice(0, 50)}`,
              prompt: enhanced,
              provider: 'kie_ai',
              status: 'completed',
              result_url: permanentUrl,
              storage_path: uploaded?.path || null,
              file_size: uploaded?.size || 0,
              metadata: {
                source: 'cinematic_studio_hero_frame',
                model: LOCKED_MODEL,
                cameraRig: session.cameraRig,
                hasStyleRef: !!session.styleReference,
                hasSubjectRef: !!session.subjectReference,
                imageInputCount: imageInputs.length,
              },
            });
          } catch {
            permanentUrls.push(url);
          }
        }
      } else {
        permanentUrls.push(...generatedUrls);
      }

      update({ heroFrames: permanentUrls, selectedHeroFrame: 0, enhancedPrompt: enhanced });
      toast.success(`${generatedUrls.length} hero frame${generatedUrls.length > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(enhancedPreview || buildDisplayPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPrompt = enhancedPreview || buildDisplayPrompt();
  const imageInputs = buildImageInputArray();
  const refs = buildReferenceImages();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Generate Hero Frames</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              AI will render {frameCount} candidate frame{frameCount > 1 ? 's' : ''} — you pick the best one
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C0392B]/10 border border-[#C0392B]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C0392B]" />
            <span className="text-xs font-semibold text-[#C0392B]">{LOCKED_MODEL_LABEL}</span>
            <Lock className="w-3 h-3 text-[#C0392B]" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {enhancedPreview && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-[#F1C40F]" />
                  <span className="text-[10px] text-[#F1C40F] font-medium">Gemini-enhanced prompt</span>
                </div>
              )}
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{displayPrompt}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {imageInputs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {refs.style && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
                <Image className="w-3 h-3 text-[#F1C40F]" />
                <span className="text-[10px] text-[#F1C40F] font-medium">Style Reference Injected</span>
              </div>
            )}
            {refs.character && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C0392B]/10 border border-[#C0392B]/20">
                <Image className="w-3 h-3 text-[#C0392B]" />
                <span className="text-[10px] text-[#C0392B] font-medium">Character Reference Injected</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-medium">{imageInputs.length} reference{imageInputs.length > 1 ? 's' : ''} active</span>
            </div>
          </div>
        )}
        {imageInputs.length === 0 && (session.styleReference === null && session.subjectReference === null) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 mb-4">
            <span className="text-[10px] text-amber-400">No reference images — go back to Step 2 to add style or character references for better results</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2 font-medium">
            Aspect Ratio
            <span className="ml-2 text-[10px] text-gray-600 font-normal normal-case">Nano Banana Pro · affects output dimensions</span>
          </label>
          <div className="flex gap-2">
            {HERO_ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.key}
                onClick={() => {
                  setHeroAspectRatio(ar.key as '16:9' | '9:16');
                  update({ cameraRig: { ...session.cameraRig, aspectRatio: ar.key } });
                }}
                disabled={generating}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                  heroAspectRatio === ar.key
                    ? 'border-[#F1C40F] bg-[#F1C40F]/10 text-white'
                    : 'border-white/10 bg-dark-800 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className={`mb-1 border-2 transition-colors ${heroAspectRatio === ar.key ? 'border-[#F1C40F]' : 'border-gray-600'} ${ar.key === '16:9' ? 'w-10 h-6' : 'w-6 h-10'} rounded`} />
                <span className="font-bold text-xs">{ar.label}</span>
                <span className="text-[9px] text-gray-500 mt-0.5">{ar.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Number of Frames to Generate</label>
          <div className="flex gap-2">
            {FRAME_COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setFrameCount(c)}
                disabled={generating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                  frameCount === c
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white shadow-lg shadow-[#C0392B]/20'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {c} {c === 1 ? 'Frame' : 'Frames'}
              </button>
            ))}
          </div>
          {frameCount > 1 && (
            <p className="text-[10px] text-gray-600 mt-1.5">
              Generating {frameCount} frames takes longer but gives you more choices
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <p className="text-[11px] text-blue-300">
            Your prompt will be enhanced by Gemini Flash 2.5 before generation for best results
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !session.prompt.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#C0392B]/20"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="truncate max-w-xs">{progress || 'Generating...'}</span>
            </>
          ) : (
            <>
              <Film className="w-5 h-5" />
              Generate {frameCount} Frame{frameCount > 1 ? 's' : ''} with {LOCKED_MODEL_LABEL}
            </>
          )}
        </button>
      </div>

      {session.heroFrames.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white">Select Your Hero Frame</h4>
            <span className="text-xs text-gray-500">
              {session.heroFrames.length} frame{session.heroFrames.length > 1 ? 's' : ''} generated
            </span>
          </div>

          <div
            className={`grid gap-4 ${
              session.heroFrames.length === 1
                ? 'grid-cols-1'
                : session.heroFrames.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
            }`}
          >
            {session.heroFrames.map((url, i) => (
              <button
                key={i}
                onClick={() => update({ selectedHeroFrame: i })}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  session.selectedHeroFrame === i
                    ? 'border-[#F1C40F] shadow-lg shadow-[#F1C40F]/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img src={url} alt={`Frame ${i + 1}`} className={`w-full object-cover ${heroAspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`} />
                {session.selectedHeroFrame === i && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#F1C40F] flex items-center justify-center">
                    <CheckIcon className="w-3.5 h-3.5 text-black" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white">
                    Frame {i + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={onNext}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all"
          >
            <Lock className="w-4 h-4" /> Lock Hero Frame & Animate
          </button>
        </div>
      )}
    </div>
  );
}
