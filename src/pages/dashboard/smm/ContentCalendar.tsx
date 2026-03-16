import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Image, Film, Layers } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

type ViewMode = 'month' | 'week' | 'list';

interface Post {
  id: string;
  caption: string;
  platform: string;
  post_type: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentCalendar() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (user) loadPosts();
  }, [user, currentDate]);

  const loadPosts = async () => {
    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user!.id)
      .or(`scheduled_at.gte.${start.toISOString()},published_at.gte.${start.toISOString()},created_at.gte.${start.toISOString()}`)
      .order('scheduled_at', { ascending: true });

    setPosts(data || []);
    setLoading(false);
  };

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const getPostDate = (post: Post) => {
    const dateStr = post.scheduled_at || post.published_at || post.created_at;
    return new Date(dateStr);
  };

  const getPostsForDay = (day: number) => {
    return posts.filter((p) => {
      const d = getPostDate(p);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth();
    });
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const TypeIcon = (type: string) => {
    if (type === 'reel') return Film;
    if (type === 'carousel') return Layers;
    return Image;
  };

  const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg border border-white/10 hover:bg-white/5">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg border border-white/10 hover:bg-white/5">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex gap-1 p-0.5 bg-dark-800 rounded-lg border border-white/5">
          {(['month', 'week', 'list'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                viewMode === v ? 'gradient-orange text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((d) => (
              <div key={d} className="px-2 py-3 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-r border-b border-white/5" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = getPostsForDay(day);
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              return (
                <div key={day} className={`h-24 border-r border-b border-white/5 p-1.5 ${isToday ? 'bg-[#FF6B00]/5' : ''}`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-[#FF6B00]' : 'text-gray-500'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayPosts.slice(0, 2).map((p) => {
                      const Icon = TypeIcon(p.post_type);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] truncate ${
                            p.status === 'published' ? 'bg-green-500/20 text-green-400' :
                            p.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          <Icon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{p.caption.slice(0, 20)}</span>
                        </div>
                      );
                    })}
                    {dayPosts.length > 2 && (
                      <p className="text-[9px] text-gray-600 pl-1">+{dayPosts.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="glass-card rounded-xl p-4">
          <div className="grid grid-cols-7 gap-3">
            {getWeekDays().map((day) => {
              const dayPosts = posts.filter((p) => {
                const d = getPostDate(p);
                return d.toDateString() === day.toDateString();
              });
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={day.toISOString()} className={`min-h-[200px] rounded-xl p-3 border ${isToday ? 'border-[#FF6B00]/30 bg-[#FF6B00]/5' : 'border-white/5 bg-dark-800'}`}>
                  <p className={`text-xs font-medium mb-2 ${isToday ? 'text-[#FF6B00]' : 'text-gray-400'}`}>
                    {DAYS[day.getDay()]} {day.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayPosts.map((p) => (
                      <div key={p.id} className="p-2 rounded-lg bg-dark-700 border border-white/5">
                        <p className="text-[10px] text-gray-300 truncate">{p.caption.slice(0, 30)}</p>
                        <span className={`text-[9px] font-bold uppercase ${
                          p.status === 'published' ? 'text-green-400' : 'text-yellow-400'
                        }`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="glass-card rounded-xl p-4">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No posts this month</p>
          ) : (
            <div className="space-y-2">
              {posts.map((p) => {
                const Icon = TypeIcon(p.post_type);
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 bg-dark-800 rounded-xl border border-white/5">
                    <Icon className="w-5 h-5 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{p.caption.slice(0, 60)}</p>
                      <p className="text-[11px] text-gray-500">{p.platform} - {getPostDate(p).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{p.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
