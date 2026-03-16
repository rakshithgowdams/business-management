import { Shield, Award, AlertTriangle } from 'lucide-react';
import type { CompetitorResult } from '../../../../lib/ai/types';

interface Props {
  data: CompetitorResult;
}

export default function CompetitorTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Criteria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-brand-400">MyDesignNexus</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Agency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Freelancer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">No Action</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison_table.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs font-medium text-white">{row.criteria}</td>
                  <td className={`px-4 py-3 text-xs ${row.winner.includes('MyDesignNexus') ? 'text-brand-400 font-medium bg-brand-500/5' : 'text-gray-300'}`}>{row.mydesignnexus}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.typical_agency}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.freelancer}</td>
                  <td className="px-4 py-3 text-xs text-red-400/70">{row.doing_nothing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-brand-400" /> Our Unfair Advantages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.our_unfair_advantages.map((adv, i) => (
            <div key={i} className="glass-card rounded-xl p-4 border-l-2 border-brand-500">
              <p className="text-sm font-semibold text-brand-400 mb-1">{adv.advantage}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{adv.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-semibold text-white">Why Not Cheap Freelancer?</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{data.why_not_cheap_freelancer}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-semibold text-white">Why Not Big Agency?</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{data.why_not_big_agency}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-semibold text-white">Why Not DIY?</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{data.why_not_diy}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-400" />
            <h4 className="text-xs font-semibold text-green-400">Our Guarantee</h4>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{data.our_guarantee}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-brand-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-semibold text-brand-400">Risk Reversal</h4>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{data.risk_reversal}</p>
        </div>
      </div>
    </div>
  );
}
