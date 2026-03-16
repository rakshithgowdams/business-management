export interface PermissionItem {
  key: string;
  label: string;
  description: string;
  group: string;
}

export const PERMISSION_GROUPS = [
  { key: 'overview', label: 'Overview' },
  { key: 'finance', label: 'Finance' },
  { key: 'business', label: 'Business' },
  { key: 'ai', label: 'AI & Creative' },
  { key: 'team', label: 'Team' },
] as const;

export const ALL_PERMISSIONS: PermissionItem[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'View main dashboard with KPIs', group: 'overview' },
  { key: 'health_score', label: 'Health Score', description: 'AI-powered business health analysis', group: 'overview' },
  { key: 'weekly_summary', label: 'Weekly Summary', description: 'AI-powered weekly insights', group: 'overview' },

  { key: 'income', label: 'Income', description: 'Track income sources', group: 'finance' },
  { key: 'expenses', label: 'Expenses', description: 'Track expenses and receipts', group: 'finance' },
  { key: 'invoices', label: 'Invoices', description: 'Create and manage invoices', group: 'finance' },
  { key: 'quotations', label: 'Quotations', description: 'Create and manage quotations', group: 'finance' },
  { key: 'gst', label: 'GST Tracker', description: 'GST filing and tracking', group: 'finance' },
  { key: 'emi', label: 'EMI Tracker', description: 'Track EMIs and loans', group: 'finance' },
  { key: 'subscriptions', label: 'Subscriptions', description: 'Manage subscriptions', group: 'finance' },
  { key: 'goals', label: 'Goals', description: 'Track financial goals', group: 'finance' },

  { key: 'projects', label: 'Projects', description: 'Manage projects and budgets', group: 'business' },
  { key: 'clients', label: 'Clients', description: 'Client management and CRM', group: 'business' },
  { key: 'agreements', label: 'Agreements', description: 'AI agreement builder', group: 'business' },
  { key: 'documents', label: 'Documents', description: 'Document vault', group: 'business' },
  { key: 'follow_ups', label: 'Follow-ups', description: 'AI follow-up sequences', group: 'business' },
  { key: 'meeting_prep', label: 'Meeting Prep', description: 'AI meeting preparation', group: 'business' },

  { key: 'ai_intelligence', label: 'AI Intelligence', description: 'AI business analysis', group: 'ai' },
  { key: 'marketing_studio', label: 'Marketing Studio', description: 'AI creative tools', group: 'ai' },
  { key: 'smm_agent', label: 'SMM Agent', description: 'Social media management', group: 'ai' },
  { key: 'ai_usage', label: 'AI Usage', description: 'AI usage analytics', group: 'ai' },

  { key: 'employees', label: 'Employees', description: 'Employee management', group: 'team' },
  { key: 'task_management', label: 'Task Management', description: 'Assign and track tasks', group: 'team' },
  { key: 'messenger', label: 'Messenger', description: 'Team messaging and chat', group: 'team' },
  { key: 'onboarding', label: 'Onboarding', description: 'Employee onboarding', group: 'team' },
  { key: 'work_tracker', label: 'Work Tracker', description: 'Kanban board and timesheet', group: 'team' },
];

export const PERMISSION_KEYS = ALL_PERMISSIONS.map(p => p.key);

export const PERMISSION_ROUTE_MAP: Record<string, string> = {
  dashboard: '/dashboard',
  health_score: '/dashboard/health-score',
  weekly_summary: '/dashboard/weekly-summary',
  income: '/dashboard/income',
  expenses: '/dashboard/expenses',
  invoices: '/dashboard/invoices',
  quotations: '/dashboard/quotations',
  gst: '/dashboard/gst',
  emi: '/dashboard/emi',
  subscriptions: '/dashboard/subscriptions',
  goals: '/dashboard/goals',
  projects: '/dashboard/projects',
  clients: '/dashboard/clients',
  agreements: '/dashboard/agreements',
  documents: '/dashboard/documents',
  follow_ups: '/dashboard/follow-ups',
  meeting_prep: '/dashboard/meeting-prep',
  ai_intelligence: '/dashboard/ai-intelligence',
  marketing_studio: '/dashboard/marketing-studio',
  smm_agent: '/dashboard/smm-agent',
  ai_usage: '/dashboard/ai-usage',
  employees: '/dashboard/employees',
  task_management: '/dashboard/task-management',
  messenger: '/dashboard/messenger',
  onboarding: '/dashboard/onboarding',
  work_tracker: '/dashboard/work-tracker',
};

export function hasPermission(permissions: string[], key: string): boolean {
  return permissions.includes(key);
}

export function getFirstAllowedRoute(permissions: string[]): string {
  for (const perm of permissions) {
    if (PERMISSION_ROUTE_MAP[perm]) return PERMISSION_ROUTE_MAP[perm];
  }
  return '/dashboard';
}
