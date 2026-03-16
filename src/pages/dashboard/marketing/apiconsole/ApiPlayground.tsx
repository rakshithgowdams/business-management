import { useState, useRef } from 'react';
import { Play, Loader2, Upload, X, CheckCircle, Download, AlertTriangle, Copy, ChevronDown, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarketPoll } from '../../../../lib/marketing/kieApi';
import type { ParsedCurl, InputField } from '../../../../lib/marketing/curlParser';

interface Props {
  parsed: ParsedCurl;
  apiKey: string;
  onTestSuccess: (resultUrls: string[], rawResponse: Record<string, unknown>) => void;
}

const KIE_BASE = 'https://api.kie.ai';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function deepExtractTaskId(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;

  const taskIdKeys = ['taskId', 'task_id', 'id', 'jobId', 'job_id', 'requestId', 'request_id'];
  for (const k of taskIdKeys) {
    if (typeof obj[k] === 'string' && obj[k]) return obj[k] as string;
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const found = deepExtractTaskId(val);
      if (found) return found;
    }
  }
  return '';
}

function deepExtractUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  const urls: string[] = [];

  const urlKeys = ['url', 'result_url', 'resultUrl', 'output', 'video_url', 'image_url', 'src', 'href', 'download_url'];
  for (const k of urlKeys) {
    if (typeof obj[k] === 'string' && obj[k] && (obj[k] as string).startsWith('http')) {
      urls.push(obj[k] as string);
    }
  }

  const arrKeys = ['urls', 'result_urls', 'resultUrls', 'outputs', 'results'];
  for (const k of arrKeys) {
    if (Array.isArray(obj[k])) {
      for (const item of obj[k] as unknown[]) {
        if (typeof item === 'string' && item.startsWith('http')) urls.push(item);
      }
    }
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      urls.push(...deepExtractUrls(val));
    }
  }

  return [...new Set(urls)];
}

type PollMode = 'standard' | 'custom' | 'direct';

export default function ApiPlayground({ parsed, apiKey, onTestSuccess }: Props) {
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of parsed.inputFields) {
      init[f.path] = f.value;
    }
    return init;
  });
  const [imageFiles, setImageFiles] = useState<Record<string, { file: File; preview: string }>>({});
  const [running, setRunning] = useState(false);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState('');
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [showRequestBody, setShowRequestBody] = useState(false);

  const [pollMode, setPollMode] = useState<PollMode>('standard');
  const [customPollEndpoint, setCustomPollEndpoint] = useState('/api/v1/jobs/recordInfo');
  const [foundTaskId, setFoundTaskId] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const abortRef = useRef(false);

  const imageFields = parsed.inputFields.filter(
    (f) => f.key === 'image_url' || f.key === 'image_urls' || f.key === 'image' || f.path.includes('image')
  );
  const nonImageFields = parsed.inputFields.filter((f) => !imageFields.includes(f));

  const updateField = (path: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [path]: value }));
  };

  const handleImageUpload = (fieldPath: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImageFiles((prev) => ({ ...prev, [fieldPath]: { file, preview } }));
  };

  const removeImage = (fieldPath: string) => {
    setImageFiles((prev) => {
      const next = { ...prev };
      if (next[fieldPath]) { URL.revokeObjectURL(next[fieldPath].preview); delete next[fieldPath]; }
      return next;
    });
  };

  const buildRequestBody = async (): Promise<Record<string, unknown>> => {
    const body = { ...parsed.defaultInput };
    if (parsed.modelId) body.model = parsed.modelId;
    const input = (body.input as Record<string, unknown>) || {};

    for (const [path, val] of Object.entries(fieldValues)) {
      const parts = path.split('.');
      if (parts[0] === 'input' && parts.length > 1) {
        input[parts.slice(1).join('.')] = val;
      } else {
        body[path] = val;
      }
    }

    for (const [fieldPath, { file }] of Object.entries(imageFiles)) {
      const dataUrl = await fileToDataUrl(file);
      const parts = fieldPath.split('.');
      const key = parts[parts.length - 1];
      if (key === 'image_urls') {
        input.image_urls = [dataUrl];
      } else if (parts[0] === 'input' && parts.length > 1) {
        input[parts.slice(1).join('.')] = dataUrl;
      } else {
        body[fieldPath] = dataUrl;
      }
    }

    body.input = input;
    return body;
  };

  const pollUntilDone = async (taskId: string, pollEndpoint: string): Promise<string[]> => {
    setPolling(true);
    abortRef.current = false;
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      if (abortRef.current) { setPolling(false); return []; }
      const waitTime = attempts < 5 ? 3000 : attempts < 20 ? 4000 : 6000;
      await new Promise((r) => setTimeout(r, waitTime));

      try {
        const res = await fetch(`${KIE_BASE}${pollEndpoint}?taskId=${taskId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await res.json();
        const result = parseMarketPoll(data);
        if (result.done) {
          setPolling(false);
          if (result.failed || result.urls.length === 0) throw new Error('Generation failed');
          return result.urls;
        }
        setProgress(`Polling... attempt ${attempts + 1}`);
      } catch (e) {
        if (e instanceof Error && e.message === 'Generation failed') throw e;
      }
      attempts++;
    }
    setPolling(false);
    throw new Error('Polling timed out');
  };

  const handleRun = async () => {
    if (!apiKey) { toast.error('Enter your API key first'); return; }

    setRunning(true);
    setError('');
    setResultUrls([]);
    setRawResponse('');
    setRawData(null);
    setFoundTaskId('');
    setExtractedUrls([]);
    setProgress('Building request...');

    try {
      const body = await buildRequestBody();
      setProgress('Sending request...');

      const url = `${KIE_BASE}${parsed.endpoint}`;
      const res = await fetch(url, {
        method: parsed.method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setRawResponse(JSON.stringify(data, null, 2));
      setRawData(data);
      setShowRawResponse(true);

      if (!res.ok) {
        const errMsg = data?.msg || data?.message || data?.error?.message || `HTTP ${res.status}`;
        setError(String(errMsg));
        setRunning(false);
        setProgress('');
        return;
      }

      const taskId = deepExtractTaskId(data);
      setFoundTaskId(taskId);

      const directUrls = deepExtractUrls(data);
      setExtractedUrls(directUrls);

      if (taskId && pollMode !== 'direct') {
        setProgress(`Task ID found: ${taskId.slice(0, 24)}...`);
        setRunning(false);
        const endpoint = pollMode === 'custom' ? customPollEndpoint : '/api/v1/jobs/recordInfo';
        try {
          const urls = await pollUntilDone(taskId, endpoint);
          setResultUrls(urls);
          setProgress('');
          onTestSuccess(urls, data);
          toast.success(`Test passed -- ${urls.length} result(s)`);
        } catch (pollErr) {
          setError(pollErr instanceof Error ? pollErr.message : 'Polling failed');
        }
        setPolling(false);
        return;
      }

      if (directUrls.length > 0) {
        setResultUrls(directUrls);
        setProgress('');
        onTestSuccess(directUrls, data);
        toast.success('Test passed -- direct URL result');
        setRunning(false);
        return;
      }

      setError('No task ID or direct URL found automatically. Check the raw response below and use manual options.');
      setRunning(false);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setRunning(false);
      setProgress('');
    }
  };

  const handleManualPoll = async () => {
    const id = manualTaskId.trim() || foundTaskId;
    if (!id) { toast.error('Enter a task ID'); return; }
    setError('');
    try {
      const endpoint = pollMode === 'custom' ? customPollEndpoint : '/api/v1/jobs/recordInfo';
      const urls = await pollUntilDone(id, endpoint);
      setResultUrls(urls);
      if (rawData) onTestSuccess(urls, rawData);
      toast.success(`Polling passed -- ${urls.length} result(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polling failed');
    }
  };

  const handleForcePass = (urls: string[]) => {
    if (urls.length === 0) { toast.error('No URLs to pass'); return; }
    setResultUrls(urls);
    if (rawData) onTestSuccess(urls, rawData);
    toast.success('Marked as passed');
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kie-test-${Date.now()}.${blob.type.includes('video') ? 'mp4' : 'png'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error('Download failed'); }
  };

  const renderFieldInput = (field: InputField) => {
    const val = fieldValues[field.path];

    if (field.type === 'boolean') {
      return (
        <button
          onClick={() => updateField(field.path, !val)}
          className={`w-10 h-5 rounded-full transition-all relative ${val ? 'bg-[#FF6B00]' : 'bg-dark-700 border border-white/10'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-5' : 'left-0.5'}`} />
        </button>
      );
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={String(val ?? '')}
          onChange={(e) => updateField(field.path, parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
        />
      );
    }
    if (field.type === 'array') {
      return (
        <textarea
          value={typeof val === 'string' ? val : JSON.stringify(val)}
          onChange={(e) => { try { updateField(field.path, JSON.parse(e.target.value)); } catch { updateField(field.path, e.target.value); } }}
          rows={2}
          className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#FF6B00] resize-none"
        />
      );
    }
    const isMultiline = typeof val === 'string' && val.length > 60;
    if (isMultiline || field.key === 'prompt') {
      return (
        <textarea
          value={String(val ?? '')}
          onChange={(e) => updateField(field.path, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#FF6B00] resize-none"
        />
      );
    }
    return (
      <input
        type="text"
        value={String(val ?? '')}
        onChange={(e) => updateField(field.path, e.target.value)}
        className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
      />
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-dark-800/40 overflow-hidden">
        <div className="px-4 py-3 bg-dark-900/50 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-sm font-semibold text-white">API Playground</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono">{parsed.method}</span>
            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{parsed.endpoint}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {imageFields.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Image Inputs</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imageFields.map((field) => (
                  <div key={field.path}>
                    <p className="text-[11px] text-gray-400 mb-1.5 font-mono">{field.key}</p>
                    {imageFiles[field.path] ? (
                      <div className="relative group">
                        <img src={imageFiles[field.path].preview} alt={field.key} className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                        <button onClick={() => removeImage(field.path)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileRefs.current[field.path]?.click()} className="w-full aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF6B00]/30 transition-colors flex flex-col items-center justify-center gap-1.5">
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="text-[10px] text-gray-600">Upload Image</span>
                        <span className="text-[9px] text-gray-700">or use URL below</span>
                      </button>
                    )}
                    <input ref={(el) => { fileRefs.current[field.path] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(field.path, e)} />
                    {!imageFiles[field.path] && (
                      <input
                        type="text"
                        value={String(fieldValues[field.path] ?? '')}
                        onChange={(e) => updateField(field.path, e.target.value)}
                        placeholder="Or paste image URL..."
                        className="w-full mt-1.5 px-2.5 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-white text-[10px] font-mono focus:outline-none focus:border-[#FF6B00]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonImageFields.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Parameters</p>
              <div className="space-y-2.5">
                {nonImageFields.map((field) => (
                  <div key={field.path} className="flex items-start gap-3">
                    <div className="w-36 flex-shrink-0 pt-2">
                      <p className="text-[11px] text-gray-400 font-mono truncate" title={field.path}>{field.key}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${field.type === 'boolean' ? 'bg-blue-500/10 text-blue-400' : field.type === 'number' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                          {field.type}
                        </span>
                        {field.required && <span className="text-[8px] text-red-400 font-bold">REQ</span>}
                      </div>
                    </div>
                    <div className="flex-1">{renderFieldInput(field)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Polling Mode</p>
            <div className="flex gap-2">
              {[
                { v: 'standard', l: 'Standard (Auto)', hint: '/api/v1/jobs/recordInfo' },
                { v: 'custom', l: 'Custom Endpoint', hint: 'Enter endpoint below' },
                { v: 'direct', l: 'Direct URL', hint: 'URL in response body' },
              ].map((m) => (
                <button
                  key={m.v}
                  onClick={() => setPollMode(m.v as PollMode)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pollMode === m.v ? 'gradient-orange text-white' : 'bg-dark-900 border border-white/10 text-gray-400 hover:text-white'}`}
                >
                  {m.l}
                </button>
              ))}
            </div>
            {pollMode === 'custom' && (
              <input
                type="text"
                value={customPollEndpoint}
                onChange={(e) => setCustomPollEndpoint(e.target.value)}
                placeholder="/api/v1/your/poll/endpoint"
                className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#FF6B00]"
              />
            )}
            {pollMode === 'direct' && (
              <p className="text-[11px] text-amber-400">Direct mode: the API must return a URL immediately in the response without polling.</p>
            )}
          </div>

          <button
            onClick={() => setShowRequestBody(!showRequestBody)}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showRequestBody ? 'rotate-180' : ''}`} />
            {showRequestBody ? 'Hide' : 'Preview'} Request Body
          </button>

          {showRequestBody && (
            <pre className="p-3 rounded-lg bg-dark-900 border border-white/5 text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
              {JSON.stringify({
                ...(parsed.modelId ? { model: parsed.modelId } : {}),
                input: Object.fromEntries(
                  Object.entries(fieldValues)
                    .filter(([k]) => k.startsWith('input.'))
                    .map(([k, v]) => [k.replace('input.', ''), imageFiles[k] ? `[FILE: ${imageFiles[k].file.name}]` : v])
                ),
              }, null, 2)}
            </pre>
          )}

          <button
            onClick={handleRun}
            disabled={running || polling || !apiKey}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{progress || 'Running test...'}</>
            ) : polling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress || 'Polling for result...'}
                <button
                  onClick={(e) => { e.stopPropagation(); abortRef.current = true; }}
                  className="ml-2 px-2 py-0.5 rounded bg-white/10 text-xs hover:bg-white/20 transition-colors"
                >
                  Stop
                </button>
              </>
            ) : (
              <><Play className="w-4 h-4" />Run API Test</>
            )}
          </button>
        </div>
      </div>

      {error && rawData && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Could Not Auto-Detect Result</span>
          </div>
          <p className="text-xs text-amber-300">{error}</p>

          {foundTaskId && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400">Task ID found: <code className="text-emerald-400 font-mono text-[10px]">{foundTaskId}</code></p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={manualTaskId || foundTaskId}
                    onChange={(e) => setManualTaskId(e.target.value)}
                    placeholder="Task ID..."
                    className="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  onClick={handleManualPoll}
                  disabled={polling}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {polling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Poll Now
                </button>
              </div>
            </div>
          )}

          {!foundTaskId && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400">Manually enter task ID if you can see it in the raw response:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualTaskId}
                  onChange={(e) => setManualTaskId(e.target.value)}
                  placeholder="Paste task ID here..."
                  className="flex-1 px-3 py-2 bg-dark-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleManualPoll}
                  disabled={!manualTaskId.trim() || polling}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                >
                  {polling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Poll
                </button>
              </div>
            </div>
          )}

          {extractedUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-emerald-400">URLs found in response — click to use as result:</p>
              <div className="space-y-1">
                {extractedUrls.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-[10px] text-gray-400 font-mono truncate">{u}</span>
                    <button
                      onClick={() => handleForcePass([u])}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 transition-colors flex-shrink-0"
                    >
                      Use This
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleForcePass(extractedUrls)}
                  className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-colors mt-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Use All URLs as Test Result
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && !rawData && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Test Failed</span>
          </div>
          <p className="text-xs text-red-300 font-mono break-all">{error}</p>
        </div>
      )}

      {resultUrls.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Test Passed -- {resultUrls.length} Result(s)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {resultUrls.map((url, i) => {
              const isVideo = url.includes('.mp4') || url.includes('video') || parsed.category === 'video';
              return (
                <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10">
                  {isVideo ? (
                    <video src={url} controls className="w-full aspect-video object-cover" />
                  ) : (
                    <img src={url} alt={`Result ${i + 1}`} className="w-full aspect-square object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDownload(url)} className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/20">
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rawResponse && (
        <div>
          <button
            onClick={() => setShowRawResponse(!showRawResponse)}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors mb-2"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showRawResponse ? 'rotate-180' : ''}`} />
            Raw API Response {foundTaskId && <span className="ml-1 text-emerald-400">(task ID found)</span>}
          </button>
          {showRawResponse && (
            <div className="relative">
              <pre className="p-3 rounded-lg bg-dark-900 border border-white/5 text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                {rawResponse}
              </pre>
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={() => { navigator.clipboard.writeText(rawResponse); toast.success('Copied'); }}
                  className="p-1.5 rounded-lg bg-dark-800 border border-white/5 text-gray-500 hover:text-white transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    const freshId = deepExtractTaskId(rawData || {});
                    if (freshId) { setFoundTaskId(freshId); setManualTaskId(freshId); toast.success('Task ID extracted'); }
                    else toast.error('No task ID found in response');
                  }}
                  className="p-1.5 rounded-lg bg-dark-800 border border-white/5 text-gray-500 hover:text-emerald-400 transition-colors"
                  title="Try extract task ID"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
