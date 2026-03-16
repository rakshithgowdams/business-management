import { useEffect, useState } from 'react';
import { Users, Plus, Shield, Eye, EyeOff, Search, CreditCard as Edit3, Trash2, ChevronDown, ChevronUp, Check, X, Loader2, UserPlus, Lock, Briefcase, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from '../../../lib/team/permissions';
import type { TeamMember } from '../../../lib/team/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

const TEAM_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-auth`;

async function teamAuthFetch(action: string, payload: Record<string, unknown>, token: string) {
  const res = await fetch(TEAM_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

interface MemberForm {
  full_name: string;
  email: string;
  password: string;
  role: 'employee' | 'management';
  department: string;
  job_title: string;
  permissions: string[];
  is_active: boolean;
}

const emptyForm: MemberForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  job_title: '',
  permissions: [],
  is_active: true,
};

export default function TeamAccessManager() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedPerms, setExpandedPerms] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (user) loadMembers();
  }, [user]);

  const loadMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false });
    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  };

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setShowPassword(false);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setForm({
      full_name: m.full_name,
      email: m.email,
      password: '',
      role: m.role,
      department: m.department,
      job_title: m.job_title,
      permissions: [...m.permissions],
      is_active: m.is_active,
    });
    setShowForm(true);
    setShowPassword(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingId && !form.password) {
      toast.error('Password is required for new members');
      return;
    }
    if (!editingId && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    const token = await getAccessToken();

    if (editingId) {
      const payload: Record<string, unknown> = {
        member_id: editingId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        department: form.department.trim(),
        job_title: form.job_title.trim(),
        permissions: form.permissions,
        is_active: form.is_active,
      };
      if (form.password) {
        payload.password = form.password;
      }
      const result = await teamAuthFetch('update-member', payload, token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Team member updated');
        setMembers(prev => prev.map(m => m.id === editingId ? {
          ...m,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          role: form.role,
          department: form.department.trim(),
          job_title: form.job_title.trim(),
          permissions: form.permissions,
          is_active: form.is_active,
        } : m));
        setShowForm(false);
      }
    } else {
      const result = await teamAuthFetch('create-member', {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim(),
        job_title: form.job_title.trim(),
        permissions: form.permissions,
      }, token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Team member created');
        if (result.data) {
          setMembers(prev => [{
            ...result.data,
            owner_id: user!.id,
            password_hash: '',
            avatar_url: '',
            last_login_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as TeamMember, ...prev]);
        }
        setShowForm(false);
      }
    }
    setSaving(false);
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    const token = await getAccessToken();
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    const result = await teamAuthFetch('update-member', {
      member_id: targetId,
      is_active: false,
    }, token);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Team member deactivated');
      setMembers(prev => prev.map(m => m.id === targetId ? { ...m, is_active: false } : m));
    }
  };

  const togglePermission = (key: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleGroupPermissions = (groupKey: string) => {
    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === groupKey).map(p => p.key);
    const allSelected = groupPerms.every(k => form.permissions.includes(k));
    if (allSelected) {
      setForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => !groupPerms.includes(p)) }));
    } else {
      setForm(prev => ({ ...prev, permissions: [...new Set([...prev.permissions, ...groupPerms])] }));
    }
  };

  const selectAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: ALL_PERMISSIONS.map(p => p.key) }));
  };

  const clearAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: [] }));
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.department.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter(m => m.is_active).length;
  const managementCount = members.filter(m => m.role === 'management' && m.is_active).length;
  const employeeCount = members.filter(m => m.role === 'employee' && m.is_active).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-gray-400">Active Members</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{managementCount}</p>
              <p className="text-xs text-gray-400">Management</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{employeeCount}</p>
              <p className="text-xs text-gray-400">Employees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 border border-brand-500/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-brand-400" /> : <UserPlus className="w-5 h-5 text-brand-400" />}
              {editingId ? 'Edit Team Member' : 'Create Team Member'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Password {editingId ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 pr-12"
                    placeholder={editingId ? 'Enter new password...' : 'Minimum 6 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Role *</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm({ ...form, role: 'employee' })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      form.role === 'employee'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Employee
                  </button>
                  <button
                    onClick={() => setForm({ ...form, role: 'management' })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      form.role === 'management'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Management
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="Engineering, Marketing, etc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={e => setForm({ ...form, job_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="Senior Developer, HR Manager, etc."
                />
              </div>
            </div>

            {editingId && (
              <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Account Status</p>
                  <p className="text-xs text-gray-500">Deactivated accounts cannot log in</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-emerald-500' : 'bg-dark-500'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-400" />
                  Permissions ({form.permissions.length}/{ALL_PERMISSIONS.length})
                </label>
                <div className="flex gap-2">
                  <button onClick={selectAllPermissions} className="text-xs text-brand-400 hover:text-brand-300">
                    Select All
                  </button>
                  <span className="text-gray-600">|</span>
                  <button onClick={clearAllPermissions} className="text-xs text-gray-400 hover:text-gray-300">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {PERMISSION_GROUPS.map(group => {
                  const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group.key);
                  const selectedCount = groupPerms.filter(p => form.permissions.includes(p.key)).length;
                  const allSelected = selectedCount === groupPerms.length;
                  const isExpanded = expandedPerms[group.key] !== false;

                  return (
                    <div key={group.key} className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
                      <button
                        onClick={() => setExpandedPerms(prev => ({ ...prev, [group.key]: !isExpanded }))}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <button
                          onClick={e => { e.stopPropagation(); toggleGroupPermissions(group.key); }}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            allSelected ? 'bg-brand-500 border-brand-500' : selectedCount > 0 ? 'border-brand-500/50 bg-brand-500/20' : 'border-white/20'
                          }`}
                        >
                          {allSelected && <Check className="w-3 h-3 text-white" />}
                          {!allSelected && selectedCount > 0 && <div className="w-2 h-0.5 bg-brand-400 rounded" />}
                        </button>
                        <span className="text-sm font-medium text-white flex-1 text-left">{group.label}</span>
                        <span className="text-xs text-gray-500">{selectedCount}/{groupPerms.length}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {groupPerms.map(perm => (
                            <button
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                                form.permissions.includes(perm.key)
                                  ? 'bg-brand-600/10 border border-brand-500/20'
                                  : 'hover:bg-white/[0.03] border border-transparent'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                form.permissions.includes(perm.key)
                                  ? 'bg-brand-500 border-brand-500'
                                  : 'border-white/20'
                              }`}>
                                {form.permissions.includes(perm.key) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">{perm.label}</p>
                                <p className="text-[11px] text-gray-500 truncate">{perm.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {editingId ? 'Save Changes' : 'Create Member'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'No members found' : 'No team members yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {search ? 'Try adjusting your search.' : 'Create your first team member to grant them access to the platform.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenCreate}
              className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => {
            const initials = m.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const isManagement = m.role === 'management';

            return (
              <div key={m.id} className="glass-card rounded-xl p-4 hover:border-white/10 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{m.full_name}</p>
                      {!m.is_active && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        isManagement
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {m.role}
                      </span>
                      {m.department && (
                        <span className="text-[10px] text-gray-500">{m.department}</span>
                      )}
                      {m.job_title && (
                        <span className="text-[10px] text-gray-600">- {m.job_title}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{m.permissions.length} permissions</span>
                      </div>
                      {m.last_login_at && (
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          Last login: {new Date(m.last_login_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {m.is_active && (
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Deactivate"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {m.permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                    {m.permissions.slice(0, 8).map(p => {
                      const permDef = ALL_PERMISSIONS.find(ap => ap.key === p);
                      return (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-dark-700 text-gray-400 border border-white/5">
                          {permDef?.label || p}
                        </span>
                      );
                    })}
                    {m.permissions.length > 8 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-600/10 text-brand-400">
                        +{m.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Team Member"
        message={`Are you sure you want to deactivate ${deleteTarget?.full_name}? They will no longer be able to log in.`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
