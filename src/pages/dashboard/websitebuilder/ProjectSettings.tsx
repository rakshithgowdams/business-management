import { useState } from 'react';
import { Save, Globe, Palette, Code, Search, BarChart3, Wand2 } from 'lucide-react';
import type { WebsiteProject } from '../../../lib/websiteBuilder/types';
import { FONT_OPTIONS } from '../../../lib/websiteBuilder/defaults';

interface Props {
  project: WebsiteProject;
  onSave: (project: WebsiteProject) => void;
  saving: boolean;
  onOpenBrandKit?: () => void;
}

type SettingsTab = 'general' | 'design' | 'seo' | 'integrations' | 'code';

export default function ProjectSettings({ project, onSave, saving, onOpenBrandKit }: Props) {
  const [local, setLocal] = useState(project);
  const [tab, setTab] = useState<SettingsTab>('general');

  const update = (patch: Partial<WebsiteProject>) => setLocal(p => ({ ...p, ...patch }));
  const save = () => onSave(local);

  const PRESET_COLORS = [
    '#f97316', '#ef4444', '#22c55e', '#0ea5e9', '#f59e0b',
    '#06b6d4', '#84cc16', '#ec4899', '#14b8a6', '#78716c',
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0.5 p-3 border-b border-white/[0.04] flex-wrap">
        {([
          ['general', Globe, 'General'],
          ['design', Palette, 'Design'],
          ['seo', Search, 'SEO'],
          ['integrations', BarChart3, 'Analytics'],
          ['code', Code, 'Code'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as SettingsTab)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === id ? 'bg-orange-500/15 text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'general' && (
          <>
            <Field label="Website Name">
              <input value={local.name} onChange={e => update({ name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Subdomain">
              <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden focus-within:border-orange-500/40">
                <input value={local.subdomain || ''} onChange={e => update({ subdomain: e.target.value })} placeholder="your-business" className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none" />
                <span className="px-3 py-2 text-xs text-gray-500 border-l border-white/[0.06]">.mydesignnexus.in</span>
              </div>
            </Field>
            <Field label="Custom Domain">
              <input value={local.custom_domain || ''} onChange={e => update({ custom_domain: e.target.value })} placeholder="www.yourdomain.com" className={inputCls} />
            </Field>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div>
                <p className="text-xs font-semibold text-white">Published</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Make website publicly accessible</p>
              </div>
              <Toggle value={local.published} onChange={v => update({ published: v })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div>
                <p className="text-xs font-semibold text-white">Dark Mode</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Use dark color scheme by default</p>
              </div>
              <Toggle value={local.dark_mode} onChange={v => update({ dark_mode: v })} />
            </div>
          </>
        )}

        {tab === 'design' && (
          <>
            {onOpenBrandKit && (
              <button
                onClick={onOpenBrandKit}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] text-orange-400 text-xs font-bold hover:bg-orange-500/[0.1] transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Open Brand Kit
              </button>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Primary Color</label>
              <div className="flex gap-2 flex-wrap mb-3">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => update({ theme_color: c })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${local.theme_color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input type="color" value={local.theme_color} onChange={e => update({ theme_color: e.target.value })} className="w-full h-10 rounded-xl border border-white/[0.06] cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Secondary Color</label>
              <input type="color" value={local.secondary_color} onChange={e => update({ secondary_color: e.target.value })} className="w-full h-10 rounded-xl border border-white/[0.06] cursor-pointer bg-transparent" />
            </div>
            <Field label="Font Family">
              <select value={local.font_family} onChange={e => update({ font_family: e.target.value })} className={selectCls}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Favicon URL</label>
              <input value={local.favicon_url || ''} onChange={e => update({ favicon_url: e.target.value })} placeholder="https://..." className={inputCls} />
            </div>
          </>
        )}

        {tab === 'seo' && (
          <>
            <Field label="SEO Title">
              <input value={local.seo_title || ''} onChange={e => update({ seo_title: e.target.value })} placeholder="My Business — Professional Services" className={inputCls} />
              <p className="text-[10px] text-gray-600 mt-1">{(local.seo_title || '').length}/60 characters recommended</p>
            </Field>
            <Field label="SEO Description">
              <textarea value={local.seo_description || ''} onChange={e => update({ seo_description: e.target.value })} placeholder="We provide professional services..." rows={3} className={textareaCls} />
              <p className="text-[10px] text-gray-600 mt-1">{(local.seo_description || '').length}/160 characters recommended</p>
            </Field>
            <Field label="Keywords">
              <input value={local.seo_keywords || ''} onChange={e => update({ seo_keywords: e.target.value })} placeholder="business, services, consulting" className={inputCls} />
            </Field>
            <Field label="OG Image URL">
              <input value={local.og_image_url || ''} onChange={e => update({ og_image_url: e.target.value })} placeholder="https://..." className={inputCls} />
              <p className="text-[10px] text-gray-600 mt-1">Recommended: 1200×630px for social sharing</p>
            </Field>
          </>
        )}

        {tab === 'integrations' && (
          <>
            <Field label="Google Analytics ID">
              <input value={local.google_analytics_id || ''} onChange={e => update({ google_analytics_id: e.target.value })} placeholder="G-XXXXXXXXXX" className={inputCls} />
            </Field>
            <Field label="Facebook Pixel ID">
              <input value={local.facebook_pixel_id || ''} onChange={e => update({ facebook_pixel_id: e.target.value })} placeholder="123456789012345" className={inputCls} />
            </Field>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
              <p className="text-xs font-semibold text-sky-400 mb-2">Analytics Integration</p>
              <p className="text-[11px] text-gray-500">Add your tracking IDs above to automatically include Google Analytics and Facebook Pixel tracking on your published website.</p>
            </div>
          </>
        )}

        {tab === 'code' && (
          <>
            <Field label="Custom CSS">
              <textarea
                value={local.custom_css}
                onChange={e => update({ custom_css: e.target.value })}
                placeholder={`/* Add your custom CSS here */\n.my-section { color: red; }`}
                rows={6}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500/40 resize-none"
              />
            </Field>
            <Field label="Custom JavaScript">
              <textarea
                value={local.custom_js}
                onChange={e => update({ custom_js: e.target.value })}
                placeholder={`// Add your custom JavaScript here\nconsole.log('Hello World');`}
                rows={6}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500/40 resize-none"
              />
            </Field>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3">
              <p className="text-[11px] text-amber-400">Code is injected into your published website. Use responsibly.</p>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-orange text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40';
const selectCls = 'w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40';
const textareaCls = 'w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 resize-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-orange-500' : 'bg-white/[0.1]'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}
