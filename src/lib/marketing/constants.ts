export const GENRES = [
  { key: 'corporate', label: 'Corporate', icon: '🎬' },
  { key: 'luxury', label: 'Luxury', icon: '🌅' },
  { key: 'social', label: 'Social/Viral', icon: '📱' },
  { key: 'narrative', label: 'Narrative', icon: '🎭' },
  { key: 'inspirational', label: 'Inspirational', icon: '🏆' },
  { key: 'product_ad', label: 'Product Ad', icon: '🛒' },
  { key: 'festival', label: 'Festival/Cultural', icon: '🎊' },
  { key: 'tech', label: 'Tech/AI', icon: '🤖' },
];

export const TONES = [
  { key: 'professional', label: 'Professional', icon: '💼' },
  { key: 'aspirational', label: 'Aspirational', icon: '✨' },
  { key: 'warm', label: 'Warm/Human', icon: '😊' },
  { key: 'high_energy', label: 'High Energy', icon: '⚡' },
  { key: 'elegant', label: 'Elegant', icon: '🌸' },
  { key: 'cultural', label: 'Indian Cultural', icon: '🇮🇳' },
];

export const SCENE_DURATIONS = ['5s', '8s', '10s', '15s'];

export const PLATFORMS = ['Instagram Reel', 'YouTube Shorts', 'LinkedIn', 'Ad Campaign'];

export const CAMERA_BODIES = [
  { key: 'dslr', label: 'DSLR Full Frame', icon: '📷' },
  { key: 'cinema', label: 'Cinema Film Grade', icon: '🎬' },
  { key: 'phone', label: 'Phone Mobile Native', icon: '📹' },
  { key: 'vintage', label: 'Vintage 16mm Film', icon: '📽️' },
  { key: 'ai_optimal', label: 'AI Optimal (Auto)', icon: '🤖' },
];

export const LENS_TYPES = [
  { key: 'standard', label: 'Sharp Standard 50mm', icon: '🎯' },
  { key: 'anamorphic', label: 'Cinema Anamorphic', icon: '🎞️' },
  { key: 'wide', label: 'Wide Angle 24mm', icon: '🌊' },
  { key: 'telephoto', label: 'Tele Portrait 85mm+', icon: '🔍' },
  { key: 'macro', label: 'Macro Close Up', icon: '👁️' },
];

export const FILM_LOOKS = [
  'Cinematic 24fps',
  'Smooth 60fps',
  'Film Grain',
  'Clean Digital',
];

export const CINEMA_ASPECTS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '21:9 CinemaScope', value: '21:9' },
  { label: '1:1', value: '1:1' },
];

export const VIDEO_MODELS = [
  {
    key: 'kling-v2.1',
    label: 'Kling 2.1',
    desc: 'Best image-to-video quality. Preserves hero frame 100%.',
    specs: '1080p | 5s or 10s',
    cost: '₹60-100',
    recommended: true,
  },
  {
    key: 'veo-3.1',
    label: 'Veo 3.1',
    desc: "Google's model with native audio. Cinematic realism + sound.",
    specs: '1080p | 5s or 10s',
    cost: '₹80-120',
    recommended: false,
  },
  {
    key: 'kling-v1.6',
    label: 'Kling 1.6',
    desc: 'Fast generation, reliable. Good for quick previews.',
    specs: '720p | 5s',
    cost: '₹40-70',
    recommended: false,
  },
];

export const CAMERA_MOVEMENTS = [
  { key: 'dolly_in', label: 'Dolly In', icon: '🎯', row: 'push_pull' },
  { key: 'dolly_out', label: 'Dolly Out', icon: '↩', row: 'push_pull' },
  { key: 'crane_up', label: 'Crane Up', icon: '↑', row: 'push_pull' },
  { key: 'crane_down', label: 'Crane Down', icon: '↓', row: 'push_pull' },
  { key: 'dolly_right', label: 'Dolly Right', icon: '➡', row: 'push_pull' },
  { key: 'dolly_left', label: 'Dolly Left', icon: '⬅', row: 'push_pull' },
  { key: 'orbit_360', label: '360 Orbit', icon: '🔄', row: 'rotation' },
  { key: 'pan_right', label: 'Pan Right', icon: '↗', row: 'rotation' },
  { key: 'pan_left', label: 'Pan Left', icon: '↖', row: 'rotation' },
  { key: 'dutch_angle', label: 'Dutch Angle', icon: '📐', row: 'rotation' },
  { key: 'whip_pan', label: 'Whip Pan', icon: '🌀', row: 'rotation' },
  { key: 'spin_360', label: '360 Spin', icon: '🌀', row: 'rotation' },
  { key: 'crash_zoom_in', label: 'Crash Zoom In', icon: '🔍', row: 'zoom' },
  { key: 'crash_zoom_out', label: 'Crash Zoom Out', icon: '🔎', row: 'zoom' },
  { key: 'focus_change', label: 'Focus Change', icon: '🎭', row: 'zoom' },
  { key: 'bullet_time', label: 'Bullet Time', icon: '🌀', row: 'zoom' },
  { key: 'fpv_drone', label: 'FPV Drone', icon: '🚁', row: 'special' },
  { key: 'hyperlapse', label: 'Hyperlapse', icon: '⏩', row: 'special' },
  { key: 'tracking', label: 'Tracking Shot', icon: '🚂', row: 'special' },
  { key: 'rack_focus', label: 'Rack Focus', icon: '📿', row: 'special' },
  { key: 'handheld', label: 'Handheld', icon: '🌊', row: 'special' },
  { key: 'static_lock', label: 'Static Lock', icon: '🎬', row: 'special' },
  { key: 'vertigo', label: 'Vertigo/Dolly Zoom', icon: '🎭', row: 'cinematic' },
  { key: 'arc_left', label: 'Arc Left', icon: '🔄', row: 'cinematic' },
  { key: 'arc_right', label: 'Arc Right', icon: '🔄', row: 'cinematic' },
  { key: 'helix_rise', label: 'Helix Rise', icon: '🌀', row: 'cinematic' },
  { key: 'through_object', label: 'Through Object', icon: '📷', row: 'cinematic' },
  { key: 'reveal_push', label: 'Reveal Push', icon: '✨', row: 'cinematic' },
];

export const CHARACTER_TYPES = [
  { key: 'real_person', label: 'Real Person', icon: '👤' },
  { key: 'ai_influencer', label: 'AI Influencer', icon: '🤖' },
  { key: 'brand_mascot', label: 'Brand Mascot', icon: '🎭' },
  { key: 'product_model', label: 'Product Model', icon: '🛍️' },
  { key: 'spokesperson', label: 'Spokesperson', icon: '📣' },
  { key: 'company_avatar', label: 'Company Avatar', icon: '🏢' },
];

export const DESIGN_STYLES = [
  { key: 'minimal', label: 'Minimal Clean', icon: '✨' },
  { key: 'bold', label: 'Bold Colorful', icon: '🎨' },
  { key: 'gradient', label: 'Gradient Rich', icon: '🌅' },
  { key: 'photo', label: 'Photo Realistic', icon: '📷' },
  { key: '3d_render', label: '3D Render', icon: '🎭' },
  { key: 'illustrated', label: 'Illustrated', icon: '✏️' },
  { key: 'traditional', label: 'Traditional Indian', icon: '🏛️' },
  { key: 'luxury', label: 'Luxury Premium', icon: '💎' },
  { key: 'social', label: 'Social Native', icon: '📱' },
];

export const PLATFORM_SIZES = [
  { key: 'ig_post', label: 'Instagram Post 1:1', ratio: '1:1' },
  { key: 'ig_story', label: 'Story 9:16', ratio: '9:16' },
  { key: 'linkedin', label: 'LinkedIn 1.91:1', ratio: '16:9' },
  { key: 'youtube', label: 'YouTube 16:9', ratio: '16:9' },
  { key: 'a4', label: 'A4 Portrait', ratio: '3:4' },
  { key: 'presentation', label: 'Presentation 16:9', ratio: '16:9' },
];

export const CAROUSEL_TEMPLATES = [
  { key: 'tips', label: 'Tips Listicle', icon: '📊', desc: '"5 Ways to..."' },
  { key: 'story', label: 'Story Narrative', icon: '📖', desc: '"How I..."' },
  { key: 'product', label: 'Product Showcase', icon: '🛒', desc: '"Meet X"' },
  { key: 'brand', label: 'Brand Campaign', icon: '📣', desc: 'Launch' },
  { key: 'data', label: 'Data Report', icon: '📈', desc: 'Insights' },
];

export const AD_PLATFORMS = [
  { key: 'ig_feed', label: 'Instagram Feed' },
  { key: 'ig_story', label: 'Instagram Story' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube Pre-roll' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'google', label: 'Google Display' },
];

export const AD_OBJECTIVES = [
  { key: 'sales', label: 'Sales/Conversion', icon: '🛒' },
  { key: 'awareness', label: 'Brand Awareness', icon: '👁️' },
  { key: 'leads', label: 'Lead Generation', icon: '📞' },
  { key: 'app_install', label: 'App Install', icon: '📥' },
  { key: 'engagement', label: 'Engagement', icon: '💬' },
  { key: 'educational', label: 'Educational', icon: '🎓' },
];

export const AD_STYLES = [
  { key: 'cinematic', label: 'Cinematic Product', icon: '🎬' },
  { key: 'energy', label: 'High Energy', icon: '💥' },
  { key: 'elegant', label: 'Soft & Elegant', icon: '😌' },
  { key: 'announcement', label: 'Bold Announcement', icon: '📣' },
  { key: 'story', label: 'Story Style', icon: '📖' },
  { key: 'meme', label: 'Meme Format', icon: '😂' },
];

export const MOCKUP_CATEGORIES = [
  { key: 'devices', label: 'Devices', icon: '📱' },
  { key: 'apparel', label: 'Apparel', icon: '👕' },
  { key: 'packaging', label: 'Packaging', icon: '📦' },
  { key: 'frames', label: 'Frames/Prints', icon: '🖼️' },
  { key: 'signage', label: 'Signage', icon: '🏢' },
  { key: 'merchandise', label: 'Merchandise', icon: '☕' },
];

export const MOCKUP_ITEMS: Record<string, { key: string; label: string }[]> = {
  devices: [
    { key: 'iphone15', label: 'iPhone 15' },
    { key: 'samsung', label: 'Samsung Galaxy' },
    { key: 'macbook', label: 'MacBook' },
    { key: 'ipad', label: 'iPad' },
    { key: 'monitor', label: 'Desktop Monitor' },
    { key: 'watch', label: 'Apple Watch' },
    { key: 'tv', label: 'TV Screen' },
  ],
  apparel: [
    { key: 'tshirt_front', label: 'T-shirt (Front)' },
    { key: 'tshirt_back', label: 'T-shirt (Back)' },
    { key: 'hoodie', label: 'Hoodie' },
    { key: 'business_card', label: 'Business Card' },
    { key: 'letterhead', label: 'Letterhead' },
    { key: 'mug', label: 'Mug' },
  ],
  packaging: [
    { key: 'box', label: 'Box Packaging' },
    { key: 'label', label: 'Product Label' },
    { key: 'paper_bag', label: 'Paper Bag' },
    { key: 'bottle', label: 'Bottle Label' },
    { key: 'food', label: 'Food Packaging' },
  ],
  frames: [
    { key: 'canvas', label: 'Canvas Print' },
    { key: 'framed_poster', label: 'Framed Poster' },
    { key: 'billboard', label: 'Billboard' },
    { key: 'laptop_sticker', label: 'Laptop Sticker' },
    { key: 'ig_frame', label: 'Instagram Frame' },
  ],
  signage: [
    { key: 'storefront', label: 'Storefront Sign' },
    { key: 'banner', label: 'Banner Stand' },
    { key: 'vehicle', label: 'Vehicle Wrap' },
  ],
  merchandise: [
    { key: 'tote_bag', label: 'Tote Bag' },
    { key: 'notebook', label: 'Notebook' },
    { key: 'pen', label: 'Branded Pen' },
    { key: 'cap', label: 'Baseball Cap' },
  ],
};

export const MOCKUP_ENVIRONMENTS = [
  { key: 'office', label: 'Office', icon: '🏢' },
  { key: 'lifestyle', label: 'Lifestyle', icon: '🌿' },
  { key: 'white_studio', label: 'White Studio', icon: '⚪' },
  { key: 'urban', label: 'Urban', icon: '🌇' },
  { key: 'outdoor', label: 'Outdoor', icon: '🏖️' },
  { key: 'artistic', label: 'Artistic', icon: '🎨' },
];

export const WORKFLOW_NODE_TYPES = [
  { type: 'text_prompt', label: 'Text Prompt', category: 'input' as const, color: '#1E40AF' },
  { type: 'image_upload', label: 'Image Upload', category: 'input' as const, color: '#1E40AF' },
  { type: 'character_node', label: 'Character', category: 'input' as const, color: '#1E40AF' },
  { type: 'url_input', label: 'URL/Product', category: 'input' as const, color: '#1E40AF' },
  { type: 'image_generate', label: 'Image Generate', category: 'process' as const, color: '#FF6B00' },
  { type: 'video_generate', label: 'Video Generate', category: 'process' as const, color: '#FF6B00' },
  { type: 'image_edit', label: 'Image Edit', category: 'process' as const, color: '#FF6B00' },
  { type: 'upscale', label: 'Upscale', category: 'process' as const, color: '#FF6B00' },
  { type: 'remove_bg', label: 'Remove BG', category: 'process' as const, color: '#FF6B00' },
  { type: 'style_transfer', label: 'Style Transfer', category: 'process' as const, color: '#FF6B00' },
  { type: 'download', label: 'Download', category: 'output' as const, color: '#059669' },
  { type: 'publish_ig', label: 'Publish to IG', category: 'output' as const, color: '#059669' },
  { type: 'save_gallery', label: 'Save to Gallery', category: 'output' as const, color: '#059669' },
  { type: 'export_package', label: 'Export Package', category: 'output' as const, color: '#059669' },
  { type: 'ai_enhance', label: 'AI Enhance Prompt', category: 'utility' as const, color: '#7C3AED' },
  { type: 'variations', label: 'Variations (x4)', category: 'utility' as const, color: '#7C3AED' },
  { type: 'ab_compare', label: 'A/B Compare', category: 'utility' as const, color: '#7C3AED' },
  { type: 'quality_check', label: 'Quality Check', category: 'utility' as const, color: '#7C3AED' },
];

export const WORKFLOW_TEMPLATES = [
  { key: 'photo_to_cinematic', label: 'Photo to Cinematic', icon: '🎬' },
  { key: 'concept_to_carousel', label: 'Concept to Carousel', icon: '📚' },
  { key: 'sketch_to_design', label: 'Sketch to Design', icon: '🖼️' },
  { key: 'photo_to_character', label: 'Photo to Character', icon: '👤' },
  { key: 'product_to_ad', label: 'Product to Ad', icon: '🛒' },
];

export const IMAGE_GEN_MODELS = [
  { key: 'flux-kontext-pro', label: 'Flux Kontext Pro', desc: 'Best character consistency', cost: '₹6/image' },
  { key: 'gpt4o-image', label: 'GPT-4o Image', desc: 'Best for text + product ads', cost: '₹8/image' },
  { key: 'flux-2-pro', label: 'Flux-2 Pro', desc: 'Fast & affordable', cost: '₹3/image' },
];
