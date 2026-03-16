import { useState } from 'react';
import { Loader2, Sparkles, Send, Instagram, Facebook, Image, Film, Layers, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callAI, hasApiKey as hasAIKey } from '../../../lib/ai/api';
import { hasApiKeySet } from '../../../lib/apiKeys';
import { publishImage, publishReel, publishCarousel } from '../../../lib/socialPublisher';

type Platform = 'instagram' | 'facebook';
type PostType = 'image' | 'reel' | 'carousel';

export default function CreatePost() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [postType, setPostType] = useState<PostType>('image');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAICaption = async () => {
    const keyAvailable = await hasAIKey();
    if (!keyAvailable) {
      toast.error('Add your AI API key in Settings to generate captions');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate a professional, engaging ${platform} caption for a ${postType} post.
${caption ? `Current draft: "${caption}"` : 'No draft provided.'}
${hashtags ? `Hashtags context: ${hashtags}` : ''}

Requirements:
- Attention-grabbing opening line
- Engaging body with relevant emojis
- Clear call-to-action
- 5-10 relevant hashtags at the end
- Suitable for Indian business audience
- Keep it under 2200 characters

Return ONLY the caption text, no JSON or markdown.`;

      const res = await callAI(prompt, true, 'content_creation');
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        const text = typeof res.data === 'string' ? res.data : Object.values(res.data).join('\n');
        setCaption(text);
        toast.success('Caption generated');
      }
    } catch {
      toast.error('Caption generation failed');
    }
    setGenerating(false);
  };

  const handleAIHashtags = async () => {
    const keyAvailable = await hasAIKey();
    if (!keyAvailable) {
      toast.error('Add your AI API key in Settings');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate 20 relevant Instagram hashtags for this post:
Caption: "${caption}"
Platform: ${platform}

Requirements:
- Mix of popular (1M+), medium (100K-1M), and niche (<100K) hashtags
- Relevant to Indian business/marketing
- No # symbol, just the words separated by spaces

Return ONLY the hashtags, space-separated, no JSON.`;

      const res = await callAI(prompt, true, 'content_creation');
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        const text = typeof res.data === 'string' ? res.data : Object.values(res.data).join(' ');
        setHashtags(text);
        toast.success('Hashtags generated');
      }
    } catch {
      toast.error('Hashtag generation failed');
    }
    setGenerating(false);
  };

  const handleSaveAsDraft = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('scheduled_posts').insert({
      user_id: user.id,
      platform,
      post_type: postType,
      caption,
      media_urls: mediaUrls.filter(Boolean),
      hashtags: hashtags.split(/[\s,#]+/).filter(Boolean),
      scheduled_at: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(scheduledAt ? 'Post scheduled' : 'Saved as draft');
      setCaption('');
      setHashtags('');
      setMediaUrls(['']);
      setScheduledAt('');
    }
  };

  const handlePublishNow = async () => {
    if (!hasApiKeySet('meta')) {
      toast.error('Add your Meta API key in Settings > Integrations');
      return;
    }
    const urls = mediaUrls.filter(Boolean);
    if (urls.length === 0) {
      toast.error('Add at least one media URL');
      return;
    }

    setPublishing(true);
    const fullCaption = caption + (hashtags ? '\n\n' + hashtags.split(/[\s,]+/).filter(Boolean).map((h) => `#${h}`).join(' ') : '');

    let result;
    if (postType === 'reel') {
      result = await publishReel(urls[0], fullCaption);
    } else if (postType === 'carousel' && urls.length > 1) {
      result = await publishCarousel(urls, fullCaption);
    } else {
      result = await publishImage(urls[0], fullCaption);
    }

    if (result.success) {
      toast.success('Published to Instagram');
      if (user) {
        await supabase.from('scheduled_posts').insert({
          user_id: user.id,
          platform,
          post_type: postType,
          caption: fullCaption,
          media_urls: urls,
          hashtags: hashtags.split(/[\s,#]+/).filter(Boolean),
          status: 'published',
          published_at: new Date().toISOString(),
          ig_post_id: result.postId,
        });
      }
    } else {
      toast.error(result.error || 'Publishing failed');
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Create & Publish</h3>

        <div className="space-y-5">
          <div className="flex gap-3">
            <button
              onClick={() => setPlatform('instagram')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                platform === 'instagram' ? 'bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 text-pink-400' : 'bg-dark-800 border border-white/10 text-gray-400'
              }`}
            >
              <Instagram className="w-4 h-4" /> Instagram
            </button>
            <button
              onClick={() => setPlatform('facebook')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                platform === 'facebook' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-dark-800 border border-white/10 text-gray-400'
              }`}
            >
              <Facebook className="w-4 h-4" /> Facebook
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Post Type</label>
            <div className="flex gap-2">
              {([
                { key: 'image' as const, label: 'Image', icon: Image },
                { key: 'reel' as const, label: 'Reel', icon: Film },
                { key: 'carousel' as const, label: 'Carousel', icon: Layers },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPostType(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    postType === t.key
                      ? 'gradient-orange text-white'
                      : 'bg-dark-800 border border-white/10 text-gray-400'
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">Caption</label>
              <button
                onClick={handleAICaption}
                disabled={generating}
                className="flex items-center gap-1 text-[11px] text-[#FF6B00] hover:text-[#FF9A00] disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              placeholder="Write your caption here..."
              className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
            />
            <p className="text-[11px] text-gray-600 mt-1">{caption.length}/2200</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Hashtags</label>
              <button
                onClick={handleAIHashtags}
                disabled={generating}
                className="flex items-center gap-1 text-[11px] text-[#FF6B00] hover:text-[#FF9A00] disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Suggest
              </button>
            </div>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="marketing business india..."
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Media URLs</label>
            {mediaUrls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const updated = [...mediaUrls];
                    updated[i] = e.target.value;
                    setMediaUrls(updated);
                  }}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                />
                {mediaUrls.length > 1 && (
                  <button
                    onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                    className="px-3 text-gray-500 hover:text-red-400"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
            {postType === 'carousel' && mediaUrls.length < 10 && (
              <button
                onClick={() => setMediaUrls([...mediaUrls, ''])}
                className="text-xs text-[#FF6B00] hover:text-[#FF9A00]"
              >
                + Add another image
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveAsDraft}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {scheduledAt ? 'Schedule Post' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublishNow}
              disabled={publishing}
              className="flex-1 py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
