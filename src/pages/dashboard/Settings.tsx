import { useEffect, useState, useCallback, useRef } from 'react';
import { Save, Download, Trash2, Bot, Plus, X, Upload, Image, PenLine, Building2, Plug, Terminal, Users, Shield, LayoutTemplate, Film, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { hasOpenRouterKey } from '../../lib/ai/models';
import type { AIBusinessProfile } from '../../lib/ai/types';
import AIKeyCard from './settings/AIKeyCard';
import AIModelSelector from './settings/AIModelSelector';
import AIAutoModeToggle from './settings/AIAutoModeToggle';
import AIModelStatus from './settings/AIModelStatus';
import AIUsageTracker from './settings/AIUsageTracker';
import AIQuickTest from './settings/AIQuickTest';
import AISetupWizard from './settings/AISetupWizard';
import IntegrationKeyCard from './settings/IntegrationKeyCard';
import ApiConsole from './marketing/apiconsole/ApiConsole';
import TeamAccessManager from './settings/TeamAccessManager';
import TeamAIControls from './settings/TeamAIControls';
import ImageTemplateManager from './settings/ImageTemplateManager';
import VideoTemplateManager from './settings/VideoTemplateManager';
import CameraMovementManager from './settings/CameraMovementManager';

interface Profile {
  business_name: string;
  owner_name: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
  default_currency: string;
  budget_alerts_enabled: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    owner_name: '',
    address: '',
    gstin: '',
    email: '',
    phone: '',
    default_currency: 'INR',
    budget_alerts_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations' | 'api-console' | 'team-access' | 'team-ai' | 'image-templates' | 'video-templates' | 'camera-movements'>('general');
  const [savingAi, setSavingAi] = useState(false);
  const [smartAutoEnabled, setSmartAutoEnabled] = useState(true);
  const [keysVersion, setKeysVersion] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [aiProfile, setAiProfile] = useState<Omit<AIBusinessProfile, 'id' | 'user_id'>>({
    business_name: '',
    owner_name: '',
    city: '',
    services_offered: [],
    price_ranges: {},
    usp: '',
    target_industries: [],
    success_stories: [],
    testimonials: [],
  });
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestText, setNewTestText] = useState('');
  const [newService, setNewService] = useState('');
  const [newPriceRange, setNewPriceRange] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const [businessLogoUrl, setBusinessLogoUrl] = useState('');
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signSignedUrl, setSignSignedUrl] = useState('');
  const [uploadingSign, setUploadingSign] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_name: '',
  });
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadAiProfile();
      import('../../lib/apiKeys').then(({ loadKeysFromSupabase }) => loadKeysFromSupabase());
      syncLocalKeyToDb();
    }
  }, [user]);

  const syncLocalKeyToDb = async () => {
    const localKey = localStorage.getItem('mfo_key_openrouter');
    if (!localKey) return;
    try {
      const decoded = atob(localKey);
      const { getKeyInfo, saveApiKey } = await import('../../lib/ai/api');
      const info = await getKeyInfo();
      if (!info.has_key && decoded) {
        await saveApiKey(decoded);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      if (!hasOpenRouterKey()) setShowWizard(true);
    }
  }, [activeTab]);

  const loadSignedUrl = async (path: string, setter: (url: string) => void) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setter(data.signedUrl);
  };

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    if (data) {
      setProfile({
        business_name: data.business_name || '',
        owner_name: data.owner_name || '',
        address: data.address || '',
        gstin: data.gstin || '',
        email: data.email || '',
        phone: data.phone || '',
        default_currency: data.default_currency || 'INR',
        budget_alerts_enabled: data.budget_alerts_enabled ?? true,
      });
      if (data.business_logo_url) {
        setBusinessLogoUrl(data.business_logo_url);
        loadSignedUrl(data.business_logo_url, setLogoSignedUrl);
      }
      if (data.signature_url) {
        setSignatureUrl(data.signature_url);
        loadSignedUrl(data.signature_url, setSignSignedUrl);
      }
      setBankDetails({
        bank_account_name: data.bank_account_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc_code: data.bank_ifsc_code || '',
        bank_name: data.bank_name || '',
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, or SVG allowed');
      return;
    }
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user!.id}/business-logo.${ext}`;
    if (businessLogoUrl) {
      await supabase.storage.from('avatars').remove([businessLogoUrl]);
    }
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingLogo(false); return; }
    await supabase.from('profiles').update({ business_logo_url: filePath }).eq('id', user!.id);
    setBusinessLogoUrl(filePath);
    await loadSignedUrl(filePath, setLogoSignedUrl);
    setUploadingLogo(false);
    toast.success('Business logo updated');
  };

  const handleSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Signature must be under 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP allowed');
      return;
    }
    setUploadingSign(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user!.id}/signature.${ext}`;
    if (signatureUrl) {
      await supabase.storage.from('avatars').remove([signatureUrl]);
    }
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingSign(false); return; }
    await supabase.from('profiles').update({ signature_url: filePath }).eq('id', user!.id);
    setSignatureUrl(filePath);
    await loadSignedUrl(filePath, setSignSignedUrl);
    setUploadingSign(false);
    toast.success('Signature updated');
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    const { error } = await supabase.from('profiles').update(bankDetails).eq('id', user!.id);
    setSavingBank(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Bank details saved');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update(profile).eq('id', user!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Settings saved');
    }
  };

  const exportAllData = async () => {
    const tables = ['expenses', 'income', 'goals', 'invoices', 'quotations', 'agreements', 'emi_loans', 'subscriptions', 'budget_limits'];
    const allData: Record<string, unknown[]> = {};
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('user_id', user!.id);
      allData[table] = data || [];
    }
    allData['profile'] = [profile];

    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'myfinance-os-export.json';
    a.click();
    toast.success('Data exported');
  };

  const loadAiProfile = async () => {
    const { data } = await supabase.from('ai_business_profiles').select('*').eq('user_id', user!.id).maybeSingle();
    if (data) {
      setAiProfile({
        business_name: data.business_name || '',
        owner_name: data.owner_name || '',
        city: data.city || '',
        services_offered: (data.services_offered as string[]) || [],
        price_ranges: (data.price_ranges as Record<string, string>) || {},
        usp: data.usp || '',
        target_industries: (data.target_industries as string[]) || [],
        success_stories: (data.success_stories as { title: string; description: string }[]) || [],
        testimonials: (data.testimonials as { name: string; text: string }[]) || [],
      });
    }
  };

  const handleSaveAiSettings = async () => {
    setSavingAi(true);
    const { data: existing } = await supabase.from('ai_business_profiles').select('id').eq('user_id', user!.id).maybeSingle();
    if (existing) {
      await supabase.from('ai_business_profiles').update({ ...aiProfile, updated_at: new Date().toISOString() }).eq('user_id', user!.id);
    } else {
      await supabase.from('ai_business_profiles').insert({ user_id: user!.id, ...aiProfile });
    }
    setSavingAi(false);
    toast.success('AI settings saved');
  };

  const clearAllData = async () => {
    const parentTables = ['expenses', 'income', 'goals', 'invoices', 'quotations', 'agreements', 'emi_loans', 'subscriptions', 'budget_limits'];
    for (const table of parentTables) {
      await supabase.from(table).delete().eq('user_id', user!.id);
    }
    setShowClearConfirm(false);
    toast.success('All data cleared');
  };

  const handleKeyStatusChange = useCallback(() => {
    setKeysVersion((v) => v + 1);
  }, []);

  const addService = () => {
    const name = newService.trim();
    if (!name) return;
    if (aiProfile.services_offered.includes(name)) {
      toast.error('Service already exists');
      return;
    }
    const updatedServices = [...aiProfile.services_offered, name];
    const updatedPrices = { ...aiProfile.price_ranges };
    if (newPriceRange.trim()) {
      updatedPrices[name] = newPriceRange.trim();
    }
    setAiProfile({ ...aiProfile, services_offered: updatedServices, price_ranges: updatedPrices });
    setNewService('');
    setNewPriceRange('');
  };

  const removeService = (svc: string) => {
    const updatedPrices = { ...aiProfile.price_ranges };
    delete updatedPrices[svc];
    setAiProfile({
      ...aiProfile,
      services_offered: aiProfile.services_offered.filter((s) => s !== svc),
      price_ranges: updatedPrices,
    });
  };

  return (
    <div className={`space-y-6 ${activeTab === 'api-console' || activeTab === 'team-access' || activeTab === 'team-ai' || activeTab === 'image-templates' || activeTab === 'video-templates' || activeTab === 'camera-movements' ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-2 border-b border-white/10 pb-1">
        <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}>General</button>
        <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}><Bot className="w-4 h-4" /> AI Settings</button>
        <button onClick={() => setActiveTab('integrations')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'integrations' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}><Plug className="w-4 h-4" /> Integrations</button>
        <button onClick={() => setActiveTab('api-console')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'api-console' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}><Terminal className="w-4 h-4" /> API Console</button>
        <button onClick={() => setActiveTab('team-access')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'team-access' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}><Users className="w-4 h-4" /> Team Access</button>
        <button onClick={() => setActiveTab('team-ai')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'team-ai' ? 'bg-dark-700 text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}><Shield className="w-4 h-4" /> Team AI</button>
        <button onClick={() => setActiveTab('image-templates')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'image-templates' ? 'bg-dark-700 text-white border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-white'}`}><LayoutTemplate className="w-4 h-4" /> Image Templates</button>
        <button onClick={() => setActiveTab('video-templates')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'video-templates' ? 'bg-dark-700 text-white border-b-2 border-[#FF6B00]' : 'text-gray-400 hover:text-white'}`}><Film className="w-4 h-4" /> Video Templates</button>
        <button onClick={() => setActiveTab('camera-movements')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'camera-movements' ? 'bg-dark-700 text-white border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}><Camera className="w-4 h-4" /> Camera Movements</button>
      </div>

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {showWizard ? (
            <AISetupWizard onComplete={() => { setShowWizard(false); setKeysVersion((v) => v + 1); }} />
          ) : (
            <>
              <AIKeyCard key={keysVersion} onStatusChange={handleKeyStatusChange} />

              <AIAutoModeToggle onChange={setSmartAutoEnabled} />

              <AIModelSelector disabled={smartAutoEnabled} />

              <AIModelStatus key={`status-${keysVersion}`} />

              <AIUsageTracker />

              <AIQuickTest key={`test-${keysVersion}`} />

              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Business Profile for AI</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Business Name</label>
                      <input type="text" value={aiProfile.business_name} onChange={(e) => setAiProfile({ ...aiProfile, business_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="Your business name" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Owner Name</label>
                      <input type="text" value={aiProfile.owner_name} onChange={(e) => setAiProfile({ ...aiProfile, owner_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="Your name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City</label>
                    <input type="text" value={aiProfile.city} onChange={(e) => setAiProfile({ ...aiProfile, city: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="Your city" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">USP (Unique Selling Proposition)</label>
                    <textarea value={aiProfile.usp} onChange={(e) => setAiProfile({ ...aiProfile, usp: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="What makes your business unique..." />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Services Offered</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {aiProfile.services_offered.map((svc) => (
                        <span key={svc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-brand-600/20 border border-brand-500/30 text-brand-400">
                          {svc}
                          {aiProfile.price_ranges[svc] && (
                            <span className="text-[10px] text-gray-500 ml-1">({aiProfile.price_ranges[svc]})</span>
                          )}
                          <button onClick={() => removeService(svc)} className="ml-1 text-gray-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        placeholder="Service name..."
                        className="flex-1 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                        onKeyDown={(e) => e.key === 'Enter' && addService()}
                      />
                      <input
                        type="text"
                        value={newPriceRange}
                        onChange={(e) => setNewPriceRange(e.target.value)}
                        placeholder="Price range (optional)"
                        className="w-40 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                        onKeyDown={(e) => e.key === 'Enter' && addService()}
                      />
                      <button onClick={addService} className="px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Success Stories</h2>
                <div className="space-y-3">
                  {aiProfile.success_stories.map((story, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{story.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{story.description}</p>
                      </div>
                      <button onClick={() => setAiProfile({ ...aiProfile, success_stories: aiProfile.success_stories.filter((_, idx) => idx !== i) })} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <div className="space-y-2 pt-2">
                    <input type="text" placeholder="Story title" value={newStoryTitle} onChange={(e) => setNewStoryTitle(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500" />
                    <input type="text" placeholder="Story description" value={newStoryDesc} onChange={(e) => setNewStoryDesc(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500" />
                    <button onClick={() => { if (newStoryTitle) { setAiProfile({ ...aiProfile, success_stories: [...aiProfile.success_stories, { title: newStoryTitle, description: newStoryDesc }] }); setNewStoryTitle(''); setNewStoryDesc(''); } }} className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Story</button>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Testimonials</h2>
                <div className="space-y-3">
                  {aiProfile.testimonials.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 italic">"{t.text}"</p>
                      </div>
                      <button onClick={() => setAiProfile({ ...aiProfile, testimonials: aiProfile.testimonials.filter((_, idx) => idx !== i) })} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <div className="space-y-2 pt-2">
                    <input type="text" placeholder="Client name" value={newTestName} onChange={(e) => setNewTestName(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500" />
                    <input type="text" placeholder="Testimonial text" value={newTestText} onChange={(e) => setNewTestText(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500" />
                    <button onClick={() => { if (newTestName) { setAiProfile({ ...aiProfile, testimonials: [...aiProfile.testimonials, { name: newTestName, text: newTestText }] }); setNewTestName(''); setNewTestText(''); } }} className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Testimonial</button>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveAiSettings} disabled={savingAi} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {savingAi ? 'Saving...' : 'Save AI Settings'}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'general' && <>
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Business Logo</h2>
        <div className="flex items-center gap-5">
          {logoSignedUrl ? (
            <img src={logoSignedUrl} alt="Business Logo" className="w-20 h-20 rounded-xl object-contain bg-white p-2 border border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-dark-800 border border-dashed border-white/20 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-300 font-medium">Upload your business logo</p>
            <p className="text-xs text-gray-500 mt-0.5">This logo will appear on your invoices and quotations. JPG, PNG, WebP, or SVG. Max 2MB.</p>
          </div>
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploadingLogo ? 'Uploading...' : logoSignedUrl ? 'Change Logo' : 'Upload Logo'}
          </button>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PenLine className="w-5 h-5 text-gray-400" /> Signature</h2>
        <div className="flex items-center gap-5">
          {signSignedUrl ? (
            <div className="w-40 h-20 rounded-xl bg-white p-2 border border-white/10 flex items-center justify-center">
              <img src={signSignedUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-40 h-20 rounded-xl bg-dark-800 border border-dashed border-white/20 flex items-center justify-center">
              <PenLine className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-300 font-medium">Upload your signature</p>
            <p className="text-xs text-gray-500 mt-0.5">This will appear on invoices and quotations. JPG, PNG, or WebP. Max 2MB.</p>
          </div>
          <button
            onClick={() => signInputRef.current?.click()}
            disabled={uploadingSign}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploadingSign ? 'Uploading...' : signSignedUrl ? 'Change' : 'Upload'}
          </button>
          <input ref={signInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleSignUpload} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-gray-400" /> Bank Details</h2>
        <p className="text-xs text-gray-500 mb-4">These details can be shown on your invoices and quotations.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Account Holder Name</label>
              <input type="text" value={bankDetails.bank_account_name} onChange={(e) => setBankDetails({ ...bankDetails, bank_account_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g., John Doe" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bank Name</label>
              <input type="text" value={bankDetails.bank_name} onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g., State Bank of India" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Account Number</label>
              <input type="text" value={bankDetails.bank_account_number} onChange={(e) => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g., 1234567890" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">IFSC Code</label>
              <input type="text" value={bankDetails.bank_ifsc_code} onChange={(e) => setBankDetails({ ...bankDetails, bank_ifsc_code: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g., SBIN0001234" />
            </div>
          </div>
          <button onClick={handleSaveBank} disabled={savingBank} className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            {savingBank ? 'Saving...' : 'Save Bank Details'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Business Name</label>
            <input type="text" value={profile.business_name} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Owner Name</label>
            <input type="text" value={profile.owner_name} onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">GSTIN</label>
            <input type="text" value={profile.gstin} onChange={(e) => setProfile({ ...profile, gstin: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g., 22AAAAA0000A1Z5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone</label>
              <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Currency</label>
            <select value={profile.default_currency} onChange={(e) => setProfile({ ...profile, default_currency: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Budget Alerts</p>
              <p className="text-xs text-gray-500">Get notified when approaching budget limits</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, budget_alerts_enabled: !profile.budget_alerts_enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${profile.budget_alerts_enabled ? 'bg-brand-600' : 'bg-dark-500'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${profile.budget_alerts_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Theme</p>
            <div className="px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-gray-400 text-sm">Dark Mode (Default)</div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
        <Save className="w-5 h-5" />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <button onClick={exportAllData} className="w-full py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> Export All Data (JSON)
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 flex items-center justify-center gap-2">
            <Trash2 className="w-5 h-5" /> Clear All Data
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear All Data"
        message="This will permanently delete all your expenses, income, invoices, goals, and other data. This action cannot be undone."
        onConfirm={clearAllData}
        onCancel={() => setShowClearConfirm(false)}
      />
      </>}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Connect external services for AI Marketing Studio and SMM Agent.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationKeyCard
              name="kie_ai"
              title="Kie.ai API"
              description="Image & video generation, background removal, style transfer"
              placeholder="kie_..."
              icon="🎨"
              docsUrl="https://kie.ai"
              docsLabel="Get key at kie.ai"
            />
            <IntegrationKeyCard
              name="elevenlabs"
              title="ElevenLabs API"
              description="Text-to-speech, voice cloning, speech-to-speech"
              placeholder="xi_..."
              icon="🎙"
              docsUrl="https://elevenlabs.io/api"
              docsLabel="Get key at elevenlabs.io"
            />
            <IntegrationKeyCard
              name="meta"
              title="Meta / Facebook API"
              description="Instagram & Facebook publishing, analytics"
              placeholder="EAA..."
              icon="📱"
              docsUrl="https://developers.facebook.com/tools/explorer/"
              docsLabel="Get token from Meta Graph API Explorer"
            />
            <IntegrationKeyCard
              name="r2_access_key"
              title="Cloudflare R2 Access Key"
              description="S3-compatible cloud storage for media assets"
              placeholder="access_key_..."
              icon="☁"
              docsUrl="https://developers.cloudflare.com/r2/"
              docsLabel="Cloudflare R2 docs"
            />
            <IntegrationKeyCard
              name="r2_secret_key"
              title="Cloudflare R2 Secret Key"
              description="Secret key for R2 authentication"
              placeholder="secret_..."
              icon="🔐"
            />
            <IntegrationKeyCard
              name="r2_endpoint"
              title="R2 Endpoint URL"
              description="Your R2 bucket endpoint (e.g., https://account.r2.cloudflarestorage.com)"
              placeholder="https://..."
              icon="🌐"
            />
            <IntegrationKeyCard
              name="r2_bucket"
              title="R2 Bucket Name"
              description="The bucket name for storing media files"
              placeholder="myfinance-media"
              icon="📦"
            />
            <IntegrationKeyCard
              name="r2_public_url"
              title="R2 Public URL"
              description="Public URL prefix for accessing stored media"
              placeholder="https://pub-..."
              icon="🔗"
            />
          </div>
        </div>
      )}

      {activeTab === 'api-console' && (
        <div className="max-w-none -mx-0">
          <ApiConsole />
        </div>
      )}

      {activeTab === 'team-access' && (
        <TeamAccessManager />
      )}

      {activeTab === 'team-ai' && (
        <TeamAIControls />
      )}

      {activeTab === 'image-templates' && (
        <ImageTemplateManager />
      )}

      {activeTab === 'video-templates' && (
        <div className="glass-card rounded-xl p-6">
          <VideoTemplateManager />
        </div>
      )}

      {activeTab === 'camera-movements' && (
        <div className="glass-card rounded-xl p-6">
          <CameraMovementManager />
        </div>
      )}
    </div>
  );
}
