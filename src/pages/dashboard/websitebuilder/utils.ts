import * as LucideIcons from 'lucide-react';

export function getLucideIcon(name: string): React.FC<{ className?: string }> {
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[name];
  if (typeof Icon === 'function') return Icon as React.FC<{ className?: string }>;
  return LucideIcons.Layout as React.FC<{ className?: string }>;
}
