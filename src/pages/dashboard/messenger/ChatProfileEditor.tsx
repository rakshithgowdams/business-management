import { useState } from 'react';
import { X, Camera, User, Save, Sparkles } from 'lucide-react';
import type { ChatProfile } from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';

interface Props {
  profile: ChatProfile | null;
  onSave: (updates: { bio?: string; profile_pic_url?: string; display_name?: string }) => void;
  onClose: () => void;
  onOpenAIChat?: () => void;
  loading: boolean;
}

export default function ChatProfileEditor({ profile, onSave, onClose, onOpenAIChat, loading }: Props) {
  const { member } = useTeamAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || member?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [profilePicUrl, setProfilePicUrl] = useState(profile?.profile_pic_url || '');

  const initials = (displayName || member?.full_name || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const isManagement = member?.role === 'management';

  const handleSave = () => {
    onSave({
      display_name: displayName.trim(),
      bio: bio.trim(),
      profile_pic_url: profilePicUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Chat Profile</h3>
              <p className="text-xs text-gray-500">Customize how others see you</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-col items-center">
            <div className="relative group">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-dark-700" />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-dark-700 ${
                  isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              isManagement
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
            }`}>
              {member?.role}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Profile Picture URL</label>
            <input
              type="url"
              value={profilePicUrl}
              onChange={e => setProfilePicUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
            />
            <p className="text-[10px] text-gray-600 mt-1 text-right">{bio.length}/200</p>
          </div>

          <div className="bg-dark-700 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-xs text-gray-300">{member?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Department</span>
              <span className="text-xs text-gray-300">{member?.department || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Job Title</span>
              <span className="text-xs text-gray-300">{member?.job_title || '-'}</span>
            </div>
          </div>
        </div>

        {onOpenAIChat && (
          <div className="px-5 pb-2">
            <button
              onClick={() => { onClose(); onOpenAIChat(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500/15 to-cyan-500/15 border border-brand-500/20 text-brand-300 text-sm font-medium rounded-xl hover:from-brand-500/25 hover:to-cyan-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI Chat History
            </button>
          </div>
        )}

        <div className="p-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
