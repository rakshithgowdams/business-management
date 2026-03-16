import { useState } from 'react';
import { Image, Video, FolderOpen, Clapperboard, Palette, Zap, Megaphone } from 'lucide-react';
import ImageGenerator from './ImageGenerator';
import VideoGenerator from './VideoGenerator';
import MediaGallery from './MediaGallery';
import CinematicStudio from './cinematic/CinematicStudio';
import GraphicDesigner from './designer/GraphicDesigner';
import Kling3Studio from './Kling3Studio';
import AdsGenerator from './AdsGenerator';

const tabs = [
  { key: 'images', label: 'Images', icon: Image },
  { key: 'cinematic', label: 'Cinematic', icon: Clapperboard },
  { key: 'designer', label: 'Designer', icon: Palette },
  { key: 'ads', label: 'Ads Generator', icon: Megaphone },
  { key: 'kling3', label: 'Kling 3.0', icon: Zap },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'gallery', label: 'Gallery', icon: FolderOpen },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function MarketingStudio() {
  const [activeTab, setActiveTab] = useState<TabKey>('images');
  const [pendingUgcImage, setPendingUgcImage] = useState<{ url: string; title: string } | null>(null);

  const handleSelectForUGC = (imageUrl: string, title: string) => {
    setPendingUgcImage({ url: imageUrl, title });
    setActiveTab('ads');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Marketing Studio</h1>
        <p className="text-sm text-gray-400 mt-1">Generate images, videos, music, and voice content with AI</p>
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
        {activeTab === 'images' && <ImageGenerator />}
        {activeTab === 'cinematic' && <CinematicStudio />}
        {activeTab === 'designer' && <GraphicDesigner />}
        {activeTab === 'ads' && (
          <AdsGenerator
            initialUgcImageUrl={pendingUgcImage?.url}
            initialUgcImageTitle={pendingUgcImage?.title}
          />
        )}
        {activeTab === 'kling3' && <Kling3Studio />}
        {activeTab === 'videos' && <VideoGenerator />}
        {activeTab === 'gallery' && <MediaGallery onSelectForUGC={handleSelectForUGC} />}
      </div>
    </div>
  );
}
