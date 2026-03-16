import { useState, useEffect } from 'react';
import { Phone, Mail, Globe, MapPin, Building2, FileText, Calendar, CreditCard, MessageCircle, TrendingUp, FolderKanban, DollarSign, Clock, ChevronDown, ChevronUp, CreditCard as Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import type { Client, ClientInteraction } from '../../../../lib/clients/types';

interface Props {
  client: Client;
  interactions: ClientInteraction[];
}

interface ClientStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export default function ClientOverviewTab({ client, interactions }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const lastInteraction = interactions[0];
  const daysSinceContact = lastInteraction
    ? Math.floor((Date.now() - new Date(lastInteraction.interaction_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  useEffect(() => {
    if (!user) return;
    const name = client.full_name.toLowerCase().trim();
    const company = client.company_name?.toLowerCase().trim();

    Promise.all([
      supabase.from('projects').select('id, name, status, revenue, budget').eq('user_id', user.id),
      supabase.from('invoices').select('id, status, total, due_date').eq('user_id', user.id),
    ]).then(([pRes, iRes]) => {
      const projects = (pRes.data || []).filter((p: { client_name: string }) =>
        p.client_name?.toLowerCase().trim() === name || (company && p.client_name?.toLowerCase().trim() === company)
      );
      const invoices = (iRes.data || []).filter((i: { to_client_name: string }) =>
        i.to_client_name?.toLowerCase().trim() === name || (company && i.to_client_name?.toLowerCase().trim() === company)
      );

      const totalRevenue = invoices.reduce((s: number, i: { total: number }) => s + Number(i.total || 0), 0);
      const paidInvoices = invoices.filter((i: { status: string }) => i.status === 'paid');
      const paidAmount = paidInvoices.reduce((s: number, i: { total: number }) => s + Number(i.total || 0), 0);
      const overdueInvoices = invoices.filter((i: { status: string; due_date: string }) =>
        i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()
      );

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter((p: { status: string }) => p.status === 'Active').length,
        completedProjects: projects.filter((p: { status: string }) => p.status === 'Completed').length,
        totalRevenue,
        paidAmount,
        pendingAmount: totalRevenue - paidAmount,
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        overdueInvoices: overdueInvoices.length,
      });
    });
  }, [user, client]);

  const hasBankDetails = client.bank_name || client.account_number || client.upi_id;

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => navigate('/dashboard/projects')} className="glass-card rounded-xl p-4 text-left hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs text-gray-500">Projects</p>
            </div>
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.totalProjects}</p>
            {stats.activeProjects > 0 && <p className="text-xs text-emerald-400 mt-0.5">{stats.activeProjects} active</p>}
          </button>
          <button onClick={() => navigate('/dashboard/invoices')} className="glass-card rounded-xl p-4 text-left hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <p className="text-xs text-gray-500">Invoices</p>
            </div>
            <p className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">{stats.totalInvoices}</p>
            {stats.overdueInvoices > 0 && <p className="text-xs text-red-400 mt-0.5">{stats.overdueInvoices} overdue</p>}
          </button>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
            <p className="text-lg font-bold text-white">{formatINR(stats.totalRevenue)}</p>
            <p className="text-xs text-emerald-400 mt-0.5">{formatINR(stats.paidAmount)} paid</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <p className="text-lg font-bold text-white">{formatINR(stats.pendingAmount)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stats.totalInvoices - stats.paidInvoices} unpaid</p>
          </div>
        </div>
      )}

      {daysSinceContact !== null && (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
          daysSinceContact <= 7 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          daysSinceContact <= 30 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
          'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Last contact {daysSinceContact === 0 ? 'today' : `${daysSinceContact} day${daysSinceContact !== 1 ? 's' : ''} ago`}
            {lastInteraction && ` via ${lastInteraction.interaction_type}`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Contact Information</h3>
          <div className="space-y-2.5 text-sm">
            {client.primary_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <a href={`tel:${client.primary_phone}`} className="text-white hover:text-brand-400 transition-colors">{client.primary_phone}</a>
                {client.secondary_phone && <span className="text-gray-500 text-xs">/ {client.secondary_phone}</span>}
              </div>
            )}
            {client.whatsapp_number && (
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href={`https://wa.me/${client.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank\" rel="noopener noreferrer\" className="text-emerald-400 hover:text-emerald-300 transition-colors">{client.whatsapp_number}</a>
              </div>
            )}
            {client.primary_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <a href={`mailto:${client.primary_email}`} className="text-white hover:text-brand-400 transition-colors truncate">{client.primary_email}</a>
              </div>
            )}
            {client.secondary_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500 shrink-0 opacity-50" />
                <span className="text-gray-400 truncate">{client.secondary_email}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors truncate">{client.website}</a>
              </div>
            )}
            {(client.city || client.state) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">{[client.street_address, client.city, client.state, client.pincode, client.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Business Details</h3>
          <div className="space-y-2.5 text-sm">
            {client.industry_type && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">{client.industry_type}</span>
              </div>
            )}
            {client.gstin && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">GSTIN</span>
                  <p className="text-gray-200 font-mono text-sm">{client.gstin}</p>
                </div>
              </div>
            )}
            {client.pan_number && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">PAN</span>
                  <p className="text-gray-200 font-mono text-sm">{client.pan_number}</p>
                </div>
              </div>
            )}
            {client.annual_budget_range && (
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Annual Budget</span>
                  <p className="text-gray-200 text-sm">{client.annual_budget_range}</p>
                </div>
              </div>
            )}
            {client.source && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Source</span>
                  <p className="text-gray-200 text-sm">{client.source}{client.referral_name ? ` (${client.referral_name})` : ''}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <span className="text-gray-500 text-xs">Client Since</span>
                <p className="text-gray-200 text-sm">{formatDate(client.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasBankDetails && (
        <div className="glass-card rounded-xl overflow-hidden">
          <button
            onClick={() => setShowBankDetails(!showBankDetails)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Bank & Payment Details</h3>
            </div>
            {showBankDetails ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showBankDetails && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {client.bank_name && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Bank</p>
                  <p className="text-gray-200">{client.bank_name}</p>
                </div>
              )}
              {client.account_holder_name && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Account Holder</p>
                  <p className="text-gray-200">{client.account_holder_name}</p>
                </div>
              )}
              {client.account_number && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
                  <p className="text-gray-200 font-mono">{client.account_number}</p>
                </div>
              )}
              {client.ifsc_code && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">IFSC Code</p>
                  <p className="text-gray-200 font-mono">{client.ifsc_code}</p>
                </div>
              )}
              {client.upi_id && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">UPI ID</p>
                  <p className="text-gray-200">{client.upi_id}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {client.internal_notes && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Internal Notes</h3>
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{client.internal_notes}</p>
        </div>
      )}

      {interactions.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Recent Interactions</h3>
          <div className="space-y-3">
            {interactions.slice(0, 5).map((interaction, i) => (
              <div key={interaction.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    interaction.interaction_type === 'Call' ? 'bg-green-500/15 text-green-400' :
                    interaction.interaction_type === 'Email' ? 'bg-blue-500/15 text-blue-400' :
                    interaction.interaction_type === 'Meeting' ? 'bg-orange-500/15 text-orange-400' :
                    interaction.interaction_type === 'WhatsApp' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>
                    {interaction.interaction_type[0]}
                  </div>
                  {i < Math.min(interactions.length, 5) - 1 && <div className="w-px flex-1 bg-white/5 min-h-[12px] mt-1" />}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{interaction.interaction_type}</span>
                    <span className="text-xs text-gray-600 shrink-0">{formatDate(interaction.interaction_date)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{interaction.description}</p>
                </div>
              </div>
            ))}
          </div>
          {interactions.length > 5 && (
            <p className="text-xs text-gray-600 mt-2 text-center">{interactions.length - 5} more in Interactions tab</p>
          )}
        </div>
      )}
    </div>
  );
}
