import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Search, Filter, Trash2, Eye, MoreVertical, Mail, Phone, MessageSquare, CheckCircle, Clock, X, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  project_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  section_label: string;
  status: 'new' | 'read' | 'contacted' | 'closed';
  notes: string;
  submitted_at: string;
  read_at: string | null;
}

interface WebsiteProject {
  id: string;
  name: string;
  subdomain: string | null;
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  read: { label: 'Read', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  contacted: { label: 'Contacted', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  closed: { label: 'Closed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
};

export default function WebsiteLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: leadsData }, { data: projectsData }] = await Promise.all([
      supabase.from('website_leads').select('*').eq('owner_user_id', user.id).order('submitted_at', { ascending: false }),
      supabase.from('website_projects').select('id, name, subdomain').eq('user_id', user.id).order('name'),
    ]);
    setLeads(leadsData || []);
    setProjects(projectsData || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
    if (lead.status === 'new') {
      await supabase.from('website_leads').update({ status: 'read', read_at: new Date().toISOString() }).eq('id', lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'read', read_at: new Date().toISOString() } : l));
    }
  };

  const updateStatus = async (id: string, status: Lead['status']) => {
    await supabase.from('website_leads').update({ status }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
    setActionMenuId(null);
    toast.success('Status updated');
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    await supabase.from('website_leads').update({ notes }).eq('id', selectedLead.id);
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes } : l));
    setSelectedLead(prev => prev ? { ...prev, notes } : null);
    setSavingNotes(false);
    toast.success('Notes saved');
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    await supabase.from('website_leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
    setActionMenuId(null);
    toast.success('Lead deleted');
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Message', 'Source', 'Status', 'Date'],
      ...filtered.map(l => [l.name, l.email, l.phone, l.message, l.section_label, l.status, new Date(l.submitted_at).toLocaleString()]),
    ];
    const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'website-leads.csv';
    a.click();
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.message.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchProject = projectFilter === 'all' || l.project_id === projectFilter;
    return matchSearch && matchStatus && matchProject;
  });

  const newCount = leads.filter(l => l.status === 'new').length;
  const projectName = (pid: string) => projects.find(p => p.id === pid)?.name || 'Unknown Website';

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex flex-col">
      <div className="border-b border-white/[0.06] bg-[#0d0f14] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard/website-builder')} className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Website Leads</h1>
              <p className="text-xs text-gray-500">Contact form submissions from your websites</p>
            </div>
            {newCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{newCount} new</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium transition-colors disabled:opacity-40">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 flex-1 w-full">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
              {projects.length > 1 && (
                <div className="relative">
                  <select
                    value={projectFilter}
                    onChange={e => setProjectFilter(e.target.value)}
                    className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                  >
                    <option value="all">All Websites</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-300 mb-1">{leads.length === 0 ? 'No leads yet' : 'No results found'}</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                {leads.length === 0 ? 'When visitors fill out contact forms on your published websites, their submissions will appear here.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  className={`relative group flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedLead?.id === lead.id
                      ? 'bg-white/[0.06] border-white/[0.15]'
                      : 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.045] hover:border-white/[0.10]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm uppercase ${lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.06] text-gray-400'}`}>
                    {lead.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{lead.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[lead.status].color}`}>
                          {STATUS_CONFIG[lead.status].label}
                        </span>
                        {lead.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />}
                      </div>
                      <span className="text-[11px] text-gray-600 shrink-0">{formatDate(lead.submitted_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                    </div>
                    {lead.message && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{lead.message}</p>
                    )}
                    <div className="mt-1.5 text-[10px] text-gray-600 font-medium">
                      {projectName(lead.project_id)} · {lead.section_label}
                    </div>
                  </div>

                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActionMenuId(actionMenuId === lead.id ? null : lead.id)}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {actionMenuId === lead.id && (
                      <div className="absolute right-0 top-8 z-30 bg-[#1a1d24] border border-white/[0.1] rounded-xl shadow-2xl py-1 min-w-[160px]">
                        {(['new', 'read', 'contacted', 'closed'] as Lead['status'][]).map(s => (
                          <button key={s} onClick={() => updateStatus(lead.id, s)} className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] transition-colors flex items-center justify-between gap-2">
                            <span>{STATUS_CONFIG[s].label}</span>
                            {lead.status === s && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                          </button>
                        ))}
                        <div className="border-t border-white/[0.06] my-1" />
                        <button onClick={() => deleteLead(lead.id)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedLead && (
          <div className="lg:w-96 shrink-0">
            <div className="bg-[#0d0f14] border border-white/[0.08] rounded-2xl overflow-hidden sticky top-24">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-sm text-white">Lead Details</span>
                </div>
                <button onClick={() => setSelectedLead(null)} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center font-bold text-lg uppercase text-white">
                    {selectedLead.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selectedLead.name}</div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${STATUS_CONFIG[selectedLead.status].color}`}>
                      {STATUS_CONFIG[selectedLead.status].label}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-colors group">
                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
                    <span className="text-sm text-gray-300 break-all">{selectedLead.email}</span>
                  </a>
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-colors group">
                      <Phone className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
                      <span className="text-sm text-gray-300">{selectedLead.phone}</span>
                    </a>
                  )}
                </div>

                {selectedLead.message && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.03] rounded-xl p-3">{selectedLead.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <div className="text-gray-500 mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" />Submitted</div>
                    <div className="text-white font-medium">{new Date(selectedLead.submitted_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <div className="text-gray-500 mb-1">Source</div>
                    <div className="text-white font-medium truncate">{selectedLead.section_label}</div>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3 text-xs">
                  <div className="text-gray-500 mb-1">Website</div>
                  <div className="text-white font-medium">{projectName(selectedLead.project_id)}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['new', 'read', 'contacted', 'closed'] as Lead['status'][]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedLead.id, s)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedLead.status === s
                            ? STATUS_CONFIG[s].color
                            : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Private Notes</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add private notes about this lead..."
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes || notes === selectedLead.notes}
                    className="mt-2 w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-gray-300 transition-colors disabled:opacity-40"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                <div className="border-t border-white/[0.06] pt-4 flex gap-2">
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs font-semibold text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Reply via Email
                  </a>
                  <button
                    onClick={() => deleteLead(selectedLead.id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {actionMenuId && (
        <div className="fixed inset-0 z-20" onClick={() => setActionMenuId(null)} />
      )}
    </div>
  );
}
