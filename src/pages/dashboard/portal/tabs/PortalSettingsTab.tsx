import { useState } from 'react';
import { Save, Palette } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PORTAL_SECTION_LABELS } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalSections } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props {
  portal: ClientPortal;
  onUpdate: () => void;
}

const BRAND_COLORS = [
  '#FF6B00', '#3B82F6', '#10B981', '#EF4444', '#F59E0B',
  '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export default function PortalSettingsTab({ portal, onUpdate }: Props) {
  const [name, setName] = useState(portal.portal_name);
  const [welcome, setWelcome] = useState(portal.welcome_message);
  const [description, setDescription] = useState(portal.company_description);
  const [color, setColor] = useState(portal.branding_color);
  const [logoUrl, setLogoUrl] = useState(portal.branding_logo_url);
  const [expiresAt, setExpiresAt] = useState(portal.expires_at ? portal.expires_at.split('T')[0] : '');
  const [sections, setSections] = useState<PortalSections>(portal.allowed_sections);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('client_portals')
      .update({
        portal_name: name,
        welcome_message: welcome,
        company_description: description,
        branding_color: color,
        branding_logo_url: logoUrl,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        allowed_sections: sections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portal.id);

    if (error) toast.error('Failed to save');
    else { toast.success('Settings saved'); onUpdate(); }
    setSaving(false);
  };

  const toggleSection = (key: keyof PortalSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-semibold">General Settings</h3>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Portal Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Welcome Message</label>
          <textarea
            value={welcome}
            onChange={e => setWelcome(e.target.value)}
            rows={3}
            placeholder="Welcome to our client portal. Here you can explore our work and track your project progress."
            className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Company Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell your client about your company, mission, and expertise..."
            className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Logo URL</label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none"
          />
          {logoUrl && (
            <div className="mt-2 p-3 bg-dark-700 rounded-lg inline-block">
              <img src={logoUrl} alt="Logo preview" className="h-10 object-contain" />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">Access Expiry Date (Optional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry. Client will lose access after this date.</p>
        </div>
      </div>

      <div className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-400" />
          <h3 className="text-base font-semibold">Brand Color</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {BRAND_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-xl transition-all ${
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs text-gray-500 font-mono">{color}</span>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold">Visible Sections</h3>
        <p className="text-sm text-gray-400">Choose which sections your client can see</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(PORTAL_SECTION_LABELS) as (keyof PortalSections)[]).map(key => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                sections[key]
                  ? 'bg-brand-600/5 border-brand-500/30'
                  : 'bg-dark-700 border-white/[0.06] hover:border-white/10'
              }`}
            >
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={() => toggleSection(key)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                sections[key] ? 'bg-brand-500 border-brand-500' : 'border-gray-600'
              }`}>
                {sections[key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{PORTAL_SECTION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
