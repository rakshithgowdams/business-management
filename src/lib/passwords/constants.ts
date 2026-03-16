export const PASSWORD_CATEGORIES = [
  'social_media',
  'subscription',
  'banking',
  'email',
  'work',
  'shopping',
  'gaming',
  'crypto',
  'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  social_media: 'Social Media',
  subscription: 'Subscription',
  banking: 'Banking',
  email: 'Email',
  work: 'Work',
  shopping: 'Shopping',
  gaming: 'Gaming',
  crypto: 'Crypto',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  social_media: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: 'text-sky-400' },
  subscription: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: 'text-amber-400' },
  banking: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  email: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'text-blue-400' },
  work: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'text-orange-400' },
  shopping: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: 'text-rose-400' },
  gaming: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
  crypto: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'text-yellow-400' },
  other: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: 'text-gray-400' },
};

export const STRENGTH_LABELS: Record<string, string> = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
  very_strong: 'Very Strong',
};

export const STRENGTH_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  weak: { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  strong: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  very_strong: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
};

export function evaluatePasswordStrength(password: string): string {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  if (score <= 4) return 'strong';
  return 'very_strong';
}

export function generatePassword(length = 20): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = lower + upper + digits + symbols;
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let pw = '';
  pw += lower[arr[0] % lower.length];
  pw += upper[arr[1] % upper.length];
  pw += digits[arr[2] % digits.length];
  pw += symbols[arr[3] % symbols.length];
  for (let i = 4; i < length; i++) {
    pw += all[arr[i] % all.length];
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}
