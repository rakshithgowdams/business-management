import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Camera, CreditCard as Edit2, Check, Loader2, X, Upload, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { uploadMediaToStorage } from '../../../lib/mediaDB';

export interface CustomCameraMovement {
  id: string;
  user_id: string;
  name: string;
  value: string;
  description: string;
  category: string;
  intensity_default: number;
  is_active: boolean;
  created_at: string;
  preview_video_url?: string | null;
}

const MOVEMENT_CATEGORIES = ['Push/Pull', 'Rotation', 'Zoom/Focus', 'FPV/Special', 'Cinematic', 'Custom'];

interface FormState {
  name: string;
  value: string;
  description: string;
  category: string;
  intensity_default: number;
  preview_video_url: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  value: '',
  description: '',
  category: 'Custom',
  intensity_default: 5,
  preview_video_url: '',
};

export default function CameraMovementManager() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<CustomCameraMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchMovements(); }, [user]);

  const fetchMovements = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('custom_camera_movements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMovements((data || []) as CustomCameraMovement[]);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setVideoPreview('');
    setShowForm(true);
  };

  const openEdit = (m: CustomCameraMovement) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      value: m.value,
      description: m.description,
      category: m.category,
      intensity_default: m.intensity_default,
      preview_video_url: m.preview_video_url || '',
    });
    setVideoPreview(m.preview_video_url || '');
    setShowForm(true);
  };

  const handleVideoUpload = async (file: File) => {
    if (!user) return;
    setVideoUploading(true);
    try {
      const assetId = `cam-preview-${crypto.randomUUID()}`;
      const result = await uploadMediaToStorage(user.id, assetId, file, file.type);
      const url = result?.publicUrl || '';
      setForm((p) => ({ ...p, preview_video_url: url }));
      setVideoPreview(URL.createObjectURL(file));
      toast.success('Video uploaded');
    } catch {
      toast.error('Video upload failed');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Enter a movement name'); return; }
    if (!form.value.trim()) { toast.error('Enter a movement value (API key)'); return; }

    const valueKey = form.value.trim().toLowerCase().replace(/\s+/g, '_');

    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      value: valueKey,
      description: form.description.trim(),
      category: form.category,
      intensity_default: form.intensity_default,
      preview_video_url: form.preview_video_url || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('custom_camera_movements').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('custom_camera_movements').insert(payload));
    }

    if (error) {
      toast.error('Failed to save movement');
    } else {
      toast.success(editingId ? 'Movement updated' : 'Movement saved');
      setShowForm(false);
      setEditingId(null);
      fetchMovements();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('custom_camera_movements').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setMovements((prev) => prev.filter((m) => m.id !== id));
    toast.success('Movement deleted');
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('custom_camera_movements').update({ is_active: active }).eq('id', id);
    setMovements((prev) => prev.map((m) => m.id === id ? { ...m, is_active: active } : m));
  };

  const grouped = MOVEMENT_CATEGORIES.reduce<Record<string, CustomCameraMovement[]>>((acc, cat) => {
    const items = movements.filter((m) => m.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Custom Camera Movements</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">{movements.filter((m) => m.is_active).length} active</span>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Movement
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Custom camera movements appear in the Kling 3.0 Studio Camera Control mode alongside the built-in movements.
        The <strong className="text-gray-300">value</strong> field is the API key sent to Kling (e.g. <code className="px-1 py-0.5 rounded bg-white/5 text-blue-400 font-mono text-[10px]">dolly_forward</code>).
      </p>

      {showForm && (
        <div className="glass-card rounded-xl p-5 border border-blue-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Camera Movement' : 'New Camera Movement'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Display Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Spiral Descent"
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                API Value
                <span className="ml-1 text-[10px] text-gray-600">(sent to Kling API)</span>
              </label>
              <input
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="e.g. spiral_descent"
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-blue-400"
              />
              <p className="text-[10px] text-gray-600 mt-1">Spaces are auto-converted to underscores</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What this movement does..."
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {MOVEMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm((p) => ({ ...p, category: cat }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.category === cat ? 'bg-blue-500 text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Default Intensity: {form.intensity_default}</label>
              <input
                type="range" min="1" max="10" step="1"
                value={form.intensity_default}
                onChange={(e) => setForm((p) => ({ ...p, intensity_default: parseInt(e.target.value) }))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Subtle</span><span>Extreme</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Demo Video
              <span className="ml-2 text-[10px] text-gray-600">optional — shows this movement in action in Kling 3.0 Studio</span>
            </label>
            {videoPreview || form.preview_video_url ? (
              <div className="flex items-start gap-3">
                <video
                  src={videoPreview || form.preview_video_url}
                  className="max-w-xs max-h-36 rounded-xl border border-white/10 bg-black"
                  controls
                  muted
                />
                <button
                  onClick={() => { setVideoPreview(''); setForm((p) => ({ ...p, preview_video_url: '' })); }}
                  className="mt-1 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={videoUploading}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all disabled:opacity-50"
              >
                {videoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {videoUploading ? 'Uploading...' : 'Upload Demo Video'}
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingId ? 'Update' : 'Save Movement'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-white/5 bg-dark-800/30">
          <Camera className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No custom camera movements yet</p>
          <p className="text-xs text-gray-600 mt-1">Add movements to extend Kling 3.0's built-in camera controls</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-1.5">
                {items.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.is_active ? 'bg-blue-400' : 'bg-gray-600'}`} />
                    {m.preview_video_url && (
                      <video
                        src={m.preview_video_url}
                        className="w-16 h-12 object-cover rounded-lg border border-white/10 bg-black flex-shrink-0"
                        muted
                        loop
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{m.name}</span>
                        <code className="px-1.5 py-0.5 rounded bg-dark-900 text-blue-400 text-[10px] font-mono">{m.value}</code>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-700 text-gray-400">intensity {m.intensity_default}</span>
                        {m.preview_video_url && <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400"><Play className="w-2 h-2" />Demo</span>}
                      </div>
                      {m.description && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(m.id, !m.is_active)}
                        className={`w-8 h-4 rounded-full transition-all relative ${m.is_active ? 'bg-blue-500' : 'bg-dark-700 border border-white/10'}`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${m.is_active ? 'left-4' : 'left-0.5'}`} />
                      </button>
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
