import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, TrendingUp, Pencil, Trash2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../lib/format';
import { REVIEW_STATUS_COLORS, RATING_LABELS, RATING_COLORS } from '../../../../lib/hr/constants';
import type { PerformanceReview } from '../../../../lib/hr/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

export default function PerformanceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('hr_performance_reviews')
      .select('*, emp:employees!hr_performance_reviews_employee_id_fkey(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setReviews((data || []).map((r) => ({ ...r, employee_name: (r.emp as any)?.full_name || '' })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('hr_performance_reviews').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Review deleted');
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Performance Reviews</h2>
          <p className="text-sm text-gray-500">{reviews.length} reviews</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('appraisals')}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm flex items-center gap-2"
          >
            <Award className="w-4 h-4" /> Appraisals
          </button>
          <button
            onClick={() => navigate('reviews/new')}
            className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Review
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No performance reviews</p>
          <p className="text-sm text-gray-500 mb-6">Start evaluating your team's performance.</p>
          <button onClick={() => navigate('reviews/new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold">
            Create Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-white">{review.employee_name}</p>
                  <p className="text-sm text-gray-400">{review.review_type} Review · {review.review_period}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-lg border font-medium ${REVIEW_STATUS_COLORS[review.status] || ''}`}>
                  {review.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'Overall', value: review.overall_rating, isRating: true },
                  { label: 'Performance', value: review.performance_score, isRating: false, suffix: '%' },
                  { label: 'Goals', value: review.goals_achieved, isRating: false, suffix: '%' },
                ].map((m) => (
                  <div key={m.label} className="bg-dark-700/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">{m.label}</p>
                    {m.isRating ? (
                      <p className={`text-sm font-bold ${RATING_COLORS[m.value as number] || 'text-white'}`}>
                        {RATING_LABELS[m.value as number] || m.value}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-white">{m.value}{m.suffix}</p>
                    )}
                  </div>
                ))}
              </div>

              {review.review_date && (
                <p className="text-xs text-gray-500 mb-3">Review Date: {formatDate(review.review_date)}</p>
              )}

              <div className="flex items-center gap-1 pt-3 border-t border-white/5">
                <button onClick={() => navigate(`reviews/${review.id}/edit`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(review.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Review"
        message="Delete this performance review?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
