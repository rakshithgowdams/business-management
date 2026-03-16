import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, Eye, Heart, BarChart3 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { hasApiKeySet } from '../../../lib/apiKeys';
import { getInstagramAccountId, getInstagramInsights, getRecentMedia } from '../../../lib/socialPublisher';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PostMetric {
  id: string;
  caption: string;
  media_type: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

export default function SMMAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [recentPosts, setRecentPosts] = useState<PostMetric[]>([]);
  const [localStats, setLocalStats] = useState({ total: 0, published: 0, avgEngagement: 0 });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user!.id);

    const all = posts || [];
    const published = all.filter((p) => p.status === 'published');
    setLocalStats({
      total: all.length,
      published: published.length,
      avgEngagement: 0,
    });

    if (hasApiKeySet('meta')) {
      try {
        const igId = await getInstagramAccountId();
        setIgConnected(true);
        const mediaData = await getRecentMedia(igId, 20);
        if (mediaData.data && Array.isArray(mediaData.data)) {
          setRecentPosts(mediaData.data as PostMetric[]);
        }
      } catch {
        setIgConnected(false);
      }
    }

    setLoading(false);
  };

  const engagementData = recentPosts.map((p, i) => ({
    name: `Post ${recentPosts.length - i}`,
    likes: p.like_count || 0,
    comments: p.comments_count || 0,
  })).reverse();

  const statCards = [
    { label: 'Total Posts Created', value: localStats.total, icon: BarChart3, color: 'text-blue-400' },
    { label: 'Published', value: localStats.published, icon: TrendingUp, color: 'text-green-400' },
    { label: 'IG Connected', value: igConnected ? 'Yes' : 'No', icon: Users, color: igConnected ? 'text-green-400' : 'text-gray-500' },
    { label: 'IG Posts Fetched', value: recentPosts.length, icon: Eye, color: 'text-[#FF6B00]' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-5">
            <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {!igConnected && (
        <div className="glass-card rounded-xl p-6 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Connect your Instagram account to see live analytics</p>
          <p className="text-xs text-gray-600 mt-1">Add your Meta API key in Settings &gt; Integrations</p>
        </div>
      )}

      {engagementData.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Engagement Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#999' }}
                />
                <Area type="monotone" dataKey="likes" stroke="#FF6B00" fill="url(#colorLikes)" />
                <Area type="monotone" dataKey="comments" stroke="#3B82F6" fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {recentPosts.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {[...recentPosts]
              .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
              .slice(0, 5)
              .map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{post.caption?.slice(0, 80) || 'No caption'}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {new Date(post.timestamp).toLocaleDateString()} - {post.media_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{post.like_count || 0}</p>
                      <p className="text-[10px] text-gray-500">Likes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{post.comments_count || 0}</p>
                      <p className="text-[10px] text-gray-500">Comments</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
