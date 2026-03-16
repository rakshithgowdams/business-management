import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';
import { getLucideIcon } from '../../dashboard/websitebuilder/utils';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicStats({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const items = (c.items as { value: string; label: string; icon: string; prefix: string; suffix: string }[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        {c.heading && <h2 className="text-3xl font-black text-white text-center mb-2">{c.heading as string}</h2>}
        {c.subheading && <p className="text-base text-gray-400 text-center mb-12">{c.subheading as string}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => {
            const Icon = getLucideIcon(item.icon);
            return (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-3">
                  <div style={{ backgroundColor: `${primary}15`, color: primary, border: `1px solid ${primary}25` }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{item.prefix}{item.value}{item.suffix}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
