import type { PortalTeamMember } from '../../../lib/portal/types';

interface Props { items: PortalTeamMember[]; color: string; }

export default function PortalTeamSection({ items, color }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No team members listed yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Our Team</h2>
        <p className="text-gray-400">The talented people behind our work</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/10 transition-all group">
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={item.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
                style={{ backgroundColor: `${color}25`, color }}
              >
                {item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <h4 className="font-semibold">{item.name}</h4>
            {item.title && <p className="text-sm mt-0.5" style={{ color }}>{item.title}</p>}
            {item.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-3">{item.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
