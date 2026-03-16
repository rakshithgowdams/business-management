import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Star, ExternalLink, MoreVertical, Pencil, Trash2, Globe } from 'lucide-react';
import type { PasswordEntry } from '../../../lib/passwords/types';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
} from '../../../lib/passwords/constants';

interface Props {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onMarkUsed: (id: string) => void;
}

export default function PasswordCard({ entry, onEdit, onDelete, onToggleFavorite, onMarkUsed }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const catColors = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other;
  const strengthConfig = STRENGTH_COLORS[entry.password_strength] || STRENGTH_COLORS.medium;
  const strengthPercent = entry.password_strength === 'weak' ? 25 : entry.password_strength === 'medium' ? 50 : entry.password_strength === 'strong' ? 75 : 100;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    onMarkUsed(entry.id);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const maskedPassword = entry.encrypted_password
    ? '\u2022'.repeat(Math.min(entry.encrypted_password.length, 16))
    : '';

  const favicon = entry.website_url
    ? `https://www.google.com/s2/favicons?domain=${new URL(entry.website_url.startsWith('http') ? entry.website_url : `https://${entry.website_url}`).hostname}&sz=32`
    : null;

  return (
    <div className="group bg-dark-800/60 border border-white/[0.06] rounded-xl hover:border-white/[0.12] hover:bg-dark-800 transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${catColors.bg.replace('/10', '/40')}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${catColors.bg} border ${catColors.border} flex items-center justify-center shrink-0`}>
              {favicon ? (
                <img src={favicon} alt="" className="w-5 h-5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
              ) : null}
              <Globe className={`w-5 h-5 ${catColors.icon} ${favicon ? 'hidden' : ''}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{entry.title}</h3>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${catColors.text}`}>
                {CATEGORY_LABELS[entry.category] || entry.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(entry.id, entry.is_favorite)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Star className={`w-4 h-4 transition-colors ${entry.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-gray-400'}`} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-dark-700 border border-white/10 rounded-xl shadow-xl z-20 w-36 py-1 overflow-hidden">
                    <button
                      onClick={() => { onEdit(entry); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => { onDelete(entry.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {entry.username && (
          <div className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2 mb-2">
            <span className="text-xs text-gray-400 truncate mr-2">{entry.username}</span>
            <button
              onClick={() => handleCopy(entry.username, 'username')}
              className="p-1 hover:bg-white/5 rounded transition-colors shrink-0"
            >
              {copiedField === 'username' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
              )}
            </button>
          </div>
        )}

        {entry.encrypted_password && (
          <div className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2 mb-2">
            <span className="text-xs text-gray-400 font-mono truncate mr-2">
              {showPassword ? entry.encrypted_password : maskedPassword}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => { setShowPassword(!showPassword); onMarkUsed(entry.id); }}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 text-gray-500" /> : <Eye className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              <button
                onClick={() => handleCopy(entry.encrypted_password, 'password')}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                {copiedField === 'password' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="h-1 w-16 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${strengthConfig.bar} transition-all duration-500`}
                  style={{ width: `${strengthPercent}%` }}
                />
              </div>
            </div>
            <span className={`text-[10px] font-medium ${strengthConfig.text}`}>
              {STRENGTH_LABELS[entry.password_strength] || 'Unknown'}
            </span>
          </div>

          {entry.website_url && (
            <a
              href={entry.website_url.startsWith('http') ? entry.website_url : `https://${entry.website_url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onMarkUsed(entry.id)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500 hover:text-brand-400" />
            </a>
          )}
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {entry.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-white/[0.04] text-gray-500 text-[10px] rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
