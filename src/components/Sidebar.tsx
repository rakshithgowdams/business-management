import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, DollarSign, Target, FileText, FileCheck, Ligature as FileSignature, CalendarClock, RefreshCw, BarChart3, FolderKanban, Users, Briefcase, Rocket, ClipboardList, Bot, Settings, LogOut, X, ChevronRight, Activity, Brain, CalendarDays, Send, FolderArchive, Palette, Share2, Zap, PanelLeftClose, PanelLeftOpen, ChevronDown, Sparkles, TrendingUp, Building2, Layers, ListChecks, MessageCircle, UsersRound, HardHat, Megaphone, GitBranch, Globe, Inbox, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Layers,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/dashboard/health-score', icon: Activity, label: 'Health Score', badge: 'AI' },
      { to: '/dashboard/weekly-summary', icon: CalendarDays, label: 'Weekly Summary', badge: 'AI' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: TrendingUp,
    items: [
      { to: '/dashboard/income', icon: DollarSign, label: 'Income' },
      { to: '/dashboard/expenses', icon: Wallet, label: 'Expenses' },
      { to: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
      { to: '/dashboard/quotations', icon: FileCheck, label: 'Quotations' },
      { to: '/dashboard/gst', icon: BarChart3, label: 'GST Tracker' },
      { to: '/dashboard/emi', icon: CalendarClock, label: 'EMI Tracker' },
      { to: '/dashboard/subscriptions', icon: RefreshCw, label: 'Subscriptions' },
      { to: '/dashboard/goals', icon: Target, label: 'Goals' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Building2,
    items: [
      { to: '/dashboard/pipeline', icon: GitBranch, label: 'Pipeline', badge: 'NEW' },
      { to: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/dashboard/teams', icon: UsersRound, label: 'Teams' },
      { to: '/dashboard/clients', icon: Users, label: 'Clients' },
      { to: '/dashboard/client-portal', icon: Shield, label: 'Client Portal', badge: 'NEW' },
      { to: '/dashboard/agreements', icon: FileSignature, label: 'Agreements', badge: 'AI' },
      { to: '/dashboard/documents', icon: FolderArchive, label: 'Documents' },
      { to: '/dashboard/follow-ups', icon: Send, label: 'Follow-ups', badge: 'AI' },
      { to: '/dashboard/meeting-prep', icon: Brain, label: 'Meeting Prep', badge: 'AI' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { to: '/dashboard/digital-marketing', icon: TrendingUp, label: 'Digital Marketing', badge: 'NEW' },
      { to: '/dashboard/marketing-studio', icon: Palette, label: 'Marketing Studio', badge: 'AI' },
      { to: '/dashboard/smm-agent', icon: Share2, label: 'SMM Agent', badge: 'AI' },
      { to: '/dashboard/website-builder', icon: Globe, label: 'Website Builder', badge: 'NEW' },
      { to: '/dashboard/website-leads', icon: Inbox, label: 'Website Leads' },
    ],
  },
  {
    id: 'ai-creative',
    label: 'AI & Creative',
    icon: Sparkles,
    items: [
      { to: '/dashboard/ai-intelligence', icon: Bot, label: 'AI Intelligence', badge: 'NEW' },
      { to: '/dashboard/ai-usage', icon: Zap, label: 'AI Usage' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: Briefcase,
    items: [
      { to: '/dashboard/employees', icon: Briefcase, label: 'Employees' },
      { to: '/dashboard/hr', icon: HardHat, label: 'HR Management', badge: 'NEW' },
      { to: '/dashboard/task-management', icon: ListChecks, label: 'Task Management' },
      { to: '/dashboard/messenger', icon: MessageCircle, label: 'Messenger' },
      { to: '/dashboard/onboarding', icon: Rocket, label: 'Onboarding' },
      { to: '/dashboard/work-tracker', icon: ClipboardList, label: 'Work Tracker' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const LS_GROUPS_KEY = 'mfo_sidebar_groups';

function getInitialExpandedGroups(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(LS_GROUPS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* */ }
  return { overview: true, finance: true, business: true, marketing: true, 'ai-creative': true, team: true, hr: true };
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [avatarSigned, setAvatarSigned] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getInitialExpandedGroups);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (user) loadUserInfo();
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(expandedGroups)); } catch { /* */ }
  }, [expandedGroups]);

  useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some(item => {
        if (item.end) return location.pathname === item.to;
        return location.pathname.startsWith(item.to);
      })) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [location.pathname]);

  const loadUserInfo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user!.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || user!.email || '');
      if (data.avatar_url) {
        const { data: signed } = await supabase.storage
          .from('avatars')
          .createSignedUrl(data.avatar_url, 3600);
        if (signed?.signedUrl) setAvatarSigned(signed.signedUrl);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => {
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    });
  };

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
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
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto sidebar-scroll py-3">
          {navGroups.map((group, groupIndex) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroups[group.id];

            return (
              <div
                key={group.id}
                className={`${groupIndex > 0 ? 'mt-1' : ''}`}
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 group ${
                      groupActive
                        ? 'text-brand-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <group.icon className={`w-3.5 h-3.5 transition-colors duration-200 ${groupActive ? 'text-brand-500' : 'text-gray-600 group-hover:text-gray-400'}`} />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      } ${groupActive ? 'text-brand-500/60' : 'text-gray-600'}`}
                    />
                  </button>
                ) : (
                  <div className="px-2 py-2">
                    <div className={`h-px mx-1 transition-colors duration-200 ${groupActive ? 'bg-brand-600/30' : 'bg-white/[0.04]'}`} />
                  </div>
                )}

                <div
                  className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    collapsed ? 'max-h-[2000px] opacity-100' : isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className={`${collapsed ? 'px-2 space-y-0.5' : 'px-3 pb-1 space-y-0.5'}`}>
                    {group.items.map((item, itemIndex) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `sidebar-nav-item flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${
                            collapsed ? 'px-0 py-2.5' : 'px-3 py-2'
                          } rounded-lg text-[13px] font-medium transition-all duration-200 group/item relative ${
                            isActive
                              ? 'sidebar-item-active bg-brand-600/[0.12] text-brand-400 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.15)]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                          }`
                        }
                        style={{ animationDelay: `${(groupIndex * 4 + itemIndex) * 30}ms` }}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !collapsed && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-brand-500 sidebar-indicator" />
                            )}
                            <item.icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
                              isActive ? 'text-brand-400' : 'text-gray-500 group-hover/item:text-gray-300'
                            }`} />
                            {!collapsed && (
                              <span className="flex-1 truncate">{item.label}</span>
                            )}
                            {!collapsed && item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-200 ${
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
                                {item.badge && (
                                  <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                    item.badge === 'NEW'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-brand-600/20 text-brand-400'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
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

          <div className={`mt-1 ${collapsed ? 'px-2' : 'px-3'}`}>
            <NavLink
              to="/dashboard/settings"
              onClick={onClose}
              title={collapsed ? 'Settings' : undefined}
              className={({ isActive }) =>
                `sidebar-nav-item flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${
                  collapsed ? 'px-0 py-2.5' : 'px-3 py-2'
                } rounded-lg text-[13px] font-medium transition-all duration-200 group/item relative ${
                  isActive
                    ? 'sidebar-item-active bg-brand-600/[0.12] text-brand-400 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-brand-500 sidebar-indicator" />
                  )}
                  <Settings className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
                    isActive ? 'text-brand-400' : 'text-gray-500 group-hover/item:text-gray-300'
                  }`} />
                  {!collapsed && <span className="flex-1">Settings</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-dark-700 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[60] pointer-events-none shadow-xl shadow-black/30 sidebar-tooltip">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark-700 border-l border-b border-white/10 rotate-45" />
                      Settings
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] shrink-0">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>

          <NavLink
            to="/dashboard/profile"
            onClick={onClose}
            title={collapsed ? fullName || 'Profile' : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 transition-all duration-200 group/profile relative ${
                isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
              }`
            }
          >
            {avatarSigned ? (
              <img
                src={avatarSigned}
                alt=""
                className={`${collapsed ? 'w-8 h-8' : 'w-9 h-9'} rounded-full object-cover border-2 border-brand-500/30 shrink-0 transition-all duration-200 group-hover/profile:border-brand-500/50 group-hover/profile:shadow-[0_0_12px_rgba(255,107,0,0.15)]`}
              />
            ) : (
              <div
                className={`${collapsed ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs'} rounded-full gradient-orange flex items-center justify-center text-white font-bold shrink-0 transition-all duration-200 group-hover/profile:shadow-[0_0_12px_rgba(255,107,0,0.2)]`}
              >
                {initials}
              </div>
            )}
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fullName || 'User'}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 transition-transform duration-200 group-hover/profile:text-gray-400 group-hover/profile:translate-x-0.5" />
              </>
            )}
            {collapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-dark-700 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-[60] pointer-events-none shadow-xl shadow-black/30 sidebar-tooltip">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-dark-700 border-l border-b border-white/10 rotate-45" />
                {fullName || 'Profile'}
              </div>
            )}
          </NavLink>

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
