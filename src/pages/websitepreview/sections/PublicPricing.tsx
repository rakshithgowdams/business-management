import { CheckCircle } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicPricing({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const tiers = (c.tiers as { name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean; badge: string; cta_text: string }[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#080a0f' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={tier.highlighted ? { borderColor: primary, boxShadow: `0 0 40px ${primary}15` } : {}}
              className={`p-7 rounded-2xl border relative flex flex-col ${tier.highlighted ? '' : 'border-white/[0.07]'} bg-white/[0.025]`}
            >
              {tier.badge && (
                <span style={{ backgroundColor: primary }} className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-white px-4 py-1 rounded-full whitespace-nowrap shadow-lg">
                  {tier.badge}
                </span>
              )}
              <div className="text-base font-bold text-white mb-1">{tier.name}</div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span style={{ color: primary }} className="text-4xl font-black">{tier.price}</span>
                <span className="text-sm text-gray-500">{tier.period}</span>
              </div>
              {tier.description && <p className="text-sm text-gray-500 mb-6">{tier.description}</p>}
              <ul className="space-y-3 mb-8 flex-1">
                {(tier.features || []).map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                style={tier.highlighted ? { backgroundColor: primary } : {}}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${tier.highlighted ? 'text-white shadow-lg hover:opacity-90' : 'border border-white/[0.1] text-white hover:bg-white/[0.05]'}`}
              >
                {tier.cta_text || 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
