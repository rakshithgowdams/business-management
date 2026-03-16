import { useRef, useState } from 'react';
import { Upload, Image, Lock, SkipForward, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { uploadMediaToStorage } from '../../../../lib/mediaDB';
import type { CinematicSession } from '../../../../lib/marketing/types';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
  onSkip: () => void;
}

interface UploadState {
  preview: string;
  uploading: boolean;
  ready: boolean;
}

export default function VisualReference({ session, update, onNext, onSkip }: Props) {
  const { user } = useAuth();
  const styleRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const [styleState, setStyleState] = useState<UploadState>({ preview: '', uploading: false, ready: false });
  const [subjectState, setSubjectState] = useState<UploadState>({ preview: '', uploading: false, ready: false });

  const handleUpload = async (
    file: File,
    field: 'styleReference' | 'subjectReference',
    setState: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    if (!user) return;
    const preview = URL.createObjectURL(file);
    setState({ preview, uploading: true, ready: false });
    update({ [field]: null });

    try {
      const result = await uploadMediaToStorage(
        user.id,
        `cinematic-ref-${crypto.randomUUID()}`,
        file,
        file.type
      );
      if (result?.publicUrl) {
        update({ [field]: result.publicUrl });
        setState({ preview, uploading: false, ready: true });
      } else {
        toast.error('Upload failed — try again');
        setState({ preview, uploading: false, ready: false });
      }
    } catch {
      toast.error('Upload failed');
      setState({ preview, uploading: false, ready: false });
    }
  };

  const clearRef = (
    field: 'styleReference' | 'subjectReference',
    state: UploadState,
    setState: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setState({ preview: '', uploading: false, ready: false });
    update({ [field]: null });
  };

  const RefUploadBox = ({
    label,
    sublabel,
    field,
    state,
    setState,
    inputRef,
    color,
  }: {
    label: string;
    sublabel: string;
    field: 'styleReference' | 'subjectReference';
    state: UploadState;
    setState: React.Dispatch<React.SetStateAction<UploadState>>;
    inputRef: React.RefObject<HTMLInputElement>;
    color: string;
  }) => (
    <div className="glass-card rounded-xl p-6">
      <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Image className="w-4 h-4" style={{ color }} />
        {label}
        {state.uploading && (
          <span className="ml-auto text-[10px] text-[#0891B2] inline-flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
          </span>
        )}
        {state.ready && !state.uploading && (
          <span className="ml-auto text-[10px] text-emerald-400 inline-flex items-center gap-1">
            <Check className="w-2.5 h-2.5" /> Ready
          </span>
        )}
      </h4>
      <p className="text-xs text-gray-500 mb-4">{sublabel}</p>

      {state.preview ? (
        <div className="relative">
          <img src={state.preview} alt="Reference" className="w-full h-48 object-cover rounded-xl border border-white/10" />
          <button
            onClick={() => clearRef(field, state, setState)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {state.uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-48 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 transition-colors flex flex-col items-center justify-center gap-2"
          style={{ borderColor: `${color}20` }}
        >
          <Upload className="w-8 h-8 text-gray-500" />
          <span className="text-xs text-gray-500">Upload {label}</span>
          <span className="text-[10px] text-gray-600">JPG, PNG, WebP</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, field, setState); e.target.value = ''; }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="px-4 py-3 rounded-xl bg-[#F1C40F]/5 border border-[#F1C40F]/15 space-y-1">
        <p className="text-xs text-[#F1C40F] font-medium">Both reference images are uploaded to secure storage and injected directly into the Nano Banana Pro generation payload.</p>
        <p className="text-[11px] text-[#F1C40F]/70">Style reference guides visual tone & color. Character reference ensures face & subject fidelity across all generated frames.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RefUploadBox
          label="Style Reference"
          sublabel="Upload an image to guide the visual style and mood"
          field="styleReference"
          state={styleState}
          setState={setStyleState}
          inputRef={styleRef as React.RefObject<HTMLInputElement>}
          color="#F1C40F"
        />

        <div className="glass-card rounded-xl p-6">
          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#C0392B]" />
            Character/Subject Reference
            {subjectState.uploading && (
              <span className="ml-auto text-[10px] text-[#0891B2] inline-flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
              </span>
            )}
            {subjectState.ready && !subjectState.uploading && (
              <span className="ml-auto text-[10px] text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Ready
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-500 mb-4">Upload photo of your model or product for consistency</p>

          {subjectState.preview ? (
            <div className="relative">
              <img src={subjectState.preview} alt="Subject ref" className="w-full h-48 object-cover rounded-xl border border-white/10" />
              <button
                onClick={() => clearRef('subjectReference', subjectState, setSubjectState)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {subjectState.uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => subjectRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-[#C0392B]/20 hover:border-[#C0392B]/30 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-500" />
              <span className="text-xs text-gray-500">Upload Subject Reference</span>
              <span className="text-[10px] text-gray-600">JPG, PNG, WebP</span>
            </button>
          )}
          <input
            ref={subjectRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'subjectReference', setSubjectState); e.target.value = ''; }}
          />

          <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] text-emerald-400 font-medium mb-1">Character reference is always injected into generation</p>
            <p className="text-[11px] text-emerald-400/70">The model receives this image as a direct input parameter alongside your prompt, ensuring character fidelity.</p>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${session.characterLock ? 'bg-[#C0392B]' : 'bg-dark-800 border border-white/10'}`}
              onClick={() => update({ characterLock: !session.characterLock })}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${session.characterLock ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-xs text-gray-400">Emphasize Character Lock in Prompt</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl bg-dark-800 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:text-white hover:border-white/20 transition-all"
        >
          <SkipForward className="w-4 h-4" /> Skip References
        </button>
        <button
          onClick={onNext}
          disabled={styleState.uploading || subjectState.uploading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C0392B]/20 transition-all disabled:opacity-50"
        >
          <Lock className="w-4 h-4" /> References Set
        </button>
      </div>
    </div>
  );
}
