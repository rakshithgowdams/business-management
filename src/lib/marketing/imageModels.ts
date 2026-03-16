export interface ImageModelDef {
  id: string;
  label: string;
  category: string;
  model: string;
  endpoint: 'market' | '4o' | 'flux_kontext';
}

export const TEXT_TO_IMAGE_MODELS: ImageModelDef[] = [
  { id: 'gpt-image-1.5', label: 'GPT Image 1.5', category: 'OpenAI', model: 'gpt-image/1.5-text-to-image', endpoint: 'market' },
  { id: '4o-image', label: '4o Image (GPT-Image-1)', category: 'OpenAI', model: '', endpoint: '4o' },
  { id: 'seedream-4.5', label: 'Seedream 4.5', category: 'Bytedance', model: 'seedream/4.5-text-to-image', endpoint: 'market' },
  { id: 'seedream-4.0', label: 'Seedream 4.0', category: 'Bytedance', model: 'bytedance/seedream-v4-text-to-image', endpoint: 'market' },
  { id: 'seedream-3.0', label: 'Seedream 3.0', category: 'Bytedance', model: 'bytedance/seedream', endpoint: 'market' },
  { id: 'flux-2-pro', label: 'Flux 2 Pro', category: 'Black Forest Labs', model: 'flux-2/pro-text-to-image', endpoint: 'market' },
  { id: 'flux-2-flex', label: 'Flux 2 Flex', category: 'Black Forest Labs', model: 'flux-2/flex-text-to-image', endpoint: 'market' },
  { id: 'flux-kontext-pro', label: 'Flux Kontext Pro', category: 'Black Forest Labs', model: 'flux-kontext-pro', endpoint: 'flux_kontext' },
  { id: 'flux-kontext-max', label: 'Flux Kontext Max', category: 'Black Forest Labs', model: 'flux-kontext-max', endpoint: 'flux_kontext' },
  { id: 'google-nano-banana', label: 'Nano Banana (Gemini 2.5 Flash)', category: 'Google', model: 'google/nano-banana', endpoint: 'market' },
  { id: 'google-nano-banana-pro', label: 'Nano Banana Pro (Gemini 3 Pro)', category: 'Google', model: 'google/nano-banana-pro', endpoint: 'market' },
  { id: 'google-nano-banana-2', label: 'Nano Banana 2 (Gemini 3.1 Flash)', category: 'Google', model: 'google/nano-banana-2', endpoint: 'market' },
  { id: 'google-imagen4', label: 'Imagen 4', category: 'Google', model: 'google/imagen4', endpoint: 'market' },
  { id: 'google-imagen4-fast', label: 'Imagen 4 Fast', category: 'Google', model: 'google/imagen4-fast', endpoint: 'market' },
  { id: 'google-imagen4-ultra', label: 'Imagen 4 Ultra', category: 'Google', model: 'google/imagen4-ultra', endpoint: 'market' },
  { id: 'grok-imagine-t2i', label: 'Grok Imagine', category: 'xAI', model: 'grok-imagine/text-to-image', endpoint: 'market' },
  { id: 'qwen-t2i', label: 'Qwen Text-to-Image', category: 'Alibaba', model: 'qwen/text-to-image', endpoint: 'market' },
  { id: 'ideogram-v3', label: 'Ideogram V3', category: 'Ideogram', model: 'ideogram/v3-text-to-image', endpoint: 'market' },
  { id: 'ideogram-character', label: 'Ideogram Character', category: 'Ideogram', model: 'ideogram/character', endpoint: 'market' },
  { id: 'z-image', label: 'Z-Image', category: 'Other', model: 'z-image', endpoint: 'market' },
  { id: 'midjourney-t2i', label: 'Midjourney', category: 'Midjourney', model: 'mj-api', endpoint: 'market' },
];

export const IMAGE_TO_IMAGE_MODELS: ImageModelDef[] = [
  { id: 'flux-2-pro-i2i', label: 'Flux 2 Pro I2I', category: 'Black Forest Labs', model: 'flux-2/pro-image-to-image', endpoint: 'market' },
  { id: 'flux-2-flex-i2i', label: 'Flux 2 Flex I2I', category: 'Black Forest Labs', model: 'flux-2/flex-image-to-image', endpoint: 'market' },
  { id: 'flux-kontext-pro-i2i', label: 'Flux Kontext Pro I2I', category: 'Black Forest Labs', model: 'flux-kontext-pro', endpoint: 'flux_kontext' },
  { id: 'flux-kontext-max-i2i', label: 'Flux Kontext Max I2I', category: 'Black Forest Labs', model: 'flux-kontext-max', endpoint: 'flux_kontext' },
  { id: 'gpt-image-1.5-i2i', label: 'GPT Image 1.5 I2I', category: 'OpenAI', model: 'gpt-image/1.5-image-to-image', endpoint: 'market' },
  { id: '4o-image-i2i', label: '4o Image I2I', category: 'OpenAI', model: '', endpoint: '4o' },
  { id: 'qwen-i2i', label: 'Qwen Image-to-Image', category: 'Alibaba', model: 'qwen/image-to-image', endpoint: 'market' },
  { id: 'grok-imagine-i2i', label: 'Grok Imagine I2I', category: 'xAI', model: 'grok-imagine/image-to-image', endpoint: 'market' },
  { id: 'google-nano-banana-edit', label: 'Nano Banana Edit', category: 'Google', model: 'google/nano-banana-edit', endpoint: 'market' },
  { id: 'ideogram-char-remix', label: 'Ideogram Character Remix', category: 'Ideogram', model: 'ideogram/character-remix', endpoint: 'market' },
  { id: 'midjourney-i2i', label: 'Midjourney I2I', category: 'Midjourney', model: 'mj-api-i2i', endpoint: 'market' },
  { id: 'recraft-upscale', label: 'Recraft Crisp Upscale', category: 'Tools', model: 'recraft/crisp-upscale', endpoint: 'market' },
  { id: 'recraft-remove-bg', label: 'Remove Background', category: 'Tools', model: 'recraft/remove-background', endpoint: 'market' },
  { id: 'topaz-upscale', label: 'Topaz Image Upscale', category: 'Tools', model: 'topaz/image-upscale', endpoint: 'market' },
];

export const IMAGE_EDITING_MODELS: ImageModelDef[] = [
  { id: 'seedream-4.5-edit', label: 'Seedream 4.5 Edit', category: 'Bytedance', model: 'seedream/4.5-edit', endpoint: 'market' },
  { id: 'seedream-4.0-edit', label: 'Seedream 4.0 Edit', category: 'Bytedance', model: 'seedream/4.0-edit', endpoint: 'market' },
  { id: 'qwen-edit', label: 'Qwen Image Edit', category: 'Alibaba', model: 'qwen/image-edit', endpoint: 'market' },
  { id: 'google-nano-banana-edit', label: 'Nano Banana Edit', category: 'Google', model: 'google/nano-banana-edit', endpoint: 'market' },
  { id: 'ideogram-char-edit', label: 'Ideogram Character Edit', category: 'Ideogram', model: 'ideogram/character-edit', endpoint: 'market' },
  { id: 'ideogram-v3-reframe', label: 'Ideogram V3 Reframe', category: 'Ideogram', model: 'ideogram/v3-reframe', endpoint: 'market' },
  { id: 'flux-kontext-pro-edit', label: 'Flux Kontext Pro Edit', category: 'Black Forest Labs', model: 'flux-kontext-pro', endpoint: 'flux_kontext' },
  { id: 'flux-kontext-max-edit', label: 'Flux Kontext Max Edit', category: 'Black Forest Labs', model: 'flux-kontext-max', endpoint: 'flux_kontext' },
  { id: '4o-image-edit', label: '4o Image Edit', category: 'OpenAI', model: '', endpoint: '4o' },
];

export const TEMPLATE_CATEGORIES = [
  'Marketing',
  'UGC',
  'Product',
  'Social Media',
  'E-commerce',
  'Branding',
  'Portrait',
  'Cinematic',
  'Custom',
];

export interface ImageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  master_prompt: string;
  reference_image_url: string | null;
  reference_image_path: string | null;
  tags: string[];
  default_model: string | null;
  default_aspect_ratio: string | null;
  default_style: string | null;
  created_at: string;
  updated_at: string;
}
