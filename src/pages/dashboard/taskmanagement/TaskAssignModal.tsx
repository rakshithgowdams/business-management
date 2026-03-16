import { useState, useEffect } from 'react';
import { X, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callTaskAI } from '../../../lib/ai/api';
import {
  TASK_CATEGORIES, ASSIGNED_BY_ROLES, ASSIGNED_TO_ROLES, TASK_PRIORITIES,
  RECURRENCE_OPTIONS,
} from '../../../lib/taskmanagement/constants';
import { DEPARTMENTS } from '../../../lib/employees/constants';
import type { TaskAssignment } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';

interface Props {
  employees: Employee[];
  editTask: TaskAssignment | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskAssignModal({ employees, editTask, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Employee Task');
  const [assignedByRole, setAssignedByRole] = useState('CEO');
  const [assignedToRole, setAssignedToRole] = useState('Employee');
  const [employeeId, setEmployeeId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [department, setDepartment] = useState('');
  const [tags, setTags] = useState('');
  const [recurrence, setRecurrence] = useState('none');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setCategory(editTask.category);
      setAssignedByRole(editTask.assigned_by_role);
      setAssignedToRole(editTask.assigned_to_role);
      setEmployeeId(editTask.employee_id || '');
      setPriority(editTask.priority);
      setDueDate(editTask.due_date ? editTask.due_date.split('T')[0] : '');
      setEstimatedHours(String(editTask.estimated_hours || ''));
      setDepartment(editTask.department);
      setTags(editTask.tags);
      setRecurrence(editTask.recurrence);
    }
  }, [editTask]);

  const filteredEmployees = department
    ? employees.filter(e => e.department === department)
    : employees;

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const result = await callTaskAI({
        action: 'generate-task-suggestions',
        role: assignedToRole,
        department: department || 'General',
        context: title || description || 'General tasks for this role',
      }, 'task_suggestions');

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const s = result.data[0] as Record<string, unknown>;
        if (!title) setTitle((s.title as string) || '');
        if (!description) setDescription((s.description as string) || '');
        if (s.category) setCategory(s.category as string);
        if (s.priority) setPriority(s.priority as string);
        if (s.estimated_hours) setEstimatedHours(String(s.estimated_hours));
        if (s.tags) setTags(s.tags as string);
        toast.success('AI suggestion applied');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);

    const payload = {
      user_id: user.id,
      employee_id: employeeId || null,
      assigned_by_role: assignedByRole,
      assigned_to_role: assignedToRole,
      title: title.trim(),
      description,
      category,
      priority,
      status: employeeId ? 'Assigned' : 'Pending',
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      estimated_hours: Number(estimatedHours) || 0,
      department,
      tags,
      recurrence,
      updated_at: new Date().toISOString(),
    };

    if (editTask) {
      const { error } = await supabase.from('task_assignments').update(payload).eq('id', editTask.id);
      if (error) { toast.error('Failed to update task'); setSaving(false); return; }
      toast.success('Task updated');
    } else {
      const { error } = await supabase.from('task_assignments').insert(payload);
      if (error) { toast.error('Failed to create task'); setSaving(false); return; }

      if (employeeId) {
        const emp = employees.find(e => e.id === employeeId);
        await supabase.from('task_alerts').insert({
          user_id: user.id,
          employee_id: employeeId,
          alert_type: 'system',
          severity: 'info',
          title: `New Task Assigned: ${title}`,
          message: `Task "${title}" has been assigned to ${emp?.full_name || 'employee'}.`,
          action_url: '/dashboard/task-management',
        });
      }
      toast.success('Task assigned successfully');
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-dark-800 border border-white/10 rounded-2xl shadow-2xl mb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold">{editTask ? 'Edit Task' : 'Assign New Task'}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-400 text-xs font-medium flex items-center gap-1.5 hover:bg-brand-600/30 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Suggest
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Complete Q4 performance reviews"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed task description..."
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <SelectField value={category} onChange={setCategory} options={TASK_CATEGORIES} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Priority</label>
              <SelectField value={priority} onChange={setPriority} options={TASK_PRIORITIES} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Assigned By (Role)</label>
              <SelectField value={assignedByRole} onChange={setAssignedByRole} options={ASSIGNED_BY_ROLES} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Assigned To (Role)</label>
              <SelectField value={assignedToRole} onChange={setAssignedToRole} options={ASSIGNED_TO_ROLES} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Department</label>
              <SelectField value={department} onChange={setDepartment} options={['', ...DEPARTMENTS]} placeholder="All Departments" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Assign to Employee</label>
              <div className="relative">
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors pr-8"
                >
                  <option value="">Unassigned</option>
                  {filteredEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} - {e.job_role}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Estimated Hours</label>
              <input
                type="number"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Recurrence</label>
              <SelectField value={recurrence} onChange={setRecurrence} options={RECURRENCE_OPTIONS} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. urgent, Q4, compliance"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : editTask ? 'Update Task' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors pr-8"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o || 'None'}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}
