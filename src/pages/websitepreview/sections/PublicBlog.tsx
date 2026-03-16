import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicBlog({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const posts = (c.posts as { title: string; excerpt: string; image_url: string; date: string; author: string; tag: string }[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <article key={i} className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02] hover:border-white/[0.12] transition-all group cursor-pointer">
              {post.image_url && (
                <div className="overflow-hidden">
                  <img src={post.image_url} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-5">
                {post.tag && <span style={{ backgroundColor: `${primary}20`, color: primary }} className="text-[10px] font-bold px-2.5 py-1 rounded-full">{post.tag}</span>}
                <h3 className="text-sm font-bold text-white mt-3 mb-2 leading-snug">{post.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                  <span className="text-[10px] text-gray-600">{post.author}</span>
                  <span className="text-[10px] text-gray-600">{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
