import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicFAQ({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const items = (c.items as { question: string; answer: string }[]) || [];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              style={openIdx === i ? { borderColor: `${primary}40` } : {}}
              className="border border-white/[0.07] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-white pr-4">{item.question}</span>
                <div
                  style={openIdx === i ? { backgroundColor: `${primary}20`, color: primary } : {}}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.05] text-gray-500 transition-all"
                >
                  {openIdx === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
