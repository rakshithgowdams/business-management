import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props {
  section: WebsiteSection;
  project: WebsiteProject | null;
  primary: string;
}

const SOCIAL_ICONS: Record<string, string> = {
  facebook: 'f',
  twitter: 't',
  instagram: 'in',
  linkedin: 'li',
  youtube: 'yt',
  github: 'gh',
  tiktok: 'tt',
};

export default function PublicFooter({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const columns = (c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [];
  const socialLinks = (c.social_links as { platform: string; url: string }[]) || [];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer
      style={{ fontFamily: `'${font}', sans-serif`, borderTop: `1px solid rgba(255,255,255,0.07)` }}
      className="bg-[#050608] relative"
    >
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className={`grid gap-10 mb-12 ${columns.length > 0 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              >
                {((c.brand_name as string) || 'B')[0].toUpperCase()}
              </span>
              <span className="font-bold text-white text-base">{(c.brand_name as string) || 'My Business'}</span>
            </div>
            {c.brand_description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{c.brand_description as string}</p>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2 group">
                <Mail className="w-3.5 h-3.5 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: primary }} />
                {c.email as string}
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2 group">
                <Phone className="w-3.5 h-3.5 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: primary }} />
                {c.phone as string}
              </a>
            )}
            {c.address && (
              <div className="flex items-start gap-2.5 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: primary }} />
                <span>{c.address as string}</span>
              </div>
            )}
            {c.show_social && socialLinks.length > 0 && (
              <div className="flex gap-2 mt-5">
                {socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white transition-all uppercase"
                  >
                    {SOCIAL_ICONS[s.platform?.toLowerCase()] || s.platform?.[0] || '?'}
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a
                      href={l.href}
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors flex items-center gap-2 group"
                    >
                      <span
                        style={{ backgroundColor: primary }}
                        className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 order-2 sm:order-1">
            {(c.copyright_text as string) || `© ${new Date().getFullYear()} ${(c.brand_name as string) || 'My Business'}. All rights reserved.`}
          </p>
          {c.show_back_to_top !== false && (
            <button
              onClick={scrollToTop}
              className="order-1 sm:order-2 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors group"
            >
              <span>Back to top</span>
              <div className="w-6 h-6 rounded-lg bg-white/[0.06] group-hover:bg-white/[0.12] flex items-center justify-center transition-colors">
                <ArrowUp className="w-3 h-3" />
              </div>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
