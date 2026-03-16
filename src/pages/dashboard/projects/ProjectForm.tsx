import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { PROJECT_CATEGORIES } from '../../../lib/projects/constants';

const FORM_STATUSES = ['Active', 'On Hold', 'Completed'] as const;

export default function ProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    category: PROJECT_CATEGORIES[0] as string,
    status: 'Active',
    budget: '',
    revenue: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (isEdit && user) loadProject();
  }, [id, user]);

  const loadProject = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id!)
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!data) {
      toast.error('Project not found');
      navigate('/dashboard/projects');
      return;
    }

    setForm({
      name: data.name,
      client_name: data.client_name,
      category: data.category,
      status: data.status === 'Overbudget' ? 'Active' : data.status,
      budget: String(data.budget),
      revenue: String(data.revenue),
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      description: data.description || '',
      tags: data.tags || '',
    });
    setLoading(false);
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    if (!form.client_name.trim()) { toast.error('Client name is required'); return; }
    if (!form.budget || Number(form.budget) <= 0) { toast.error('Enter a valid budget'); return; }
    if (!form.revenue || Number(form.revenue) <= 0) { toast.error('Enter a valid revenue amount'); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      client_name: form.client_name.trim(),
      category: form.category,
      status: form.status,
      budget: Number(form.budget),
      revenue: Number(form.revenue),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description.trim(),
      tags: form.tags.trim(),
    };

    if (isEdit) {
      const { error } = await supabase.from('projects').update(payload).eq('id', id!);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Project updated');
      navigate(`/dashboard/projects/${id}`);
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...payload, user_id: user!.id })
        .select('id')
        .maybeSingle();
      if (error || !data) { toast.error(error?.message || 'Failed to create project'); setSaving(false); return; }
      toast.success('Project created');
      navigate(`/dashboard/projects/${data.id}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Project Name *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. AI Call Agent for Clinic" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Client Name *</label>
            <input type="text" value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Mysuru Clinic" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
              {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
              {FORM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Budget (INR) *</label>
            <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project Revenue (INR) *</label>
            <input type="number" value={form.revenue} onChange={(e) => set('revenue', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Date</label>
            <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Description / Scope</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="Project description and scope..." />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. automation, chatbot, n8n" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Update Project' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
