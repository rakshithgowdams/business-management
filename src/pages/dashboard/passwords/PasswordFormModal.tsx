import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, Copy, Check, Tag, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PasswordEntry, PasswordFormData } from '../../../lib/passwords/types';
import {
  PASSWORD_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  evaluatePasswordStrength,
  generatePassword,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
} from '../../../lib/passwords/constants';

interface Props {
  entry: PasswordEntry | null;
  onClose: () => void;
  onSave: (data: PasswordFormData & { password_strength: string }) => Promise<void>;
}

const inputCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm transition-colors duration-200';

export default function PasswordFormModal({ entry, onClose, onSave }: Props) {
  const [form, setForm] = useState<PasswordFormData>({
    title: '',
    category: 'other',
    username: '',
    encrypted_password: '',
    website_url: '',
    notes: '',
    tags: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        title: entry.title,
        category: entry.category,
        username: entry.username,
        encrypted_password: entry.encrypted_password,
        website_url: entry.website_url,
        notes: entry.notes,
        tags: entry.tags || [],
      });
    }
  }, [entry]);

  const strength = evaluatePasswordStrength(form.encrypted_password);
  const strengthConfig = STRENGTH_COLORS[strength];
  const strengthPercent = strength === 'weak' ? 25 : strength === 'medium' ? 50 : strength === 'strong' ? 75 : 100;

  const handleGenerate = () => {
    const pw = generatePassword(20);
    setForm(prev => ({ ...prev, encrypted_password: pw }));
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(form.encrypted_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, password_strength: strength });
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold">{entry ? 'Edit Password' : 'Add Password'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
            <input
              className={inputCls}
              placeholder="e.g. Instagram, Netflix, Gmail"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {PASSWORD_CATEGORIES.map(cat => {
                const colors = CATEGORY_COLORS[cat];
                const isActive = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      isActive
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'border-white/[0.06] text-gray-500 hover:border-white/10 hover:text-gray-300'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Username / Email</label>
            <input
              className={inputCls}
              placeholder="your@email.com"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-28`}
                placeholder="Enter password"
                value={form.encrypted_password}
                onChange={e => setForm(prev => ({ ...prev, encrypted_password: e.target.value }))}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  title="Generate"
                >
                  <RefreshCw className="w-4 h-4 text-brand-400" />
                </button>
              </div>
            </div>
            {form.encrypted_password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${strengthConfig.text}`}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${strengthConfig.bar} transition-all duration-500`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Website URL</label>
            <input
              className={inputCls}
              placeholder="https://example.com"
              value={form.website_url}
              onChange={e => setForm(prev => ({ ...prev, website_url: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tags</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="p-2.5 bg-dark-800 border border-white/10 rounded-xl hover:border-brand-500/50 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-600/10 text-brand-400 text-xs rounded-lg border border-brand-500/20"
                  >
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : entry ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
