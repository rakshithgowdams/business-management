import { getApiKey } from '../apiKeys';

const KIE_BASE = 'https://api.kie.ai';

export async function getKieKey(): Promise<string> {
  return getApiKey('kie_ai');
}

export async function kiePost(endpoint: string, body: Record<string, unknown>, apiKey: string) {
  const res = await fetch(`${KIE_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  let responseData: unknown;
  try {
    responseData = await res.json();
  } catch {
    throw new Error(`API error ${res.status}: non-JSON response`);
  }
  if (!res.ok) {
    const err = responseData as Record<string, unknown>;
    const errMsg = err?.msg || err?.message || err?.error || err?.detail || `API error ${res.status}`;
    throw new Error(String(errMsg));
  }
  const d = responseData as Record<string, unknown>;
  if (d?.code !== undefined && Number(d.code) !== 0 && Number(d.code) !== 200) {
    const errMsg = d?.msg || d?.message || d?.error || `API error code ${d.code}`;
    throw new Error(String(errMsg));
  }
  return responseData;
}

export async function kieGet(endpoint: string, apiKey: string) {
  const res = await fetch(`${KIE_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err?.msg || err?.message || err?.error || errMsg;
    } catch { /* ignore parse error */ }
    throw new Error(String(errMsg));
  }
  return res.json();
}

export function extractTaskId(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;

  const ID_KEYS = ['taskId', 'task_id', 'id', 'jobId', 'job_id', 'requestId', 'request_id'];

  const tryExtract = (o: Record<string, unknown>): string => {
    for (const k of ID_KEYS) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string;
      if (typeof o[k] === 'number' && o[k]) return String(o[k]);
    }
    return '';
  };

  let found = tryExtract(obj);
  if (found) return found;

  const nested = ['data', 'result', 'response', 'payload'];
  for (const key of nested) {
    const child = obj[key];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      found = tryExtract(child as Record<string, unknown>);
      if (found) return found;

      const grandchild = (child as Record<string, unknown>)['data'];
      if (grandchild && typeof grandchild === 'object' && !Array.isArray(grandchild)) {
        found = tryExtract(grandchild as Record<string, unknown>);
        if (found) return found;
      }
    }
  }

  return '';
}

export function parseMarketTaskId(data: Record<string, unknown>): string {
  return extractTaskId(data);
}

function extractUrlsDeep(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const o = obj as Record<string, unknown>;
  const urls: string[] = [];

  const directKeys = ['url', 'resultUrl', 'result_url', 'output', 'video_url', 'image_url', 'src', 'download_url', 'file_url'];
  for (const k of directKeys) {
    if (typeof o[k] === 'string' && (o[k] as string).startsWith('http')) urls.push(o[k] as string);
  }

  const arrayKeys = ['urls', 'resultUrls', 'result_urls', 'outputs', 'results', 'files', 'videos', 'images'];
  for (const k of arrayKeys) {
    if (Array.isArray(o[k])) {
      for (const item of o[k] as unknown[]) {
        if (typeof item === 'string' && item.startsWith('http')) urls.push(item);
        else if (item && typeof item === 'object') {
          const inner = item as Record<string, unknown>;
          for (const ik of directKeys) {
            if (typeof inner[ik] === 'string' && (inner[ik] as string).startsWith('http')) urls.push(inner[ik] as string);
          }
        }
      }
    }
  }

  for (const val of Object.values(o)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      urls.push(...extractUrlsDeep(val));
    }
  }

  return [...new Set(urls)];
}

export function parseMarketPoll(data: Record<string, unknown>): { done: boolean; urls: string[]; failed: boolean } {
  const d = data?.data as Record<string, unknown> | undefined;
  const root = data;

  const getStr = (...paths: (string | undefined)[]): string =>
    paths.find((p): p is string => typeof p === 'string' && p.length > 0) || '';

  const state = getStr(
    d?.state as string, d?.status as string, d?.taskStatus as string, d?.task_status as string,
    root?.state as string, root?.status as string, root?.taskStatus as string, root?.task_status as string
  );
  const stateLower = state.toLowerCase();

  const SUCCESS_STATES = ['success', 'completed', 'complete', 'done', 'finish', 'finished', 'succeed'];
  const FAIL_STATES = ['fail', 'failed', 'failure', 'error', 'cancelled', 'canceled', 'timeout'];

  if (SUCCESS_STATES.some((s) => stateLower === s || stateLower.includes(s))) {
    const resultJson = getStr(
      d?.resultJson as string, d?.result_json as string,
      root?.resultJson as string, root?.result_json as string
    );
    if (resultJson) {
      try {
        const parsed = JSON.parse(resultJson);
        const urls = parsed.resultUrls || parsed.result_urls || parsed.urls || parsed.outputs || [];
        if (urls.length > 0) return { done: true, urls, failed: false };
      } catch { /* fall through */ }
    }

    const urls = extractUrlsDeep(d || root);
    if (urls.length > 0) return { done: true, urls, failed: false };

    return { done: true, urls: [], failed: true };
  }

  if (FAIL_STATES.some((s) => stateLower === s || stateLower.includes(s))) {
    return { done: true, urls: [], failed: true };
  }

  const directUrls = extractUrlsDeep(d || root);
  if (directUrls.length > 0) return { done: true, urls: directUrls, failed: false };

  return { done: false, urls: [], failed: false };
}

export function parseFluxTaskId(data: Record<string, unknown>): string {
  const d = data.data as Record<string, unknown> | undefined;
  return (d?.taskId as string) || '';
}

export function parseFluxPoll(data: Record<string, unknown>): { done: boolean; urls: string[]; failed: boolean } {
  const d = data.data as Record<string, unknown> | undefined;
  const status = (d?.status as string) || '';
  if (status === 'completed' || status === 'success') {
    const url = d?.result as string;
    const urls = url ? [url] : [];
    return { done: true, urls, failed: urls.length === 0 };
  }
  if (status === 'failed') return { done: true, urls: [], failed: true };
  return { done: false, urls: [], failed: false };
}

export function parse4oTaskId(data: Record<string, unknown>): string {
  const d = data.data as Record<string, unknown> | undefined;
  return (d?.taskId as string) || '';
}

export function parse4oPoll(data: Record<string, unknown>): { done: boolean; urls: string[]; failed: boolean } {
  const d = data.data as Record<string, unknown> | undefined;
  const flag = d?.successFlag as string | number | undefined;
  if (String(flag) === '1') {
    const resp = d?.response as Record<string, unknown> | undefined;
    const urls = (resp?.result_urls as string[]) || [];
    return { done: true, urls, failed: false };
  }
  if (String(flag) === '2') return { done: true, urls: [], failed: true };
  return { done: false, urls: [], failed: false };
}

export type PollParser = (data: Record<string, unknown>) => { done: boolean; urls: string[]; failed: boolean };

export async function pollKieTask(
  pollEndpoint: string,
  taskId: string,
  apiKey: string,
  parser: PollParser,
  onProgress?: (msg: string) => void,
  maxAttempts = 240
): Promise<string[]> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const waitTime = attempts < 3 ? 3000 : attempts < 10 ? 5000 : attempts < 30 ? 8000 : 10000;
    await new Promise((r) => setTimeout(r, waitTime));
    try {
      const data = await kieGet(`${pollEndpoint}?taskId=${taskId}`, apiKey);
      const result = parser(data);
      if (result.done) {
        if (result.failed || result.urls.length === 0) throw new Error('Generation failed');
        return result.urls;
      }
      onProgress?.(`Generating... (${attempts + 1} polls)`);
    } catch (e) {
      if (e instanceof Error && e.message === 'Generation failed') throw e;
    }
    attempts++;
  }
  throw new Error('Generation timed out after extended wait');
}

export async function generateImage(
  prompt: string,
  model: string,
  aspectRatio: string,
  count: number,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<string[]> {
  let endpoint: string;
  let pollEndpoint: string;
  let body: Record<string, unknown>;
  let taskIdParser: (d: Record<string, unknown>) => string;
  let pollParser: PollParser;

  if (model === 'flux-kontext-pro') {
    endpoint = '/api/v1/flux/kontext/generate';
    pollEndpoint = '/api/v1/flux/kontext/record-info';
    body = { prompt, aspectRatio, model: 'flux-kontext-pro', outputFormat: 'jpeg' };
    taskIdParser = parseFluxTaskId;
    pollParser = parseFluxPoll;
  } else if (model === 'gpt4o-image') {
    endpoint = '/api/v1/gpt4o-image/generate';
    pollEndpoint = '/api/v1/gpt4o-image/record-info';
    body = { prompt, size: aspectRatio, nVariants: count };
    taskIdParser = parse4oTaskId;
    pollParser = parse4oPoll;
  } else {
    endpoint = '/api/v1/jobs/createTask';
    pollEndpoint = '/api/v1/jobs/recordInfo';
    body = { model: 'flux-2/pro-text-to-image', input: { prompt, aspect_ratio: aspectRatio, resolution: '1K' } };
    taskIdParser = parseMarketTaskId;
    pollParser = parseMarketPoll;
  }

  onProgress?.('Submitting task...');
  const data = await kiePost(endpoint, body, apiKey);
  const taskId = taskIdParser(data);
  if (!taskId) throw new Error('No task ID returned');

  onProgress?.('Generating image...');
  return pollKieTask(pollEndpoint, taskId, apiKey, pollParser, onProgress);
}

const VIDEO_MODEL_MAP: Record<string, string> = {
  'kling-v3': 'kling-3.0/video',
  'kling-3.0': 'kling-3.0/video',
  'kling/v3-image-to-video': 'kling-3.0/video',
  'kling/3.0-image-to-video': 'kling-3.0/video',
  'kling-3.0/video': 'kling-3.0/video',
  'kling/v3-camera-control': 'kling-3.0/video',
  'kling-v2.1': 'kling/v2.1-image-to-video',
  'kling-v1.6': 'kling/v1.6-image-to-video',
  'veo-3.1': 'veo/3.1-image-to-video',
};

export interface KlingVideoOptions {
  mode?: 'std' | 'pro';
  negativePrompt?: string;
  cfgScale?: number;
  audioEnabled?: boolean;
  multiShots?: boolean;
}

export async function generateVideo(
  imageUrl: string,
  prompt: string,
  model: string,
  duration: number,
  aspectRatio: string,
  apiKey: string,
  onProgress?: (msg: string) => void,
  options?: KlingVideoOptions
): Promise<string> {
  onProgress?.('Submitting video task...');
  const resolvedModel = VIDEO_MODEL_MAP[model] || model;
  const isKling3 = resolvedModel === 'kling-3.0/video';

  const input: Record<string, unknown> = {
    prompt,
    duration: String(duration),
    aspect_ratio: aspectRatio,
    mode: options?.mode || 'std',
  };

  if (imageUrl) {
    if (isKling3) {
      input.image_urls = [imageUrl];
    } else {
      input.image_url = imageUrl;
    }
  }

  if (options?.negativePrompt) input.negative_prompt = options.negativePrompt;
  if (options?.cfgScale !== undefined) input.cfg_scale = options.cfgScale;
  if (isKling3) {
    const soundOn = options?.audioEnabled ?? false;
    const multiShots = options?.multiShots ?? false;
    input.sound = soundOn || multiShots;
    input.multi_shots = multiShots;
  }

  const body: Record<string, unknown> = { model: resolvedModel, input };

  const data = await kiePost('/api/v1/jobs/createTask', body, apiKey);
  const taskId = parseMarketTaskId(data);
  if (!taskId) {
    const msg = (data as Record<string, unknown>)?.msg
      || (data as Record<string, unknown>)?.message
      || 'No task ID returned';
    throw new Error(String(msg));
  }

  onProgress?.('Generating video...');
  const urls = await pollKieTask('/api/v1/jobs/recordInfo', taskId, apiKey, parseMarketPoll, onProgress, 180);
  return urls[0];
}
