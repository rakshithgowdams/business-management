import { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, RotateCcw } from 'lucide-react';
import { INVOICE_THEMES, type InvoiceTheme } from '../lib/invoiceThemes';

interface ThemeSelectorProps {
  selected: string;
  onChange: (id: string) => void;
  customTheme?: Partial<InvoiceTheme> | null;
  onCustomThemeChange?: (overrides: Partial<InvoiceTheme> | null) => void;
}

const colorMap: Record<string, string> = {
  'classic-bw': 'bg-gradient-to-br from-gray-800 to-gray-500',
  'ocean-blue': 'bg-gradient-to-br from-blue-800 to-blue-400',
  'emerald-green': 'bg-gradient-to-br from-emerald-800 to-emerald-400',
  'sunset-orange': 'bg-gradient-to-br from-orange-700 to-orange-400',
  'royal-teal': 'bg-gradient-to-br from-teal-700 to-teal-400',
  'crimson-red': 'bg-gradient-to-br from-red-800 to-red-500',
  'corporate-navy': 'bg-gradient-to-br from-slate-900 to-slate-700',
  'rose-gold': 'bg-gradient-to-br from-amber-900 to-amber-600',
  'slate-minimal': 'bg-gradient-to-br from-gray-200 to-white border border-gray-300',
  'forest-green': 'bg-gradient-to-br from-green-900 to-green-700',
};

const COLOR_FIELDS: { key: keyof InvoiceTheme; label: string; group: string }[] = [
  { key: 'headerText', label: 'Header Text', group: 'Header' },
  { key: 'headerSubText', label: 'Header Sub Text', group: 'Header' },
  { key: 'accentColor', label: 'Accent Color', group: 'Accents' },
  { key: 'accentLight', label: 'Accent Light BG', group: 'Accents' },
  { key: 'accentBorder', label: 'Accent Border', group: 'Accents' },
  { key: 'tableHeaderText', label: 'Table Header Text', group: 'Table' },
  { key: 'tableBg', label: 'Table Row BG', group: 'Table' },
  { key: 'tableAltBg', label: 'Table Alt Row BG', group: 'Table' },
  { key: 'bodyBg', label: 'Page Background', group: 'Body' },
  { key: 'bodyText', label: 'Body Text', group: 'Body' },
  { key: 'bodySubText', label: 'Sub Text', group: 'Body' },
  { key: 'labelColor', label: 'Label Color', group: 'Body' },
  { key: 'totalColor', label: 'Total Amount Color', group: 'Body' },
  { key: 'borderColor', label: 'Border Color', group: 'Body' },
  { key: 'cardBg', label: 'Card Background', group: 'Cards' },
  { key: 'cardBorder', label: 'Card Border', group: 'Cards' },
  { key: 'footerBorder', label: 'Footer Border', group: 'Cards' },
];

const GRADIENT_FIELDS: { key: keyof InvoiceTheme; label: string }[] = [
  { key: 'headerBg', label: 'Header Background' },
  { key: 'tableHeaderBg', label: 'Table Header Background' },
];

const isGradient = (v: string) => v.includes('gradient') || v.includes('linear');

function extractGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9A-Fa-f]{6}/g);
  return [matches?.[0] || '#1F2937', matches?.[1] || '#374151'];
}

function buildGradient(c1: string, c2: string) {
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
}

export default function ThemeSelector({ selected, onChange, customTheme, onCustomThemeChange }: ThemeSelectorProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const baseTheme = INVOICE_THEMES.find((t) => t.id === selected) || INVOICE_THEMES[0];
  const merged: InvoiceTheme = { ...baseTheme, ...(customTheme || {}) };
  const hasCustomizations = customTheme && Object.keys(customTheme).length > 0;

  const updateColor = (key: keyof InvoiceTheme, value: string) => {
    if (!onCustomThemeChange) return;
    onCustomThemeChange({ ...(customTheme || {}), [key]: value });
  };

  const updateGradient = (key: keyof InvoiceTheme, colorIndex: 0 | 1, value: string) => {
    if (!onCustomThemeChange) return;
    const current = (merged[key] as string) || '';
    const [c1, c2] = extractGradientColors(current);
    const newGrad = colorIndex === 0 ? buildGradient(value, c2) : buildGradient(c1, value);
    onCustomThemeChange({ ...(customTheme || {}), [key]: newGrad });
  };

  const resetCustomizations = () => {
    if (onCustomThemeChange) onCustomThemeChange(null);
  };

  const groups = Array.from(new Set(COLOR_FIELDS.map((f) => f.group)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {INVOICE_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => { onChange(theme.id); }}
            className={`flex flex-col items-center gap-1.5 transition-all ${selected === theme.id ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
          >
            <div className={`w-12 h-12 rounded-lg ${colorMap[theme.id] || 'bg-gray-600'} ${selected === theme.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]' : ''}`} />
            <span className={`text-[10px] font-medium ${selected === theme.id ? 'text-white' : 'text-gray-500'}`}>{theme.name}</span>
          </button>
        ))}
      </div>

      {onCustomThemeChange && (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCustomizer((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-sm font-medium text-gray-300">Custom Colors</span>
              {hasCustomizations && (
                <span className="text-[9px] bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded-full">
                  {Object.keys(customTheme!).length} override{Object.keys(customTheme!).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasCustomizations && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); resetCustomizations(); }}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
              {showCustomizer ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </button>

          {showCustomizer && (
            <div className="px-4 pb-4 space-y-5 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {GRADIENT_FIELDS.map((field) => {
                  const currentVal = (merged[field.key] as string) || '';
                  const isGrad = isGradient(currentVal);
                  const [c1, c2] = isGrad ? extractGradientColors(currentVal) : [currentVal, currentVal];
                  return (
                    <div key={field.key}>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{field.label}</p>
                      <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl border border-white/10">
                        <div className="flex-1">
                          <div className="h-8 rounded-lg mb-2" style={{ background: currentVal }} />
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: c1 }} />
                              <input
                                type="color"
                                value={c1}
                                onChange={(e) => isGrad ? updateGradient(field.key, 0, e.target.value) : updateColor(field.key, e.target.value)}
                                className="w-6 h-6 cursor-pointer rounded border-0 bg-transparent"
                                title="Start color"
                              />
                              <span className="text-[10px] text-gray-500">Start</span>
                            </div>
                            {isGrad && (
                              <div className="flex items-center gap-1.5 ml-2">
                                <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: c2 }} />
                                <input
                                  type="color"
                                  value={c2}
                                  onChange={(e) => updateGradient(field.key, 1, e.target.value)}
                                  className="w-6 h-6 cursor-pointer rounded border-0 bg-transparent"
                                  title="End color"
                                />
                                <span className="text-[10px] text-gray-500">End</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {groups.map((group) => (
                <div key={group}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-semibold border-b border-white/5 pb-1.5">{group}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COLOR_FIELDS.filter((f) => f.group === group).map((field) => {
                      const currentVal = (merged[field.key] as string) || '#000000';
                      const isOverridden = customTheme && field.key in customTheme;
                      return (
                        <div key={field.key} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${isOverridden ? 'border-[#FF6B00]/30 bg-[#FF6B00]/5' : 'border-white/5 bg-dark-800'}`}>
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: currentVal }} />
                            <input
                              type="color"
                              value={currentVal.startsWith('#') ? currentVal : '#000000'}
                              onChange={(e) => updateColor(field.key, e.target.value)}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              title={field.label}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 leading-tight truncate">{field.label}</p>
                            <p className={`text-[9px] font-mono ${isOverridden ? 'text-[#FF6B00]' : 'text-gray-600'}`}>{currentVal.startsWith('#') ? currentVal.toUpperCase() : 'custom'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-gray-600 text-center pt-2">Click on any color swatch to open the color picker</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
