import { useState } from 'react';
import { Loader2, Film, X, Lock, Info, Code, ChevronDown, ChevronUp, Volume2, VolumeX, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl } from '../../../../lib/mediaDB';
import { getKieKey, kiePost, extractTaskId, parseMarketPoll, pollKieTask } from '../../../../lib/marketing/kieApi';
import { CAMERA_MOVEMENTS } from '../../../../lib/marketing/constants';
import type { CinematicSession } from '../../../../lib/marketing/types';

const KLING3_IMAGE_TO_VIDEO_MODEL = 'kling-3.0/video';
const KLING3_LABEL = 'Kling 3.0';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
}

const ROWS: Record<string, string> = {
  push_pull: 'Push / Pull',
  rotation: 'Rotation / Spin',
  zoom: 'Zoom / Focus',
  special: 'FPV / Special',
  cinematic: 'Cinematic',
};

const DEFAULT_JSON_INPUT = JSON.stringify(
  {
    model: KLING3_IMAGE_TO_VIDEO_MODEL,
    input: {
      image_urls: ['{{heroFrameUrl}}'],
      prompt: '{{motionPrompt}}',
      duration: '5',
      aspect_ratio: '16:9',
      mode: 'pro',
      sound: false,
      multi_shots: false,
    },
  },
  null,
  2
);

export default function CameraMotion({ session, update, onNext }: Props) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [klingMode, setKlingMode] = useState<'std' | 'pro'>('pro');
  const [sound, setSound] = useState(false);
  const [multiShots, setMultiShots] = useState(false);
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonOverride, setJsonOverride] = useState(DEFAULT_JSON_INPUT);
  const [jsonError, setJsonError] = useState('');

  const toggleMove = (key: string) => {
    const current = session.cameraMovements;
    if (current.includes(key)) {
      update({ cameraMovements: current.filter((m) => m !== key) });
    } else if (current.length < 3) {
      update({ cameraMovements: [...current, key] });
    } else {
      toast.error('Maximum 3 camera movements');
    }
  };

  const slotIndex = (key: string) => session.cameraMovements.indexOf(key);

  const buildMotionPrompt = () => {
    const sceneBase = session.enhancedPrompt || session.prompt;
    const moves = session.cameraMovements
      .map((k) => CAMERA_MOVEMENTS.find((m) => m.key === k)?.label)
      .filter(Boolean);

    const speedMap: Record<string, string> = {
      slow: 'slow, graceful, deliberate pacing',
      normal: 'steady, controlled pacing',
      dynamic: 'fast, energetic, high-impact pacing',
    };
    const speedDesc = speedMap[session.motionSpeed] || 'steady pacing';

    const intensityDesc =
      session.motionIntensity <= 30
        ? 'very subtle, barely perceptible movement'
        : session.motionIntensity <= 60
        ? 'moderate cinematic movement'
        : session.motionIntensity <= 85
        ? 'strong, expressive camera movement'
        : 'extreme, dramatic, high-intensity movement';

    const cameraParts: string[] = [];
    if (moves[0]) cameraParts.push(`PRIMARY movement: ${moves[0]}`);
    if (moves[1]) cameraParts.push(`SECONDARY movement: ${moves[1]}`);
    if (moves[2]) cameraParts.push(`TERTIARY movement: ${moves[2]}`);

    const cameraDirective = cameraParts.length > 0
      ? `Camera choreography — ${cameraParts.join(', ')}. ${speedDesc}, ${intensityDesc}.`
      : '';

    const qualityTags = [
      'cinematic color grading',
      'photorealistic rendering',
      'professional production quality',
      '4K ultra-detailed',
      'smooth motion blur',
      'natural bokeh depth of field',
    ].join(', ');

    const parts: string[] = [];
    if (sceneBase) parts.push(sceneBase);
    if (cameraDirective) parts.push(cameraDirective);
    if (session.motionDescription) parts.push(session.motionDescription);
    if (session.additionalMotion) parts.push(`Subject action: ${session.additionalMotion}`);
    parts.push(qualityTags);

    return parts.join('. ');
  };

  const handleGenerate = async () => {
    const apiKey = await getKieKey();
    if (!apiKey) {
      toast.error('Add your Kie.ai API key in Settings > Integrations');
      return;
    }

    const heroUrl = session.heroFrames[session.selectedHeroFrame];
    if (!heroUrl) {
      toast.error('No hero frame selected. Go back and select a frame.');
      return;
    }

    if (session.cameraMovements.length === 0) {
      toast.error('Select at least one camera movement');
      return;
    }

    setGenerating(true);
    setProgress('Building cinematic motion prompt...');

    try {
      const motionPrompt = buildMotionPrompt();
      const duration = String(session.videoDuration || '5');
      const aspectRatio = session.cameraRig.aspectRatio || '16:9';

      setProgress('Submitting to Kling 3.0...');

      let body: Record<string, unknown>;

      if (showJsonPanel && jsonOverride.trim()) {
        try {
          const raw = jsonOverride
            .replace(/\{\{heroFrameUrl\}\}/g, heroUrl)
            .replace(/\{\{motionPrompt\}\}/g, motionPrompt);
          body = JSON.parse(raw);
        } catch {
          throw new Error('Invalid JSON in the override panel. Please fix the JSON and try again.');
        }
      } else {
        body = {
          model: KLING3_IMAGE_TO_VIDEO_MODEL,
          input: {
            image_urls: [heroUrl],
            prompt: motionPrompt,
            duration,
            aspect_ratio: aspectRatio,
            mode: klingMode,
            sound: multiShots ? true : sound,
            multi_shots: multiShots,
          },
        };
      }

      const taskData = await kiePost('/api/v1/jobs/createTask', body, apiKey);
      const taskId = extractTaskId(taskData);

      if (!taskId) {
        const msg =
          (taskData as Record<string, unknown>)?.msg ||
          (taskData as Record<string, unknown>)?.message ||
          JSON.stringify(taskData).slice(0, 300);
        throw new Error(`Kling 3.0 did not return a task ID: ${msg}`);
      }

      setProgress('Generating cinematic video...');
      const urls = await pollKieTask(
        '/api/v1/jobs/recordInfo',
        taskId,
        apiKey,
        parseMarketPoll,
        (msg) => setProgress(`Kling 3.0: ${msg}`),
        180,
      );

      const url = urls[0];
      if (!url) throw new Error('Kling 3.0 returned no video URL');

      update({ finalVideoUrl: url });

      if (user) {
        try {
          const assetId = crypto.randomUUID();
          const uploaded = await uploadFromUrl(user.id, assetId, url);
          await supabase.from('media_assets').insert({
            id: assetId,
            user_id: user.id,
            type: 'video',
            title: `Cinematic: ${session.prompt.slice(0, 60)}`,
            prompt: motionPrompt,
            provider: 'kie_ai',
            status: 'completed',
            result_url: uploaded?.publicUrl || url,
            storage_path: uploaded?.path || null,
            file_size: uploaded?.size || 0,
            metadata: {
              source: 'cinematic_studio',
              videoModel: KLING3_IMAGE_TO_VIDEO_MODEL,
              klingMode,
              cameraMovements: session.cameraMovements,
              duration,
              aspectRatio,
            },
          });
        } catch { /* non-critical */ }
      }

      toast.success('Cinematic video generated!');
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Video generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1">Stack Your Camera Movements</h3>
        <p className="text-xs text-gray-500 mb-4">Combine up to 3 simultaneous camera moves for cinematic results</p>

        <div className="flex gap-2 mb-6">
          {['Primary', 'Secondary', 'Tertiary'].map((slot, i) => (
            <div
              key={slot}
              className={`flex-1 py-3 px-4 rounded-xl border text-center text-xs font-medium transition-all ${
                session.cameraMovements[i]
                  ? 'border-[#C0392B] bg-[#C0392B]/10 text-white'
                  : 'border-white/5 bg-dark-800 text-gray-600'
              }`}
            >
              <p className="text-[10px] text-gray-500 mb-1">{slot} Move</p>
              {session.cameraMovements[i] ? (
                <div className="flex items-center justify-center gap-1">
                  <span>{CAMERA_MOVEMENTS.find((m) => m.key === session.cameraMovements[i])?.label}</span>
                  <button
                    onClick={() => update({ cameraMovements: session.cameraMovements.filter((_, idx) => idx !== i) })}
                    className="ml-1 text-gray-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span>Empty</span>
              )}
            </div>
          ))}
        </div>

        {Object.entries(ROWS).map(([rowKey, rowLabel]) => {
          const moves = CAMERA_MOVEMENTS.filter((m) => m.row === rowKey);
          return (
            <div key={rowKey} className="mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">{rowLabel}</p>
              <div className="flex flex-wrap gap-2">
                {moves.map((m) => {
                  const idx = slotIndex(m.key);
                  const isSelected = idx >= 0;
                  return (
                    <button
                      key={m.key}
                      onClick={() => toggleMove(m.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                          : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span>{m.icon}</span> {m.label}
                      {isSelected && <span className="text-[10px] ml-1 font-bold">#{idx + 1}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">
            Motion Intensity: {session.motionIntensity}%
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={session.motionIntensity}
            onChange={(e) => update({ motionIntensity: Number(e.target.value) })}
            className="w-full accent-[#C0392B]"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>Subtle</span>
            <span>Dramatic</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Speed</label>
          <div className="flex gap-2">
            {[
              { key: 'slow', label: 'Slow & Elegant' },
              { key: 'normal', label: 'Normal' },
              { key: 'dynamic', label: 'Dynamic' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => update({ motionSpeed: s.key })}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  session.motionSpeed === s.key
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <label className="block text-xs text-gray-400 mb-2 font-medium">Additional Motion Details</label>
        <textarea
          value={session.additionalMotion}
          onChange={(e) => update({ additionalMotion: e.target.value })}
          rows={2}
          placeholder="While camera dollies in, subject raises product toward camera and smiles"
          className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#C0392B] resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Video Duration</label>
          <div className="flex gap-3">
            {['5', '10'].map((d) => (
              <button
                key={d}
                onClick={() => update({ videoDuration: d })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  session.videoDuration === d
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {d} seconds
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Quality Mode</label>
          <div className="flex gap-3">
            {[
              { v: 'std', l: 'Standard', desc: 'Faster' },
              { v: 'pro', l: 'Pro', desc: 'Best quality' },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setKlingMode(m.v as 'std' | 'pro')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  klingMode === m.v
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span className="block">{m.l}</span>
                <span className="block text-[10px] opacity-70">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <label className="block text-xs text-gray-400 mb-3 font-medium">Output Options</label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSound((v) => !v)}
            disabled={multiShots}
            style={(!multiShots && sound) || multiShots ? { borderColor: '#10b981', backgroundColor: '#10b98118' } : {}}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all select-none
              ${multiShots ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'}
              ${(!multiShots && sound) || multiShots ? 'text-white' : 'border-white/10 bg-dark-800 text-gray-400'}`}
          >
            {(!multiShots && sound) || multiShots
              ? <Volume2 className="w-4 h-4" style={{ color: '#10b981' }} />
              : <VolumeX className="w-4 h-4" />
            }
            <span>{(!multiShots && sound) || multiShots ? 'Sound On' : 'Sound Off'}</span>
            <span style={{ backgroundColor: (!multiShots && sound) || multiShots ? '#10b981' : undefined }}
              className={`ml-1 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${(!multiShots && sound) || multiShots ? '' : 'bg-gray-600'}`} />
          </button>

          <button
            type="button"
            onClick={() => { setMultiShots((v) => !v); if (!multiShots) setSound(true); }}
            style={multiShots ? { borderColor: '#C0392B', backgroundColor: '#C0392B18' } : {}}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all select-none cursor-pointer hover:border-white/20
              ${multiShots ? 'text-white' : 'border-white/10 bg-dark-800 text-gray-400'}`}
          >
            <Layers className="w-4 h-4" style={multiShots ? { color: '#C0392B' } : {}} />
            <span>{multiShots ? 'Multi Shots On' : 'Multi Shots Off'}</span>
            <span style={{ backgroundColor: multiShots ? '#C0392B' : undefined }}
              className={`ml-1 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${multiShots ? '' : 'bg-gray-600'}`} />
          </button>
        </div>

        {multiShots && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] text-emerald-400">
              Sound forced <span className="font-semibold">ON</span> — required by API when <code className="font-mono bg-emerald-900/20 px-1 rounded">multi_shots: true</code>
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-900/60 border border-white/5 font-mono text-[10px] text-gray-500">
          <span className="text-gray-600">Payload preview</span>
          <span>sound: <span className={(!multiShots && sound) || multiShots ? 'text-emerald-400' : 'text-gray-500'}>{String(multiShots ? true : sound)}</span></span>
          <span>multi_shots: <span className={multiShots ? 'text-emerald-400' : 'text-gray-500'}>{String(multiShots)}</span></span>
          <span>mode: <span className="text-cyan-400">{klingMode}</span></span>
        </div>
      </div>

      {session.heroFrames[session.selectedHeroFrame] && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <img
              src={session.heroFrames[session.selectedHeroFrame]}
              alt="Selected hero frame"
              className="w-24 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white mb-0.5">Selected Hero Frame</p>
              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                {session.enhancedPrompt || session.prompt}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-400">
          Kling 3.0 will animate your hero frame with the selected camera movements. Generation takes 60-120 seconds.
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <button
          onClick={() => {
            setShowJsonPanel((v) => !v);
            if (!showJsonPanel) {
              const heroUrl = session.heroFrames[session.selectedHeroFrame] || '';
              const motionPrompt = buildMotionPrompt();
              setJsonOverride(
                JSON.stringify(
                  {
                    model: KLING3_IMAGE_TO_VIDEO_MODEL,
                    input: {
                      image_urls: [heroUrl || '{{heroFrameUrl}}'],
                      prompt: motionPrompt || '{{motionPrompt}}',
                      duration: String(session.videoDuration || '5'),
                      aspect_ratio: session.cameraRig?.aspectRatio || '16:9',
                      mode: klingMode,
                      sound: multiShots ? true : sound,
                      multi_shots: multiShots,
                    },
                  },
                  null,
                  2
                )
              );
              setJsonError('');
            }
          }}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" />
            <span className="font-medium">Advanced: Raw JSON Input Override</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              For unsupported parameters
            </span>
          </div>
          {showJsonPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showJsonPanel && (
          <div className="px-4 pb-4 border-t border-white/5">
            <p className="text-[11px] text-gray-500 mt-3 mb-2">
              Edit the full request JSON sent to KIE API. Use <code className="text-blue-400">{"{{heroFrameUrl}}"}</code> and{' '}
              <code className="text-blue-400">{"{{motionPrompt}}"}</code> as dynamic placeholders. When this panel is active, it overrides all settings above.
            </p>
            <div className="relative">
              <textarea
                value={jsonOverride}
                onChange={(e) => {
                  setJsonOverride(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setJsonError('');
                  } catch (err) {
                    setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
                  }
                }}
                rows={16}
                spellCheck={false}
                className="w-full px-4 py-3 bg-dark-900 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500 resize-y"
              />
              {jsonError && (
                <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                  <span className="font-bold">JSON Error:</span> {jsonError}
                </p>
              )}
            </div>
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-400">
                Kling 3.0 params: <span className="font-mono">image_urls</span> (array), <span className="font-mono">prompt</span>,{' '}
                <span className="font-mono">duration</span> (3–15s), <span className="font-mono">aspect_ratio</span> (16:9, 9:16, 1:1),{' '}
                <span className="font-mono">mode</span> (std/pro), <span className="font-mono">sound</span> (true/false), <span className="font-mono">multi_shots</span> (true/false). Any additional fields are sent as-is.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1C40F]/10 border border-[#F1C40F]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F1C40F]" />
          <span className="text-xs font-semibold text-[#F1C40F]">{KLING3_LABEL}</span>
          <Lock className="w-3 h-3 text-[#F1C40F]" />
        </div>
        <span className="text-[10px] text-gray-600">
          Model: {KLING3_IMAGE_TO_VIDEO_MODEL} · Mode: {klingMode.toUpperCase()}
        </span>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || session.cameraMovements.length === 0 || !session.heroFrames[session.selectedHeroFrame]}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#C0392B]/20"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="truncate max-w-xs">{progress || 'Generating with Kling 3.0...'}</span>
          </>
        ) : (
          <>
            <Film className="w-5 h-5" />
            Generate Cinematic Video ({KLING3_LABEL})
          </>
        )}
      </button>
    </div>
  );
}
