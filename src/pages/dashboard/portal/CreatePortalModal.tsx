import { useState } from 'react';
import { X, Shield, Copy, Check } from 'lucide-react';
import { createPortal } from '../../../lib/portal/api';
import { supabase } from '../../../lib/supabase';
import type { Client } from '../../../lib/clients/types';
import toast from 'react-hot-toast';

interface Props {
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePortalModal({ clients, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ slug: string; code: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Portal name is required'); return; }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await createPortal(name.trim(), clientId || null, token);
      setCreated({
        slug: res.data.portal_slug,
        code: res.data.access_code,
      });
      toast.success('Portal created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create portal');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const portalUrl = created ? `${window.location.origin}/portal/${created.slug}` : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">{created ? 'Portal Created' : 'Create Client Portal'}</h2>
          </div>
          <button onClick={created ? onCreated : onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!created ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Portal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Corp Project Portal"
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Link to Client (Optional)</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none"
                >
                  <option value="">No client linked</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}{c.company_name ? ` (${c.company_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500">
                A unique URL and access code will be auto-generated. You can share these with your client for secure access.
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-sm text-green-400 font-medium mb-3">
                  Portal created successfully. Share these credentials with your client:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Portal URL</label>
                    <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2.5">
                      <span className="text-sm text-gray-300 truncate flex-1 font-mono">{portalUrl}</span>
                      <button
                        onClick={() => handleCopy(portalUrl, 'url')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                      >
                        {copied === 'url' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Access Code</label>
                    <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2.5">
                      <span className="text-sm text-brand-400 flex-1 font-mono font-bold tracking-wider">{created.code}</span>
                      <button
                        onClick={() => handleCopy(created.code, 'code')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                      >
                        {copied === 'code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(`Portal URL: ${portalUrl}\nAccess Code: ${created.code}`, 'both')}
                    className="w-full py-2.5 rounded-xl bg-brand-600/10 text-brand-400 text-sm font-medium hover:bg-brand-600/20 transition-colors"
                  >
                    {copied === 'both' ? 'Copied!' : 'Copy Both to Clipboard'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Save these credentials securely. You can regenerate the access code later from the portal management page.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
          {!created ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !name.trim()}
                className="px-6 py-2 rounded-xl gradient-orange text-white text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
              >
                {saving ? 'Creating...' : 'Create Portal'}
              </button>
            </>
          ) : (
            <button
              onClick={onCreated}
              className="px-6 py-2 rounded-xl gradient-orange text-white text-sm font-medium hover:shadow-lg hover:shadow-orange-500/20 transition-all"
            >
              Go to Portal Management
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
