import { useState } from 'react';
import { Download, Save, RotateCcw, Plus, Film, Camera, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl } from '../../../../lib/mediaDB';
import type { CinematicSession } from '../../../../lib/marketing/types';
import { CAMERA_MOVEMENTS, CAMERA_BODIES, LENS_TYPES } from '../../../../lib/marketing/constants';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNewScene: () => void;
  onReAnimate: () => void;
}

export default function CinematicExport({ session, onNewScene, onReAnimate }: Props) {
  const { user } = useAuth();
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraBody = CAMERA_BODIES.find((b) => b.key === session.cameraRig.body);
  const lens = LENS_TYPES.find((l) => l.key === session.cameraRig.lens);
  const moves = session.cameraMovements.map((k) => CAMERA_MOVEMENTS.find((m) => m.key === k)?.label).filter(Boolean);

  const handleDownload = async () => {
    if (!session.finalVideoUrl) return;
    try {
      const res = await fetch(session.finalVideoUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cinematic-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleSaveToGallery = async () => {
    if (!session.finalVideoUrl || !user) return;
    setSaving(true);
    try {
      const assetId = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, assetId, session.finalVideoUrl);
      await supabase.from('media_assets').insert({
        id: assetId,
        user_id: user.id,
        type: 'video',
        title: `Cinematic: ${session.prompt.slice(0, 60)}`,
        prompt: session.enhancedPrompt || session.prompt,
        provider: 'kie_ai',
        status: 'completed',
        result_url: uploaded?.publicUrl || session.finalVideoUrl,
        storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: {
          source: 'cinematic_studio_export',
          videoModel: 'kling/v3-image-to-video',
          cameraMovements: session.cameraMovements,
          cameraRig: session.cameraRig,
          platform: session.platform,
          genre: session.genre,
          tone: session.tone,
        },
      });
      setSavedToGallery(true);
      toast.success('Video saved to Media Gallery!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Your Cinematic is Ready!</h3>
            <p className="text-xs text-gray-500">Scene complete. Download or publish your video.</p>
          </div>
        </div>

        {session.finalVideoUrl ? (
          <video
            src={session.finalVideoUrl}
            controls
            autoPlay
            className="w-full rounded-xl border border-white/10 bg-black"
            style={{ maxHeight: '500px' }}
          />
        ) : (
          <div className="w-full h-64 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center">
            <p className="text-gray-600">Video not generated yet</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#C0392B]/15 text-[#C0392B]">
            <Camera className="w-3 h-3 inline mr-1" />Kling 3.0
          </span>
          {lens && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F1C40F]/15 text-[#F1C40F]">
              {lens.icon} {lens.label}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-gray-400">
            {session.cameraRig.aperture}
          </span>
          {moves.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-gray-400">
              {moves.join(' + ')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={handleDownload}
          disabled={!session.finalVideoUrl}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all"
        >
          <Download className="w-4 h-4" /> Download MP4
        </button>
        <button
          onClick={handleSaveToGallery}
          disabled={saving || savedToGallery || !session.finalVideoUrl}
          className="py-3 px-4 rounded-xl bg-dark-800 border border-white/10 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
        >
          {savedToGallery ? (
            <><Check className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">Saved!</span></>
          ) : saving ? (
            <><Film className="w-4 h-4 animate-pulse" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save to Gallery</>
          )}
        </button>
        <button
          onClick={onReAnimate}
          className="py-3 px-4 rounded-xl bg-dark-800 border border-white/10 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:text-white hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Re-animate
        </button>
        <button
          onClick={onNewScene}
          className="py-3 px-4 rounded-xl bg-dark-800 border border-white/10 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:text-white hover:border-white/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Scene
        </button>
      </div>

      {(session.heroFrames.length > 0 || session.finalVideoUrl) && (
        <div className="glass-card rounded-xl p-6">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">This Session</h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {session.heroFrames.map((url, i) => (
              <div key={`frame-${i}`} className="shrink-0">
                <img src={url} alt={`Frame ${i + 1}`} className="w-24 h-16 rounded-lg object-cover border border-white/10" />
                <p className="text-[10px] text-gray-600 mt-1 text-center">
                  Frame {i + 1} {i === session.selectedHeroFrame ? '(Hero)' : ''}
                </p>
              </div>
            ))}
            {session.finalVideoUrl && (
              <div className="shrink-0">
                <div className="w-24 h-16 rounded-lg bg-dark-800 border border-emerald-500/30 flex items-center justify-center">
                  <Film className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-emerald-400 mt-1 text-center">Final Video</p>
              </div>
            )}
          </div>
        </div>
      )}

      {cameraBody && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Camera Rig Used</p>
          <p className="text-sm text-gray-300">
            {cameraBody.icon} {cameraBody.label} | {lens?.icon} {lens?.label} | {session.cameraRig.focalLength}mm | {session.cameraRig.aperture} | {session.cameraRig.filmLook}
          </p>
        </div>
      )}
    </div>
  );
}
