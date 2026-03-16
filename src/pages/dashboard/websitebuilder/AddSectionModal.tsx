import { X } from 'lucide-react';
import type { SectionType } from '../../../lib/websiteBuilder/types';
import { SECTION_LABELS, SECTION_ICONS } from '../../../lib/websiteBuilder/defaults';
import { getLucideIcon } from './utils';

interface Props {
  onAdd: (type: SectionType) => void;
  onClose: () => void;
  existingTypes: SectionType[];
}

const ALL_TYPES: SectionType[] = [
  'header', 'hero', 'stats', 'services', 'about', 'team',
  'testimonials', 'pricing', 'faq', 'gallery', 'blog',
  'contact', 'cta', 'free_call', 'footer', 'custom',
];

export default function AddSectionModal({ onAdd, onClose, existingTypes }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white">Add Section</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Choose a section type to add to your website</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto">
          {ALL_TYPES.map(type => {
            const Icon = getLucideIcon(SECTION_ICONS[type] || 'Layout');
            const alreadyExists = existingTypes.includes(type) && type !== 'custom';
            return (
              <button
                key={type}
                onClick={() => !alreadyExists && onAdd(type)}
                disabled={alreadyExists}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  alreadyExists
                    ? 'border-white/[0.04] opacity-40 cursor-not-allowed'
                    : 'border-white/[0.06] hover:border-orange-500/30 hover:bg-orange-500/[0.04] cursor-pointer'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alreadyExists ? 'bg-white/[0.04] text-gray-600' : 'bg-orange-500/15 text-orange-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{SECTION_LABELS[type]}</div>
                  {alreadyExists && <div className="text-[10px] text-gray-600">Already added</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
