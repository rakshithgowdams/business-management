import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import type { Client } from '../../../../lib/clients/types';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  overdue: 'bg-red-500/10 text-red-400',
  sent: 'bg-blue-500/10 text-blue-400',
  draft: 'bg-gray-500/10 text-gray-400',
};

interface Props {
  client: Client;
}

export default function ClientInvoicesTab({ client }: Props) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, total, status, to_client_name')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false })
      .then(({ data }) => {
        const matched = (data || []).filter((inv) => {
          const cn = inv.to_client_name?.toLowerCase().trim();
          return cn === client.full_name.toLowerCase().trim() ||
            (client.company_name && cn === client.company_name.toLowerCase().trim());
        });
        setInvoices(matched.map((inv) => ({ ...inv, total: Number(inv.total) })));
        setLoading(false);
      });
  }, [user, client]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invoices ({invoices.length})</h3>

      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
            <p className="text-lg font-bold">{formatINR(totalInvoiced)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Paid</p>
            <p className="text-lg font-bold text-green-400">{formatINR(totalPaid)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-lg font-bold text-orange-400">{formatINR(totalPending)}</p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
          No invoices found for this client.
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-md ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(inv.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
