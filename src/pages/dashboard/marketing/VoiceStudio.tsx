import { useState, useRef } from 'react';
import { Loader2, Mic, Play, Pause, Download, Volume2, MicOff, Type, AudioLines, ArrowLeftRight, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { getApiKey } from '../../../lib/apiKeys';
import { uploadMediaToStorage } from '../../../lib/mediaDB';

type VoiceTab = 'tts' | 'stt' | 'a2a';

const TABS: { key: VoiceTab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'tts', label: 'Text to Speech', icon: Type, desc: 'Convert text into natural-sounding speech' },
  { key: 'stt', label: 'Speech to Text', icon: Mic, desc: 'Transcribe audio files to text' },
  { key: 'a2a', label: 'Audio to Audio', desc: 'Transform voice style and characteristics', icon: ArrowLeftRight },
];

const VOICES = [
  { id: 'rachel', name: 'Rachel', desc: 'American, calm', gender: 'F' },
  { id: 'drew', name: 'Drew', desc: 'American, mature', gender: 'M' },
  { id: 'clyde', name: 'Clyde', desc: 'American, intense', gender: 'M' },
  { id: 'paul', name: 'Paul', desc: 'American, deep', gender: 'M' },
  { id: 'domi', name: 'Domi', desc: 'American, energetic', gender: 'F' },
  { id: 'bella', name: 'Bella', desc: 'American, soft', gender: 'F' },
  { id: 'adam', name: 'Adam', desc: 'American, narrative', gender: 'M' },
  { id: 'elli', name: 'Elli', desc: 'American, young', gender: 'F' },
];

const ELEVEN_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2', desc: 'Best quality, 29 languages' },
  { id: 'eleven_turbo_v2_5', label: 'Turbo v2.5', desc: 'Fastest, low latency' },
  { id: 'eleven_monolingual_v1', label: 'Monolingual v1', desc: 'English only, stable' },
];

function AudioPlayer({ url, label }: { url: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
      <button onClick={toggle} className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center flex-shrink-0">
        {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{label}</p>
        <p className="text-xs text-gray-500">Click to play</p>
      </div>
      <a href={url} download className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
        <Download className="w-4 h-4" />
      </a>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
    </div>
  );
}

function TextToSpeechTab() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('rachel');
  const [modelId, setModelId] = useState('eleven_multilingual_v2');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  const handleGenerate = async () => {
    const apiKey = await getApiKey('elevenlabs');
    if (!apiKey) { toast.error('Add your ElevenLabs API key in Settings > Integrations'); return; }
    if (!text.trim()) { toast.error('Enter text to convert'); return; }

    setGenerating(true);
    setAudioUrl('');
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
        body: JSON.stringify({
          text: text.trim(),
          model_id: modelId,
          voice_settings: { stability, similarity_boost: similarity },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      if (user) {
        const assetId = crypto.randomUUID();
        const uploaded = await uploadMediaToStorage(user.id, assetId, blob, blob.type || 'audio/mpeg');
        await supabase.from('media_assets').insert({
          id: assetId, user_id: user.id, type: 'voice', title: text.slice(0, 100),
          prompt: text, provider: 'elevenlabs', status: 'completed',
          result_url: uploaded?.publicUrl || 'local', storage_path: uploaded?.path || null,
          file_size: blob.size, metadata: { mode: 'tts', voiceId, modelId },
        });
      }
      toast.success('Speech generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'TTS failed');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Text to speak</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
          placeholder="Enter the text you want to convert to speech..."
          className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] resize-none" />
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-gray-500">{text.length} chars</span>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Voice</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {VOICES.map((v) => (
            <button key={v.id} onClick={() => setVoiceId(v.id)}
              className={`p-3 rounded-xl border text-left transition-all ${voiceId === v.id ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-white/5 bg-dark-800 hover:border-white/20'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-medium text-white">{v.name}</p>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${v.gender === 'F' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>{v.gender}</span>
              </div>
              <p className="text-[11px] text-gray-500">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">AI Model</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {ELEVEN_MODELS.map((m) => (
            <button key={m.id} onClick={() => setModelId(m.id)}
              className={`p-3 rounded-xl border text-left transition-all ${modelId === m.id ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-white/5 bg-dark-800 hover:border-white/20'}`}>
              <p className="text-xs font-medium text-white">{m.label}</p>
              <p className="text-[11px] text-gray-500">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Stability: {Math.round(stability * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={stability} onChange={(e) => setStability(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>More variable</span><span>More stable</span></div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Clarity: {Math.round(similarity * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={similarity} onChange={(e) => setSimilarity(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>Low clarity</span><span>High clarity</span></div>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={generating || !text.trim()}
        className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating speech...</> : <><Volume2 className="w-5 h-5" /> Generate Speech</>}
      </button>

      {audioUrl && (
        <div className="pt-2">
          <p className="text-xs text-gray-400 mb-2">Result</p>
          <AudioPlayer url={audioUrl} label="Generated Speech" />
        </div>
      )}
    </div>
  );
}

function SpeechToTextTab() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioFile(new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleTranscribe = async () => {
    const apiKey = await getApiKey('elevenlabs');
    if (!apiKey) { toast.error('Add your ElevenLabs API key in Settings > Integrations'); return; }
    if (!audioFile) { toast.error('Upload or record audio first'); return; }

    setGenerating(true);
    setTranscription('');
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('model_id', 'scribe_v1');

      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setTranscription(data.text || 'No transcription available');
      toast.success('Transcription complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transcription failed');
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#FF6B00]/30 transition-colors">
        <AudioLines className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400 mb-3">Upload an audio file or record directly</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <label className="px-4 py-2 rounded-xl border border-white/10 bg-dark-800 text-sm text-gray-300 hover:bg-white/5 cursor-pointer transition-colors">
            <input type="file" accept="audio/*,video/*" className="hidden"
              onChange={(e) => { setAudioFile(e.target.files?.[0] || null); setTranscription(''); }} />
            Upload Audio
          </label>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
              recording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'border border-white/10 bg-dark-800 text-gray-300 hover:bg-white/5'
            }`}
          >
            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {recording ? 'Stop Recording' : 'Record'}
          </button>
        </div>
        {audioFile && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">{audioFile.name}</span>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 rounded-xl bg-dark-800/50 border border-white/5">
        <p className="text-[11px] text-gray-500">Supports: MP3, MP4, WAV, WebM, M4A, OGG, FLAC. Max 25MB.</p>
      </div>

      <button onClick={handleTranscribe} disabled={generating || !audioFile}
        className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Transcribing...</> : <><Mic className="w-5 h-5" /> Transcribe Audio</>}
      </button>

      {transcription && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Transcription</p>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-dark-800 rounded-xl border border-white/5 max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{transcription}</p>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{transcription.split(' ').length} words &bull; {transcription.length} characters</p>
        </div>
      )}
    </div>
  );
}

function AudioToAudioTab() {
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetVoiceId, setTargetVoiceId] = useState('rachel');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioFile(new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleTransform = async () => {
    const apiKey = await getApiKey('elevenlabs');
    if (!apiKey) { toast.error('Add your ElevenLabs API key in Settings > Integrations'); return; }
    if (!audioFile) { toast.error('Upload or record audio first'); return; }

    setGenerating(true);
    setAudioUrl('');
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('model_id', 'eleven_english_sts_v2');
      formData.append('voice_settings', JSON.stringify({ stability, similarity_boost: similarity }));

      const res = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${targetVoiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (user) {
        const assetId = crypto.randomUUID();
        const uploaded = await uploadMediaToStorage(user.id, assetId, blob, blob.type || 'audio/mpeg');
        const targetVoiceName = VOICES.find(v => v.id === targetVoiceId)?.name || targetVoiceId;
        await supabase.from('media_assets').insert({
          id: assetId, user_id: user.id, type: 'voice',
          title: `Voice transform - ${targetVoiceName}`,
          prompt: '', provider: 'elevenlabs', status: 'completed',
          result_url: uploaded?.publicUrl || 'local', storage_path: uploaded?.path || null,
          file_size: blob.size, metadata: { mode: 'sts', targetVoiceId },
        });
      }
      toast.success('Audio transformed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Audio transformation failed');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      <div className="px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <p className="text-[11px] text-blue-400 font-medium">Audio to Audio transforms your voice recording into a different voice style using AI.</p>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Source Audio</label>
        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-[#FF6B00]/30 transition-colors">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <label className="px-4 py-2 rounded-xl border border-white/10 bg-dark-800 text-sm text-gray-300 hover:bg-white/5 cursor-pointer transition-colors">
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
              Upload Audio
            </label>
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                recording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'border border-white/10 bg-dark-800 text-gray-300 hover:bg-white/5'
              }`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {recording ? 'Stop Recording' : 'Record'}
            </button>
          </div>
          {audioFile && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">{audioFile.name}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Target Voice</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {VOICES.map((v) => (
            <button key={v.id} onClick={() => setTargetVoiceId(v.id)}
              className={`p-3 rounded-xl border text-left transition-all ${targetVoiceId === v.id ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-white/5 bg-dark-800 hover:border-white/20'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-medium text-white">{v.name}</p>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${v.gender === 'F' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>{v.gender}</span>
              </div>
              <p className="text-[11px] text-gray-500">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Stability: {Math.round(stability * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={stability} onChange={(e) => setStability(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">Clarity: {Math.round(similarity * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={similarity} onChange={(e) => setSimilarity(Number(e.target.value))} className="w-full accent-[#FF6B00]" />
        </div>
      </div>

      <button onClick={handleTransform} disabled={generating || !audioFile}
        className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Transforming audio...</> : <><ArrowLeftRight className="w-5 h-5" /> Transform Audio</>}
      </button>

      {audioUrl && (
        <div className="pt-2">
          <p className="text-xs text-gray-400 mb-2">Result</p>
          <AudioPlayer url={audioUrl} label={`Transformed to ${VOICES.find(v => v.id === targetVoiceId)?.name}`} />
        </div>
      )}
    </div>
  );
}

export default function VoiceStudio() {
  const [activeTab, setActiveTab] = useState<VoiceTab>('tts');

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Mic className="w-5 h-5 text-[#FF6B00]" />
          <h3 className="text-lg font-semibold text-white">Voice Studio</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">ElevenLabs</span>
        </div>

        <div className="flex gap-1 p-1 bg-dark-900/60 rounded-xl border border-white/5 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'gradient-orange text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mb-5">{TABS.find(t => t.key === activeTab)?.desc}</p>

        {activeTab === 'tts' && <TextToSpeechTab />}
        {activeTab === 'stt' && <SpeechToTextTab />}
        {activeTab === 'a2a' && <AudioToAudioTab />}
      </div>
    </div>
  );
}
