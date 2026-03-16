export const DEPARTMENTS = [
  'Development', 'Design', 'Marketing', 'Sales',
  'Operations', 'Support', 'Management', 'Other',
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Freelancer', 'Intern', 'Contract',
] as const;

export const EMPLOYEE_STATUSES = [
  'Active', 'On Leave', 'Resigned', 'Terminated',
] as const;

export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-400 border-green-500/20',
  'On Leave': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Resigned: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Freelancer: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Intern: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Contract: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const SALARY_TYPES = [
  'Monthly Fixed', 'Hourly Rate', 'Per Project',
] as const;

export const PAYMENT_MODES = [
  'Bank Transfer', 'UPI', 'Cash', 'Cheque',
] as const;

export const WORK_LOCATIONS = ['Office', 'Remote', 'Hybrid'] as const;

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export const ATTENDANCE_STATUSES = [
  'Present', 'Absent', 'Leave', 'Holiday', 'Work from Home',
] as const;

export const ATTENDANCE_COLORS: Record<string, string> = {
  Present: 'bg-green-500',
  Absent: 'bg-red-500',
  Leave: 'bg-yellow-500',
  Holiday: 'bg-gray-500',
  'Work from Home': 'bg-blue-500',
};

export const TASK_PRIORITIES = ['High', 'Medium', 'Low'] as const;

export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'] as const;

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-500/10 text-red-400 border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export const DOC_TYPES = [
  'Offer Letter', 'ID Proof', 'PAN', 'Aadhaar',
  'Experience Letter', 'Other',
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function generateEmployeeCode(count: number): string {
  return `EMP-${String(count + 1).padStart(3, '0')}`;
}

export function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'from-orange-500 to-amber-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-rose-500 to-pink-500',
    'from-teal-500 to-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
