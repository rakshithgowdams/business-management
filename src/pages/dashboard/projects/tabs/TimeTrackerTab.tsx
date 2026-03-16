import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import type { ProjectTimeEntry } from '../../../../lib/projects/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface Props {
  projectId: string;
  timeEntries: ProjectTimeEntry[];
  totalSpent: number;
  onRefresh: () => void;
}

export default function TimeTrackerTab({ projectId, timeEntries, totalSpent, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProjectTimeEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    task_description: '',
    hours: '',
    member_name: '',
  });

  const totalHours = timeEntries.reduce((s, t) => s + t.hours, 0);
  const effectiveRate = totalHours > 0 ? totalSpent / totalHours : 0;

  const memberSummary = useMemo(() => {
    const map = new Map<string, number>();
    timeEntries.forEach((t) => {
      map.set(t.member_name, (map.get(t.member_name) || 0) + t.hours);
    });
    return Array.from(map.entries()).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours);
  }, [timeEntries]);

  const weeklyData = useMemo(() => {
    if (timeEntries.length === 0) return [];
    const weekMap = new Map<string, number>();
    timeEntries.forEach((t) => {
      const d = new Date(t.date);
      const dayOfWeek = d.getDay();
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dayOfWeek);
      const key = weekStart.toISOString().split('T')[0];
      weekMap.set(key, (weekMap.get(key) || 0) + t.hours);
    });
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, hours]) => ({
        week: new Date(week).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        hours,
      }));
  }, [timeEntries]);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ date: new Date().toISOString().split('T')[0], task_description: '', hours: '', member_name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.task_description.trim()) { toast.error('Task description is required'); return; }
    if (!form.hours || Number(form.hours) <= 0) { toast.error('Enter valid hours'); return; }
    if (!form.member_name.trim()) { toast.error('Member name is required'); return; }

    const payload = {
      date: form.date,
      task_description: form.task_description.trim(),
      hours: Number(form.hours),
      member_name: form.member_name.trim(),
    };

    if (editing) {
      const { error } = await supabase.from('project_time_entries').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Updated');
    } else {
      const { error } = await supabase.from('project_time_entries').insert({ ...payload, project_id: projectId, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Time entry added');
    }
    resetForm();
    onRefresh();
  };

  const handleEdit = (t: ProjectTimeEntry) => {
    setEditing(t);
    setForm({ date: t.date, task_description: t.task_description, hours: String(t.hours), member_name: t.member_name });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('project_time_entries').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Deleted');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>

      {timeEntries.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium text-right">Hours</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-400">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 max-w-[250px] truncate">{t.task_description}</td>
                    <td className="px-4 py-3 text-right font-medium">{t.hours}h</td>
                    <td className="px-4 py-3 text-gray-400">{t.member_name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Hours</p>
              <p className="text-lg font-bold">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Spend</p>
              <p className="text-lg font-bold text-orange-400">{formatINR(totalSpent)}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Eff. Rate/hr</p>
              <p className="text-lg font-bold text-brand-400">{formatINR(effectiveRate)}</p>
            </div>
          </div>

          {memberSummary.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Hours per Member</h3>
              <div className="space-y-2">
                {memberSummary.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{m.name}</span>
                    <span className="font-medium">{m.hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {weeklyData.length > 0 && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Weekly Hours</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="week" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }} />
                  <Bar dataKey="hours" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {timeEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">No time entries yet. Click "Log Time" to start tracking.</div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Time Entry' : 'Log Time'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Task Description *</label>
                <input type="text" value={form.task_description} onChange={(e) => setForm({ ...form, task_description: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Frontend UI development" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hours *</label>
                <input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. 2.5" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Member *</label>
                <input type="text" value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editing ? 'Update' : 'Log Time'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Time Entry" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
