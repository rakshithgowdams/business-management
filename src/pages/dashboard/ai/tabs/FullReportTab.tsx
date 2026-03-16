import { useRef } from 'react';
import { Download, MessageCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AnalysisResult, ROIResult, ProposalResult } from '../../../../lib/ai/types';

interface Props {
  analysis: AnalysisResult;
  roi: ROIResult | null;
  proposal: ProposalResult | null;
  businessName: string;
}

export default function FullReportTab({ analysis, roi, proposal, businessName }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const safeProposal = proposal?.proposal;
  const safeImplementation = Array.isArray(safeProposal?.implementation_plan) ? safeProposal.implementation_plan : [];
  const safeNextSteps = Array.isArray(safeProposal?.next_steps) ? safeProposal.next_steps : [];
  const safeInvestment = safeProposal?.investment_summary;
  const safePainPoints = Array.isArray(analysis.top_pain_points) ? analysis.top_pain_points : [];
  const safeRecommendations = Array.isArray(analysis.service_recommendations) ? analysis.service_recommendations : [];
  const safeROICalcs = roi && Array.isArray(roi.roi_calculations) ? roi.roi_calculations : [];

  const handleDownload = async () => {
    const el = reportRef.current;
    if (!el) return;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { backgroundColor: '#1A1A1A', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    let position = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    while (position < pdfH) {
      if (position > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -position, pdfW, pdfH);
      position += pageH;
    }
    pdf.save(`intelligence-report-${businessName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success('Report downloaded');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Here's the complete intelligence report for ${businessName}. Let's discuss the findings.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Intelligence Report: ${businessName}`);
    window.open(`mailto:?subject=${subject}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={handleDownload} className="px-4 py-2 rounded-lg gradient-orange text-white text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Download Complete Report</button>
        <button onClick={handleWhatsApp} className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2 hover:bg-green-500/5"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
        <button onClick={handleEmail} className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/5"><Mail className="w-4 h-4" /> Email</button>
      </div>

      <div ref={reportRef} className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 gradient-orange">
          <p className="text-xs text-white/70 uppercase tracking-widest mb-1">MyDesignNexus Intelligence Report</p>
          <h2 className="text-xl font-bold text-white">{businessName}</h2>
          <p className="text-sm text-white/80 mt-1">Complete Business Analysis</p>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">1. Executive Summary</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.business_summary || 'No summary available.'}</p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-dark-700/50 rounded p-2 text-center">
                <p className="text-[10px] text-gray-500">Digital Score</p>
                <p className="text-sm font-bold text-white">{analysis.digital_maturity_score ?? '-'}/10</p>
              </div>
              <div className="bg-dark-700/50 rounded p-2 text-center">
                <p className="text-[10px] text-gray-500">Urgency</p>
                <p className="text-sm font-bold text-white">{analysis.urgency_score ?? '-'}/10</p>
              </div>
              <div className="bg-dark-700/50 rounded p-2 text-center">
                <p className="text-[10px] text-gray-500">Deal Potential</p>
                <p className="text-sm font-bold text-brand-400">{analysis.deal_potential || '-'}</p>
              </div>
              <div className="bg-dark-700/50 rounded p-2 text-center">
                <p className="text-[10px] text-gray-500">Value</p>
                <p className="text-sm font-bold text-green-400">{analysis.estimated_deal_value || '-'}</p>
              </div>
            </div>
          </section>

          {safePainPoints.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">2. Pain Point Analysis</h3>
              <div className="space-y-2">
                {safePainPoints.map((pp, i) => (
                  <div key={i} className="bg-dark-700/50 rounded p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-white">{pp.pain || ''}</p>
                      <span className="text-[10px] text-brand-400">{pp.urgency || ''}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{pp.impact || ''}{pp.cost_estimate ? ` | Cost: ${pp.cost_estimate}` : ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {safeRecommendations.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">3. Service Recommendations</h3>
              <div className="space-y-2">
                {safeRecommendations.map((rec, i) => (
                  <div key={i} className="bg-dark-700/50 rounded p-3 border-l-2 border-brand-500">
                    <p className="text-xs font-medium text-white">#{rec.priority ?? i + 1} {rec.service || ''}</p>
                    {rec.specific_solution && <p className="text-[10px] text-gray-500 mt-1">{rec.specific_solution}</p>}
                    <p className="text-[10px] text-brand-400 mt-1">{rec.estimated_price || ''}{rec.implementation_time ? ` | ${rec.implementation_time}` : ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {safeROICalcs.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">4. ROI Calculations</h3>
              <div className="space-y-2">
                {safeROICalcs.map((item, i) => (
                  <div key={i} className="bg-dark-700/50 rounded p-3">
                    <p className="text-xs font-medium text-white">{item.service || ''}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-[10px]">
                      {item.current_cost_annually && <span className="text-red-400">Waste: {item.current_cost_annually}</span>}
                      {item.money_saved_monthly && <span className="text-green-400">Save: {item.money_saved_monthly}/mo</span>}
                      {item.roi_percentage && <span className="text-brand-400">ROI: {item.roi_percentage}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {roi?.total_opportunity_cost && (
                  <div className="bg-red-500/5 rounded p-2 text-center border border-red-500/10">
                    <p className="text-[10px] text-gray-500">Opportunity Cost</p>
                    <p className="text-xs font-bold text-red-400">{roi.total_opportunity_cost}</p>
                  </div>
                )}
                {roi?.total_annual_savings && (
                  <div className="bg-green-500/5 rounded p-2 text-center border border-green-500/10">
                    <p className="text-[10px] text-gray-500">Annual Savings</p>
                    <p className="text-xs font-bold text-green-400">{roi.total_annual_savings}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {safeImplementation.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">5. Implementation Roadmap</h3>
              <div className="space-y-1.5">
                {safeImplementation.map((step, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-brand-400 font-medium w-16 shrink-0">{step.week || `Step ${i + 1}`}</span>
                    <span className="text-gray-400">{step.activities || ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {safeInvestment?.total_investment && (
            <section>
              <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">6. Investment Summary</h3>
              <p className="text-lg font-bold gradient-text">{safeInvestment.total_investment}</p>
              {safeInvestment.payment_terms && <p className="text-xs text-gray-400 mt-1">{safeInvestment.payment_terms}</p>}
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">7. About MyDesignNexus</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              MyDesignNexus is Karnataka's leading AI automation company, specializing in transforming traditional businesses
              with cutting-edge AI solutions. Founded by Rakshith, we combine deep local market understanding with
              5+ years of AI experience to deliver affordable, high-impact digital transformation for SMEs across Karnataka.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">8. Next Steps</h3>
            {safeNextSteps.length > 0 ? (
              <div className="space-y-1">
                {safeNextSteps.map((s, i) => (
                  <p key={i} className="text-xs text-gray-300">{s}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Contact MyDesignNexus to discuss implementation.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
