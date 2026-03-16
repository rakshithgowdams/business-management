import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Calendar, CheckCircle, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callAI, hasApiKey } from '../../../lib/ai/api';

interface DayPlan {
  day: number;
  date: string;
  contentType: string;
  caption: string;
  hashtags: string;
  notes: string;
}

interface Plan {
  id: string;
  title: string;
  plan_data: { days: DayPlan[] };
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function ContentPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('Professional');
  const [activePlan, setActivePlan] = useState<Plan | null>(null);

  const TONES = ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Educational', 'Persuasive'];

  useEffect(() => {
    if (user) loadPlans();
  }, [user]);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('content_plans')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setPlans((data as Plan[]) || []);
    setLoading(false);
  };

  const handleGenerate = async () => {
    const keyAvailable = await hasApiKey();
    if (!keyAvailable) {
      toast.error('Add your AI API key in Settings');
      return;
    }
    if (!niche.trim()) {
      toast.error('Describe your business niche');
      return;
    }

    setGenerating(true);
    const startDate = new Date();
    const prompt = `You are an expert social media strategist. Generate a 30-day Instagram content plan.

Business Niche: ${niche}
Tone: ${tone}
Starting Date: ${startDate.toISOString().split('T')[0]}

For each day, provide:
1. Content type (Image Post, Carousel, Reel, Story)
2. A brief caption idea (2-3 sentences)
3. 5 relevant hashtags
4. Any notes (best posting time, engagement strategy)

Mix content types: 40% Reels, 30% Carousels, 20% Image Posts, 10% Stories.
Include engagement posts (polls, questions, behind-the-scenes) every 3-4 days.

Return a JSON array of 30 objects with keys: day, date, contentType, caption, hashtags, notes.
Return ONLY the JSON array, no markdown or explanation.`;

    try {
      const res = await callAI(prompt, true, 'content_creation');
      if (res.error) {
        toast.error(res.error);
        setGenerating(false);
        return;
      }

      let days: DayPlan[] = [];
      if (Array.isArray(res.data)) {
        days = res.data as unknown as DayPlan[];
      } else if (res.data && typeof res.data === 'object') {
        const values = Object.values(res.data);
        if (Array.isArray(values[0])) {
          days = values[0] as unknown as DayPlan[];
        }
      }

      if (days.length === 0) {
        toast.error('Failed to generate plan');
        setGenerating(false);
        return;
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 29);

      const { data: saved, error } = await supabase.from('content_plans').insert({
        user_id: user!.id,
        title: `${niche} - ${tone} Plan`,
        plan_data: { days },
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'draft',
      }).select().maybeSingle();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('30-day plan generated');
        if (saved) setActivePlan(saved as Plan);
        await loadPlans();
      }
    } catch {
      toast.error('Plan generation failed');
    }
    setGenerating(false);
  };

  const handleDeletePlan = async (id: string) => {
    await supabase.from('content_plans').delete().eq('id', id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (activePlan?.id === id) setActivePlan(null);
    toast.success('Plan deleted');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FF6B00]" />
          AI 30-Day Content Planner
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Business / Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., AI services for Indian businesses, digital marketing agency..."
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tone === t ? 'gradient-orange text-white' : 'bg-dark-800 border border-white/10 text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !niche.trim()}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating 30-Day Plan...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate 30-Day Plan</>
            )}
          </button>
        </div>
      </div>

      {plans.length > 0 && !activePlan && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Plans</h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                <Calendar className="w-5 h-5 text-[#FF6B00] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{plan.title}</p>
                  <p className="text-[11px] text-gray-500">{plan.start_date} to {plan.end_date}</p>
                </div>
                <button
                  onClick={() => setActivePlan(plan)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium gradient-orange text-white"
                >
                  View
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePlan && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{activePlan.title}</h3>
              <p className="text-xs text-gray-500">{activePlan.start_date} to {activePlan.end_date}</p>
            </div>
            <button
              onClick={() => setActivePlan(null)}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white"
            >
              Back to List
            </button>
          </div>

          <div className="space-y-3">
            {(activePlan.plan_data?.days || []).map((day, i) => (
              <div key={i} className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center text-xs font-bold text-white">
                      {day.day || i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{day.date}</p>
                      <span className="text-[10px] font-bold text-[#FF6B00] uppercase">{day.contentType}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-2">{day.caption}</p>
                {day.hashtags && (
                  <p className="text-xs text-gray-500 mt-1">{day.hashtags}</p>
                )}
                {day.notes && (
                  <p className="text-[11px] text-gray-600 mt-1 italic">{day.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
