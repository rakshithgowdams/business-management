import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Type, Key } from 'lucide-react';
import GoogleCampaigns from './GoogleCampaigns';
import GoogleAdGroups from './GoogleAdGroups';
import KeywordsManager from './KeywordsManager';

const subTabs = [
  { path: 'campaigns', label: 'Campaigns', icon: LayoutGrid },
  { path: 'adgroups', label: 'Ad Groups', icon: Type },
  { path: 'keywords', label: 'Keywords', icon: Key },
];

const GOOGLE_BASE = '/dashboard/digital-marketing/google';

export default function GoogleAdsModule() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Google Ads Manager</h2>
      </div>

      <div className="flex gap-1 bg-dark-700/50 rounded-lg p-0.5 w-fit">
        {subTabs.map((tab) => {
          const tabPath = `${GOOGLE_BASE}/${tab.path}`;
          const isActive = location.pathname === tabPath || location.pathname.startsWith(`${tabPath}/`);
          return (
            <NavLink
              key={tab.path}
              to={tabPath}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Routes>
        <Route index element={<Navigate to="campaigns" replace />} />
        <Route path="campaigns" element={<GoogleCampaigns />} />
        <Route path="adgroups" element={<GoogleAdGroups />} />
        <Route path="keywords" element={<KeywordsManager />} />
      </Routes>
    </div>
  );
}
