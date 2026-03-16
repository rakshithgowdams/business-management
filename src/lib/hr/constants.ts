export const JOB_DEPARTMENTS = [
  'Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance',
  'HR', 'Operations', 'Customer Support', 'Legal', 'Data & Analytics', 'Other',
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

export const WORK_MODES = ['On-site', 'Remote', 'Hybrid'];

export const JOB_STATUSES = ['Draft', 'Active', 'Paused', 'Closed', 'Filled'];

export const JOB_STATUS_COLORS: Record<string, string> = {
  Draft: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  Active: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Paused: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Closed: 'border-red-500/40 text-red-400 bg-red-500/10',
  Filled: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
};

export const APPLICATION_STAGES = [
  'Applied', 'Screening', 'Interview', 'Technical', 'HR Round', 'Offer', 'Hired', 'Rejected',
];

export const STAGE_COLORS: Record<string, string> = {
  Applied: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  Screening: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Interview: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Technical: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'HR Round': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Offer: 'bg-green-500/20 text-green-300 border-green-500/30',
  Hired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const APPLICATION_SOURCES = [
  'LinkedIn', 'Indeed', 'Naukri', 'Referral', 'Company Website', 'Job Fair', 'Campus', 'Other',
];

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  Pending: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Approved: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Rejected: 'border-red-500/40 text-red-400 bg-red-500/10',
  Cancelled: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
};

export const DEFAULT_LEAVE_TYPES = [
  { name: 'Casual Leave', code: 'CL', color: '#3b82f6', days_per_year: 12, is_paid: true, carry_forward: false, max_carry_forward: 0 },
  { name: 'Sick Leave', code: 'SL', color: '#ef4444', days_per_year: 10, is_paid: true, carry_forward: false, max_carry_forward: 0 },
  { name: 'Earned Leave', code: 'EL', color: '#22c55e', days_per_year: 15, is_paid: true, carry_forward: true, max_carry_forward: 15 },
  { name: 'Maternity Leave', code: 'ML', color: '#ec4899', days_per_year: 180, is_paid: true, carry_forward: false, max_carry_forward: 0 },
  { name: 'Paternity Leave', code: 'PL', color: '#8b5cf6', days_per_year: 15, is_paid: true, carry_forward: false, max_carry_forward: 0 },
  { name: 'Loss of Pay', code: 'LOP', color: '#f59e0b', days_per_year: 0, is_paid: false, carry_forward: false, max_carry_forward: 0 },
];

export const REVIEW_TYPES = ['Annual', 'Semi-Annual', 'Quarterly', 'Probation', 'Pip', 'Ad-hoc'];

export const REVIEW_STATUSES = ['Draft', 'In Progress', 'Completed', 'Acknowledged'];

export const REVIEW_STATUS_COLORS: Record<string, string> = {
  Draft: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  'In Progress': 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Completed: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Acknowledged: 'border-green-500/40 text-green-400 bg-green-500/10',
};

export const GOAL_CATEGORIES = ['Performance', 'Learning & Development', 'Leadership', 'Process Improvement', 'Revenue', 'Customer', 'Technical', 'Other'];

export const GOAL_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Missed'];

export const GOAL_STATUS_COLORS: Record<string, string> = {
  'Not Started': 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  'In Progress': 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Completed: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Missed: 'border-red-500/40 text-red-400 bg-red-500/10',
};

export const APPRAISAL_TYPES = ['Salary Increment', 'Promotion', 'Demotion', 'Role Change', 'Bonus', 'Combined'];

export const APPRAISAL_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Implemented'];

export const APPRAISAL_STATUS_COLORS: Record<string, string> = {
  Draft: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  'Pending Approval': 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Approved: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Rejected: 'border-red-500/40 text-red-400 bg-red-500/10',
  Implemented: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
};

export const POLICY_CATEGORIES = [
  'Code of Conduct', 'Leave Policy', 'Work Hours', 'Remote Work', 'Compensation',
  'Benefits', 'Grievance', 'Anti-Harassment', 'IT Security', 'Travel', 'Expense', 'Other',
];

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

export const RATING_COLORS: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-emerald-400',
};
