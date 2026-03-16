import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { KANBAN_COLUMNS, COLUMN_COLORS } from '../../../lib/worktracker/constants';
import type { WorkTask } from '../../../lib/worktracker/types';
import KanbanCard from './KanbanCard';

interface Props {
  tasks: WorkTask[];
  onRefresh: () => void;
  getProjectName: (pid: string | null) => string;
}

export default function KanbanBoard({ tasks, onRefresh, getProjectName }: Props) {
  const navigate = useNavigate();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const columns = KANBAN_COLUMNS.map((col) => ({
    name: col,
    tasks: tasks.filter((t) => t.status === col),
  }));

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDropTarget(null);
    dragCounter.current = {};
  };

  const handleColumnDragEnter = (colName: string) => {
    dragCounter.current[colName] = (dragCounter.current[colName] || 0) + 1;
    setDropTarget(colName);
  };

  const handleColumnDragLeave = (colName: string) => {
    dragCounter.current[colName] = (dragCounter.current[colName] || 0) - 1;
    if (dragCounter.current[colName] <= 0) {
      dragCounter.current[colName] = 0;
      if (dropTarget === colName) setDropTarget(null);
    }
  };

  const handleDrop = async (targetColumn: string) => {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === targetColumn) {
      handleDragEnd();
      return;
    }
    handleDragEnd();
    await supabase.from('work_tasks').update({ status: targetColumn }).eq('id', draggedTaskId);
    onRefresh();
  };

  const draggedTask = tasks.find((t) => t.id === draggedTaskId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div
          key={col.name}
          className={`glass-card rounded-xl border-t-2 transition-all duration-200 ${COLUMN_COLORS[col.name] || ''} ${dropTarget === col.name && draggedTaskId ? 'ring-2 ring-brand-500/40 bg-brand-500/5' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => handleColumnDragEnter(col.name)}
          onDragLeave={() => handleColumnDragLeave(col.name)}
          onDrop={(e) => { e.preventDefault(); handleDrop(col.name); }}
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">{col.name}</h3>
            <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">{col.tasks.length}</span>
          </div>
          <div className="p-2 space-y-2 min-h-[120px]">
            {col.tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                getProjectName={getProjectName}
                isDragging={draggedTaskId === task.id}
                onDragStart={() => handleDragStart(task.id)}
                onDragEnd={handleDragEnd}
                onClick={() => navigate(`/dashboard/work-tracker/task/${task.id}`)}
              />
            ))}
            {col.tasks.length === 0 && dropTarget === col.name && draggedTask && (
              <div className="rounded-lg border-2 border-dashed border-brand-500/30 p-3 text-center">
                <p className="text-xs text-brand-400/60">Drop here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
