import { useEffect, useState } from 'react';
import { Loader2, Send, Clock, CheckCircle, XCircle, CalendarDays, Image, BarChart3 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface Stats {
  totalPosts: number;
  published: number;
  scheduled: number;
  drafts: number;
  failed: number;
}

export default function SMMDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalPosts: 0, published: 0, scheduled: 0, drafts: 0, failed: 0 });
  const [recentPosts, setRecentPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const all = posts || [];
    setRecentPosts(all);
    setStats({
      totalPosts: all.length,
      published: all.filter((p) => p.status === 'published').length,
      scheduled: all.filter((p) => p.status === 'scheduled').length,
      drafts: all.filter((p) => p.status === 'draft').length,
      failed: all.filter((p) => p.status === 'failed').length,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'text-blue-400' },
    { label: 'Published', value: stats.published, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-yellow-400' },
    { label: 'Drafts', value: stats.drafts, icon: Send, color: 'text-gray-400' },
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
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-2xl font-bold text-white">{card.value}</span>
            </div>
            <p className="text-xs text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-400" />
          Recent Posts
        </h3>

        {recentPosts.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No posts yet</p>
            <p className="text-xs text-gray-600 mt-1">Create your first post to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id as string} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-lg bg-dark-700 border border-white/5 flex items-center justify-center shrink-0">
                  <Image className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{(post.caption as string)?.slice(0, 60) || 'No caption'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-500">{post.platform as string}</span>
                    <span className="text-[11px] text-gray-600">{post.post_type as string}</span>
                    {post.scheduled_at && (
                      <span className="text-[11px] text-gray-500">
                        {new Date(post.scheduled_at as string).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  post.status === 'published' ? 'bg-green-500/20 text-green-400' :
                  post.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                  post.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {post.status as string}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
