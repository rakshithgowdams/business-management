import { useState } from 'react';
import { Plus, X, Phone, Mail, MessageCircle, Video, StickyNote, Cog } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../lib/format';
import { ACTIVITY_TYPES } from '../../../../lib/onboarding/constants';
import type { OnboardingActivity } from '../../../../lib/onboarding/types';

interface Props {
  obId: string;
  activities: OnboardingActivity[];
  onRefresh: () => void;
}

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  Call: Phone, Email: Mail, WhatsApp: MessageCircle,
  Meeting: Video, Note: StickyNote, System: Cog,
};

const ACTIVITY_COLORS: Record<string, string> = {
  Call: 'bg-green-500/10 text-green-400',
  Email: 'bg-blue-500/10 text-blue-400',
  WhatsApp: 'bg-emerald-500/10 text-emerald-400',
  Meeting: 'bg-amber-500/10 text-amber-400',
  Note: 'bg-gray-500/10 text-gray-400',
  System: 'bg-brand-500/10 text-brand-400',
};

export default function ObActivityTab({ obId, activities, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    activity_type: 'Note' as string,
    description: '',
    activity_date: new Date().toISOString().split('T')[0],
    follow_up_date: '',
  });

  const resetForm = () => {
    setShowForm(false);
    setForm({ activity_type: 'Note', description: '', activity_date: new Date().toISOString().split('T')[0], follow_up_date: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    const { error } = await supabase.from('onboarding_activities').insert({
      onboarding_id: obId, user_id: user!.id,
      activity_type: form.activity_type,
      description: form.description.trim(),
      activity_date: form.activity_date,
      follow_up_date: form.follow_up_date || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Activity added');
    resetForm();
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity & Notes ({activities.length})</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No activities logged yet.</div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const Icon = ACTIVITY_ICONS[a.activity_type] || StickyNote;
            const color = ACTIVITY_COLORS[a.activity_type] || 'bg-gray-500/10 text-gray-400';
            return (
              <div key={a.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">{a.activity_type}</span>
                    <span className="text-xs text-gray-600">{formatDate(a.activity_date)}</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{a.description}</p>
                  {a.follow_up_date && <p className="text-xs text-amber-400 mt-1.5">Follow-up: {formatDate(a.follow_up_date)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Activity</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Description *</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Date</label><input type="date" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Follow-up Date</label><input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Add Activity</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
