import { ArrowRight, Star } from 'lucide-react';
import type { CinematicSession } from '../../../../lib/marketing/types';
import { VIDEO_MODELS } from '../../../../lib/marketing/constants';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
}

export default function BridgeToVideo({ session, update, onNext }: Props) {
  const heroUrl = session.heroFrames[session.selectedHeroFrame];

  return (
    <div className="space-y-6">
      {heroUrl && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <img src={heroUrl} alt="Hero" className="w-20 h-20 rounded-lg object-cover border border-white/10" />
          <div>
            <p className="text-sm font-medium text-white">Hero Frame Selected</p>
            <p className="text-xs text-gray-500">This frame will be animated into video</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Video Model</h3>
        <div className="space-y-3">
          {VIDEO_MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => update({ videoModel: m.key })}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                session.videoModel === m.key
                  ? 'border-[#C0392B] bg-[#C0392B]/10 shadow-lg shadow-[#C0392B]/10'
                  : 'border-white/5 bg-dark-800 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-white">{m.label}</p>
                    {m.recommended && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1C40F]/15 text-[#F1C40F]">
                        <Star className="w-3 h-3" /> RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{m.desc}</p>
                  <p className="text-xs text-gray-500">{m.specs}</p>
                </div>
                <span className="text-sm font-medium text-gray-400 shrink-0 ml-4">{m.cost}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <label className="block text-xs text-gray-400 mb-3 font-medium">Duration</label>
        <div className="flex gap-3">
          {['5', '10'].map((d) => (
            <button
              key={d}
              onClick={() => update({ videoDuration: d })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
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
        <label className="block text-xs text-gray-400 mb-2 font-medium">Motion Description</label>
        <p className="text-xs text-gray-600 mb-3">What should happen in the video?</p>
        <textarea
          value={session.motionDescription}
          onChange={(e) => update({ motionDescription: e.target.value })}
          rows={3}
          placeholder="Subject smiles and turns toward camera, hair moves gently in breeze, background bokeh glows"
          className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#C0392B] resize-none"
        />
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all"
      >
        Go to Camera Direction <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
