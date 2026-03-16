import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { callVisionModel, parseJSON } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { formatINR } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

interface ExtractedData {
  vendor_name: string | null;
  amount_total: number | null;
  date: string | null;
  category: string | null;
  items: { name: string; amount: number }[] | null;
  gst_amount: number | null;
  payment_method: string | null;
  confidence: 'high' | 'medium' | 'low';
}

const CATEGORIES = [
  'Tools & Software', 'Ads & Marketing', 'Team & HR', 'Travel', 'Office',
  'Client Project', 'Food', 'Personal', 'EMI', 'Tax', 'Other',
];

const RECEIPT_PROMPT = `You are an expert receipt/invoice OCR scanner. Carefully read every detail from this receipt or bill image.

Extract the following information and return ONLY a valid JSON object:

{
  "vendor_name": "Full store/business name exactly as printed",
  "amount_total": 0,
  "date": "YYYY-MM-DD",
  "category": "Food | Transport | Software | Office | Marketing | Utilities | Entertainment | Medical | Groceries | Electronics | Other",
  "items": [{"name": "item description", "amount": 123.45}],
  "gst_amount": 0,
  "payment_method": "Cash | Card | UPI | Bank | Online",
  "confidence": "high | medium | low"
}

Rules:
- amount_total must be the final payable amount (after tax, discounts). Use numbers only, no currency symbols.
- date must be in YYYY-MM-DD format. If year is 2-digit like "25", assume "2025". If only DD/MM shown, assume current year.
- items: list each line item with its price. If items are not clearly visible, use null.
- gst_amount: extract GST/tax amount if shown separately, otherwise null.
- payment_method: detect from card number, UPI ID, "CASH" text, etc. Use null if not visible.
- confidence: "high" if text is clear and all fields readable, "medium" if some fields are guessed, "low" if image is blurry or mostly unreadable.
- For any field you cannot determine at all, use null.
- Return ONLY the JSON object. No other text.`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReceiptScannerModal({ open, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [scanning, setScanning] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editForm, setEditForm] = useState({
    vendor: '', amount: '', date: '', category: CATEGORIES[0], notes: '', payment_method: 'UPI',
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    setMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setExtracted(null);
      setScanAttempt(0);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleScan = async () => {
    if (!imageBase64 || !hasOpenRouterKey()) return;
    setScanning(true);
    const attempt = scanAttempt + 1;
    setScanAttempt(attempt);

    try {
      const raw = await callVisionModel(imageBase64, mediaType, RECEIPT_PROMPT);
      let data: ExtractedData;

      try {
        data = parseJSON<ExtractedData>(raw);
      } catch {
        if (attempt < 2) {
          setScanning(false);
          toast('Retrying scan...', { icon: '🔄' });
          setTimeout(() => handleScan(), 500);
          return;
        }
        throw new Error('Could not parse receipt data. Please try a clearer photo.');
      }

      if (data.amount_total && typeof data.amount_total === 'string') {
        data.amount_total = parseFloat(String(data.amount_total).replace(/[^0-9.]/g, '')) || null;
      }
      if (data.gst_amount && typeof data.gst_amount === 'string') {
        data.gst_amount = parseFloat(String(data.gst_amount).replace(/[^0-9.]/g, '')) || null;
      }

      setExtracted(data);

      const catMap: Record<string, string> = {
        Food: 'Food', Groceries: 'Food', Transport: 'Travel', Software: 'Tools & Software',
        Office: 'Office', Marketing: 'Ads & Marketing', Utilities: 'Other',
        Entertainment: 'Personal', Medical: 'Personal', Electronics: 'Tools & Software', Other: 'Other',
      };

      setEditForm({
        vendor: data.vendor_name || '',
        amount: data.amount_total ? String(data.amount_total) : '',
        date: data.date || new Date().toISOString().split('T')[0],
        category: catMap[data.category || ''] || CATEGORIES[0],
        notes: data.vendor_name || '',
        payment_method: data.payment_method || 'UPI',
      });

      toast.success('Receipt scanned successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to scan receipt';
      toast.error(msg);
    }
    setScanning(false);
  };

  const handleSave = async () => {
    if (!user || !editForm.amount || Number(editForm.amount) <= 0) {
      toast.error('Please verify the amount');
      return;
    }
    setSaving(true);

    let receiptId: string | null = null;
    if (imageBase64) {
      const receipts: { id: string; data: string }[] = JSON.parse(
        localStorage.getItem('mfo_receipt_images') || '[]'
      );
      receiptId = crypto.randomUUID();
      receipts.push({ id: receiptId, data: `data:${mediaType};base64,${imageBase64}` });
      localStorage.setItem('mfo_receipt_images', JSON.stringify(receipts));
    }

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: Number(editForm.amount),
      category: editForm.category,
      type: 'Business',
      date: editForm.date,
      notes: editForm.notes + (receiptId ? ` [receipt:${receiptId}]` : ''),
      payment_method: editForm.payment_method,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Expense added from receipt');
      onSaved();
      resetAndClose();
    }
    setSaving(false);
  };

  const resetAndClose = () => {
    setImageBase64(null);
    setExtracted(null);
    setScanAttempt(0);
    setEditForm({ vendor: '', amount: '', date: '', category: CATEGORIES[0], notes: '', payment_method: 'UPI' });
    onClose();
  };

  const confColors: Record<string, string> = {
    high: 'text-emerald-400 bg-emerald-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    low: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scan Your Receipt</h2>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasOpenRouterKey() && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Add OpenRouter key in Settings to use AI features
          </div>
        )}

        {!imageBase64 ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-brand-500/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Tap to upload or take photo</p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG - Max 10MB</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => cameraRef.current?.click()} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Camera
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Gallery
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
          </div>
        ) : !extracted ? (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={`data:${mediaType};base64,${imageBase64}`} alt="Receipt" className="w-full max-h-64 object-contain bg-dark-800" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setImageBase64(null); setScanAttempt(0); }} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Change
              </button>
              <button
                onClick={handleScan}
                disabled={scanning || !hasOpenRouterKey()}
                className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {scanning ? 'Scanning...' : 'Scan with AI'}
              </button>
            </div>
            {scanning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  <p className="text-xs text-gray-500">Reading receipt details...</p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <span className="text-[10px] text-gray-600 bg-dark-700 px-2 py-1 rounded-full">Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Receipt Scanned</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${confColors[extracted.confidence]}`}>
                {extracted.confidence === 'high' ? 'High' : extracted.confidence === 'medium' ? 'Medium' : 'Low'} Confidence
              </span>
            </div>

            {extracted.confidence === 'low' && (
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                Low confidence scan -- please verify all details carefully
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vendor</label>
                <input value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount (INR)</label>
                <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
                <select value={editForm.payment_method} onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {['Cash', 'UPI', 'Card', 'Bank', 'Online'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {extracted.items && extracted.items.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Items Detected</label>
                <div className="space-y-1">
                  {extracted.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-dark-700/50">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-gray-400">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extracted.gst_amount != null && extracted.gst_amount > 0 && (
              <p className="text-xs text-gray-500">GST: {formatINR(extracted.gst_amount)}</p>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setExtracted(null); setScanAttempt(0); }} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-300 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Rescan
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Add to Expenses
              </button>
            </div>

            <div className="flex justify-end">
              <span className="text-[10px] text-gray-600 bg-dark-700 px-2 py-1 rounded-full">Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
