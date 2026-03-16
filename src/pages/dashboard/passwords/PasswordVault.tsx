import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Shield, Star, Grid3x3 as Grid3X3, List, SlidersHorizontal, KeyRound, AlertTriangle, TrendingUp, Lock, Eye, EyeOff, RefreshCw, Copy, Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';
import type { PasswordEntry, PasswordFormData } from '../../../lib/passwords/types';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  generatePassword,
  evaluatePasswordStrength,
} from '../../../lib/passwords/constants';
import PasswordFormModal from './PasswordFormModal';
import PasswordCard from './PasswordCard';

type ViewMode = 'grid' | 'list';
type SortBy = 'title' | 'created_at' | 'last_used' | 'category';

export default function PasswordVault() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [strengthFilter, setStrengthFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PasswordEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [quickGenPw, setQuickGenPw] = useState('');
  const [quickGenShow, setQuickGenShow] = useState(false);
  const [quickGenCopied, setQuickGenCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('password_vault')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load passwords');
    } else {
      setEntries((data || []) as PasswordEntry[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSave = async (data: PasswordFormData & { password_strength: string }) => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase
        .from('password_vault')
        .update({
          title: data.title,
          category: data.category,
          username: data.username,
          encrypted_password: data.encrypted_password,
          website_url: data.website_url,
          notes: data.notes,
          tags: data.tags,
          password_strength: data.password_strength,
        })
        .eq('id', editing.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Password updated');
    } else {
      const { error } = await supabase
        .from('password_vault')
        .insert({
          user_id: user.id,
          title: data.title,
          category: data.category,
          username: data.username,
          encrypted_password: data.encrypted_password,
          website_url: data.website_url,
          notes: data.notes,
          tags: data.tags,
          password_strength: data.password_strength,
        });
      if (error) throw error;
      toast.success('Password saved');
    }
    setEditing(null);
    setShowForm(false);
    loadEntries();
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    const { error } = await supabase
      .from('password_vault')
      .delete()
      .eq('id', deleteId)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Password deleted');
      setEntries(prev => prev.filter(e => e.id !== deleteId));
    }
    setDeleteId(null);
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('password_vault')
      .update({ is_favorite: !current })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_favorite: !current } : e));
    }
  };

  const handleMarkUsed = async (id: string) => {
    if (!user) return;
    await supabase
      .from('password_vault')
      .update({ last_used: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const handleQuickGen = () => {
    setQuickGenPw(generatePassword(20));
    setQuickGenShow(true);
    setQuickGenCopied(false);
  };

  const handleQuickCopy = async () => {
    await navigator.clipboard.writeText(quickGenPw);
    setQuickGenCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setQuickGenCopied(false), 2000);
  };

  const filtered = useMemo(() => {
    let result = [...entries];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.website_url.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      );
    }
    if (categoryFilter !== 'all') result = result.filter(e => e.category === categoryFilter);
    if (strengthFilter !== 'all') result = result.filter(e => e.password_strength === strengthFilter);
    if (showFavOnly) result = result.filter(e => e.is_favorite);
    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'last_used') return (b.last_used || '').localeCompare(a.last_used || '');
      return b.created_at.localeCompare(a.created_at);
    });
    return result;
  }, [entries, search, categoryFilter, strengthFilter, showFavOnly, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const weak = entries.filter(e => e.password_strength === 'weak').length;
    const reused = new Map<string, number>();
    entries.forEach(e => {
      if (e.encrypted_password) {
        reused.set(e.encrypted_password, (reused.get(e.encrypted_password) || 0) + 1);
      }
    });
    const duplicates = [...reused.values()].filter(v => v > 1).reduce((s, v) => s + v, 0);
    const categories = new Set(entries.map(e => e.category)).size;
    return { total, weak, duplicates, categories };
  }, [entries]);

  const categoryGroups = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { map[e.category] = (map[e.category] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-brand-600/10 rounded-xl border border-brand-500/20">
              <Shield className="w-6 h-6 text-brand-400" />
            </div>
            Password Vault
          </h1>
          <p className="text-sm text-gray-500 mt-1">Securely manage all your passwords in one place</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Password
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <KeyRound className="w-4 h-4" />
            <span className="text-xs">Total Passwords</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs">Weak Passwords</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.weak}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs">Duplicates</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.duplicates}</p>
        </div>
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">Categories</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.categories}</p>
        </div>
      </div>

      <div className="bg-dark-800 border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-brand-400" />
            Quick Password Generator
          </h3>
          <button
            onClick={handleQuickGen}
            className="px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/20 rounded-lg text-xs font-medium text-brand-400 transition-colors"
          >
            Generate
          </button>
        </div>
        {quickGenPw && (
          <div className="flex items-center gap-2 bg-dark-900/60 rounded-lg px-4 py-3">
            <span className="flex-1 font-mono text-sm text-white truncate">
              {quickGenShow ? quickGenPw : '\u2022'.repeat(20)}
            </span>
            <button onClick={() => setQuickGenShow(!quickGenShow)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              {quickGenShow ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={handleQuickCopy} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              {quickGenCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.06]">
              {(() => {
                const s = evaluatePasswordStrength(quickGenPw);
                const c = STRENGTH_COLORS[s];
                return (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${c.text}`}>
                    {STRENGTH_LABELS[s]}
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search passwords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavOnly(!showFavOnly)}
              className={`p-2.5 rounded-xl border transition-colors ${showFavOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
              title="Favorites only"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-brand-600/10 border-brand-500/30 text-brand-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-600/10 text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-brand-600/10 text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 bg-dark-800/50 border border-white/[0.06] rounded-xl p-4" style={{ animation: 'slideUp 0.2s ease-out' }}>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Strength</label>
              <div className="relative">
                <select
                  value={strengthFilter}
                  onChange={e => setStrengthFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="all">All Strengths</option>
                  {Object.entries(STRENGTH_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Sort By</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="w-full appearance-none px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="created_at">Date Added</option>
                  <option value="title">Title</option>
                  <option value="last_used">Last Used</option>
                  <option value="category">Category</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {categoryGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
              categoryFilter === 'all'
                ? 'bg-brand-600/10 text-brand-400 border-brand-500/20'
                : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
            }`}
          >
            All ({entries.length})
          </button>
          {categoryGroups.map(([cat, count]) => {
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  categoryFilter === cat
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : 'border-white/[0.06] text-gray-500 hover:text-gray-300'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="shield"
          title={search || categoryFilter !== 'all' ? 'No matches found' : 'No passwords yet'}
          description={search || categoryFilter !== 'all' ? 'Try different filters' : 'Add your first password to get started'}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((entry, i) => (
            <div key={entry.id} style={{ animationDelay: `${i * 40}ms`, animation: 'fadeSlideUp 0.4s ease-out backwards' }}>
              <PasswordCard
                entry={entry}
                onEdit={e => { setEditing(e); setShowForm(true); }}
                onDelete={id => setDeleteId(id)}
                onToggleFavorite={handleToggleFavorite}
                onMarkUsed={handleMarkUsed}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-800 border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Category</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Username</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Strength</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Last Used</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => {
                  const catColors = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other;
                  const strColors = STRENGTH_COLORS[entry.password_strength] || STRENGTH_COLORS.medium;
                  return (
                    <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Star
                            className={`w-3.5 h-3.5 cursor-pointer shrink-0 ${entry.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                            onClick={() => handleToggleFavorite(entry.id, entry.is_favorite)}
                          />
                          <span className="text-sm font-medium text-white">{entry.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${catColors.bg} ${catColors.text} border ${catColors.border}`}>
                          {CATEGORY_LABELS[entry.category] || entry.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{entry.username || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${strColors.text}`}>
                          {STRENGTH_LABELS[entry.password_strength] || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {entry.last_used ? new Date(entry.last_used).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditing(entry); setShowForm(true); }}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <PasswordFormModal
          entry={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Password"
        message="Are you sure you want to permanently delete this password entry? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
