import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle, Loader2, Facebook, Twitter, Instagram, Linkedin, Youtube, Github } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

const SOCIAL_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  facebook: { icon: Facebook, label: 'Facebook', color: '#1877F2' },
  twitter: { icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  youtube: { icon: Youtube, label: 'YouTube', color: '#FF0000' },
  github: { icon: Github, label: 'GitHub', color: '#6e5494' },
};

export default function PublicContact({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const socialLinks = (c.social_links as { platform: string; url: string }[]) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);
    setError('');
    try {
      const { error: dbError } = await supabase
        .from('website_leads')
        .insert({
          project_id: project.id,
          owner_user_id: project.user_id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          section_label: (c.heading as string) || 'Contact Form',
          status: 'new',
        });
      if (dbError) throw dbError;
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#080a0f' }} className="px-4 sm:px-6 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          {c.heading && <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-sm sm:text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          <div className="space-y-5">
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-start gap-4 group">
                <div style={{ backgroundColor: `${primary}15`, color: primary }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Email</div>
                  <div className="text-sm font-semibold text-white group-hover:text-gray-200 break-all">{c.email as string}</div>
                </div>
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-start gap-4 group">
                <div style={{ backgroundColor: `${primary}15`, color: primary }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                  <div className="text-sm font-semibold text-white">{c.phone as string}</div>
                </div>
              </a>
            )}
            {c.whatsapp && (
              <a href={`https://wa.me/${(c.whatsapp as string).replace(/\D/g, '')}`} target="_blank\" rel="noopener noreferrer\" className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-green-500/15 text-green-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">WhatsApp</div>
                  <div className="text-sm font-semibold text-white">{c.whatsapp as string}</div>
                </div>
              </a>
            )}
            {c.address && (
              <div className="flex items-start gap-4">
                <div style={{ backgroundColor: `${primary}15`, color: primary }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Address</div>
                  <div className="text-sm font-semibold text-white leading-relaxed">{c.address as string}</div>
                </div>
              </div>
            )}
            {socialLinks.length > 0 && (
              <div className="pt-2">
                <div className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-semibold">Follow us</div>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((s, i) => {
                    const cfg = SOCIAL_CONFIG[s.platform?.toLowerCase()];
                    const Icon = cfg?.icon;
                    return (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={cfg?.label || s.platform}
                        className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:scale-110 transition-all group"
                        style={{ color: cfg?.color || primary }}
                      >
                        {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-bold uppercase">{s.platform?.[0] || '?'}</span>}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {c.show_form && (
            <div>
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div style={{ backgroundColor: `${primary}15`, color: primary }} className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-400">We'll get back to you as soon as possible.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-gray-500 hover:text-white transition-colors">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Your Name *</label>
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 9999..."
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your project..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: primary }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
