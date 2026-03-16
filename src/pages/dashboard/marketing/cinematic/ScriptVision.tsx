import { useState } from 'react';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CinematicSession } from '../../../../lib/marketing/types';
import { GENRES, TONES, SCENE_DURATIONS, PLATFORMS } from '../../../../lib/marketing/constants';
import { getOpenRouterKey } from '../../../../lib/ai/models';
import { supabase } from '../../../../lib/supabase';

interface Props {
  session: CinematicSession;
  update: (patch: Partial<CinematicSession>) => void;
  onNext: () => void;
}

async function expandPromptWithGemini(
  sceneDesc: string,
  platform: string,
  duration: string,
  genre: string,
  tone: string
): Promise<string> {
  const prompt = `You are a professional cinematic video director and prompt engineer.

Transform this scene idea into a rich, detailed cinematic video generation prompt.

Scene: ${sceneDesc}
Platform: ${platform}
Duration: ${duration}
Genre: ${genre}
Tone: ${tone}

Write ONE detailed cinematic prompt that includes:
- Subject appearance and action
- Lighting setup (golden hour, soft diffused, dramatic, etc.)
- Camera angle and framing
- Background environment and depth
- Mood and atmosphere
- Color palette and grading style
- Film style reference (if relevant)

Return ONLY the prompt text. No headings, no explanation, no JSON.`;

  let apiKey: string | null = getOpenRouterKey();

  if (!apiKey) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prompt,
          model: 'google/gemini-2.5-flash',
          max_tokens: 600,
          temperature: 0.8,
        }),
      }
    );
    const json = await res.json();
    const text = json.raw_content || (typeof json.data === 'string' ? json.data : null);
    if (text) return text.trim();
    if (json.error) throw new Error(json.error);
    throw new Error('No response from AI');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mydesignnexus.com',
      'X-Title': 'Cinematic Studio',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini');
  return text.trim();
}

export default function ScriptVision({ session, update, onNext }: Props) {
  const [expanding, setExpanding] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleExpand = async () => {
    if (!session.prompt.trim()) {
      toast.error('Enter a scene description first');
      return;
    }
    setExpanding(true);
    try {
      const text = await expandPromptWithGemini(
        session.prompt,
        session.platform,
        session.duration,
        session.genre,
        session.tone
      );
      update({ enhancedPrompt: text });
      toast.success('Cinematic prompt expanded!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI expansion failed');
    }
    setExpanding(false);
  };

  const canProceed = session.prompt.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1">Describe your cinematic scene</h3>
        <p className="text-xs text-gray-500 mb-4">Paint the picture — Gemini 2.5 Flash will expand it into a production-ready prompt</p>

        <textarea
          value={session.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          rows={4}
          placeholder="A Karnataka businesswoman in traditional silk saree walks confidently through a modern Hassan tech office, warm orange bokeh background, golden hour lighting, cinematic depth of field"
          className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#C0392B] resize-none"
        />
      </div>

      <div className="glass-card rounded-xl p-6">
        <label className="block text-xs text-gray-400 mb-3 font-medium">Genre</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.key}
              onClick={() => update({ genre: g.key })}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                session.genre === g.key
                  ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                  : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{g.icon}</span> {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <label className="block text-xs text-gray-400 mb-3 font-medium">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.key}
              onClick={() => update({ tone: t.key })}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                session.tone === t.key
                  ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                  : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-3 font-medium">Scene Duration</label>
          <div className="flex gap-2">
            {SCENE_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => update({ duration: d })}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  session.duration === d
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <label className="block text-xs text-gray-400 mb-3 font-medium">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => update({ platform: p })}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  session.platform === p
                    ? 'bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white'
                    : 'bg-dark-800 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <button
          onClick={handleExpand}
          disabled={expanding || !session.prompt.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C0392B]/20 to-[#F1C40F]/20 border border-[#C0392B]/30 text-white font-medium flex items-center justify-center gap-2 hover:border-[#C0392B]/50 transition-all disabled:opacity-50"
        >
          {expanding ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Expanding with Gemini 2.5 Flash...</>
          ) : (
            <><Sparkles className="w-4 h-4 text-[#F1C40F]" /> Expand to Cinematic Prompt</>
          )}
        </button>
        <p className="text-[10px] text-gray-600 text-center mt-1.5">Powered by Google Gemini 2.5 Flash via OpenRouter</p>

        {session.enhancedPrompt && (
          <div className="mt-4">
            {editing ? (
              <textarea
                value={session.enhancedPrompt}
                onChange={(e) => update({ enhancedPrompt: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-dark-800 border border-[#F1C40F]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#F1C40F] resize-none"
              />
            ) : (
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#C0392B]/5 to-[#F1C40F]/5 border border-[#F1C40F]/20">
                <p className="text-sm text-gray-300 leading-relaxed">{session.enhancedPrompt}</p>
              </div>
            )}
            <button
              onClick={() => setEditing(!editing)}
              className="mt-2 text-xs text-[#F1C40F] hover:text-[#F1C40F]/80"
            >
              {editing ? 'Done Editing' : 'Edit Prompt'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-[#F1C40F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#C0392B]/20"
      >
        <Lock className="w-4 h-4" /> Lock Scene & Continue
      </button>
    </div>
  );
}
