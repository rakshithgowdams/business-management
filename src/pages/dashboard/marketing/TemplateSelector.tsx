import { useState, useEffect } from 'react';
import { LayoutTemplate, ChevronDown, X, Image, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { ImageTemplate } from '../../../lib/marketing/imageModels';

interface Props {
  onApply: (template: ImageTemplate | null) => void;
  appliedId?: string | null;
}

export default function TemplateSelector({ onApply, appliedId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<ImageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    if (user) fetchTemplates();
  }, [user]);

  useEffect(() => {
    if (open && user && templates.length === 0) fetchTemplates();
  }, [open]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('image_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (data || []) as ImageTemplate[];
    setTemplates(rows);
    setLoading(false);
    migrateExternalImages(rows);
  };

  const migrateExternalImages = async (rows: ImageTemplate[]) => {
    if (!user) return;
    const toMigrate = rows.filter(
      (t) =>
        t.reference_image_url &&
        !t.reference_image_url.includes('/storage/v1/object/public/template-images/') &&
        !t.reference_image_url.includes('/storage/v1/object/public/media/')
    );
    for (const t of toMigrate) {
      try {
        const res = await fetch(t.reference_image_url!);
        if (!res.ok) continue;
        const blob = await res.blob();
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('template-images')
          .upload(path, blob, { upsert: true, contentType: blob.type });
        if (error) continue;
        const { data: urlData } = supabase.storage.from('template-images').getPublicUrl(path);
        const newUrl = urlData?.publicUrl;
        if (!newUrl) continue;
        await supabase
          .from('image_templates')
          .update({ reference_image_url: newUrl, reference_image_path: path })
          .eq('id', t.id);
        setTemplates((prev) =>
          prev.map((tt) => (tt.id === t.id ? { ...tt, reference_image_url: newUrl, reference_image_path: path } : tt))
        );
      } catch {
        /* non-critical */
      }
    }
  };

  const applied = templates.find((t) => t.id === appliedId);
  const categories = ['All', ...Array.from(new Set(templates.map((t) => t.category)))];
  const filtered = templates
    .filter((t) => filterCat === 'All' || t.category === filterCat)
    .filter((t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.master_prompt.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
          applied
            ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-white'
            : 'bg-dark-800 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <LayoutTemplate className="w-4 h-4 flex-shrink-0" />
          {applied ? (
            <span className="font-medium text-white">{applied.name}</span>
          ) : (
            <span>Choose a template...</span>
          )}
          {applied && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF6B00]/20 text-[#FF6B00]">{applied.category}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {applied && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onApply(null); }}
              className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-dark-900 border border-white/10 rounded-xl shadow-2xl max-h-96 flex flex-col">
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                autoFocus
              />
            </div>
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${filterCat === cat ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-500 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading templates...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <LayoutTemplate className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No templates found</p>
                <p className="text-[11px] text-gray-600 mt-1">Create templates in Settings to use them here</p>
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onApply(t); setOpen(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left ${t.id === appliedId ? 'bg-[#FF6B00]/5' : ''}`}
                >
                  {t.reference_image_url ? (
                    <img src={t.reference_image_url} alt={t.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-dark-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Image className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{t.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF6B00]/15 text-[#FF6B00] flex-shrink-0">{t.category}</span>
                      {t.id === appliedId && <span className="text-[9px] font-bold text-emerald-400">APPLIED</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{t.master_prompt}</p>
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-dark-700 text-[9px] text-gray-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
