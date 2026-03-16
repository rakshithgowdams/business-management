import { useState } from 'react';
import {
  Clock, User, Tag, AlertTriangle, Mail, ChevronRight, GripVertical,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  KANBAN_COLUMNS, TASK_PRIORITY_COLORS, COLUMN_COLORS, CATEGORY_COLORS,
} from '../../../lib/taskmanagement/constants';
import type { TaskAssignment } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';

interface Props {
  tasks: TaskAssignment[];
  employees: Employee[];
  onRefresh: () => void;
  onSelect: (t: TaskAssignment) => void;
  onEmail: (task?: TaskAssignment, emp?: Employee) => void;
}

export default function TaskBoard({ tasks, employees, onRefresh, onSelect, onEmail }: Props) {
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = async (status: string) => {
    if (!dragTask) return;
    const task = tasks.find(t => t.id === dragTask);
    if (!task || task.status === status) { setDragTask(null); setDragOver(null); return; }

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'In Progress' && !task.start_date) updates.start_date = new Date().toISOString();
    if (status === 'Completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress_percent = 100;
    }

    await supabase.from('task_assignments').update(updates).eq('id', dragTask);
    setDragTask(null);
    setDragOver(null);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {KANBAN_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col);
        return (
          <div
            key={col}
            onDragOver={e => { e.preventDefault(); setDragOver(col); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col)}
            className={`rounded-xl border transition-all duration-200 ${COLUMN_COLORS[col] || 'border-white/10'} ${
              dragOver === col ? 'bg-white/[0.04] scale-[1.01]' : 'bg-dark-800/50'
            }`}
          >
            <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  col === 'Pending' ? 'bg-gray-400' :
                  col === 'Assigned' ? 'bg-blue-400' :
                  col === 'In Progress' ? 'bg-cyan-400' :
                  col === 'In Review' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                <span className="text-sm font-medium text-white">{col}</span>
              </div>
              <span className="text-xs text-gray-500 bg-dark-600 px-2 py-0.5 rounded-md">{colTasks.length}</span>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {colTasks.map(task => {
                const due = task.due_date ? new Date(task.due_date) : null;
                const isOverdue = due && due < new Date() && task.status !== 'Completed';
                const emp = employees.find(e => e.id === task.employee_id);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragTask(task.id)}
                    onDragEnd={() => { setDragTask(null); setDragOver(null); }}
                    onClick={() => onSelect(task)}
                    className={`p-3 rounded-lg bg-dark-700/60 border border-white/[0.06] hover:border-white/10 cursor-pointer transition-all duration-200 group ${
                      dragTask === task.id ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:shadow-black/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TASK_PRIORITY_COLORS[task.priority] || ''}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[task.category] || 'border-white/10 text-gray-400'}`}>
                          {task.category}
                        </span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>

                    <p className="text-sm font-medium text-white mb-2 line-clamp-2">{task.title}</p>

                    {task.progress_percent > 0 && task.progress_percent < 100 && (
                      <div className="mb-2">
                        <div className="w-full h-1 bg-dark-600 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                            style={{ width: `${task.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-2">
                        {task.employee?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{task.employee.full_name}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {due && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                            <Clock className="w-3 h-3" />
                            {due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.tags && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {task.tags.split(',').slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-dark-600 text-gray-400 rounded">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-[120px] text-gray-600 text-xs">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
