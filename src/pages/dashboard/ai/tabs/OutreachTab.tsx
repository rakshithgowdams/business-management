import { useState } from 'react';
import { Copy, Check, MessageCircle, Mail, Linkedin, Instagram, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OutreachResult } from '../../../../lib/ai/types';

interface Props {
  data: OutreachResult;
}

function MessageBubble({ platform, icon: Icon, tone, message, bestTime, color }: {
  platform: string; icon: React.ElementType; tone?: string; message: string; bestTime?: string; color: string;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(message);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">{platform}</span>
          {tone && <span className="text-[10px] px-2 py-0.5 rounded bg-dark-600 text-gray-400">{tone}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(!editing)} className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white border border-white/10 hover:bg-white/5">{editing ? 'Done' : 'Edit'}</button>
          <button onClick={handleCopy} className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 flex items-center gap-1">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500 resize-none" />
      ) : (
        <div className="bg-dark-700/50 rounded-lg p-3">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
      )}
      {bestTime && (
        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Best time: {bestTime}</p>
      )}
    </div>
  );
}

export default function OutreachTab({ data }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp Messages</h3>
      <div className="space-y-3">
        <MessageBubble platform="WhatsApp #1" icon={MessageCircle} tone={data.whatsapp_message_1.tone} message={data.whatsapp_message_1.message} bestTime={data.whatsapp_message_1.best_time_to_send} color="bg-green-600" />
        <MessageBubble platform="WhatsApp #2" icon={MessageCircle} tone={data.whatsapp_message_2.tone} message={data.whatsapp_message_2.message} color="bg-green-600" />
        <MessageBubble platform="WhatsApp #3" icon={MessageCircle} tone={data.whatsapp_message_3.tone} message={data.whatsapp_message_3.message} color="bg-green-600" />
      </div>

      <h3 className="text-sm font-semibold text-white flex items-center gap-2 pt-2"><Mail className="w-4 h-4 text-blue-400" /> Email Campaigns</h3>
      <div className="space-y-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Subject Line</p>
          <p className="text-sm font-medium text-brand-400 mb-3">{data.email_subject_1}</p>
          <MessageBubble platform="Email #1" icon={Mail} message={data.email_body_1} color="bg-blue-600" />
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Follow-up Subject</p>
          <p className="text-sm font-medium text-brand-400 mb-3">{data.email_subject_2}</p>
          <MessageBubble platform="Email #2 (Follow-up)" icon={Mail} message={data.email_body_2} color="bg-blue-600" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-white flex items-center gap-2 pt-2"><Linkedin className="w-4 h-4 text-sky-400" /> Social Media</h3>
      <div className="space-y-3">
        <MessageBubble platform="LinkedIn" icon={Linkedin} message={data.linkedin_message} color="bg-sky-600" />
        <MessageBubble platform="Instagram DM" icon={Instagram} message={data.instagram_dm} color="bg-pink-600" />
      </div>

      {data.follow_up_sequence?.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-white mb-4">Follow-Up Sequence Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-4">
              {data.follow_up_sequence.map((step, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-brand-500 bg-dark-900" />
                  <div className="glass-card rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-brand-400">Day {step.day}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-dark-600 text-gray-400">{step.channel}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
