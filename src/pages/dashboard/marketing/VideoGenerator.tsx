import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Upload, Film, Mic2, X, Plus, Download, Video, ArrowRightLeft, Scissors, Volume2, PlusCircle, ChevronDown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl, uploadMediaToStorage } from '../../../lib/mediaDB';
import { extractTaskId, parseMarketPoll } from '../../../lib/marketing/kieApi';
import { useCustomModels } from '../../../lib/marketing/useCustomModels';
import { getBuiltinModelsForCategory, type BuiltinVideoModel } from '../../../lib/marketing/builtinVideoModels';
import type { InputField } from '../../../lib/marketing/curlParser';

type VideoMode = 'text_to_video' | 'image_to_video' | 'video_to_video' | 'video_editing' | 'speech_to_video' | 'lip_sync';

const KIE_BASE = 'https://api.kie.ai';

const MODES: { key: VideoMode; label: string; icon: React.ElementType; desc: string; category: string }[] = [
  { key: 'text_to_video', label: 'Text to Video', icon: Film, desc: 'Generate video from a text prompt', category: 'text-to-video' },
  { key: 'image_to_video', label: 'Image to Video', icon: Upload, desc: 'Animate a static image into video', category: 'image-to-video' },
  { key: 'video_to_video', label: 'Video to Video', icon: ArrowRightLeft, desc: 'Transform or restyle existing video', category: 'video-to-video' },
  { key: 'video_editing', label: 'Video Editing', icon: Scissors, desc: 'Edit or enhance video content', category: 'video-editing' },
  { key: 'speech_to_video', label: 'Speech to Video', icon: Volume2, desc: 'Generate video from speech/audio', category: 'speech-to-video' },
  { key: 'lip_sync', label: 'Lip Sync', icon: Mic2, desc: 'Sync lip movements to audio', category: 'lip-sync' },
];

const CATEGORY_KEYS = MODES.map((m) => m.category);

const SKIP_KEYS = new Set(['callbackurl', 'callback_url', 'model', 'image_url', 'image_urls', 'video_url', 'video_urls', 'image', 'audio_url']);

interface VideoSlot {
  status: 'generating' | 'done' | 'failed';
  url: string | null;
  elapsed: number;
}

function VideoSkeletonCard({ elapsed }: { elapsed: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-dark-800 aspect-video">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 animate-pulse" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-400/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/80 animate-pulse">Generating Video</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{elapsed}s elapsed</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
              style={{ animation: `vgBounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, (elapsed / 60) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function VideoResultCard({ url, onDownload }: { url: string; onDownload: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video" style={{ animation: 'vgFadeIn 0.5s ease-out' }}>
      <video src={url} controls className="w-full h-full object-contain bg-black" />
      <div className="absolute top-2 right-2">
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white text-xs font-medium hover:bg-black/80 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>
    </div>
  );
}

interface UploadedFile {
  file: File;
  preview: string;
  uploadedUrl: string | null;
  uploading: boolean;
}

function FileUploadArea({
  label,
  accept,
  files,
  onAdd,
  onRemove,
  hint,
  accentColor,
}: {
  label: string;
  accept: string;
  files: UploadedFile[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
  hint?: string;
  accentColor?: string;
}) {
  const accent = accentColor || 'border-blue-400/40';
  const isVideo = accept.includes('video');

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-3">
        {files.map((f, i) => (
          <div key={i} className={`relative rounded-xl overflow-hidden border border-white/10 group ${isVideo ? 'w-48 h-28' : 'w-24 h-24'}`}>
            {isVideo ? (
              <video src={f.preview} className="w-full h-full object-cover" />
            ) : (
              <img src={f.preview} alt="" className="w-full h-full object-cover" />
            )}
            {f.uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
            {f.uploadedUrl && !f.uploading && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/80 text-white text-[9px] font-bold">OK</div>
            )}
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 hover:${accent} cursor-pointer transition-colors bg-dark-800/50 ${isVideo ? 'w-48 h-28' : 'w-24 h-24'}`}>
          <input
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => onAdd(Array.from(e.target.files || []))}
          />
          <Plus className="w-5 h-5 text-gray-500 mb-1" />
          <p className="text-[11px] text-gray-500">{isVideo ? 'Add video' : 'Add image'}</p>
        </label>
      </div>
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

function EmptyModelState({ mode }: { mode: typeof MODES[number] }) {
  return (
    <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
        <mode.icon className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No {mode.label} Models Added</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">
        Add custom {mode.label.toLowerCase()} models via the API Console. Go to{' '}
        <span className="text-blue-400">Settings &rarr; API Console</span> and save a model with type "{mode.label}".
      </p>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
        <PlusCircle className="w-4 h-4" />
        Add Model in Settings &rarr; API Console
      </div>
    </div>
  );
}

interface ModelEntry {
  id: string;
  name: string;
  badge?: string;
  is_builtin?: boolean;
}

function ModelPicker({
  models,
  selectedId,
  onSelect,
}: {
  models: ModelEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find((m) => m.id === selectedId);

  const builtins = models.filter((m) => m.is_builtin);
  const customs = models.filter((m) => !m.is_builtin);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selected?.is_builtin ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-400">
              {selected?.badge || 'Built-in'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400">Custom</span>
          )}
          <span className="font-medium">{selected?.name || 'Select a model'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-dark-800 border border-white/10 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
          {builtins.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[9px] text-gray-500 uppercase tracking-widest font-semibold border-b border-white/5">
                Built-in Models
              </div>
              {builtins.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${m.id === selectedId ? 'text-teal-400 bg-teal-500/5' : 'text-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-teal-400/60 flex-shrink-0" />
                    <span>{m.name}</span>
                    {m.badge && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-teal-500/10 text-teal-400">{m.badge}</span>}
                  </div>
                  {m.id === selectedId && <span className="text-[10px] font-bold text-teal-400">SELECTED</span>}
                </button>
              ))}
            </>
          )}
          {customs.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[9px] text-gray-500 uppercase tracking-widest font-semibold border-b border-white/5 border-t border-white/5 mt-0.5">
                My Custom Models
              </div>
              {customs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${m.id === selectedId ? 'text-blue-400 bg-blue-500/5' : 'text-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400">CUSTOM</span>
                  </div>
                  {m.id === selectedId && <span className="text-[10px] font-bold text-blue-400">SELECTED</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DynamicFieldInput({
  field,
  value,
  onChange,
}: {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-dark-700 border border-white/10'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={String(value ?? '')}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-400"
      />
    );
  }

  if (field.type === 'array') {
    return (
      <textarea
        value={typeof value === 'string' ? value : JSON.stringify(value)}
        onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }}
        rows={2}
        className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-400 resize-none"
      />
    );
  }

  if (field.key === 'prompt') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Describe the video scene in detail..."
        className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-400 resize-none"
      />
    );
  }

  const isLong = typeof value === 'string' && value.length > 60;
  if (isLong) {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-400 resize-none"
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-400"
    />
  );
}

function SchemaFields({
  schema,
  values,
  onChange,
}: {
  schema: InputField[];
  values: Record<string, unknown>;
  onChange: (path: string, value: unknown) => void;
}) {
  const visible = schema.filter((f) => !SKIP_KEYS.has(f.key.toLowerCase()));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Model Parameters</p>
      {visible.map((field) => (
        <div key={field.path} className={`flex gap-3 ${field.type === 'boolean' ? 'items-center' : 'items-start'}`}>
          <div className="w-40 flex-shrink-0 pt-2">
            <p className="text-[11px] text-gray-300 font-medium truncate" title={field.key}>{field.label || field.key}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                field.type === 'boolean' ? 'bg-blue-500/10 text-blue-400' :
                field.type === 'number' ? 'bg-emerald-500/10 text-emerald-400' :
                field.type === 'array' ? 'bg-amber-500/10 text-amber-400' :
                'bg-white/5 text-gray-500'
              }`}>
                {field.type}
              </span>
              {field.required && <span className="text-[8px] text-red-400 font-bold">REQ</span>}
            </div>
          </div>
          <div className="flex-1">
            <DynamicFieldInput
              field={field}
              value={values[field.path] ?? field.value}
              onChange={(v) => onChange(field.path, v)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ModeGeneratorProps {
  mode: typeof MODES[number];
  user: { id: string } | null;
}

function VideoModeGenerator({ mode, user }: ModeGeneratorProps) {
  const rawCustomModels = useCustomModels(user?.id, CATEGORY_KEYS as string[]);
  const customModels = rawCustomModels.filter((m) => m.category === mode.category);
  const builtinModels = getBuiltinModelsForCategory(mode.category);

  type AnyModel = (typeof customModels[number]) | BuiltinVideoModel;

  const allModels: AnyModel[] = [
    ...builtinModels,
    ...customModels,
  ];

  const [selectedModel, setSelectedModel] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [videoFiles, setVideoFiles] = useState<UploadedFile[]>([]);
  const [imageFiles, setImageFiles] = useState<UploadedFile[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [slot, setSlot] = useState<VideoSlot | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (allModels.length > 0 && !selectedModel) {
      setSelectedModel(allModels[0].id);
    }
  }, [allModels.length]);

  const activeModel = allModels.find((m) => m.id === selectedModel);

  useEffect(() => {
    if (!activeModel) return;
    const init: Record<string, unknown> = {};
    for (const f of activeModel.input_schema || []) {
      init[f.path] = f.value;
    }
    setFieldValues(init);
  }, [selectedModel]);

  useEffect(() => () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); }, []);

  const startTimer = () => {
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    const start = Date.now();
    elapsedTimer.current = setInterval(() => {
      setSlot((prev) => prev ? { ...prev, elapsed: Math.floor((Date.now() - start) / 1000) } : prev);
    }, 1000);
  };

  const stopTimer = () => {
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
  };

  const uploadFile = useCallback(async (file: File, idx: number, setter: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    if (!user) return;
    setter((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: true } : f));
    try {
      const assetId = `vid-src-${crypto.randomUUID()}`;
      const result = await uploadMediaToStorage(user.id, assetId, file, file.type);
      setter((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: false, uploadedUrl: result?.publicUrl || null } : f));
    } catch {
      setter((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: false } : f));
    }
  }, [user]);

  const addVideoFiles = async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('video/'));
    const newFiles: UploadedFile[] = valid.map((f) => ({ file: f, preview: URL.createObjectURL(f), uploadedUrl: null, uploading: false }));
    setVideoFiles((prev) => {
      const updated = [...prev, ...newFiles];
      newFiles.forEach((_, i) => {
        setTimeout(() => uploadFile(valid[i], prev.length + i, setVideoFiles), 0);
      });
      return updated;
    });
  };

  const addImageFiles = async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    const newFiles: UploadedFile[] = valid.map((f) => ({ file: f, preview: URL.createObjectURL(f), uploadedUrl: null, uploading: false }));
    setImageFiles((prev) => {
      const updated = [...prev, ...newFiles];
      newFiles.forEach((_, i) => {
        setTimeout(() => uploadFile(valid[i], prev.length + i, setImageFiles), 0);
      });
      return updated;
    });
  };

  const buildBody = (): Record<string, unknown> => {
    if (!activeModel) return {};
    const body = { ...activeModel.default_input };
    const input = (body.input as Record<string, unknown>) || {};

    for (const [path, val] of Object.entries(fieldValues)) {
      const parts = path.split('.');
      if (parts[0] === 'input' && parts.length > 1) {
        input[parts.slice(1).join('.')] = val;
      } else {
        body[path] = val;
      }
    }

    const videoUrls = videoFiles.filter((f) => f.uploadedUrl).map((f) => f.uploadedUrl as string);
    const imageUrls = imageFiles.filter((f) => f.uploadedUrl).map((f) => f.uploadedUrl as string);

    if (videoUrls.length > 0) {
      input.video_url = videoUrls[0];
      input.video_urls = videoUrls;
    }
    if (imageUrls.length > 0) {
      input.image_url = imageUrls[0];
      input.image_urls = imageUrls;
    }

    body.input = input;
    if (activeModel.model_id) body.model = activeModel.model_id;
    return body;
  };

  const handleGenerate = async () => {
    if (!activeModel) { toast.error('Select a model'); return; }
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }

    const needsInput = mode.key === 'image_to_video' || mode.key === 'video_to_video' || mode.key === 'video_editing';
    if (needsInput && videoFiles.length === 0 && imageFiles.length === 0) {
      toast.error('Upload a source file first');
      return;
    }
    const anyUploading = [...videoFiles, ...imageFiles].some((f) => f.uploading);
    if (anyUploading) { toast.error('Files are still uploading, please wait'); return; }

    abortRef.current = false;
    setSlot({ status: 'generating', url: null, elapsed: 0 });
    setIsGenerating(true);
    startTimer();

    try {
      const body = buildBody();
      const endpoint = `${KIE_BASE}${activeModel.endpoint}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setSlot((prev) => prev ? { ...prev, status: 'failed' } : prev);
        toast.error(data.msg || data.message || 'Generation failed');
        return;
      }

      const taskId = extractTaskId(data);
      if (!taskId) {
        setSlot((prev) => prev ? { ...prev, status: 'failed' } : prev);
        toast.error('No task ID returned');
        return;
      }

      const url = await pollForResult(taskId, apiKey);
      if (url) {
        setSlot((prev) => prev ? { ...prev, status: 'done', url } : prev);
        await saveAsset(url);
        toast.success('Video generated');
      } else {
        setSlot((prev) => prev ? { ...prev, status: 'failed' } : prev);
      }
    } catch (err) {
      setSlot((prev) => prev ? { ...prev, status: 'failed' } : prev);
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      stopTimer();
      setIsGenerating(false);
    }
  };

  const pollForResult = async (taskId: string, apiKey: string): Promise<string | null> => {
    let attempts = 0;
    while (attempts < 360) {
      if (abortRef.current) return null;
      const waitTime = attempts < 3 ? 4000 : attempts < 10 ? 6000 : attempts < 30 ? 8000 : 10000;
      await new Promise((r) => setTimeout(r, waitTime));
      try {
        const res = await fetch(`${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await res.json();
        const result = parseMarketPoll(data);
        if (result.done) {
          if (result.failed || result.urls.length === 0) return null;
          return result.urls[0];
        }
      } catch { /* retry */ }
      attempts++;
    }
    return null;
  };

  const saveAsset = async (url: string) => {
    if (!user) return;
    const promptField = activeModel?.input_schema?.find((f) => f.key === 'prompt');
    const promptVal = promptField ? String(fieldValues[promptField.path] ?? '') : '';
    try {
      const assetId = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, assetId, url);
      await supabase.from('media_assets').insert({
        id: assetId, user_id: user.id, type: 'video', title: promptVal.slice(0, 100) || mode.label,
        prompt: promptVal, provider: 'kie_ai', status: 'completed',
        result_url: uploaded?.publicUrl || url, storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: { mode: mode.key, model: activeModel?.name || '', category: mode.category },
      });
    } catch { /* non-critical */ }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-${mode.category}-${Date.now()}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const needsVideo = mode.key === 'video_to_video' || mode.key === 'video_editing';
  const needsImage = mode.key === 'image_to_video';
  const needsAudio = mode.key === 'speech_to_video' || mode.key === 'lip_sync';
  const schema = activeModel?.input_schema || [];

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes vgBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes vgFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">AI Model</label>
          <ModelPicker
            models={allModels.map((m) => ({
              id: m.id,
              name: m.name,
              badge: (m as BuiltinVideoModel).badge,
              is_builtin: (m as BuiltinVideoModel).is_builtin,
            }))}
            selectedId={selectedModel}
            onSelect={setSelectedModel}
          />
        </div>

        {needsVideo && (
          <FileUploadArea
            label="Source Video(s)"
            accept="video/*"
            files={videoFiles}
            onAdd={addVideoFiles}
            onRemove={(i) => setVideoFiles((prev) => prev.filter((_, idx) => idx !== i))}
            hint="Upload the video to transform or edit"
            accentColor="border-blue-400/40"
          />
        )}

        {needsImage && (
          <FileUploadArea
            label="Source Image(s)"
            accept="image/*"
            files={imageFiles}
            onAdd={addImageFiles}
            onRemove={(i) => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
            hint="Upload image(s) to animate into video"
            accentColor="border-blue-400/40"
          />
        )}

        {(mode.key === 'lip_sync' || mode.key === 'speech_to_video') && (
          <div className="space-y-3">
            <FileUploadArea
              label="Face / Character Image"
              accept="image/*"
              files={imageFiles}
              onAdd={addImageFiles}
              onRemove={(i) => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
              hint="Upload the face or character image"
              accentColor="border-blue-400/40"
            />
            {needsAudio && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Audio File (optional)</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-blue-400/30 cursor-pointer bg-dark-800/50 transition-colors w-full">
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                  <Mic2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  {audioFile ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-white truncate">{audioFile.name}</span>
                      <button onClick={(e) => { e.preventDefault(); setAudioFile(null); }} className="text-gray-500 hover:text-red-400 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Upload audio for {mode.label.toLowerCase()}</span>
                  )}
                </label>
              </div>
            )}
          </div>
        )}

        {schema.length > 0 ? (
          <SchemaFields
            schema={schema}
            values={fieldValues}
            onChange={(path, value) => setFieldValues((prev) => ({ ...prev, [path]: value }))}
          />
        ) : (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Prompt</label>
            <textarea
              value={String(fieldValues['input.prompt'] ?? '')}
              onChange={(e) => setFieldValues((prev) => ({ ...prev, 'input.prompt': e.target.value }))}
              rows={4}
              placeholder={
                mode.key === 'text_to_video' ? 'Describe the video scene in detail...' :
                mode.key === 'image_to_video' ? 'Describe the motion or animation to apply...' :
                mode.key === 'video_to_video' ? 'Describe how to transform the video style...' :
                mode.key === 'video_editing' ? 'Describe the edits to make...' :
                mode.key === 'speech_to_video' ? 'Describe the video to generate from speech...' :
                'Write the dialogue or script the character should speak...'
              }
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating video...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate with {allModels.find((m) => m.id === selectedModel)?.name || 'Model'}
            </>
          )}
        </button>
      </div>

      {slot && (
        <div className="glass-card rounded-xl p-4">
          {slot.status === 'generating' && <VideoSkeletonCard elapsed={slot.elapsed} />}
          {slot.status === 'done' && slot.url && (
            <VideoResultCard url={slot.url} onDownload={() => handleDownload(slot.url!)} />
          )}
          {slot.status === 'failed' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Video className="w-10 h-10 text-red-400/30" />
              <p className="text-sm text-red-400/60 font-medium">Generation failed</p>
              <button onClick={() => setSlot(null)} className="text-xs text-gray-500 hover:text-white transition-colors">Dismiss</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoGenerator() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<VideoMode>('text_to_video');

  const currentMode = MODES.find((m) => m.key === activeMode)!;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 bg-dark-900/60 rounded-xl border border-white/5 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMode(m.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              activeMode === m.key
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      <div key={activeMode}>
        <VideoModeGenerator mode={currentMode} user={user} />
      </div>
    </div>
  );
}
