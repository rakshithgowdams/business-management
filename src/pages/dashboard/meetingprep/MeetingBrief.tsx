import { useState } from 'react';
import { Download, Copy, Save, CheckCircle, FileDown, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportMeetingPrepPDF, exportMeetingPrepWord } from '../../../lib/meetingPrepExport';

export interface BriefData {
  CLIENT_SNAPSHOT: string[];
  RELATIONSHIP_STATUS: string;
  LAST_DISCUSSED: string;
  PAIN_POINTS: string[];
  BUYING_SIGNALS: string[];
  TALKING_POINTS: string[];
  OBJECTIONS: { objection: string; handling: string }[];
  CLOSE_STRATEGY: string;
  UPSELL_OPPORTUNITY: string;
  DANGER_ZONE: string;
  OPENING_LINE: string;
  SUCCESS_METRIC: string;
}

interface Props {
  brief: BriefData;
  clientName: string;
  meetingType: string;
  date?: string;
  generationTime: number;
  onSave: () => void;
  businessLogoUrl?: string;
}

const TABS = ['Client Overview', 'Strategy', 'Handle Objections', 'Quick Reference'] as const;
type TabType = typeof TABS[number];

export default function MeetingBrief({ brief, clientName, meetingType, date, generationTime, onSave, businessLogoUrl }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('Client Overview');
  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportData = { brief, clientName, meetingType, date, businessLogoUrl };

  const handleExportPDF = async () => {
    setExporting(true);
    setExportOpen(false);
    try {
      await exportMeetingPrepPDF(exportData);
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = () => {
    setExportOpen(false);
    exportMeetingPrepWord(exportData);
  };

  const handleSave = () => {
    onSave();
    setSaved(true);
    toast.success('Brief saved to history');
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'Client Overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Client Snapshot</h3>
              <ul className="space-y-1.5">
                {brief.CLIENT_SNAPSHOT.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-brand-400 mt-1 shrink-0">&#8226;</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-1">Relationship Status</h3>
              <p className="text-sm text-gray-200">{brief.RELATIONSHIP_STATUS}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-1">Last Discussed</h3>
              <p className="text-sm text-gray-200">{brief.LAST_DISCUSSED}</p>
            </div>
          </div>
        )}

        {activeTab === 'Strategy' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Talking Points</h3>
              <div className="space-y-2">
                {brief.TALKING_POINTS.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-white/5">
                    <span className="text-brand-400 font-bold text-sm shrink-0">{i + 1}.</span>
                    <p className="text-sm text-gray-200">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-emerald-500/20">
              <h3 className="text-xs font-semibold text-emerald-400 mb-1">Close Strategy</h3>
              <p className="text-sm text-gray-200">{brief.CLOSE_STRATEGY}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-orange-500/20">
              <h3 className="text-xs font-semibold text-orange-400 mb-1">Upsell Opportunity</h3>
              <p className="text-sm text-gray-200">{brief.UPSELL_OPPORTUNITY}</p>
            </div>
          </div>
        )}

        {activeTab === 'Handle Objections' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Pain Points</h3>
              <ul className="space-y-1.5">
                {brief.PAIN_POINTS.map((p, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">&#9679;</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500">Likely Objections</h3>
              {brief.OBJECTIONS.map((o, i) => (
                <div key={i} className="glass-card rounded-xl p-4 border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-400 mb-1">"{o.objection}"</p>
                  <p className="text-sm text-gray-300">Handle: {o.handling}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Quick Reference' && (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 border border-brand-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-brand-400 mb-1">Opening Line</h3>
                  <p className="text-sm text-gray-200 italic">"{brief.OPENING_LINE}"</p>
                </div>
                <button onClick={() => handleCopy(brief.OPENING_LINE)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Top 3 Talking Points</h3>
              {brief.TALKING_POINTS.slice(0, 3).map((p, i) => (
                <p key={i} className="text-sm text-gray-300 mb-1">{i + 1}. {p}</p>
              ))}
            </div>
            <div className="glass-card rounded-xl p-4 border border-red-500/20">
              <h3 className="text-xs font-semibold text-red-400 mb-1">Danger Zone</h3>
              <p className="text-sm text-gray-200">{brief.DANGER_ZONE}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border border-emerald-500/20">
              <h3 className="text-xs font-semibold text-emerald-400 mb-1">Success Metric</h3>
              <p className="text-sm text-gray-200">{brief.SUCCESS_METRIC}</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] text-gray-600 bg-dark-700 px-2 py-1 rounded-full">
          Generated by Gemini 2.5 Flash in {(generationTime / 1000).toFixed(1)}s
        </span>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={exporting}
              className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-1.5"
            >
              {exporting ? <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl border border-white/10 bg-dark-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-red-400" />
                  Export as PDF
                </button>
                <div className="border-t border-white/5" />
                <button
                  onClick={handleExportWord}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  Export as Word
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
