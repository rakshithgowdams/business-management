export const DEAL_STAGES = ['Lead', 'Prospect', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;

export const DEAL_STAGE_COLORS: Record<string, string> = {
  Lead: 'border-t-gray-400',
  Prospect: 'border-t-blue-400',
  Qualified: 'border-t-cyan-400',
  'Proposal Sent': 'border-t-amber-400',
  Negotiation: 'border-t-orange-400',
  Won: 'border-t-emerald-400',
  Lost: 'border-t-red-400',
};

export const DEAL_STAGE_HEADER_COLORS: Record<string, string> = {
  Lead: 'text-gray-300 bg-gray-500/10',
  Prospect: 'text-blue-300 bg-blue-500/10',
  Qualified: 'text-cyan-300 bg-cyan-500/10',
  'Proposal Sent': 'text-amber-300 bg-amber-500/10',
  Negotiation: 'text-orange-300 bg-orange-500/10',
  Won: 'text-emerald-300 bg-emerald-500/10',
  Lost: 'text-red-300 bg-red-500/10',
};

export const DEAL_STAGE_DEFAULT_PROBABILITY: Record<string, number> = {
  Lead: 10,
  Prospect: 25,
  Qualified: 50,
  'Proposal Sent': 65,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

export const DEAL_SOURCES = [
  'Referral', 'Cold Outreach', 'Instagram', 'Google Ads', 'LinkedIn',
  'WhatsApp', 'Website', 'Event', 'Email Campaign', 'Partner', 'Other',
];

export const DEAL_PRIORITIES = ['High', 'Medium', 'Low'];

export const DEAL_PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-400 bg-red-500/10 border-red-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export const DEAL_LOST_REASONS = [
  'Budget', 'No Decision', 'Competitor', 'Timing', 'Requirements Mismatch',
  'No Response', 'Churned', 'Other',
];

export const DEAL_ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Note', 'Stage Change', 'Proposal', 'Follow-up'];

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  Call: 'text-green-400',
  Email: 'text-blue-400',
  Meeting: 'text-purple-400',
  WhatsApp: 'text-emerald-400',
  Note: 'text-gray-400',
  'Stage Change': 'text-amber-400',
  Proposal: 'text-cyan-400',
  'Follow-up': 'text-orange-400',
};

// ==================== ONBOARDING PIPELINE ====================

export const ONBOARDING_PIPELINE_STAGES = [
  'Welcome', 'Documents', 'Setup', 'Training', 'Go Live', 'Complete',
] as const;

export const ONBOARDING_STAGE_COLORS: Record<string, string> = {
  Welcome: 'border-t-blue-400',
  Documents: 'border-t-amber-400',
  Setup: 'border-t-cyan-400',
  Training: 'border-t-orange-400',
  'Go Live': 'border-t-emerald-400',
  Complete: 'border-t-gray-400',
};

export const ONBOARDING_STAGE_HEADER_COLORS: Record<string, string> = {
  Welcome: 'text-blue-300 bg-blue-500/10',
  Documents: 'text-amber-300 bg-amber-500/10',
  Setup: 'text-cyan-300 bg-cyan-500/10',
  Training: 'text-orange-300 bg-orange-500/10',
  'Go Live': 'text-emerald-300 bg-emerald-500/10',
  Complete: 'text-gray-300 bg-gray-500/10',
};

export const ONBOARDING_STAGE_CHECKLISTS: Record<string, string[]> = {
  Welcome: [
    'Send welcome email',
    'Schedule kickoff call',
    'Share portal access',
    'Introduce team members',
  ],
  Documents: [
    'Collect signed agreement',
    'Collect NDA if applicable',
    'Collect GST / PAN details',
    'Collect brand assets (logo, guidelines)',
    'Collect access credentials',
  ],
  Setup: [
    'Set up project workspace',
    'Add client to tools/platforms',
    'Create communication channel',
    'Set up reporting dashboard',
    'Send setup confirmation',
  ],
  Training: [
    'Conduct platform walkthrough',
    'Share training materials',
    'Record tutorial video',
    'Complete Q&A session',
    'Share documentation',
  ],
  'Go Live': [
    'Final review with client',
    'Client sign-off obtained',
    'Launch announcement sent',
    'Monitor initial performance',
    'First report delivered',
  ],
  Complete: [
    'Send completion summary',
    'Collect feedback / testimonial',
    'Archive project files',
    'Schedule review meeting',
    'Upsell / renewal discussion',
  ],
};

// ==================== PROJECT PIPELINE ====================

export const PROJECT_PIPELINE_STAGES = [
  'Discovery', 'Design', 'Development', 'Testing', 'Launch', 'Done',
] as const;

export const PROJECT_STAGE_COLORS: Record<string, string> = {
  Discovery: 'border-t-blue-400',
  Design: 'border-t-purple-400',
  Development: 'border-t-cyan-400',
  Testing: 'border-t-amber-400',
  Launch: 'border-t-orange-400',
  Done: 'border-t-emerald-400',
};

export const PROJECT_STAGE_HEADER_COLORS: Record<string, string> = {
  Discovery: 'text-blue-300 bg-blue-500/10',
  Design: 'text-purple-300 bg-purple-500/10',
  Development: 'text-cyan-300 bg-cyan-500/10',
  Testing: 'text-amber-300 bg-amber-500/10',
  Launch: 'text-orange-300 bg-orange-500/10',
  Done: 'text-emerald-300 bg-emerald-500/10',
};

export const MILESTONE_STATUSES = ['Pending', 'In Progress', 'Completed', 'Blocked'] as const;

export const MILESTONE_STATUS_COLORS: Record<string, string> = {
  Pending: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  'In Progress': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Blocked: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export const PROJECT_PRIORITIES = ['High', 'Medium', 'Low'];
