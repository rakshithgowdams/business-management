import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Phone, Mail, Users, Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { TEAM_ROLES, TOOL_SUGGESTIONS, BILLING_TYPES, EMPLOYMENT_TYPES, EMPLOYMENT_COLORS } from '../../../../lib/projects/constants';
import type { ProjectTeamEntry, ProjectTool, ProjectAgreement } from '../../../../lib/projects/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import AgreementsSection from './AgreementsSection';

interface BusinessTeam {
  id: string;
  name: string;
  color: string;
  description: string;
  status: string;
  member_count?: number;
}

const TEAM_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  teal: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
};

interface Props {
  projectId: string;
  team: ProjectTeamEntry[];
  tools: ProjectTool[];
  agreements: ProjectAgreement[];
  onRefresh: () => void;
}

export default function TeamToolsTab({ projectId, team, tools, agreements, onRefresh }: Props) {
  const { user } = useAuth();

  const [availableTeams, setAvailableTeams] = useState<BusinessTeam[]>([]);
  const [assignedTeamIds, setAssignedTeamIds] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!user) return;
    const { data: allTeams } = await supabase
      .from('business_teams')
      .select('id, name, color, description, status')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('name');

    const { data: memberCounts } = await supabase
      .from('business_team_members')
      .select('business_team_id')
      .eq('owner_id', user.id);

    const countMap: Record<string, number> = {};
    (memberCounts || []).forEach(m => {
      countMap[m.business_team_id] = (countMap[m.business_team_id] || 0) + 1;
    });

    const { data: assigned } = await supabase
      .from('project_business_teams')
      .select('business_team_id')
      .eq('project_id', projectId);

    setAvailableTeams((allTeams || []).map(t => ({ ...t, member_count: countMap[t.id] || 0 })));
    setAssignedTeamIds(new Set((assigned || []).map(a => a.business_team_id)));
  }, [user, projectId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const handleToggleAssign = async (teamId: string) => {
    if (assignedTeamIds.has(teamId)) {
      await supabase.from('project_business_teams').delete().eq('project_id', projectId).eq('business_team_id', teamId);
      toast.success('Team unassigned from project');
    } else {
      await supabase.from('project_business_teams').insert({ project_id: projectId, business_team_id: teamId, owner_id: user!.id });
      toast.success('Team assigned to project');
    }
    loadTeams();
  };

  const assignedTeams = availableTeams.filter(t => assignedTeamIds.has(t.id));

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ProjectTeamEntry | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({
    member_name: '',
    phone: '',
    email: '',
    employment_type: EMPLOYMENT_TYPES[0] as string,
    role: TEAM_ROLES[0] as string,
    hours_worked: '',
    rate_per_hour: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [showToolForm, setShowToolForm] = useState(false);
  const [editingTool, setEditingTool] = useState<ProjectTool | null>(null);
  const [deleteToolId, setDeleteToolId] = useState<string | null>(null);
  const [toolForm, setToolForm] = useState({
    tool_name: '', purpose: '', cost_per_month: '', months_used: '1', billing_type: BILLING_TYPES[0] as string,
  });

  const teamTotalHours = team.reduce((s, t) => s + t.hours_worked, 0);
  const teamTotalCost = team.reduce((s, t) => s + t.total_cost, 0);
  const toolsTotalCost = tools.reduce((s, t) => s + t.total_cost, 0);

  const resetTeamForm = () => {
    setShowTeamForm(false);
    setEditingTeam(null);
    setTeamForm({
      member_name: '', phone: '', email: '', employment_type: EMPLOYMENT_TYPES[0] as string,
      role: TEAM_ROLES[0] as string, hours_worked: '', rate_per_hour: '', date: new Date().toISOString().split('T')[0],
    });
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.member_name.trim()) { toast.error('Name is required'); return; }
    if (!teamForm.hours_worked || Number(teamForm.hours_worked) <= 0) { toast.error('Enter valid hours'); return; }
    if (!teamForm.rate_per_hour || Number(teamForm.rate_per_hour) <= 0) { toast.error('Enter valid rate'); return; }

    const hours = Number(teamForm.hours_worked);
    const rate = Number(teamForm.rate_per_hour);
    const payload = {
      member_name: teamForm.member_name.trim(),
      phone: teamForm.phone.trim(),
      email: teamForm.email.trim(),
      employment_type: teamForm.employment_type,
      role: teamForm.role,
      hours_worked: hours,
      rate_per_hour: rate,
      total_cost: hours * rate,
      date: teamForm.date,
    };

    if (editingTeam) {
      const { error } = await supabase.from('project_team').update(payload).eq('id', editingTeam.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Updated');
    } else {
      const { error } = await supabase.from('project_team').insert({ ...payload, project_id: projectId, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Team entry added');
    }
    resetTeamForm();
    onRefresh();
  };

  const handleEditTeam = (t: ProjectTeamEntry) => {
    setEditingTeam(t);
    setTeamForm({
      member_name: t.member_name,
      phone: t.phone || '',
      email: t.email || '',
      employment_type: t.employment_type || 'Full-time',
      role: t.role,
      hours_worked: String(t.hours_worked),
      rate_per_hour: String(t.rate_per_hour),
      date: t.date,
    });
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    await supabase.from('project_team').delete().eq('id', deleteTeamId);
    setDeleteTeamId(null);
    toast.success('Deleted');
    onRefresh();
  };

  const resetToolForm = () => {
    setShowToolForm(false);
    setEditingTool(null);
    setToolForm({ tool_name: '', purpose: '', cost_per_month: '', months_used: '1', billing_type: BILLING_TYPES[0] as string });
  };

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolForm.tool_name.trim()) { toast.error('Tool name is required'); return; }
    if (!toolForm.cost_per_month || Number(toolForm.cost_per_month) <= 0) { toast.error('Enter valid cost'); return; }

    const cost = Number(toolForm.cost_per_month);
    const months = Number(toolForm.months_used) || 1;
    const payload = {
      tool_name: toolForm.tool_name.trim(),
      purpose: toolForm.purpose.trim(),
      cost_per_month: cost,
      months_used: months,
      total_cost: cost * months,
      billing_type: toolForm.billing_type,
    };

    if (editingTool) {
      const { error } = await supabase.from('project_tools').update(payload).eq('id', editingTool.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Updated');
    } else {
      const { error } = await supabase.from('project_tools').insert({ ...payload, project_id: projectId, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Tool added');
    }
    resetToolForm();
    onRefresh();
  };

  const handleEditTool = (t: ProjectTool) => {
    setEditingTool(t);
    setToolForm({ tool_name: t.tool_name, purpose: t.purpose, cost_per_month: String(t.cost_per_month), months_used: String(t.months_used), billing_type: t.billing_type });
    setShowToolForm(true);
  };

  const handleDeleteTool = async () => {
    if (!deleteToolId) return;
    await supabase.from('project_tools').delete().eq('id', deleteToolId);
    setDeleteToolId(null);
    toast.success('Deleted');
    onRefresh();
  };

  const computedTeamCost = Number(teamForm.hours_worked || 0) * Number(teamForm.rate_per_hour || 0);
  const computedToolCost = Number(toolForm.cost_per_month || 0) * Number(toolForm.months_used || 1);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Assigned Teams</h3>
            <p className="text-xs text-gray-500 mt-0.5">Link your business teams to this project</p>
          </div>
          <button onClick={() => setShowAssignModal(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Assign Team
          </button>
        </div>
        {assignedTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {assignedTeams.map(t => {
              const c = TEAM_COLOR_MAP[t.color] || TEAM_COLOR_MAP.blue;
              return (
                <div key={t.id} className={`glass-card rounded-xl p-4 border ${c.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                        <Users className={`w-4.5 h-4.5 ${c.text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.member_count} member{t.member_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggleAssign(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors shrink-0" title="Unassign">
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 text-center text-gray-500 text-sm mb-3">
            No teams assigned yet. Click "Assign Team" to link a team.
          </div>
        )}
      </div>

      <div className="border-t border-white/5" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <button onClick={() => setShowTeamForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>

        {team.length > 0 && (
          <div className="space-y-3 mb-3">
            {team.map((t) => (
              <div key={t.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{t.member_name}</span>
                      <span className="px-2 py-0.5 text-xs rounded-md bg-dark-600 text-gray-300">{t.role}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-md border ${EMPLOYMENT_COLORS[t.employment_type] || EMPLOYMENT_COLORS['Full-time']}`}>
                        {t.employment_type || 'Full-time'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
                      {t.phone && (
                        <a href={`tel:${t.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                          <Phone className="w-3.5 h-3.5" /> {t.phone}
                        </a>
                      )}
                      {t.email && (
                        <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                          <Mail className="w-3.5 h-3.5" /> {t.email}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-500">{t.hours_worked}h @ {formatINR(t.rate_per_hour)}/hr</span>
                      <span className="font-medium text-orange-400">{formatINR(t.total_cost)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEditTeam(t)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTeamId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {team.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm mb-3">No team members added yet.</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Hours</p>
            <p className="text-lg font-bold">{teamTotalHours.toFixed(1)}h</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Team Cost</p>
            <p className="text-lg font-bold text-orange-400">{formatINR(teamTotalCost)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tools & Software</h3>
          <button onClick={() => setShowToolForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Tool
          </button>
        </div>

        {tools.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden mb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Tool</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly</th>
                    <th className="px-4 py-3 font-medium text-right">Months</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">{t.tool_name}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{t.purpose}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatINR(t.cost_per_month)}</td>
                      <td className="px-4 py-3 text-right">{t.months_used}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-400">{formatINR(t.total_cost)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEditTool(t)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteToolId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tools.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm mb-3">No tools added yet.</div>
        )}

        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Tool Cost</p>
          <p className="text-lg font-bold text-blue-400">{formatINR(toolsTotalCost)}</p>
        </div>
      </div>

      <div className="border-t border-white/5" />

      <AgreementsSection projectId={projectId} agreements={agreements} team={team} onRefresh={onRefresh} />

      {showTeamForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingTeam ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button onClick={resetTeamForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Member Name *</label>
                <input type="text" value={teamForm.member_name} onChange={(e) => setTeamForm({ ...teamForm, member_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                  <input type="tel" value={teamForm.phone} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="john@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employment Type</label>
                  <select value={teamForm.employment_type} onChange={(e) => setTeamForm({ ...teamForm, employment_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {TEAM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hours Worked *</label>
                  <input type="number" step="0.5" value={teamForm.hours_worked} onChange={(e) => setTeamForm({ ...teamForm, hours_worked: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rate/Hour (INR) *</label>
                  <input type="number" value={teamForm.rate_per_hour} onChange={(e) => setTeamForm({ ...teamForm, rate_per_hour: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Cost: <span className="text-orange-400 font-semibold">{formatINR(computedTeamCost)}</span></p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input type="date" value={teamForm.date} onChange={(e) => setTeamForm({ ...teamForm, date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editingTeam ? 'Update Member' : 'Add Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showToolForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingTool ? 'Edit Tool' : 'Add Tool'}</h2>
              <button onClick={resetToolForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleToolSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tool Name *</label>
                <input type="text" list="tool-suggestions" value={toolForm.tool_name} onChange={(e) => setToolForm({ ...toolForm, tool_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                <datalist id="tool-suggestions">
                  {TOOL_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Purpose</label>
                <input type="text" value={toolForm.purpose} onChange={(e) => setToolForm({ ...toolForm, purpose: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Workflow automation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cost/Month (INR) *</label>
                  <input type="number" value={toolForm.cost_per_month} onChange={(e) => setToolForm({ ...toolForm, cost_per_month: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Months Used</label>
                  <input type="number" value={toolForm.months_used} onChange={(e) => setToolForm({ ...toolForm, months_used: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Cost: <span className="text-blue-400 font-semibold">{formatINR(computedToolCost)}</span></p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Billing Type</label>
                <select value={toolForm.billing_type} onChange={(e) => setToolForm({ ...toolForm, billing_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {BILLING_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editingTool ? 'Update' : 'Add Tool'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTeamId} title="Delete Team Entry" message="Are you sure? This will also unlink any agreements assigned to this member." onConfirm={handleDeleteTeam} onCancel={() => setDeleteTeamId(null)} />
      <ConfirmDialog open={!!deleteToolId} title="Delete Tool" message="Are you sure?" onConfirm={handleDeleteTool} onCancel={() => setDeleteToolId(null)} />

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assign Teams</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {availableTeams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active teams found. Create teams in the Teams section first.</p>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {availableTeams.map(t => {
                  const c = TEAM_COLOR_MAP[t.color] || TEAM_COLOR_MAP.blue;
                  const isAssigned = assignedTeamIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleAssign(t.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        isAssigned ? `${c.bg} ${c.border}` : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
                        <Users className={`w-4 h-4 ${c.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.member_count} member{t.member_count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${isAssigned ? `${c.text} ${c.bg}` : 'text-gray-500 bg-dark-700'}`}>
                        {isAssigned ? 'Assigned' : 'Assign'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setShowAssignModal(false)} className="mt-4 w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
