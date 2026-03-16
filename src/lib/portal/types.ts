export interface ClientPortal {
  id: string;
  user_id: string;
  client_id: string | null;
  portal_name: string;
  portal_slug: string;
  access_code: string;
  access_code_hash: string;
  is_active: boolean;
  expires_at: string | null;
  branding_logo_url: string;
  branding_color: string;
  welcome_message: string;
  company_description: string;
  allowed_sections: PortalSections;
  last_accessed_at: string | null;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface PortalSections {
  portfolio: boolean;
  case_studies: boolean;
  testimonials: boolean;
  services: boolean;
  team: boolean;
  documents: boolean;
  project_progress: boolean;
  announcements: boolean;
  faq: boolean;
}

export interface PortalCaseStudy {
  id: string;
  user_id: string;
  portal_id: string;
  title: string;
  client_name: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  before_image_url: string;
  after_image_url: string;
  before_metrics: PortalMetric[];
  after_metrics: PortalMetric[];
  tags: string;
  testimonial_quote: string;
  testimonial_author: string;
  is_featured: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalMetric {
  label: string;
  value: string;
}

export interface PortalPortfolioItem {
  id: string;
  user_id: string;
  portal_id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  gallery_urls: string[];
  project_url: string;
  technologies: string;
  completion_date: string | null;
  is_featured: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalTestimonial {
  id: string;
  user_id: string;
  portal_id: string;
  author_name: string;
  author_title: string;
  author_company: string;
  author_avatar_url: string;
  quote: string;
  rating: number;
  project_name: string;
  is_featured: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface PortalSharedDocument {
  id: string;
  user_id: string;
  portal_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_path: string;
  file_size: number;
  description: string;
  download_count: number;
  uploaded_via: string;
  is_visible: boolean;
  created_at: string;
}

export interface PortalAnnouncement {
  id: string;
  user_id: string;
  portal_id: string;
  title: string;
  message: string;
  priority: string;
  is_pinned: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalFAQ {
  id: string;
  user_id: string;
  portal_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface PortalService {
  id: string;
  user_id: string;
  portal_id: string;
  service_name: string;
  description: string;
  icon: string;
  features: string[];
  price_range: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface PortalTeamMember {
  id: string;
  user_id: string;
  portal_id: string;
  name: string;
  title: string;
  avatar_url: string;
  bio: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface PortalSharedProject {
  id: string;
  user_id: string;
  portal_id: string;
  project_id: string;
  show_timeline: boolean;
  show_budget: boolean;
  show_deliverables: boolean;
  show_progress: boolean;
  custom_note: string;
  is_visible: boolean;
  created_at: string;
  projects?: {
    id: string;
    name: string;
    status: string;
    budget: number;
    start_date: string;
    end_date: string;
    description: string;
  };
}

export interface PortalActivityLog {
  id: string;
  portal_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface PortalPublicData {
  portal: {
    name: string;
    logo: string;
    color: string;
    welcome: string;
    description: string;
    sections: PortalSections;
  };
  owner: {
    full_name?: string;
    business_name?: string;
    avatar_url?: string;
  };
  case_studies: PortalCaseStudy[];
  portfolio: PortalPortfolioItem[];
  testimonials: PortalTestimonial[];
  services: PortalService[];
  team: PortalTeamMember[];
  documents: PortalSharedDocument[];
  shared_projects: PortalSharedProject[];
  announcements: PortalAnnouncement[];
  faq: PortalFAQ[];
}
