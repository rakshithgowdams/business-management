import { useEffect, useState } from 'react';
import { Loader2, Workflow, Play, Pause, Trash2, Plus, Zap, Clock, Calendar, TrendingUp, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  workflow_type: string;
  trigger_config: Record<string, unknown>;
  action_config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
}

const PRESET_WORKFLOWS = [
  {
    name: 'Auto-Post Best Time',
    description: 'Automatically schedule posts at optimal engagement times based on your audience analytics',
    icon: Clock,
    trigger: { type: 'schedule', cron: '0 9,12,18 * * *' },
    action: { type: 'schedule_post', optimize_time: true },
  },
  {
    name: 'Weekly Recap Generator',
    description: 'Generate a weekly recap carousel post every Monday with top performing content',
    icon: Calendar,
    trigger: { type: 'schedule', cron: '0 10 * * 1' },
    action: { type: 'generate_recap', format: 'carousel' },
  },
  {
    name: 'Engagement Booster',
    description: 'Auto-create story polls and questions when engagement drops below average',
    icon: TrendingUp,
    trigger: { type: 'metric', condition: 'engagement_below_average' },
    action: { type: 'create_engagement_post', content_type: 'story_poll' },
  },
  {
    name: 'Content Repurposer',
    description: 'Automatically repurpose high-performing posts into different formats (post to reel, carousel to story)',
    icon: Zap,
    trigger: { type: 'metric', condition: 'high_engagement' },
    action: { type: 'repurpose_content' },
  },
  {
    name: 'Auto-Reply Templates',
    description: 'Set up automated reply suggestions for common DM and comment patterns',
    icon: MessageSquare,
    trigger: { type: 'event', condition: 'new_comment' },
    action: { type: 'suggest_reply' },
  },
];

export default function WorkflowEngine() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadWorkflows();
  }, [user]);

  const loadWorkflows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('smm_workflows')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setWorkflows((data as WorkflowItem[]) || []);
    setLoading(false);
  };

  const handleAddPreset = async (preset: typeof PRESET_WORKFLOWS[0]) => {
    if (!user) return;
    const { error } = await supabase.from('smm_workflows').insert({
      user_id: user.id,
      name: preset.name,
      description: preset.description,
      workflow_type: 'preset',
      trigger_config: preset.trigger,
      action_config: preset.action,
      is_active: false,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Workflow added');
      loadWorkflows();
    }
  };

  const handleToggle = async (wf: WorkflowItem) => {
    const { error } = await supabase
      .from('smm_workflows')
      .update({ is_active: !wf.is_active, updated_at: new Date().toISOString() })
      .eq('id', wf.id);
    if (error) {
      toast.error(error.message);
    } else {
      setWorkflows((prev) => prev.map((w) => w.id === wf.id ? { ...w, is_active: !w.is_active } : w));
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('smm_workflows').delete().eq('id', id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    toast.success('Workflow removed');
  };

  const handleCreateCustom = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('smm_workflows').insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc.trim(),
      workflow_type: 'custom',
      trigger_config: { type: 'manual' },
      action_config: { type: 'custom' },
      is_active: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Custom workflow created');
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      loadWorkflows();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="w-5 h-5 text-[#FF6B00]" />
            Preset Workflows
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_WORKFLOWS.map((preset) => {
            const alreadyAdded = workflows.some((w) => w.name === preset.name);
            return (
              <div key={preset.name} className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                    <preset.icon className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{preset.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{preset.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddPreset(preset)}
                  disabled={alreadyAdded}
                  className={`mt-3 w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
                    alreadyAdded
                      ? 'bg-green-500/10 text-green-400 cursor-default'
                      : 'border border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/10'
                  }`}
                >
                  {alreadyAdded ? (
                    <><Zap className="w-3 h-3" /> Added</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Add Workflow</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Workflows</h3>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium gradient-orange text-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Custom
          </button>
        </div>

        {showCreate && (
          <div className="p-4 bg-dark-800 rounded-xl border border-[#FF6B00]/20 mb-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workflow name..."
              className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description..."
              className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6B00]"
            />
            <button
              onClick={handleCreateCustom}
              disabled={saving || !newName.trim()}
              className="px-4 py-2 rounded-lg gradient-orange text-white text-xs font-medium disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <Workflow className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No workflows yet</p>
            <p className="text-xs text-gray-600 mt-1">Add preset workflows or create custom ones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div key={wf.id} className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                <button
                  onClick={() => handleToggle(wf)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    wf.is_active ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}
                >
                  {wf.is_active ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-gray-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{wf.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      wf.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {wf.is_active ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-dark-600 text-gray-500">
                      {wf.workflow_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{wf.description}</p>
                  {wf.run_count > 0 && (
                    <p className="text-[10px] text-gray-600 mt-0.5">Ran {wf.run_count} times</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(wf.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
