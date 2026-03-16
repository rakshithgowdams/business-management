import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import { EVENT_TYPES, EVENT_STATUSES, EVENT_STATUS_COLORS } from '../../../../lib/digitalMarketing/constants';
import type { MarketingEvent } from '../../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

const blank = (): Partial<MarketingEvent> => ({
  name: '', event_type: 'Trade Show', status: 'Planned', start_date: '', end_date: '',
  location: '', organizer: '', website: '', stall_cost: 0, travel_cost: 0,
  material_cost: 0, other_cost: 0, total_cost: 0, leads_generated: 0,
  deals_closed: 0, revenue_generated: 0, attendees_count: 0, collateral_distributed: 0, notes: '',
});

export default function EventsManager() {
  const { user } = useAuth();
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<MarketingEvent>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('dm_events').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name?.trim()) { toast.error('Event name required'); return; }
    const total = (form.stall_cost || 0) + (form.travel_cost || 0) + (form.material_cost || 0) + (form.other_cost || 0);
    const payload = { ...form, user_id: user.id, total_cost: total, start_date: form.start_date || null, end_date: form.end_date || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_events').insert(payload)
      : await supabase.from('dm_events').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Event added' : 'Event updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_events').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Event deleted');
    load();
  };

  const startEdit = (e: MarketingEvent) => {
    setForm({ ...e, start_date: e.start_date || '', end_date: e.end_date || '' });
    setEditId(e.id);
  };

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const totalCost = (form.stall_cost || 0) + (form.travel_cost || 0) + (form.material_cost || 0) + (form.other_cost || 0);
  const filtered = events.filter((e) => filterStatus === 'All' || e.status === filterStatus);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{events.length} events</p>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">{editId === 'new' ? 'New Event' : 'Edit Event'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Event Name</label>
              <input type="text" value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="e.g. India SME Expo 2025" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Event Type</label>
              <select value={form.event_type || 'Trade Show'} onChange={(e) => set('event_type', e.target.value)} className={ic}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status || 'Planned'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End Date</label>
              <input type="date" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Location</label>
              <input type="text" value={form.location || ''} onChange={(e) => set('location', e.target.value)} className={ic} placeholder="Mumbai, India" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Organizer</label>
              <input type="text" value={form.organizer || ''} onChange={(e) => set('organizer', e.target.value)} className={ic} />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Costs</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Stall / Booth (₹)', field: 'stall_cost' },
                { label: 'Travel & Stay (₹)', field: 'travel_cost' },
                { label: 'Marketing Material (₹)', field: 'material_cost' },
                { label: 'Other (₹)', field: 'other_cost' },
              ].map((c) => (
                <div key={c.field}>
                  <label className="block text-xs text-gray-400 mb-1">{c.label}</label>
                  <input type="number" min={0} value={(form as any)[c.field] || 0} onChange={(e) => set(c.field, Number(e.target.value))} className={ic} />
                </div>
              ))}
            </div>
            <div className="mt-2 px-3 py-2 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <p className="text-xs text-brand-400">Total Cost: {formatINR(totalCost)}</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Results</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Leads Generated', field: 'leads_generated' },
                { label: 'Deals Closed', field: 'deals_closed' },
                { label: 'Revenue (₹)', field: 'revenue_generated' },
                { label: 'Attendees', field: 'attendees_count' },
              ].map((c) => (
                <div key={c.field}>
                  <label className="block text-xs text-gray-400 mb-1">{c.label}</label>
                  <input type="number" min={0} value={(form as any)[c.field] || 0} onChange={(e) => set(c.field, Number(e.target.value))} className={ic} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} className={ta} placeholder="Key observations, follow-up actions..." />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap">
        {['All', ...EVENT_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No events recorded</p>
          <p className="text-sm text-gray-500 mt-1">Track trade shows, conferences, and exhibitions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event) => {
            const roi = event.total_cost > 0 ? (((event.revenue_generated - event.total_cost) / event.total_cost) * 100).toFixed(0) : null;
            return (
              <div key={event.id} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-white">{event.name}</p>
                    <p className="text-xs text-gray-400">{event.event_type}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium shrink-0 ${EVENT_STATUS_COLORS[event.status] || ''}`}>{event.status}</span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                  {event.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(event.start_date)}</span>}
                  {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  {[
                    { label: 'Cost', value: formatINR(event.total_cost), color: 'text-red-400' },
                    { label: 'Leads', value: event.leads_generated, color: 'text-blue-400' },
                    { label: 'Deals', value: event.deals_closed, color: 'text-emerald-400' },
                    { label: 'ROI', value: roi !== null ? `${roi}%` : '—', color: Number(roi) >= 0 ? 'text-green-400' : 'text-red-400' },
                  ].map((m) => (
                    <div key={m.label} className="bg-dark-700/50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1 pt-3 border-t border-white/5">
                  <button onClick={() => startEdit(event)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(event.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Event" message="Delete this event?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
