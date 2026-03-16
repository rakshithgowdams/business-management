import { useState, useCallback } from 'react';
import { Type, ArrowRightLeft, Wand2, Download, Image as ImageIcon, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import TextToImage from './TextToImage';
import ImageToImage from './ImageToImage';
import ImageEditing from './ImageEditing';
import ImageHistory from './ImageHistory';

interface ImageSlot {
  index: number;
  status: 'idle' | 'generating' | 'done' | 'failed';
  url: string | null;
  elapsed: number;
}

interface TabResults {
  slots: ImageSlot[];
  isGenerating: boolean;
}

const SUB_TABS = [
  { key: 'text-to-image', label: 'Text to Image', icon: Type },
  { key: 'image-to-image', label: 'Image to Image', icon: ArrowRightLeft },
  { key: 'image-editing', label: 'Image Editing', icon: Wand2 },
] as const;

type SubTab = (typeof SUB_TABS)[number]['key'];

const TAB_COLORS: Record<SubTab, { accent: string; ring: string; badge: string }> = {
  'text-to-image': { accent: 'text-[#FF6B00]', ring: 'bg-[#FF6B00]/10 border-[#FF6B00]/20', badge: 'bg-[#FF6B00]/80' },
  'image-to-image': { accent: 'text-teal-400', ring: 'bg-teal-500/10 border-teal-500/20', badge: 'bg-teal-500/80' },
  'image-editing': { accent: 'text-amber-400', ring: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/80' },
};

function ResultSkeletonCard({ elapsed }: { elapsed: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-dark-800 aspect-square">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 animate-pulse" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-[#FF6B00]/30 border-t-[#FF6B00] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#FF6B00]/60" />
          </div>
        </div>
        <p className="text-xs font-semibold text-white/70 animate-pulse">Generating</p>
        <p className="text-[11px] text-gray-500">{elapsed}s elapsed</p>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(95, (elapsed / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultImageCard({ url, onDownload }: { url: string; onDownload: () => void }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-square" style={{ animation: 'igFadeIn 0.5s ease-out' }}>
      <img src={url} alt="Result" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-sm font-medium hover:bg-white/25 transition-all border border-white/10"
        >
          <Download className="w-4 h-4" /> Download
        </button>
      </div>
    </div>
  );
}

export default function ImageGenerator() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('text-to-image');
  const [tabResults, setTabResults] = useState<Record<SubTab, TabResults>>({
    'text-to-image': { slots: [], isGenerating: false },
    'image-to-image': { slots: [], isGenerating: false },
    'image-editing': { slots: [], isGenerating: false },
  });

  const handleT2ISlotsChange = useCallback((slots: ImageSlot[], isGenerating: boolean) => {
    setTabResults((prev) => ({ ...prev, 'text-to-image': { slots, isGenerating } }));
  }, []);

  const handleI2ISlotsChange = useCallback((slots: ImageSlot[], isGenerating: boolean) => {
    setTabResults((prev) => ({ ...prev, 'image-to-image': { slots, isGenerating } }));
  }, []);

  const handleIedSlotsChange = useCallback((slots: ImageSlot[], isGenerating: boolean) => {
    setTabResults((prev) => ({ ...prev, 'image-editing': { slots, isGenerating } }));
  }, []);

  const hasAnyResults = (tab: SubTab) => {
    const r = tabResults[tab];
    return r.slots.some((s) => s.status === 'done' || s.status === 'generating' || s.status === 'failed');
  };

  const isTabGenerating = (tab: SubTab) => tabResults[tab].isGenerating;

  const handleDownload = (url: string, tab: SubTab) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-${tab}-${Date.now()}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resultTabs = SUB_TABS.filter((t) => hasAnyResults(t.key));

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes igFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes igPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div className="flex gap-1 p-1 bg-dark-900/60 rounded-xl border border-white/5">
        {SUB_TABS.map((tab) => {
          const generating = isTabGenerating(tab.key);
          const hasResults = hasAnyResults(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeSubTab === tab.key
                  ? tab.key === 'text-to-image'
                    ? 'gradient-orange text-white shadow-lg shadow-orange-500/20'
                    : tab.key === 'image-to-image'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {generating && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: tab.key === 'text-to-image' ? '#FF6B00' : tab.key === 'image-to-image' ? '#14b8a6' : '#f59e0b' }}
                  />
                  <span className="relative inline-flex rounded-full h-3 w-3"
                    style={{ backgroundColor: tab.key === 'text-to-image' ? '#FF6B00' : tab.key === 'image-to-image' ? '#14b8a6' : '#f59e0b' }}
                  />
                </span>
              )}
              {!generating && hasResults && activeSubTab !== tab.key && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-900" />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: activeSubTab === 'text-to-image' ? 'block' : 'none' }}>
        <TextToImage onSlotsChange={handleT2ISlotsChange} />
      </div>
      <div style={{ display: activeSubTab === 'image-to-image' ? 'block' : 'none' }}>
        <ImageToImage onSlotsChange={handleI2ISlotsChange} />
      </div>
      <div style={{ display: activeSubTab === 'image-editing' ? 'block' : 'none' }}>
        <ImageEditing onSlotsChange={handleIedSlotsChange} />
      </div>

      {resultTabs.length > 0 && (
        <div className="glass-card rounded-xl p-6 space-y-6">
          {resultTabs.map((tab) => {
            const { slots, isGenerating } = tabResults[tab.key];
            const completedCount = slots.filter((s) => s.status === 'done').length;
            const colors = TAB_COLORS[tab.key];
            return (
              <div key={tab.key}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <tab.icon className={`w-4 h-4 ${colors.accent}`} />
                      <h3 className="text-sm font-semibold text-gray-300">{tab.label}</h3>
                    </div>
                    {isGenerating && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors.ring}`}>
                        <Loader2 className={`w-3 h-3 animate-spin ${colors.accent}`} />
                        <span className={`text-[11px] font-medium ${colors.accent}`}>
                          {completedCount} / {slots.length} complete
                        </span>
                      </div>
                    )}
                    {!isGenerating && completedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                        {completedCount} done
                      </span>
                    )}
                  </div>
                  {activeSubTab !== tab.key && (
                    <button
                      onClick={() => setActiveSubTab(tab.key)}
                      className={`flex items-center gap-1.5 text-xs ${colors.accent} hover:opacity-80 transition-opacity`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Switch to tab
                    </button>
                  )}
                </div>

                <div className={`grid gap-4 ${slots.length === 1 ? 'grid-cols-1 max-w-sm' : slots.length === 2 ? 'grid-cols-2' : slots.length === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {slots.map((slot) => {
                    if (slot.status === 'generating') {
                      return <ResultSkeletonCard key={slot.index} elapsed={slot.elapsed} />;
                    }
                    if (slot.status === 'done' && slot.url) {
                      return (
                        <ResultImageCard
                          key={slot.index}
                          url={slot.url}
                          onDownload={() => handleDownload(slot.url!, tab.key)}
                        />
                      );
                    }
                    if (slot.status === 'failed') {
                      return (
                        <div key={slot.index} className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-dark-800 aspect-square flex flex-col items-center justify-center gap-2">
                          <ImageIcon className="w-8 h-8 text-red-400/40" />
                          <p className="text-xs text-red-400/60 font-medium">Failed</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageHistory />
    </div>
  );
}
