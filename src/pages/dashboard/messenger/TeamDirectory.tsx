import { useState } from 'react';
import {
  Users, Briefcase, Circle, Search, X, ChevronDown, ChevronRight,
  Mail, Building2,
} from 'lucide-react';
import type { ChatContact, TeamStats } from '../../../lib/messaging/types';

interface Props {
  contacts: ChatContact[];
  teamStats: TeamStats | null;
  onStartDirect: (contact: ChatContact) => void;
  onClose: () => void;
}

export default function TeamDirectory({ contacts, teamStats, onStartDirect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<'management' | 'employees' | null>('management');

  const managementContacts = contacts.filter(c => c.role === 'management');
  const employeeContacts = contacts.filter(c => c.role === 'employee');

  const filteredManagement = managementContacts.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q) || (c.job_title || '').toLowerCase().includes(q);
  });

  const filteredEmployees = employeeContacts.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q) || (c.job_title || '').toLowerCase().includes(q);
  });

  const renderContactCard = (contact: ChatContact) => {
    const pic = contact.chat_profile?.profile_pic_url || contact.avatar_url;
    const name = contact.chat_profile?.display_name || contact.full_name;
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isOnline = contact.chat_profile?.is_online;
    const canMessage = contact.approval_status === 'not_required' || contact.approval_status === 'approved';

    return (
      <button
        key={contact.id}
        onClick={() => canMessage && onStartDirect(contact)}
        disabled={!canMessage}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed group"
      >
        <div className="relative shrink-0">
          {pic ? (
            <img src={pic} alt={name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              contact.role === 'management'
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}>
              {initials}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-800 ${
            isOnline ? 'bg-emerald-400' : 'bg-gray-600'
          }`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">{name}</p>
          <p className="text-[11px] text-gray-500 truncate">{contact.job_title || contact.department || contact.role}</p>
        </div>
        {!canMessage && contact.approval_status === 'pending' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">PENDING</span>
        )}
        {!canMessage && contact.approval_status === 'none' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 font-medium">LOCKED</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-dark-850 border-r border-white/[0.06]">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Team Directory</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {teamStats && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-dark-700 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Management</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{teamStats.total_management}</span>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">{teamStats.online_management}</span>
                </div>
              </div>
            </div>
            <div className="bg-dark-700 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Employees</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{teamStats.total_employees}</span>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">{teamStats.online_employees}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people, departments..."
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={() => setExpandedSection(expandedSection === 'management' ? null : 'management')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSection === 'management' ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Management</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold">
              {filteredManagement.length}
            </span>
          </button>
          {expandedSection === 'management' && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredManagement.length === 0 ? (
                <p className="text-xs text-gray-600 px-3 py-4 text-center">No management members found</p>
              ) : (
                filteredManagement.map(renderContactCard)
              )}
            </div>
          )}
        </div>

        <div className="p-2">
          <button
            onClick={() => setExpandedSection(expandedSection === 'employees' ? null : 'employees')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSection === 'employees' ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Employees</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
              {filteredEmployees.length}
            </span>
          </button>
          {expandedSection === 'employees' && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredEmployees.length === 0 ? (
                <p className="text-xs text-gray-600 px-3 py-4 text-center">No employees found</p>
              ) : (
                filteredEmployees.map(renderContactCard)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
