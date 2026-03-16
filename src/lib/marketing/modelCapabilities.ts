import type { CustomModel } from './useCustomModels';

export interface ModelCapabilities {
  hasPrompt: boolean;
  hasAspectRatio: boolean;
  hasQuality: boolean;
  hasImageInput: boolean;
  hasDuration: boolean;
  hasStrength: boolean;
  hasCount: boolean;
  hasResolution: boolean;
  defaultAspectRatio: string | null;
  defaultQuality: string | null;
  defaultDuration: string | null;
  defaultStrength: number | null;
  defaultResolution: string | null;
}

const ASPECT_RATIO_KEYS = ['aspect_ratio', 'aspectRatio', 'ratio', 'size'];
const QUALITY_KEYS = ['quality', 'quality_mode'];
const RESOLUTION_KEYS = ['resolution'];
const DURATION_KEYS = ['duration', 'video_duration', 'time'];
const STRENGTH_KEYS = ['strength', 'denoise_strength', 'denoising_strength', 'cfg_scale'];
const COUNT_KEYS = ['nVariants', 'n', 'num_images', 'count', 'batch_size'];
const IMAGE_KEYS = ['image', 'image_url', 'image_urls', 'init_image', 'source_image'];

function schemaHasField(model: CustomModel, keys: string[]): boolean {
  if (!model.input_schema) return false;
  return model.input_schema.some((f) => {
    const k = f.key.toLowerCase();
    const p = f.path.toLowerCase();
    return keys.some((target) => k === target.toLowerCase() || p.endsWith(target.toLowerCase()));
  });
}

function getDefaultValue(model: CustomModel, keys: string[]): unknown | null {
  if (!model.input_schema) return null;
  for (const f of model.input_schema) {
    const k = f.key.toLowerCase();
    const p = f.path.toLowerCase();
    if (keys.some((target) => k === target.toLowerCase() || p.endsWith(target.toLowerCase()))) {
      return f.value;
    }
  }

  const input = model.default_input?.input as Record<string, unknown> | undefined;
  if (input) {
    for (const key of keys) {
      if (input[key] !== undefined) return input[key];
    }
  }
  return null;
}

export function detectCapabilities(model: CustomModel): ModelCapabilities {
  const defAR = getDefaultValue(model, ASPECT_RATIO_KEYS);
  const defQuality = getDefaultValue(model, QUALITY_KEYS);
  const defResolution = getDefaultValue(model, RESOLUTION_KEYS);
  const defDuration = getDefaultValue(model, DURATION_KEYS);
  const defStrength = getDefaultValue(model, STRENGTH_KEYS);

  return {
    hasPrompt: model.has_prompt,
    hasAspectRatio: schemaHasField(model, ASPECT_RATIO_KEYS),
    hasQuality: schemaHasField(model, QUALITY_KEYS),
    hasResolution: schemaHasField(model, RESOLUTION_KEYS),
    hasImageInput: model.has_image_input || schemaHasField(model, IMAGE_KEYS),
    hasDuration: schemaHasField(model, DURATION_KEYS),
    hasStrength: schemaHasField(model, STRENGTH_KEYS),
    hasCount: schemaHasField(model, COUNT_KEYS),
    defaultAspectRatio: typeof defAR === 'string' ? defAR : null,
    defaultQuality: typeof defQuality === 'string' ? defQuality : null,
    defaultResolution: typeof defResolution === 'string' ? defResolution : null,
    defaultDuration: defDuration != null ? String(defDuration) : null,
    defaultStrength: typeof defStrength === 'number' ? defStrength : null,
  };
}
