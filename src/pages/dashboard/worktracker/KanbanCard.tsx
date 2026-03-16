import { Calendar, Clock } from 'lucide-react';
import { TASK_PRIORITY_COLORS } from '../../../lib/worktracker/constants';
import type { WorkTask } from '../../../lib/worktracker/types';

interface Props {
  task: WorkTask;
  getProjectName: (pid: string | null) => string;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export default function KanbanCard({ task, getProjectName, isDragging, onDragStart, onDragEnd, onClick }: Props) {
  const projectName = getProjectName(task.project_id);
  const labels = task.labels ? task.labels.split(',').map((l) => l.trim()).filter(Boolean) : [];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-dark-700/60 hover:bg-dark-700/80 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all border border-white/5 hover:border-white/10 ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
        <span className={`px-1.5 py-0.5 text-[10px] rounded border shrink-0 ${TASK_PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
      </div>

      {projectName && <p className="text-xs text-gray-500 mb-1.5">{projectName}</p>}

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map((l) => <span key={l} className="px-1.5 py-0.5 text-[10px] rounded bg-dark-600 text-gray-400">{l}</span>)}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        {task.due_date && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
            <Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        )}
        {task.estimated_hours > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {task.logged_hours}/{task.estimated_hours}h
          </span>
        )}
      </div>
    </div>
  );
}
