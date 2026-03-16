import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, DollarSign, Target, FileText, FileCheck,
  Ligature as FileSignature, CalendarClock, RefreshCw, BarChart3,
  FolderKanban, Users, Briefcase, Rocket, ClipboardList, Bot, Settings,
  LogOut, X, ChevronRight, Activity, Brain, CalendarDays, Send,
  FolderArchive, Palette, Share2, Zap, PanelLeftClose, PanelLeftOpen,
  ChevronDown, Sparkles, TrendingUp, Building2, Layers, ListChecks,
  Lock, MessageCircle,
} from 'lucide-react';
import { useTeamAuth } from '../context/TeamAuthContext';
import TeamAIStatusBar from './TeamAIStatusBar';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  badge?: string;
  permissionKey?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const allNavGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Layers,
    items: [
      { to: '', icon: LayoutDashboard, label: 'Dashboard', end: true, permissionKey: 'dashboard' },
      { to: '/health-score', icon: Activity, label: 'Health Score', badge: 'AI', permissionKey: 'health_score' },
      { to: '/weekly-summary', icon: CalendarDays, label: 'Weekly Summary', badge: 'AI', permissionKey: 'weekly_summary' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: TrendingUp,
    items: [
      { to: '/income', icon: DollarSign, label: 'Income', permissionKey: 'income' },
      { to: '/expenses', icon: Wallet, label: 'Expenses', permissionKey: 'expenses' },
      { to: '/invoices', icon: FileText, label: 'Invoices', permissionKey: 'invoices' },
      { to: '/quotations', icon: FileCheck, label: 'Quotations', permissionKey: 'quotations' },
      { to: '/gst', icon: BarChart3, label: 'GST Tracker', permissionKey: 'gst' },
      { to: '/emi', icon: CalendarClock, label: 'EMI Tracker', permissionKey: 'emi' },
      { to: '/subscriptions', icon: RefreshCw, label: 'Subscriptions', permissionKey: 'subscriptions' },
      { to: '/goals', icon: Target, label: 'Goals', permissionKey: 'goals' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Building2,
    items: [
      { to: '/projects', icon: FolderKanban, label: 'Projects', permissionKey: 'projects' },
      { to: '/clients', icon: Users, label: 'Clients', permissionKey: 'clients' },
      { to: '/agreements', icon: FileSignature, label: 'Agreements', badge: 'AI', permissionKey: 'agreements' },
      { to: '/documents', icon: FolderArchive, label: 'Documents', permissionKey: 'documents' },
      { to: '/follow-ups', icon: Send, label: 'Follow-ups', badge: 'AI', permissionKey: 'follow_ups' },
      { to: '/meeting-prep', icon: Brain, label: 'Meeting Prep', badge: 'AI', permissionKey: 'meeting_prep' },
    ],
  },
  {
    id: 'ai-creative',
    label: 'AI & Creative',
    icon: Sparkles,
    items: [
      { to: '/ai-intelligence', icon: Bot, label: 'AI Intelligence', badge: 'NEW', permissionKey: 'ai_intelligence' },
      { to: '/marketing-studio', icon: Palette, label: 'Marketing Studio', badge: 'AI', permissionKey: 'marketing_studio' },
      { to: '/smm-agent', icon: Share2, label: 'SMM Agent', badge: 'AI', permissionKey: 'smm_agent' },
      { to: '/ai-usage', icon: Zap, label: 'AI Usage', permissionKey: 'ai_usage' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Briefcase,
    items: [
      { to: '/employees', icon: Briefcase, label: 'Employees', permissionKey: 'employees' },
      { to: '/task-management', icon: ListChecks, label: 'Task Management', badge: 'NEW', permissionKey: 'task_management' },
      { to: '/messenger', icon: MessageCircle, label: 'Messenger', badge: 'NEW' },
      { to: '/onboarding', icon: Rocket, label: 'Onboarding', permissionKey: 'onboarding' },
      { to: '/work-tracker', icon: ClipboardList, label: 'Work Tracker', permissionKey: 'work_tracker' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  basePath: string;
}

const LS_GROUPS_KEY = 'mfo_team_sidebar_groups';

export default function TeamSidebar({ open, onClose, collapsed, onToggleCollapse, basePath }: Props) {
  const { member, signOut, hasPermission } = useTeamAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(LS_GROUPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* */ }
    return { overview: true, finance: true, business: true, 'ai-creative': true, team: true };
  });

  const filteredGroups = allNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.permissionKey || hasPermission(item.permissionKey)),
    }))
    .filter(group => group.items.length > 0);

  useEffect(() => {
    try { localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(expandedGroups)); } catch { /* */ }
  }, [expandedGroups]);

  useEffect(() => {
    for (const group of filteredGroups) {
      if (group.items.some(item => {
        const fullTo = `${basePath}${item.to}`;
        if (item.end) return location.pathname === fullTo;
        return location.pathname.startsWith(fullTo);
      })) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate(basePath.startsWith('/management') ? '/management' : '/employee');
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isGroupActive = (group: typeof filteredGroups[0]) => {
    return group.items.some(item => {
      const fullTo = `${basePath}${item.to}`;
      if (item.end) return location.pathname === fullTo;
      return location.pathname.startsWith(fullTo);
    });
  };

  const isManagement = member?.role === 'management';
  const roleBadge = isManagement ? 'Management' : 'Employee';
  const roleBadgeColor = isManagement ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';

  const initials = member?.full_name
    ? member.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[272px]';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden sidebar-overlay-enter"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-dark-800 border-r border-white/[0.06] z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`h-16 flex items-center justify-between border-b border-white/[0.06] shrink-0 ${collapsed ? 'px-3' : 'px-5'}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
            <img
              src="/Group_3_(1).png"
              alt="MyDesignNexus"
              className={`object-contain transition-all duration-300 ${collapsed ? 'h-7' : 'h-8'}`}
            />
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-2 border-b border-white/[0.04]">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${roleBadgeColor}`}>
              {roleBadge}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3">
          {filteredGroups.map((group, groupIndex) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroups[group.id];

            return (
              <div key={group.id} className={groupIndex > 0 ? 'mt-1' : ''}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 group ${
                      groupActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <group.icon className={`w-3.5 h-3.5 transition-colors duration-200 ${groupActive ? 'text-brand-500' : 'text-gray-600 group-hover:text-gray-400'}`} />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-0' : '-rotate-90'} ${groupActive ? 'text-brand-500/60' : 'text-gray-600'}`} />
                  </button>
                ) : (
                  <div className="px-2 py-2">
                    <div className={`h-px mx-1 ${groupActive ? 'bg-brand-600/30' : 'bg-white/[0.04]'}`} />
                  </div>
                )}

                <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-h-[2000px] opacity-100' : isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className={collapsed ? 'px-2 space-y-0.5' : 'px-3 pb-1 space-y-0.5'}>
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={`${basePath}${item.to}`}
                        end={item.end}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${
                            collapsed ? 'px-0 py-2.5' : 'px-3 py-2'
                          } rounded-lg text-[13px] font-medium transition-all duration-200 group/item relative ${
                            isActive
                              ? 'bg-brand-600/[0.12] text-brand-400 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.15)]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !collapsed && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-brand-500 sidebar-indicator" />
                            )}
                            <item.icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
                              isActive ? 'text-brand-400' : 'text-gray-500 group-hover/item:text-gray-300'
                            }`} />
                            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                            {!collapsed && item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                item.badge === 'NEW'
                                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                                  : 'bg-brand-600/20 text-brand-400 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.15)]'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            {collapsed && (
                              <div className="absolute left-full ml-3 px-3 py-2 bg-dark-700 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[60] pointer-events-none shadow-xl shadow-black/30 sidebar-tooltip">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark-700 border-l border-b border-white/10 rotate-45" />
                                {item.label}
                              </div>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && !collapsed && (
            <div className="px-5 py-8 text-center">
              <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No modules assigned yet.</p>
              <p className="text-xs text-gray-600 mt-1">Contact your administrator.</p>
            </div>
          )}
        </nav>

        <div className="border-t border-white/[0.06] shrink-0">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>

          {!collapsed && <TeamAIStatusBar />}

          <div
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 border-t border-white/[0.04]`}
          >
            <div className={`${collapsed ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs'} rounded-full ${isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} flex items-center justify-center text-white font-bold shrink-0`}>
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{member?.full_name || 'User'}</p>
                <p className="text-[11px] text-gray-500 truncate">{member?.job_title || member?.email}</p>
              </div>
            )}
          </div>

          <div className={`pb-3 pt-1 ${collapsed ? 'px-2' : 'px-3'}`}>
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-[13px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 group/logout relative`}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover/logout:-translate-x-0.5" />
              {!collapsed && <span>Logout</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-dark-700 border border-white/10 text-red-400 text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-200 z-[60] pointer-events-none shadow-xl shadow-black/30 sidebar-tooltip">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark-700 border-l border-b border-white/10 rotate-45" />
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
