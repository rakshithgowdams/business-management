import { useNavigate } from 'react-router-dom';
import { FileText, FileCheck, ArrowRight, Clock, CheckCircle, Send, AlertTriangle } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface PipelineData {
  invoices: {
    draft: { count: number; amount: number };
    sent: { count: number; amount: number };
    paid: { count: number; amount: number };
    overdue: { count: number; amount: number };
    total: number;
    totalAmount: number;
  };
  quotations: {
    draft: { count: number; amount: number };
    sent: { count: number; amount: number };
    accepted: { count: number; amount: number };
    rejected: { count: number; amount: number };
    total: number;
    totalAmount: number;
    conversionRate: number;
  };
}

function PipelineStep({ icon: Icon, label, count, amount, color, isLast }: {
  icon: React.ElementType;
  label: string;
  count: number;
  amount: number;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-gray-500 text-center">{label}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-white">{count}</p>
        <p className="text-[10px] text-gray-500 truncate">{formatINR(amount)}</p>
      </div>
      {!isLast && (
        <ArrowRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
      )}
    </div>
  );
}

export default function InvoiceQuotationWidget({ data }: { data: PipelineData }) {
  const nav = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all"
        onClick={() => nav('/dashboard/invoices')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Invoice Pipeline</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{data.invoices.total} total</span>
            <span className="text-xs text-gray-600 mx-1.5">|</span>
            <span className="text-xs font-semibold text-blue-400">{formatINR(data.invoices.totalAmount)}</span>
          </div>
        </div>

        <div className="flex items-start gap-1">
          <PipelineStep icon={Clock} label="Draft" count={data.invoices.draft.count} amount={data.invoices.draft.amount} color="bg-gray-500/10 text-gray-400" />
          <PipelineStep icon={Send} label="Sent" count={data.invoices.sent.count} amount={data.invoices.sent.amount} color="bg-blue-500/10 text-blue-400" />
          <PipelineStep icon={CheckCircle} label="Paid" count={data.invoices.paid.count} amount={data.invoices.paid.amount} color="bg-emerald-500/10 text-emerald-400" />
          <PipelineStep icon={AlertTriangle} label="Overdue" count={data.invoices.overdue.count} amount={data.invoices.overdue.amount} color="bg-red-500/10 text-red-400" isLast />
        </div>
      </div>

      <div
        className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all"
        onClick={() => nav('/dashboard/quotations')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Quotation Pipeline</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{data.quotations.total} total</span>
            {data.quotations.conversionRate > 0 && (
              <>
                <span className="text-xs text-gray-600 mx-1.5">|</span>
                <span className="text-xs font-semibold text-emerald-400">{data.quotations.conversionRate.toFixed(0)}% won</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-1">
          <PipelineStep icon={Clock} label="Draft" count={data.quotations.draft.count} amount={data.quotations.draft.amount} color="bg-gray-500/10 text-gray-400" />
          <PipelineStep icon={Send} label="Sent" count={data.quotations.sent.count} amount={data.quotations.sent.amount} color="bg-blue-500/10 text-blue-400" />
          <PipelineStep icon={CheckCircle} label="Won" count={data.quotations.accepted.count} amount={data.quotations.accepted.amount} color="bg-emerald-500/10 text-emerald-400" />
          <PipelineStep icon={AlertTriangle} label="Lost" count={data.quotations.rejected.count} amount={data.quotations.rejected.amount} color="bg-red-500/10 text-red-400" isLast />
        </div>
      </div>
    </div>
  );
}
