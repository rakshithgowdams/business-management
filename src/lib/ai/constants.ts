export const BUSINESS_TYPES = [
  'Clinic / Hospital', 'Restaurant', 'Hotel', 'Real Estate',
  'Retail Shop', 'Wholesale', 'Manufacturing', 'Education',
  'Events', 'Legal', 'CA', 'Salon & Spa', 'Gym & Fitness',
  'Agriculture', 'Logistics', 'IT Company', 'Startup',
  'NGO', 'Government', 'Other',
];

export const TEAM_SIZES = ['Solo', '2-5', '5-20', '20-50', '50+'];

export const REVENUE_RANGES = [
  'Below ₹50K', '₹50K-₹2L', '₹2L-₹10L', '₹10L-₹50L', 'Above ₹50L',
];

export const BUDGET_RANGES = [
  'Below ₹10K', '₹10K-₹25K', '₹25K-₹50K', '₹50K-₹2L', 'Above ₹2L',
];

export const URGENCY_OPTIONS = ['Exploring', 'Planning in 1-3 months', 'Ready now'];

export const DECISION_MAKERS = ['Owner', 'Manager', 'Committee'];

export const HEARD_FROM_OPTIONS = [
  'Instagram', 'Referral', 'Google', 'WhatsApp', 'Cold Outreach', 'Other',
];

export const PAIN_POINTS = {
  'Operations': [
    'Manually answering customer calls all day',
    'Manually sending quotes/invoices on WhatsApp',
    'No proper customer follow-up system',
    'Spending too much time on repetitive tasks',
    'No proper appointment/booking system',
    'Manual data entry taking hours daily',
    'No proper inventory tracking',
    'Employee task management is chaotic',
  ],
  'Sales & Marketing': [
    'Not getting enough leads online',
    'No professional website',
    'Website exists but gets no inquiries',
    'No social media presence or consistency',
    'Competitors are getting more online customers',
    'No WhatsApp marketing system',
    'Not ranking on Google search',
    'No email marketing',
  ],
  'Customer Service': [
    'Missing calls after business hours',
    'Slow response to customer queries',
    'No proper customer feedback system',
    'Losing customers to faster competitors',
    'No chatbot or automated response',
  ],
  'Financial': [
    'Manual billing taking too much time',
    'Payment follow-up is embarrassing and slow',
    'No proper expense tracking',
    'GST filing is a nightmare',
    'No clear profit/loss visibility',
  ],
  'Growth': [
    'Don\'t know how to scale',
    'Can\'t hire because processes are manual',
    'No data to make business decisions',
    'Spending money on tools that don\'t work together',
  ],
};

export const LOADING_MESSAGES = [
  'Analyzing business profile...',
  'Identifying pain points...',
  'Matching services...',
  'Generating intelligence report...',
  'Creating sales documents...',
  'Almost done...',
];

export const DEAL_POTENTIAL_COLORS: Record<string, string> = {
  'Low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'High': 'bg-brand-500/20 text-brand-400 border-brand-500/30',
  'Very High': 'bg-green-500/20 text-green-400 border-green-500/30',
};

export const URGENCY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
  'High': 'bg-brand-500/20 text-brand-400 border-brand-500/30',
  'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const DEFAULT_FORM_DATA = {
  business_name: '',
  owner_name: '',
  business_type: '',
  city: '',
  state: '',
  years_in_business: '',
  team_size: '',
  monthly_revenue: '',
  website_url: '',
  instagram_handle: '',
  linkedin_url: '',
  google_business_name: '',
  facebook_page_url: '',
  pain_points: [] as string[],
  competitor_1_name: '',
  competitor_1_website: '',
  competitor_2_name: '',
  competitor_2_website: '',
  competitor_does_better: '',
  client_does_better: '',
  budget: '',
  urgency: '',
  decision_maker: '',
  additional_notes: '',
  heard_from: '',
};
