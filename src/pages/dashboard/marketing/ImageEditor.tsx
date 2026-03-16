import { useState, useRef } from 'react';
import { Loader2, Wand2, Upload, Eraser, Palette, ArrowUpCircle, Paintbrush, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl } from '../../../lib/mediaDB';
import { extractTaskId, parseMarketPoll } from '../../../lib/marketing/kieApi';

const KIE_BASE = 'https://api.kie.ai';

type EditMode = 'remove_bg' | 'style_transfer' | 'upscale' | 'inpaint';

const EDIT_MODES: { key: EditMode; label: string; icon: React.ElementType; desc: string; model: string }[] = [
  { key: 'remove_bg', label: 'Remove Background', icon: Eraser, desc: 'Remove image background', model: 'recraft/remove-background' },
  { key: 'style_transfer', label: 'Style Transfer', icon: Palette, desc: 'Apply an art style to your image', model: 'seedream/4.5-text-to-image' },
  { key: 'upscale', label: 'Upscale', icon: ArrowUpCircle, desc: 'Enhance resolution 2x-4x', model: 'recraft/crisp-upscale' },
  { key: 'inpaint', label: 'Inpaint', icon: Paintbrush, desc: 'Edit specific areas with AI', model: 'seedream/4.5-text-to-image' },
];

const STYLE_OPTIONS = [
  'Oil Painting', 'Watercolor', 'Anime', 'Comic Book',
  'Pixel Art', 'Pencil Sketch', 'Cyberpunk', 'Studio Ghibli',
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function ImageEditor() {
  const { user } = useAuth();
  const [mode, setMode] = useState<EditMode>('remove_bg');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pollProgress, setPollProgress] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Oil Painting');
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = EDIT_MODES.find((m) => m.key === mode)!;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResultUrl('');
  };

  const handleProcess = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings > Integrations'); return; }
    if (!imageFile) { toast.error('Upload an image first'); return; }

    setProcessing(true);
    setResultUrl('');
    setPollProgress('Preparing...');

    try {
      const base64 = await fileToBase64(imageFile);
      let prompt = '';
      if (mode === 'remove_bg') prompt = 'Remove the background completely';
      else if (mode === 'style_transfer') prompt = `Transform this image into ${selectedStyle} style`;
      else if (mode === 'upscale') prompt = 'Upscale and enhance this image to higher resolution';
      else if (mode === 'inpaint') prompt = inpaintPrompt;

      const body: Record<string, unknown> = {
        model: currentMode.model,
        input: {
          prompt,
          image: base64,
          image_url: base64,
          aspect_ratio: '1:1',
        },
      };

      setPollProgress('Submitting task...');
      const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.msg || data.message || data.error?.message || `HTTP ${res.status}`);
        setProcessing(false);
        setPollProgress('');
        return;
      }
      const taskId = extractTaskId(data);
      if (taskId) {
        setPollProgress('Processing...');
        await pollForResult(taskId, apiKey);
      } else {
        console.error('KIE API response (no taskId found):', JSON.stringify(data));
        toast.error('No task ID returned - check console for API response');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Processing failed');
    }
    setProcessing(false);
    setPollProgress('');
  };

  const pollForResult = async (taskId: string, apiKey: string) => {
    let attempts = 0;
    while (attempts < 120) {
      const waitTime = attempts < 5 ? 2000 : attempts < 20 ? 3000 : 5000;
      await new Promise((r) => setTimeout(r, waitTime));
      try {
        const res = await fetch(`${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const data = await res.json();
        const result = parseMarketPoll(data);
        if (result.done) {
          if (result.failed || result.urls.length === 0) { toast.error('Processing failed'); return; }
          setResultUrl(result.urls[0]);
          await saveAsset(result.urls[0]);
          toast.success('Image processed successfully');
          return;
        }
        setPollProgress(`Processing... (${attempts + 1}s)`);
      } catch { /* retry */ }
      attempts++;
    }
    toast.error('Processing timed out');
  };

  const saveAsset = async (url: string) => {
    if (!user) return;
    const assetId = crypto.randomUUID();
    const uploaded = await uploadFromUrl(user.id, assetId, url);
    await supabase.from('media_assets').insert({
      id: assetId, user_id: user.id, type: 'edited',
      title: `${mode} edit`, prompt: mode === 'inpaint' ? inpaintPrompt : mode,
      provider: 'kie_ai', status: 'completed',
      result_url: uploaded?.publicUrl || url, storage_path: uploaded?.path || null,
      file_size: uploaded?.size || 0, metadata: { mode, model: currentMode.model, style: selectedStyle },
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-[#FF6B00]" />
          AI Image Editor
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {EDIT_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`p-4 rounded-xl border text-left transition-all ${mode === m.key ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-white/5 bg-dark-800 hover:border-white/20'}`}
            >
              <m.icon className={`w-5 h-5 mb-2 ${mode === m.key ? 'text-[#FF6B00]' : 'text-gray-500'}`} />
              <p className="text-sm font-medium text-white">{m.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Source Image</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Source" className="max-w-xs max-h-64 rounded-xl border border-white/10" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(''); setResultUrl(''); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-64 h-48 rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF6B00]/30 transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload Image</p>
                </div>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {mode === 'style_transfer' && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Target Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setSelectedStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedStyle === s ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'inpaint' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">What to change</label>
              <input
                type="text" value={inpaintPrompt} onChange={(e) => setInpaintPrompt(e.target.value)}
                placeholder="Replace the sky with a sunset..."
                className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={processing || !imageFile}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (<><Loader2 className="w-5 h-5 animate-spin" />{pollProgress || 'Processing...'}</>) : (<><Wand2 className="w-5 h-5" /> Process Image</>)}
          </button>
        </div>
      </div>

      {resultUrl && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Result</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imagePreview && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Original</p>
                <img src={imagePreview} alt="Original" className="w-full rounded-xl border border-white/5" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-2">Edited</p>
              <img src={resultUrl} alt="Edited" className="w-full rounded-xl border border-white/5" />
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <a href={resultUrl} download target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
