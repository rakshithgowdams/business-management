import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const LS_KEY = 'mfo_pwa_dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(LS_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] gradient-orange px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-white">
          <Download className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Install MyFinance OS on your phone</p>
            <p className="text-xs opacity-80">Access your business data offline, anytime</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80">
            <X className="w-4 h-4" />
          </button>
          <button onClick={handleInstall} className="px-4 py-1.5 rounded-lg bg-white text-orange-600 text-sm font-semibold hover:bg-white/90">
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
