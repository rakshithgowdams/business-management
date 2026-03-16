import { useState } from 'react';
import {
  Loader2, Sparkles, Save, RefreshCw, ChevronDown, ChevronUp,
  Target, TrendingUp, Users, Calendar, Lightbulb, BarChart2,
  MessageSquare, Zap, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { callAI } from '../../../../lib/ai/api';

const INDUSTRIES = [
  { key: 'ecommerce', label: 'E-Commerce' },
  { key: 'saas', label: 'SaaS / Tech' },
  { key: 'beauty', label: 'Beauty / Skincare' },
  { key: 'fitness', label: 'Fitness / Wellness' },
  { key: 'food', label: 'Food & Beverage' },
  { key: 'fashion', label: 'Fashion / Apparel' },
  { key: 'finance', label: 'Finance / Fintech' },
  { key: 'education', label: 'Education / Courses' },
  { key: 'realestate', label: 'Real Estate' },
  { key: 'travel', label: 'Travel & Hospitality' },
  { key: 'healthcare', label: 'Healthcare / MedTech' },
  { key: 'agency', label: 'Agency / Services' },
];

const GOALS = [
  { key: 'sales', label: 'Increase Sales', icon: '🛒' },
  { key: 'awareness', label: 'Build Awareness', icon: '👁️' },
  { key: 'leads', label: 'Generate Leads', icon: '📞' },
  { key: 'retention', label: 'Improve Retention', icon: '🔄' },
  { key: 'launch', label: 'Product Launch', icon: '🚀' },
  { key: 'community', label: 'Community Growth', icon: '👥' },
];

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'X (Twitter)' },
];

const TIMEFRAMES = [
  { key: '30_days', label: '30 Days' },
  { key: '60_days', label: '60 Days' },
  { key: '90_days', label: '90 Days' },
  { key: '6_months', label: '6 Months' },
];

interface StrategySection {
  title: string;
  icon: React.ReactNode;
  content: string;
  expanded: boolean;
}

interface StrategyResult {
  id: string;
  sections: StrategySection[];
  raw: string;
  saved: boolean;
}

function parseStrategyIntoSections(raw: string, iconMap: Record<string, React.ReactNode>): StrategySection[] {
  const sectionPatterns = [
    { pattern: /EXECUTIVE SUMMARY|OVERVIEW/i, key: 'overview', icon: iconMap.overview },
    { pattern: /MARKET ANALYSIS|COMPETITIVE|COMPETITOR/i, key: 'market', icon: iconMap.market },
    { pattern: /TARGET AUDIENCE|AUDIENCE PROFILE/i, key: 'audience', icon: iconMap.audience },
    { pattern: /CONTENT PILLARS|CONTENT THEMES/i, key: 'pillars', icon: iconMap.pillars },
    { pattern: /AD FORMATS|CREATIVE FORMATS/i, key: 'formats', icon: iconMap.formats },
    { pattern: /CONTENT CALENDAR|POSTING SCHEDULE/i, key: 'calendar', icon: iconMap.calendar },
    { pattern: /COPY ANGLES|MESSAGE FRAMEWORK|HOOKS/i, key: 'copy', icon: iconMap.copy },
    { pattern: /KPIs|METRICS|PERFORMANCE/i, key: 'kpis', icon: iconMap.kpis },
    { pattern: /BUDGET|SPEND ALLOCATION/i, key: 'budget', icon: iconMap.budget },
    { pattern: /QUICK WINS|IMMEDIATE ACTIONS/i, key: 'wins', icon: iconMap.wins },
  ];

  const lines = raw.split('\n');
  const sections: StrategySection[] = [];
  let currentSection: { title: string; key: string; icon: React.ReactNode; lines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { if (currentSection) currentSection.lines.push(''); continue; }

    const isSectionHeader = sectionPatterns.some((p) => p.pattern.test(trimmed)) && (trimmed.startsWith('#') || trimmed === trimmed.toUpperCase().replace(/[^A-Z\s&/]/g, '') || /^#{1,3}\s/.test(trimmed));
    const matchedSection = sectionPatterns.find((p) => p.pattern.test(trimmed));

    if (matchedSection && (trimmed.length < 80)) {
      if (currentSection && currentSection.lines.join('\n').trim()) {
        sections.push({ title: currentSection.title, icon: currentSection.icon, content: currentSection.lines.join('\n').trim(), expanded: sections.length < 2 });
      }
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/^\*+|\*+$/g, '').trim();
      currentSection = { title: cleanTitle, key: matchedSection.key, icon: matchedSection.icon, lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  if (currentSection && currentSection.lines.join('\n').trim()) {
    sections.push({ title: currentSection.title, icon: currentSection.icon, content: currentSection.lines.join('\n').trim(), expanded: sections.length < 2 });
  }

  if (sections.length === 0) {
    return [{ title: 'Content Strategy', icon: iconMap.overview, content: raw, expanded: true }];
  }

  return sections;
}

export default function ContentStrategy() {
  const { user } = useAuth();

  const [brief, setBrief] = useState('');
  const [industry, setIndustry] = useState('ecommerce');
  const [goals, setGoals] = useState<string[]>(['sales']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [timeframe, setTimeframe] = useState('90_days');
  const [competitors, setCompetitors] = useState('');
  const [budget, setBudget] = useState('');
  const [audienceNotes, setAudienceNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [progress, setProgress] = useState('');

  const toggleGoal = (key: string) => {
    setGoals((prev) => prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]);
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);
  };

  const toggleSection = (index: number) => {
    if (!result) return;
    setResult((prev) => prev ? {
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s),
    } : null);
  };

  const iconMap: Record<string, React.ReactNode> = {
    overview: <Target className="w-4 h-4" />,
    market: <TrendingUp className="w-4 h-4" />,
    audience: <Users className="w-4 h-4" />,
    pillars: <Lightbulb className="w-4 h-4" />,
    formats: <Sparkles className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    copy: <MessageSquare className="w-4 h-4" />,
    kpis: <BarChart2 className="w-4 h-4" />,
    budget: <BarChart2 className="w-4 h-4" />,
    wins: <Zap className="w-4 h-4" />,
  };

  const handleGenerate = async () => {
    if (!brief.trim()) { toast.error('Describe your business or product'); return; }
    if (goals.length === 0) { toast.error('Select at least one campaign goal'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform'); return; }

    setGenerating(true);
    setResult(null);
    setProgress('Claude Sonnet 4.6 researching your market...');

    const ind = INDUSTRIES.find((i) => i.key === industry)!;
    const tf = TIMEFRAMES.find((t) => t.key === timeframe)!;
    const goalsText = goals.map((g) => GOALS.find((x) => x.key === g)?.label).join(', ');
    const platformsText = selectedPlatforms.map((p) => PLATFORMS.find((x) => x.key === p)?.label).join(', ');

    const prompt = `You are a world-class performance marketing strategist and content director with 15+ years of experience running multi-million dollar ad campaigns. You specialize in paid social media advertising, UGC strategy, and carousel ad content for direct-to-consumer brands.

Generate a comprehensive, highly actionable ${tf.label} content and ad strategy for the following business:

BUSINESS BRIEF: ${brief}
INDUSTRY: ${ind.label}
CAMPAIGN GOALS: ${goalsText}
TARGET PLATFORMS: ${platformsText}
TIMEFRAME: ${tf.label}
${competitors ? `COMPETITORS TO RESEARCH: ${competitors}` : ''}
${budget ? `MONTHLY AD BUDGET: ${budget}` : ''}
${audienceNotes ? `AUDIENCE NOTES: ${audienceNotes}` : ''}

Deliver a COMPLETE, SPECIFIC, ACTIONABLE strategy with the following sections:

## EXECUTIVE SUMMARY
2-3 sentence strategic overview. The #1 insight that will drive this campaign's success.

## MARKET ANALYSIS
- Current market landscape for ${ind.label}
- Key trends and opportunities to exploit RIGHT NOW
- Competitive gaps to fill
- What is working in this vertical (specific tactics with examples)
${competitors ? `- Analysis of mentioned competitors: positioning weaknesses to exploit` : ''}

## TARGET AUDIENCE PROFILE
- Primary persona (name it, e.g., "The Ambitious Sarah"): demographics, psychographics, pain points, aspirations
- Secondary persona if applicable
- Platform behavior: when they scroll, what stops them, what makes them buy
- Exact emotional triggers for this audience

## CONTENT PILLARS
5 strategic content pillars with:
- Pillar name and purpose
- % of content mix recommended
- 3 specific content ideas per pillar
- Best performing formats for each pillar

## AD FORMATS & CREATIVE STRATEGY
For each selected platform (${platformsText}):
- Top 3 ad formats to use (carousel, UGC, static, video, etc.)
- Specific creative recommendations with hooks
- Image/video specifications
- A/B testing recommendations

## CONTENT CALENDAR (${tf.label})
- Week-by-week content cadence for first 4 weeks
- Posting frequency per platform
- Content mix ratio (organic vs paid)
- Key campaign phases and milestones

## COPY ANGLES & HOOKS
10 proven ad copy hooks specific to this business and audience:
- Hook 1-3: Pain point angles
- Hook 4-6: Aspiration/outcome angles
- Hook 7-8: Social proof angles
- Hook 9-10: Curiosity/pattern interrupt angles

Include 3 full ad copy examples (headline + primary text + CTA)

## KPIs & PERFORMANCE TARGETS
Platform-specific KPIs with realistic benchmarks:
- CTR targets per platform and ad type
- CPM/CPC benchmarks for ${ind.label}
- ROAS targets by phase
- Engagement rate benchmarks
- Conversion rate targets

## QUICK WINS (First 30 Days)
5 immediate action items ranked by impact-to-effort ratio. What to do in the first week to see results fast.

Be EXTREMELY SPECIFIC. Use real numbers, real hook formulas, real posting times, real benchmarks. No generic advice. This strategy should be immediately executable.`;

    try {
      setProgress('Analyzing market landscape and audience...');
      const response = await callAI(prompt, true, 'content_creation');
      setProgress('Structuring your strategy...');

      if (response.error) {
        toast.error(`Strategy generation failed: ${response.error}`);
        return;
      }

      const raw = typeof response.data === 'string' ? response.data :
        (response.data as Record<string, unknown>)?.response as string ||
        (response.data as Record<string, unknown>)?.content as string || '';

      const sections = parseStrategyIntoSections(raw, iconMap);

      const strategyResult: StrategyResult = {
        id: crypto.randomUUID(),
        sections,
        raw,
        saved: false,
      };

      setResult(strategyResult);
      toast.success('Content strategy generated!');
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    try {
      const ind = INDUSTRIES.find((i) => i.key === industry)!;
      const goalsText = goals.map((g) => GOALS.find((x) => x.key === g)?.label).join(', ');
      const platformsText = selectedPlatforms.join(', ');
      const tf = TIMEFRAMES.find((t) => t.key === timeframe)!;

      await supabase.from('ads_generator_history').insert({
        user_id: user.id,
        type: 'content_strategy',
        title: `${ind.label} Strategy — ${brief.slice(0, 50)}`,
        brief, platform: platformsText, objective: goalsText,
        style: 'content_strategy', prompt: '',
        strategy_content: { sections: result.sections.map((s) => ({ title: s.title, content: s.content })), raw: result.raw },
        result_urls: [], slide_count: 0, duration: 0,
        aspect_ratio: '', model_used: 'claude-sonnet-4-6',
        metadata: { industry, goals, selectedPlatforms, timeframe, competitors, budget, audienceNotes },
      });

      setResult((prev) => prev ? { ...prev, saved: true } : null);
      toast.success('Strategy saved to history!');
    } catch {
      toast.error('Failed to save strategy');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Content Strategy · Claude Sonnet 4.6</p>
            <p className="text-[10px] text-gray-500">Deep market research · Actionable frameworks · Platform-specific tactics</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Sparkles className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[9px] font-bold text-blue-400">CLAUDE</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Business Brief</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
            placeholder="Describe your business, product, unique value proposition, current situation, and what you're trying to achieve..."
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/60 resize-none placeholder-gray-600" />
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Industry</label>
          <div className="grid grid-cols-2 gap-1.5">
            {INDUSTRIES.map((i) => (
              <button key={i.key} onClick={() => setIndustry(i.key)}
                className={`px-3 py-2 rounded-xl border text-left text-[10px] font-semibold transition-all ${industry === i.key ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Campaign Goals</label>
          <div className="grid grid-cols-2 gap-1.5">
            {GOALS.map((g) => (
              <button key={g.key} onClick={() => toggleGoal(g.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${goals.includes(g.key) ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                <span className="text-base leading-none">{g.icon}</span>
                <span className="text-[10px] font-semibold">{g.label}</span>
                {goals.includes(g.key) && <Check className="w-3 h-3 text-blue-400 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Target Platforms</label>
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => (
              <button key={p.key} onClick={() => togglePlatform(p.key)}
                className={`px-2 py-2 rounded-xl border text-center transition-all ${selectedPlatforms.includes(p.key) ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                <p className="text-[10px] font-semibold">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Timeframe</label>
          <div className="grid grid-cols-2 gap-1.5">
            {TIMEFRAMES.map((t) => (
              <button key={t.key} onClick={() => setTimeframe(t.key)}
                className={`py-2 rounded-xl border text-center transition-all ${timeframe === t.key ? 'bg-blue-500/10 border-blue-500/40 text-white' : 'bg-dark-800 border-white/5 text-gray-400 hover:text-white'}`}>
                <p className="text-xs font-semibold">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Optional Research Inputs</label>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Competitors (brand names)</label>
            <input type="text" value={competitors} onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Brand A, Brand B, Brand C"
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Monthly Ad Budget</label>
            <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)}
              placeholder="$5,000 / month"
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Target Audience Notes</label>
            <input type="text" value={audienceNotes} onChange={(e) => setAudienceNotes(e.target.value)}
              placeholder="Women 25-45, health-conscious, urban professionals..."
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500/60" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating || !brief.trim() || goals.length === 0 || selectedPlatforms.length === 0}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.99]">
          {generating
            ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">{progress || 'Researching...'}</span></>
            : <><Sparkles className="w-5 h-5" /> Generate Strategy with Claude</>}
        </button>
      </div>

      <div className="xl:col-span-3 space-y-4">
        {result ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Content Strategy Report</h3>
                  <p className="text-[10px] text-gray-500">Powered by Claude Sonnet 4.6</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleGenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white text-xs transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                <button onClick={handleSave} disabled={result.saved}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${result.saved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}>
                  {result.saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save to History</>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {result.sections.map((section, i) => (
                <div key={i} className="glass-card rounded-xl overflow-hidden border border-white/5">
                  <button onClick={() => toggleSection(i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        {section.icon}
                      </div>
                      <span className="text-sm font-semibold text-white">{section.title}</span>
                    </div>
                    {section.expanded
                      ? <ChevronUp className="w-4 h-4 text-gray-500" />
                      : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {section.expanded && (
                    <div className="px-4 pb-4">
                      <div className="pt-1 border-t border-white/5">
                        <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{section.content}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : generating ? (
          <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center min-h-80">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            </div>
            <p className="text-white text-sm font-semibold mb-1">Claude is researching...</p>
            <p className="text-xs text-gray-500 mb-4 text-center max-w-[240px]">{progress}</p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <Sparkles className="w-3 h-3 text-blue-400/60" />
              <span className="text-[10px] text-blue-400/60">Claude Sonnet 4.6 · Deep market analysis</span>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center min-h-80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-blue-400/40" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Your strategy will appear here</p>
            <p className="text-xs text-gray-600 mt-1 max-w-[260px]">Claude Sonnet 4.6 will research your market, analyze competitors, and build a complete actionable strategy</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-dark-800 border border-white/5">
                <TrendingUp className="w-3 h-3 text-blue-400/50" /> Market analysis
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-dark-800 border border-white/5">
                <Users className="w-3 h-3 text-blue-400/50" /> Audience profiling
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-dark-800 border border-white/5">
                <Calendar className="w-3 h-3 text-blue-400/50" /> Content calendar
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-dark-800 border border-white/5">
                <BarChart2 className="w-3 h-3 text-blue-400/50" /> KPI targets
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
