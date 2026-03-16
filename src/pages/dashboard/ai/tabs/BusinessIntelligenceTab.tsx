import { Shield, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import type { AnalysisResult } from '../../../../lib/ai/types';
import { DEAL_POTENTIAL_COLORS, URGENCY_COLORS } from '../../../../lib/ai/constants';

interface Props {
  data: AnalysisResult;
}

function ScoreGauge({ score, label, max = 10 }: { score: number; label: string; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-brand-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-bold text-white">{score}/{max}</span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PainCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className={`glass-card rounded-xl p-4 border-t-2 ${accent}`}>
      <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <p key={i} className="text-xs text-gray-300 leading-relaxed pl-3 border-l-2 border-white/10">{item}</p>
        ))}
      </div>
    </div>
  );
}

export default function BusinessIntelligenceTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-gray-300 leading-relaxed">{data.business_summary}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <ScoreGauge score={data.digital_maturity_score} label="Digital Maturity" />
          <p className="text-xs text-gray-500 mt-2">{data.digital_maturity_label}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <ScoreGauge score={data.urgency_score} label="Urgency Score" />
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">Deal Potential</p>
          <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${DEAL_POTENTIAL_COLORS[data.deal_potential] || ''}`}>{data.deal_potential}</span>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">Est. Deal Value</p>
          <p className="text-lg font-bold gradient-text">{data.estimated_deal_value}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-brand-400" /> Top Pain Points</h3>
        <div className="space-y-2">
          {data.top_pain_points.map((pp, i) => (
            <div key={i} className="glass-card rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-white">{pp.pain}</p>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border ${URGENCY_COLORS[pp.urgency] || ''}`}>{pp.urgency}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{pp.impact}</p>
              <p className="text-xs text-brand-400 font-medium">Annual Cost: {pp.cost_estimate}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PainCard title="Personal Pain Points" items={data.personal_pain_points} accent="border-red-500/50" />
        <PainCard title="Professional Pain Points" items={data.professional_pain_points} accent="border-blue-500/50" />
        <PainCard title="Business Pain Points" items={data.business_pain_points} accent="border-brand-500/50" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-brand-400" /> Buying Psychology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Primary Motivation</p>
              <p className="text-sm text-green-400">{data.buying_psychology.primary_motivation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Best Closing Angle</p>
              <p className="text-sm text-brand-400">{data.buying_psychology.best_closing_angle}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Main Objection</p>
              <p className="text-sm text-red-400">{data.buying_psychology.main_objection}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">How to Handle It</p>
              <p className="text-sm text-gray-300">{data.buying_psychology.objection_handler}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Trust Builders</p>
          <div className="flex flex-wrap gap-2">
            {data.buying_psychology.trust_builders.map((t, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-dark-600 text-xs text-gray-300 border border-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {data.quick_wins.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-brand-400" /> Quick Wins (First 7 Days)</h3>
          <div className="space-y-2">
            {data.quick_wins.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-300">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.competitor_weaknesses.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-400" /> Competitor Weaknesses to Exploit</h3>
          <div className="space-y-2">
            {data.competitor_weaknesses.map((w, i) => (
              <p key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-red-500/30">{w}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
