import { useState } from 'react';
import { Terminal, Zap, AlertTriangle, Check, Image, Video, Music, Mic, ChevronRight } from 'lucide-react';
import { parseCurl, generateModelName, type ParsedCurl } from '../../../../lib/marketing/curlParser';
import { MODEL_TYPE_MAP, detectMainType, detectSubType, type ModelMainType } from '../../../../lib/marketing/modelTypes';

interface Props {
  onParsed: (parsed: ParsedCurl, curl: string, subType: string) => void;
}

const MAIN_TYPE_META: Record<ModelMainType, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  image: { icon: Image, color: 'text-[#FF6B00]', bg: 'bg-[#FF6B00]/10', border: 'border-[#FF6B00]/30', label: 'Image' },
  video: { icon: Video, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', label: 'Video' },
  music: { icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', label: 'Music' },
  voice: { icon: Mic, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', label: 'Voice' },
};

const SAMPLE_CURL = `curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-d '{
  "model": "kling-3.0/video",
  "callBackUrl": "https://your-domain.com/api/callback",
  "input": {
    "mode": "pro",
    "image_urls": ["https://example.com/image.png"],
    "sound": true,
    "duration": "5",
    "aspect_ratio": "16:9",
    "prompt": "A cinematic scene with dramatic lighting"
  }
}'`;

type Step = 'paste' | 'type-select';

export default function CurlInputPanel({ onParsed }: Props) {
  const [curl, setCurl] = useState('');
  const [parsed, setParsed] = useState<ParsedCurl | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('paste');

  const [selectedMainType, setSelectedMainType] = useState<ModelMainType>('image');
  const [selectedSubType, setSelectedSubType] = useState('text-to-image');

  const handleParse = () => {
    setError('');
    const result = parseCurl(curl);
    if (!result) {
      setError('Could not parse cURL command. Make sure it includes a valid URL.');
      setParsed(null);
      return;
    }
    if (!result.modelId && !result.body) {
      setError('No model ID or request body found. Paste the full cURL with -d data.');
      setParsed(null);
      return;
    }
    const autoMain = detectMainType(result.modelId, result.endpoint);
    const autoSub = detectSubType(result.modelId, result.endpoint, result.hasImageInput);
    setSelectedMainType(autoMain);
    setSelectedSubType(autoSub);
    setParsed(result);
    setStep('type-select');
  };

  const handleConfirm = () => {
    if (parsed) onParsed(parsed, curl, selectedSubType);
  };

  const handleBack = () => {
    setStep('paste');
    setParsed(null);
    setError('');
  };

  const loadSample = () => {
    setCurl(SAMPLE_CURL);
    setParsed(null);
    setError('');
    setStep('paste');
  };

  const handleMainTypeChange = (t: ModelMainType) => {
    setSelectedMainType(t);
    setSelectedSubType(MODEL_TYPE_MAP[t][0].key);
  };

  if (step === 'type-select' && parsed) {
    const subtypes = MODEL_TYPE_MAP[selectedMainType];
    const meta = MAIN_TYPE_META[selectedMainType];
    const MetaIcon = meta.icon;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
            <ChevronRight className="w-3 h-3 rotate-180" /> Back
          </button>
          <span className="text-sm font-semibold text-white">What does this model do?</span>
        </div>

        <p className="text-xs text-gray-500">
          We detected this as a <span className={`font-semibold ${meta.color}`}>{meta.label}</span> model.
          Confirm or change the type so it appears in the right generator section.
        </p>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Model Type</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MAIN_TYPE_META) as ModelMainType[]).map((t) => {
              const m = MAIN_TYPE_META[t];
              const Icon = m.icon;
              const active = selectedMainType === t;
              return (
                <button
                  key={t}
                  onClick={() => handleMainTypeChange(t)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    active ? `${m.bg} ${m.border} border` : 'bg-dark-800 border-white/5 hover:border-white/15'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? m.color : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">What does it generate?</p>
          <div className="space-y-1.5">
            {subtypes.map((sub) => {
              const active = selectedSubType === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => setSelectedSubType(sub.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    active ? `${meta.bg} ${meta.border} border` : 'bg-dark-800/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? meta.color.replace('text-', 'bg-') : 'bg-gray-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-300'}`}>{sub.label}</p>
                    <p className="text-[11px] text-gray-500">{sub.description}</p>
                  </div>
                  {active && <Check className={`w-4 h-4 ml-auto ${meta.color}`} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-dark-900/60 border border-white/5 p-3 space-y-1.5">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Model ID</p>
              <p className="text-xs text-white font-mono mt-0.5">{parsed.modelId || '(none)'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Suggested Name</p>
              <p className="text-xs text-white mt-0.5">{generateModelName(parsed)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            {parsed.hasPrompt && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FF6B00]/10 text-[#FF6B00]">Prompt</span>}
            {parsed.hasImageInput && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400">Image Input</span>}
            {parsed.hasCallback && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">Callback</span>}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Check className="w-4 h-4" />
          Confirm & Test in Playground
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-sm font-semibold text-white">Paste API cURL</span>
        </div>
        <button
          onClick={loadSample}
          className="text-[11px] text-gray-500 hover:text-[#FF6B00] transition-colors"
        >
          Load sample
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(MAIN_TYPE_META) as ModelMainType[]).map((t) => {
          const m = MAIN_TYPE_META[t];
          const Icon = m.icon;
          return (
            <div key={t} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${m.bg} ${m.border}`}>
              <Icon className={`w-3 h-3 ${m.color}`} />
              <span className={`text-[10px] font-semibold ${m.color}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-500">Paste any KIE AI cURL — image, video, music, or voice models all supported.</p>

      <textarea
        value={curl}
        onChange={(e) => { setCurl(e.target.value); setParsed(null); setError(''); }}
        rows={9}
        placeholder={`curl -X POST "https://api.kie.ai/api/v1/jobs/createTask" \\\n-H "Authorization: Bearer YOUR_KEY" \\\n-d '{"model":"...","input":{...}}'`}
        className="w-full px-4 py-3 bg-dark-900 border border-white/10 rounded-xl text-green-400 text-xs font-mono focus:outline-none focus:border-[#FF6B00] resize-none leading-relaxed"
        spellCheck={false}
      />

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={!curl.trim()}
        className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
      >
        <Zap className="w-4 h-4" />
        Analyze cURL
      </button>
    </div>
  );
}
