import { useState } from 'react';
import {
  X, Send, Sparkles, Loader2, ChevronDown, Mail, FileText,
  AlertTriangle, Award, Clock, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callTaskAI } from '../../../lib/ai/api';
import { EMAIL_TYPES } from '../../../lib/taskmanagement/constants';
import type { TaskAssignment } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';

interface Props {
  task?: TaskAssignment;
  employee?: Employee;
  employees: Employee[];
  onClose: () => void;
  onSent: () => void;
}

const EMAIL_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  task_assignment: { label: 'Task Assignment', icon: FileText },
  reminder: { label: 'Reminder', icon: Clock },
  escalation: { label: 'Escalation', icon: AlertTriangle },
  report: { label: 'Report', icon: Mail },
  appreciation: { label: 'Appreciation', icon: Award },
  warning: { label: 'Warning', icon: AlertTriangle },
  custom: { label: 'Custom', icon: MessageSquare },
};

export default function EmailComposer({ task, employee, employees, onClose, onSent }: Props) {
  const { user } = useAuth();
  const [emailType, setEmailType] = useState(task ? 'task_assignment' : 'custom');
  const [recipientId, setRecipientId] = useState(employee?.id || task?.employee_id || '');
  const [recipientEmail, setRecipientEmail] = useState(
    employee?.work_email || employee?.personal_email || task?.employee?.work_email || task?.employee?.personal_email || ''
  );
  const [subject, setSubject] = useState(task ? `Task Assignment: ${task.title}` : '');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedEmployee = employees.find(e => e.id === recipientId);

  const handleRecipientChange = (empId: string) => {
    setRecipientId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setRecipientEmail(emp.work_email || emp.personal_email || '');
    }
  };

  const handleAICompose = async () => {
    setAiLoading(true);
    try {
      const recipientName = selectedEmployee?.full_name || 'Employee';
      const result = await callTaskAI({
        action: 'compose-email',
        email_type: emailType,
        recipient_name: recipientName,
        task_title: task?.title,
        context: `Type: ${emailType}. ${task ? `Task: ${task.title}, Priority: ${task.priority}, Due: ${task.due_date}, Category: ${task.category}` : 'General communication'}. ${body ? `Additional context: ${body}` : ''}`,
      }, 'email_compose');

      if (result.data) {
        if (result.data.subject) setSubject(result.data.subject as string);
        if (result.data.body) setBody(result.data.body as string);
        toast.success('AI composed email');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to compose with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user || !subject.trim() || !recipientEmail.trim()) {
      toast.error('Subject and recipient email are required');
      return;
    }
    setSaving(true);

    const { error } = await supabase.from('task_email_logs').insert({
      user_id: user.id,
      task_id: task?.id || null,
      employee_id: recipientId || null,
      recipient_email: recipientEmail,
      subject,
      body,
      email_type: emailType,
      status: 'queued',
    });

    if (error) {
      toast.error('Failed to save email');
      setSaving(false);
      return;
    }

    await supabase.from('task_alerts').insert({
      user_id: user.id,
      task_id: task?.id || null,
      employee_id: recipientId || null,
      alert_type: 'system',
      severity: 'info',
      title: `Email queued: ${subject}`,
      message: `Email to ${recipientEmail} has been queued for delivery.`,
      action_url: '/dashboard/task-management',
    });

    toast.success('Email queued for delivery');
    setSaving(false);
    onSent();
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from('task_email_logs').insert({
      user_id: user.id,
      task_id: task?.id || null,
      employee_id: recipientId || null,
      recipient_email: recipientEmail,
      subject,
      body,
      email_type: emailType,
      status: 'draft',
    });

    toast.success('Draft saved');
    setSaving(false);
    onSent();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-dark-800 border border-white/10 rounded-2xl shadow-2xl mb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold">Compose Email</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAICompose}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-400 text-xs font-medium flex items-center gap-1.5 hover:bg-brand-600/30 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Compose
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email Type</label>
              <div className="relative">
                <select
                  value={emailType}
                  onChange={e => setEmailType(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors pr-8"
                >
                  {EMAIL_TYPES.map(t => (
                    <option key={t} value={t}>{EMAIL_TYPE_LABELS[t]?.label || t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Recipient</label>
              <div className="relative">
                <select
                  value={recipientId}
                  onChange={e => handleRecipientChange(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors pr-8"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} - {e.job_role}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="employee@company.com"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Write your email content here..."
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none font-mono leading-relaxed"
            />
          </div>

          {body && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preview</label>
              <pre className="p-4 bg-dark-900/60 border border-white/10 rounded-xl text-gray-300 text-sm max-h-60 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                {body}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-colors"
          >
            Save Draft
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={saving || !subject.trim() || !recipientEmail.trim()}
              className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
