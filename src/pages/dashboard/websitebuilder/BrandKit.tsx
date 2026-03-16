import { useState, useEffect, useCallback } from 'react';
import {
  Palette, Type, Image, Globe, Save, RefreshCw, Check,
  ChevronDown, Link, Instagram, Linkedin, Twitter, Youtube,
  Sparkles, Paintbrush, LayoutTemplate, Bold, AlignLeft,
  Copy, Eye, Download, Upload, Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { BrandKit, WebsiteProject } from '../../../lib/websiteBuilder/types';
import { FONT_OPTIONS } from '../../../lib/websiteBuilder/defaults';

interface Props {
  project: WebsiteProject | null;
  onApplyToWebsite?: (kit: BrandKit) => void;
}

type BrandTab = 'identity' | 'colors' | 'typography' | 'assets' | 'voice';

const DEFAULT_KIT: Omit<BrandKit, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  name: 'My Brand Kit',
  brand_name: '',
  tagline: '',
  logo_url: '',
  logo_dark_url: '',
  logo_icon_url: '',
  primary_color: '#f97316',
  secondary_color: '#0ea5e9',
  accent_color: '#f59e0b',
  success_color: '#22c55e',
  warning_color: '#f59e0b',
  error_color: '#ef4444',
  neutral_dark: '#0f172a',
  neutral_mid: '#64748b',
  neutral_light: '#f1f5f9',
  heading_font: 'Poppins',
  body_font: 'Inter',
  mono_font: 'JetBrains Mono',
  font_size_base: '16px',
  font_weight_heading: '700',
  font_weight_body: '400',
  line_height_body: '1.6',
  border_radius: 'soft',
  button_style: 'solid',
  shadow_style: 'soft',
  social_links: { linkedin: '', twitter: '', instagram: '', facebook: '', youtube: '', website: '' },
  brand_voice: '',
  industry: '',
  is_active: true,
};

const COLOR_PRESETS = [
  { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#6366f1', accent: '#f59e0b' },
  { name: 'Forest Green', primary: '#16a34a', secondary: '#0d9488', accent: '#f97316' },
  { name: 'Coral Red', primary: '#ef4444', secondary: '#f97316', accent: '#06b6d4' },
  { name: 'Sunset Orange', primary: '#f97316', secondary: '#ef4444', accent: '#facc15' },
  { name: 'Rose Pink', primary: '#ec4899', secondary: '#f43f5e', accent: '#8b5cf6' },
  { name: 'Deep Teal', primary: '#0d9488', secondary: '#0369a1', accent: '#d97706' },
  { name: 'Golden Yellow', primary: '#f59e0b', secondary: '#f97316', accent: '#10b981' },
  { name: 'Slate Modern', primary: '#475569', secondary: '#334155', accent: '#0ea5e9' },
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail / E-commerce',
  'Real Estate', 'Food & Beverage', 'Travel & Hospitality', 'Media & Entertainment',
  'Consulting', 'Legal', 'Manufacturing', 'Non-Profit', 'Fashion & Beauty',
  'Fitness & Wellness', 'Marketing & Advertising', 'Construction', 'Other',
];

const FONT_PAIRS = [
  { heading: 'Poppins', body: 'Inter', label: 'Modern Clean' },
  { heading: 'Playfair Display', body: 'Lato', label: 'Elegant Classic' },
  { heading: 'Montserrat', body: 'Open Sans', label: 'Professional' },
  { heading: 'Space Grotesk', body: 'IBM Plex Sans', label: 'Tech Forward' },
  { heading: 'Cormorant Garamond', body: 'Source Sans 3', label: 'Luxury Editorial' },
  { heading: 'Raleway', body: 'Nunito', label: 'Friendly Modern' },
  { heading: 'Outfit', body: 'Manrope', label: 'Startup Vibe' },
  { heading: 'Libre Baskerville', body: 'Work Sans', label: 'Trust & Authority' },
];

const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
const selectCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors';
const labelCls = 'block text-xs font-semibold text-gray-400 mb-1.5 tracking-wide uppercase';

function ColorSwatch({
  label, value, onChange, description,
}: { label: string; value: string; onChange: (v: string) => void; description?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
        {description && <span className="text-[10px] text-gray-600">{description}</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-xl border-2 border-white/[0.08] cursor-pointer bg-transparent"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <input
            type="text"
            value={value}
            onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
            className="text-sm text-white bg-transparent outline-none flex-1 uppercase font-mono"
            maxLength={7}
          />
          <button onClick={copy} className="text-gray-600 hover:text-white transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div
          className="w-10 h-10 rounded-xl shadow-lg flex-shrink-0 border border-white/10"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

export default function BrandKit({ project, onApplyToWebsite }: Props) {
  const { user } = useAuth();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [local, setLocal] = useState<Omit<BrandKit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>(DEFAULT_KIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<BrandTab>('identity');
  const [showFontPreview, setShowFontPreview] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (data) {
        setKit(data);
        setLocal({
          name: data.name,
          brand_name: data.brand_name,
          tagline: data.tagline,
          logo_url: data.logo_url,
          logo_dark_url: data.logo_dark_url,
          logo_icon_url: data.logo_icon_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          success_color: data.success_color,
          warning_color: data.warning_color,
          error_color: data.error_color,
          neutral_dark: data.neutral_dark,
          neutral_mid: data.neutral_mid,
          neutral_light: data.neutral_light,
          heading_font: data.heading_font,
          body_font: data.body_font,
          mono_font: data.mono_font,
          font_size_base: data.font_size_base,
          font_weight_heading: data.font_weight_heading,
          font_weight_body: data.font_weight_body,
          line_height_body: data.line_height_body,
          border_radius: data.border_radius,
          button_style: data.button_style,
          shadow_style: data.shadow_style,
          social_links: data.social_links,
          brand_voice: data.brand_voice,
          industry: data.industry,
          is_active: data.is_active,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = (patch: Partial<typeof local>) => setLocal(p => ({ ...p, ...patch }));
  const updateSocial = (key: keyof typeof local.social_links, val: string) =>
    setLocal(p => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (kit) {
        await supabase
          .from('brand_kits')
          .update({ ...local, updated_at: new Date().toISOString() })
          .eq('id', kit.id);
        setKit(prev => prev ? { ...prev, ...local } : prev);
      } else {
        const { data } = await supabase
          .from('brand_kits')
          .insert({ ...local, user_id: user.id })
          .select()
          .single();
        if (data) setKit(data);
      }
      toast.success('Brand Kit saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    update({ primary_color: preset.primary, secondary_color: preset.secondary, accent_color: preset.accent });
    toast.success(`Applied "${preset.name}" palette`);
  };

  const applyFontPair = (pair: typeof FONT_PAIRS[0]) => {
    update({ heading_font: pair.heading, body_font: pair.body });
    toast.success(`Applied "${pair.label}" font pair`);
  };

  const applyToWebsite = async () => {
    if (!project || !kit) return;
    const merged = { ...kit, ...local };
    await supabase.from('website_projects').update({
      theme_color: local.primary_color,
      secondary_color: local.secondary_color,
      font_family: local.body_font,
      updated_at: new Date().toISOString(),
    }).eq('id', project.id);
    onApplyToWebsite?.(merged as BrandKit);
    toast.success('Brand Kit applied to website!');
  };

  const googleFontsLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(local.heading_font)}:wght@400;500;600;700;800&family=${encodeURIComponent(local.body_font)}:wght@300;400;500;600&display=swap`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: BrandTab; label: string; icon: React.ElementType }[] = [
    { id: 'identity', label: 'Identity', icon: Sparkles },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'assets', label: 'Assets', icon: Image },
    { id: 'voice', label: 'Voice', icon: AlignLeft },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <link rel="stylesheet" href={googleFontsLink} />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Paintbrush className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Brand Kit</h2>
              <p className="text-[10px] text-gray-500">Control your complete brand identity</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {project && (
              <button
                onClick={applyToWebsite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
              >
                <Wand2 className="w-3 h-3" />
                Apply
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-white/[0.03] rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === id ? 'bg-orange-500 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* --- IDENTITY TAB --- */}
        {tab === 'identity' && (
          <div className="p-4 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Kit Name</label>
                <input value={local.name} onChange={e => update({ name: e.target.value })} className={inputCls} placeholder="My Brand Kit" />
              </div>
              <div>
                <label className={labelCls}>Brand / Business Name</label>
                <input value={local.brand_name} onChange={e => update({ brand_name: e.target.value })} className={inputCls} placeholder="Acme Corp" />
              </div>
              <div>
                <label className={labelCls}>Tagline</label>
                <input value={local.tagline} onChange={e => update({ tagline: e.target.value })} className={inputCls} placeholder="Building better businesses" />
              </div>
              <div>
                <label className={labelCls}>Industry</label>
                <div className="relative">
                  <select value={local.industry} onChange={e => update({ industry: e.target.value })} className={selectCls}>
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label className={labelCls}>Social Media Profiles</label>
              <div className="space-y-2">
                {([
                  ['website', Globe, 'Website URL'],
                  ['linkedin', Linkedin, 'LinkedIn'],
                  ['twitter', Twitter, 'Twitter / X'],
                  ['instagram', Instagram, 'Instagram'],
                  ['youtube', Youtube, 'YouTube'],
                  ['facebook', Link, 'Facebook'],
                ] as [keyof typeof local.social_links, React.ElementType, string][]).map(([key, Icon, label]) => (
                  <div key={key} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                      value={local.social_links[key]}
                      onChange={e => updateSocial(key, e.target.value)}
                      placeholder={label}
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-gray-300">Identity Preview</span>
              </div>
              <div className="p-4" style={{ backgroundColor: local.neutral_dark }}>
                <div className="mb-2">
                  {local.logo_url ? (
                    <img src={local.logo_url} alt="Logo" className="h-10 object-contain" />
                  ) : (
                    <div
                      className="h-10 flex items-center"
                      style={{ fontFamily: `'${local.heading_font}', sans-serif`, fontSize: '1.5rem', fontWeight: 700, color: local.primary_color }}
                    >
                      {local.brand_name || 'Brand Name'}
                    </div>
                  )}
                </div>
                {local.tagline && (
                  <p style={{ fontFamily: `'${local.body_font}', sans-serif`, fontSize: '0.85rem', color: local.neutral_mid }}>
                    {local.tagline}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <div className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: local.primary_color }}>
                    Primary Button
                  </div>
                  <div className="px-4 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: local.secondary_color, color: local.secondary_color }}>
                    Secondary
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- COLORS TAB --- */}
        {tab === 'colors' && (
          <div className="p-4 space-y-5">
            {/* Preset Palettes */}
            <div>
              <label className={labelCls}>Color Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.06] hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all group"
                  >
                    <div className="flex gap-1 flex-shrink-0">
                      {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 group-hover:text-white truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Colors */}
            <div>
              <label className={labelCls}>Brand Colors</label>
              <div className="space-y-3">
                <ColorSwatch label="Primary" value={local.primary_color} onChange={v => update({ primary_color: v })} description="Main brand color" />
                <ColorSwatch label="Secondary" value={local.secondary_color} onChange={v => update({ secondary_color: v })} description="Supporting color" />
                <ColorSwatch label="Accent" value={local.accent_color} onChange={v => update({ accent_color: v })} description="Highlights & CTAs" />
              </div>
            </div>

            {/* System Colors */}
            <div>
              <label className={labelCls}>System Colors</label>
              <div className="space-y-3">
                <ColorSwatch label="Success" value={local.success_color} onChange={v => update({ success_color: v })} />
                <ColorSwatch label="Warning" value={local.warning_color} onChange={v => update({ warning_color: v })} />
                <ColorSwatch label="Error" value={local.error_color} onChange={v => update({ error_color: v })} />
              </div>
            </div>

            {/* Neutral Palette */}
            <div>
              <label className={labelCls}>Neutral Palette</label>
              <div className="space-y-3">
                <ColorSwatch label="Dark" value={local.neutral_dark} onChange={v => update({ neutral_dark: v })} description="Backgrounds, text" />
                <ColorSwatch label="Mid" value={local.neutral_mid} onChange={v => update({ neutral_mid: v })} description="Borders, muted" />
                <ColorSwatch label="Light" value={local.neutral_light} onChange={v => update({ neutral_light: v })} description="Surface, cards" />
              </div>
            </div>

            {/* Full Palette Preview */}
            <div>
              <label className={labelCls}>Palette Preview</label>
              <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                <div className="grid grid-cols-6">
                  {[local.primary_color, local.secondary_color, local.accent_color, local.success_color, local.warning_color, local.error_color].map((c, i) => (
                    <div key={i} className="h-12" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
                <div className="grid grid-cols-3">
                  {[local.neutral_dark, local.neutral_mid, local.neutral_light].map((c, i) => (
                    <div key={i} className="h-8 flex items-center justify-center" style={{ backgroundColor: c }}>
                      <span className="text-[9px] font-mono opacity-60" style={{ color: i === 2 ? '#0f172a' : '#fff' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TYPOGRAPHY TAB --- */}
        {tab === 'typography' && (
          <div className="p-4 space-y-5">
            {/* Font Pairs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>Font Pair Presets</label>
                <button
                  onClick={() => setShowFontPreview(!showFontPreview)}
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showFontPreview ? 'Hide' : 'Preview'}
                </button>
              </div>
              <div className="space-y-1.5">
                {FONT_PAIRS.map(pair => (
                  <button
                    key={pair.label}
                    onClick={() => applyFontPair(pair)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${local.heading_font === pair.heading && local.body_font === pair.body ? 'border-orange-500/40 bg-orange-500/[0.06]' : 'border-white/[0.06] hover:border-orange-500/20 hover:bg-white/[0.02]'}`}
                  >
                    <div className="text-left">
                      <span className="text-[13px] font-semibold text-white block" style={{ fontFamily: `'${pair.heading}', sans-serif` }}>{pair.heading}</span>
                      <span className="text-[11px] text-gray-500" style={{ fontFamily: `'${pair.body}', sans-serif` }}>Body: {pair.body}</span>
                    </div>
                    <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-1 rounded-lg">{pair.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Selectors */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Heading Font</label>
                <div className="relative">
                  <select value={local.heading_font} onChange={e => update({ heading_font: e.target.value })} className={selectCls}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <p className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: `'${local.heading_font}', sans-serif` }}>
                  The quick brown fox
                </p>
              </div>
              <div>
                <label className={labelCls}>Body Font</label>
                <div className="relative">
                  <select value={local.body_font} onChange={e => update({ body_font: e.target.value })} className={selectCls}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed" style={{ fontFamily: `'${local.body_font}', sans-serif` }}>
                  Body text looks like this. Clear, readable, and well-spaced for comfortable reading across all devices.
                </p>
              </div>
              <div>
                <label className={labelCls}>Monospace Font</label>
                <div className="relative">
                  <select value={local.mono_font} onChange={e => update({ mono_font: e.target.value })} className={selectCls}>
                    {['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Roboto Mono'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Base Font Size</label>
                <div className="flex gap-2">
                  {['14px', '15px', '16px', '17px', '18px'].map(s => (
                    <button
                      key={s}
                      onClick={() => update({ font_size_base: s })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${local.font_size_base === s ? 'bg-orange-500 text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Heading Weight</label>
                <div className="flex gap-2">
                  {[['600', 'Semi'], ['700', 'Bold'], ['800', 'Extra'], ['900', 'Black']].map(([w, l]) => (
                    <button
                      key={w}
                      onClick={() => update({ font_weight_heading: w })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${local.font_weight_heading === w ? 'bg-orange-500 text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Line Height</label>
                <div className="flex gap-2">
                  {[['1.4', 'Tight'], ['1.6', 'Normal'], ['1.8', 'Relaxed'], ['2.0', 'Loose']].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => update({ line_height_body: v })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${local.line_height_body === v ? 'bg-orange-500 text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Controls */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Border Radius Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: 'sharp', label: 'Sharp', r: '0px' },
                    { v: 'soft', label: 'Soft', r: '8px' },
                    { v: 'round', label: 'Round', r: '16px' },
                    { v: 'pill', label: 'Pill', r: '999px' },
                  ].map(({ v, label, r }) => (
                    <button
                      key={v}
                      onClick={() => update({ border_radius: v })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${local.border_radius === v ? 'border-orange-500/40 bg-orange-500/[0.06]' : 'border-white/[0.06] hover:border-white/[0.1]'}`}
                    >
                      <div
                        className="w-8 h-6 bg-orange-500/80"
                        style={{ borderRadius: r }}
                      />
                      <span className="text-[10px] text-gray-400">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Button Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'solid', label: 'Solid' },
                    { v: 'outline', label: 'Outline' },
                    { v: 'ghost', label: 'Ghost' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => update({ button_style: v })}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${local.button_style === v ? 'border-orange-500/40 bg-orange-500/[0.06] text-orange-400' : 'border-white/[0.06] text-gray-400 hover:border-white/[0.1] hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Typography Preview */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02]">
                <Bold className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-gray-300">Typography Preview</span>
              </div>
              <div className="p-5 space-y-3" style={{ backgroundColor: '#fff' }}>
                <h1 style={{ fontFamily: `'${local.heading_font}', sans-serif`, fontSize: '2rem', fontWeight: Number(local.font_weight_heading), color: local.neutral_dark, lineHeight: 1.2 }}>
                  Heading H1
                </h1>
                <h2 style={{ fontFamily: `'${local.heading_font}', sans-serif`, fontSize: '1.5rem', fontWeight: Number(local.font_weight_heading), color: local.neutral_dark, lineHeight: 1.3 }}>
                  Heading H2
                </h2>
                <p style={{ fontFamily: `'${local.body_font}', sans-serif`, fontSize: local.font_size_base, fontWeight: Number(local.font_weight_body), color: local.neutral_mid, lineHeight: local.line_height_body }}>
                  Body paragraph text. This is how your regular content will appear to readers. Good typography creates hierarchy and guides the eye.
                </p>
                <div className="flex gap-2">
                  <span
                    className="px-4 py-2 text-sm font-semibold text-white"
                    style={{
                      backgroundColor: local.primary_color,
                      borderRadius: local.border_radius === 'sharp' ? '0' : local.border_radius === 'soft' ? '8px' : local.border_radius === 'round' ? '16px' : '999px',
                      fontFamily: `'${local.body_font}', sans-serif`,
                    }}
                  >
                    Get Started
                  </span>
                  <span
                    className="px-4 py-2 text-sm font-semibold"
                    style={{
                      border: `2px solid ${local.primary_color}`,
                      color: local.primary_color,
                      borderRadius: local.border_radius === 'sharp' ? '0' : local.border_radius === 'soft' ? '8px' : local.border_radius === 'round' ? '16px' : '999px',
                      fontFamily: `'${local.body_font}', sans-serif`,
                    }}
                  >
                    Learn More
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ASSETS TAB --- */}
        {tab === 'assets' && (
          <div className="p-4 space-y-5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 flex items-start gap-2.5">
              <Upload className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Logo via URL</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Paste your hosted logo URLs below. Upload your logos to your media gallery first, then copy the URL.</p>
              </div>
            </div>

            {[
              { key: 'logo_url' as const, label: 'Primary Logo', desc: 'Used on light backgrounds', preview_bg: '#ffffff' },
              { key: 'logo_dark_url' as const, label: 'Dark Logo Variant', desc: 'Used on dark backgrounds', preview_bg: '#0f172a' },
              { key: 'logo_icon_url' as const, label: 'Icon / Favicon', desc: 'Square icon for favicon and small spaces', preview_bg: '#ffffff' },
            ].map(({ key, label, desc, preview_bg }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <p className="text-[11px] text-gray-600 mb-2">{desc}</p>
                <input
                  value={local[key]}
                  onChange={e => update({ [key]: e.target.value })}
                  placeholder="https://..."
                  className={inputCls}
                />
                {local[key] && (
                  <div
                    className="mt-2 h-20 rounded-xl border border-white/[0.08] flex items-center justify-center p-3"
                    style={{ backgroundColor: preview_bg }}
                  >
                    <img src={local[key]} alt={label} className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            ))}

            {/* Color Export */}
            <div>
              <label className={labelCls}>CSS Variables Export</label>
              <div className="bg-[#0d1117] rounded-xl border border-white/[0.08] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 font-mono">Generated CSS</span>
                  <button
                    onClick={() => {
                      const css = `:root {\n  --color-primary: ${local.primary_color};\n  --color-secondary: ${local.secondary_color};\n  --color-accent: ${local.accent_color};\n  --color-success: ${local.success_color};\n  --color-warning: ${local.warning_color};\n  --color-error: ${local.error_color};\n  --color-dark: ${local.neutral_dark};\n  --color-mid: ${local.neutral_mid};\n  --color-light: ${local.neutral_light};\n  --font-heading: '${local.heading_font}', sans-serif;\n  --font-body: '${local.body_font}', sans-serif;\n  --font-size-base: ${local.font_size_base};\n  --line-height-body: ${local.line_height_body};\n}`;
                      navigator.clipboard.writeText(css);
                      toast.success('CSS variables copied!');
                    }}
                    className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300"
                  >
                    <Download className="w-3 h-3" /> Copy CSS
                  </button>
                </div>
                <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`:root {
  --color-primary: ${local.primary_color};
  --color-secondary: ${local.secondary_color};
  --color-accent: ${local.accent_color};
  --font-heading: '${local.heading_font}';
  --font-body: '${local.body_font}';
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* --- VOICE TAB --- */}
        {tab === 'voice' && (
          <div className="p-4 space-y-5">
            <div>
              <label className={labelCls}>Brand Voice & Tone</label>
              <p className="text-[11px] text-gray-500 mb-2">Describe how your brand communicates. This guides AI-generated content across the platform.</p>
              <textarea
                value={local.brand_voice}
                onChange={e => update({ brand_voice: e.target.value })}
                rows={5}
                placeholder="e.g. We speak with confidence and warmth. Professional but approachable. We use simple language, avoid jargon, and always focus on the customer's benefit. We're direct, friendly, and inspire trust..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
              />
            </div>

            <div>
              <label className={labelCls}>Brand Voice Attributes</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Professional', 'Friendly', 'Bold', 'Minimalist',
                  'Authoritative', 'Playful', 'Luxurious', 'Approachable',
                  'Inspiring', 'Trustworthy', 'Innovative', 'Empathetic',
                ].map(attr => {
                  const active = local.brand_voice.toLowerCase().includes(attr.toLowerCase());
                  return (
                    <button
                      key={attr}
                      onClick={() => {
                        if (active) {
                          update({ brand_voice: local.brand_voice.replace(new RegExp(`, ?${attr}|${attr},? ?`, 'gi'), '').trim() });
                        } else {
                          update({ brand_voice: local.brand_voice ? `${local.brand_voice}, ${attr}` : attr });
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${active ? 'border-orange-500/40 bg-orange-500/[0.08] text-orange-400' : 'border-white/[0.06] text-gray-500 hover:border-white/[0.12] hover:text-gray-300'}`}
                    >
                      {attr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Fonts Embed */}
            <div>
              <label className={labelCls}>Google Fonts Embed Code</label>
              <p className="text-[11px] text-gray-500 mb-2">Add this to your website's <code className="text-orange-400">&lt;head&gt;</code> for custom fonts.</p>
              <div className="bg-[#0d1117] rounded-xl border border-white/[0.08] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 font-mono">HTML embed</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${googleFontsLink}" rel="stylesheet">`);
                      toast.success('Font embed code copied!');
                    }}
                    className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${googleFontsLink.substring(0, 60)}..." rel="stylesheet">`}
                </pre>
              </div>
            </div>

            {/* Brand Guidelines Summary */}
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <LayoutTemplate className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-gray-300">Brand Guidelines Summary</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Brand</p>
                    <p className="text-sm font-semibold text-white">{local.brand_name || '—'}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{local.tagline || 'No tagline set'}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Industry</p>
                    <p className="text-sm font-semibold text-white">{local.industry || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[local.primary_color, local.secondary_color, local.accent_color].map((c, i) => (
                    <div key={i} className="flex-1 h-8 rounded-lg shadow" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
                <div className="text-[11px] text-gray-400" style={{ fontFamily: `'${local.heading_font}', sans-serif` }}>
                  <span className="font-bold">Heading:</span> {local.heading_font} &nbsp;·&nbsp; <span className="font-bold">Body:</span> {local.body_font}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
