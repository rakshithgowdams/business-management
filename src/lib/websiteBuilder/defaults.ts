import type {
  SectionType, HeaderConfig, HeroConfig, StatsConfig, ServicesConfig, AboutConfig,
  TeamConfig, TestimonialsConfig, PricingConfig, FaqConfig, GalleryConfig,
  BlogConfig, ContactConfig, CtaConfig, FreeCallConfig, FooterConfig, CustomConfig,
  SectionAnimation,
} from './types';

export const DEFAULT_ANIMATION: SectionAnimation = {
  type: 'fadeUp',
  duration: 600,
  delay: 0,
  easing: 'ease-out',
  stagger: true,
};

export const ANIMATION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'fadeUp', label: 'Fade Up' },
  { value: 'fadeDown', label: 'Fade Down' },
  { value: 'fadeLeft', label: 'Fade Left' },
  { value: 'fadeRight', label: 'Fade Right' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'zoomOut', label: 'Zoom Out' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'flipLeft', label: 'Flip Left' },
  { value: 'flipUp', label: 'Flip Up' },
  { value: 'bounce', label: 'Bounce' },
];

export const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans',
  'Lato', 'Raleway', 'Nunito', 'Playfair Display', 'DM Sans',
  'Plus Jakarta Sans', 'Outfit', 'Sora', 'Lexend', 'Work Sans',
  'Source Sans 3', 'Manrope', 'Figtree', 'Geist', 'Space Grotesk',
  'Libre Baskerville', 'Merriweather', 'Lora', 'Cormorant Garamond',
  'EB Garamond', 'Crimson Text', 'Josefin Sans', 'Rubik', 'Barlow',
  'Nunito Sans', 'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono',
  'JetBrains Mono', 'Fira Code', 'Source Code Pro',
];

export const GOOGLE_FONTS_EMBED_URL = (fonts: string[]) => {
  const families = fonts
    .filter(f => !['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Geist'].includes(f))
    .map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

export const ICON_OPTIONS = [
  'Zap', 'Star', 'Shield', 'CheckCircle', 'Globe', 'Briefcase',
  'Users', 'TrendingUp', 'Brain', 'Target', 'Award', 'Heart',
  'Code', 'Camera', 'Mic', 'Music', 'Layers', 'Box',
  'Cloud', 'Lock', 'Phone', 'Mail', 'MessageSquare', 'Rocket',
];

export const SECTION_LABELS: Record<SectionType, string> = {
  header: 'Header / Navigation',
  hero: 'Hero Section',
  stats: 'Stats & Numbers',
  services: 'Services',
  about: 'About Us',
  team: 'Our Team',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'FAQ',
  gallery: 'Gallery / Portfolio',
  blog: 'Blog / Articles',
  contact: 'Contact Us',
  cta: 'Call to Action',
  free_call: 'Free 1:1 Call',
  footer: 'Footer',
  custom: 'Custom Section',
};

export const SECTION_ICONS: Record<SectionType, string> = {
  header: 'Menu',
  hero: 'Sparkles',
  stats: 'BarChart3',
  services: 'Briefcase',
  about: 'Info',
  team: 'Users',
  testimonials: 'Star',
  pricing: 'Tag',
  faq: 'HelpCircle',
  gallery: 'Image',
  blog: 'FileText',
  contact: 'Mail',
  cta: 'Megaphone',
  free_call: 'Phone',
  footer: 'Layout',
  custom: 'Code',
};

export const DEFAULT_SECTION_ORDER: SectionType[] = [
  'header', 'hero', 'stats', 'services', 'about',
  'team', 'testimonials', 'pricing', 'faq', 'gallery',
  'blog', 'free_call', 'contact', 'cta', 'footer',
];

export function getDefaultConfig(type: SectionType): Record<string, unknown> {
  switch (type) {
    case 'header': return {
      logo_text: 'My Business',
      logo_url: '',
      nav_links: [
        { label: 'Home', href: '#hero' },
        { label: 'Services', href: '#services' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ],
      sticky: true,
      transparent: true,
      cta_text: 'Get Started',
      cta_href: '#contact',
      show_cta: true,
    } as HeaderConfig;

    case 'hero': return {
      headline: 'Welcome to Our Business',
      subheadline: 'We deliver exceptional results',
      body_text: 'We are a professional team dedicated to helping your business grow with innovative solutions and expert guidance.',
      cta_primary_text: 'Get Started',
      cta_primary_href: '#contact',
      cta_secondary_text: 'Learn More',
      cta_secondary_href: '#services',
      show_secondary_cta: true,
      image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
      layout: 'left',
      bg_style: 'gradient',
      bg_value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      show_badge: true,
      badge_text: 'Now Available',
      show_stats: true,
      stats: [
        { value: '500+', label: 'Happy Clients' },
        { value: '10+', label: 'Years Experience' },
        { value: '99%', label: 'Satisfaction Rate' },
      ],
    } as HeroConfig;

    case 'stats': return {
      heading: 'Our Numbers Speak',
      subheading: 'Built on trust and proven results',
      items: [
        { value: '500', label: 'Happy Clients', icon: 'Users', prefix: '', suffix: '+' },
        { value: '10', label: 'Years Experience', icon: 'Award', prefix: '', suffix: '+' },
        { value: '99', label: 'Satisfaction Rate', icon: 'Star', prefix: '', suffix: '%' },
        { value: '50', label: 'Team Members', icon: 'Briefcase', prefix: '', suffix: '+' },
      ],
      bg_style: 'dark',
      layout: 'row',
    } as StatsConfig;

    case 'services': return {
      heading: 'What We Offer',
      subheading: 'Comprehensive solutions for your needs',
      body_text: 'From strategy to execution, we provide end-to-end services that drive real results for your business.',
      items: [
        { icon: 'Zap', title: 'Strategy & Consulting', description: 'We help you define a clear roadmap and strategy to achieve your business goals.', link_text: 'Learn More', link_href: '#contact', badge: '' },
        { icon: 'Globe', title: 'Digital Marketing', description: 'Data-driven digital marketing campaigns that reach your ideal customers.', link_text: 'Learn More', link_href: '#contact', badge: 'Popular' },
        { icon: 'Code', title: 'Web Development', description: 'Modern, responsive websites and web applications built for performance.', link_text: 'Learn More', link_href: '#contact', badge: '' },
        { icon: 'TrendingUp', title: 'Growth Analytics', description: 'Actionable insights and analytics to accelerate your business growth.', link_text: 'Learn More', link_href: '#contact', badge: '' },
        { icon: 'Shield', title: 'Brand Identity', description: 'Build a powerful brand identity that resonates with your audience.', link_text: 'Learn More', link_href: '#contact', badge: '' },
        { icon: 'MessageSquare', title: 'Customer Support', description: '24/7 dedicated support to help you and your customers succeed.', link_text: 'Learn More', link_href: '#contact', badge: '' },
      ],
      layout: 'cards',
      columns: 3,
      show_cta: true,
      cta_text: 'View All Services',
      cta_href: '#contact',
    } as ServicesConfig;

    case 'about': return {
      heading: 'About Our Company',
      subheading: 'A story built on passion and expertise',
      body_text: 'We are a team of dedicated professionals who are passionate about helping businesses succeed. With over a decade of experience, we bring deep expertise and fresh ideas to every project.',
      mission: 'To empower businesses with innovative solutions that drive sustainable growth.',
      vision: 'To become the most trusted business partner for entrepreneurs and enterprises globally.',
      values: ['Integrity', 'Innovation', 'Excellence', 'Collaboration'],
      image_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800',
      layout: 'right',
      show_values: true,
      founded_year: '2015',
      team_size: '50+',
      clients_served: '500+',
    } as AboutConfig;

    case 'team': return {
      heading: 'Meet Our Team',
      subheading: 'The talented people behind our success',
      body_text: 'Our diverse team brings together expertise from multiple disciplines to deliver outstanding results.',
      members: [
        { name: 'Alex Johnson', role: 'CEO & Founder', bio: 'Visionary leader with 15+ years of industry experience.', image_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400', linkedin: '', twitter: '', email: '' },
        { name: 'Sarah Williams', role: 'Head of Design', bio: 'Award-winning designer with a passion for beautiful UX.', image_url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400', linkedin: '', twitter: '', email: '' },
        { name: 'Michael Chen', role: 'Lead Developer', bio: 'Full-stack engineer who loves solving complex problems.', image_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400', linkedin: '', twitter: '', email: '' },
        { name: 'Priya Sharma', role: 'Marketing Director', bio: 'Growth expert who has scaled multiple startups.', image_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400', linkedin: '', twitter: '', email: '' },
      ],
      layout: 'grid',
      columns: 4,
      show_social: true,
    } as TeamConfig;

    case 'testimonials': return {
      heading: 'What Our Clients Say',
      subheading: 'Real results from real businesses',
      items: [
        { name: 'Rajesh Menon', role: 'CEO', company: 'TechCorp India', text: 'Working with this team transformed our business. The results exceeded all expectations.', avatar_url: '', rating: 5 },
        { name: 'Priya Hegde', role: 'Founder', company: 'DesignWave', text: 'Exceptional quality and attention to detail. Highly recommend to any business owner.', avatar_url: '', rating: 5 },
        { name: 'Suresh Gowda', role: 'Director', company: 'StartupHub', text: 'Professional, responsive, and incredibly skilled. Best investment we made for our business.', avatar_url: '', rating: 5 },
      ],
      layout: 'grid',
      show_rating: true,
    } as TestimonialsConfig;

    case 'pricing': return {
      heading: 'Simple, Transparent Pricing',
      subheading: 'No hidden fees. Cancel anytime.',
      tiers: [
        { name: 'Starter', price: '₹999', period: '/month', description: 'Perfect for small businesses just getting started.', features: ['5 Projects', '10 Clients', 'Basic Analytics', 'Email Support'], cta_text: 'Get Started', cta_href: '#contact', highlighted: false, badge: '' },
        { name: 'Professional', price: '₹2,499', period: '/month', description: 'For growing businesses that need more power.', features: ['Unlimited Projects', '50 Clients', 'Advanced Analytics', 'Priority Support', 'Custom Integrations'], cta_text: 'Start Free Trial', cta_href: '#contact', highlighted: true, badge: 'Most Popular' },
        { name: 'Enterprise', price: 'Custom', period: '', description: 'For large teams and enterprise-scale needs.', features: ['Everything in Pro', 'Dedicated Account Manager', 'Custom Development', 'SLA Guarantee', '24/7 Phone Support'], cta_text: 'Contact Sales', cta_href: '#contact', highlighted: false, badge: '' },
      ],
      show_toggle: false,
      billing_period: 'monthly',
    } as PricingConfig;

    case 'faq': return {
      heading: 'Frequently Asked Questions',
      subheading: 'Everything you need to know',
      items: [
        { question: 'How do I get started?', answer: 'Simply click the Get Started button and fill out our quick onboarding form. We\'ll set up a discovery call within 24 hours.' },
        { question: 'What is your pricing model?', answer: 'We offer flexible monthly and annual plans. All plans come with a 14-day free trial, no credit card required.' },
        { question: 'Do you offer custom solutions?', answer: 'Yes! We specialize in custom solutions tailored to your specific business needs and goals.' },
        { question: 'What kind of support do you provide?', answer: 'All plans include email support. Professional and Enterprise plans include priority support and dedicated account management.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely. There are no long-term contracts. You can cancel or change your plan anytime from your account settings.' },
      ],
      layout: 'accordion',
    } as FaqConfig;

    case 'gallery': return {
      heading: 'Our Work',
      subheading: 'A showcase of our best projects',
      images: [
        { url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 1', caption: 'Brand Identity Design', category: 'Design' },
        { url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 2', caption: 'Marketing Campaign', category: 'Marketing' },
        { url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 3', caption: 'Web Development', category: 'Development' },
        { url: 'https://images.pexels.com/photos/3182774/pexels-photo-3182774.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 4', caption: 'Product Launch', category: 'Marketing' },
        { url: 'https://images.pexels.com/photos/4549414/pexels-photo-4549414.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 5', caption: 'Social Media Strategy', category: 'Marketing' },
        { url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Project 6', caption: 'UI/UX Redesign', category: 'Design' },
      ],
      layout: 'grid',
      columns: 3,
      show_captions: true,
      show_filter: true,
    } as GalleryConfig;

    case 'blog': return {
      heading: 'Latest Insights',
      subheading: 'Stay updated with our latest articles',
      posts: [
        { title: '10 Strategies to Grow Your Business in 2025', excerpt: 'Discover the most effective strategies that top businesses are using to drive growth and increase revenue this year.', image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600', date: '2025-01-15', author: 'Alex Johnson', tag: 'Business', link: '#' },
        { title: 'The Future of Digital Marketing', excerpt: 'AI, personalization, and data-driven strategies are reshaping how brands connect with their audiences.', image_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600', date: '2025-01-10', author: 'Priya Sharma', tag: 'Marketing', link: '#' },
        { title: 'Building a Strong Brand Identity', excerpt: 'Your brand is more than a logo. Learn how to build a cohesive brand identity that resonates with your target audience.', image_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600', date: '2025-01-05', author: 'Sarah Williams', tag: 'Design', link: '#' },
      ],
      columns: 3,
      show_cta: true,
      cta_text: 'View All Articles',
      cta_href: '#',
    } as BlogConfig;

    case 'contact': return {
      heading: 'Get In Touch',
      subheading: 'We\'d love to hear from you',
      body_text: 'Whether you have a question, a project in mind, or just want to say hello — our team is always ready to help.',
      email: 'hello@mybusiness.com',
      phone: '+91 98765 43210',
      address: '123 Business Street, Mumbai, India 400001',
      show_map: false,
      map_embed_url: '',
      show_form: true,
      form_fields: ['name', 'email', 'phone', 'subject', 'message'],
      whatsapp: '+919876543210',
      social_links: [
        { platform: 'linkedin', url: '' },
        { platform: 'twitter', url: '' },
        { platform: 'instagram', url: '' },
      ],
    } as ContactConfig;

    case 'cta': return {
      heading: 'Ready to Get Started?',
      subheading: 'Join hundreds of businesses that trust us',
      body_text: 'Take the first step towards transforming your business. Our team is ready to help you achieve your goals.',
      cta_primary_text: 'Start Today',
      cta_primary_href: '#contact',
      cta_secondary_text: 'Learn More',
      cta_secondary_href: '#services',
      show_secondary: true,
      bg_style: 'gradient',
      bg_value: '',
      layout: 'centered',
    } as CtaConfig;

    case 'free_call': return {
      heading: 'Book a Free 1:1 Strategy Call',
      subheading: '30 minutes that could change your business',
      body_text: 'Let\'s get on a call and understand your business challenges. No commitment, no pressure — just real, actionable advice tailored to your situation.',
      calendar_url: 'https://calendly.com/',
      show_benefits: true,
      benefits: [
        'Personalized business assessment',
        'Actionable growth strategies',
        'No sales pressure — just honest advice',
        'Available in English & Hindi',
      ],
      cta_text: 'Book My Free Call',
      meeting_duration: '30 minutes',
      image_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600',
      show_image: true,
    } as FreeCallConfig;

    case 'footer': return {
      brand_name: 'My Business',
      brand_description: 'Professional services for businesses of all sizes. Built with passion, delivered with excellence.',
      logo_url: '',
      columns: [
        { heading: 'Services', links: [{ label: 'Consulting', href: '#services' }, { label: 'Development', href: '#services' }, { label: 'Marketing', href: '#services' }] },
        { heading: 'Company', links: [{ label: 'About Us', href: '#about' }, { label: 'Our Team', href: '#team' }, { label: 'Blog', href: '#blog' }] },
        { heading: 'Contact', links: [{ label: 'Get In Touch', href: '#contact' }, { label: 'Book a Call', href: '#free_call' }, { label: 'Support', href: '#contact' }] },
      ],
      copyright_text: `© ${new Date().getFullYear()} My Business. All rights reserved.`,
      show_social: true,
      social_links: [
        { platform: 'linkedin', url: '' },
        { platform: 'twitter', url: '' },
        { platform: 'instagram', url: '' },
        { platform: 'facebook', url: '' },
      ],
      show_newsletter: true,
      newsletter_text: 'Subscribe to our newsletter',
      newsletter_placeholder: 'Enter your email',
    } as FooterConfig;

    case 'custom': return {
      html: '<div class="text-center py-16"><h2 class="text-3xl font-bold">Custom Section</h2><p class="text-gray-500 mt-4">Edit this section with your own HTML</p></div>',
      css: '',
      label: 'Custom Section',
    } as CustomConfig;

    default: return {};
  }
}
