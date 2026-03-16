export const CHANNELS = ['meta', 'google', 'email', 'offline', 'b2b_outreach', 'event', 'print', 'other'];

export const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  email: 'Email Marketing',
  offline: 'Offline',
  b2b_outreach: 'B2B Outreach',
  event: 'Events',
  print: 'Print',
  other: 'Other',
};

export const CHANNEL_COLORS: Record<string, string> = {
  meta: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  google: 'bg-red-500/15 text-red-300 border-red-500/30',
  email: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  offline: 'bg-green-500/15 text-green-300 border-green-500/30',
  b2b_outreach: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  event: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  print: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  other: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export const CAMPAIGN_OBJECTIVES = [
  'Awareness', 'Traffic', 'Engagement', 'Leads', 'App Promotion',
  'Sales', 'Brand Awareness', 'Reach', 'Video Views', 'Conversions',
];

export const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Paused', 'Completed', 'Archived'];

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  Draft: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  Active: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Paused: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Completed: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Archived: 'border-slate-500/40 text-slate-400 bg-slate-500/10',
};

export const AD_FORMATS_META = ['Single Image', 'Single Video', 'Carousel', 'Collection', 'Slideshow', 'Instant Experience'];

export const AD_FORMATS_GOOGLE = ['Responsive Search Ad', 'Expanded Text Ad', 'Responsive Display Ad', 'Call Ad', 'Performance Max', 'Shopping Ad'];

export const CTA_OPTIONS = ['Learn More', 'Shop Now', 'Sign Up', 'Contact Us', 'Book Now', 'Get Quote', 'Download', 'Subscribe', 'Watch More', 'Apply Now'];

export const KEYWORD_MATCH_TYPES = ['Broad', 'Broad Match Modifier', 'Phrase', 'Exact', 'Negative'];

export const BID_STRATEGIES_META = ['Lowest Cost', 'Cost Cap', 'Bid Cap', 'ROAS Target', 'Highest Value'];
export const BID_STRATEGIES_GOOGLE = ['Maximize Clicks', 'Maximize Conversions', 'Target CPA', 'Target ROAS', 'Manual CPC', 'Enhanced CPC'];

export const EXPENSE_TYPES = ['Ad Spend', 'Agency Fee', 'Creative Production', 'Tool Subscription', 'Influencer', 'Printing', 'Event Cost', 'Other'];

export const LEAD_SOURCES = ['Meta Ads', 'Google Ads', 'Organic', 'Referral', 'Email', 'Event', 'B2B Outreach', 'LinkedIn', 'Cold Call', 'Website', 'Other'];

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];

export const LEAD_STATUS_COLORS: Record<string, string> = {
  New: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  Contacted: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Qualified: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  'Proposal Sent': 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  Negotiation: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
  Converted: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Lost: 'border-red-500/40 text-red-400 bg-red-500/10',
};

export const EVENT_TYPES = ['Trade Show', 'Conference', 'Seminar', 'Workshop', 'Webinar', 'Product Launch', 'Networking', 'Exhibition', 'Road Show', 'Other'];

export const EVENT_STATUSES = ['Planned', 'Registered', 'In Progress', 'Completed', 'Cancelled'];

export const EVENT_STATUS_COLORS: Record<string, string> = {
  Planned: 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  Registered: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  'In Progress': 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Completed: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Cancelled: 'border-red-500/40 text-red-400 bg-red-500/10',
};

export const OUTREACH_CHANNELS = ['Email', 'LinkedIn', 'Phone', 'WhatsApp', 'Postal Mail', 'In Person', 'Partner Referral'];

export const OUTREACH_STATUSES = ['Not Contacted', 'Outreach Sent', 'Follow-up Pending', 'Responded', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];

export const OUTREACH_STATUS_COLORS: Record<string, string> = {
  'Not Contacted': 'border-gray-500/40 text-gray-400 bg-gray-500/10',
  'Outreach Sent': 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  'Follow-up Pending': 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  Responded: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  'Meeting Scheduled': 'border-orange-500/40 text-orange-400 bg-orange-500/10',
  'Proposal Sent': 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  Won: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Lost: 'border-red-500/40 text-red-400 bg-red-500/10',
};

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500–1000', '1000+'];

export const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Hospitality', 'Logistics', 'Legal',
  'Media', 'FMCG', 'Automotive', 'Agriculture', 'Other',
];
