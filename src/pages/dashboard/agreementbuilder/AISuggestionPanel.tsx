import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Wand2, RotateCcw } from 'lucide-react';
import type { SuggestionOption } from '../../../lib/agreementBuilder/suggestions';
import { callAI, hasApiKey } from '../../../lib/ai/api';
import toast from 'react-hot-toast';

interface Props {
  label: string;
  staticSuggestions: SuggestionOption[];
  fieldContext: string;
  currentValue?: string;
  onSelect: (text: string) => void;
}

export default function AISuggestionPanel({ label, staticSuggestions, fieldContext, currentValue, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  const parseAIResponse = (res: { data: Record<string, unknown> | null; error: string | null }) => {
    if (res.error) {
      toast.error(res.error);
      return [];
    }
    if (res.data && Array.isArray(res.data)) {
      return (res.data as string[]).filter((s) => typeof s === 'string').slice(0, 3);
    }
    if (res.data && typeof res.data === 'object') {
      const vals = Object.values(res.data).filter((v) => typeof v === 'string') as string[];
      if (vals.length > 0) return vals.slice(0, 3);
      const nested = Object.values(res.data);
      const flatStrings: string[] = [];
      for (const v of nested) {
        if (typeof v === 'string') flatStrings.push(v);
        else if (typeof v === 'object' && v !== null) {
          const inner = Object.values(v as Record<string, unknown>).find((x) => typeof x === 'string');
          if (inner) flatStrings.push(inner as string);
        }
      }
      return flatStrings.slice(0, 3);
    }
    return [];
  };

  const handleAISuggest = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const keyAvailable = await hasApiKey();
      if (!keyAvailable) {
        toast('Add your AI API key in Settings to use AI suggestions', { icon: '\u26A0\uFE0F' });
        setLoading(false);
        return;
      }
      const prompt = `You are an expert legal agreement writer. Generate 3 professional "${label}" clauses for a business service agreement.

Context: ${fieldContext}

Requirements:
- Each option should be detailed, professional, and legally sound
- Use clear, formal language suitable for Indian business contracts
- Include specific terms, conditions, and measurable deliverables where applicable
- Each option should offer a different style (concise, detailed, comprehensive)

Return ONLY a JSON array of exactly 3 strings. No explanation, no markdown. Example: ["option1", "option2", "option3"]`;

      const res = await callAI(prompt, true, 'proposal_writing');
      const options = parseAIResponse(res);
      if (options.length > 0) {
        setAiOptions(options);
      } else {
        toast.error('No suggestions generated. Try again.');
      }
    } catch {
      toast.error('AI suggestion failed');
    }
    setLoading(false);
  };

  const handleRefine = async () => {
    if (!currentValue?.trim()) {
      toast.error('Write some content first, then refine it with AI');
      return;
    }
    setRefineLoading(true);
    setOpen(true);
    try {
      const keyAvailable = await hasApiKey();
      if (!keyAvailable) {
        toast('Add your AI API key in Settings', { icon: '\u26A0\uFE0F' });
        setRefineLoading(false);
        return;
      }
      const prompt = `You are an expert legal agreement writer. Improve and refine this "${label}" clause for a professional business agreement.

Current text:
"""
${currentValue}
"""

Context: ${fieldContext}

Generate 3 improved versions:
1. A polished version keeping the same structure but improving language
2. A more detailed version with additional legal protections
3. A concise professional version

Return ONLY a JSON array of exactly 3 strings. No explanation, no markdown.`;

      const res = await callAI(prompt, true, 'proposal_writing');
      const options = parseAIResponse(res);
      if (options.length > 0) {
        setAiOptions(options);
        toast.success('Refined suggestions ready');
      } else {
        toast.error('Refinement failed. Try again.');
      }
    } catch {
      toast.error('AI refinement failed');
    }
    setRefineLoading(false);
  };

  const handleSelect = (text: string) => {
    onSelect(text);
    setOpen(false);
    toast.success('Applied');
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleAISuggest}
          disabled={loading || refineLoading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#e05500] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Generate
        </button>
        {currentValue?.trim() && (
          <button
            type="button"
            onClick={handleRefine}
            disabled={loading || refineLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FF6B00]/10 transition-colors disabled:opacity-50"
          >
            {refineLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Refine with AI
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {staticSuggestions.length} templates
        </button>
        {aiOptions.length > 0 && (
          <button
            type="button"
            onClick={() => { setAiOptions([]); }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Clear AI
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto rounded-xl border border-[#1e1e2e] bg-[#0d0d1a] p-3">
          {aiOptions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-[#FF6B00] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Generated
              </p>
              {aiOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#FF6B00]/20 transition-all mb-1.5"
                >
                  <span className="text-[10px] font-bold text-[#FF6B00]">Option {i + 1}</span>
                  <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{opt.slice(0, 300)}{opt.length > 300 ? '...' : ''}</p>
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Templates</p>
          {staticSuggestions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(opt.text)}
              className="w-full text-left p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#FF6B00]/20 transition-all"
            >
              <span className="text-[10px] font-bold text-[#FF6B00]">{opt.label}</span>
              <p className="text-xs text-gray-400 mt-1 line-clamp-3">{opt.text.slice(0, 180)}{opt.text.length > 180 ? '...' : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
