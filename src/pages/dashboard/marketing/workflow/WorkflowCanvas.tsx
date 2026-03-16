import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, FolderOpen, Play, ZoomIn, ZoomOut, Maximize2, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { WORKFLOW_NODE_TYPES, WORKFLOW_TEMPLATES } from '../../../../lib/marketing/constants';
import type { WorkflowNode, WorkflowConnection, SavedWorkflow } from '../../../../lib/marketing/types';
import WorkflowNodeComponent from './WorkflowNode';
import WorkflowToolbar from './WorkflowToolbar';
import WorkflowConnections from './WorkflowConnections';

export default function WorkflowCanvas() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [zoom, setZoom] = useState(100);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    if (user) loadSavedWorkflows();
  }, [user]);

  const loadSavedWorkflows = async () => {
    const { data } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    setSavedWorkflows((data as SavedWorkflow[]) || []);
  };

  const addNode = useCallback((type: string) => {
    const nodeDef = WORKFLOW_NODE_TYPES.find((n) => n.type === type);
    if (!nodeDef) return;

    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      type,
      category: nodeDef.category,
      label: nodeDef.label,
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      config: {},
      status: 'empty',
    };
    setNodes((prev) => [...prev, newNode]);
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromNode !== id && c.toNode !== id));
  }, []);

  const updateNode = useCallback((id: string, patch: Partial<WorkflowNode>) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch } : n));
  }, []);

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoom / 100;
    setDragging({
      nodeId,
      offsetX: (e.clientX - rect.left) / scale - node.x,
      offsetY: (e.clientY - rect.top) / scale - node.y,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom / 100;
    const x = (e.clientX - rect.left) / scale - dragging.offsetX;
    const y = (e.clientY - rect.top) / scale - dragging.offsetY;
    updateNode(dragging.nodeId, { x: Math.max(0, x), y: Math.max(0, y) });
  }, [dragging, zoom, updateNode]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const startConnect = (nodeId: string) => {
    if (connecting) {
      if (connecting !== nodeId) {
        const exists = connections.some((c) => c.fromNode === connecting && c.toNode === nodeId);
        if (!exists) {
          setConnections((prev) => [...prev, { id: crypto.randomUUID(), fromNode: connecting, toNode: nodeId }]);
        }
      }
      setConnecting(null);
    } else {
      setConnecting(nodeId);
    }
  };

  const removeConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    if (!user) return;
    const name = prompt('Workflow name:');
    if (!name) return;

    await supabase.from('workflow_templates').insert({
      user_id: user.id,
      name,
      description: '',
      nodes,
      connections,
      is_template: false,
    });
    toast.success('Workflow saved');
    loadSavedWorkflows();
  };

  const handleLoad = (workflow: SavedWorkflow) => {
    setNodes(workflow.nodes);
    setConnections(workflow.connections);
    setShowSaved(false);
    toast.success(`Loaded: ${workflow.name}`);
  };

  const loadTemplate = (templateKey: string) => {
    const templateNodes: WorkflowNode[] = [];
    const templateConns: WorkflowConnection[] = [];

    const templates: Record<string, { nodes: { type: string; x: number; y: number }[]; conns: [number, number][] }> = {
      photo_to_cinematic: {
        nodes: [
          { type: 'image_upload', x: 50, y: 150 },
          { type: 'ai_enhance', x: 300, y: 150 },
          { type: 'image_generate', x: 550, y: 100 },
          { type: 'video_generate', x: 550, y: 250 },
          { type: 'save_gallery', x: 800, y: 150 },
        ],
        conns: [[0, 1], [1, 2], [2, 3], [3, 4]],
      },
      concept_to_carousel: {
        nodes: [
          { type: 'text_prompt', x: 50, y: 150 },
          { type: 'ai_enhance', x: 300, y: 150 },
          { type: 'variations', x: 550, y: 150 },
          { type: 'save_gallery', x: 800, y: 150 },
        ],
        conns: [[0, 1], [1, 2], [2, 3]],
      },
      sketch_to_design: {
        nodes: [
          { type: 'image_upload', x: 50, y: 150 },
          { type: 'style_transfer', x: 300, y: 100 },
          { type: 'upscale', x: 300, y: 250 },
          { type: 'download', x: 550, y: 150 },
        ],
        conns: [[0, 1], [0, 2], [1, 3], [2, 3]],
      },
      photo_to_character: {
        nodes: [
          { type: 'image_upload', x: 50, y: 150 },
          { type: 'character_node', x: 300, y: 150 },
          { type: 'image_generate', x: 550, y: 150 },
          { type: 'save_gallery', x: 800, y: 150 },
        ],
        conns: [[0, 1], [1, 2], [2, 3]],
      },
      product_to_ad: {
        nodes: [
          { type: 'image_upload', x: 50, y: 100 },
          { type: 'text_prompt', x: 50, y: 250 },
          { type: 'image_generate', x: 350, y: 150 },
          { type: 'variations', x: 600, y: 150 },
          { type: 'download', x: 850, y: 150 },
        ],
        conns: [[0, 2], [1, 2], [2, 3], [3, 4]],
      },
    };

    const tmpl = templates[templateKey];
    if (!tmpl) return;

    tmpl.nodes.forEach((n) => {
      const def = WORKFLOW_NODE_TYPES.find((d) => d.type === n.type);
      if (!def) return;
      templateNodes.push({
        id: crypto.randomUUID(),
        type: n.type,
        category: def.category,
        label: def.label,
        x: n.x,
        y: n.y,
        config: {},
        status: 'empty',
      });
    });

    tmpl.conns.forEach(([from, to]) => {
      if (templateNodes[from] && templateNodes[to]) {
        templateConns.push({ id: crypto.randomUUID(), fromNode: templateNodes[from].id, toNode: templateNodes[to].id });
      }
    });

    setNodes(templateNodes);
    setConnections(templateConns);
    toast.success('Template loaded');
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    for (const node of nodes) {
      updateNode(node.id, { status: 'running' });
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
      updateNode(node.id, { status: 'complete' });
    }
    setRunningAll(false);
    toast.success('Workflow complete');
  };

  const handleClear = () => {
    setNodes([]);
    setConnections([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Visual Workflow Canvas</h2>
            <p className="text-xs text-gray-400">Build multi-step content pipelines with nodes</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-dark-800 rounded-xl border border-white/5 overflow-x-auto">
        <button onClick={() => setShowToolbar(!showToolbar)} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#059669]/20 text-emerald-400 hover:bg-[#059669]/30 transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Node
        </button>
        <button onClick={handleClear} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
        <button onClick={handleSave} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={() => setShowSaved(!showSaved)} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" /> Load
        </button>
        <button
          onClick={handleRunAll}
          disabled={runningAll || nodes.length === 0}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#059669] to-[#10B981] text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Play className="w-3.5 h-3.5" /> Run All
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(50, z - 25))} className="p-1.5 rounded text-gray-500 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(150, z + 25))} className="p-1.5 rounded text-gray-500 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => setZoom(100)} className="p-1.5 rounded text-gray-500 hover:text-white"><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {showSaved && savedWorkflows.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Saved Workflows</h4>
          <div className="flex flex-wrap gap-2">
            {savedWorkflows.map((w) => (
              <button key={w.id} onClick={() => handleLoad(w)} className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-gray-300 text-xs hover:border-emerald-500/30 hover:text-white transition-all">
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {showToolbar && (
          <WorkflowToolbar
            onAddNode={addNode}
            onLoadTemplate={loadTemplate}
          />
        )}

        <div
          ref={canvasRef}
          className="flex-1 relative bg-[#0a0a0f] rounded-xl border border-white/5 overflow-hidden"
          style={{
            minHeight: '500px',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
            <WorkflowConnections
              nodes={nodes}
              connections={connections}
              connecting={connecting}
              onRemoveConnection={removeConnection}
            />

            {nodes.map((node) => (
              <WorkflowNodeComponent
                key={node.id}
                node={node}
                isConnecting={connecting === node.id}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onConnect={() => startConnect(node.id)}
                onRemove={() => removeNode(node.id)}
                onUpdate={(patch) => updateNode(node.id, patch)}
              />
            ))}

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Add nodes from the toolbar or load a template</p>
                  <p className="text-gray-700 text-xs mt-1">Click "Add Node" to start building your pipeline</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick-Start Templates</h4>
        <div className="flex flex-wrap gap-2">
          {WORKFLOW_TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => loadTemplate(t.key)}
              className="px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-gray-300 text-xs font-medium hover:border-emerald-500/30 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
