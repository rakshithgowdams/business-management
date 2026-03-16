import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, X, Image, Tag, CreditCard as Edit2, Check, Loader2, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { TEMPLATE_CATEGORIES, TEXT_TO_IMAGE_MODELS, IMAGE_TO_IMAGE_MODELS, IMAGE_EDITING_MODELS } from '../../../lib/marketing/imageModels';
import type { ImageTemplate } from '../../../lib/marketing/imageModels';

const ALL_MODELS = [
  ...TEXT_TO_IMAGE_MODELS.map((m) => ({ ...m, group: 'Text-to-Image' })),
  ...IMAGE_TO_IMAGE_MODELS.map((m) => ({ ...m, group: 'Image-to-Image' })),
  ...IMAGE_EDITING_MODELS.map((m) => ({ ...m, group: 'Image Editing' })),
];

const STYLES = ['Photorealistic', 'Digital Art', 'Oil Painting', 'Watercolor', 'Anime', 'Comic Book', '3D Render', 'Minimalist', 'Vintage', 'Neon', 'Sketch', 'Pop Art'];
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'];

interface FormState {
  name: string;
  category: string;
  master_prompt: string;
  tags: string;
  default_model: string;
  default_aspect_ratio: string;
  default_style: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'Marketing',
  master_prompt: '',
  tags: '',
  default_model: '',
  default_aspect_ratio: '1:1',
  default_style: 'Photorealistic',
};

export default function ImageTemplateManager() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ImageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [refImageFile, setRefImageFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchTemplates(); }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('image_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTemplates((data || []) as ImageTemplate[]);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setRefImageFile(null);
    setRefPreview('');
    setShowForm(true);
  };

  const openEdit = (t: ImageTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      category: t.category,
      master_prompt: t.master_prompt,
      tags: (t.tags || []).join(', '),
      default_model: t.default_model || '',
      default_aspect_ratio: t.default_aspect_ratio || '1:1',
      default_style: t.default_style || 'Photorealistic',
    });
    setRefImageFile(null);
    setRefPreview(t.reference_image_url || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    if (refPreview && refImageFile) URL.revokeObjectURL(refPreview);
    setRefImageFile(null);
    setRefPreview('');
  };

  const handleRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (refPreview && refImageFile) URL.revokeObjectURL(refPreview);
    setRefImageFile(file);
    setRefPreview(URL.createObjectURL(file));
  };

  const removeRefImage = () => {
    if (refPreview && refImageFile) URL.revokeObjectURL(refPreview);
    setRefImageFile(null);
    setRefPreview('');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Template name required'); return; }
    if (!form.master_prompt.trim()) { toast.error('Master prompt required'); return; }

    setSaving(true);
    try {
      let refUrl: string | null = null;
      let refPath: string | null = null;

      if (refImageFile) {
        const ext = refImageFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('template-images').upload(path, refImageFile, { upsert: true, contentType: refImageFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('template-images').getPublicUrl(path);
          refUrl = urlData?.publicUrl || null;
          refPath = path;
        } else {
          toast.error('Failed to upload reference image');
        }
      } else if (refPreview && !refPreview.startsWith('blob:')) {
        const isAlreadySupabase = refPreview.includes('/storage/v1/object/public/template-images/');
        if (!isAlreadySupabase) {
          try {
            const res = await fetch(refPreview);
            if (res.ok) {
              const blob = await res.blob();
              const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
              const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
              const { error: upErr } = await supabase.storage.from('template-images').upload(path, blob, { upsert: true, contentType: blob.type });
              if (!upErr) {
                const { data: urlData } = supabase.storage.from('template-images').getPublicUrl(path);
                refUrl = urlData?.publicUrl || null;
                refPath = path;
              } else {
                refUrl = refPreview;
              }
            } else {
              refUrl = refPreview;
            }
          } catch {
            refUrl = refPreview;
          }
        } else {
          refUrl = refPreview;
        }
      }

      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        category: form.category,
        master_prompt: form.master_prompt.trim(),
        tags,
        default_model: form.default_model || null,
        default_aspect_ratio: form.default_aspect_ratio,
        default_style: form.default_style,
        reference_image_url: refUrl,
        reference_image_path: refPath,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await supabase.from('image_templates').update(payload).eq('id', editingId);
        toast.success('Template updated');
      } else {
        await supabase.from('image_templates').insert(payload);
        toast.success('Template created');
      }

      await fetchTemplates();
      closeForm();
    } catch {
      toast.error('Failed to save template');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('image_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success('Template deleted');
  };

  const filtered = filterCategory === 'All' ? templates : templates.filter((t) => t.category === filterCategory);
  const usedCategories = ['All', ...Array.from(new Set(templates.map((t) => t.category)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Image Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create reusable templates with master prompts and reference images</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-orange text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {usedCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {usedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCategory === cat ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <LayoutTemplate className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">No templates yet</p>
          <p className="text-xs text-gray-600 mt-1">Create a template to reuse prompts and reference images</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="glass-card rounded-xl overflow-hidden border border-white/5">
              <div className="flex gap-4 p-4">
                {t.reference_image_url ? (
                  <img src={t.reference_image_url} alt={t.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-dark-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Image className="w-7 h-7 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white truncate">{t.name}</h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B00]/15 text-[#FF6B00]">{t.category}</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-dark-800 text-gray-400 hover:text-white transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg bg-dark-800 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{t.master_prompt}</p>
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-dark-700 text-[10px] text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(t.default_model || t.default_aspect_ratio) && (
                <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-3">
                  {t.default_aspect_ratio && (
                    <span className="text-[10px] text-gray-500">Ratio: <span className="text-gray-400">{t.default_aspect_ratio}</span></span>
                  )}
                  {t.default_style && (
                    <span className="text-[10px] text-gray-500">Style: <span className="text-gray-400">{t.default_style}</span></span>
                  )}
                  {t.default_model && (
                    <span className="text-[10px] text-gray-500">Model: <span className="text-gray-400">{ALL_MODELS.find((m) => m.id === t.default_model)?.label || t.default_model}</span></span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">{editingId ? 'Edit Template' : 'New Image Template'}</h2>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Template Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Product Launch Ad"
                    className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Master Prompt *</label>
                <textarea
                  value={form.master_prompt}
                  onChange={(e) => setForm({ ...form, master_prompt: e.target.value })}
                  rows={4}
                  placeholder="Enter the base prompt for this template. Users will be able to add additional details on top of this..."
                  className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Reference Image</label>
                {refPreview ? (
                  <div className="relative inline-block">
                    <img src={refPreview} alt="Reference" className="h-40 rounded-xl border border-white/10 object-cover" />
                    <button onClick={removeRefImage} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF6B00]/30 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-500">Upload Reference Image</p>
                      <p className="text-[11px] text-gray-600">JPG, PNG, WebP</p>
                    </div>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefImage} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Default Aspect Ratio</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setForm({ ...form, default_aspect_ratio: ar })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${form.default_aspect_ratio === ar ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Default Style</label>
                  <select
                    value={form.default_style}
                    onChange={(e) => setForm({ ...form, default_style: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                  >
                    {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Default Model (optional)</label>
                <select
                  value={form.default_model}
                  onChange={(e) => setForm({ ...form, default_model: e.target.value })}
                  className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">No default model</option>
                  {['Text-to-Image', 'Image-to-Image', 'Image Editing'].map((group) => (
                    <optgroup key={group} label={group}>
                      {ALL_MODELS.filter((m) => m.group === group).map((m) => (
                        <option key={m.id} value={m.id}>{m.label} ({m.category})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />Tags (comma separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. marketing, product, ad, ugc"
                  className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeForm} className="flex-1 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
