import { useState } from 'react';
import { Palette, FileText, Layers, Target, Box, Youtube, Zap } from 'lucide-react';
import PostDesigner from './PostDesigner';
import CarouselBuilder from './CarouselBuilder';
import AdCreator from './AdCreator';
import MockupStudio from './MockupStudio';
import BannerGenerator from './BannerGenerator';
import NanaBananaStudio from './NanaBananaStudio';

const SUB_TABS = [
  { key: 'nano', label: 'Nano Banana Pro', icon: Zap, highlight: true },
  { key: 'post', label: 'Post Designer', icon: FileText, highlight: false },
  { key: 'carousel', label: 'Carousel Builder', icon: Layers, highlight: false },
  { key: 'ad', label: 'Ad Creator', icon: Target, highlight: false },
  { key: 'mockup', label: 'Mockup Studio', icon: Box, highlight: false },
  { key: 'banner', label: 'Banner Generator', icon: Youtube, highlight: false },
] as const;

type SubTab = (typeof SUB_TABS)[number]['key'];

export default function GraphicDesigner() {
  const [activeTab, setActiveTab] = useState<SubTab>('nano');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0891B2] to-[#06B6D4] flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Graphic Designer</h2>
          <p className="text-xs text-gray-400">Professional design assets with reference images & brand consistency</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/5 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? tab.highlight
                  ? 'bg-gradient-to-r from-[#E67E22] to-[#F1C40F] text-white shadow-lg shadow-yellow-500/20'
                  : 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4] text-white shadow-lg shadow-cyan-500/20'
                : tab.highlight
                  ? 'text-[#F1C40F] hover:bg-[#F1C40F]/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.highlight && activeTab !== tab.key && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/20">
                NEW
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'nano' && <NanaBananaStudio />}
      {activeTab === 'post' && <PostDesigner />}
      {activeTab === 'carousel' && <CarouselBuilder />}
      {activeTab === 'ad' && <AdCreator />}
      {activeTab === 'mockup' && <MockupStudio />}
      {activeTab === 'banner' && <BannerGenerator />}
    </div>
  );
}
