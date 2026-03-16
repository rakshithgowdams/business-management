import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import { APPRAISAL_STATUS_COLORS } from '../../../../lib/hr/constants';
import type { Appraisal } from '../../../../lib/hr/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

export default function AppraisalsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('hr_appraisals')
      .select('*, emp:employees!hr_appraisals_employee_id_fkey(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAppraisals((data || []).map((a) => ({ ...a, employee_name: (a.emp as any)?.full_name || '' })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('hr_appraisals').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Appraisal deleted');
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('..')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Appraisals & Increments</h2>
            <p className="text-sm text-gray-500">{appraisals.length} records</p>
          </div>
        </div>
        <button
          onClick={() => navigate('new')}
          className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Appraisal
        </button>
      </div>

      {appraisals.length === 0 ? (
        <div className="text-center py-16">
          <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No appraisals yet</p>
          <p className="text-sm text-gray-500 mb-6">Record salary increments, promotions, and bonuses.</p>
          <button onClick={() => navigate('new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold">
            Create Appraisal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appraisals.map((appraisal) => (
            <div key={appraisal.id} className="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{appraisal.employee_name}</p>
                    <span className="text-xs text-gray-400">· {appraisal.appraisal_type}</span>
                    <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium ${APPRAISAL_STATUS_COLORS[appraisal.status] || ''}`}>
                      {appraisal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    {appraisal.increment_percentage > 0 && (
                      <span className="text-emerald-400 font-medium">+{appraisal.increment_percentage}%</span>
                    )}
                    {appraisal.new_salary > 0 && (
                      <span className="text-gray-300">{formatINR(appraisal.new_salary)}/mo</span>
                    )}
                    {appraisal.bonus_amount > 0 && (
                      <span className="text-yellow-400">Bonus: {formatINR(appraisal.bonus_amount)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Effective: {formatDate(appraisal.effective_date)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigate(`${appraisal.id}/edit`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(appraisal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Appraisal"
        message="Delete this appraisal record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
