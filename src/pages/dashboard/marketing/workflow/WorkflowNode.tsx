import { X, Play, Link } from 'lucide-react';
import { WORKFLOW_NODE_TYPES } from '../../../../lib/marketing/constants';
import type { WorkflowNode as WNode } from '../../../../lib/marketing/types';

interface Props {
  node: WNode;
  isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onConnect: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<WNode>) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  text_prompt: '📝', image_upload: '📸', character_node: '🎭', url_input: '🌐',
  image_generate: '🖼️', video_generate: '🎬', image_edit: '✏️', upscale: '🔍',
  remove_bg: '✂️', style_transfer: '🔄', download: '📥', publish_ig: '📤',
  save_gallery: '💾', export_package: '📧', ai_enhance: '🤖', variations: '🔀',
  ab_compare: '🧪', quality_check: '📊',
};

const STATUS_COLORS: Record<string, string> = {
  empty: 'bg-gray-600',
  ready: 'bg-yellow-500',
  running: 'bg-orange-500 animate-pulse',
  complete: 'bg-emerald-500',
  error: 'bg-red-500',
};

export default function WorkflowNodeComponent({ node, isConnecting, onMouseDown, onConnect, onRemove, onUpdate }: Props) {
  const nodeDef = WORKFLOW_NODE_TYPES.find((n) => n.type === node.type);
  const color = nodeDef?.color || '#666';

  return (
    <div
      className="absolute group"
      style={{ left: node.x, top: node.y, width: 200 }}
      onMouseDown={onMouseDown}
    >
      <div
        className={`rounded-xl border-2 bg-[#13131f] transition-all cursor-move ${
          isConnecting ? 'border-emerald-400 shadow-lg shadow-emerald-400/20' : 'border-white/10 hover:border-white/20'
        }`}
        style={{ borderColor: isConnecting ? undefined : `${color}40` }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 rounded-t-[10px]"
          style={{ background: `${color}15` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{CATEGORY_ICONS[node.type] || '◇'}</span>
            <span className="text-xs font-semibold text-white truncate">{node.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[node.status]}`} />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-500 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="px-3 py-2.5">
          {node.type === 'text_prompt' && (
            <textarea
              value={(node.config.text as string) || ''}
              onChange={(e) => { e.stopPropagation(); onUpdate({ config: { ...node.config, text: e.target.value }, status: e.target.value ? 'ready' : 'empty' }); }}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Enter prompt..."
              rows={2}
              className="w-full bg-dark-800 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-white/20 resize-none"
            />
          )}

          {node.type === 'url_input' && (
            <input
              type="text"
              value={(node.config.url as string) || ''}
              onChange={(e) => { e.stopPropagation(); onUpdate({ config: { ...node.config, url: e.target.value }, status: e.target.value ? 'ready' : 'empty' }); }}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Enter URL..."
              className="w-full bg-dark-800 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-white/20"
            />
          )}

          {node.output && (
            <div className="mt-1">
              <img src={node.output} alt="Output" className="w-full h-16 object-cover rounded border border-white/5" />
            </div>
          )}

          {!['text_prompt', 'url_input'].includes(node.type) && !node.output && (
            <p className="text-[10px] text-gray-600">{node.status === 'complete' ? 'Done' : node.status === 'running' ? 'Processing...' : 'Waiting for input'}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5">
          <button
            onClick={(e) => { e.stopPropagation(); onConnect(); }}
            className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
              isConnecting ? 'text-emerald-400' : 'text-gray-600 hover:text-emerald-400'
            }`}
          >
            <Link className="w-3 h-3" /> {isConnecting ? 'Click target' : 'Connect'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ status: 'running' }); setTimeout(() => onUpdate({ status: 'complete' }), 1500); }}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-600 hover:text-emerald-400 transition-colors"
          >
            <Play className="w-3 h-3" /> Run
          </button>
        </div>
      </div>
    </div>
  );
}
