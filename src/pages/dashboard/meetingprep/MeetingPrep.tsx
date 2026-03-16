import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callGeminiFlash, parseJSON } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { formatDate } from '../../../lib/format';
import MeetingSetupForm, { type MeetingSetup } from './MeetingSetupForm';
import MeetingBrief, { type BriefData } from './MeetingBrief';

const LS_KEY = 'mfo_meeting_preps';

interface SavedPrep {
  id: string;
  clientName: string;
  meetingType: string;
  date: string;
  brief: BriefData;
  createdAt: string;
}

export default function MeetingPrep() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [currentSetup, setCurrentSetup] = useState<MeetingSetup | null>(null);
  const [genTime, setGenTime] = useState(0);
  const [pastPreps, setPastPreps] = useState<SavedPrep[]>([]);
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const briefRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setPastPreps(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('business_logo_url').eq('id', user.id).maybeSingle();
      if (profile?.business_logo_url) {
        const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(profile.business_logo_url, 3600);
        if (signed?.signedUrl) setLogoSignedUrl(signed.signedUrl);
      }
    })();
  }, [user]);

  const handleGenerate = async (setup: MeetingSetup) => {
    if (!user || !hasOpenRouterKey()) return;
    setGenerating(true);
    setBrief(null);
    setCurrentSetup(setup);
    const start = performance.now();

    try {
      const [clientRes, projectsRes, invoicesRes, interactionsRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', setup.clientId).maybeSingle(),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('client_interactions').select('*').eq('client_id', setup.clientId).order('interaction_date', { ascending: false }).limit(10),
      ]);

      const client = clientRes.data;
      const allProjects = projectsRes.data || [];
      const allInvoices = invoicesRes.data || [];
      const interactions = interactionsRes.data || [];

      const clientProjects = allProjects.filter((p: { client_name: string }) =>
        p.client_name?.toLowerCase().trim() === client?.full_name?.toLowerCase().trim() ||
        (client?.company_name && p.client_name?.toLowerCase().trim() === client.company_name.toLowerCase().trim())
      );

      const clientInvoices = allInvoices.filter((i: { to_client_name: string }) =>
        i.to_client_name?.toLowerCase().trim() === client?.full_name?.toLowerCase().trim() ||
        (client?.company_name && i.to_client_name?.toLowerCase().trim() === client.company_name.toLowerCase().trim())
      );

      const clientData = client ? `Name: ${client.full_name}, Company: ${client.company_name || 'N/A'}, Type: ${client.client_type}, Status: ${client.status}, Industry: ${client.industry_type || 'N/A'}, Location: ${[client.city, client.state].filter(Boolean).join(', ') || 'N/A'}, Source: ${client.source || 'N/A'}, Phone: ${client.primary_phone || 'N/A'}, Notes: ${client.internal_notes || 'None'}` : 'No client data';

      const projectData = clientProjects.length > 0
        ? clientProjects.map((p: { name: string; status: string; revenue: number; budget: number; category: string }) => `${p.name} (${p.status}, Revenue: ${p.revenue}, Budget: ${p.budget}, Category: ${p.category})`).join('; ')
        : 'No projects yet';

      const invoiceData = clientInvoices.length > 0
        ? clientInvoices.map((i: { invoice_number: string; total: number; status: string; due_date: string }) => `#${i.invoice_number}: INR ${i.total} (${i.status}, Due: ${i.due_date || 'N/A'})`).join('; ')
        : 'No invoices yet';

      const interactionData = interactions.length > 0
        ? interactions.map((i: { interaction_type: string; description: string; interaction_date: string }) => `${i.interaction_date}: ${i.interaction_type} — ${i.description}`).join('; ')
        : 'No recorded interactions';

      const prompt = `You are a sales coach for Rakshith, founder of MyDesignNexus (AI automation, web dev, call agents — Karnataka, India).

Client data: ${clientData}
Projects together: ${projectData}
Invoices: ${invoiceData}
Recent interactions: ${interactionData}
Meeting type: ${setup.meetingType}
Notes: ${setup.notes || 'None'}

Generate a complete meeting prep brief with:
1. CLIENT_SNAPSHOT: 3 bullet points about this client (array of strings)
2. RELATIONSHIP_STATUS: Current relationship health (string)
3. LAST_DISCUSSED: What was discussed/agreed before (string)
4. PAIN_POINTS: Their top 3 business pain points (array of strings)
5. BUYING_SIGNALS: Any signals they're ready to buy/expand (array of strings)
6. TALKING_POINTS: 4 specific things to discuss today (array of strings)
7. OBJECTIONS: 2 likely objections + how to handle each (array of {objection, handling})
8. CLOSE_STRATEGY: Best way to close/advance this meeting (string)
9. UPSELL_OPPORTUNITY: Best service to upsell this client (string)
10. DANGER_ZONE: One thing NOT to say/do in this meeting (string)
11. OPENING_LINE: Perfect opening line for this call (string)
12. SUCCESS_METRIC: How to know this meeting was successful (string)

Reply in JSON format only.`;

      const raw = await callGeminiFlash(prompt);
      const parsed = parseJSON<BriefData>(raw);
      if (!Array.isArray(parsed.CLIENT_SNAPSHOT)) parsed.CLIENT_SNAPSHOT = [String(parsed.CLIENT_SNAPSHOT)];
      if (!Array.isArray(parsed.PAIN_POINTS)) parsed.PAIN_POINTS = [String(parsed.PAIN_POINTS)];
      if (!Array.isArray(parsed.BUYING_SIGNALS)) parsed.BUYING_SIGNALS = [String(parsed.BUYING_SIGNALS)];
      if (!Array.isArray(parsed.TALKING_POINTS)) parsed.TALKING_POINTS = [String(parsed.TALKING_POINTS)];
      if (!Array.isArray(parsed.OBJECTIONS)) parsed.OBJECTIONS = [];
      setBrief(parsed);
      setGenTime(performance.now() - start);
    } catch (err) {
      console.error('Meeting prep error:', err);
    }
    setGenerating(false);
  };

  const handleSave = () => {
    if (!brief || !currentSetup) return;
    const entry: SavedPrep = {
      id: crypto.randomUUID(),
      clientName: currentSetup.clientName,
      meetingType: currentSetup.meetingType,
      date: currentSetup.date,
      brief,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...pastPreps].slice(0, 50);
    setPastPreps(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    const updated = pastPreps.filter((p) => p.id !== id);
    setPastPreps(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const handleLoadPrep = (prep: SavedPrep) => {
    setBrief(prep.brief);
    setCurrentSetup({ clientId: '', clientName: prep.clientName, meetingType: prep.meetingType, date: prep.date, time: '', notes: '' });
    setGenTime(0);
    setTimeout(() => {
      briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Meeting Prep</h1>
        <p className="text-sm text-gray-500 mt-1">Get fully briefed before every client call</p>
      </div>

      {!hasOpenRouterKey() ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">Add OpenRouter key in Settings to use AI features</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MeetingSetupForm onGenerate={handleGenerate} generating={generating} />
          {generating && (
            <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">AI is preparing your meeting brief...</p>
            </div>
          )}
          {brief && currentSetup && !generating && (
            <div ref={briefRef}>
              <MeetingBrief
                brief={brief}
                clientName={currentSetup.clientName}
                meetingType={currentSetup.meetingType}
                date={currentSetup.date}
                generationTime={genTime}
                onSave={handleSave}
                businessLogoUrl={logoSignedUrl || undefined}
              />
            </div>
          )}
        </div>
      )}

      {pastPreps.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Previous Meeting Preps</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-right py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pastPreps.map((prep) => (
                  <tr key={prep.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-gray-400">{formatDate(prep.date)}</td>
                    <td className="py-2.5 px-3 text-white">{prep.clientName}</td>
                    <td className="py-2.5 px-3 text-gray-400">{prep.meetingType}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleLoadPrep(prep)} className="px-3 py-1 rounded-lg text-xs text-brand-400 hover:bg-brand-500/10">View</button>
                        <button onClick={() => handleDelete(prep.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
