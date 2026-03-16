import { WORKFLOW_NODE_TYPES } from '../../../../lib/marketing/constants';

interface Props {
  onAddNode: (type: string) => void;
  onLoadTemplate: (key: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  input: { label: 'Input Nodes', color: '#1E40AF' },
  process: { label: 'Process Nodes', color: '#FF6B00' },
  output: { label: 'Output Nodes', color: '#059669' },
  utility: { label: 'Utility Nodes', color: '#7C3AED' },
};

const CATEGORY_ICONS: Record<string, string> = {
  text_prompt: '📝',
  image_upload: '📸',
  character_node: '🎭',
  url_input: '🌐',
  image_generate: '🖼️',
  video_generate: '🎬',
  image_edit: '✏️',
  upscale: '🔍',
  remove_bg: '✂️',
  style_transfer: '🔄',
  download: '📥',
  publish_ig: '📤',
  save_gallery: '💾',
  export_package: '📧',
  ai_enhance: '🤖',
  variations: '🔀',
  ab_compare: '🧪',
  quality_check: '📊',
};

export default function WorkflowToolbar({ onAddNode }: Props) {
  const categories = ['input', 'process', 'output', 'utility'] as const;

  return (
    <div className="w-52 shrink-0 space-y-3">
      {categories.map((cat) => {
        const info = CATEGORY_LABELS[cat];
        const catNodes = WORKFLOW_NODE_TYPES.filter((n) => n.category === cat);

        return (
          <div key={cat} className="glass-card rounded-xl p-3">
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: info.color }}
            >
              {info.label}
            </p>
            <div className="space-y-1">
              {catNodes.map((node) => (
                <button
                  key={node.type}
                  onClick={() => onAddNode(node.type)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                  <span className="text-sm">{CATEGORY_ICONS[node.type] || '◇'}</span>
                  <span>{node.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
