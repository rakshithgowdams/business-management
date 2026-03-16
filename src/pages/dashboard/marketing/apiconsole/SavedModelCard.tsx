import { useState, useRef, useEffect } from 'react';
import { Trash2, ToggleLeft, ToggleRight, ChevronDown, Code, Image, Video, Music, Mic, Wand2, Play, Loader2, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { getApiKey } from '../../../../lib/apiKeys';
import { extractTaskId, parseMarketPoll, pollKieTask, kiePost } from '../../../../lib/marketing/kieApi';
import type { InputField } from '../../../../lib/marketing/curlParser';

interface CustomModel {
  id: string;
  name: string;
  model_id: string;
  category: string;
  endpoint: string;
  method: string;
  default_input: Record<string, unknown>;
  input_schema: InputField[];
  has_prompt: boolean;
  has_image_input: boolean;
  has_callback: boolean;
  original_curl: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  model: CustomModel;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onRename: (id: string, name: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  music: Music,
  voice: Mic,
  edit: Wand2,
};

const CATEGORY_COLORS: Record<string, string> = {
  image: 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20',
  video: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  music: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  voice: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  edit: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

export default function SavedModelCard({ model, onDelete, onToggle, onRename }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(model.name);
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editing]);

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === model.name) { setEditing(false); setEditName(model.name); return; }
    setSavingName(true);
    const { error } = await supabase
      .from('kie_custom_models')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', model.id);
    if (error) { toast.error('Failed to rename'); }
    else { onRename(model.id, trimmed); toast.success('Model renamed'); }
    setSavingName(false);
    setEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(model.name);
    setEditing(false);
  };

  const Icon = CATEGORY_ICONS[model.category] || Image;
  const colorClass = CATEGORY_COLORS[model.category] || CATEGORY_COLORS.image;

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    const { error } = await supabase.from('kie_custom_models').delete().eq('id', model.id);
    if (error) { toast.error('Failed to delete'); return; }
    onDelete(model.id);
    setConfirmDelete(false);
    toast.success('Model deleted');
  };

  const handleToggle = async () => {
    const { error } = await supabase
      .from('kie_custom_models')
      .update({ is_active: !model.is_active, updated_at: new Date().toISOString() })
      .eq('id', model.id);
    if (error) { toast.error('Failed to update'); return; }
    onToggle(model.id, !model.is_active);
  };

  const handleQuickTest = async () => {
    const apiKey = await getApiKey('kie_ai');
    if (!apiKey) { toast.error('Add your Kie.ai API key in Settings'); return; }

    setTesting(true);
    setTestResult(null);
    try {
      const body = { ...model.default_input };
      if (model.model_id) body.model = model.model_id;

      const data = await kiePost(model.endpoint, body as Record<string, unknown>, apiKey);
      const taskId = extractTaskId(data);
      if (taskId) {
        setTestResult(`Task created: ${taskId}`);
        const urls = await pollKieTask(
          '/api/v1/jobs/recordInfo',
          taskId,
          apiKey,
          parseMarketPoll,
          (msg) => setTestResult(msg),
          30
        );
        setTestResult(`Success: ${urls.length} result(s)`);
      } else {
        setTestResult(`Response: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setTesting(false);
  };

  const fieldCount = model.input_schema?.length || 0;

  return (
    <div className={`rounded-xl border transition-all ${model.is_active ? 'border-white/10 bg-dark-800/60' : 'border-white/5 bg-dark-900/40 opacity-60'}`}>
      <div className="flex items-center gap-4 p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') handleCancelRename(); }}
                className="flex-1 px-2 py-1 bg-dark-900 border border-[#FF6B00]/40 rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] min-w-0"
              />
              <button onClick={handleRename} disabled={savingName} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={handleCancelRename} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white truncate">{model.name}</h4>
              <button onClick={() => { setEditName(model.name); setEditing(true); }} className="text-gray-600 hover:text-[#FF6B00] transition-colors flex-shrink-0">
                <Pencil className="w-3 h-3" />
              </button>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
                {model.category}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{model.model_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickTest}
            disabled={testing || !model.is_active}
            className="px-2.5 py-1.5 rounded-lg bg-dark-700 border border-white/5 text-xs text-gray-400 hover:text-white hover:border-white/10 transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Test
          </button>
          <button onClick={handleToggle} className="text-gray-500 hover:text-white transition-colors">
            {model.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-dark-900/80 border border-white/5">
          <p className="text-xs text-gray-400 font-mono break-all">{testResult}</p>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Endpoint</p>
              <p className="text-xs text-gray-300 font-mono">{model.endpoint}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Method</p>
              <p className="text-xs text-gray-300 font-mono">{model.method}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fields</p>
              <p className="text-xs text-gray-300">{fieldCount} parameters</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Features</p>
              <div className="flex gap-1">
                {model.has_prompt && <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#FF6B00]/10 text-[#FF6B00] font-medium">Prompt</span>}
                {model.has_image_input && <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 font-medium">Image</span>}
                {model.has_callback && <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-medium">Callback</span>}
              </div>
            </div>
          </div>

          {model.input_schema && model.input_schema.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Input Parameters</p>
              <div className="space-y-1">
                {model.input_schema.map((f: InputField, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-dark-900/50">
                    <span className="text-xs text-gray-300 font-mono flex-1">{f.path}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-dark-700 text-gray-400">{f.type}</span>
                    <span className="text-[10px] text-gray-500 max-w-[200px] truncate">
                      {typeof f.value === 'string' ? f.value : JSON.stringify(f.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {model.notes && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-gray-400">{model.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowCurl(!showCurl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Code className="w-3 h-3" />
              {showCurl ? 'Hide' : 'View'} cURL
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-400">Delete this model?</span>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/30 font-semibold transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-dark-700 border border-white/10 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 border border-red-500/10 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {showCurl && (
            <pre className="p-3 rounded-lg bg-dark-900 border border-white/5 text-[11px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {model.original_curl}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
