import { useState } from 'react';
import { Plus, X, Phone, Mail, Users, MessageCircle, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { INTERACTION_TYPES } from '../../../../lib/clients/constants';
import type { ClientInteraction } from '../../../../lib/clients/types';

const ICONS: Record<string, React.ReactNode> = {
  Call: <Phone className="w-4 h-4" />,
  Email: <Mail className="w-4 h-4" />,
  Meeting: <Users className="w-4 h-4" />,
  WhatsApp: <MessageCircle className="w-4 h-4" />,
  Note: <FileText className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-green-500/10 text-green-400',
  Email: 'bg-blue-500/10 text-blue-400',
  Meeting: 'bg-amber-500/10 text-amber-400',
  WhatsApp: 'bg-emerald-500/10 text-emerald-400',
  Note: 'bg-gray-500/10 text-gray-400',
};

interface Props {
  clientId: string;
  interactions: ClientInteraction[];
  onRefresh: () => void;
}

export default function ClientInteractionsTab({ clientId, interactions, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    interaction_type: 'Call' as string,
    description: '',
    interaction_date: new Date().toISOString().slice(0, 16),
    follow_up_date: '',
  });

  const resetForm = () => {
    setShowForm(false);
    setForm({ interaction_type: 'Call', description: '', interaction_date: new Date().toISOString().slice(0, 16), follow_up_date: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Description is required'); return; }

    const { error } = await supabase.from('client_interactions').insert({
      client_id: clientId,
      user_id: user!.id,
      interaction_type: form.interaction_type,
      description: form.description.trim(),
      interaction_date: form.interaction_date,
      follow_up_date: form.follow_up_date || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Interaction logged');
    resetForm();
    onRefresh();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interactions</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Interaction
        </button>
      </div>

      {interactions.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
          No interactions logged yet. Add your first interaction to start tracking.
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((item) => {
            const isFollowUpDue = item.follow_up_date && item.follow_up_date <= today;
            return (
              <div key={item.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${TYPE_COLORS[item.interaction_type] || TYPE_COLORS.Note} flex items-center justify-center shrink-0`}>
                  {ICONS[item.interaction_type] || ICONS.Note}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{item.interaction_type}</span>
                    <span className="text-xs text-gray-600">{new Date(item.interaction_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {isFollowUpDue && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <AlertCircle className="w-3 h-3" /> Follow-up due
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                  {item.follow_up_date && (
                    <p className="text-xs text-gray-500 mt-1">Follow-up: {new Date(item.follow_up_date).toLocaleDateString('en-IN')}</p>
                  )}
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
              <h2 className="text-lg font-semibold">Log Interaction</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={form.interaction_type} onChange={(e) => setForm({ ...form, interaction_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {INTERACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                <input type="datetime-local" value={form.interaction_date} onChange={(e) => setForm({ ...form, interaction_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none" placeholder="What happened during this interaction?" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Follow-up Date (optional)</label>
                <input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Log Interaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
