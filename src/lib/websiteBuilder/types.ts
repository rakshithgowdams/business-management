export type SectionType =
  | 'header'
  | 'hero'
  | 'stats'
  | 'services'
  | 'about'
  | 'team'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'gallery'
  | 'blog'
  | 'contact'
  | 'cta'
  | 'free_call'
  | 'footer'
  | 'custom';

export type AnimationType =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'fadeIn'
  | 'zoomIn'
  | 'zoomOut'
  | 'slideUp'
  | 'slideDown'
  | 'flipLeft'
  | 'flipUp'
  | 'bounce'
  | 'none';

export interface SectionAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  stagger?: boolean;
}

export interface WebsiteProject {
  id: string;
  user_id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  published: boolean;
  theme_color: string;
  secondary_color: string;
  font_family: string;
  dark_mode: boolean;
  favicon_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
  custom_css: string;
  custom_js: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSection {
  id: string;
  project_id: string;
  user_id: string;
  section_type: SectionType;
  label: string;
  enabled: boolean;
  order_index: number;
  config: Record<string, unknown>;
  animation: SectionAnimation;
  created_at: string;
  updated_at: string;
}

export interface NavLink { label: string; href: string }

export interface HeaderConfig {
  logo_text: string;
  logo_url: string;
  nav_links: NavLink[];
  sticky: boolean;
  transparent: boolean;
  cta_text: string;
  cta_href: string;
  show_cta: boolean;
}

export interface HeroConfig {
  headline: string;
  subheadline: string;
  body_text: string;
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
  show_secondary_cta: boolean;
  image_url: string;
  layout: 'centered' | 'left' | 'right' | 'split';
  bg_style: 'gradient' | 'solid' | 'image' | 'video';
  bg_value: string;
  show_badge: boolean;
  badge_text: string;
  show_stats: boolean;
  stats: { value: string; label: string }[];
}

export interface StatItem { value: string; label: string; icon: string; prefix: string; suffix: string }
export interface StatsConfig {
  heading: string;
  subheading: string;
  items: StatItem[];
  bg_style: 'dark' | 'light' | 'colored';
  layout: 'row' | 'grid';
}

export interface ServiceItem { icon: string; title: string; description: string; link_text: string; link_href: string; badge: string }
export interface ServicesConfig {
  heading: string;
  subheading: string;
  body_text: string;
  items: ServiceItem[];
  layout: 'grid' | 'list' | 'cards';
  columns: 2 | 3 | 4;
  show_cta: boolean;
  cta_text: string;
  cta_href: string;
}

export interface AboutConfig {
  heading: string;
  subheading: string;
  body_text: string;
  mission: string;
  vision: string;
  values: string[];
  image_url: string;
  layout: 'left' | 'right' | 'centered';
  show_values: boolean;
  founded_year: string;
  team_size: string;
  clients_served: string;
}

export interface TeamMember { name: string; role: string; bio: string; image_url: string; linkedin: string; twitter: string; email: string }
export interface TeamConfig {
  heading: string;
  subheading: string;
  body_text: string;
  members: TeamMember[];
  layout: 'grid' | 'carousel';
  columns: 3 | 4;
  show_social: boolean;
}

export interface Testimonial { name: string; role: string; company: string; text: string; avatar_url: string; rating: number }
export interface TestimonialsConfig {
  heading: string;
  subheading: string;
  items: Testimonial[];
  layout: 'grid' | 'carousel' | 'masonry';
  show_rating: boolean;
}

export interface PricingTier { name: string; price: string; period: string; description: string; features: string[]; cta_text: string; cta_href: string; highlighted: boolean; badge: string }
export interface PricingConfig {
  heading: string;
  subheading: string;
  tiers: PricingTier[];
  show_toggle: boolean;
  billing_period: 'monthly' | 'yearly';
}

export interface FaqItem { question: string; answer: string }
export interface FaqConfig {
  heading: string;
  subheading: string;
  items: FaqItem[];
  layout: 'accordion' | 'two-col';
}

export interface GalleryImage { url: string; alt: string; caption: string; category: string }
export interface GalleryConfig {
  heading: string;
  subheading: string;
  images: GalleryImage[];
  layout: 'grid' | 'masonry' | 'carousel';
  columns: 2 | 3 | 4;
  show_captions: boolean;
  show_filter: boolean;
}

export interface BlogPost { title: string; excerpt: string; image_url: string; date: string; author: string; tag: string; link: string }
export interface BlogConfig {
  heading: string;
  subheading: string;
  posts: BlogPost[];
  columns: 2 | 3;
  show_cta: boolean;
  cta_text: string;
  cta_href: string;
}

export interface ContactConfig {
  heading: string;
  subheading: string;
  body_text: string;
  email: string;
  phone: string;
  address: string;
  show_map: boolean;
  map_embed_url: string;
  show_form: boolean;
  form_fields: string[];
  whatsapp: string;
  social_links: { platform: string; url: string }[];
}

export interface CtaConfig {
  heading: string;
  subheading: string;
  body_text: string;
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
  show_secondary: boolean;
  bg_style: 'gradient' | 'solid' | 'image';
  bg_value: string;
  layout: 'centered' | 'split';
}

export interface FreeCallConfig {
  heading: string;
  subheading: string;
  body_text: string;
  calendar_url: string;
  show_benefits: boolean;
  benefits: string[];
  cta_text: string;
  meeting_duration: string;
  image_url: string;
  show_image: boolean;
}

export interface FooterConfig {
  brand_name: string;
  brand_description: string;
  logo_url: string;
  columns: { heading: string; links: { label: string; href: string }[] }[];
  copyright_text: string;
  show_social: boolean;
  social_links: { platform: string; url: string }[];
  show_newsletter: boolean;
  newsletter_text: string;
  newsletter_placeholder: string;
}

export interface CustomConfig {
  html: string;
  css: string;
  label: string;
}

export interface BrandKitSocialLinks {
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
  youtube: string;
  website: string;
}

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  logo_url: string;
  logo_dark_url: string;
  logo_icon_url: string;
  brand_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  neutral_dark: string;
  neutral_mid: string;
  neutral_light: string;
  heading_font: string;
  body_font: string;
  mono_font: string;
  font_size_base: string;
  font_weight_heading: string;
  font_weight_body: string;
  line_height_body: string;
  border_radius: string;
  button_style: string;
  shadow_style: string;
  social_links: BrandKitSocialLinks;
  brand_voice: string;
  industry: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
