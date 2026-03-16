import { useRef, useCallback } from 'react';
import { Paperclip, Image, FileText, Film, Mic, X } from 'lucide-react';

interface Props {
  open: boolean;
  onToggle: () => void;
  onFilesSelected: (files: File[]) => void;
}

const ACCEPT_MAP = {
  image: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
  video: 'video/mp4,video/webm,video/quicktime',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar',
  audio: 'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac',
};

export default function ChatAttachmentMenu({ open, onToggle, onFilesSelected }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      onToggle();
    }
    e.target.value = '';
  }, [onFilesSelected, onToggle]);

  const items = [
    { icon: Mic, label: 'Audio', color: 'from-rose-500 to-pink-500', ref: audioInputRef },
    { icon: FileText, label: 'Document', color: 'from-amber-500 to-orange-500', ref: docInputRef },
    { icon: Film, label: 'Video', color: 'from-blue-500 to-cyan-500', ref: videoInputRef },
    { icon: Image, label: 'Photos', color: 'from-emerald-500 to-green-500', ref: imageInputRef },
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          open
            ? 'bg-brand-500/20 text-brand-400 rotate-45'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
        }`}
      >
        {open ? <X className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onToggle} />
          <div className="absolute bottom-full left-0 mb-3 z-40">
            <div className="flex flex-col gap-2.5">
              {items.map(({ icon: Icon, label, color, ref }, index) => (
                <button
                  key={label}
                  onClick={() => ref.current?.click()}
                  className="flex items-center gap-3 group opacity-0 animate-[fadeSlideUp_0.25s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center
                    group-hover:scale-110 group-active:scale-90 transition-transform duration-150 shadow-lg shadow-black/30`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium bg-dark-700/90 backdrop-blur-sm border border-white/[0.08]
                    px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <input ref={imageInputRef} type="file" accept={ACCEPT_MAP.image} multiple onChange={handleFiles} className="hidden" />
      <input ref={videoInputRef} type="file" accept={ACCEPT_MAP.video} multiple onChange={handleFiles} className="hidden" />
      <input ref={docInputRef} type="file" accept={ACCEPT_MAP.document} multiple onChange={handleFiles} className="hidden" />
      <input ref={audioInputRef} type="file" accept={ACCEPT_MAP.audio} multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}
