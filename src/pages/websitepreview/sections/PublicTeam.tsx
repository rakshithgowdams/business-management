import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicTeam({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const members = (c.members as { name: string; role: string; bio: string; image_url: string }[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#080a0f' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {members.map((m, i) => (
            <div key={i} className="text-center p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] transition-all group">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden bg-white/[0.05]">
                {m.image_url
                  ? <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                  : (
                    <div style={{ background: `linear-gradient(135deg, ${primary}30, ${primary}10)` }} className="w-full h-full flex items-center justify-center text-white text-xl font-black">
                      {m.name?.[0] || '?'}
                    </div>
                  )}
              </div>
              <div className="text-sm font-bold text-white">{m.name}</div>
              <div style={{ color: primary }} className="text-xs mt-0.5 font-medium">{m.role}</div>
              {m.bio && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
