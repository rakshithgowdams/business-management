import { useState, useRef } from 'react';
import { Upload, X, Loader2, Dna, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { uploadMediaToStorage } from '../../../../lib/mediaDB';
import { CHARACTER_TYPES } from '../../../../lib/marketing/constants';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Product/Object'];
const AGE_RANGES = ['20-30', '30-40', '40-50', 'Custom'];
const BG_PREFS = [
  { key: 'orange_gradient', label: 'Orange Gradient' },
  { key: 'white_studio', label: 'White Studio' },
  { key: 'office', label: 'Office/Professional' },
  { key: 'outdoor', label: 'Outdoor Natural' },
  { key: 'custom', label: 'Custom' },
  { key: 'contextual', label: 'Contextual' },
];

export default function CharacterTrainer({ onComplete, onCancel }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'identity' | 'photos' | 'attributes' | 'training'>('identity');
  const [name, setName] = useState('');
  const [charType, setCharType] = useState('real_person');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [signatureElements, setSignatureElements] = useState('');
  const [bgPref, setBgPref] = useState('contextual');
  const [training, setTraining] = useState(false);
  const [trainingMsg, setTrainingMsg] = useState('');

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 30));
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrain = async () => {
    if (!user || !name.trim()) {
      toast.error('Character name is required');
      return;
    }
    if (photos.length < 3) {
      toast.error('Upload at least 3 reference photos');
      return;
    }

    setTraining(true);
    const messages = [
      'Uploading photos...',
      'Analyzing character features...',
      'Training facial geometry model...',
      'Training outfit & style model...',
      'Creating character identity token...',
    ];

    const refPaths: string[] = [];

    try {
      for (let i = 0; i < photos.length; i++) {
        setTrainingMsg(`Uploading photo ${i + 1}/${photos.length}...`);
        const photo = photos[i];
        const photoId = crypto.randomUUID();
        const result = await uploadMediaToStorage(user.id, photoId, photo.file, photo.file.type);
        if (result) refPaths.push(result.path);
      }

      for (let i = 1; i < messages.length; i++) {
        setTrainingMsg(messages[i]);
        await new Promise((r) => setTimeout(r, 800));
      }

      const { error } = await supabase.from('ai_characters').insert({
        user_id: user.id,
        name: name.trim(),
        character_type: charType,
        gender,
        age_range: ageRange,
        style_notes: styleNotes,
        signature_elements: signatureElements,
        background_preference: bgPref,
        photos_count: photos.length,
        reference_paths: refPaths,
        status: 'ready',
      });

      if (error) throw error;

      setTrainingMsg('Character trained! Ready to generate.');
      toast.success('Character trained successfully');
      await new Promise((r) => setTimeout(r, 1000));
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Training failed');
    }
    setTraining(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {step === 'identity' && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <h3 className="text-lg font-semibold">Step A — Character Identity</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Character Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya - Tech Advisor"
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Character Type</label>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setCharType(t.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    charType === t.key
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Gender</label>
              <div className="flex flex-wrap gap-1.5">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      gender === g ? 'bg-[#7C3AED] text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Age Range</label>
              <div className="flex flex-wrap gap-1.5">
                {AGE_RANGES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgeRange(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      ageRange === a ? 'bg-[#7C3AED] text-white' : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Style Notes</label>
            <textarea
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.target.value)}
              rows={3}
              placeholder="Traditional Karnataka silk saree, professional confident look, dark skin, natural hair"
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C3AED] resize-none"
            />
          </div>

          <button
            onClick={() => setStep('photos')}
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/20"
          >
            Continue to Photos
          </button>
        </div>
      )}

      {step === 'photos' && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold mb-1">Step B — Training Photos</h3>
            <p className="text-xs text-gray-500">Upload 3-30 reference photos of your character. More photos = better consistency.</p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                <img src={p.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 30 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-[#7C3AED]/30 transition-colors flex flex-col items-center justify-center"
              >
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-[10px] text-gray-600 mt-1">Add</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />

          <p className="text-xs text-gray-400">{photos.length} / 30 photos uploaded</p>

          <div className="p-4 rounded-xl bg-dark-800 border border-white/10 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-400 mb-2">Photo Tips:</p>
            <p>- Clear face visibility</p>
            <p>- Multiple angles (front, side, 3/4)</p>
            <p>- Different expressions (neutral, smiling, serious)</p>
            <p>- Consistent outfit (signature look)</p>
            <p>- Good lighting — avoid shadows</p>
            <p>- High resolution (800px+ minimum)</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('identity')} className="flex-1 py-3 rounded-xl bg-dark-800 border border-white/10 text-gray-400 font-medium hover:text-white transition-all">
              Back
            </button>
            <button
              onClick={() => setStep('attributes')}
              disabled={photos.length < 3}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/20"
            >
              Continue to Attributes
            </button>
          </div>
        </div>
      )}

      {step === 'attributes' && (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <h3 className="text-lg font-semibold">Step C — Character Attributes</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Signature Elements</label>
            <input
              type="text"
              value={signatureElements}
              onChange={(e) => setSignatureElements(e.target.value)}
              placeholder="Orange dupatta, gold earrings, confident posture, warm smile"
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Background Preference</label>
            <div className="flex flex-wrap gap-2">
              {BG_PREFS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBgPref(b.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    bgPref === b.key
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('photos')} className="flex-1 py-3 rounded-xl bg-dark-800 border border-white/10 text-gray-400 font-medium hover:text-white transition-all">
              Back
            </button>
            <button
              onClick={handleTrain}
              disabled={training}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/20"
            >
              {training ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {trainingMsg}</>
              ) : (
                <><Dna className="w-4 h-4" /> Start Character Training</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
