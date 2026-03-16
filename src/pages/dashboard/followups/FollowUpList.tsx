import { useEffect, useState } from 'react';
import {
  FileWarning,
  FileText,
  UserX,
  FolderCheck,
  Cake,
  Eye,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../lib/format';

export interface FollowUpItem {
  id: string;
  type: 'invoice_overdue' | 'proposal_followup' | 'cold_lead' | 'project_completed' | 'client_anniversary';
  clientName: string;
  detail: string;
  amount?: number;
  daysSince: number;
  tier: string;
  phone?: string;
  email?: string;
}

const TIER_COLORS: Record<string, string> = {
  gentle: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  firm: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  final: 'bg-red-500/10 text-red-400 border-red-500/20',
  escalation: 'bg-red-600/10 text-red-500 border-red-600/20',
  initial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reminder: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  nurture: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  reconnect: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  celebrate: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  feedback: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  upsell: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  invoice_overdue: <FileWarning className="w-4 h-4 text-red-400" />,
  proposal_followup: <FileText className="w-4 h-4 text-blue-400" />,
  cold_lead: <UserX className="w-4 h-4 text-yellow-400" />,
  project_completed: <FolderCheck className="w-4 h-4 text-emerald-400" />,
  client_anniversary: <Cake className="w-4 h-4 text-pink-400" />,
};

const TYPE_LABELS: Record<string, string> = {
  invoice_overdue: 'Invoice Overdue',
  proposal_followup: 'Proposal Follow-up',
  cold_lead: 'Cold Lead',
  project_completed: 'Project Completed',
  client_anniversary: 'Client Anniversary',
};

function daysBetween(d1: string, d2: Date): number {
  return Math.floor((d2.getTime() - new Date(d1).getTime()) / 86400000);
}

interface Props {
  onPreview: (item: FollowUpItem) => void;
}

export default function FollowUpList({ onPreview }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) scan();
  }, [user]);

  const scan = async () => {
    setLoading(true);
    try {
    const now = new Date();
    const results: FollowUpItem[] = [];

    const [invRes, quotRes, clientRes, projRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('user_id', user!.id).neq('status', 'paid'),
      supabase.from('quotations').select('*').eq('user_id', user!.id).neq('status', 'accepted'),
      supabase.from('clients').select('*').eq('user_id', user!.id),
      supabase.from('projects').select('*').eq('user_id', user!.id).eq('status', 'Completed'),
    ]);

    for (const inv of invRes.data || []) {
      if (!inv.due_date) continue;
      const days = daysBetween(inv.due_date, now);
      if (days < 3) continue;
      let tier = 'gentle';
      if (days >= 21) tier = 'escalation';
      else if (days >= 14) tier = 'final';
      else if (days >= 7) tier = 'firm';
      results.push({
        id: `inv-${inv.id}`,
        type: 'invoice_overdue',
        clientName: inv.to_client_name || 'Unknown',
        detail: `${inv.invoice_number} - ${formatINR(inv.total)}`,
        amount: inv.total,
        daysSince: days,
        tier,
        email: inv.to_email,
      });
    }

    for (const q of quotRes.data || []) {
      if (!q.quote_date) continue;
      const days = daysBetween(q.quote_date, now);
      if (days < 3) continue;
      let tier = 'initial';
      if (days >= 14) tier = 'closing';
      else if (days >= 7) tier = 'reminder';
      results.push({
        id: `quot-${q.id}`,
        type: 'proposal_followup',
        clientName: q.to_client_name || 'Unknown',
        detail: `${q.quote_number} - ${formatINR(q.total)}`,
        amount: q.total,
        daysSince: days,
        tier,
        email: q.to_email,
      });
    }

    const leads = (clientRes.data || []).filter((c) => c.status === 'Lead');
    if (leads.length > 0) {
      const leadIds = leads.map((l) => l.id);
      const { data: interactions } = await supabase
        .from('client_interactions')
        .select('client_id, interaction_date')
        .eq('user_id', user!.id)
        .in('client_id', leadIds)
        .order('interaction_date', { ascending: false });

      const lastInteraction: Record<string, string> = {};
      for (const i of interactions || []) {
        if (!lastInteraction[i.client_id]) lastInteraction[i.client_id] = i.interaction_date;
      }

      for (const lead of leads) {
        const lastDate = lastInteraction[lead.id] || lead.created_at;
        const days = daysBetween(lastDate, now);
        if (days < 7) continue;
        let tier = 'nurture';
        if (days >= 21) tier = 'reconnect';
        else if (days >= 14) tier = 'reminder';
        results.push({
          id: `lead-${lead.id}`,
          type: 'cold_lead',
          clientName: lead.full_name,
          detail: lead.company_name || 'No company',
          daysSince: days,
          tier,
          phone: lead.whatsapp_number || lead.primary_phone,
          email: lead.primary_email,
        });
      }
    }

    for (const proj of projRes.data || []) {
      const refDate = proj.end_date || proj.updated_at || proj.created_at;
      if (!refDate) continue;
      const days = daysBetween(refDate, now);
      if (days < 3) continue;
      let tier = 'feedback';
      if (days >= 30) tier = 'upsell';
      else if (days >= 14) tier = 'reminder';
      results.push({
        id: `proj-${proj.id}`,
        type: 'project_completed',
        clientName: proj.client_name || 'Unknown',
        detail: proj.name,
        daysSince: days,
        tier,
      });
    }

    for (const c of clientRes.data || []) {
      if (!c.created_at) continue;
      const created = new Date(c.created_at);
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const diff = Math.abs(daysBetween(created.toISOString(), yearAgo));
      if (diff <= 7) {
        results.push({
          id: `ann-${c.id}`,
          type: 'client_anniversary',
          clientName: c.full_name,
          detail: c.company_name || '1 Year Anniversary',
          daysSince: 365,
          tier: 'celebrate',
          phone: c.whatsapp_number || c.primary_phone,
          email: c.primary_email,
        });
      }
    }

    results.sort((a, b) => a.daysSince - b.daysSince);
    setItems(results);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Scanning your data for follow-ups...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
        No follow-ups needed right now. All caught up!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        Action Required Today
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
          {items.length}
        </span>
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1f1f1f] flex items-center justify-center">
              {TYPE_ICONS[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white truncate">{item.clientName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TIER_COLORS[item.tier] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {item.tier}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{TYPE_LABELS[item.type]} - {item.detail}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{item.daysSince}d ago</span>
            <button
              onClick={() => onPreview(item)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
