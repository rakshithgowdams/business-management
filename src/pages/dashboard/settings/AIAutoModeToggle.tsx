import { useState, useEffect } from 'react';
import { isSmartAutoEnabled, setSmartAutoEnabled as saveSmartAuto } from '../../../lib/ai/models';

interface Props {
  onChange: (enabled: boolean) => void;
}

export default function AIAutoModeToggle({ onChange }: Props) {
  const [enabled, setEnabled] = useState(isSmartAutoEnabled);

  useEffect(() => {
    saveSmartAuto(enabled);
    onChange(enabled);
  }, [enabled, onChange]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🤖</span>
            <h2 className="text-lg font-semibold text-white">Smart Auto Mode</h2>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
            {enabled
              ? 'ON -- App picks best model per task automatically (recommended)'
              : 'OFF -- Uses YOUR custom selections above'}
          </p>
          <p className="text-[11px] text-gray-600 mt-2">
            💡 Keep ON for best results. Switch OFF to control costs.
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${
            enabled ? 'bg-brand-600' : 'bg-dark-500'
          }`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
