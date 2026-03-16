export interface ParsedCurl {
  method: string;
  url: string;
  endpoint: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  modelId: string;
  category: 'image' | 'video' | 'music' | 'voice' | 'edit';
  hasPrompt: boolean;
  hasImageInput: boolean;
  hasCallback: boolean;
  inputFields: InputField[];
  defaultInput: Record<string, unknown>;
}

export interface InputField {
  key: string;
  path: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value: unknown;
  required: boolean;
  label: string;
}

function detectCategory(modelId: string, endpoint: string, body: Record<string, unknown> | null): ParsedCurl['category'] {
  const lower = `${modelId} ${endpoint}`.toLowerCase();
  if (lower.includes('video') || lower.includes('kling') || lower.includes('veo') || lower.includes('wan') || lower.includes('hunyuan'))
    return 'video';
  if (lower.includes('music') || lower.includes('audio') || lower.includes('suno'))
    return 'music';
  if (lower.includes('voice') || lower.includes('tts') || lower.includes('speech'))
    return 'voice';

  const input = body?.input as Record<string, unknown> | undefined;
  if (input?.image_url || input?.image_urls || input?.image) return 'edit';

  if (lower.includes('image') || lower.includes('flux') || lower.includes('seedream') || lower.includes('imagen') || lower.includes('midjourney'))
    return 'image';

  return 'image';
}

function detectPrompt(body: Record<string, unknown> | null): boolean {
  if (!body) return false;
  if (typeof body.prompt === 'string') return true;
  const input = body.input as Record<string, unknown> | undefined;
  if (input && typeof input.prompt === 'string') return true;
  return false;
}

function detectImageInput(body: Record<string, unknown> | null): boolean {
  if (!body) return false;
  const input = body.input as Record<string, unknown> | undefined;
  if (!input) return false;
  return !!(input.image_url || input.image_urls || input.image);
}

function detectCallback(body: Record<string, unknown> | null): boolean {
  if (!body) return false;
  return typeof body.callBackUrl === 'string';
}

function extractModelId(body: Record<string, unknown> | null): string {
  if (!body) return '';
  if (typeof body.model === 'string') return body.model;
  return '';
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectType(val: unknown): InputField['type'] {
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'object' && val !== null) return 'object';
  return 'string';
}

function flattenInput(obj: Record<string, unknown>, prefix: string, results: InputField[]) {
  const skipKeys = new Set(['model', 'callBackUrl']);

  for (const [key, val] of Object.entries(obj)) {
    if (skipKeys.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenInput(val as Record<string, unknown>, path, results);
    } else {
      results.push({
        key,
        path,
        type: detectType(val),
        value: val,
        required: key === 'prompt' || key === 'image_url',
        label: humanizeKey(key),
      });
    }
  }
}

function extractInputFields(body: Record<string, unknown> | null): InputField[] {
  if (!body) return [];
  const fields: InputField[] = [];
  const input = body.input as Record<string, unknown> | undefined;
  if (input) {
    flattenInput(input, 'input', fields);
  }
  for (const [key, val] of Object.entries(body)) {
    if (key === 'model' || key === 'input' || key === 'callBackUrl') continue;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenInput(val as Record<string, unknown>, key, fields);
    } else {
      fields.push({
        key,
        path: key,
        type: detectType(val),
        value: val,
        required: key === 'prompt',
        label: humanizeKey(key),
      });
    }
  }
  return fields;
}

function extractDefaultInput(body: Record<string, unknown> | null): Record<string, unknown> {
  if (!body) return {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'model') continue;
    result[k] = v;
  }
  return result;
}

export function parseCurl(raw: string): ParsedCurl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/\\\n/g, ' ')
    .replace(/\\\r\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let method = 'POST';
  const methodMatch = normalized.match(/-X\s+(GET|POST|PUT|PATCH|DELETE)/i);
  if (methodMatch) method = methodMatch[1].toUpperCase();

  const urlPatterns = [
    /curl\s+(?:-[^\s]+\s+)*["']?(https?:\/\/[^\s"']+)["']?/i,
    /["'](https?:\/\/[^\s"']+)["']/,
  ];
  let url = '';
  for (const p of urlPatterns) {
    const m = normalized.match(p);
    if (m) { url = m[1]; break; }
  }
  if (!url) return null;

  let endpoint = '';
  try {
    const u = new URL(url);
    endpoint = u.pathname;
  } catch { endpoint = url; }

  const headers: Record<string, string> = {};
  const headerRegex = /-H\s+["']([^"']+)["']/g;
  let hMatch;
  while ((hMatch = headerRegex.exec(normalized)) !== null) {
    const parts = hMatch[1].split(':');
    if (parts.length >= 2) {
      const hKey = parts[0].trim();
      const hVal = parts.slice(1).join(':').trim();
      headers[hKey] = hVal;
    }
  }

  let body: Record<string, unknown> | null = null;
  const bodyPatterns = [
    /-d\s+'([\s\S]*?)(?:(?<!\\)')/,
    /-d\s+"([\s\S]*?)(?:(?<!\\)")/,
    /--data-raw\s+'([\s\S]*?)(?:(?<!\\)')/,
    /--data-raw\s+"([\s\S]*?)(?:(?<!\\)")/,
    /--data\s+'([\s\S]*?)(?:(?<!\\)')/,
    /--data\s+"([\s\S]*?)(?:(?<!\\)")/,
  ];

  for (const bp of bodyPatterns) {
    const bm = normalized.match(bp);
    if (bm) {
      try {
        body = JSON.parse(bm[1]);
        break;
      } catch {
        // try next pattern
      }
    }
  }

  if (!body) {
    const jsonMatch = normalized.match(/-d\s+'(\{[\s\S]*\})'/);
    if (jsonMatch) {
      try { body = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    }
  }

  const modelId = extractModelId(body);

  return {
    method,
    url,
    endpoint,
    headers,
    body,
    modelId,
    category: detectCategory(modelId, endpoint, body),
    hasPrompt: detectPrompt(body),
    hasImageInput: detectImageInput(body),
    hasCallback: detectCallback(body),
    inputFields: extractInputFields(body),
    defaultInput: extractDefaultInput(body),
  };
}

export function generateModelName(parsed: ParsedCurl): string {
  if (parsed.modelId) {
    const parts = parsed.modelId.split('/');
    const last = parts[parts.length - 1];
    return last
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Custom Model';
}
