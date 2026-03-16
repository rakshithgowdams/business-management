import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Film, Tag, CreditCard as Edit2, Check, Loader2, X, ChevronDown, LayoutTemplate, Upload, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { uploadMediaToStorage } from '../../../lib/mediaDB';

export interface VideoTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  prompt_template: string;
  duration: string;
  aspect_ratio: string;
  kling_mode: string;
  camera_motion: string;
  camera_intensity: number;
  sound: boolean;
  tags: string[];
  is_active: boolean;
  created_at: string;
  preview_video_url?: string | null;
}

const CATEGORIES = ['Cinematic', 'Product', 'Social', 'Travel', 'Portrait', 'Nature', 'Architecture', 'Action', 'Abstract', 'General'];
const DURATIONS = ['5', '10', '15'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1'];
const KLING_MODES = [{ v: 'std', l: 'Standard' }, { v: 'pro', l: 'Pro' }];
const CAMERA_MOTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'zoom_in', label: 'Zoom In' },
  { value: 'zoom_out', label: 'Zoom Out' },
  { value: 'pan_left', label: 'Pan Left' },
  { value: 'pan_right', label: 'Pan Right' },
  { value: 'tilt_up', label: 'Tilt Up' },
  { value: 'tilt_down', label: 'Tilt Down' },
  { value: 'dolly_in', label: 'Dolly In' },
  { value: 'dolly_out', label: 'Dolly Out' },
  { value: 'orbit_left', label: 'Orbit Left' },
  { value: 'orbit_right', label: 'Orbit Right' },
  { value: 'handheld', label: 'Handheld' },
];

interface FormState {
  name: string;
  description: string;
  category: string;
  prompt_template: string;
  duration: string;
  aspect_ratio: string;
  kling_mode: string;
  camera_motion: string;
  camera_intensity: number;
  sound: boolean;
  tags: string;
  preview_video_url: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  category: 'Cinematic',
  prompt_template: '',
  duration: '5',
  aspect_ratio: '16:9',
  kling_mode: 'std',
  camera_motion: 'static',
  camera_intensity: 5,
  sound: false,
  tags: '',
  preview_video_url: '',
};

export default function VideoTemplateManager() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchTemplates(); }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('video_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTemplates((data || []) as VideoTemplate[]);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setVideoPreview('');
    setShowForm(true);
  };

  const openEdit = (t: VideoTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description,
      category: t.category,
      prompt_template: t.prompt_template,
      duration: t.duration,
      aspect_ratio: t.aspect_ratio,
      kling_mode: t.kling_mode,
      camera_motion: t.camera_motion,
      camera_intensity: t.camera_intensity,
      sound: t.sound,
      tags: (t.tags || []).join(', '),
      preview_video_url: t.preview_video_url || '',
    });
    setVideoPreview(t.preview_video_url || '');
    setShowForm(true);
  };

  const handleVideoUpload = async (file: File) => {
    if (!user) return;
    setVideoUploading(true);
    try {
      const assetId = `vt-preview-${crypto.randomUUID()}`;
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
    if (!form.name.trim()) { toast.error('Enter a template name'); return; }
    if (!form.prompt_template.trim()) { toast.error('Enter a prompt template'); return; }

    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      prompt_template: form.prompt_template.trim(),
      duration: form.duration,
      aspect_ratio: form.aspect_ratio,
      kling_mode: form.kling_mode,
      camera_motion: form.camera_motion,
      camera_intensity: form.camera_intensity,
      sound: form.sound,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      preview_video_url: form.preview_video_url || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('video_templates').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('video_templates').insert(payload));
    }

    if (error) {
      toast.error('Failed to save template');
    } else {
      toast.success(editingId ? 'Template updated' : 'Template saved');
      setShowForm(false);
      setEditingId(null);
      fetchTemplates();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('video_templates').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success('Template deleted');
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('video_templates').update({ is_active: active }).eq('id', id);
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, is_active: active } : t));
  };

  const filtered = filterCategory === 'All' ? templates : templates.filter((t) => t.category === filterCategory);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-sm font-semibold text-white">Video Templates</span>
          <span className="px-2 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] font-bold">{templates.filter((t) => t.is_active).length} active</span>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-orange text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Video templates are quick-start presets for Kling 3.0. They pre-fill the prompt, duration, aspect ratio, camera motion, and mode so you can generate faster.
        Use <code className="px-1 py-0.5 rounded bg-white/5 text-[#FF6B00] font-mono text-[10px]">{'{subject}'}</code> in your prompt template as a placeholder.
      </p>

      {showForm && (
        <div className="glass-card rounded-xl p-5 border border-[#FF6B00]/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Template' : 'New Video Template'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Template Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Cinematic Product Reveal"
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] appearance-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what this template creates..."
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Prompt Template
              <span className="ml-2 text-[10px] text-gray-600">Use {'{subject}'} as a placeholder</span>
            </label>
            <textarea
              value={form.prompt_template}
              onChange={(e) => setForm((p) => ({ ...p, prompt_template: e.target.value }))}
              rows={4}
              placeholder="A cinematic shot of {subject}, dramatic lighting, shallow depth of field, golden hour..."
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Duration</label>
              <div className="flex gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm((p) => ({ ...p, duration: d }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${form.duration === d ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Aspect Ratio</label>
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setForm((p) => ({ ...p, aspect_ratio: ar }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${form.aspect_ratio === ar ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Mode</label>
              <div className="flex gap-1.5">
                {KLING_MODES.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setForm((p) => ({ ...p, kling_mode: m.v }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${form.kling_mode === m.v ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Default Camera Motion</label>
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_MOTIONS.map((cm) => (
                  <button
                    key={cm.value}
                    onClick={() => setForm((p) => ({ ...p, camera_motion: cm.value }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.camera_motion === cm.value ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Camera Intensity: {form.camera_intensity}</label>
              <input
                type="range" min="1" max="10" step="1"
                value={form.camera_intensity}
                onChange={(e) => setForm((p) => ({ ...p, camera_intensity: parseInt(e.target.value) }))}
                className="w-full accent-[#FF6B00]"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Subtle</span><span>Extreme</span></div>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <button
                  onClick={() => setForm((p) => ({ ...p, sound: !p.sound }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${form.sound ? 'bg-[#FF6B00]' : 'bg-dark-700 border border-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${form.sound ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className="text-xs text-gray-400">Sound Effects</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="cinematic, product, dramatic..."
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Preview Video
              <span className="ml-2 text-[10px] text-gray-600">optional — shown in Kling 3.0 Studio when template is selected</span>
            </label>
            {videoPreview || form.preview_video_url ? (
              <div className="flex items-start gap-3">
                <video
                  src={videoPreview || form.preview_video_url}
                  className="max-w-xs max-h-40 rounded-xl border border-white/10 bg-black"
                  controls
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
                {videoUploading ? 'Uploading...' : 'Upload Preview Video'}
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

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingId ? 'Update Template' : 'Save Template'}
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

      <div className="flex gap-2 flex-wrap">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === cat ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-white/5 bg-dark-800/30">
          <Film className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No templates yet</p>
          <p className="text-xs text-gray-600 mt-1">Create video prompt templates to speed up your workflow</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.is_active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{t.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] flex-shrink-0">{t.category}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-700 text-gray-400 flex-shrink-0">{t.duration}s · {t.aspect_ratio} · {t.kling_mode.toUpperCase()}</span>
                    </div>
                    {t.description && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{t.description}</p>}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${expandedId === t.id ? 'rotate-180' : ''}`} />
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(t.id, !t.is_active)}
                    className={`w-8 h-4 rounded-full transition-all relative ${t.is_active ? 'bg-emerald-500' : 'bg-dark-700 border border-white/10'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${t.is_active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expandedId === t.id && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-2">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider">Prompt Template</p>
                      <p className="text-xs text-gray-300 bg-dark-900/60 rounded-lg px-3 py-2 font-mono">{t.prompt_template}</p>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-[10px] text-gray-600">Camera</p>
                          <p className="text-xs text-gray-300">{t.camera_motion} (intensity {t.camera_intensity})</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600">Sound</p>
                          <p className="text-xs text-gray-300">{t.sound ? 'On' : 'Off'}</p>
                        </div>
                        {t.tags.length > 0 && (
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-600">Tags</p>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {t.tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-dark-700 text-[10px] text-gray-400">
                                  <Tag className="w-2 h-2" />{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {t.preview_video_url && (
                      <div className="flex-shrink-0">
                        <p className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1"><Play className="w-2.5 h-2.5" /> Preview</p>
                        <video
                          src={t.preview_video_url}
                          className="w-36 h-24 object-cover rounded-lg border border-white/10 bg-black"
                          controls
                          muted
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
