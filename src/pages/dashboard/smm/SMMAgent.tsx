import { useState } from 'react';
import { LayoutDashboard, PenSquare, CalendarDays, BrainCircuit, BarChart3, Workflow } from 'lucide-react';
import SMMDashboard from './SMMDashboard';
import CreatePost from './CreatePost';
import ContentCalendar from './ContentCalendar';
import ContentPlanner from './ContentPlanner';
import SMMAnalytics from './SMMAnalytics';
import WorkflowEngine from './WorkflowEngine';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'create', label: 'Create Post', icon: PenSquare },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'planner', label: 'AI Planner', icon: BrainCircuit },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'workflows', label: 'Workflows', icon: Workflow },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function SMMAgent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMM AI Agent</h1>
        <p className="text-sm text-gray-400 mt-1">Manage social media content, scheduling, and analytics</p>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'gradient-orange text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'dashboard' && <SMMDashboard />}
        {activeTab === 'create' && <CreatePost />}
        {activeTab === 'calendar' && <ContentCalendar />}
        {activeTab === 'planner' && <ContentPlanner />}
        {activeTab === 'analytics' && <SMMAnalytics />}
        {activeTab === 'workflows' && <WorkflowEngine />}
      </div>
    </div>
  );
}
