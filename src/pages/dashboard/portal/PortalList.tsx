import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, Eye, EyeOff, Copy, RefreshCw, Trash2, Settings, BarChart3, Clock, Users, Shield, ChevronRight, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { regenerateAccessCode } from '../../../lib/portal/api';
import type { ClientPortal } from '../../../lib/portal/types';
import type { Client } from '../../../lib/clients/types';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ConfirmDialog';
import CreatePortalModal from './CreatePortalModal';

export default function PortalList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!user) return;
    const [pRes, cRes] = await Promise.all([
      supabase.from('client_portals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, full_name, company_name').eq('user_id', user.id).order('full_name'),
    ]);
    setPortals((pRes.data || []) as ClientPortal[]);
    setClients((cRes.data || []) as Client[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleActive = async (portal: ClientPortal) => {
    await supabase.from('client_portals').update({ is_active: !portal.is_active }).eq('id', portal.id);
    setPortals(prev => prev.map(p => p.id === portal.id ? { ...p, is_active: !p.is_active } : p));
    toast.success(portal.is_active ? 'Portal disabled' : 'Portal enabled');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('client_portals').delete().eq('id', deleteId);
    setPortals(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success('Portal deleted');
  };

  const handleRegenerate = async (portalId: string) => {
    setRegeneratingId(portalId);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await regenerateAccessCode(portalId, token);
      setPortals(prev => prev.map(p => p.id === portalId ? { ...p, access_code: res.access_code } : p));
      setRevealedCodes(prev => new Set([...prev, portalId]));
      toast.success('New access code generated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate');
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyToClipboard = (text: string, portalId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(portalId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'No client linked';
    const client = clients.find(c => c.id === clientId);
    return client ? (client.company_name || client.full_name) : 'Unknown client';
  };

  const portalUrl = (slug: string) => `${window.location.origin}/portal/${slug}`;

  const filtered = portals.filter(p =>
    p.portal_name.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(p.client_id).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Client Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Share your portfolio, case studies, and project progress securely with clients</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-orange text-white font-medium hover:shadow-lg hover:shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Portal
        </button>
      </div>

      {portals.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search portals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none transition-colors"
          />
        </div>
      )}

      {filtered.length === 0 && !search ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Client Portals Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Create a secure portal to share your company portfolio, case studies, testimonials, and project updates with your clients.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 rounded-xl gradient-orange text-white font-medium hover:shadow-lg hover:shadow-orange-500/20 transition-all"
          >
            Create Your First Portal
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(portal => (
            <div
              key={portal.id}
              className="bg-dark-800 border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold truncate">{portal.portal_name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      portal.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {portal.is_active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {getClientName(portal.client_id)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {portal.total_views} views
                    </span>
                    {portal.last_accessed_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Last visited {new Date(portal.last_accessed_at).toLocaleDateString()}
                      </span>
                    )}
                    {portal.expires_at && (
                      <span className={`flex items-center gap-1.5 ${
                        new Date(portal.expires_at) < new Date() ? 'text-red-400' : ''
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(portal.expires_at) < new Date() ? 'Expired' : `Expires ${new Date(portal.expires_at).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500 shrink-0">URL:</span>
                        <span className="text-xs text-gray-300 truncate">{portalUrl(portal.portal_slug)}</span>
                        <button
                          onClick={() => copyToClipboard(portalUrl(portal.portal_slug), `url-${portal.id}`)}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white shrink-0 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-500 shrink-0">Code:</span>
                      <span className="text-xs text-gray-300 font-mono">
                        {revealedCodes.has(portal.id) ? portal.access_code : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => setRevealedCodes(prev => {
                          const next = new Set(prev);
                          if (next.has(portal.id)) next.delete(portal.id);
                          else next.add(portal.id);
                          return next;
                        })}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white shrink-0 transition-colors"
                      >
                        {revealedCodes.has(portal.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(portal.access_code, `code-${portal.id}`)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white shrink-0 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRegenerate(portal.id)}
                    disabled={regeneratingId === portal.id}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Regenerate access code"
                  >
                    <RefreshCw className={`w-4 h-4 ${regeneratingId === portal.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(portal)}
                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${
                      portal.is_active ? 'text-green-400 hover:text-red-400' : 'text-red-400 hover:text-green-400'
                    }`}
                    title={portal.is_active ? 'Disable portal' : 'Enable portal'}
                  >
                    {portal.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <a
                    href={portalUrl(portal.portal_slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    title="Preview portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => navigate(`/dashboard/client-portal/${portal.id}`)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 text-sm font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(portal.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete portal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePortalModal
          clients={clients}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Portal"
          message="This will permanently delete this portal and all its content (case studies, portfolio items, testimonials, etc.). This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
