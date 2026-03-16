import { useState, useEffect, useCallback } from 'react';
import { Loader2, Phone, MessageCircle, Mail, FolderKanban, Brain, Star, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { callGeminiFlash, parseJSON } from '../../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../../lib/ai/models';
import { formatINR, formatDate } from '../../../../lib/format';
import type { Client, ClientInteraction } from '../../../../lib/clients/types';
import toast from 'react-hot-toast';

const LS_SCORES = 'mfo_client_scores';
const LS_SATISFACTION = 'mfo_client_satisfaction';

interface RelationshipScore {
  payment: number;
  frequency: number;
  referrals: number;
  engagement: number;
  revenue: number;
  satisfaction: number;
  total: number;
}

interface AIRelInsight {
  RELATIONSHIP_HEALTH: string;
  RISK_FACTOR: string;
  OPPORTUNITY: string;
  NEXT_ACTION: string;
  IDEAL_CONTACT_TIME: string;
  RELATIONSHIP_GOAL: string;
}

interface TimelineEntry {
  date: string;
  icon: string;
  label: string;
  detail: string;
}

interface Props {
  client: Client;
  interactions: ClientInteraction[];
  onRefresh: () => void;
}

function getScoreLabel(score: number) {
  if (score >= 9) return { label: 'Champion', color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'stroke-blue-400' };
  if (score >= 7) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'stroke-emerald-400' };
  if (score >= 5) return { label: 'Neutral', color: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'stroke-yellow-400' };
  return { label: 'At Risk', color: 'text-red-400', bg: 'bg-red-500/10', ring: 'stroke-red-400' };
}

export default function ClientRelationshipTab({ client, interactions, onRefresh }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState<RelationshipScore | null>(null);
  const [aiInsight, setAiInsight] = useState<AIRelInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [satisfaction, setSatisfaction] = useState<string>('Satisfied');
  const [logType, setLogType] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_SATISFACTION);
    if (saved) {
      const map = JSON.parse(saved);
      if (map[client.id]) setSatisfaction(map[client.id]);
    }
  }, [client.id]);

  const saveSatisfaction = (val: string) => {
    setSatisfaction(val);
    const saved = JSON.parse(localStorage.getItem(LS_SATISFACTION) || '{}');
    saved[client.id] = val;
    localStorage.setItem(LS_SATISFACTION, JSON.stringify(saved));
  };

  const calculateScore = useCallback(async () => {
    if (!user) return;

    const [projectsRes, invoicesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
    ]);

    const projects = (projectsRes.data || []).filter((p: { client_name: string }) =>
      p.client_name?.toLowerCase().trim() === client.full_name.toLowerCase().trim() ||
      (client.company_name && p.client_name?.toLowerCase().trim() === client.company_name.toLowerCase().trim())
    );

    const invoices = (invoicesRes.data || []).filter((i: { to_client_name: string }) =>
      i.to_client_name?.toLowerCase().trim() === client.full_name.toLowerCase().trim() ||
      (client.company_name && i.to_client_name?.toLowerCase().trim() === client.company_name.toLowerCase().trim())
    );

    const paidInvoices = invoices.filter((i: { status: string }) => i.status === 'paid');
    const overdueInvoices = invoices.filter((i: { status: string; due_date: string }) =>
      i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()
    );
    let payment = 2;
    if (overdueInvoices.length > 0) payment = 0;
    else if (paidInvoices.length < invoices.length && invoices.length > 0) payment = 1;

    let frequency = 0;
    if (projects.length >= 3) frequency = 2;
    else if (projects.length >= 2) frequency = 1.5;
    else if (projects.length === 1) frequency = 0.5;

    const referrals = 0;

    const now = new Date();
    const lastInteraction = interactions[0];
    let engagement = 0;
    if (lastInteraction) {
      const daysSince = Math.floor((now.getTime() - new Date(lastInteraction.interaction_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince <= 7) engagement = 2;
      else if (daysSince <= 30) engagement = 1;
    }

    const totalRevenue = invoices.reduce((s: number, i: { total: number }) => s + Number(i.total || 0), 0);
    let revenueScore = 0.5;
    if (totalRevenue >= 100000) revenueScore = 1;
    else if (totalRevenue >= 50000) revenueScore = 0.7;

    let satScore = 0.5;
    if (satisfaction === 'Satisfied') satScore = 1;
    else if (satisfaction === 'Neutral') satScore = 0.5;
    else satScore = 0;

    const total = parseFloat((payment + frequency + referrals + engagement + revenueScore + satScore).toFixed(1));
    const result: RelationshipScore = { payment, frequency, referrals, engagement, revenue: revenueScore, satisfaction: satScore, total };
    setScore(result);

    const saved = JSON.parse(localStorage.getItem(LS_SCORES) || '{}');
    saved[client.id] = { score: total, date: now.toISOString() };
    localStorage.setItem(LS_SCORES, JSON.stringify(saved));

    const entries: TimelineEntry[] = [];
    entries.push({ date: client.created_at, icon: '\uD83D\uDCC5', label: 'Client Added', detail: `${client.full_name} added as ${client.client_type}` });

    projects.forEach((p: { start_date: string; name: string; status: string; end_date: string; revenue: number }) => {
      if (p.start_date) entries.push({ date: p.start_date, icon: '\uD83D\uDCCB', label: 'Project Started', detail: p.name });
      if (p.status === 'Completed' && p.end_date) entries.push({ date: p.end_date, icon: '\u2705', label: 'Project Delivered', detail: `${p.name} — ${formatINR(Number(p.revenue || 0))}` });
    });

    paidInvoices.forEach((i: { updated_at: string; invoice_number: string; total: number }) => {
      entries.push({ date: i.updated_at || '', icon: '\uD83D\uDCB0', label: 'Invoice Paid', detail: `#${i.invoice_number} — ${formatINR(Number(i.total))}` });
    });

    interactions.forEach((i) => {
      entries.push({ date: i.interaction_date, icon: '\uD83D\uDCDE', label: i.interaction_type, detail: i.description });
    });

    if (lastInteraction) {
      const daysSince = Math.floor((now.getTime() - new Date(lastInteraction.interaction_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 14) {
        entries.push({ date: now.toISOString(), icon: '\u26A0\uFE0F', label: 'Getting Cold', detail: `Last contact ${daysSince} days ago` });
      }
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(entries);
  }, [user, client, interactions, satisfaction]);

  useEffect(() => { calculateScore(); }, [calculateScore]);

  const fetchAI = async () => {
    if (!score || !hasOpenRouterKey()) return;
    setAiLoading(true);
    try {
      const lastContact = interactions[0] ? `${Math.floor((Date.now() - new Date(interactions[0].interaction_date).getTime()) / (1000 * 60 * 60 * 24))} days ago` : 'Unknown';
      const prompt = `Analyze the business relationship with this client for MyDesignNexus (Karnataka AI automation company):
Client: ${client.full_name}, Company: ${client.company_name || 'N/A'}, Type: ${client.client_type}, Status: ${client.status}, Industry: ${client.industry_type || 'N/A'}
Relationship Score: ${score.total}/10 (Payment: ${score.payment}/2, Projects: ${score.frequency}/2, Referrals: ${score.referrals}/2, Engagement: ${score.engagement}/2, Revenue: ${score.revenue}/1, Satisfaction: ${score.satisfaction}/1)
Last contact: ${lastContact}
Interactions: ${interactions.length} recorded

Provide:
1. RELATIONSHIP_HEALTH: One sentence on relationship status
2. RISK_FACTOR: Biggest risk in this relationship
3. OPPORTUNITY: Best upsell/expansion opportunity
4. NEXT_ACTION: Most important action to take THIS WEEK
5. IDEAL_CONTACT_TIME: Best time/day to reach this client
6. RELATIONSHIP_GOAL: Goal for this client in 90 days
Reply JSON only.`;

      const raw = await callGeminiFlash(prompt);
      const parsed = parseJSON<AIRelInsight>(raw);
      setAiInsight(parsed);
    } catch {
      setAiInsight(null);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (score) fetchAI();
  }, [score]);

  const handleLogInteraction = async () => {
    if (!user || !logType || !logNote.trim()) return;
    setLogging(true);
    await supabase.from('client_interactions').insert({
      client_id: client.id,
      user_id: user.id,
      interaction_type: logType,
      description: logNote,
      interaction_date: new Date().toISOString(),
    });
    setLogType('');
    setLogNote('');
    setLogging(false);
    toast.success('Interaction logged');
    onRefresh();
  };

  if (!score) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const info = getScoreLabel(score.total);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.total / 10) * circumference;

  const factors = [
    { label: 'Payment Behavior', score: score.payment, max: 2, icon: '\uD83D\uDCB3' },
    { label: 'Project Frequency', score: score.frequency, max: 2, icon: '\uD83D\uDD04' },
    { label: 'Referrals Given', score: score.referrals, max: 2, icon: '\uD83D\uDC4B' },
    { label: 'Engagement Level', score: score.engagement, max: 2, icon: '\uD83D\uDCDE' },
    { label: 'Revenue Generated', score: score.revenue, max: 1, icon: '\uD83D\uDCB0' },
    { label: 'Satisfaction', score: score.satisfaction, max: 1, icon: '\u2B50' },
  ];

  const insightCards = aiInsight ? [
    { key: 'RELATIONSHIP_HEALTH', label: 'Relationship Health', border: 'border-white/10', value: aiInsight.RELATIONSHIP_HEALTH },
    { key: 'RISK_FACTOR', label: 'Risk Factor', border: 'border-red-500/20', value: aiInsight.RISK_FACTOR },
    { key: 'OPPORTUNITY', label: 'Upsell Opportunity', border: 'border-orange-500/20', value: aiInsight.OPPORTUNITY },
    { key: 'NEXT_ACTION', label: 'Next Action This Week', border: 'border-emerald-500/20', value: aiInsight.NEXT_ACTION },
    { key: 'IDEAL_CONTACT_TIME', label: 'Best Time to Contact', border: 'border-blue-500/20', value: aiInsight.IDEAL_CONTACT_TIME },
    { key: 'RELATIONSHIP_GOAL', label: '90-Day Goal', border: 'border-yellow-500/20', value: aiInsight.RELATIONSHIP_GOAL },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center shrink-0">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#1f1f1f" strokeWidth="8" />
              <circle
                cx="70" cy="70" r={radius} fill="none"
                className={info.ring} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${info.color}`}>{score.total}</span>
              <span className="text-xs text-gray-500">/10</span>
            </div>
          </div>
          <span className={`text-sm font-semibold mt-2 ${info.color}`}>{info.label}</span>
          <p className="text-gray-400 text-sm mt-1">{client.full_name}</p>
        </div>

        <div className="flex-1 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            {factors.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{f.icon} {f.label}</span>
                  <span className="text-xs font-medium text-gray-300">{f.score}/{f.max}</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] transition-all duration-500"
                    style={{ width: `${(f.score / f.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-xs text-gray-500 mb-1 block">Client Satisfaction</label>
            <div className="flex gap-2">
              {['Satisfied', 'Neutral', 'Unhappy'].map((val) => (
                <button
                  key={val}
                  onClick={() => saveSatisfaction(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    satisfaction === val
                      ? val === 'Satisfied' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : val === 'Neutral' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-white/5 text-gray-500 hover:border-white/10'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasOpenRouterKey() && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">AI Relationship Intelligence</h3>
            <button onClick={fetchAI} disabled={aiLoading} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 disabled:opacity-50">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
          {aiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card rounded-xl p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : insightCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insightCards.map((card) => (
                <div key={card.key} className={`glass-card rounded-xl p-4 border ${card.border}`}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{card.label}</p>
                  <p className="text-sm text-gray-200">{card.value}</p>
                </div>
              ))}
              <div className="col-span-full flex justify-end">
                <span className="text-[10px] text-gray-600 bg-dark-700 px-2 py-1 rounded-full">Powered by Gemini 2.5 Flash</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {timeline.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Relationship Timeline</h3>
          <div className="space-y-0">
            {timeline.slice(0, 15).map((entry, i) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <span className="text-sm">{entry.icon}</span>
                  {i < timeline.length - 1 && <div className="w-px h-full bg-white/5 min-h-[24px]" />}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                  <p className="text-sm text-white">{entry.label}</p>
                  <p className="text-xs text-gray-400 truncate">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {client.primary_phone && (
            <a href={`tel:${client.primary_phone}`} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
          {(client.whatsapp_number || client.primary_phone) && (
            <a href={`https://wa.me/${(client.whatsapp_number || client.primary_phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {client.primary_email && (
            <a href={`mailto:${client.primary_email}`} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
          <button onClick={() => navigate('/dashboard/projects/new')} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2">
            <FolderKanban className="w-4 h-4" /> New Project
          </button>
          <button onClick={() => navigate(`/dashboard/ai-intelligence?clientId=${client.id}`)} className="px-4 py-2 rounded-xl border border-brand-500/30 hover:bg-brand-500/5 text-sm text-brand-400 flex items-center gap-2">
            <Brain className="w-4 h-4" /> AI Analysis
          </button>
          <button onClick={() => navigate(`/dashboard/meeting-prep`)} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-2">
            <Star className="w-4 h-4" /> Meeting Prep
          </button>
        </div>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <h4 className="text-xs text-gray-500">Log Interaction</h4>
          <div className="flex flex-wrap gap-2">
            {['Call', 'Meeting', 'Email', 'WhatsApp', 'Note'].map((type) => (
              <button
                key={type}
                onClick={() => setLogType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  logType === type ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-white/5 text-gray-500 hover:border-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {logType && (
            <div className="flex gap-2">
              <input
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder={`What happened in this ${logType.toLowerCase()}?`}
                className="flex-1 px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleLogInteraction}
                disabled={!logNote.trim() || logging}
                className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold disabled:opacity-50"
              >
                {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
