import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Pencil, Trash2, X, Search, ChevronDown, ChevronUp, Phone, Mail, UserPlus, Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface BusinessTeam {
  id: string;
  name: string;
  description: string;
  color: string;
  status: string;
  created_at: string;
  members?: BusinessTeamMember[];
}

interface BusinessTeamMember {
  id: string;
  business_team_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  employment_type: string;
  hourly_rate: number;
  avatar_color: string;
  notes: string;
  status: string;
  joined_date: string;
}

const TEAM_COLORS = [
  { label: 'Blue', value: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { label: 'Orange', value: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { label: 'Violet', value: 'violet', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  { label: 'Teal', value: 'teal', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
];

const ROLES = ['Developer', 'Designer', 'Project Manager', 'QA Engineer', 'DevOps', 'Data Analyst', 'Content Writer', 'Marketing Specialist', 'Sales Executive', 'Account Manager', 'HR Manager', 'Finance Analyst', 'Team Lead', 'Consultant', 'Other'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractor', 'Freelancer', 'Intern'];
const AVATAR_COLORS = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500', 'from-rose-500 to-pink-500', 'from-violet-500 to-purple-500', 'from-sky-500 to-blue-500'];

function getColorConfig(color: string) {
  return TEAM_COLORS.find(c => c.value === color) || TEAM_COLORS[0];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TeamsList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<BusinessTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<BusinessTeam | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: 'blue', status: 'active' });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<BusinessTeamMember | null>(null);
  const [activeMemberTeamId, setActiveMemberTeamId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '', email: '', phone: '', role: ROLES[0], employment_type: 'Full-time',
    hourly_rate: '', avatar_color: AVATAR_COLORS[0], notes: '', status: 'active', joined_date: new Date().toISOString().split('T')[0],
  });

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data: teamsData } = await supabase
      .from('business_teams')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    const { data: membersData } = await supabase
      .from('business_team_members')
      .select('*')
      .eq('owner_id', user.id)
      .order('joined_date', { ascending: false });

    const teamsWithMembers = (teamsData || []).map(team => ({
      ...team,
      members: (membersData || []).filter(m => m.business_team_id === team.id),
    }));

    setTeams(teamsWithMembers);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleExpand = (id: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openTeamModal = (team?: BusinessTeam) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({ name: team.name, description: team.description || '', color: team.color || 'blue', status: team.status });
    } else {
      setEditingTeam(null);
      setTeamForm({ name: '', description: '', color: 'blue', status: 'active' });
    }
    setShowTeamModal(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) { toast.error('Team name is required'); return; }
    const payload = { name: teamForm.name.trim(), description: teamForm.description.trim(), color: teamForm.color, status: teamForm.status };

    if (editingTeam) {
      const { error } = await supabase.from('business_teams').update(payload).eq('id', editingTeam.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Team updated');
    } else {
      const { error } = await supabase.from('business_teams').insert({ ...payload, owner_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Team created');
    }
    setShowTeamModal(false);
    loadAll();
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    await supabase.from('business_teams').delete().eq('id', deleteTeamId);
    setDeleteTeamId(null);
    toast.success('Team deleted');
    loadAll();
  };

  const openMemberModal = (teamId: string, member?: BusinessTeamMember) => {
    setActiveMemberTeamId(teamId);
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name, email: member.email || '', phone: member.phone || '',
        role: member.role || ROLES[0], employment_type: member.employment_type || 'Full-time',
        hourly_rate: String(member.hourly_rate || ''), avatar_color: member.avatar_color || AVATAR_COLORS[0],
        notes: member.notes || '', status: member.status || 'active', joined_date: member.joined_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: '', email: '', phone: '', role: ROLES[0], employment_type: 'Full-time',
        hourly_rate: '', avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        notes: '', status: 'active', joined_date: new Date().toISOString().split('T')[0],
      });
    }
    setShowMemberModal(true);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) { toast.error('Name is required'); return; }
    const payload = {
      name: memberForm.name.trim(), email: memberForm.email.trim(), phone: memberForm.phone.trim(),
      role: memberForm.role, employment_type: memberForm.employment_type,
      hourly_rate: Number(memberForm.hourly_rate) || 0,
      avatar_color: memberForm.avatar_color, notes: memberForm.notes.trim(),
      status: memberForm.status, joined_date: memberForm.joined_date,
    };

    if (editingMember) {
      const { error } = await supabase.from('business_team_members').update(payload).eq('id', editingMember.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Member updated');
    } else {
      const { error } = await supabase.from('business_team_members').insert({
        ...payload, business_team_id: activeMemberTeamId, owner_id: user!.id,
      });
      if (error) { toast.error(error.message); return; }
      toast.success('Member added');
    }
    setShowMemberModal(false);
    setEditingMember(null);
    loadAll();
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberId) return;
    await supabase.from('business_team_members').delete().eq('id', deleteMemberId);
    setDeleteMemberId(null);
    toast.success('Member removed');
    loadAll();
  };

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const totalTeams = teams.length;
  const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0), 0);
  const activeTeams = teams.filter(t => t.status === 'active').length;
  const avgSize = totalTeams ? (totalMembers / totalTeams).toFixed(1) : '0';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Create and manage your business teams</p>
        </div>
        <button onClick={() => openTeamModal()} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: totalTeams, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active Teams', value: activeTeams, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Avg Team Size', value: avgSize, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No teams yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first team to get started</p>
          <button onClick={() => openTeamModal()} className="mt-4 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Team
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(team => {
            const colorConfig = getColorConfig(team.color);
            const isExpanded = expandedTeams.has(team.id);
            const members = team.members || [];
            const activeMembers = members.filter(m => m.status === 'active').length;

            return (
              <div key={team.id} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl ${colorConfig.bg} border ${colorConfig.border} flex items-center justify-center shrink-0`}>
                        <Users className={`w-6 h-6 ${colorConfig.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white text-lg">{team.name}</h3>
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}>
                            {team.status}
                          </span>
                        </div>
                        {team.description && <p className="text-sm text-gray-400 truncate mt-0.5">{team.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{members.length} member{members.length !== 1 ? 's' : ''}</span>
                          {activeMembers > 0 && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle className="w-3.5 h-3.5" />{activeMembers} active</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openMemberModal(team.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5 transition-colors">
                        <UserPlus className="w-3.5 h-3.5" /> Add Member
                      </button>
                      <button onClick={() => openTeamModal(team)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTeamId(team.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleExpand(team.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors ml-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4">
                    {members.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No members yet. Add someone to this team.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map(member => (
                          <div key={member.id} className="bg-dark-700/50 rounded-xl p-3.5 group relative">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.avatar_color || AVATAR_COLORS[0]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                {getInitials(member.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm truncate">{member.name}</p>
                                <p className="text-xs text-gray-400 truncate">{member.role}</p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-dark-600 text-gray-400">{member.employment_type}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${member.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                                    {member.status}
                                  </span>
                                </div>
                                {member.email && (
                                  <a href={`mailto:${member.email}`} className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors truncate">
                                    <Mail className="w-3 h-3 shrink-0" />{member.email}
                                  </a>
                                )}
                                {member.phone && (
                                  <a href={`tel:${member.phone}`} className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
                                    <Phone className="w-3 h-3 shrink-0" />{member.phone}
                                  </a>
                                )}
                                {member.hourly_rate > 0 && (
                                  <p className="text-[11px] text-orange-400 mt-0.5">₹{member.hourly_rate.toLocaleString()}/hr</p>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openMemberModal(team.id, member)} className="p-1 rounded-lg bg-dark-600 hover:bg-dark-500 text-gray-400 hover:text-white">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => setDeleteMemberId(member.id)} className="p-1 rounded-lg bg-dark-600 hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingTeam ? 'Edit Team' : 'Create Team'}</h2>
              <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Name *</label>
                <input type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Sales Team, Development Team" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={teamForm.description} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="What does this team do?" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Team Color</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map(c => (
                    <button key={c.value} type="button" onClick={() => setTeamForm({ ...teamForm, color: c.value })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${c.bg} ${teamForm.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                      title={c.label}>
                      <div className={`w-3 h-3 rounded-full mx-auto ${c.text} opacity-80`} style={{ background: 'currentColor' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={teamForm.status} onChange={e => setTeamForm({ ...teamForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold">
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => { setShowMemberModal(false); setEditingMember(null); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Avatar Color</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setMemberForm({ ...memberForm, avatar_color: color })}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} border-2 transition-all ${memberForm.avatar_color === color ? 'border-white scale-110' : 'border-transparent'}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input type="text" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input type="tel" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employment</label>
                  <select value={memberForm.employment_type} onChange={e => setMemberForm({ ...memberForm, employment_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hourly Rate (INR)</label>
                  <input type="number" value={memberForm.hourly_rate} onChange={e => setMemberForm({ ...memberForm, hourly_rate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Joined Date</label>
                  <input type="date" value={memberForm.joined_date} onChange={e => setMemberForm({ ...memberForm, joined_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={memberForm.status} onChange={e => setMemberForm({ ...memberForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Any notes about this member..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowMemberModal(false); setEditingMember(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold">
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTeamId} title="Delete Team" message="This will delete the team and all its members. Are you sure?" onConfirm={handleDeleteTeam} onCancel={() => setDeleteTeamId(null)} />
      <ConfirmDialog open={!!deleteMemberId} title="Remove Member" message="Are you sure you want to remove this member from the team?" onConfirm={handleDeleteMember} onCancel={() => setDeleteMemberId(null)} />
    </div>
  );
}
