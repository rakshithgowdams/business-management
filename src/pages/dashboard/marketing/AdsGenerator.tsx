import { useState, useEffect } from 'react';
import { LayoutGrid, User, Target, History, Megaphone } from 'lucide-react';
import AdCarousel from './ads/AdCarousel';
import UGCCreator from './ads/UGCCreator';
import ContentStrategy from './ads/ContentStrategy';
import AdsHistory from './ads/AdsHistory';

const TABS = [
  {
    key: 'carousel',
    label: 'Ad Carousel',
    icon: LayoutGrid,
    desc: 'Image & video carousel ads',
    badge: 'Image + Video',
    badgeColor: 'bg-[#F1C40F]/10 text-[#F1C40F] border-[#F1C40F]/20',
  },
  {
    key: 'ugc',
    label: 'UGC Creator',
    icon: User,
    desc: 'Authentic creator content',
    badge: 'Image + Video',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    key: 'strategy',
    label: 'Content Strategy',
    icon: Target,
    desc: 'AI market research & planning',
    badge: 'Claude 4.6',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    key: 'history',
    label: 'Ads History',
    icon: History,
    desc: 'All generated ads & strategies',
    badge: null,
    badgeColor: '',
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface AdsGeneratorProps {
  initialUgcImageUrl?: string;
  initialUgcImageTitle?: string;
}

export default function AdsGenerator({ initialUgcImageUrl, initialUgcImageTitle }: AdsGeneratorProps = {}) {
  const [activeTab, setActiveTab] = useState<TabKey>('carousel');

  useEffect(() => {
    if (initialUgcImageUrl) {
      setActiveTab('ugc');
    }
  }, [initialUgcImageUrl]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E67E22] to-[#F1C40F] flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Ads Generator</h2>
          <p className="text-xs text-gray-400">Carousel ads · UGC content · Content strategy — powered by Nano Banana Pro, Kling 3.0 & Claude</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/5 overflow-x-auto">
        {TABS.map((tab) => (
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
            {tab.badge && (
              <span className={`hidden sm:flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'carousel' && <AdCarousel />}
        {activeTab === 'ugc' && <UGCCreator initialImageUrl={initialUgcImageUrl} initialImageTitle={initialUgcImageTitle} />}
        {activeTab === 'strategy' && <ContentStrategy />}
        {activeTab === 'history' && <AdsHistory />}
      </div>
    </div>
  );
}
