export const PORTAL_SECTION_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  case_studies: 'Case Studies',
  testimonials: 'Testimonials',
  services: 'Services',
  team: 'Our Team',
  documents: 'Documents',
  project_progress: 'Project Progress',
};

export const PORTFOLIO_CATEGORIES = [
  'Web Design',
  'Branding',
  'Mobile App',
  'Marketing',
  'UI/UX Design',
  'E-Commerce',
  'Social Media',
  'Video Production',
  'Photography',
  'Print Design',
  'SEO',
  'Other',
] as const;

export const CASE_STUDY_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Retail',
  'Real Estate',
  'Finance',
  'Food & Beverage',
  'Fashion',
  'Travel',
  'Entertainment',
  'Manufacturing',
  'Other',
] as const;

export const DOCUMENT_TYPES = [
  'Proposal',
  'Contract',
  'Deliverable',
  'Report',
  'Invoice',
  'Presentation',
  'Other',
] as const;

export const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  Proposal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Contract: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Deliverable: 'bg-green-500/10 text-green-400 border-green-500/20',
  Report: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Invoice: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Presentation: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const SERVICE_ICONS = [
  'briefcase', 'code', 'palette', 'megaphone', 'camera', 'video',
  'pen-tool', 'monitor', 'smartphone', 'globe', 'bar-chart', 'zap',
  'target', 'users', 'shield', 'rocket', 'layers', 'search',
] as const;

export const DEFAULT_SECTIONS = {
  portfolio: true,
  case_studies: true,
  testimonials: true,
  services: true,
  team: true,
  documents: true,
  project_progress: true,
};
