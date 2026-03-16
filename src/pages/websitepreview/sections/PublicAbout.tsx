import { CheckCircle } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicAbout({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const layout = (c.layout as string) || 'right';
  const highlights = (c.highlights as string[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-6 py-20">
      <div className={`max-w-6xl mx-auto flex gap-14 items-center ${layout === 'right' ? 'flex-row' : layout === 'left' ? 'flex-row-reverse' : 'flex-col text-center'}`}>
        {c.image_url && (
          <div className="flex-1">
            <img src={c.image_url as string} alt="About" className="w-full rounded-2xl object-cover shadow-2xl max-h-[440px]" />
          </div>
        )}
        <div className="flex-1 space-y-5">
          {c.subheading && <p style={{ color: primary }} className="text-sm font-semibold uppercase tracking-widest">{c.subheading as string}</p>}
          {c.heading && <h2 className="text-3xl font-black text-white leading-tight">{c.heading as string}</h2>}
          {c.body_text && <p className="text-base text-gray-400 leading-relaxed">{c.body_text as string}</p>}
          {highlights.length > 0 && (
            <ul className="space-y-2.5">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primary }} />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-8 pt-2">
            {c.founded_year && <div><div className="text-2xl font-black text-white">{c.founded_year as string}</div><div className="text-xs text-gray-500">Founded</div></div>}
            {c.team_size && <div><div className="text-2xl font-black text-white">{c.team_size as string}</div><div className="text-xs text-gray-500">Team Size</div></div>}
            {c.clients_served && <div><div className="text-2xl font-black text-white">{c.clients_served as string}</div><div className="text-xs text-gray-500">Clients</div></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
