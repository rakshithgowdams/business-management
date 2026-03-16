import { useEffect, useState, useCallback } from 'react';
import { Plus, Power, PowerOff, Trash2, ChevronRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface SequenceStep {
  day: number;
  channel: string;
  action: string;
}

interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  active: boolean;
  builtin: boolean;
  builtin_key: string;
}

const PREBUILT_SEEDS: { builtin_key: string; name: string; steps: SequenceStep[] }[] = [
  {
    builtin_key: 'seq-invoice',
    name: 'Invoice Overdue',
    steps: [
      { day: 3, channel: 'WhatsApp', action: 'Gentle payment reminder' },
      { day: 7, channel: 'Email', action: 'Formal payment follow-up' },
      { day: 14, channel: 'WhatsApp', action: 'Final reminder with urgency' },
      { day: 21, channel: 'Email', action: 'Escalation notice' },
    ],
  },
  {
    builtin_key: 'seq-proposal',
    name: 'Proposal Follow-up',
    steps: [
      { day: 3, channel: 'WhatsApp', action: 'Check if they reviewed the proposal' },
      { day: 7, channel: 'Email', action: 'Address concerns, offer call' },
      { day: 14, channel: 'LinkedIn', action: 'Final follow-up with deadline' },
    ],
  },
  {
    builtin_key: 'seq-coldlead',
    name: 'Cold Lead Nurture',
    steps: [
      { day: 7, channel: 'WhatsApp', action: 'Value-add message or industry insight' },
      { day: 14, channel: 'Email', action: 'Case study or portfolio share' },
      { day: 21, channel: 'LinkedIn', action: 'Reconnect with relevant content' },
    ],
  },
  {
    builtin_key: 'seq-postproject',
    name: 'Post-Project',
    steps: [
      { day: 3, channel: 'WhatsApp', action: 'Thank you + feedback request' },
      { day: 14, channel: 'Email', action: 'Testimonial request' },
      { day: 30, channel: 'WhatsApp', action: 'Upsell or referral ask' },
    ],
  },
  {
    builtin_key: 'seq-anniversary',
    name: 'Client Anniversary',
    steps: [
      { day: 0, channel: 'WhatsApp', action: 'Anniversary celebration message' },
    ],
  },
];

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'text-green-400',
  Email: 'text-blue-400',
  LinkedIn: 'text-sky-400',
};

export default function SequenceBuilder() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', steps: [{ day: 1, channel: 'WhatsApp', action: '' }] });
  const [saving, setSaving] = useState(false);

  const loadSequences = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('followup_sequences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load sequences');
        return;
      }

      const parseSteps = (raw: unknown): SequenceStep[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch { /* ignore */ }
        }
        return [];
      };

      const mapRow = (d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        steps: parseSteps(d.steps),
        active: d.active as boolean,
        builtin: d.builtin as boolean,
        builtin_key: (d.builtin_key as string) || '',
      });

      if (data && data.length > 0) {
        setSequences(data.map(mapRow));
      } else {
        const inserts = PREBUILT_SEEDS.map((s) => ({
          user_id: user.id,
          name: s.name,
          steps: s.steps,
          active: false,
          builtin: true,
          builtin_key: s.builtin_key,
        }));
        const { data: inserted, error: seedErr } = await supabase
          .from('followup_sequences')
          .insert(inserts)
          .select();
        if (!seedErr && inserted) {
          setSequences(inserted.map(mapRow));
        } else {
          setSequences(PREBUILT_SEEDS.map((s, i) => ({
            id: `local-${i}`,
            name: s.name,
            steps: s.steps,
            active: false,
            builtin: true,
            builtin_key: s.builtin_key,
          })));
        }
      }
    } catch {
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSequences();
  }, [loadSequences]);

  const toggleActive = async (id: string) => {
    const seq = sequences.find((s) => s.id === id);
    if (!seq) return;
    const newActive = !seq.active;
    const { error } = await supabase
      .from('followup_sequences')
      .update({ active: newActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update sequence');
      return;
    }
    setSequences((prev) => prev.map((s) => (s.id === id ? { ...s, active: newActive } : s)));
    toast.success(`${seq.name} ${newActive ? 'activated' : 'deactivated'}`);
  };

  const removeCustom = async (id: string) => {
    const { error } = await supabase.from('followup_sequences').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove sequence');
      return;
    }
    setSequences((prev) => prev.filter((s) => s.id !== id));
    toast.success('Sequence removed');
  };

  const addStep = () => {
    setForm((f) => ({ ...f, steps: [...f.steps, { day: f.steps.length * 3 + 1, channel: 'WhatsApp', action: '' }] }));
  };

  const removeStep = (idx: number) => {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));
  };

  const updateStep = (idx: number, field: keyof SequenceStep, val: string | number) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, i) => (i === idx ? { ...s, [field]: val } : s)),
    }));
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Sequence name required'); return; }
    if (form.steps.some((s) => !s.action.trim())) { toast.error('All steps need an action'); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from('followup_sequences')
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        steps: form.steps,
        active: true,
        builtin: false,
        builtin_key: '',
      })
      .select()
      .maybeSingle();

    setSaving(false);

    if (error || !data) {
      toast.error('Failed to create sequence');
      return;
    }

    setSequences((prev) => [...prev, {
      id: data.id,
      name: data.name,
      steps: data.steps as SequenceStep[],
      active: data.active,
      builtin: data.builtin,
      builtin_key: data.builtin_key || '',
    }]);
    toast.success('Custom sequence created');
    setForm({ name: '', steps: [{ day: 1, channel: 'WhatsApp', action: '' }] });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading sequences...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Follow-up Sequences</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Create Custom Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.map((seq) => (
          <div key={seq.id} className="glass-card glass-card-hover rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">{seq.name}</h4>
              <div className="flex items-center gap-1.5">
                {!seq.builtin && (
                  <button onClick={() => removeCustom(seq.id)} className="p-1 rounded hover:bg-[#1f1f1f] text-gray-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => toggleActive(seq.id)}
                  className={`p-1.5 rounded-lg transition-colors ${seq.active ? 'bg-green-500/10 text-green-400' : 'bg-[#1f1f1f] text-gray-500'}`}
                >
                  {seq.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {seq.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-10 flex-shrink-0">Day {step.day}</span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className={`font-medium ${CHANNEL_COLORS[step.channel] || 'text-gray-400'}`}>
                    {step.channel}
                  </span>
                  <span className="text-gray-400 truncate">{step.action}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${seq.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                {seq.active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-[10px] text-gray-600">{seq.steps.length} steps</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-5 space-y-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">New Custom Sequence</h4>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-[#1f1f1f] text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Sequence name..."
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          />
          <div className="space-y-2">
            {form.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  value={step.day}
                  onChange={(e) => updateStep(i, 'day', Number(e.target.value))}
                  className="w-16 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  placeholder="Day"
                  min={0}
                />
                <select
                  value={step.channel}
                  onChange={(e) => updateStep(i, 'channel', e.target.value)}
                  className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>LinkedIn</option>
                </select>
                <input
                  value={step.action}
                  onChange={(e) => updateStep(i, 'action', e.target.value)}
                  placeholder="Action description..."
                  className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                />
                {form.steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="p-1 text-gray-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={addStep} className="text-xs text-orange-400 hover:text-orange-300">
              + Add Step
            </button>
            <div className="flex-1" />
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-lg bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a]">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Sequence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
