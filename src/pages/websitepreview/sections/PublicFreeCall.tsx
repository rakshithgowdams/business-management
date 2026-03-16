import { CheckCircle, Calendar, Clock } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicFreeCall({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const benefits = (c.benefits as string[]) || [];

  const handleBook = () => {
    const url = c.calendar_url as string;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-4 sm:px-6 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div>
          {c.subheading && <p style={{ color: primary }} className="text-sm font-semibold uppercase tracking-widest mb-3">{c.subheading as string}</p>}
          {c.heading && <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">{c.heading as string}</h2>}
          {c.body_text && <p className="text-sm sm:text-base text-gray-400 mb-6 leading-relaxed">{c.body_text as string}</p>}
          {c.meeting_duration && (
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">{c.meeting_duration as string} minutes • Free</span>
            </div>
          )}
          {c.show_benefits && benefits.length > 0 && (
            <ul className="space-y-3 mb-8">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleBook}
            style={{ backgroundColor: primary }}
            disabled={!c.calendar_url}
            className="inline-flex items-center gap-2.5 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            {(c.cta_text as string) || 'Book My Free Call'}
          </button>
          {!c.calendar_url && (
            <p className="text-xs text-gray-600 mt-2">Calendar link not configured yet.</p>
          )}
        </div>
        {c.show_image && c.image_url && (
          <img src={c.image_url as string} alt="Free Call" className="w-full rounded-2xl object-cover shadow-2xl max-h-80 order-first md:order-last" />
        )}
      </div>
    </section>
  );
}
