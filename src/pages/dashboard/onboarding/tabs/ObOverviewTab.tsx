import { Phone, Mail, Calendar, User, Briefcase, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../../../lib/format';
import type { Onboarding, OnboardingChecklist, OnboardingDocument, OnboardingActivity } from '../../../../lib/onboarding/types';

interface Props {
  ob: Onboarding;
  checklist: OnboardingChecklist[];
  documents: OnboardingDocument[];
  activities: OnboardingActivity[];
}

export default function ObOverviewTab({ ob, checklist, documents, activities }: Props) {
  const totalChecklist = checklist.length;
  const doneChecklist = checklist.filter((c) => c.is_checked).length;
  const pct = totalChecklist > 0 ? Math.round((doneChecklist / totalChecklist) * 100) : 0;

  const isOverdue = ob.expected_end_date && new Date(ob.expected_end_date) < new Date() && ob.status !== 'Completed' && ob.status !== 'Cancelled';
  const daysLeft = ob.expected_end_date
    ? Math.ceil((new Date(ob.expected_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Checklist Progress</p>
          <p className="text-lg font-bold">{doneChecklist}/{totalChecklist}</p>
          {totalChecklist > 0 && (
            <div className="mt-2 h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Documents</p>
          <p className="text-lg font-bold">{documents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Activities</p>
          <p className="text-lg font-bold">{activities.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">{isOverdue ? 'Overdue By' : 'Days Left'}</p>
          <p className={`text-lg font-bold ${isOverdue ? 'text-red-400' : daysLeft !== null && daysLeft <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
            {daysLeft !== null ? `${Math.abs(daysLeft)} days` : '--'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Contact Details</h3>
          <div className="space-y-2.5 text-sm">
            {ob.phone && (
              <a href={`tel:${ob.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />{ob.phone}
              </a>
            )}
            {ob.email && (
              <a href={`mailto:${ob.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />{ob.email}
              </a>
            )}
            {ob.assigned_to && (
              <div className="flex items-center gap-3"><User className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">Assigned to: {ob.assigned_to}</span></div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Timeline</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500 shrink-0" /><span className="text-gray-300">Started: {formatDate(ob.start_date)}</span></div>
            {ob.expected_end_date && (
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                <span className={isOverdue ? 'text-red-400 font-medium' : 'text-gray-300'}>
                  Expected: {formatDate(ob.expected_end_date)}
                </span>
              </div>
            )}
            {ob.actual_end_date && (
              <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /><span className="text-green-400">Completed: {formatDate(ob.actual_end_date)}</span></div>
            )}
          </div>
        </div>
      </div>

      {ob.welcome_message && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Welcome Message</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ob.welcome_message}</p>
        </div>
      )}

      {ob.internal_notes && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Internal Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ob.internal_notes}</p>
        </div>
      )}

      {checklist.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Checklist Snapshot</h3>
          <div className="space-y-2">
            {checklist.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${c.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                  {c.is_checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${c.is_checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{c.label}</span>
              </div>
            ))}
            {checklist.length > 6 && <p className="text-xs text-gray-500 pl-7">+{checklist.length - 6} more items</p>}
          </div>
        </div>
      )}
    </div>
  );
}
