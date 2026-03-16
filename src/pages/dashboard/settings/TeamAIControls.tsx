import { useEffect, useState, useCallback } from 'react';
import { Bot, Shield, Zap, ChevronDown, ChevronUp, Loader2, Save, BarChart3, Cpu, Eye, EyeOff, CheckCircle, XCircle, Trash2, ExternalLink, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { MODELS, OPENROUTER_URL } from '../../../lib/ai/models';
import type { TeamMember } from '../../../lib/team/types';

interface AISettings {
  team_member_id: string;
  ai_enabled: boolean;
  daily_credit_limit: number;
  assigned_model: string;
}

interface CreditUsage {
  team_member_id: string;
  usage_date: string;
  credits_used: number;
  tokens_used: number;
  call_count: number;
}

const MODEL_OPTIONS = [
  { key: '', label: 'Any Model (No Restriction)', description: 'Member can use whichever model the system selects' },
  ...Object.values(MODELS).map(m => ({
    key: m.key,
    label: m.name,
    description: `${m.provider} - ${m.bestFor}`,
  })),
];

const CREDIT_PRESETS = [
  { label: '100', value: 100, desc: '~1M tokens' },
  { label: '250', value: 250, desc: '~2.5M tokens' },
  { label: '500', value: 500, desc: '~5M tokens' },
  { label: '1000', value: 1000, desc: '~10M tokens' },
  { label: '2500', value: 2500, desc: '~25M tokens' },
];

export default function TeamAIControls() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<Record<string, AISettings>>({});
  const [usage, setUsage] = useState<Record<string, CreditUsage>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    const [membersRes, settingsRes, usageRes] = await Promise.all([
      supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('team_ai_settings')
        .select('*')
        .eq('owner_id', user!.id),
      supabase
        .from('team_ai_credit_usage')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('usage_date', new Date().toISOString().split('T')[0]),
    ]);

    const membersList = (membersRes.data as TeamMember[]) || [];
    setMembers(membersList);

    const settingsMap: Record<string, AISettings> = {};
    for (const s of settingsRes.data || []) {
      settingsMap[s.team_member_id] = {
        team_member_id: s.team_member_id,
        ai_enabled: s.ai_enabled,
        daily_credit_limit: s.daily_credit_limit,
        assigned_model: s.assigned_model || '',
      };
    }

    for (const m of membersList) {
      if (!settingsMap[m.id]) {
        settingsMap[m.id] = {
          team_member_id: m.id,
          ai_enabled: false,
          daily_credit_limit: 500,
          assigned_model: '',
        };
      }
    }
    setSettings(settingsMap);

    const usageMap: Record<string, CreditUsage> = {};
    for (const u of usageRes.data || []) {
      usageMap[u.team_member_id] = u as CreditUsage;
    }
    setUsage(usageMap);

    setLoading(false);
  };

  const updateSetting = (memberId: string, key: keyof AISettings, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [key]: value },
    }));
  };

  const handleSave = async (memberId: string) => {
    const s = settings[memberId];
    if (!s) return;

    setSaving(memberId);

    const { data: existing } = await supabase
      .from('team_ai_settings')
      .select('id')
      .eq('team_member_id', memberId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('team_ai_settings')
        .update({
          ai_enabled: s.ai_enabled,
          daily_credit_limit: s.daily_credit_limit,
          assigned_model: s.assigned_model,
          updated_at: new Date().toISOString(),
        })
        .eq('team_member_id', memberId);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('AI settings saved');
      }
    } else {
      const { error } = await supabase
        .from('team_ai_settings')
        .insert({
          team_member_id: memberId,
          owner_id: user!.id,
          ai_enabled: s.ai_enabled,
          daily_credit_limit: s.daily_credit_limit,
          assigned_model: s.assigned_model,
        });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('AI settings saved');
      }
    }

    setSaving(null);
  };

  const toggleAll = async (enabled: boolean) => {
    for (const m of members) {
      updateSetting(m.id, 'ai_enabled', enabled);
    }

    for (const m of members) {
      const s = settings[m.id];
      if (!s) continue;

      const { data: existing } = await supabase
        .from('team_ai_settings')
        .select('id')
        .eq('team_member_id', m.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('team_ai_settings')
          .update({ ai_enabled: enabled, updated_at: new Date().toISOString() })
          .eq('team_member_id', m.id);
      } else {
        await supabase
          .from('team_ai_settings')
          .insert({
            team_member_id: m.id,
            owner_id: user!.id,
            ai_enabled: enabled,
            daily_credit_limit: s.daily_credit_limit,
            assigned_model: s.assigned_model,
          });
      }
    }

    toast.success(enabled ? 'AI enabled for all members' : 'AI disabled for all members');
  };

  const enabledCount = Object.values(settings).filter(s => s.ai_enabled).length;
  const totalCreditsToday = Object.values(usage).reduce((sum, u) => sum + u.credits_used, 0);
  const totalCallsToday = Object.values(usage).reduce((sum, u) => sum + u.call_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeamAPIKeyCard />

      {members.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Active Team Members</h3>
          <p className="text-sm text-gray-400">
            Add team members in the Team Access tab first, then configure their AI access here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{enabledCount}/{members.length}</p>
                  <p className="text-xs text-gray-400">AI Enabled</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalCreditsToday}</p>
                  <p className="text-xs text-gray-400">Credits Used Today</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalCallsToday}</p>
                  <p className="text-xs text-gray-400">AI Calls Today</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              1 credit = 10,000 tokens. Set daily limits to control AI spending per team member.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                Enable All
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                Disable All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {members.map(m => {
              const s = settings[m.id];
              const u = usage[m.id];
              const isExpanded = expanded === m.id;
              const creditsUsed = u?.credits_used || 0;
              const creditLimit = s?.daily_credit_limit || 500;
              const usagePercent = Math.min(100, Math.round((creditsUsed / creditLimit) * 100));
              const isManagement = m.role === 'management';
              const initials = m.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              const assignedModelName = s?.assigned_model
                ? (MODELS[s.assigned_model]?.name || 'Unknown')
                : 'Any';

              return (
                <div
                  key={m.id}
                  className={`glass-card rounded-xl overflow-hidden transition-all ${
                    s?.ai_enabled ? 'border-emerald-500/10' : 'border-white/5'
                  }`}
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : m.id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{m.full_name}</p>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          isManagement
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {m.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-500">{m.email}</span>
                        {s?.ai_enabled && (
                          <span className="text-[10px] text-gray-500">
                            {creditsUsed}/{creditLimit} credits | Model: {assignedModelName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {s?.ai_enabled && (
                        <div className="w-24 hidden sm:block">
                          <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-600 mt-0.5 text-center">{usagePercent}%</p>
                        </div>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateSetting(m.id, 'ai_enabled', !s?.ai_enabled);
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                          s?.ai_enabled ? 'bg-emerald-500' : 'bg-dark-500'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          s?.ai_enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" />
                          Daily Credit Limit
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {CREDIT_PRESETS.map(p => (
                            <button
                              key={p.value}
                              onClick={() => updateSetting(m.id, 'daily_credit_limit', p.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                s?.daily_credit_limit === p.value
                                  ? 'bg-brand-600/15 border-brand-500/30 text-brand-400'
                                  : 'border-white/10 text-gray-400 hover:border-white/20'
                              }`}
                            >
                              {p.label}
                              <span className="text-[10px] text-gray-600 ml-1">({p.desc})</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            value={s?.daily_credit_limit || 500}
                            onChange={e => updateSetting(m.id, 'daily_credit_limit', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-32 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                          />
                          <span className="text-xs text-gray-500">credits/day</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5" />
                          Assigned AI Model
                        </label>
                        <select
                          value={s?.assigned_model || ''}
                          onChange={e => updateSetting(m.id, 'assigned_model', e.target.value)}
                          className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                        >
                          {MODEL_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label} - {opt.description}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-gray-600 mt-1">
                          {s?.assigned_model
                            ? 'This member can only use the selected model.'
                            : 'No model restriction -- the system will pick the best model per task.'}
                        </p>
                      </div>

                      {u && (
                        <div className="p-3 bg-dark-800 rounded-lg border border-white/5">
                          <p className="text-xs font-medium text-gray-300 mb-2">Today's Usage</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-lg font-bold text-white">{u.credits_used}</p>
                              <p className="text-[10px] text-gray-500">Credits Used</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white">{(u.tokens_used / 1000).toFixed(0)}k</p>
                              <p className="text-[10px] text-gray-500">Tokens</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white">{u.call_count}</p>
                              <p className="text-[10px] text-gray-500">API Calls</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleSave(m.id)}
                        disabled={saving === m.id}
                        className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save AI Settings
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TeamAPIKeyCard() {
  const { session } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [keyInfo, setKeyInfo] = useState<{ has_key: boolean; key_hint: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
    'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }), [session?.access_token]);

  const loadKeyInfo = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingInfo(true);
    try {
      const res = await fetch(`${proxyUrl}?action=get-key-info`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setKeyInfo({ has_key: !!data.has_key, key_hint: data.key_hint || '' });
    } catch {
      setKeyInfo({ has_key: false, key_hint: '' });
    }
    setLoadingInfo(false);
  }, [session?.access_token]);

  useEffect(() => {
    loadKeyInfo();
  }, [loadKeyInfo]);

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key || key.length < 10) return;
    setSaving(true);
    try {
      const res = await fetch(`${proxyUrl}?action=save-key`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ api_key: key }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('API key saved to database');
        setKeyInput('');
        setShowKey(false);
        setTestStatus('idle');
        setResponseTime(null);
        await loadKeyInfo();
      }
    } catch {
      toast.error('Failed to save API key');
    }
    setSaving(false);
  };

  const handleRemoveKey = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`${proxyUrl}?action=delete-key`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('API key removed');
        setTestStatus('idle');
        setResponseTime(null);
        await loadKeyInfo();
      }
    } catch {
      toast.error('Failed to remove key');
    }
    setRemoving(false);
  };

  const handleTestKey = async () => {
    const keyToTest = keyInput.trim() || null;
    setTesting(true);
    setTestStatus('idle');
    setResponseTime(null);
    const start = performance.now();

    if (keyToTest && keyToTest.length >= 10 && !keyInfo?.has_key) {
      await handleSaveKey();
    }

    try {
      const res = await fetch(`${proxyUrl}?action=test-connection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      const data = await res.json();
      setTestStatus(data.success ? 'success' : 'error');
      if (data.success) {
        toast.success(`Connected in ${elapsed}ms`);
      } else {
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      setResponseTime(Math.round(performance.now() - start));
      setTestStatus('error');
      toast.error('Network error');
    }
    setTesting(false);
  };

  if (loadingInfo) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          <span className="text-sm text-gray-400">Loading API key status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Key className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white">Team AI -- OpenRouter API Key</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            This key powers AI for all your team members. Save it here so employees and management can use the AI Assistant.
          </p>
        </div>
        {keyInfo?.has_key && (
          <div className="shrink-0">
            {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {testStatus === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {testStatus === 'idle' && <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />}
          </div>
        )}
      </div>

      {keyInfo?.has_key ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 rounded-xl border border-white/5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-gray-300 flex-1 font-mono">
              sk-or-••••••••{keyInfo.key_hint}
            </span>
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Test
            </button>
            <button
              onClick={handleRemoveKey}
              disabled={removing}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {testStatus === 'success' && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}
          {testStatus === 'error' && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Connection failed
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}

          <div className="border-t border-white/5 pt-3">
            <p className="text-[11px] text-gray-600 mb-2">Replace key:</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {keyInput.trim().length >= 10 && (
                <button
                  onClick={handleSaveKey}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl gradient-orange text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
            <p className="text-xs text-amber-400">
              No API key configured. Your team members will not be able to use AI features until you add a key.
            </p>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveKey}
              disabled={!keyInput.trim() || keyInput.trim().length < 10 || saving}
              className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Key
            </button>
            <button
              onClick={handleTestKey}
              disabled={!keyInput.trim() || keyInput.trim().length < 10 || testing}
              className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-50 flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Test Connection
            </button>
          </div>

          {testStatus === 'success' && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}
          {testStatus === 'error' && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Connection failed
              {responseTime && <span className="text-gray-500 ml-1">{responseTime}ms</span>}
            </p>
          )}

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
          >
            Get your key at openrouter.ai/keys <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
