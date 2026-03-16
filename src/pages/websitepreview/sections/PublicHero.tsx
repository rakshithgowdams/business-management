import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicHero({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const layout = (c.layout as string) || 'left';
  const stats = (c.stats as { value: string; label: string }[]) || [];
  const bgStyle = c.bg_style === 'image' && c.bg_value
    ? { backgroundImage: `url(${c.bg_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : c.bg_style === 'gradient'
    ? { background: (c.bg_value as string) || `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` }
    : { backgroundColor: (c.bg_value as string) || '#0f172a' };

  const rowClass = layout === 'right' ? 'flex-col md:flex-row-reverse' : layout === 'centered' ? 'flex-col' : 'flex-col md:flex-row';

  return (
    <section style={{ ...bgStyle, fontFamily: `'${font}', sans-serif` }} className="relative px-4 sm:px-6 py-20 lg:py-32 overflow-hidden">
      {c.bg_style === 'image' && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative max-w-6xl mx-auto">
        <div className={`flex gap-8 md:gap-12 items-center ${rowClass} ${layout === 'centered' ? 'text-center' : ''}`}>
          <div className={`flex-1 space-y-5 sm:space-y-6 ${layout === 'centered' ? 'max-w-2xl mx-auto' : ''}`}>
            {c.show_badge && (
              <span style={{ backgroundColor: `${primary}20`, color: primary, border: `1px solid ${primary}30` }} className="inline-flex items-center text-xs font-semibold px-4 py-1.5 rounded-full">
                {(c.badge_text as string) || 'New'}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              {(c.headline as string) || 'Build Something Amazing'}
            </h1>
            {c.subheadline && <p className="text-lg sm:text-xl font-semibold text-gray-300">{c.subheadline as string}</p>}
            {c.body_text && <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-lg">{c.body_text as string}</p>}
            <div className={`flex gap-3 sm:gap-4 flex-wrap ${layout === 'centered' ? 'justify-center' : ''}`}>
              {c.cta_primary_href ? (
                <a
                  href={c.cta_primary_href as string}
                  style={{ backgroundColor: primary }}
                  className="text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 text-sm sm:text-base"
                >
                  {(c.cta_primary_text as string) || 'Get Started'}
                </a>
              ) : (
                <button
                  style={{ backgroundColor: primary }}
                  className="text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 text-sm sm:text-base"
                >
                  {(c.cta_primary_text as string) || 'Get Started'}
                </button>
              )}
              {c.show_secondary_cta && (
                <a
                  href={(c.cta_secondary_href as string) || '#'}
                  className="text-white font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-white/20 hover:bg-white/[0.06] transition-all active:scale-95 text-sm sm:text-base"
                >
                  {(c.cta_secondary_text as string) || 'Learn More'}
                </a>
              )}
            </div>
            {c.show_stats && stats.length > 0 && (
              <div className={`flex gap-6 sm:gap-8 pt-2 flex-wrap ${layout === 'centered' ? 'justify-center' : ''}`}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div style={{ color: primary }} className="text-xl sm:text-2xl font-black">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {c.image_url && layout !== 'centered' && (
            <div className="flex-1 w-full">
              <img src={c.image_url as string} alt="Hero" className="w-full rounded-2xl object-cover shadow-2xl max-h-64 sm:max-h-80 md:max-h-96" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
