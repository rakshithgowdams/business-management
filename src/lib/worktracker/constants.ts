export const TASK_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done', 'Cancelled'] as const;

export const KANBAN_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'] as const;

export const TASK_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const TASK_STATUS_COLORS: Record<string, string> = {
  'To Do': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Done': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-600/10 text-red-400 border-red-600/20',
  High: 'bg-red-500/10 text-red-400 border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export const COLUMN_COLORS: Record<string, string> = {
  'To Do': 'border-gray-500/30',
  'In Progress': 'border-blue-500/30',
  'In Review': 'border-amber-500/30',
  'Done': 'border-green-500/30',
};
