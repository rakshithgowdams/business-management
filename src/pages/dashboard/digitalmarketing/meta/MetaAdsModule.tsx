import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Layers, Image, LayoutGrid } from 'lucide-react';
import MetaCampaigns from './MetaCampaigns';
import MetaAdSets from './MetaAdSets';
import MetaAds from './MetaAds';

const subTabs = [
  { path: 'campaigns', label: 'Campaigns', icon: LayoutGrid },
  { path: 'adsets', label: 'Ad Sets', icon: Layers },
  { path: 'ads', label: 'Ads', icon: Image },
];

const META_BASE = '/dashboard/digital-marketing/meta';

export default function MetaAdsModule() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Meta Ads Manager</h2>
      </div>

      <div className="flex gap-1 bg-dark-700/50 rounded-lg p-0.5 w-fit">
        {subTabs.map((tab) => {
          const tabPath = `${META_BASE}/${tab.path}`;
          const isActive = location.pathname === tabPath || location.pathname.startsWith(`${tabPath}/`);
          return (
            <NavLink
              key={tab.path}
              to={tabPath}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
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
        <Route path="campaigns" element={<MetaCampaigns />} />
        <Route path="adsets" element={<MetaAdSets />} />
        <Route path="ads" element={<MetaAds />} />
      </Routes>
    </div>
  );
}
