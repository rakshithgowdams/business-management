import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, MapPin, FolderKanban, Trash2, Pencil, ChevronDown, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';
import { CLIENT_STATUSES, CLIENT_TYPES, CLIENT_STATUS_COLORS, CLIENT_TYPE_COLORS, getInitials, getAvatarColor } from '../../../lib/clients/constants';
import type { Client } from '../../../lib/clients/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function ClientsList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');

  const [clientStats, setClientStats] = useState<Record<string, { projects: number; revenue: number; pending: number }>>({});

  const buildStats = (list: Client[], projects: {client_name: string; revenue: number; budget: number}[], invoices: {to_client_name: string; total: number; status: string}[]) => {
    const stats: Record<string, { projects: number; revenue: number; pending: number }> = {};
    for (const c of list) {
      const linked = projects.filter((p) =>
        p.client_name?.toLowerCase().trim() === c.full_name.toLowerCase().trim() ||
        (c.company_name && p.client_name?.toLowerCase().trim() === c.company_name.toLowerCase().trim())
      );
      const cInvoices = invoices.filter((inv) =>
        inv.to_client_name?.toLowerCase().trim() === c.full_name.toLowerCase().trim() ||
        (c.company_name && inv.to_client_name?.toLowerCase().trim() === c.company_name.toLowerCase().trim())
      );
      stats[c.id] = {
        projects: linked.length,
        revenue: linked.reduce((s, p) => s + Number(p.revenue || 0), 0),
        pending: cInvoices.filter((inv) => inv.status !== 'paid').reduce((s, inv) => s + Number(inv.total || 0), 0),
      };
    }
    return stats;
  };

  const loadClients = async (force = false) => {
    if (!user) return;
    if (!force && clients.length > 0) setLoading(false);
    else setLoading(true);

    const [list, projects, invoices] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(r => r.data ?? []) as Promise<Client[]>,
      supabase.from('projects').select('id,client_name,revenue,budget').eq('user_id', user.id).then(r => r.data ?? []) as Promise<{client_name: string; revenue: number; budget: number}[]>,
      supabase.from('invoices').select('to_client_name,total,status').eq('user_id', user.id).then(r => r.data ?? []) as Promise<{to_client_name: string; total: number; status: string}[]>,
    ]);

    setClients(list);
    if (list.length > 0) setClientStats(buildStats(list, projects, invoices));
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('clients').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Client deleted');
    loadClients(true);
  };

  const filtered = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.company_name.toLowerCase().includes(q) ||
        c.primary_phone.includes(q) ||
        c.primary_email.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') list = list.filter((c) => c.status === filterStatus);
    if (filterType !== 'All') list = list.filter((c) => c.client_type === filterType);

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'revenue') return (clientStats[b.id]?.revenue || 0) - (clientStats[a.id]?.revenue || 0);
      if (sortBy === 'projects') return (clientStats[b.id]?.projects || 0) - (clientStats[a.id]?.projects || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [clients, search, filterStatus, filterType, sortBy, clientStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} total clients</p>
        </div>
        <button onClick={() => navigate('/dashboard/clients/new')} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, phone, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Status</option>
              {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Types</option>
              {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="created_at">Date Added</option>
              <option value="name">Name</option>
              <option value="revenue">Revenue</option>
              <option value="projects">Projects</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No clients found</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first client to get started.</p>
          <button onClick={() => navigate('/dashboard/clients/new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">
            Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const stats = clientStats[client.id] || { projects: 0, revenue: 0, pending: 0 };
            const savedScores = JSON.parse(localStorage.getItem('mfo_client_scores') || '{}');
            const relScore = savedScores[client.id]?.score as number | undefined;
            const relColor = relScore !== undefined ? (relScore >= 7 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : relScore >= 5 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20') : '';
            return (
              <div key={client.id} className="glass-card glass-card-hover rounded-xl p-5 flex flex-col cursor-pointer transition-all relative" onClick={() => navigate(`/dashboard/clients/${client.id}`)}>
                {relScore !== undefined && (
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full border ${relColor}`}>
                    {relScore.toFixed(1)}
                  </span>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(client.full_name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {getInitials(client.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{client.full_name}</p>
                    {client.company_name && <p className="text-sm text-gray-400 truncate">{client.company_name}</p>}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${CLIENT_TYPE_COLORS[client.client_type] || ''}`}>{client.client_type}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${CLIENT_STATUS_COLORS[client.status] || ''}`}>{client.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4 flex-1">
                  {client.primary_phone && (
                    <a href={`tel:${client.primary_phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                      <Phone className="w-3.5 h-3.5 shrink-0" /> {client.primary_phone}
                    </a>
                  )}
                  {client.primary_email && (
                    <a href={`mailto:${client.primary_email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{client.primary_email}</span>
                    </a>
                  )}
                  {(client.city || client.state) && (
                    <p className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {[client.city, client.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Projects</p>
                    <p className="text-sm font-bold">{stats.projects}</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Revenue</p>
                    <p className="text-sm font-bold text-green-400">{formatINR(stats.revenue)}</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Pending</p>
                    <p className="text-sm font-bold text-orange-400">{formatINR(stats.pending)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-600">Added {formatDate(client.created_at)}</p>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/dashboard/ai-intelligence?clientId=${client.id}`)} className="p-1.5 rounded-lg hover:bg-brand-500/10 text-gray-400 hover:text-brand-400" title="AI Analyze">
                      <Bot className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(`/dashboard/clients/${client.id}`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                      <FolderKanban className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(`/dashboard/clients/${client.id}/edit`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Client" message="This will permanently delete this client and all their interactions. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
