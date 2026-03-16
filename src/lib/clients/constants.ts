export const CLIENT_TYPES = ['Individual', 'Business', 'Startup', 'NGO', 'Government'] as const;

export const CLIENT_STATUSES = ['Active', 'Inactive', 'Lead', 'Blacklisted'] as const;

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-400 border-green-500/20',
  Inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Lead: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Blacklisted: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const CLIENT_TYPE_COLORS: Record<string, string> = {
  Individual: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Business: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Startup: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  NGO: 'bg-green-500/10 text-green-400 border-green-500/20',
  Government: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const INDUSTRY_TYPES = [
  'Technology', 'Healthcare', 'Education', 'Retail',
  'Events', 'Real Estate', 'Agriculture', 'Other',
] as const;

export const BUDGET_RANGES = [
  'Below ₹50K', '₹50K–₹2L', '₹2L–₹10L', 'Above ₹10L',
] as const;

export const CLIENT_SOURCES = [
  'Referral', 'Instagram', 'Google', 'WhatsApp', 'Cold Outreach', 'Other',
] as const;

export const INTERACTION_TYPES = [
  'Call', 'Email', 'Meeting', 'WhatsApp', 'Note',
] as const;

export const INTERACTION_ICONS: Record<string, string> = {
  Call: 'phone',
  Email: 'mail',
  Meeting: 'users',
  WhatsApp: 'message-circle',
  Note: 'file-text',
};

export const AVATAR_COLORS = [
  'from-orange-500 to-amber-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-pink-500',
  'from-teal-500 to-cyan-500',
  'from-amber-500 to-yellow-500',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
