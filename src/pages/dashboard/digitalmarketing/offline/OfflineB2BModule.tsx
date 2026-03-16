import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Calendar, Users, MapPin } from 'lucide-react';
import EventsManager from './EventsManager';
import OutreachManager from './OutreachManager';

const subTabs = [
  { path: 'events', label: 'Events & Trade Shows', icon: Calendar },
  { path: 'outreach', label: 'B2B Outreach', icon: Users },
];

const OFFLINE_BASE = '/dashboard/digital-marketing/offline';

export default function OfflineB2BModule() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-green-400" />
        </div>
        <h2 className="text-base font-semibold text-white">Offline & B2B Marketing</h2>
      </div>

      <div className="flex gap-1 bg-dark-700/50 rounded-lg p-0.5 w-fit">
        {subTabs.map((tab) => {
          const tabPath = `${OFFLINE_BASE}/${tab.path}`;
          const isActive = location.pathname === tabPath || location.pathname.startsWith(`${tabPath}/`);
          return (
            <NavLink
              key={tab.path}
              to={tabPath}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-green-600/20 text-green-400'
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
        <Route index element={<Navigate to="events" replace />} />
        <Route path="events" element={<EventsManager />} />
        <Route path="outreach" element={<OutreachManager />} />
      </Routes>
    </div>
  );
}
