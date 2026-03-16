interface Props {
  portal: { name: string; logo: string; welcome: string; description: string };
  owner: { full_name?: string; business_name?: string; avatar_url?: string };
  color: string;
}

export default function PortalHeroSection({ portal, owner, color }: Props) {
  if (!portal.welcome && !portal.description) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-10" style={{ backgroundColor: color }} />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center relative">
        {portal.welcome && (
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">{portal.welcome}</h2>
        )}
        {portal.description && (
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{portal.description}</p>
        )}
        {owner.business_name && !portal.welcome && (
          <h2 className="text-2xl sm:text-3xl font-bold">Welcome to {owner.business_name}</h2>
        )}
      </div>
    </section>
  );
}
