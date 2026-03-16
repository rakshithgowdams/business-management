import { useState } from 'react';
import {
  X, Bell, BellOff, AlertTriangle, Info, Clock, Sparkles, Settings,
  Check, Trash2, CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { SEVERITY_COLORS, SEVERITY_ICONS_BG } from '../../../lib/taskmanagement/constants';
import type { TaskAlert } from '../../../lib/taskmanagement/types';

interface Props {
  alerts: TaskAlert[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function AlertCenter({ alerts, onClose, onRefresh }: Props) {
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const filtered = filter === 'unread' ? alerts.filter(a => !a.is_read) : alerts;

  const markAsRead = async (id: string) => {
    await supabase.from('task_alerts').update({ is_read: true }).eq('id', id);
    onRefresh();
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    if (unread.length === 0) return;
    for (const a of unread) {
      await supabase.from('task_alerts').update({ is_read: true }).eq('id', a.id);
    }
    toast.success('All alerts marked as read');
    onRefresh();
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('task_alerts').delete().eq('id', id);
    onRefresh();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline': return Clock;
      case 'overdue': return AlertTriangle;
      case 'ai_insight': return Sparkles;
      case 'performance': return Settings;
      default: return Info;
    }
  };

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-dark-800 border-l border-white/10 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold">Alerts</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Mark all as read">
              <CheckCheck className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-3 pb-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'unread' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BellOff className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No alerts to show</p>
              <p className="text-gray-600 text-xs mt-1">You are all caught up</p>
            </div>
          ) : (
            filtered.map(alert => {
              const Icon = getIcon(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    alert.is_read
                      ? 'bg-dark-700/30 border-white/5'
                      : 'bg-dark-700/60 border-white/10 shadow-lg shadow-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${SEVERITY_ICONS_BG[alert.severity] || 'bg-blue-500/20'}`}>
                      <Icon className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${alert.is_read ? 'text-gray-400' : 'text-white'}`}>
                          {alert.title}
                        </p>
                        <span className="text-[10px] text-gray-500 shrink-0">{formatTime(alert.created_at)}</span>
                      </div>
                      {alert.message && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[alert.severity] || ''}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-gray-600">{alert.alert_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-white/5">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-brand-400 hover:bg-brand-500/10 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
