import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicCTA({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const layout = (c.layout as string) || 'centered';

  return (
    <section
      style={{ fontFamily: `'${font}', sans-serif`, background: `linear-gradient(135deg, ${primary}15 0%, ${primary}05 100%)`, borderTop: `1px solid ${primary}20`, borderBottom: `1px solid ${primary}20` }}
      className="px-6 py-20"
    >
      <div className={`max-w-5xl mx-auto ${layout === 'centered' ? 'text-center' : 'flex flex-col md:flex-row items-center justify-between gap-8'}`}>
        <div>
          {c.heading && <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400 max-w-xl mx-auto mb-8">{c.subheading as string}</p>}
        </div>
        <div className={`flex gap-4 flex-wrap ${layout === 'centered' ? 'justify-center' : 'shrink-0'}`}>
          <button style={{ backgroundColor: primary }} className="text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95">
            {(c.cta_primary_text as string) || 'Get Started'}
          </button>
          {c.show_secondary && (
            <button className="text-white font-semibold px-8 py-3.5 rounded-xl border border-white/20 hover:bg-white/[0.06] transition-all active:scale-95">
              {(c.cta_secondary_text as string) || 'Learn More'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
