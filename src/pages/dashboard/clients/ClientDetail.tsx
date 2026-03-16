import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, Mail, MessageCircle, Bot } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { CLIENT_STATUS_COLORS, CLIENT_TYPE_COLORS, getInitials, getAvatarColor } from '../../../lib/clients/constants';
import type { Client, ClientInteraction } from '../../../lib/clients/types';
import ClientOverviewTab from './tabs/ClientOverviewTab';
import ClientProjectsTab from './tabs/ClientProjectsTab';
import ClientInvoicesTab from './tabs/ClientInvoicesTab';
import ClientInteractionsTab from './tabs/ClientInteractionsTab';
import ClientRelationshipTab from './tabs/ClientRelationshipTab';

const TABS = ['Overview', 'Projects', 'Invoices', 'Interactions', 'Relationship'] as const;
type TabType = typeof TABS[number];

export default function ClientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    const [cRes, iRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('client_interactions').select('*').eq('client_id', id).order('interaction_date', { ascending: false }),
    ]);
    if (!cRes.data) { navigate('/dashboard/clients'); return; }
    setClient(cRes.data as Client);
    setInteractions((iRes.data || []) as ClientInteraction[]);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading || !client) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const whatsappNum = (client.whatsapp_number || client.primary_phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/dashboard/clients')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white mt-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(client.full_name)} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
            {getInitials(client.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.full_name}</h1>
            {client.company_name && <p className="text-gray-400">{client.company_name}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-md border ${CLIENT_TYPE_COLORS[client.client_type] || ''}`}>{client.client_type}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${CLIENT_STATUS_COLORS[client.status] || ''}`}>{client.status}</span>
              {client.tags && client.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-dark-600 text-gray-400">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {client.primary_phone && (
            <a href={`tel:${client.primary_phone}`} className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Call">
              <Phone className="w-5 h-5" />
            </a>
          )}
          {whatsappNum && (
            <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
          {client.primary_email && (
            <a href={`mailto:${client.primary_email}`} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Email">
              <Mail className="w-5 h-5" />
            </a>
          )}
          <button onClick={() => navigate(`/dashboard/ai-intelligence?clientId=${id}`)} className="px-4 py-2.5 rounded-xl border border-brand-500/30 hover:bg-brand-500/5 transition-colors flex items-center gap-2 text-sm text-brand-400">
            <Bot className="w-4 h-4" /> AI Analyze
          </button>
          <button onClick={() => navigate(`/dashboard/clients/${id}/edit`)} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <ClientOverviewTab client={client} interactions={interactions} />}
      {activeTab === 'Projects' && <ClientProjectsTab client={client} />}
      {activeTab === 'Invoices' && <ClientInvoicesTab client={client} />}
      {activeTab === 'Interactions' && <ClientInteractionsTab clientId={client.id} interactions={interactions} onRefresh={loadAll} />}
      {activeTab === 'Relationship' && <ClientRelationshipTab client={client} interactions={interactions} onRefresh={loadAll} />}
    </div>
  );
}
