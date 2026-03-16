import { useState } from 'react';
import { GitBranch, TrendingUp, Users, FolderKanban } from 'lucide-react';
import SalesCRMBoard from './sales/SalesCRMBoard';
import OnboardingPipelineBoard from './onboarding/OnboardingPipelineBoard';
import ProjectPipelineBoard from './projects/ProjectPipelineBoard';

const tabs = [
  { id: 'sales', label: 'Sales CRM', icon: TrendingUp, desc: 'Lead to Won pipeline' },
  { id: 'onboarding', label: 'Onboarding', icon: Users, desc: 'Client onboarding stages' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, desc: 'Project stage tracking' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function PipelineHub() {
  const [activeTab, setActiveTab] = useState<TabId>('sales');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Business Pipeline</h1>
          </div>
          <p className="text-sm text-gray-400">Manage your sales funnel, client onboarding, and project delivery stages</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'gradient-orange text-white shadow-lg shadow-brand-500/20' : 'glass-card text-gray-400 hover:text-white hover:bg-dark-700/60'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'sales' && <SalesCRMBoard />}
        {activeTab === 'onboarding' && <OnboardingPipelineBoard />}
        {activeTab === 'projects' && <ProjectPipelineBoard />}
      </div>
    </div>
  );
}
