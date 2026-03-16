import { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { DEMO_CLIENTS } from '../../../lib/agreementBuilder/types';
import type { ClientDetails } from '../../../lib/agreementBuilder/types';
import toast from 'react-hot-toast';

interface DBClient {
  id: string;
  full_name: string;
  company_name: string;
  primary_phone: string;
  primary_email: string;
  street_address: string;
  city: string;
  state: string;
  gstin: string;
  client_type: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (client: ClientDetails) => void;
}

export default function ClientSelectorModal({ open, onClose, onSelect }: Props) {
  const { user } = useAuth();
  const [clients, setClients] = useState<DBClient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) loadClients();
  }, [open, user]);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('id, full_name, company_name, primary_phone, primary_email, street_address, city, state, gstin, client_type')
      .eq('user_id', user!.id)
      .order('full_name');
    setClients(data || []);
    setLoading(false);
  };

  const handleSelectDB = (c: DBClient) => {
    const address = [c.street_address, c.city, c.state].filter(Boolean).join(', ');
    onSelect({
      clientName: c.full_name,
      companyName: c.company_name || '',
      phone: c.primary_phone || '',
      email: c.primary_email || '',
      address,
      gstin: c.gstin || '',
      signatoryName: c.full_name,
      designation: '',
      customFieldValues: {},
    });
    toast.success('Client loaded');
    onClose();
  };

  const handleSelectDemo = (d: typeof DEMO_CLIENTS[0]) => {
    onSelect({
      clientName: d.clientName,
      companyName: d.companyName,
      phone: d.phone,
      email: '',
      address: d.address,
      gstin: d.gstin,
      signatoryName: d.signatoryName,
      designation: d.designation,
      customFieldValues: {},
    });
    toast.success('Client loaded');
    onClose();
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || (c.company_name || '').toLowerCase().includes(q);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Select Client</h3>
              <p className="text-xs text-gray-500">Choose from your clients or demo data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-3 py-2.5 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {filtered.length > 0 ? (
                <>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Clients ({filtered.length})</p>
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectDB(c)}
                      className="w-full text-left p-4 rounded-xl border border-[#1e1e2e] hover:border-[#FF6B00]/30 bg-[#0d0d1a] hover:bg-[#FF6B00]/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white text-sm">{c.full_name}</p>
                          {c.company_name && <p className="text-xs text-gray-400">{c.company_name}</p>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FF6B00]/10 text-[#FF6B00]">{c.client_type}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {c.primary_phone && <span>{c.primary_phone}</span>}
                        {c.city && <span>{c.city}</span>}
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No matching clients found</p>
              )}

              {clients.length === 0 && (
                <>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Demo Clients</p>
                  {DEMO_CLIENTS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDemo(d)}
                      className="w-full text-left p-4 rounded-xl border border-[#1e1e2e] hover:border-[#FF6B00]/30 bg-[#0d0d1a] hover:bg-[#FF6B00]/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white text-sm">{d.clientName}</p>
                          {d.companyName && <p className="text-xs text-gray-400">{d.companyName}</p>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400">{d.tag}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {d.phone && <span>{d.phone}</span>}
                        <span>{d.address}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
