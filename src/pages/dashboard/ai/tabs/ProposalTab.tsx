import { useRef, useState } from 'react';
import { Download, Copy, ExternalLink, MessageCircle, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProposalResult } from '../../../../lib/ai/types';

interface Props {
  data: ProposalResult;
  businessName: string;
}

export default function ProposalTab({ data, businessName }: Props) {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const raw = data?.proposal;
  if (!raw) {
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
        <p className="text-sm text-gray-300 mb-1">Proposal generation failed</p>
        <p className="text-xs text-gray-500">The AI response was incomplete or could not be parsed. Try running the analysis again.</p>
      </div>
    );
  }

  const p = {
    title: raw.title || `Proposal for ${businessName}`,
    executive_summary: raw.executive_summary || '',
    current_situation: raw.current_situation || { heading: 'Current Situation', content: '' },
    vision: raw.vision || { heading: 'Our Vision', content: '' },
    services_proposed: Array.isArray(raw.services_proposed) ? raw.services_proposed : [],
    implementation_plan: Array.isArray(raw.implementation_plan) ? raw.implementation_plan : [],
    investment_summary: raw.investment_summary || { total_investment: '', payment_terms: '', what_happens_if_they_wait: '' },
    social_proof: raw.social_proof || null,
    faq: Array.isArray(raw.faq) ? raw.faq : [],
    next_steps: Array.isArray(raw.next_steps) ? raw.next_steps : [],
    closing_message: raw.closing_message || '',
  };

  const getPlainText = () => {
    const lines = [
      p.title, '', p.executive_summary, '',
      p.current_situation.heading, p.current_situation.content, '',
      p.vision.heading, p.vision.content, '',
      'SERVICES PROPOSED:', '',
      ...p.services_proposed.flatMap((s) => [
        `${s.service_name || ''}`, `What We Build: ${s.what_we_will_build || ''}`,
        `How It Helps: ${s.how_it_solves_their_pain || ''}`, `Timeline: ${s.timeline || ''}`,
        `Investment: ${s.investment || ''}`, `Includes: ${(s.whats_included || []).join(', ')}`,
        `Success Metric: ${s.success_metric || ''}`, '',
      ]),
      'IMPLEMENTATION PLAN:', '',
      ...p.implementation_plan.map((w) => `${w.week || ''}: ${w.activities || ''}`), '',
      'INVESTMENT SUMMARY:', '',
      `Total: ${p.investment_summary.total_investment || ''}`,
      `Terms: ${p.investment_summary.payment_terms || ''}`,
      `Cost of Waiting: ${p.investment_summary.what_happens_if_they_wait || ''}`, '',
      'NEXT STEPS:', '', ...p.next_steps, '',
      p.closing_message,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPlainText());
    setCopied(true);
    toast.success('Proposal copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    const el = proposalRef.current;
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
    pdf.save(`proposal-${businessName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF downloaded');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi! I'd like to share a proposal for ${businessName}. Let me know a good time to discuss.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(p.title);
    const body = encodeURIComponent(getPlainText().slice(0, 2000));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={handleDownloadPdf} className="px-4 py-2 rounded-lg gradient-orange text-white text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Download PDF</button>
        <button onClick={handleCopy} className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/5">{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied!' : 'Copy Text'}</button>
        <button onClick={handleEmail} className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/5"><ExternalLink className="w-4 h-4" /> Email</button>
        <button onClick={handleWhatsApp} className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2 hover:bg-green-500/5"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
      </div>

      <div ref={proposalRef} className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 gradient-orange">
          <p className="text-xs text-white/70 uppercase tracking-widest mb-1">MyDesignNexus</p>
          <h2 className="text-xl font-bold text-white">{p.title}</h2>
          <p className="text-sm text-white/80 mt-1">Prepared for {businessName}</p>
        </div>

        <div className="p-6 space-y-6">
          {p.executive_summary && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Executive Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{p.executive_summary}</p>
            </div>
          )}

          {p.current_situation.content && (
            <div>
              <h3 className="text-sm font-bold text-brand-400 mb-2">{p.current_situation.heading}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{p.current_situation.content}</p>
            </div>
          )}

          {p.vision.content && (
            <div>
              <h3 className="text-sm font-bold text-green-400 mb-2">{p.vision.heading}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{p.vision.content}</p>
            </div>
          )}

          {p.services_proposed.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Proposed Services</h3>
              <div className="space-y-4">
                {p.services_proposed.map((svc, i) => (
                  <div key={i} className="bg-dark-700/50 rounded-lg p-4 border-l-2 border-brand-500">
                    <h4 className="text-sm font-semibold text-white mb-2">{svc.service_name || `Service ${i + 1}`}</h4>
                    <div className="space-y-2 text-xs text-gray-400">
                      {svc.what_we_will_build && <p><span className="text-gray-500">Deliverables:</span> {svc.what_we_will_build}</p>}
                      {svc.how_it_solves_their_pain && <p><span className="text-gray-500">How it helps:</span> {svc.how_it_solves_their_pain}</p>}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {svc.investment && <span className="text-brand-400 font-medium">{svc.investment}</span>}
                        {svc.timeline && <span>{svc.timeline}</span>}
                      </div>
                      {Array.isArray(svc.whats_included) && svc.whats_included.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {svc.whats_included.map((inc, j) => (
                            <span key={j} className="px-2 py-0.5 rounded bg-dark-600 text-gray-400 text-[10px]">{inc}</span>
                          ))}
                        </div>
                      )}
                      {svc.success_metric && <p className="text-green-400 text-xs mt-1">Success metric: {svc.success_metric}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.implementation_plan.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Implementation Plan</h3>
              <div className="space-y-2">
                {p.implementation_plan.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs font-bold text-brand-400 w-16 shrink-0">{step.week || `Step ${i + 1}`}</span>
                    <p className="text-xs text-gray-400">{step.activities || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.investment_summary.total_investment && (
            <div className="bg-brand-500/5 rounded-lg p-4 border border-brand-500/10">
              <h3 className="text-sm font-bold text-white mb-2">Investment Summary</h3>
              <p className="text-lg font-bold gradient-text mb-2">{p.investment_summary.total_investment}</p>
              {p.investment_summary.payment_terms && <p className="text-xs text-gray-400 mb-1">{p.investment_summary.payment_terms}</p>}
              {p.investment_summary.what_happens_if_they_wait && <p className="text-xs text-red-400 mt-2">{p.investment_summary.what_happens_if_they_wait}</p>}
            </div>
          )}

          {p.social_proof && p.social_proof.relevant_case_study && (
            <div className="bg-dark-700/50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-2">Proof of Results</h3>
              <p className="text-xs text-gray-300 mb-2">{p.social_proof.relevant_case_study}</p>
              {p.social_proof.testimonial_style && <p className="text-xs text-gray-400 italic">"{p.social_proof.testimonial_style}"</p>}
              {p.social_proof.results_achieved && <p className="text-xs text-green-400 mt-2">{p.social_proof.results_achieved}</p>}
            </div>
          )}

          {p.faq.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">FAQ</h3>
              <div className="space-y-3">
                {p.faq.map((f, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-300 mb-0.5">Q: {f.question || ''}</p>
                    <p className="text-xs text-gray-500">A: {f.answer || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.next_steps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Next Steps</h3>
              <div className="space-y-1.5">
                {p.next_steps.map((s, i) => (
                  <p key={i} className="text-xs text-gray-300">{s}</p>
                ))}
              </div>
            </div>
          )}

          {p.closing_message && (
            <div className="border-t border-white/5 pt-4">
              <p className="text-sm text-gray-300 leading-relaxed italic">{p.closing_message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
