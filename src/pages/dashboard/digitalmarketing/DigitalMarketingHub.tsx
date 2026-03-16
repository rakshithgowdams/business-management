import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { TrendingUp, Facebook, Search, MapPin, Users, DollarSign, Megaphone } from 'lucide-react';
import CampaignsOverview from './CampaignsOverview';
import MetaAdsModule from './meta/MetaAdsModule';
import GoogleAdsModule from './google/GoogleAdsModule';
import OfflineB2BModule from './offline/OfflineB2BModule';
import LeadsManager from './LeadsManager';
import ExpenseTracker from './ExpenseTracker';
import MarketingAnalytics from './MarketingAnalytics';

const tabs = [
  { path: 'overview', label: 'Overview', icon: TrendingUp },
  { path: 'meta', label: 'Meta Ads', icon: Facebook },
  { path: 'google', label: 'Google Ads', icon: Search },
  { path: 'offline', label: 'Offline & B2B', icon: MapPin },
  { path: 'leads', label: 'Leads', icon: Users },
  { path: 'expenses', label: 'Expenses', icon: DollarSign },
  { path: 'analytics', label: 'Analytics', icon: Megaphone },
];

export default function DigitalMarketingHub() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Digital Marketing</h1>
          <p className="text-sm text-gray-500">Meta Ads, Google Ads, offline campaigns, B2B outreach & ROI tracking</p>
        </div>
      </div>

      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const tabPath = `/dashboard/digital-marketing/${tab.path}`;
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
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<CampaignsOverview />} />
        <Route path="meta/*" element={<MetaAdsModule />} />
        <Route path="google/*" element={<GoogleAdsModule />} />
        <Route path="offline/*" element={<OfflineB2BModule />} />
        <Route path="leads" element={<LeadsManager />} />
        <Route path="expenses" element={<ExpenseTracker />} />
        <Route path="analytics" element={<MarketingAnalytics />} />
      </Routes>
    </div>
  );
}
