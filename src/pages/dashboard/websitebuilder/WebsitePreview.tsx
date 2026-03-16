import { useMemo } from 'react';
import { Star, Phone, Mail, MapPin, MessageCircle, CheckCircle, ChevronDown, Menu } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';
import { getLucideIcon } from './utils';

interface Props {
  sections: WebsiteSection[];
  project: WebsiteProject | null;
  mode: 'desktop' | 'tablet' | 'mobile';
}

const widthMap = { desktop: '100%', tablet: '768px', mobile: '375px' };

function PreviewSection({ section, project, isMobile }: { section: WebsiteSection; project: WebsiteProject | null; isMobile: boolean }) {
  const c = section.config as Record<string, unknown>;
  const primary = project?.theme_color || '#f97316';
  const font = project?.font_family || 'Inter';

  const style = { fontFamily: `'${font}', sans-serif` };

  if (section.section_type === 'header') {
    const links = (c.nav_links as { label: string; href: string }[]) || [];
    const logoUrl = c.logo_url as string | undefined;
    const isSticky = c.sticky !== false;
    const isTransparent = c.transparent !== false;
    const headerBg = isTransparent ? 'rgba(10,12,16,0.6)' : '#0a0c10';
    const headerBorder = isTransparent ? 'none' : '1px solid rgba(255,255,255,0.07)';
    return (
      <header
        style={{ ...style, backgroundColor: headerBg, borderBottom: headerBorder, position: isSticky ? 'sticky' : 'relative', top: 0, zIndex: 10, backdropFilter: isTransparent ? 'blur(12px)' : undefined }}
        className="px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-7 max-w-[100px] object-contain" />
          ) : (
            <span style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs">
              B
            </span>
          )}
        </div>
        {!isMobile && (
          <nav className="flex gap-0.5">
            {links.slice(0, 5).map((l, i) => <a key={i} href={l.href} className="text-[11px] text-gray-400 hover:text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-white/[0.05]">{l.label}</a>)}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {c.show_cta !== false && !isMobile && (
            <button style={{ backgroundColor: primary }} className="text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg">
              {(c.cta_text as string) || 'Get Started'}
            </button>
          )}
          {isMobile && (
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-gray-400">
              <Menu className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </header>
    );
  }

  if (section.section_type === 'hero') {
    const layout = (c.layout as string) || 'left';
    const stats = (c.stats as { value: string; label: string }[]) || [];
    const bgStyle = c.bg_style === 'image' && c.bg_value ? { backgroundImage: `url(${c.bg_value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : c.bg_style === 'gradient' ? { background: c.bg_value as string || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' } : { backgroundColor: (c.bg_value as string) || '#0f172a' };
    const flexDir = isMobile || layout === 'centered' ? 'flex-col text-center' : layout === 'right' ? 'flex-row-reverse' : 'flex-row';
    return (
      <section style={{ ...bgStyle, ...style }} className={`px-5 ${isMobile ? 'py-10' : 'py-16'}`}>
        <div className={`max-w-5xl mx-auto flex gap-6 items-center ${flexDir}`}>
          <div className="flex-1 space-y-3">
            {c.show_badge && <span style={{ backgroundColor: `${primary}20`, color: primary }} className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full">{(c.badge_text as string) || 'New'}</span>}
            <h1 className={`font-bold text-white leading-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>{(c.headline as string) || 'Welcome'}</h1>
            {c.subheadline && <p className={`font-semibold text-gray-300 ${isMobile ? 'text-sm' : 'text-base'}`}>{c.subheadline as string}</p>}
            {c.body_text && <p className="text-xs text-gray-400 leading-relaxed">{c.body_text as string}</p>}
            <div className={`flex gap-3 flex-wrap ${isMobile || layout === 'centered' ? 'justify-center' : ''}`}>
              <button style={{ backgroundColor: primary }} className="text-white text-xs font-bold px-4 py-2 rounded-lg">{(c.cta_primary_text as string) || 'Get Started'}</button>
              {c.show_secondary_cta && <button className="text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/20">{(c.cta_secondary_text as string) || 'Learn More'}</button>}
            </div>
            {c.show_stats && stats.length > 0 && (
              <div className={`flex gap-4 pt-2 ${isMobile || layout === 'centered' ? 'justify-center' : ''}`}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div style={{ color: primary }} className="text-lg font-bold">{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {c.image_url && !isMobile && layout !== 'centered' && (
            <div className="flex-1">
              <img src={c.image_url as string} alt="Hero" className="w-full rounded-xl object-cover max-h-64" />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section.section_type === 'stats') {
    const items = (c.items as { value: string; label: string; icon: string; prefix: string; suffix: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {c.heading && <h2 className="text-xl font-bold text-white text-center mb-2">{c.heading as string}</h2>}
          {c.subheading && <p className="text-sm text-gray-400 text-center mb-8">{c.subheading as string}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((item, i) => {
              const Icon = getLucideIcon(item.icon);
              return (
                <div key={i} className="text-center">
                  <div style={{ color: primary }} className="flex justify-center mb-2"><Icon className="w-6 h-6" /></div>
                  <div className="text-2xl font-bold text-white">{item.prefix}{item.value}{item.suffix}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'services') {
    const items = (c.items as { icon: string; title: string; description: string; badge: string }[]) || [];
    const cols = Number(c.columns) || 3;
    return (
      <section style={{ ...style, backgroundColor: '#080a0f' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
            {items.map((item, i) => {
              const Icon = getLucideIcon(item.icon);
              return (
                <div key={i} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] relative">
                  {item.badge && <span style={{ backgroundColor: `${primary}20`, color: primary }} className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                  <div style={{ color: primary }} className="mb-3"><Icon className="w-6 h-6" /></div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'about') {
    const layout = (c.layout as string) || 'right';
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className="px-6 py-16">
        <div className={`max-w-5xl mx-auto flex gap-10 items-center ${layout === 'right' ? 'flex-row' : layout === 'left' ? 'flex-row-reverse' : 'flex-col text-center'}`}>
          {c.image_url && <div className="flex-1"><img src={c.image_url as string} alt="About" className="w-full rounded-xl object-cover max-h-64" /></div>}
          <div className="flex-1 space-y-4">
            {c.heading && <h2 className="text-xl font-bold text-white">{c.heading as string}</h2>}
            {c.subheading && <p style={{ color: primary }} className="text-sm font-semibold">{c.subheading as string}</p>}
            {c.body_text && <p className="text-sm text-gray-400 leading-relaxed">{c.body_text as string}</p>}
            <div className="flex gap-6">
              {c.founded_year && <div><div className="text-lg font-bold text-white">{c.founded_year as string}</div><div className="text-xs text-gray-500">Founded</div></div>}
              {c.team_size && <div><div className="text-lg font-bold text-white">{c.team_size as string}</div><div className="text-xs text-gray-500">Team Size</div></div>}
              {c.clients_served && <div><div className="text-lg font-bold text-white">{c.clients_served as string}</div><div className="text-xs text-gray-500">Clients</div></div>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'team') {
    const members = (c.members as { name: string; role: string; image_url: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#080a0f' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.map((m, i) => (
              <div key={i} className="text-center p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden bg-white/[0.05]">
                  {m.image_url ? <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">{m.name[0]}</div>}
                </div>
                <div className="text-sm font-bold text-white">{m.name}</div>
                <div style={{ color: primary }} className="text-xs mt-0.5">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'testimonials') {
    const items = (c.items as { name: string; role: string; company: string; text: string; rating: number }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {c.show_rating && <div className="flex gap-0.5 mb-3">{Array.from({ length: item.rating || 5 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>}
                <p className="text-xs text-gray-400 leading-relaxed mb-4">"{item.text}"</p>
                <div>
                  <div className="text-xs font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-gray-500">{item.role}{item.company ? `, ${item.company}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'pricing') {
    const tiers = (c.tiers as { name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean; badge: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#080a0f' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, i) => (
              <div key={i} style={tier.highlighted ? { borderColor: primary, boxShadow: `0 0 30px ${primary}20` } : {}} className={`p-5 rounded-xl border ${tier.highlighted ? '' : 'border-white/[0.06]'} bg-white/[0.02] relative`}>
                {tier.badge && <span style={{ backgroundColor: primary }} className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-3 py-0.5 rounded-full whitespace-nowrap">{tier.badge}</span>}
                <div className="text-sm font-bold text-white mb-1">{tier.name}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span style={{ color: primary }} className="text-2xl font-bold">{tier.price}</span>
                  <span className="text-xs text-gray-500">{tier.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{tier.description}</p>
                <ul className="space-y-2 mb-5">
                  {(tier.features || []).map((f, j) => <li key={j} className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}</li>)}
                </ul>
                <button style={tier.highlighted ? { backgroundColor: primary } : {}} className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${tier.highlighted ? 'text-white' : 'border border-white/[0.1] text-white hover:bg-white/[0.04]'}`}>Get Started</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'faq') {
    const items = (c.items as { question: string; answer: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <span className="text-sm font-semibold text-white">{item.question}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                </button>
                {i === 0 && <div className="px-4 pb-3 text-xs text-gray-400">{item.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'gallery') {
    const images = (c.images as { url: string; alt: string; caption: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#080a0f' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden group">
                <img src={img.url} alt={img.alt} className="w-full h-32 object-cover" />
                {img.caption && <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"><span className="text-xs text-white">{img.caption}</span></div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'blog') {
    const posts = (c.posts as { title: string; excerpt: string; image_url: string; date: string; author: string; tag: string }[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.map((post, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <span style={{ backgroundColor: `${primary}20`, color: primary }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">{post.tag}</span>
                  <h3 className="text-sm font-bold text-white mt-2 mb-1">{post.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{post.excerpt?.slice(0, 80)}...</p>
                  <div className="text-[10px] text-gray-600 mt-3">{post.author} · {post.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'contact') {
    return (
      <section style={{ ...style, backgroundColor: '#080a0f' }} className={`px-5 ${isMobile ? 'py-10' : 'py-16'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400">{c.subheading as string}</p>}
          </div>
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-3">
              {c.email && <div className="flex items-center gap-3 text-sm text-gray-300"><Mail className="w-4 h-4 shrink-0" style={{ color: primary }} />{c.email as string}</div>}
              {c.phone && <div className="flex items-center gap-3 text-sm text-gray-300"><Phone className="w-4 h-4 shrink-0" style={{ color: primary }} />{c.phone as string}</div>}
              {c.whatsapp && <div className="flex items-center gap-3 text-sm text-gray-300"><MessageCircle className="w-4 h-4 shrink-0" style={{ color: '#25d366' }} />WhatsApp: {c.whatsapp as string}</div>}
              {c.address && <div className="flex items-start gap-3 text-sm text-gray-300"><MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primary }} />{c.address as string}</div>}
            </div>
            {c.show_form && (
              <div className="space-y-3">
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-400 placeholder-gray-600" placeholder="Your Name" disabled />
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-400 placeholder-gray-600" placeholder="Email Address" disabled />
                <textarea className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-400 placeholder-gray-600 h-20 resize-none" placeholder="Your Message" disabled />
                <button style={{ backgroundColor: primary }} className="w-full py-2 rounded-lg text-white text-sm font-bold">Send Message</button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'cta') {
    const layout = (c.layout as string) || 'centered';
    return (
      <section style={{ ...style, background: `linear-gradient(135deg, ${primary}20, ${primary}05)`, borderTop: `1px solid ${primary}20`, borderBottom: `1px solid ${primary}20` }} className="px-6 py-16">
        <div className={`max-w-5xl mx-auto ${layout === 'centered' ? 'text-center' : 'flex items-center justify-between gap-8'}`}>
          <div>
            {c.heading && <h2 className="text-2xl font-bold text-white mb-3">{c.heading as string}</h2>}
            {c.subheading && <p className="text-sm text-gray-400 mb-6">{c.subheading as string}</p>}
          </div>
          <div className={`flex gap-3 ${layout === 'centered' ? 'justify-center' : ''}`}>
            <button style={{ backgroundColor: primary }} className="text-white text-sm font-bold px-6 py-3 rounded-xl">{(c.cta_primary_text as string) || 'Get Started'}</button>
            {c.show_secondary && <button className="text-white text-sm font-semibold px-6 py-3 rounded-xl border border-white/20">{(c.cta_secondary_text as string) || 'Learn More'}</button>}
          </div>
        </div>
      </section>
    );
  }

  if (section.section_type === 'free_call') {
    const benefits = (c.benefits as string[]) || [];
    return (
      <section style={{ ...style, backgroundColor: '#0d1117' }} className={`px-5 ${isMobile ? 'py-10' : 'py-16'}`}>
        <div className={`max-w-5xl mx-auto grid gap-6 items-center ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            {c.heading && <h2 className="text-xl font-bold text-white mb-2">{c.heading as string}</h2>}
            {c.subheading && <p style={{ color: primary }} className="text-sm font-semibold mb-3">{c.subheading as string}</p>}
            {c.body_text && <p className="text-sm text-gray-400 mb-4">{c.body_text as string}</p>}
            {c.show_benefits && benefits.length > 0 && (
              <ul className="space-y-2 mb-5">
                {benefits.map((b, i) => <li key={i} className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />{b}</li>)}
              </ul>
            )}
            <button style={{ backgroundColor: primary }} className="text-white font-bold px-6 py-3 rounded-xl text-sm">{(c.cta_text as string) || 'Book My Free Call'}</button>
          </div>
          {c.show_image && c.image_url && (
            <img src={c.image_url as string} alt="Free Call" className="w-full rounded-xl object-cover max-h-64" />
          )}
        </div>
      </section>
    );
  }

  if (section.section_type === 'footer') {
    const columns = (c.columns as { heading: string; links: { label: string; href: string }[] }[]) || [];
    const socialLinks = (c.social_links as { platform: string; url: string }[]) || [];
    return (
      <footer style={{ ...style, backgroundColor: '#050608', borderTop: '1px solid rgba(255,255,255,0.07)' }} className={`px-5 pt-10 pb-5`}>
        <div className="max-w-5xl mx-auto">
          <div className={`grid gap-6 mb-8 ${isMobile ? 'grid-cols-1' : columns.length > 0 ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs">
                  {((c.brand_name as string) || 'B')[0].toUpperCase()}
                </span>
                <span className="font-bold text-white text-sm">{(c.brand_name as string) || 'My Business'}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{(c.brand_description as string) || ''}</p>
              {c.show_social && socialLinks.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {socialLinks.slice(0, 4).map((s, i) => <div key={i} className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[9px] text-gray-400 uppercase font-bold">{s.platform[0]}</div>)}
                </div>
              )}
            </div>
            {columns.map((col, i) => (
              <div key={i}>
                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">{col.heading}</div>
                <ul className="space-y-2">
                  {col.links.map((l, j) => <li key={j} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">{l.label}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-4 flex items-center justify-between">
            <p className="text-[10px] text-gray-600">{(c.copyright_text as string) || `\u00A9 ${new Date().getFullYear()} ${(c.brand_name as string) || 'My Business'}. All rights reserved.`}</p>
            <p className="text-[10px] text-gray-700">Back to top ↑</p>
          </div>
        </div>
      </footer>
    );
  }

  if (section.section_type === 'custom') {
    return (
      <div style={style} className="min-h-16 bg-white/[0.02] border-y border-white/[0.05] text-center py-8 text-gray-500 text-xs">
        Custom Section: {section.label}
      </div>
    );
  }

  return null;
}

export default function WebsitePreview({ sections, project, mode }: Props) {
  const enabledSections = useMemo(
    () => sections.filter(s => s.enabled).sort((a, b) => a.order_index - b.order_index),
    [sections]
  );

  const isMobile = mode === 'mobile';

  const googleFontsUrl = useMemo(() =>
    project?.font_family && !['Inter', 'system-ui'].includes(project.font_family)
      ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(project.font_family)}:wght@300;400;500;600;700;800&display=swap`
      : null,
    [project?.font_family]
  );

  return (
    <div className="w-full h-full bg-[#050608] flex items-start justify-center overflow-auto p-4">
      <div
        className="bg-[#080a0f] overflow-y-auto rounded-xl border border-white/[0.06] shadow-2xl transition-all duration-300"
        style={{ width: widthMap[mode], minHeight: '100%', maxWidth: '100%' }}
      >
        {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
        {project?.custom_css && <style>{project.custom_css}</style>}
        {enabledSections.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
            Enable sections to see your website preview
          </div>
        ) : (
          enabledSections.map(section => (
            <PreviewSection key={section.id} section={section} project={project} isMobile={isMobile} />
          ))
        )}
      </div>
    </div>
  );
}
