import { useState, useRef, useEffect } from 'react';
import {
  Loader2, Sparkles, Plus, X, ChevronDown, Info, Download, Video,
  Film, Upload, Camera, MessageSquare, Image as ImageIcon, LayoutTemplate,
  ChevronRight, Volume2, VolumeX, Layers, BookOpen, Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl, uploadMediaToStorage } from '../../../lib/mediaDB';
import { kiePost, kieGet, extractTaskId, parseMarketPoll } from '../../../lib/marketing/kieApi';
import type { VideoTemplate } from '../settings/VideoTemplateManager';
import type { CustomCameraMovement } from '../settings/CameraMovementManager';

type KlingMode = 'text_to_video' | 'image_to_video' | 'multi_prompt' | 'camera_control';

const KLING_MODES: { key: KlingMode; label: string; icon: React.ElementType }[] = [
  { key: 'text_to_video', label: 'Text to Video', icon: Film },
  { key: 'image_to_video', label: 'Image to Video', icon: ImageIcon },
  { key: 'multi_prompt', label: 'Multi Prompt', icon: MessageSquare },
  { key: 'camera_control', label: 'Camera Control', icon: Camera },
];

const DURATIONS = ['3', '5', '10', '15'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1'];

const BUILT_IN_CAMERA_MOTIONS = [
  { value: 'zoom_in', label: 'Zoom In', category: 'Zoom/Focus' },
  { value: 'zoom_out', label: 'Zoom Out', category: 'Zoom/Focus' },
  { value: 'pan_left', label: 'Pan Left', category: 'Push/Pull' },
  { value: 'pan_right', label: 'Pan Right', category: 'Push/Pull' },
  { value: 'tilt_up', label: 'Tilt Up', category: 'Rotation' },
  { value: 'tilt_down', label: 'Tilt Down', category: 'Rotation' },
  { value: 'dolly_in', label: 'Dolly In', category: 'Push/Pull' },
  { value: 'dolly_out', label: 'Dolly Out', category: 'Push/Pull' },
  { value: 'orbit_left', label: 'Orbit Left', category: 'Rotation' },
  { value: 'orbit_right', label: 'Orbit Right', category: 'Rotation' },
  { value: 'handheld', label: 'Handheld', category: 'Cinematic' },
  { value: 'static', label: 'Static', category: 'Cinematic' },
];

interface KlingElement { name: string; description: string; element_input_urls: string[] }
interface KlingElementFile { previews: string[]; files: File[] }
interface MultiPromptScene { prompt: string; duration: number }
interface FrameImage { file: File | null; preview: string; url: string | null; uploading: boolean }
interface StoryCard { type: 'image' | 'video'; url: string; label: string }

const EMPTY_FRAME: FrameImage = { file: null, preview: '', url: null, uploading: false };

function ToggleButton({
  value,
  onChange,
  disabled,
  onLabel,
  offLabel,
  onIcon: OnIcon,
  offIcon: OffIcon,
  color = '#FF6B00',
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  onLabel: string;
  offLabel: string;
  onIcon: React.ElementType;
  offIcon: React.ElementType;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={value ? { borderColor: color, backgroundColor: `${color}18` } : {}}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all select-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'}
        ${value ? 'text-white' : 'border-white/10 bg-dark-800 text-gray-400'}`}
    >
      {value ? (
        <OnIcon className="w-4 h-4" style={{ color }} />
      ) : (
        <OffIcon className="w-4 h-4" />
      )}
      <span>{value ? onLabel : offLabel}</span>
      <span
        style={value ? { backgroundColor: color } : {}}
        className={`ml-1 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${value ? '' : 'bg-gray-600'}`}
      />
    </button>
  );
}

function ModeToggle({
  value,
  onChange,
  options,
  color = '#FF6B00',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  color?: string;
}) {
  return (
    <div className="flex gap-1 p-0.5 bg-dark-900/80 rounded-lg border border-white/5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={value === opt.value ? { backgroundColor: color } : {}}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
            value === opt.value ? 'text-white shadow' : 'text-gray-500 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FrameUploadSlot({
  label, frame, onSelect, onClear, required,
}: {
  label: string; frame: FrameImage; onSelect: (f: File) => void; onClear: () => void; required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-[155px] max-w-[220px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        {required && <span className="text-red-400 text-[10px]">*</span>}
        {frame.uploading && <span className="text-[10px] text-[#FF6B00] flex items-center gap-0.5"><Loader2 className="w-2.5 h-2.5 animate-spin" />Uploading</span>}
        {frame.url && !frame.uploading && <span className="text-[10px] text-emerald-400">Ready</span>}
      </div>
      {frame.preview ? (
        <div className="relative">
          <img src={frame.preview} alt={label} className="w-full h-36 rounded-xl border border-white/10 object-cover" />
          {frame.uploading && (
            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
            </div>
          )}
          <button onClick={onClear} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF6B00]/40 transition-colors group bg-dark-800/40 flex flex-col items-center justify-center gap-2"
        >
          <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#FF6B00] transition-colors" />
          <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{required ? 'Upload Image' : 'Optional'}</p>
          <p className="text-[10px] text-gray-600">PNG · JPG · JPEG</p>
        </button>
      )}
      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = ''; }} />
    </div>
  );
}

function StoryBoard({ cards }: { cards: StoryCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="glass-card rounded-xl p-5 space-y-3 animate-[k3FadeIn_0.4s_ease-out]">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#FF6B00]" />
        <span className="text-sm font-semibold text-white">Storyboard</span>
        <span className="text-[10px] text-gray-500">{cards.length} item{cards.length > 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {cards.map((card, i) => (
          <div key={i} className="flex-shrink-0 w-40 space-y-1.5">
            <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-white/10 bg-black group">
              {card.type === 'video' ? (
                <>
                  <video src={card.url} className="w-full h-full object-cover" muted loop
                    ref={(el) => { if (el) el.addEventListener('mouseenter', () => el.play().catch(() => {})); }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF6B00]/80 text-white">VIDEO</span>
                </>
              ) : (
                <>
                  <img src={card.url} alt={card.label} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/80 text-white">IMG</span>
                </>
              )}
              <a
                href={card.url}
                download={`kling-${card.type}-${i + 1}-${Date.now()}.${card.type === 'video' ? 'mp4' : 'png'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3 h-3 text-white" />
              </a>
            </div>
            <p className="text-[10px] text-gray-500 text-center truncate">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoResultPanel({ url, title, onClear }: { url: string; title: string; onClear: () => void }) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `kling3-${title}-${Date.now()}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3 animate-[k3FadeIn_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-sm font-semibold text-gray-300">Result</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">Kling 3.0</span>
        </div>
        <button onClick={onClear} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
      </div>
      <video src={url} controls className="w-full rounded-xl border border-white/5 max-h-[380px] bg-black" />
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-orange text-white text-sm font-medium w-full justify-center hover:shadow-lg hover:shadow-[#FF6B00]/20 transition-all active:scale-[0.99]"
      >
        <Download className="w-4 h-4" /> Download Video
      </button>
    </div>
  );
}

function GeneratingCard({ elapsed, progress }: { elapsed: number; progress: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-dark-800 aspect-video">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 animate-pulse" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#FF6B00]/30 border-t-[#FF6B00] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#FF6B00]/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/80">{progress || 'Generating...'}</p>
          <p className="text-[11px] text-gray-500 mt-1">{elapsed}s elapsed</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#FF6B00]/60"
              style={{ animation: `k3Bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, (elapsed / 90) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function TemplatePicker({ templates, onApply }: { templates: VideoTemplate[]; onApply: (t: VideoTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const active = templates.filter((t) => t.is_active);
  const categories = ['All', ...Array.from(new Set(active.map((t) => t.category)))];
  const filtered = filter === 'All' ? active : active.filter((t) => t.category === filter);
  if (active.length === 0) return null;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-[#FF6B00] hover:text-[#FF9A00] transition-colors font-medium">
        <LayoutTemplate className="w-3.5 h-3.5" />
        Load from Template ({active.length})
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-dark-900 overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-white/5 overflow-x-auto">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${filter === cat ? 'gradient-orange text-white' : 'bg-dark-800 text-gray-400 hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => { onApply(t); setOpen(false); }}
                onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors group">
                <div className="flex items-start gap-3">
                  {t.preview_video_url && (
                    <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-white/10 bg-black">
                      <video src={t.preview_video_url} className="w-full h-full object-cover" muted loop
                        ref={(el) => { if (el) { if (hoveredId === t.id) el.play().catch(() => {}); else { el.pause(); el.currentTime = 0; } } }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{t.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FF6B00]/10 text-[#FF6B00]">{t.category}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-700 text-gray-400">{t.duration}s · {t.aspect_ratio}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#FF6B00] transition-colors flex-shrink-0 ml-2" />
                    </div>
                    {t.description && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{t.description}</p>}
                    <p className="text-[10px] text-gray-600 mt-1 truncate font-mono">{t.prompt_template}</p>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center py-6 text-sm text-gray-500">No templates in this category</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Kling3Studio() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<KlingMode>('text_to_video');

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [klingMode, setKlingMode] = useState<'std' | 'pro'>('std');
  const [sound, setSound] = useState(false);
  const [multiShots, setMultiShots] = useState(false);
  const [cameraMotion, setCameraMotion] = useState('static');
  const [cameraIntensity, setCameraIntensity] = useState(5);

  const [showElements, setShowElements] = useState(false);
  const [elements, setElements] = useState<KlingElement[]>([]);
  const [elementFiles, setElementFiles] = useState<KlingElementFile[]>([]);

  const [scenes, setScenes] = useState<MultiPromptScene[]>([
    { prompt: '', duration: 3 },
    { prompt: '', duration: 3 },
  ]);

  const [startFrame, setStartFrame] = useState<FrameImage>(EMPTY_FRAME);
  const [endFrame, setEndFrame] = useState<FrameImage>(EMPTY_FRAME);
  const [cameraRefFrame, setCameraRefFrame] = useState<FrameImage>(EMPTY_FRAME);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState('');
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);

  const [videoTemplates, setVideoTemplates] = useState<VideoTemplate[]>([]);
  const [customCameraMovements, setCustomCameraMovements] = useState<CustomCameraMovement[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('video_templates').select('*').eq('user_id', user.id).eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setVideoTemplates((data || []) as VideoTemplate[]));
    supabase.from('custom_camera_movements').select('*').eq('user_id', user.id).eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }) => setCustomCameraMovements((data || []) as CustomCameraMovement[]));
  }, [user]);

  const allCameraMotions = [
    ...BUILT_IN_CAMERA_MOTIONS,
    ...customCameraMovements.map((m) => ({ value: m.value, label: m.name, category: m.category, isCustom: true })),
  ];

  const multiShotsTotalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  const effectiveSound: boolean = (activeMode === 'multi_prompt' || multiShots) ? true : sound;

  const applyTemplate = (t: VideoTemplate) => {
    setPrompt(t.prompt_template);
    setDuration(t.duration);
    setAspectRatio(t.aspect_ratio);
    setKlingMode(t.kling_mode as 'std' | 'pro');
    setCameraMotion(t.camera_motion);
    setCameraIntensity(t.camera_intensity);
    setSound(t.sound);
    if (activeMode !== 'text_to_video') setActiveMode('text_to_video');
    toast.success(`Template "${t.name}" applied`);
  };

  const startTimer = () => {
    setElapsed(0);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    const start = Date.now();
    elapsedTimer.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
  };

  const stopTimer = () => {
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
  };

  const uploadFrame = async (file: File, setter: React.Dispatch<React.SetStateAction<FrameImage>>) => {
    if (!user) return;
    const preview = URL.createObjectURL(file);
    setter({ file, preview, url: null, uploading: true });
    try {
      const result = await uploadMediaToStorage(user.id, `kling-frame-${crypto.randomUUID()}`, file, file.type);
      setter((prev) => ({ ...prev, url: result?.publicUrl || null, uploading: false }));
    } catch {
      toast.error('Image upload failed');
      setter((prev) => ({ ...prev, uploading: false }));
    }
  };

  const clearFrame = (setter: React.Dispatch<React.SetStateAction<FrameImage>>, current: FrameImage) => {
    if (current.preview) URL.revokeObjectURL(current.preview);
    setter(EMPTY_FRAME);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(file); });

  const addElement = () => {
    setElements((prev) => [...prev, { name: '', description: '', element_input_urls: [] }]);
    setElementFiles((prev) => [...prev, { previews: [], files: [] }]);
  };
  const removeElement = (i: number) => {
    setElements((prev) => prev.filter((_, idx) => idx !== i));
    setElementFiles((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateElement = (i: number, field: 'name' | 'description', val: string) =>
    setElements((prev) => prev.map((el, idx) => idx === i ? { ...el, [field]: val } : el));
  const addElementImages = (i: number, files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    setElementFiles((prev) => prev.map((ef, idx) => idx === i
      ? { files: [...ef.files, ...valid], previews: [...ef.previews, ...valid.map((f) => URL.createObjectURL(f))] } : ef));
  };
  const removeElementImage = (elIdx: number, imgIdx: number) =>
    setElementFiles((prev) => prev.map((ef, idx) => idx === elIdx
      ? { files: ef.files.filter((_, i) => i !== imgIdx), previews: ef.previews.filter((_, i) => i !== imgIdx) } : ef));

  const buildElementsPayload = async (): Promise<KlingElement[]> => {
    const result: KlingElement[] = [];
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el.name.trim()) continue;
      const urls = await Promise.all((elementFiles[i]?.files || []).map(fileToBase64));
      result.push({ name: el.name, description: el.description, element_input_urls: urls });
    }
    return result;
  };

  const buildPayload = async (): Promise<Record<string, unknown>> => {
    if (activeMode === 'text_to_video') {
      const klingElements = showElements ? await buildElementsPayload() : [];
      return {
        model: 'kling-3.0/video',
        input: {
          prompt,
          duration,
          aspect_ratio: aspectRatio,
          mode: klingMode,
          sound: effectiveSound,
          multi_shots: multiShots,
          ...(klingElements.length > 0 ? { kling_elements: klingElements } : {}),
        },
      };
    }
    if (activeMode === 'image_to_video') {
      const imageUrls: string[] = [];
      if (startFrame.url) imageUrls.push(startFrame.url);
      if (endFrame.url) imageUrls.push(endFrame.url);
      return {
        model: 'kling-3.0/video',
        input: {
          prompt,
          image_urls: imageUrls,
          duration,
          aspect_ratio: aspectRatio,
          mode: klingMode,
          sound: effectiveSound,
          multi_shots: false,
        },
      };
    }
    if (activeMode === 'multi_prompt') {
      const validScenes = scenes.filter((s) => s.prompt.trim());
      const totalDur = validScenes.reduce((sum, s) => sum + s.duration, 0);
      return {
        model: 'kling-3.0/video',
        input: {
          multi_shots: true,
          sound: true,
          multi_prompt: validScenes.map((s) => ({ prompt: s.prompt, duration: s.duration })),
          duration: String(totalDur),
          aspect_ratio: aspectRatio,
          mode: klingMode,
        },
      };
    }
    if (activeMode === 'camera_control') {
      const imageUrls: string[] = [];
      if (cameraRefFrame.url) imageUrls.push(cameraRefFrame.url);
      return {
        model: 'kling-3.0/video',
        input: {
          prompt,
          ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
          duration,
          aspect_ratio: aspectRatio,
          camera_control: { type: cameraMotion, config: { intensity: cameraIntensity } },
        },
      };
    }
    return {};
  };

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (activeMode === 'text_to_video' && !prompt.trim()) { toast.error('Enter a prompt'); return; }
    if (activeMode === 'image_to_video') {
      if (!startFrame.file) { toast.error('Upload a start frame image'); return; }
      if (startFrame.uploading || endFrame.uploading) { toast.error('Image still uploading, please wait'); return; }
      if (!startFrame.url) { toast.error('Start frame upload failed, try again'); return; }
    }
    if (activeMode === 'multi_prompt') {
      const validScenes = scenes.filter((s) => s.prompt.trim());
      if (validScenes.length < 1) { toast.error('Add at least 1 scene prompt'); return; }
      const totalDur = validScenes.reduce((sum, s) => sum + s.duration, 0);
      if (totalDur < 3 || totalDur > 15) { toast.error(`Total duration must be 3–15s (currently ${totalDur}s)`); return; }
    }
    if (activeMode === 'camera_control') {
      if (!prompt.trim()) { toast.error('Enter a prompt'); return; }
      if (cameraRefFrame.uploading) { toast.error('Reference image still uploading'); return; }
    }

    setGenerating(true);
    setResultUrl('');
    setProgress('Submitting...');
    startTimer();

    try {
      const body = await buildPayload();
      const data = await kiePost('/api/v1/jobs/createTask', body, apiKey);
      const taskId = extractTaskId(data);
      if (!taskId) { toast.error('No task ID returned from Kling 3.0'); return; }

      setProgress('Generating video...');
      const url = await pollForResult(taskId, apiKey);
      if (url) {
        setResultUrl(url);
        await saveAsset(url);
        const label = `${activeMode.replace(/_/g, ' ')} — ${new Date().toLocaleTimeString()}`;
        setStoryCards((prev) => [...prev, { type: 'video', url, label }]);
        toast.success('Kling 3.0 video generated');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      stopTimer();
      setGenerating(false);
      setProgress('');
    }
  };

  const pollForResult = async (taskId: string, apiKey: string): Promise<string | null> => {
    let attempts = 0;
    while (attempts < 180) {
      const waitTime = attempts < 5 ? 3000 : attempts < 20 ? 5000 : 8000;
      await new Promise((r) => setTimeout(r, waitTime));
      try {
        const data = await kieGet(`/api/v1/jobs/recordInfo?taskId=${taskId}`, apiKey);
        const result = parseMarketPoll(data);
        if (result.done) {
          if (result.failed || result.urls.length === 0) { toast.error('Generation failed'); return null; }
          return result.urls[0];
        }
        setProgress(`Generating... (${Math.round((attempts + 1) * (waitTime / 1000))}s)`);
      } catch { /* retry */ }
      attempts++;
    }
    toast.error('Generation timed out');
    return null;
  };

  const saveAsset = async (url: string) => {
    if (!user) return;
    try {
      const assetId = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, assetId, url);
      await supabase.from('media_assets').insert({
        id: assetId, user_id: user.id, type: 'video',
        title: (prompt || scenes[0]?.prompt || 'Kling 3.0').slice(0, 100),
        prompt: prompt || scenes.map((s) => s.prompt).join(' | '),
        provider: 'kie_ai', status: 'completed',
        result_url: uploaded?.publicUrl || url, storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: { mode: activeMode, model: 'kling-3.0/video', duration, aspectRatio, klingMode, sound: effectiveSound },
      });
    } catch { /* non-critical */ }
  };

  const isGenerateDisabled = generating ||
    (activeMode === 'text_to_video' && !prompt.trim()) ||
    (activeMode === 'image_to_video' && (!startFrame.file || startFrame.uploading || endFrame.uploading || !startFrame.url)) ||
    (activeMode === 'multi_prompt' && (scenes.filter((s) => s.prompt.trim()).length < 1 || multiShotsTotalDuration < 3 || multiShotsTotalDuration > 15)) ||
    (activeMode === 'camera_control' && (!prompt.trim() || cameraRefFrame.uploading));

  const cameraMotionGroups = allCameraMotions.reduce<Record<string, typeof allCameraMotions>>((acc, cm) => {
    const cat = cm.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cm);
    return acc;
  }, {});

  const soundForced = activeMode === 'multi_prompt' || multiShots;

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes k3Bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes k3FadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center">
            <Video className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Kling 3.0 Studio</h2>
            <p className="text-[11px] text-gray-500">State-of-the-art video generation</p>
          </div>
        </div>
        <a href="https://docs.kie.ai/market/kling/kling-3-0" target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-[11px] font-bold tracking-wider hover:bg-[#FF6B00]/20 transition-colors">
          KLING 3.0 <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      <div className="flex gap-1 p-1 bg-dark-900/60 rounded-xl border border-white/5">
        {KLING_MODES.map((m) => (
          <button key={m.key} onClick={() => setActiveMode(m.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              activeMode === m.key ? 'gradient-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <div key={activeMode} className="space-y-4" style={{ animation: 'k3FadeIn 0.3s ease-out' }}>
        <div className="glass-card rounded-xl p-6 space-y-5">

          {activeMode === 'text_to_video' && videoTemplates.length > 0 && (
            <TemplatePicker templates={videoTemplates} onApply={applyTemplate} />
          )}

          {activeMode === 'image_to_video' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-400 leading-relaxed">
                  <span className="font-semibold">Start Frame</span> is required — sets the opening of the video.
                  <span className="font-semibold"> End Frame</span> is optional — defines how the video closes.
                  Output aspect ratio follows the start frame image.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <FrameUploadSlot label="Start Frame" frame={startFrame}
                  onSelect={(f) => uploadFrame(f, setStartFrame)} onClear={() => clearFrame(setStartFrame, startFrame)} required />
                <FrameUploadSlot label="End Frame (optional)" frame={endFrame}
                  onSelect={(f) => uploadFrame(f, setEndFrame)} onClear={() => clearFrame(setEndFrame, endFrame)} />
              </div>
            </div>
          )}

          {activeMode === 'camera_control' && (
            <FrameUploadSlot label="Reference Image (optional)" frame={cameraRefFrame}
              onSelect={(f) => uploadFrame(f, setCameraRefFrame)} onClear={() => clearFrame(setCameraRefFrame, cameraRefFrame)} />
          )}

          {activeMode !== 'multi_prompt' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                {activeMode === 'image_to_video' ? 'Motion Prompt' : activeMode === 'camera_control' ? 'Scene Prompt' : 'Prompt'}
              </label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                rows={activeMode === 'text_to_video' ? 4 : 3}
                placeholder={activeMode === 'text_to_video' ? 'Describe the video scene in vivid detail...' :
                  activeMode === 'image_to_video' ? 'Describe the motion to apply to the image...' :
                  'Describe the scene with camera movement...'}
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none" />
            </div>
          )}

          {activeMode === 'multi_prompt' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-400 space-y-0.5">
                  <p>Up to <span className="font-semibold">5 scenes</span>. Total duration <span className="font-semibold">3–15s</span>. Each scene 1–12s. Sound always on.</p>
                  <p>Total: <span className={`font-semibold ${multiShotsTotalDuration > 15 || multiShotsTotalDuration < 3 ? 'text-red-400' : 'text-amber-300'}`}>{multiShotsTotalDuration}s</span>
                    {multiShotsTotalDuration > 15 && <span className="text-red-400 ml-1">(exceeds 15s limit)</span>}
                  </p>
                </div>
              </div>
              {scenes.map((scene, i) => (
                <div key={i} className="p-4 rounded-xl bg-dark-800/50 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Scene {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-gray-500 flex items-center gap-1.5">Duration (s)
                        <input type="number" min={1} max={12} value={scene.duration}
                          onChange={(e) => {
                            const val = Math.min(12, Math.max(1, parseInt(e.target.value) || 1));
                            setScenes((prev) => prev.map((s, idx) => idx === i ? { ...s, duration: val } : s));
                          }}
                          className="w-14 px-2 py-1 bg-dark-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF6B00] text-center" />
                      </label>
                      {scenes.length > 1 && (
                        <button onClick={() => setScenes((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea value={scene.prompt} maxLength={500}
                    onChange={(e) => setScenes((prev) => prev.map((s, idx) => idx === i ? { ...s, prompt: e.target.value } : s))}
                    rows={2} placeholder={`Describe scene ${i + 1}...`}
                    className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none" />
                  <div className="text-right text-[10px] text-gray-600">{scene.prompt.length}/500</div>
                </div>
              ))}
              {scenes.length < 5 && (
                <button onClick={() => setScenes((prev) => [...prev, { prompt: '', duration: 3 }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add Scene ({scenes.length}/5)
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <p className="text-[11px] text-emerald-400">Sound is automatically enabled in multi-shot mode (API requirement)</p>
              </div>
            </div>
          )}

          {activeMode === 'camera_control' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Camera Movement
                  {customCameraMovements.length > 0 && <span className="ml-2 text-[10px] text-blue-400">+{customCameraMovements.length} custom</span>}
                </label>
                {Object.entries(cameraMotionGroups).map(([groupName, motions]) => (
                  <div key={groupName} className="mb-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">{groupName}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {motions.map((cm) => {
                        const customData = customCameraMovements.find((c) => c.value === cm.value);
                        const previewUrl = customData?.preview_video_url;
                        return (
                          <div key={cm.value} className="relative group/cam">
                            <button
                              onClick={() => { setCameraMotion(cm.value); if (customData) setCameraIntensity(customData.intensity_default); }}
                              className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all relative ${
                                cameraMotion === cm.value ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-[#FF6B00]/20'
                              }`}>
                              {cm.label}
                              {'isCustom' in cm && cm.isCustom && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400" />}
                              {previewUrl && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />}
                            </button>
                            {previewUrl && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 hidden group-hover/cam:block pointer-events-none">
                                <div className="bg-dark-900 rounded-xl border border-white/10 p-1.5 shadow-2xl">
                                  <video src={previewUrl} className="w-32 h-20 object-cover rounded-lg" autoPlay muted loop />
                                  <p className="text-[9px] text-center text-gray-500 mt-1">{cm.label}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Intensity: {cameraIntensity}</label>
                <input type="range" min="1" max="10" step="1" value={cameraIntensity}
                  onChange={(e) => setCameraIntensity(parseInt(e.target.value))} className="w-full accent-[#FF6B00]" />
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Subtle</span><span>Extreme</span></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 items-start">
            {activeMode !== 'multi_prompt' ? (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Duration</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DURATIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${duration === d ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Total Duration</label>
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  multiShotsTotalDuration > 15 || multiShotsTotalDuration < 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-dark-800 border-white/10 text-gray-300'
                }`}>{multiShotsTotalDuration}s / 15s</span>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-2">Aspect Ratio</label>
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button key={ar} onClick={() => setAspectRatio(ar)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${aspectRatio === ar ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {activeMode !== 'camera_control' && (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Mode</label>
                <ModeToggle value={klingMode} onChange={(v) => setKlingMode(v as 'std' | 'pro')}
                  options={[{ value: 'std', label: 'Std' }, { value: 'pro', label: 'Pro' }]} />
              </div>
            )}
          </div>

          {(activeMode === 'text_to_video' || activeMode === 'image_to_video') && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <ToggleButton
                  value={effectiveSound}
                  onChange={soundForced ? () => {} : setSound}
                  disabled={soundForced}
                  onLabel="Sound On"
                  offLabel="Sound Off"
                  onIcon={Volume2}
                  offIcon={VolumeX}
                  color="#10b981"
                />
                {activeMode === 'text_to_video' && (
                  <ToggleButton
                    value={multiShots}
                    onChange={(v) => { setMultiShots(v); if (v) setSound(true); }}
                    onLabel="Multi Shots On"
                    offLabel="Multi Shots Off"
                    onIcon={Layers}
                    offIcon={Layers}
                    color="#FF6B00"
                  />
                )}
              </div>
              {soundForced && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-400">
                    Sound is forced <span className="font-semibold">ON</span> — required by API when <code className="font-mono bg-emerald-900/20 px-1 rounded">multi_shots: true</code>
                  </p>
                </div>
              )}
            </div>
          )}

          {activeMode === 'text_to_video' && (
            <div>
              <button onClick={() => setShowElements(!showElements)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showElements ? 'rotate-180' : ''}`} />
                Kling Elements (Character / Object Consistency)
              </button>
              {showElements && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-400">
                      Upload 2–50 reference images per element. Reference in prompt with <code className="font-mono bg-blue-900/20 px-1 rounded">@element_name</code>.
                    </p>
                  </div>
                  {elements.map((el, i) => (
                    <div key={i} className="p-4 rounded-xl bg-dark-800/50 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">Element {i + 1}</span>
                        <button onClick={() => removeElement(i)} className="text-gray-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-1">Name</label>
                          <input value={el.name} onChange={(e) => updateElement(i, 'name', e.target.value)} placeholder="e.g. element_dog"
                            className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#FF6B00]" />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-1">Description</label>
                          <input value={el.description} onChange={(e) => updateElement(i, 'description', e.target.value)} placeholder="Describe the element..."
                            className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#FF6B00]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1.5">
                          Reference Images <span className="text-gray-600">({elementFiles[i]?.files.length || 0} / min 2)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {elementFiles[i]?.previews.map((src, ii) => (
                            <div key={ii} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 group">
                              <img src={src} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeElementImage(i, ii)}
                                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="flex items-center justify-center w-14 h-14 rounded-lg border-2 border-dashed border-white/10 hover:border-[#FF6B00]/30 cursor-pointer bg-dark-900/50 transition-colors">
                            <input type="file" accept="image/*" multiple className="hidden"
                              onChange={(e) => addElementImages(i, Array.from(e.target.files || []))} />
                            <Plus className="w-4 h-4 text-gray-600" />
                          </label>
                        </div>
                        {(elementFiles[i]?.files.length || 0) > 0 && (elementFiles[i]?.files.length || 0) < 2 && (
                          <p className="text-[10px] text-amber-400 mt-1">Minimum 2 images required per element</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={addElement} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Element
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-dark-900/60 border border-white/5 font-mono text-[10px] text-gray-500">
            <span className="text-gray-600">Payload</span>
            <span className="text-[#FF6B00]/70">multi_shots: <span className={activeMode === 'multi_prompt' || multiShots ? 'text-emerald-400' : 'text-gray-400'}>{String(activeMode === 'multi_prompt' ? true : multiShots)}</span></span>
            <span className="text-[#FF6B00]/70">sound: <span className={effectiveSound ? 'text-emerald-400' : 'text-gray-400'}>{String(effectiveSound)}</span></span>
            <span className="text-[#FF6B00]/70">mode: <span className="text-cyan-400">{klingMode}</span></span>
          </div>

          <button onClick={handleGenerate} disabled={isGenerateDisabled}
            className="w-full py-3.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#FF6B00]/20 active:scale-[0.99]">
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{progress || 'Generating...'}<span className="text-xs opacity-60">({elapsed}s)</span></>
            ) : (
              <><Sparkles className="w-5 h-5" />Generate with Kling 3.0</>
            )}
          </button>
        </div>

        {generating && (
          <div className="glass-card rounded-xl p-4">
            <GeneratingCard elapsed={elapsed} progress={progress} />
          </div>
        )}

        {resultUrl && !generating && (
          <div className="glass-card rounded-xl p-4">
            <VideoResultPanel url={resultUrl} title={activeMode} onClear={() => setResultUrl('')} />
          </div>
        )}

        {storyCards.length > 0 && <StoryBoard cards={storyCards} />}
      </div>
    </div>
  );
}
