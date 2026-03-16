import { useState } from 'react';
import { ArrowLeft, Loader2, Dna, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { uploadFromUrl } from '../../../../lib/mediaDB';
import { getKieKey, generateImage } from '../../../../lib/marketing/kieApi';
import { PLATFORM_SIZES } from '../../../../lib/marketing/constants';
import type { AICharacter } from '../../../../lib/marketing/types';

interface Props {
  character: AICharacter;
  onBack: () => void;
}

const GEN_MODES = [
  { key: 'image', label: 'Image Only' },
  { key: 'carousel', label: 'Carousel Set (3-5 images)' },
];

const STYLE_CHIPS = [
  { key: 'maintain', label: 'Maintain Character Style' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'cinematic', label: 'Cinematic Lighting' },
  { key: 'portrait', label: 'Studio Portrait' },
  { key: 'traditional', label: 'Traditional Indian' },
  { key: 'futuristic', label: 'Futuristic Tech' },
];

export default function CharacterGenerator({ character, onBack }: Props) {
  const { user } = useAuth();
  const [scene, setScene] = useState('');
  const [platform, setPlatform] = useState('ig_post');
  const [mode, setMode] = useState('image');
  const [styleInjection, setStyleInjection] = useState('maintain');
  const [carouselCount, setCarouselCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const buildCharacterPrompt = () => {
    const parts = [
      `Consistent character: ${character.name}`,
      character.signature_elements && `Key features: ${character.signature_elements}`,
      character.style_notes && `Appearance: ${character.style_notes}`,
      character.gender && `Gender: ${character.gender}`,
      scene,
      styleInjection !== 'maintain' && `Style: ${styleInjection}`,
      character.background_preference !== 'contextual' && `Background: ${character.background_preference}`,
    ];
    return parts.filter(Boolean).join('. ');
  };

  const handleGenerate = async () => {
    const apiKey = await getKieKey();
    if (!apiKey) {
      toast.error('Add your Kie.ai API key in Settings > Integrations');
      return;
    }
    if (!scene.trim()) {
      toast.error('Describe the scene');
      return;
    }

    setGenerating(true);
    setResults([]);
    setProgress('Generating with character...');

    try {
      const prompt = buildCharacterPrompt();
      const ratio = PLATFORM_SIZES.find((p) => p.key === platform)?.ratio || '1:1';
      const count = mode === 'carousel' ? carouselCount : 1;

      const allUrls: string[] = [];
      for (let i = 0; i < count; i++) {
        setProgress(`Generating image ${i + 1} of ${count}...`);
        const urls = await generateImage(prompt, 'flux-kontext-pro', ratio, 1, apiKey, (msg) => setProgress(`Image ${i + 1}: ${msg}`));
        allUrls.push(...urls);
      }

      setResults(allUrls);

      if (user) {
        for (const url of allUrls) {
          try {
            const assetId = crypto.randomUUID();
            const uploaded = await uploadFromUrl(user.id, assetId, url);
            await supabase.from('media_assets').insert({
              id: assetId,
              user_id: user.id,
              type: 'image',
              title: `${character.name}: ${scene.slice(0, 60)}`,
              prompt: buildCharacterPrompt(),
              provider: 'kie_ai',
              status: 'completed',
              result_url: uploaded?.publicUrl || url,
              storage_path: uploaded?.path || null,
              file_size: uploaded?.size || 0,
              metadata: { source: 'character_ai', characterId: character.id, characterName: character.name },
            });
          } catch { /* non-critical */ }
        }
      }

      toast.success(`${allUrls.length} image(s) generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    }
    setGenerating(false);
    setProgress('');
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-lg">
                {character.character_type === 'brand_mascot' ? '🎭' : character.character_type === 'ai_influencer' ? '🤖' : '👤'}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{character.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{character.character_type.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Scene Description</label>
              <textarea
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                rows={3}
                placeholder={`${character.name} presents AI automation services in a professional office, confident pose, orange gradient background`}
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#7C3AED] resize-none"
              />
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs text-gray-400 mb-2 font-medium">Platform</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORM_SIZES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    platform === p.key
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400 mb-2 font-medium">Generation Mode</label>
            <div className="flex gap-2 mb-4">
              {GEN_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    mode === m.key
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'carousel' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">Slides</label>
                <div className="flex gap-2">
                  {[3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCarouselCount(n)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        carouselCount === n ? 'bg-[#7C3AED] text-white' : 'bg-dark-800 border border-white/10 text-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="block text-xs text-gray-400 mb-2 font-medium">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_CHIPS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyleInjection(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    styleInjection === s.key
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !scene.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/20"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {progress}</>
            ) : (
              <><Dna className="w-5 h-5" /> Generate with {character.name}</>
            )}
          </button>
        </div>

        <div>
          {results.length > 0 && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-400">Generated</h4>
              {results.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-white/5">
                  <img src={url} alt={`Result ${i + 1}`} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={url} download target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
