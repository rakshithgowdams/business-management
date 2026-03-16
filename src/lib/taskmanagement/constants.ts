export const TASK_CATEGORIES = [
  'HR Task',
  'Manager Task',
  'Employee Task',
  'Company-wide',
  'Compliance',
  'Training',
  'Onboarding',
  'Performance Review',
] as const;

export const ASSIGNED_BY_ROLES = ['CEO', 'HR', 'Manager', 'Lead'] as const;

export const ASSIGNED_TO_ROLES = ['HR', 'Manager', 'Employee', 'Intern', 'All'] as const;

export const TASK_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export const TASK_STATUSES = [
  'Pending',
  'Assigned',
  'In Progress',
  'In Review',
  'Completed',
  'Overdue',
  'Cancelled',
] as const;

export const KANBAN_COLUMNS = ['Pending', 'Assigned', 'In Progress', 'In Review', 'Completed'] as const;

export const RECURRENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly'] as const;

export const EMAIL_TYPES = [
  'task_assignment',
  'reminder',
  'escalation',
  'report',
  'appreciation',
  'warning',
  'custom',
] as const;

export const ALERT_TYPES = ['deadline', 'overdue', 'performance', 'ai_insight', 'system'] as const;
export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;

export const TASK_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'In Progress': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  Overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  Cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-600/10 text-red-400 border-red-600/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'HR Task': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Manager Task': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Employee Task': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Company-wide': 'bg-brand-600/10 text-brand-400 border-brand-600/20',
  Compliance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Training: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Onboarding: 'bg-green-500/10 text-green-400 border-green-500/20',
  'Performance Review': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export const COLUMN_COLORS: Record<string, string> = {
  Pending: 'border-gray-500/30',
  Assigned: 'border-blue-500/30',
  'In Progress': 'border-cyan-500/30',
  'In Review': 'border-amber-500/30',
  Completed: 'border-green-500/30',
};

export const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const SEVERITY_ICONS_BG: Record<string, string> = {
  info: 'bg-blue-500/20',
  warning: 'bg-amber-500/20',
  critical: 'bg-red-500/20',
};
