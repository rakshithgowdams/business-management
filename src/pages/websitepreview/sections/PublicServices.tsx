import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';
import { getLucideIcon } from '../../dashboard/websitebuilder/utils';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicServices({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const items = (c.items as { icon: string; title: string; description: string; badge: string }[]) || [];
  const cols = Number(c.columns) || 3;

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#080a0f' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400 max-w-xl mx-auto">{c.subheading as string}</p>}
        </div>
        <div className={`grid gap-6 ${cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {items.map((item, i) => {
            const Icon = getLucideIcon(item.icon);
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-300 group relative"
              >
                {item.badge && (
                  <span style={{ backgroundColor: `${primary}20`, color: primary }} className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                <div style={{ backgroundColor: `${primary}15`, color: primary }} className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
