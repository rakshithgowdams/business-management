import { Check, RotateCcw, ArrowRight } from 'lucide-react';
import type { CinematicSession } from '../../../../lib/marketing/types';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function HeroFrameSelect({ session, update, onNext, onBack }: Props) {
  const heroUrl = session.heroFrames[session.selectedHeroFrame];

  if (!heroUrl) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-gray-400 mb-4">No hero frame selected</p>
        <button onClick={onBack} className="text-[#C0392B] text-sm hover:underline">
          Go back to generate frames
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <img
              src={heroUrl}
              alt="Hero frame"
              className="w-full rounded-xl border-2 border-[#F1C40F]/30 shadow-lg shadow-[#F1C40F]/10"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Hero Frame Locked</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Frame {session.selectedHeroFrame + 1} of {session.heroFrames.length} has been selected as your anchor frame.
              This frame will be animated into your final cinematic video.
            </p>

            {session.heroFrames.length > 1 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2">Other frames</p>
                <div className="flex gap-2">
                  {session.heroFrames.map((url, i) => (
                    i !== session.selectedHeroFrame && (
                      <button
                        key={i}
                        onClick={() => update({ selectedHeroFrame: i })}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:border-[#F1C40F]/50 transition-all"
                      >
                        <img src={url} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-dark-800 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:text-white hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Reshoot Frames
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all"
        >
          Lock Hero Frame & Animate <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
