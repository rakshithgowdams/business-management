import { useState, useEffect } from 'react';
import { X, Users, Search, Check, FolderKanban } from 'lucide-react';
import type { ChatContact } from '../../../lib/messaging/types';
import { supabase } from '../../../lib/supabase';
import { useTeamAuth } from '../../../context/TeamAuthContext';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Props {
  contacts: ChatContact[];
  onClose: () => void;
  onCreate: (params: { name: string; description: string; project_id?: string; member_ids: string[] }) => void;
  loading: boolean;
}

export default function CreateGroupModal({ contacts, onClose, onCreate, loading }: Props) {
  const { member } = useTeamAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!member?.owner_id) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('user_id', member.owner_id)
      .order('name');
    setProjects(data || []);
    setLoadingProjects(false);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const filteredContacts = contacts.filter(c => {
    if (!search.trim()) return true;
    return c.full_name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = () => {
    if (!name.trim() || selectedMembers.length === 0) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      project_id: selectedProject || undefined,
      member_ids: selectedMembers,
    });
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project && !name) {
        setName(project.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Group</h3>
              <p className="text-xs text-gray-500">Project-based team chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Link to Project (optional)</label>
            <div className="relative">
              <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedProject}
                onChange={e => handleProjectChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50 transition-colors"
              >
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Project Alpha Team"
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="w-full px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">
              Add Members * ({selectedMembers.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search team members..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMembers.map(id => {
                  const c = contacts.find(ct => ct.id === id);
                  if (!c) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-500/20 text-brand-400 rounded-lg text-xs border border-brand-500/20"
                    >
                      {c.full_name}
                      <button onClick={() => toggleMember(id)} className="hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.06] bg-dark-700">
              {filteredContacts.map(contact => {
                const isSelected = selectedMembers.includes(contact.id);
                const pic = contact.chat_profile?.profile_pic_url || contact.avatar_url;
                const initials = contact.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleMember(contact.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      isSelected ? 'bg-brand-500/10' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {pic ? (
                      <img src={pic} alt={contact.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                        contact.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      }`}>
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-white truncate">{contact.full_name}</p>
                      <p className="text-[11px] text-gray-500">{contact.role} - {contact.department || contact.job_title}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedMembers.length === 0 || loading}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
