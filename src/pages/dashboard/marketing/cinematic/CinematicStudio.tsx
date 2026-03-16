import { useState, useCallback } from 'react';
import { Film, Check } from 'lucide-react';
import type { CinematicSession, CameraRig } from '../../../../lib/marketing/types';
import ScriptVision from './ScriptVision';
import VisualReference from './VisualReference';
import CameraRigBuilder from './CameraRigBuilder';
import HeroFrameGen from './HeroFrameGen';
import HeroFrameSelect from './HeroFrameSelect';
import CameraMotion from './CameraMotion';
import CinematicExport from './CinematicExport';

const STEPS = [
  'Script the Vision',
  'Visual Reference',
  'Build Camera Rig',
  'Generate Hero Frame',
  'Select Best Frame',
  'Direct Camera Motion',
  'Export & Publish',
];

const DEFAULT_RIG: CameraRig = {
  body: 'cinema',
  lens: 'anamorphic',
  focalLength: 50,
  aperture: 'f/2.8',
  filmLook: 'Cinematic 24fps',
  aspectRatio: '16:9',
};

const DEFAULT_SESSION: CinematicSession = {
  prompt: '',
  enhancedPrompt: '',
  genre: 'corporate',
  tone: 'professional',
  duration: '5s',
  platform: 'Instagram Reel',
  styleReference: null,
  subjectReference: null,
  characterLock: false,
  cameraRig: DEFAULT_RIG,
  heroFrames: [],
  selectedHeroFrame: -1,
  videoModel: 'kling-v3',
  videoDuration: '5',
  motionDescription: '',
  cameraMovements: [],
  motionIntensity: 50,
  motionSpeed: 'normal',
  additionalMotion: '',
  finalVideoUrl: '',
};

const TOTAL_STEPS = STEPS.length;

export default function CinematicStudio() {
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<CinematicSession>(DEFAULT_SESSION);

  const update = useCallback((patch: Partial<CinematicSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((s: number) => {
    setStep(Math.max(0, Math.min(TOTAL_STEPS - 1, s)));
  }, []);

  const maxReached = (() => {
    if (session.finalVideoUrl) return TOTAL_STEPS - 1;
    if (session.cameraMovements.length > 0) return TOTAL_STEPS - 1;
    if (session.selectedHeroFrame >= 0) return 5;
    if (session.heroFrames.length > 0) return 4;
    if (session.cameraRig.body) return 3;
    if (session.enhancedPrompt || session.prompt) return 2;
    return 0;
  })();

  return (
    <div className="flex gap-6">
      <div className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-6 space-y-1">
          {STEPS.map((label, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            const isClickable = i <= maxReached;

            return (
              <button
                key={i}
                onClick={() => isClickable && goTo(i)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C0392B]/20 to-[#F1C40F]/10 border border-[#C0392B]/30 text-white'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-white/5'
                    : isClickable
                    ? 'text-gray-400 hover:bg-white/5'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-dark-800 text-gray-500 border border-white/10'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0392B] to-[#F1C40F] flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Cinematic Studio</h2>
            <p className="text-xs text-gray-400">Step {step + 1} of {TOTAL_STEPS} — {STEPS[step]}</p>
          </div>
        </div>

        <div className="lg:hidden flex gap-1 mb-4 overflow-x-auto pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= maxReached && goTo(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                i === step
                  ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                  : i < step
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-dark-800 text-gray-500 border border-white/10'
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </button>
          ))}
        </div>

        {step === 0 && <ScriptVision session={session} update={update} onNext={() => goTo(1)} />}
        {step === 1 && <VisualReference session={session} update={update} onNext={() => goTo(2)} onSkip={() => goTo(2)} />}
        {step === 2 && <CameraRigBuilder session={session} update={update} onNext={() => goTo(3)} />}
        {step === 3 && <HeroFrameGen session={session} update={update} onNext={() => goTo(4)} />}
        {step === 4 && <HeroFrameSelect session={session} update={update} onNext={() => goTo(5)} onBack={() => goTo(3)} />}
        {step === 5 && <CameraMotion session={session} update={update} onNext={() => goTo(6)} />}
        {step === 6 && (
          <CinematicExport
            session={session}
            update={update}
            onNewScene={() => { setSession(DEFAULT_SESSION); setStep(0); }}
            onReAnimate={() => goTo(5)}
          />
        )}
      </div>
    </div>
  );
}
