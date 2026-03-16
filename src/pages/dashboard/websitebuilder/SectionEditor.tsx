import { useState, useCallback, useEffect, useRef } from 'react';
import { Save, X, Plus, Trash2, ChevronDown, ChevronUp, Upload, Loader2, Image as ImageIcon, Phone, Link2, Hash } from 'lucide-react';
import type { WebsiteSection, WebsiteProject, SectionAnimation } from '../../../lib/websiteBuilder/types';
import { ANIMATION_TYPES, ICON_OPTIONS } from '../../../lib/websiteBuilder/defaults';
import { supabase } from '../../../lib/supabase';

interface Props {
  section: WebsiteSection;
  project: WebsiteProject;
  onSave: (section: WebsiteSection) => void;
  onClose: () => void;
  saving: boolean;
  onPreviewChange?: (section: WebsiteSection) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, textarea }: { value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  const cls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-colors";
  if (textarea) return <textarea className={cls + " resize-none h-20"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
  return <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
      <span className="text-xs text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-orange-500' : 'bg-white/[0.08]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40 transition-colors"
    >
      {options.map(o => <option key={o.value} value={o.value} className="bg-[#0d1117]">{o.label}</option>)}
    </select>
  );
}

function LogoUpload({ value, onChange, userId }: { value: string; onChange: (url: string) => void; userId: string }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('website-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('website-assets').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      // silently fail — user can enter URL manually
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://... or upload below"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
      {value ? (
        <div className="w-full h-12 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden flex items-center justify-center">
          <img src={value} alt="Logo preview" className="max-h-10 max-w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      ) : (
        <div className="w-full h-12 rounded-lg border border-dashed border-white/[0.06] flex items-center justify-center gap-2 text-gray-600 text-xs">
          <ImageIcon className="w-3.5 h-3.5" /> No logo set
        </div>
      )}
    </div>
  );
}

type CtaLinkType = 'url' | 'phone' | 'anchor';

function CtaLinkField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const detect = (v: string): CtaLinkType => {
    if (v.startsWith('tel:') || /^\+?\d[\d\s\-]{6,}/.test(v)) return 'phone';
    if (v.startsWith('#')) return 'anchor';
    return 'url';
  };
  const [type, setType] = useState<CtaLinkType>(() => detect(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = value;
    if (detect(prev) !== detect(value)) {
      setType(detect(value));
    }
  }, [value]);

  const handleTypeChange = (t: CtaLinkType) => {
    setType(t);
    if (t === 'anchor') onChange('#contact');
    else if (t === 'phone') onChange('');
    else onChange('');
  };

  const displayValue = type === 'phone' ? value.replace(/^tel:/, '') : value;

  const handleValueChange = (v: string) => {
    if (type === 'phone') onChange(v ? `tel:${v.replace(/^tel:/, '')}` : '');
    else onChange(v);
  };

  const ANCHOR_OPTIONS = ['#contact', '#services', '#about', '#pricing', '#faq', '#team', '#testimonials', '#blog', '#gallery', '#hero'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
        {([['url', Link2, 'URL'], ['phone', Phone, 'Phone'], ['anchor', Hash, 'Section']] as [CtaLinkType, React.ElementType, string][]).map(([t, Icon, lbl]) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all ${type === t ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icon className="w-3 h-3" />{lbl}
          </button>
        ))}
      </div>
      {type === 'anchor' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40 transition-colors"
        >
          {ANCHOR_OPTIONS.map(a => <option key={a} value={a} className="bg-[#0d1117]">{a}</option>)}
        </select>
      ) : (
        <input
          value={displayValue}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={type === 'phone' ? '+91 98765 43210' : 'https://...'}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-colors"
        />
      )}
    </div>
  );
}

function AnimationEditor({ animation, onChange }: { animation: SectionAnimation; onChange: (a: SectionAnimation) => void }) {
  return (
    <div className="space-y-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
      <p className="text-xs font-semibold text-gray-300">Animation</p>
      <Field label="Type">
        <Select value={animation.type} onChange={v => onChange({ ...animation, type: v as SectionAnimation['type'] })} options={ANIMATION_TYPES} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (ms)">
          <input type="number" min={100} max={2000} step={100} value={animation.duration} onChange={e => onChange({ ...animation, duration: Number(e.target.value) })}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40" />
        </Field>
        <Field label="Delay (ms)">
          <input type="number" min={0} max={1000} step={100} value={animation.delay} onChange={e => onChange({ ...animation, delay: Number(e.target.value) })}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40" />
        </Field>
      </div>
      <Toggle value={animation.stagger ?? false} onChange={v => onChange({ ...animation, stagger: v })} label="Stagger children" />
    </div>
  );
}

export default function SectionEditor({ section, project, onSave, onClose, saving, onPreviewChange }: Props) {
  const [config, setConfig] = useState<Record<string, unknown>>(section.config || {});
  const [animation, setAnimation] = useState<SectionAnimation>(section.animation);
  const [label, setLabel] = useState(section.label);
  const [openGroup, setOpenGroup] = useState<string>('content');

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setConfig(section.config || {});
    setAnimation(section.animation);
    setLabel(section.label);
    setOpenGroup('content');
  }, [section.id]);

  const notifyPreview = useCallback((newConfig: Record<string, unknown>, newAnimation: SectionAnimation, newLabel: string) => {
    if (!onPreviewChange) return;
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      onPreviewChange({ ...section, config: newConfig, animation: newAnimation, label: newLabel });
    }, 300);
  }, [onPreviewChange, section]);

  useEffect(() => () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); }, []);

  const c = config as Record<string, unknown>;

  const set = useCallback((key: string, value: unknown) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      notifyPreview(next, animation, label);
      return next;
    });
  }, [animation, label, notifyPreview]);

  const setArr = useCallback((key: string, idx: number, field: string, value: unknown) => {
    setConfig(prev => {
      const arr = [...((prev[key] as Record<string, unknown>[]) || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      const next = { ...prev, [key]: arr };
      notifyPreview(next, animation, label);
      return next;
    });
  }, [animation, label, notifyPreview]);

  const addToArr = useCallback((key: string, defaultItem: Record<string, unknown>) => {
    setConfig(prev => {
      const next = { ...prev, [key]: [...((prev[key] as unknown[]) || []), defaultItem] };
      notifyPreview(next, animation, label);
      return next;
    });
  }, [animation, label, notifyPreview]);

  const removeFromArr = useCallback((key: string, idx: number) => {
    setConfig(prev => {
      const next = { ...prev, [key]: ((prev[key] as unknown[]) || []).filter((_, i) => i !== idx) };
      notifyPreview(next, animation, label);
      return next;
    });
  }, [animation, label, notifyPreview]);

  const handleSave = () => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    onSave({ ...section, config, animation, label });
  };

  const Group = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border border-white/[0.05] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpenGroup(openGroup === id ? '' : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{title}</span>
        {openGroup === id ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
      </button>
      {openGroup === id && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );

  const renderFields = () => {
    const t = section.section_type;

    if (t === 'header') return (
      <>
        <Group id="content" title="Logo & Branding">
          <Field label="Logo Image">
            <LogoUpload value={(c.logo_url as string) || ''} onChange={v => set('logo_url', v)} userId={project.user_id} />
          </Field>
        </Group>
        <Group id="cta" title="CTA Button">
          <Field label="CTA Text"><Input value={(c.cta_text as string) || ''} onChange={v => set('cta_text', v)} placeholder="Get Started" /></Field>
          <Field label="CTA Link">
            <CtaLinkField value={(c.cta_href as string) || '#contact'} onChange={v => set('cta_href', v)} />
          </Field>
          <Toggle value={!!(c.show_cta)} onChange={v => set('show_cta', v)} label="Show CTA Button" />
          <Toggle value={!!(c.sticky)} onChange={v => set('sticky', v)} label="Sticky Header" />
          <Toggle value={!!(c.transparent)} onChange={v => set('transparent', v)} label="Transparent on Top" />
        </Group>
        <Group id="nav" title="Navigation Links">
          {((c.nav_links as { label: string; href: string }[]) || []).map((link, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 items-start">
              <Input value={link.label} onChange={v => setArr('nav_links', i, 'label', v)} placeholder="Label" />
              <div className="flex gap-1">
                <Input value={link.href} onChange={v => setArr('nav_links', i, 'href', v)} placeholder="#section" />
                <button onClick={() => removeFromArr('nav_links', i)} className="w-8 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => addToArr('nav_links', { label: 'New Link', href: '#' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </Group>
      </>
    );

    if (t === 'hero') return (
      <>
        <Group id="content" title="Content">
          <Field label="Badge Text"><Input value={(c.badge_text as string) || ''} onChange={v => set('badge_text', v)} placeholder="Now Available" /></Field>
          <Toggle value={!!(c.show_badge)} onChange={v => set('show_badge', v)} label="Show Badge" />
          <Field label="Headline"><Input value={(c.headline as string) || ''} onChange={v => set('headline', v)} textarea placeholder="Welcome to..." /></Field>
          <Field label="Subheadline"><Input value={(c.subheadline as string) || ''} onChange={v => set('subheadline', v)} placeholder="We deliver..." /></Field>
          <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea placeholder="Description..." /></Field>
          <Field label="Primary CTA Text"><Input value={(c.cta_primary_text as string) || ''} onChange={v => set('cta_primary_text', v)} /></Field>
          <Field label="Primary CTA Link"><Input value={(c.cta_primary_href as string) || ''} onChange={v => set('cta_primary_href', v)} /></Field>
          <Toggle value={!!(c.show_secondary_cta)} onChange={v => set('show_secondary_cta', v)} label="Show Secondary CTA" />
          <Field label="Secondary CTA Text"><Input value={(c.cta_secondary_text as string) || ''} onChange={v => set('cta_secondary_text', v)} /></Field>
          <Field label="Image URL"><Input value={(c.image_url as string) || ''} onChange={v => set('image_url', v)} placeholder="https://images.pexels.com/..." /></Field>
        </Group>
        <Group id="layout" title="Layout">
          <Field label="Layout">
            <Select value={(c.layout as string) || 'left'} onChange={v => set('layout', v)} options={[{ value: 'centered', label: 'Centered' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'split', label: 'Split' }]} />
          </Field>
          <Field label="Background Style">
            <Select value={(c.bg_style as string) || 'gradient'} onChange={v => set('bg_style', v)} options={[{ value: 'gradient', label: 'Gradient' }, { value: 'solid', label: 'Solid Color' }, { value: 'image', label: 'Image' }]} />
          </Field>
          <Field label="Background Value"><Input value={(c.bg_value as string) || ''} onChange={v => set('bg_value', v)} placeholder="CSS gradient or color or image URL" /></Field>
        </Group>
        <Group id="stats" title="Stats">
          <Toggle value={!!(c.show_stats)} onChange={v => set('show_stats', v)} label="Show Stats" />
          {((c.stats as { value: string; label: string }[]) || []).map((stat, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={stat.value} onChange={v => setArr('stats', i, 'value', v)} placeholder="500+" />
              <div className="flex gap-1 flex-1">
                <Input value={stat.label} onChange={v => setArr('stats', i, 'label', v)} placeholder="Happy Clients" />
                <button onClick={() => removeFromArr('stats', i)} className="w-8 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => addToArr('stats', { value: '0+', label: 'New Stat' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Stat
          </button>
        </Group>
      </>
    );

    if (t === 'services') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea /></Field>
          <Field label="Layout">
            <Select value={(c.layout as string) || 'cards'} onChange={v => set('layout', v)} options={[{ value: 'cards', label: 'Cards' }, { value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]} />
          </Field>
          <Field label="Columns">
            <Select value={String(c.columns || 3)} onChange={v => set('columns', Number(v))} options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }]} />
          </Field>
        </Group>
        <Group id="items" title="Service Items">
          {((c.items as { icon: string; title: string; description: string; badge: string }[]) || []).map((item, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Service {i + 1}</span>
                <button onClick={() => removeFromArr('items', i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Icon">
                <Select value={item.icon} onChange={v => setArr('items', i, 'icon', v)} options={ICON_OPTIONS.map(o => ({ value: o, label: o }))} />
              </Field>
              <Field label="Title"><Input value={item.title} onChange={v => setArr('items', i, 'title', v)} /></Field>
              <Field label="Description"><Input value={item.description} onChange={v => setArr('items', i, 'description', v)} textarea /></Field>
              <Field label="Badge"><Input value={item.badge || ''} onChange={v => setArr('items', i, 'badge', v)} placeholder="Popular (optional)" /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('items', { icon: 'Zap', title: 'New Service', description: 'Service description', link_text: 'Learn More', link_href: '#contact', badge: '' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        </Group>
      </>
    );

    if (t === 'stats') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        </Group>
        <Group id="items" title="Stat Items">
          {((c.items as { value: string; label: string; icon: string; prefix: string; suffix: string }[]) || []).map((item, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Stat {i + 1}</span>
                <button onClick={() => removeFromArr('items', i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Icon">
                <Select value={item.icon || 'Star'} onChange={v => setArr('items', i, 'icon', v)} options={ICON_OPTIONS.map(o => ({ value: o, label: o }))} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Prefix"><Input value={item.prefix || ''} onChange={v => setArr('items', i, 'prefix', v)} placeholder="" /></Field>
                <Field label="Value"><Input value={item.value} onChange={v => setArr('items', i, 'value', v)} placeholder="500" /></Field>
                <Field label="Suffix"><Input value={item.suffix || ''} onChange={v => setArr('items', i, 'suffix', v)} placeholder="+" /></Field>
              </div>
              <Field label="Label"><Input value={item.label} onChange={v => setArr('items', i, 'label', v)} placeholder="Happy Clients" /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('items', { value: '0', label: 'New Stat', icon: 'Star', prefix: '', suffix: '+' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Stat
          </button>
        </Group>
      </>
    );

    if (t === 'about') return (
      <Group id="content" title="Content">
        <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
        <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea /></Field>
        <Field label="Mission"><Input value={(c.mission as string) || ''} onChange={v => set('mission', v)} textarea /></Field>
        <Field label="Vision"><Input value={(c.vision as string) || ''} onChange={v => set('vision', v)} textarea /></Field>
        <Field label="Image URL"><Input value={(c.image_url as string) || ''} onChange={v => set('image_url', v)} placeholder="https://..." /></Field>
        <Field label="Layout">
          <Select value={(c.layout as string) || 'right'} onChange={v => set('layout', v)} options={[{ value: 'left', label: 'Image Left' }, { value: 'right', label: 'Image Right' }, { value: 'centered', label: 'Centered' }]} />
        </Field>
        <Toggle value={!!(c.show_values)} onChange={v => set('show_values', v)} label="Show Core Values" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Founded"><Input value={(c.founded_year as string) || ''} onChange={v => set('founded_year', v)} placeholder="2015" /></Field>
          <Field label="Team Size"><Input value={(c.team_size as string) || ''} onChange={v => set('team_size', v)} placeholder="50+" /></Field>
          <Field label="Clients"><Input value={(c.clients_served as string) || ''} onChange={v => set('clients_served', v)} placeholder="500+" /></Field>
        </div>
      </Group>
    );

    if (t === 'team') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Toggle value={!!(c.show_social)} onChange={v => set('show_social', v)} label="Show Social Links" />
        </Group>
        <Group id="members" title="Team Members">
          {((c.members as { name: string; role: string; bio: string; image_url: string }[]) || []).map((m, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Member {i + 1}</span>
                <button onClick={() => removeFromArr('members', i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Name"><Input value={m.name} onChange={v => setArr('members', i, 'name', v)} /></Field>
              <Field label="Role"><Input value={m.role} onChange={v => setArr('members', i, 'role', v)} /></Field>
              <Field label="Bio"><Input value={m.bio} onChange={v => setArr('members', i, 'bio', v)} textarea /></Field>
              <Field label="Photo URL"><Input value={m.image_url} onChange={v => setArr('members', i, 'image_url', v)} placeholder="https://..." /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('members', { name: 'New Member', role: 'Role', bio: 'Bio', image_url: '', linkedin: '', twitter: '', email: '' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </Group>
      </>
    );

    if (t === 'testimonials') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Toggle value={!!(c.show_rating)} onChange={v => set('show_rating', v)} label="Show Star Ratings" />
        </Group>
        <Group id="items" title="Testimonials">
          {((c.items as { name: string; role: string; company: string; text: string; rating: number }[]) || []).map((item, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Review {i + 1}</span>
                <button onClick={() => removeFromArr('items', i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name"><Input value={item.name} onChange={v => setArr('items', i, 'name', v)} /></Field>
                <Field label="Role"><Input value={item.role} onChange={v => setArr('items', i, 'role', v)} /></Field>
              </div>
              <Field label="Company"><Input value={item.company} onChange={v => setArr('items', i, 'company', v)} /></Field>
              <Field label="Review"><Input value={item.text} onChange={v => setArr('items', i, 'text', v)} textarea /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('items', { name: 'Client Name', role: 'CEO', company: 'Company', text: 'Great experience!', avatar_url: '', rating: 5 })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Testimonial
          </button>
        </Group>
      </>
    );

    if (t === 'pricing') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        </Group>
        <Group id="tiers" title="Pricing Tiers">
          {((c.tiers as { name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean; badge: string }[]) || []).map((tier, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Tier {i + 1}</span>
                <button onClick={() => removeFromArr('tiers', i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name"><Input value={tier.name} onChange={v => setArr('tiers', i, 'name', v)} /></Field>
                <Field label="Price"><Input value={tier.price} onChange={v => setArr('tiers', i, 'price', v)} placeholder="₹999" /></Field>
              </div>
              <Field label="Period"><Input value={tier.period} onChange={v => setArr('tiers', i, 'period', v)} placeholder="/month" /></Field>
              <Field label="Description"><Input value={tier.description} onChange={v => setArr('tiers', i, 'description', v)} /></Field>
              <Field label="Badge"><Input value={tier.badge || ''} onChange={v => setArr('tiers', i, 'badge', v)} placeholder="Most Popular (optional)" /></Field>
              <Toggle value={tier.highlighted} onChange={v => setArr('tiers', i, 'highlighted', v)} label="Highlight this tier" />
              <Field label="Features (one per line)">
                <textarea
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40 resize-none h-24"
                  value={(tier.features || []).join('\n')}
                  onChange={e => setArr('tiers', i, 'features', e.target.value.split('\n').filter(Boolean))}
                />
              </Field>
            </div>
          ))}
          <button onClick={() => addToArr('tiers', { name: 'New Plan', price: '₹0', period: '/month', description: 'Plan description', features: ['Feature 1'], cta_text: 'Get Started', cta_href: '#contact', highlighted: false, badge: '' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </button>
        </Group>
      </>
    );

    if (t === 'faq') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        </Group>
        <Group id="items" title="FAQ Items">
          {((c.items as { question: string; answer: string }[]) || []).map((item, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                <button onClick={() => removeFromArr('items', i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Question"><Input value={item.question} onChange={v => setArr('items', i, 'question', v)} /></Field>
              <Field label="Answer"><Input value={item.answer} onChange={v => setArr('items', i, 'answer', v)} textarea /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('items', { question: 'New Question?', answer: 'Answer here...' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </button>
        </Group>
      </>
    );

    if (t === 'gallery') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Field label="Columns">
            <Select value={String(c.columns || 3)} onChange={v => set('columns', Number(v))} options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }]} />
          </Field>
          <Toggle value={!!(c.show_captions)} onChange={v => set('show_captions', v)} label="Show Captions on Hover" />
        </Group>
        <Group id="images" title="Gallery Images">
          {((c.images as { url: string; alt: string; caption: string }[]) || []).map((img, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Image {i + 1}</span>
                <button onClick={() => removeFromArr('images', i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Image URL"><Input value={img.url} onChange={v => setArr('images', i, 'url', v)} placeholder="https://images.pexels.com/..." /></Field>
              <Field label="Alt Text"><Input value={img.alt} onChange={v => setArr('images', i, 'alt', v)} placeholder="Image description" /></Field>
              <Field label="Caption"><Input value={img.caption || ''} onChange={v => setArr('images', i, 'caption', v)} placeholder="Caption text" /></Field>
              {img.url && (
                <div className="w-full h-20 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          ))}
          <button onClick={() => addToArr('images', { url: '', alt: 'New Image', caption: '', category: '' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Image
          </button>
        </Group>
      </>
    );

    if (t === 'blog') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Field label="Columns">
            <Select value={String(c.columns || 3)} onChange={v => set('columns', Number(v))} options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }]} />
          </Field>
        </Group>
        <Group id="posts" title="Blog Posts">
          {((c.posts as { title: string; excerpt: string; image_url: string; date: string; author: string; tag: string }[]) || []).map((post, i) => (
            <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Post {i + 1}</span>
                <button onClick={() => removeFromArr('posts', i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Title"><Input value={post.title} onChange={v => setArr('posts', i, 'title', v)} /></Field>
              <Field label="Excerpt"><Input value={post.excerpt} onChange={v => setArr('posts', i, 'excerpt', v)} textarea /></Field>
              <Field label="Image URL"><Input value={post.image_url || ''} onChange={v => setArr('posts', i, 'image_url', v)} placeholder="https://images.pexels.com/..." /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Author"><Input value={post.author} onChange={v => setArr('posts', i, 'author', v)} /></Field>
                <Field label="Tag"><Input value={post.tag} onChange={v => setArr('posts', i, 'tag', v)} placeholder="Business" /></Field>
              </div>
              <Field label="Date"><Input value={post.date} onChange={v => setArr('posts', i, 'date', v)} placeholder="2025-01-15" /></Field>
            </div>
          ))}
          <button onClick={() => addToArr('posts', { title: 'New Post', excerpt: 'Post excerpt...', image_url: '', date: new Date().toISOString().split('T')[0], author: 'Author', tag: 'General', link: '#' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Post
          </button>
        </Group>
      </>
    );

    if (t === 'contact') return (
      <Group id="content" title="Contact Info">
        <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
        <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea /></Field>
        <Field label="Email"><Input value={(c.email as string) || ''} onChange={v => set('email', v)} placeholder="hello@..." /></Field>
        <Field label="Phone"><Input value={(c.phone as string) || ''} onChange={v => set('phone', v)} placeholder="+91..." /></Field>
        <Field label="WhatsApp Number"><Input value={(c.whatsapp as string) || ''} onChange={v => set('whatsapp', v)} placeholder="+919876543210" /></Field>
        <Field label="Address"><Input value={(c.address as string) || ''} onChange={v => set('address', v)} textarea /></Field>
        <Toggle value={!!(c.show_form)} onChange={v => set('show_form', v)} label="Show Contact Form" />
      </Group>
    );

    if (t === 'cta') return (
      <Group id="content" title="Content">
        <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
        <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
        <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea /></Field>
        <Field label="Primary CTA Text"><Input value={(c.cta_primary_text as string) || ''} onChange={v => set('cta_primary_text', v)} /></Field>
        <Field label="Primary CTA Link"><Input value={(c.cta_primary_href as string) || ''} onChange={v => set('cta_primary_href', v)} /></Field>
        <Toggle value={!!(c.show_secondary)} onChange={v => set('show_secondary', v)} label="Show Secondary CTA" />
        <Field label="Secondary CTA Text"><Input value={(c.cta_secondary_text as string) || ''} onChange={v => set('cta_secondary_text', v)} /></Field>
        <Field label="Layout">
          <Select value={(c.layout as string) || 'centered'} onChange={v => set('layout', v)} options={[{ value: 'centered', label: 'Centered' }, { value: 'split', label: 'Split' }]} />
        </Field>
      </Group>
    );

    if (t === 'free_call') return (
      <>
        <Group id="content" title="Content">
          <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
          <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
          <Field label="Body Text"><Input value={(c.body_text as string) || ''} onChange={v => set('body_text', v)} textarea /></Field>
          <Field label="CTA Text"><Input value={(c.cta_text as string) || ''} onChange={v => set('cta_text', v)} /></Field>
          <Field label="Calendar / Booking URL"><Input value={(c.calendar_url as string) || ''} onChange={v => set('calendar_url', v)} placeholder="https://calendly.com/..." /></Field>
          <Field label="Meeting Duration"><Input value={(c.meeting_duration as string) || ''} onChange={v => set('meeting_duration', v)} placeholder="30 minutes" /></Field>
          <Toggle value={!!(c.show_image)} onChange={v => set('show_image', v)} label="Show Image" />
          <Field label="Image URL"><Input value={(c.image_url as string) || ''} onChange={v => set('image_url', v)} placeholder="https://..." /></Field>
        </Group>
        <Group id="benefits" title="Benefits">
          <Toggle value={!!(c.show_benefits)} onChange={v => set('show_benefits', v)} label="Show Benefits List" />
          {((c.benefits as string[]) || []).map((b, i) => (
            <div key={i} className="flex gap-1 items-start">
              <Input value={b} onChange={v => {
                const arr = [...((c.benefits as string[]) || [])];
                arr[i] = v;
                set('benefits', arr);
              }} placeholder="Benefit item" />
              <button onClick={() => {
                const arr = ((c.benefits as string[]) || []).filter((_, j) => j !== i);
                set('benefits', arr);
              }} className="w-8 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => set('benefits', [...((c.benefits as string[]) || []), 'New benefit'])} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Benefit
          </button>
        </Group>
      </>
    );

    if (t === 'footer') return (
      <>
        <Group id="content" title="Footer Content">
          <Field label="Brand Name"><Input value={(c.brand_name as string) || ''} onChange={v => set('brand_name', v)} /></Field>
          <Field label="Brand Description"><Input value={(c.brand_description as string) || ''} onChange={v => set('brand_description', v)} textarea /></Field>
          <Field label="Logo URL"><Input value={(c.logo_url as string) || ''} onChange={v => set('logo_url', v)} placeholder="https://..." /></Field>
          <Field label="Copyright Text"><Input value={(c.copyright_text as string) || ''} onChange={v => set('copyright_text', v)} /></Field>
          <Toggle value={!!(c.show_newsletter)} onChange={v => set('show_newsletter', v)} label="Show Newsletter Signup" />
          {c.show_newsletter && (
            <Field label="Newsletter Text"><Input value={(c.newsletter_text as string) || ''} onChange={v => set('newsletter_text', v)} /></Field>
          )}
        </Group>
        <Group id="columns" title="Footer Columns">
          {((c.columns as { heading: string; links: { label: string; href: string }[] }[]) || []).map((col, ci) => (
            <div key={ci} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Column {ci + 1}</span>
                <button onClick={() => removeFromArr('columns', ci)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <Field label="Column Heading"><Input value={col.heading} onChange={v => setArr('columns', ci, 'heading', v)} /></Field>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Links</p>
              {(col.links || []).map((link, li) => (
                <div key={li} className="grid grid-cols-2 gap-1 items-start">
                  <input
                    value={link.label}
                    onChange={e => {
                      const cols = [...((c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [])];
                      const links = [...cols[ci].links];
                      links[li] = { ...links[li], label: e.target.value };
                      cols[ci] = { ...cols[ci], links };
                      set('columns', cols);
                    }}
                    placeholder="Label"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40"
                  />
                  <div className="flex gap-1">
                    <input
                      value={link.href}
                      onChange={e => {
                        const cols = [...((c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [])];
                        const links = [...cols[ci].links];
                        links[li] = { ...links[li], href: e.target.value };
                        cols[ci] = { ...cols[ci], links };
                        set('columns', cols);
                      }}
                      placeholder="#section"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40"
                    />
                    <button onClick={() => {
                      const cols = [...((c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [])];
                      cols[ci] = { ...cols[ci], links: cols[ci].links.filter((_, j) => j !== li) };
                      set('columns', cols);
                    }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const cols = [...((c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [])];
                cols[ci] = { ...cols[ci], links: [...(cols[ci].links || []), { label: 'New Link', href: '#' }] };
                set('columns', cols);
              }} className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 transition-colors">
                <Plus className="w-3 h-3" /> Add Link
              </button>
            </div>
          ))}
          <button onClick={() => addToArr('columns', { heading: 'New Column', links: [{ label: 'Link', href: '#' }] })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>
        </Group>
        <Group id="social" title="Social Links">
          <Toggle value={!!(c.show_social)} onChange={v => set('show_social', v)} label="Show Social Links" />
          {((c.social_links as { platform: string; url: string }[]) || []).map((s, i) => (
            <div key={i} className="flex gap-1 items-start">
              <select
                value={s.platform}
                onChange={e => setArr('social_links', i, 'platform', e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-orange-500/40 shrink-0"
              >
                {['linkedin', 'twitter', 'instagram', 'facebook', 'youtube', 'github', 'tiktok'].map(p => (
                  <option key={p} value={p} className="bg-[#0d1117] capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
              <Input value={s.url} onChange={v => setArr('social_links', i, 'url', v)} placeholder="https://..." />
              <button onClick={() => removeFromArr('social_links', i)} className="w-8 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => addToArr('social_links', { platform: 'linkedin', url: '' })} className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Social Link
          </button>
        </Group>
      </>
    );

    if (t === 'custom') return (
      <Group id="content" title="Custom Code">
        <Field label="HTML">
          <textarea
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-green-300 font-mono focus:outline-none focus:border-orange-500/40 resize-none h-40"
            value={(c.html as string) || ''}
            onChange={e => set('html', e.target.value)}
            placeholder="<div>Your HTML here</div>"
          />
        </Field>
        <Field label="Custom CSS">
          <textarea
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-blue-300 font-mono focus:outline-none focus:border-orange-500/40 resize-none h-32"
            value={(c.css as string) || ''}
            onChange={e => set('css', e.target.value)}
            placeholder=".my-class { color: red; }"
          />
        </Field>
      </Group>
    );

    return (
      <Group id="content" title="Content">
        <Field label="Heading"><Input value={(c.heading as string) || ''} onChange={v => set('heading', v)} /></Field>
        <Field label="Subheading"><Input value={(c.subheading as string) || ''} onChange={v => set('subheading', v)} /></Field>
      </Group>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="text-sm font-bold text-white bg-transparent border-none outline-none focus:text-orange-300 transition-colors"
          />
          <div className="text-[10px] text-gray-600 capitalize mt-0.5">{section.section_type.replace('_', ' ')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {renderFields()}
        <AnimationEditor animation={animation} onChange={setAnimation} />
      </div>
    </div>
  );
}
