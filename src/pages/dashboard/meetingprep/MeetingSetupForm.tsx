import { useState, useEffect } from 'react';
import { Loader2, Brain } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { Client } from '../../../lib/clients/types';

const MEETING_TYPES = [
  'First Discovery Call',
  'Follow-up / Proposal Discussion',
  'Project Review',
  'Payment Discussion',
  'Upsell / New Service',
  'Closing Call',
];

export interface MeetingSetup {
  clientId: string;
  clientName: string;
  meetingType: string;
  date: string;
  time: string;
  notes: string;
}

interface Props {
  onGenerate: (setup: MeetingSetup) => void;
  generating: boolean;
}

export default function MeetingSetupForm({ onGenerate, generating }: Props) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('clients').select('*').eq('user_id', user.id).order('full_name').then(({ data }) => {
      setClients((data || []) as Client[]);
    });
  }, [user]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !selectedClient) return;
    onGenerate({
      clientId,
      clientName: selectedClient.full_name,
      meetingType,
      date,
      time,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-semibold text-white">Prepare for Your Next Meeting</h2>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Select Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 appearance-none"
          required
        >
          <option value="">Choose a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}{c.company_name ? ` — ${c.company_name}` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Meeting Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MEETING_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMeetingType(type)}
              className={`px-3 py-2 rounded-xl text-xs text-left border transition-all ${
                meetingType === type
                  ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                  : 'border-white/5 text-gray-400 hover:border-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Any specific notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Context, concerns, goals for this meeting..."
          className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!clientId || generating}
        className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        {generating ? 'Generating Brief...' : 'Generate Meeting Brief'}
      </button>
    </form>
  );
}
