import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import TeamSidebar from './TeamSidebar';

const LS_COLLAPSED_KEY = 'mfo_team_sidebar_collapsed';

interface Props {
  basePath: string;
}

export default function TeamDashboardLayout({ basePath }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_COLLAPSED_KEY) === '1'; } catch { return false; }
  });

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(LS_COLLAPSED_KEY, next ? '1' : '0'); } catch { /* */ }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <TeamSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        basePath={basePath}
      />

      <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[272px]'}`}>
        <header className="h-16 bg-dark-800/80 backdrop-blur-lg border-b border-white/5 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
