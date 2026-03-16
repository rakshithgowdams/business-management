import { Lock, Camera } from 'lucide-react';
import type { CinematicSession, CameraRig } from '../../../../lib/marketing/types';
import { CAMERA_BODIES, LENS_TYPES, FILM_LOOKS, CINEMA_ASPECTS } from '../../../../lib/marketing/constants';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
}

const APERTURES = ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16'];

function getApertureDesc(ap: string) {
  const n = parseFloat(ap.replace('f/', ''));
  if (n <= 2) return 'Creamy blurred background (bokeh portrait)';
  if (n <= 4) return 'Moderate blur, sharp subject';
  if (n <= 8) return 'Balanced depth, group shots';
  return 'Everything in focus, landscape style';
}

export default function CameraRigBuilder({ session, update, onNext }: Props) {
  const rig = session.cameraRig;

  const setRig = (patch: Partial<CameraRig>) => {
    update({ cameraRig: { ...rig, ...patch } });
  };

  const bodyLabel = CAMERA_BODIES.find((b) => b.key === rig.body)?.label || rig.body;
  const lensLabel = LENS_TYPES.find((l) => l.key === rig.lens)?.label || rig.lens;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-5 h-5 text-[#F1C40F]" />
          <h3 className="text-lg font-semibold">Configure Your Virtual Camera</h3>
        </div>
        <p className="text-xs text-gray-500 mb-6">These settings simulate real optical physics</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs text-gray-400 mb-3 font-medium">Camera Body</label>
            <div className="space-y-2">
              {CAMERA_BODIES.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setRig({ body: b.key })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    rig.body === b.key
                      ? 'border-[#C0392B] bg-[#C0392B]/10 shadow-lg shadow-[#C0392B]/10'
                      : 'border-white/5 bg-dark-800 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className={`text-sm font-medium ${rig.body === b.key ? 'text-white' : 'text-gray-400'}`}>{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-3 font-medium">Lens Type</label>
            <div className="space-y-2">
              {LENS_TYPES.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setRig({ lens: l.key })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    rig.lens === l.key
                      ? 'border-[#F1C40F] bg-[#F1C40F]/10 shadow-lg shadow-[#F1C40F]/10'
                      : 'border-white/5 bg-dark-800 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{l.icon}</span>
                  <span className={`text-sm font-medium ${rig.lens === l.key ? 'text-white' : 'text-gray-400'}`}>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Focal Length: {rig.focalLength}mm</label>
              <input
                type="range"
                min={24}
                max={200}
                value={rig.focalLength}
                onChange={(e) => setRig({ focalLength: Number(e.target.value) })}
                className="w-full accent-[#C0392B]"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>24mm</span><span>200mm</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Aperture (Depth of Field)</label>
              <div className="flex flex-wrap gap-1.5">
                {APERTURES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setRig({ aperture: a })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rig.aperture === a
                        ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                        : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#F1C40F]/60 mt-2">{getApertureDesc(rig.aperture)}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Film Look</label>
              <div className="flex flex-wrap gap-1.5">
                {FILM_LOOKS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setRig({ filmLook: f })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rig.filmLook === f
                        ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                        : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">Aspect Ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {CINEMA_ASPECTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setRig({ aspectRatio: a.value })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rig.aspectRatio === a.value
                        ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                        : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Rig Summary</p>
        <p className="text-sm text-white">
          {CAMERA_BODIES.find((b) => b.key === rig.body)?.icon} {bodyLabel} | {LENS_TYPES.find((l) => l.key === rig.lens)?.icon} {lensLabel} | {rig.focalLength}mm | {rig.aperture} | {rig.filmLook} | {rig.aspectRatio}
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all"
      >
        <Lock className="w-4 h-4" /> Rig Locked
      </button>
    </div>
  );
}
