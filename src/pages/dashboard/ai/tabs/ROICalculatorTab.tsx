import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import type { ROIResult } from '../../../../lib/ai/types';

interface Props {
  data: ROIResult;
}

export default function ROICalculatorTab({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.roi_calculations.map((item, i) => (
        <div key={i} className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-dark-700/30">
            <h3 className="text-sm font-bold text-white">{item.service}</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                <p className="text-[10px] text-red-400 mb-1 uppercase tracking-wider">Current Annual Waste</p>
                <p className="text-sm font-bold text-red-400">{item.current_cost_annually}</p>
              </div>
              <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                <p className="text-[10px] text-blue-400 mb-1 uppercase tracking-wider">Time Saved / Week</p>
                <p className="text-sm font-bold text-blue-400">{item.time_saved_weekly}</p>
              </div>
              <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                <p className="text-[10px] text-green-400 mb-1 uppercase tracking-wider">Monthly Savings</p>
                <p className="text-sm font-bold text-green-400">{item.money_saved_monthly}</p>
              </div>
              <div className="bg-brand-500/5 rounded-lg p-3 border border-brand-500/10">
                <p className="text-[10px] text-brand-400 mb-1 uppercase tracking-wider">Revenue Increase</p>
                <p className="text-sm font-bold text-brand-400">{item.revenue_increase_monthly}/mo</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-dark-700/50 rounded-lg p-3">
                <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Investment</p>
                <p className="text-sm font-bold text-white">{item.service_cost}</p>
              </div>
              <div className="text-center bg-dark-700/50 rounded-lg p-3">
                <Clock className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Payback</p>
                <p className="text-sm font-bold text-brand-400">{item.payback_period}</p>
              </div>
              <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">3-Year ROI</p>
                <p className="text-sm font-bold text-green-400">{item.three_year_roi}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-brand-500/5 rounded-lg border border-brand-500/10">
              <span className="text-xs text-gray-400">ROI Percentage</span>
              <span className="text-lg font-bold gradient-text">{item.roi_percentage}</span>
            </div>

            {item.roi_proof_example && (
              <p className="text-xs text-gray-500 mt-3 italic leading-relaxed">{item.roi_proof_example}</p>
            )}
          </div>
        </div>
      ))}

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-red-500/5 rounded-lg border border-red-500/10">
            <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 uppercase">Yearly Opportunity Cost</p>
            <p className="text-sm font-bold text-red-400">{data.total_opportunity_cost}</p>
          </div>
          <div className="text-center p-3 bg-brand-500/5 rounded-lg border border-brand-500/10">
            <DollarSign className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 uppercase">Total Investment</p>
            <p className="text-sm font-bold text-brand-400">{data.total_investment_needed}</p>
          </div>
          <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/10">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 uppercase">Annual Savings</p>
            <p className="text-sm font-bold text-green-400">{data.total_annual_savings}</p>
          </div>
          <div className="text-center p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 uppercase">Breakeven</p>
            <p className="text-sm font-bold text-blue-400">{data.breakeven_months} months</p>
          </div>
        </div>
      </div>
    </div>
  );
}
