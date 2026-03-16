import { useState } from 'react';
import { Loader2, Music, Sparkles, Play, Pause, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadFromUrl } from '../../../lib/mediaDB';

const GENRES = [
  'Ambient', 'Classical', 'Corporate', 'Electronic', 'Hip Hop',
  'Jazz', 'Lo-fi', 'Pop', 'Rock', 'Cinematic', 'Acoustic', 'World',
];

const DURATIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
];

export default function MusicGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Corporate');
  const [duration, setDuration] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);

  const handleGenerate = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) {
      toast.error('Add your Kie.ai API key in Settings > Integrations');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }

    setGenerating(true);
    setResults([]);

    try {
      const res = await fetch('https://api.kie.ai/v1/audio/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: `${prompt}, ${genre} genre`,
          duration,
          n: 2,
        }),
      });

      const data = await res.json();

      if (data.task_id) {
        await pollForResult(data.task_id, apiKey);
      } else if (data.data) {
        const urls = data.data.map((d: { url: string }) => d.url);
        setResults(urls);
        await saveAssets(urls);
      } else if (data.error) {
        toast.error(data.error.message || 'Generation failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    }
    setGenerating(false);
  };

  const pollForResult = async (id: string, apiKey: string) => {
    let attempts = 0;
    while (attempts < 60) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`https://api.kie.ai/v1/tasks/${id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await res.json();
        if (data.status === 'completed' && data.output) {
          const urls = Array.isArray(data.output) ? data.output : [data.output];
          setResults(urls);
          await saveAssets(urls);
          return;
        }
        if (data.status === 'failed') {
          toast.error('Music generation failed');
          return;
        }
      } catch {
        // retry
      }
      attempts++;
    }
    toast.error('Generation timed out');
  };

  const saveAssets = async (urls: string[]) => {
    if (!user) return;
    for (const url of urls) {
      const assetId = crypto.randomUUID();
      const uploaded = await uploadFromUrl(user.id, assetId, url);
      await supabase.from('media_assets').insert({
        id: assetId,
        user_id: user.id,
        type: 'music',
        title: prompt.slice(0, 100),
        prompt,
        provider: 'kie_ai',
        status: 'completed',
        result_url: uploaded?.publicUrl || url,
        storage_path: uploaded?.path || null,
        file_size: uploaded?.size || 0,
        metadata: { genre, duration },
      });
    }
  };

  const togglePlay = (index: number) => {
    const audio = document.getElementById(`audio-${index}`) as HTMLAudioElement;
    if (!audio) return;
    if (playing === index) {
      audio.pause();
      setPlaying(null);
    } else {
      document.querySelectorAll('audio').forEach((a) => a.pause());
      audio.play();
      setPlaying(index);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-[#FF6B00]" />
          AI Music Generator
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Describe the music</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Upbeat corporate background music for a product demo video..."
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    genre === g
                      ? 'gradient-orange text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    duration === d.value
                      ? 'gradient-orange text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Music...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Music</>
            )}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Generated Tracks</h3>
          <div className="space-y-3">
            {results.map((url, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                <button
                  onClick={() => togglePlay(i)}
                  className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center shrink-0"
                >
                  {playing === i ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Track {i + 1}</p>
                  <p className="text-xs text-gray-500">{genre} - {duration}s</p>
                </div>
                <a
                  href={url}
                  download
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <Download className="w-4 h-4" />
                </a>
                <audio id={`audio-${i}`} src={url} onEnded={() => setPlaying(null)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
