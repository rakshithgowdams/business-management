import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { OnboardingChecklist } from '../../../../lib/onboarding/types';

interface Props {
  obId: string;
  checklist: OnboardingChecklist[];
  onRefresh: () => void;
}

export default function ObChecklistTab({ obId, checklist, onRefresh }: Props) {
  const { user } = useAuth();
  const [newItem, setNewItem] = useState('');

  const totalItems = checklist.length;
  const doneItems = checklist.filter((c) => c.is_checked).length;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const toggleItem = async (item: OnboardingChecklist) => {
    const newChecked = !item.is_checked;
    await supabase.from('onboarding_checklist').update({
      is_checked: newChecked,
      checked_at: newChecked ? new Date().toISOString() : null,
    }).eq('id', item.id);
    onRefresh();
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const maxOrder = checklist.length > 0 ? Math.max(...checklist.map((c) => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from('onboarding_checklist').insert({
      onboarding_id: obId, user_id: user!.id, label: newItem.trim(),
      sort_order: maxOrder, is_checked: false,
    });
    if (error) { toast.error(error.message); return; }
    setNewItem('');
    onRefresh();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('onboarding_checklist').delete().eq('id', id);
    toast.success('Item removed');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklist ({doneItems}/{totalItems})</h3>
        <span className="text-sm text-gray-500">{pct}% complete</span>
      </div>

      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {checklist.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No checklist items. Add some below.</div>
      ) : (
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${item.is_checked ? 'opacity-60' : ''}`}>
              <GripVertical className="w-4 h-4 text-gray-600 shrink-0 cursor-grab" />
              <button onClick={() => toggleItem(item)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-brand-500'
              }`}>
                {item.is_checked && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-500' : 'text-white'}`}>{item.label}</span>
              <button onClick={() => deleteItem(item.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }} placeholder="Add new checklist item..." className="flex-1 px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        <button onClick={addItem} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}
