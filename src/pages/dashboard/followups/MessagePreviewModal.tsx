import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Linkedin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { callGeminiFlash, parseJSON } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { FollowUpItem } from './FollowUpList';

interface MessageVariant {
  platform: 'whatsapp' | 'email' | 'linkedin';
  subject?: string;
  body: string;
}

interface Props {
  item: FollowUpItem | null;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}

const PLATFORM_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  whatsapp: { icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'WhatsApp', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  linkedin: { icon: <Linkedin className="w-3.5 h-3.5" />, label: 'LinkedIn', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
};

export default function MessagePreviewModal({ item, open, onClose, onSent }: Props) {
  const { user } = useAuth();
  const [variants, setVariants] = useState<MessageVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);
  const [markingSent, setMarkingSent] = useState<string | null>(null);

  const generate = async () => {
    if (!item) return;
    if (!hasOpenRouterKey()) {
      toast.error('Add your OpenRouter API key in Settings first');
      return;
    }
    setLoading(true);
    try {
      const prompt = `You are a professional business communication expert. Generate 3 follow-up message variants for this situation:

Type: ${item.type.replace(/_/g, ' ')}
Client: ${item.clientName}
Details: ${item.detail}
Days since trigger: ${item.daysSince} days
Tone tier: ${item.tier}
${item.amount ? `Amount involved: INR ${item.amount}` : ''}

Generate exactly 3 variants as JSON array:
1. WhatsApp message (concise, friendly, under 500 chars)
2. Email (with subject line, professional, medium length)
3. LinkedIn message (professional networking tone, under 300 chars)

Return ONLY valid JSON array:
[
  {"platform":"whatsapp","body":"message text"},
  {"platform":"email","subject":"subject line","body":"email body"},
  {"platform":"linkedin","body":"message text"}
]

Use Indian business context. Be warm but professional. Reference specific details. Do NOT use placeholder brackets.`;

      const raw = await callGeminiFlash(prompt);
      const parsed = parseJSON<MessageVariant[]>(raw);
      setVariants(parsed);
      setGenerated(true);
    } catch {
      toast.error('Failed to generate messages. Try again.');
    }
    setLoading(false);
  };

  const handleCopy = (idx: number) => {
    const v = variants[idx];
    const text = v.subject ? `Subject: ${v.subject}\n\n${v.body}` : v.body;
    navigator.clipboard.writeText(text);
    setCopied(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUpdateBody = (idx: number, body: string) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, body } : v)));
  };

  const handleMarkSent = async (channel: string) => {
    if (!item || !user) return;
    setMarkingSent(channel);
    const { error } = await supabase.from('followup_history').insert({
      user_id: user.id,
      client_name: item.clientName,
      type: item.type,
      channel,
      message_preview: variants.find((v) => v.platform === channel)?.body?.slice(0, 200) || '',
      status: 'sent',
      amount: item.amount || 0,
      sent_at: new Date().toISOString(),
    });
    setMarkingSent(null);
    if (error) {
      toast.error('Failed to record follow-up');
      return;
    }
    toast.success(`Marked as sent via ${channel}`);
    onSent?.();
    onClose();
    setVariants([]);
    setGenerated(false);
  };

  const waLink = () => {
    const wa = variants.find((v) => v.platform === 'whatsapp');
    if (!wa) return '#';
    const phone = item?.phone?.replace(/\D/g, '') || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(wa.body)}`;
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#141414] border border-[#1f1f1f] rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-[#141414] border-b border-[#1f1f1f] p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Follow-up Message Preview</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {item.clientName} - {item.detail}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1f1f1f] text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!generated && !loading && (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                Generate AI-powered follow-up messages tailored for this situation
              </p>
              <button
                onClick={generate}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl gradient-orange text-white hover:opacity-90 transition-opacity"
              >
                Generate Messages
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                  <div className="h-4 w-24 bg-[#1f1f1f] rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-[#1f1f1f] rounded" />
                    <div className="h-3 w-3/4 bg-[#1f1f1f] rounded" />
                    <div className="h-3 w-1/2 bg-[#1f1f1f] rounded" />
                  </div>
                </div>
              ))}
              <p className="text-center text-xs text-gray-500">Generating personalized messages...</p>
            </div>
          )}

          {generated && variants.map((v, idx) => {
            const meta = PLATFORM_META[v.platform];
            return (
              <div key={v.platform} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{v.body.length} chars</span>
                    <button
                      onClick={() => handleCopy(idx)}
                      className="p-1.5 rounded-lg hover:bg-[#1f1f1f] text-gray-400 transition-colors"
                    >
                      {copied === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {v.subject && (
                  <p className="text-xs font-medium text-gray-300">
                    Subject: {v.subject}
                  </p>
                )}
                <textarea
                  value={v.body}
                  onChange={(e) => handleUpdateBody(idx, e.target.value)}
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-orange-500/50"
                />
              </div>
            );
          })}

          {generated && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600/30 transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp
              </a>
              {['whatsapp', 'email', 'linkedin'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleMarkSent(ch)}
                  disabled={markingSent === ch}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                >
                  {markingSent === ch ? 'Saving...' : `Mark Sent via ${ch.charAt(0).toUpperCase() + ch.slice(1)}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#1f1f1f] px-5 py-3 flex justify-center">
          <span className="text-[10px] text-gray-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by Gemini 2.5 Flash
          </span>
        </div>
      </div>
    </div>
  );
}
