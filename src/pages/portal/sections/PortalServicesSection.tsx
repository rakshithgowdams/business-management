import { Check } from 'lucide-react';
import type { PortalService } from '../../../lib/portal/types';

interface Props { items: PortalService[]; color: string; }

export default function PortalServicesSection({ items, color }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No services listed yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Our Services</h2>
        <p className="text-gray-400">Comprehensive solutions tailored to your business needs</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-all group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
              <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color, opacity: 0.8 }} />
            </div>
            <h3 className="font-semibold text-base mb-2">{item.service_name}</h3>
            {item.description && <p className="text-sm text-gray-400 mb-4 leading-relaxed">{item.description}</p>}
            {item.features.length > 0 && (
              <ul className="space-y-2 mb-4">
                {item.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {item.price_range && (
              <p className="text-sm font-medium mt-auto pt-3 border-t border-white/[0.06]" style={{ color }}>
                {item.price_range}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
