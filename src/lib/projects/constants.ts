export const PROJECT_CATEGORIES = [
  'AI Automation',
  'AI Call Agent',
  'Web Development',
  'Branding',
  'Content Creation',
  'Other',
] as const;

export const PROJECT_STATUSES = ['Active', 'On Hold', 'Completed', 'Overbudget'] as const;

export const EXPENSE_CATEGORIES = [
  'Tools & Software',
  'Team & HR',
  'Ads & Marketing',
  'Travel & Logistics',
  'Office',
  'Freelancer',
  'Miscellaneous',
] as const;

export const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer'] as const;

export const TEAM_ROLES = ['Developer', 'Designer', 'Marketer', 'Tester', 'Other'] as const;

export const TOOL_SUGGESTIONS = [
  'n8n',
  'Claude AI',
  'Kling AI',
  'ChatGPT',
  'Canva',
  'Vapi',
  'Voiceflow',
  'Make.com',
  'Adobe',
  'Other',
] as const;

export const BILLING_TYPES = ['Monthly', 'One-time', 'Yearly'] as const;

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Freelancer'] as const;

export const AGREEMENT_TYPES = ['Employee', 'Freelancer', 'Project', 'NDA', 'Other'] as const;

export const EMPLOYMENT_COLORS: Record<string, string> = {
  'Full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Freelancer': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'AI Automation': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'AI Call Agent': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Web Development': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Branding': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Content Creation': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Other': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Completed': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'On Hold': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Overbudget': 'bg-red-500/10 text-red-400 border-red-500/20',
};
