import { FileText, Download, ExternalLink } from 'lucide-react';
import { DOCUMENT_TYPE_COLORS } from '../../../lib/portal/constants';
import type { PortalSharedDocument } from '../../../lib/portal/types';

interface Props { items: PortalSharedDocument[]; color: string; }

export default function PortalDocumentsSection({ items, color }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No documents shared yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Shared Documents</h2>
        <p className="text-gray-400">Proposals, contracts, deliverables, and other important files</p>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-white/10 transition-all group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
              <FileText className="w-6 h-6" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-medium text-sm truncate">{item.document_name}</h4>
                <span className={`px-2 py-0.5 text-[10px] rounded border shrink-0 ${DOCUMENT_TYPE_COLORS[item.document_type] || DOCUMENT_TYPE_COLORS.Other}`}>
                  {item.document_type}
                </span>
              </div>
              {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
              <p className="text-[11px] text-gray-600 mt-0.5">
                Shared on {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {item.file_url && (
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all hover:opacity-90"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
