export const ONBOARDING_TYPES = ['Client', 'Employee', 'Freelancer', 'Intern', 'Partner'] as const;

export const ONBOARDING_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] as const;

export const ONBOARDING_STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'On Hold': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const ONBOARDING_TYPE_COLORS: Record<string, string> = {
  Client: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Employee: 'bg-green-500/10 text-green-400 border-green-500/20',
  Freelancer: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Intern: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Partner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-500/10 text-red-400 border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export const OB_DOC_TYPES = [
  'ID Proof', 'Offer Letter', 'Agreement', 'NDA', 'Bank Details',
  'Tax Document', 'Portfolio', 'Requirements Doc', 'Other',
] as const;

export const DOC_STATUSES = ['Received', 'Pending', 'Rejected'] as const;

export const DOC_STATUS_COLORS: Record<string, string> = {
  Received: 'bg-green-500/10 text-green-400',
  Pending: 'bg-yellow-500/10 text-yellow-400',
  Rejected: 'bg-red-500/10 text-red-400',
};

export const ACTIVITY_TYPES = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note', 'System'] as const;

export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  Employee: [
    'Offer letter signed', 'ID proof submitted', 'PAN card submitted', 'Aadhaar submitted',
    'Bank details collected', 'Work email created', 'Tools access given', 'Introduction meeting done',
    'First task assigned', 'Training completed',
  ],
  Client: [
    'Discovery call done', 'Requirements document signed', 'Quotation sent', 'Quotation accepted',
    'Agreement signed', 'Advance payment received', 'Project kickoff call done',
    'Access credentials shared', 'WhatsApp group created', 'First deliverable shared',
  ],
  Freelancer: [
    'Portfolio reviewed', 'Rate agreed', 'Agreement signed', 'NDA signed (if needed)',
    'First task briefed', 'Payment terms confirmed', 'Communication channel set',
  ],
  Intern: [
    'Offer letter sent', 'College NOC submitted', 'ID proof submitted', 'Internship agreement signed',
    'Mentor assigned', 'Tools access given', 'Orientation done', 'First task assigned',
  ],
  Partner: [
    'Partnership proposal reviewed', 'Terms negotiated', 'MOU / Agreement signed',
    'Revenue sharing confirmed', 'Integration/setup done', 'Kickoff meeting done',
  ],
};

export function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'from-orange-500 to-amber-500', 'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500', 'from-rose-500 to-pink-500',
    'from-teal-500 to-cyan-500', 'from-amber-500 to-yellow-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
