import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat2, Settings, Plus } from 'lucide-react';
import ErrorBoundary from '../../../components/ErrorBoundary';
import FollowUpDashboard from './FollowUpDashboard';
import FollowUpList, { type FollowUpItem } from './FollowUpList';
import MessagePreviewModal from './MessagePreviewModal';
import SequenceBuilder from './SequenceBuilder';
import FollowUpHistory from './FollowUpHistory';

export default function FollowUps() {
  const navigate = useNavigate();
  const [previewItem, setPreviewItem] = useState<FollowUpItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePreview = (item: FollowUpItem) => {
    setPreviewItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewItem(null);
  };

  const handleSent = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const scrollToSequences = () => {
    setTimeout(() => {
      document.getElementById('sequence-builder')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
              <Repeat2 className="w-5 h-5 text-white" />
            </div>
            Auto Follow-up Engine
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 ml-[52px]">
            Never miss a follow-up. AI-powered messages across WhatsApp, Email, and LinkedIn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToSequences}
            className="px-4 py-2 text-xs font-semibold rounded-xl gradient-orange text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Create Sequence
          </button>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>

      <ErrorBoundary fallbackMessage="Failed to load dashboard stats.">
        <FollowUpDashboard refreshKey={refreshKey} />
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Failed to load follow-up list.">
        <FollowUpList onPreview={handlePreview} />
      </ErrorBoundary>

      <MessagePreviewModal
        item={previewItem}
        open={modalOpen}
        onClose={handleCloseModal}
        onSent={handleSent}
      />

      <ErrorBoundary fallbackMessage="Failed to load sequences.">
        <div id="sequence-builder">
          <SequenceBuilder />
        </div>
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Failed to load follow-up history.">
        <FollowUpHistory refreshKey={refreshKey} />
      </ErrorBoundary>
    </div>
  );
}
