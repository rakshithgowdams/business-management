import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { DEFAULT_LEAVE_TYPES } from '../../../../lib/hr/constants';
import type { LeaveType } from '../../../../lib/hr/types';

const inputClass = 'w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500';

const blankType = () => ({
  name: '', code: '', color: '#3b82f6', days_per_year: 12,
  is_paid: true, carry_forward: false, max_carry_forward: 0,
  requires_approval: true, description: '', is_active: true,
});

export default function LeaveTypesManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(blankType());

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('hr_leave_types').select('*').eq('user_id', user.id).order('name');
    setTypes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const seedDefaults = async () => {
    if (!user) return;
    const rows = DEFAULT_LEAVE_TYPES.map((t) => ({ ...t, user_id: user.id, requires_approval: true, description: '', is_active: true }));
    await supabase.from('hr_leave_types').insert(rows);
    toast.success('Default leave types added');
    load();
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code are required'); return; }
    const payload = { ...form, user_id: user.id };
    const { error } = editId === 'new'
      ? await supabase.from('hr_leave_types').insert(payload)
      : await supabase.from('hr_leave_types').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Leave type added' : 'Leave type updated');
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hr_leave_types').delete().eq('id', id);
    toast.success('Leave type deleted');
    load();
  };

  const startEdit = (lt: LeaveType) => {
    setForm({ name: lt.name, code: lt.code, color: lt.color, days_per_year: lt.days_per_year, is_paid: lt.is_paid, carry_forward: lt.carry_forward, max_carry_forward: lt.max_carry_forward, requires_approval: lt.requires_approval, description: lt.description, is_active: lt.is_active });
    setEditId(lt.id);
  };

  const set = (field: string, value: string | number | boolean) => setForm((p) => ({ ...p, [field]: value }));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('..')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Leave Types</h2>
        </div>
        <div className="flex gap-2">
          {types.length === 0 && (
            <button onClick={seedDefaults} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">
              Add Defaults
            </button>
          )}
          <button
            onClick={() => { setForm(blankType()); setEditId('new'); }}
            className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Type
          </button>
        </div>
      </div>

      {(editId === 'new' || editId) && (
        <div className="glass-card rounded-xl p-5 space-y-4 border border-brand-500/20">
          <h3 className="text-sm font-semibold text-gray-300">{editId === 'new' ? 'New Leave Type' : 'Edit Leave Type'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="Casual Leave" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Code</label>
              <input type="text" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={inputClass} placeholder="CL" maxLength={5} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Color</label>
              <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-full h-[38px] rounded-lg border border-white/10 bg-dark-900 cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Days / Year</label>
              <input type="number" min={0} value={form.days_per_year} onChange={(e) => set('days_per_year', Number(e.target.value))} className={inputClass} />
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_paid} onChange={(e) => set('is_paid', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-300">Paid Leave</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.carry_forward} onChange={(e) => set('carry_forward', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-300">Carry Forward</span>
              </label>
            </div>
            {form.carry_forward && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Max Carry Forward Days</label>
                <input type="number" min={0} value={form.max_carry_forward} onChange={(e) => set('max_carry_forward', Number(e.target.value))} className={inputClass} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {types.map((lt) => (
          <div key={lt.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: lt.color }} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white text-sm">{lt.name}</p>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-dark-600 text-gray-400">{lt.code}</span>
                  {!lt.is_paid && <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-400">Unpaid</span>}
                </div>
                <p className="text-xs text-gray-500">{lt.days_per_year} days/year{lt.carry_forward ? ` · carry fwd up to ${lt.max_carry_forward}` : ''}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(lt)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(lt.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {types.length === 0 && !editId && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No leave types configured</p>
            <p className="text-sm text-gray-500">Click "Add Defaults" to add standard leave types or create your own.</p>
          </div>
        )}
      </div>
    </div>
  );
}
