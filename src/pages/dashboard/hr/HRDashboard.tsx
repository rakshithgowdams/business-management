import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { UserPlus, Calendar, Star, BarChart2, FileText, HardHat } from 'lucide-react';
import HiringModule from './hiring/HiringModule';
import LeaveModule from './leave/LeaveModule';
import PerformanceModule from './performance/PerformanceModule';
import PoliciesModule from './policies/PoliciesModule';
import HRAnalytics from './analytics/HRAnalytics';

const tabs = [
  { path: 'hiring', label: 'Hiring', icon: UserPlus },
  { path: 'leave', label: 'Leave Management', icon: Calendar },
  { path: 'performance', label: 'Performance', icon: Star },
  { path: 'policies', label: 'HR Policies', icon: FileText },
  { path: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function HRDashboard() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HR Management</h1>
          <p className="text-sm text-gray-500">Hiring, leave, performance & policies — all in one place</p>
        </div>
      </div>

      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const tabPath = `/dashboard/hr/${tab.path}`;
          const isActive = location.pathname === tabPath || location.pathname.startsWith(`${tabPath}/`);
          return (
            <NavLink
              key={tab.path}
              to={tabPath}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Routes>
        <Route index element={<Navigate to="hiring" replace />} />
        <Route path="hiring/*" element={<HiringModule />} />
        <Route path="leave/*" element={<LeaveModule />} />
        <Route path="performance/*" element={<PerformanceModule />} />
        <Route path="policies/*" element={<PoliciesModule />} />
        <Route path="analytics" element={<HRAnalytics />} />
      </Routes>
    </div>
  );
}
