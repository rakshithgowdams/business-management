import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Loader2, AlertTriangle, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { validatePasswordStrength, getPasswordStrength } from '../../lib/auth-security';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarSigned, setAvatarSigned] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const strength = getPasswordStrength(newPassword);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user!.id).maybeSingle();
    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url || '');
      if (data.avatar_url) {
        loadSignedUrl(data.avatar_url);
      }
    }
  };

  const loadSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setAvatarSigned(data.signedUrl);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, or GIF allowed');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user!.id}/avatar.${ext}`;

    if (avatarUrl) {
      await supabase.storage.from('avatars').remove([avatarUrl]);
    }

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user!.id);
    setAvatarUrl(filePath);
    await loadSignedUrl(filePath);
    setUploading(false);
    toast.success('Profile picture updated');
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user!.id);
    const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSavingName(false);
    if (error || metaError) { toast.error((error || metaError)!.message); return; }
    toast.success('Name updated');
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) { toast.error('Email cannot be empty'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Confirmation email sent to your new address');
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Enter your current password'); return; }
    const pwError = validatePasswordStrength(newPassword);
    if (pwError) { toast.error(pwError); return; }
    if (newPassword !== confirmNewPassword) { toast.error('New passwords do not match'); return; }

    setSavingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setSavingPassword(false);
      toast.error('Current password is incorrect');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    setDeleting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Session expired'); setDeleting(false); return; }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await res.json();
    setDeleting(false);

    if (!res.ok) {
      toast.error(body.error || 'Failed to delete account');
      return;
    }

    toast.success('Account deleted');
    await signOut();
    navigate('/');
  };

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Account</h1>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative group">
            {avatarSigned ? (
              <img src={avatarSigned} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-brand-500/30" />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-orange flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">Upload a photo</p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP, or GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">Personal Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
              <button onClick={handleSaveName} disabled={savingName} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 shrink-0">
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
              <button onClick={handleSaveEmail} disabled={savingEmail} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 shrink-0">
                {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">A confirmation link will be sent to your new email.</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 pr-12"
                placeholder="Min. 8 chars, upper, lower, number, symbol"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: i < strength.score ? strength.color : '#2A2A2A' }} />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" style={{ color: strength.color }} />
                  <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
              autoComplete="new-password"
            />
            {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>
          <button onClick={handleChangePassword} disabled={savingPassword} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-red-500/5 rounded-xl border border-red-500/20">
            <p className="text-sm text-red-300 font-medium">Type <span className="font-mono bg-red-500/10 px-1.5 py-0.5 rounded">DELETE</span> to confirm:</p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-red-500/30 rounded-xl text-white focus:outline-none focus:border-red-500 font-mono"
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteText !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Forever
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
