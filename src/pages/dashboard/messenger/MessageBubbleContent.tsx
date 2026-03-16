import { useState, useRef } from 'react';
import {
  File, FileText, Download, Play, Pause,
  Image as ImageIcon, Film, Music, ExternalLink, Lock, Loader2, Mic, Upload,
} from 'lucide-react';
import type { ChatMessage } from '../../../lib/messaging/types';
import { formatFileSize, getFileIcon } from '../../../lib/messaging/fileUpload';
import { isEncrypted } from '../../../lib/messaging/encryption';
import ImageLightbox from './ImageLightbox';

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

const FILE_ICON_COLORS: Record<string, string> = {
  pdf: 'from-red-500 to-red-600',
  doc: 'from-blue-500 to-blue-600',
  xls: 'from-emerald-500 to-emerald-600',
  ppt: 'from-orange-500 to-orange-600',
  zip: 'from-amber-500 to-amber-600',
  txt: 'from-gray-400 to-gray-500',
  generic: 'from-gray-500 to-gray-600',
};

function AudioPlayer({ src, name }: { src: string; name: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-[240px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-400 flex items-center justify-center shrink-0 transition-colors active:scale-95"
      >
        {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = ratio * duration;
          }}
        >
          <div
            className="h-full bg-brand-400 rounded-full transition-all duration-100"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500">{formatTime(progress)}</span>
          <span className="text-[10px] text-gray-500">{duration ? formatTime(duration) : '--:--'}</span>
        </div>
        {name && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">{name}</p>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ url, name, size, mime }: { url: string; name: string; size: number; mime: string }) {
  const iconType = getFileIcon(mime || name);
  const colorClass = FILE_ICON_COLORS[iconType] || FILE_ICON_COLORS.generic;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] transition-colors group mb-1.5 max-w-[280px]"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0`}>
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-200 font-medium truncate group-hover:text-white transition-colors">
          {name || 'Document'}
        </p>
        {size > 0 && (
          <p className="text-[10px] text-gray-500">{formatFileSize(size)}</p>
        )}
      </div>
      <Download className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors shrink-0" />
    </a>
  );
}

function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden max-w-[300px] mb-1.5 bg-black">
      <video
        src={url}
        controls
        preload="metadata"
        className="w-full max-h-[200px] object-contain"
      />
    </div>
  );
}

const UPLOAD_TYPE_CONFIG: Record<string, { icon: typeof Film; label: string; color: string }> = {
  video: { icon: Film, label: 'Sending video', color: 'text-blue-400' },
  image: { icon: ImageIcon, label: 'Sending image', color: 'text-emerald-400' },
  audio: { icon: Music, label: 'Sending audio', color: 'text-amber-400' },
  voice: { icon: Mic, label: 'Sending voice note', color: 'text-brand-400' },
  document: { icon: FileText, label: 'Sending document', color: 'text-orange-400' },
  file: { icon: Upload, label: 'Sending file', color: 'text-gray-400' },
};

function UploadingOverlay({ messageType }: { messageType: string }) {
  const config = UPLOAD_TYPE_CONFIG[messageType] || UPLOAD_TYPE_CONFIG.file;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3 px-1 min-w-[180px]">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Icon className={`w-4.5 h-4.5 ${config.color}`} />
        </div>
        <Loader2 className="w-10 h-10 text-brand-400/60 animate-spin absolute inset-0" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-gray-300 font-medium">{config.label}</p>
        <div className="mt-1.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-brand-400/70 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}

function LinkPreviewInline({ url }: { url: string }) {
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/[0.06]
        transition-colors mt-1.5 max-w-[300px] group"
    >
      <ExternalLink className="w-4 h-4 text-brand-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-brand-400 group-hover:text-brand-300 truncate break-all transition-colors">
          {url.length > 50 ? url.slice(0, 50) + '...' : url}
        </p>
        <p className="text-[10px] text-gray-600">{domain}</p>
      </div>
    </a>
  );
}

interface Props {
  msg: ChatMessage;
}

export default function MessageBubbleContent({ msg }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (msg.is_deleted) {
    return <p className="text-xs text-gray-600 italic">This message was deleted</p>;
  }

  const urls = msg.content?.match(URL_REGEX);
  const hasTextContent = msg.content && msg.content.trim().length > 0;

  const renderTextWithLinks = (content: string) => {
    const parts = content.split(URL_REGEX);
    const matchedUrls = content.match(URL_REGEX);
    if (!matchedUrls) return <span>{content}</span>;

    const elements: React.ReactNode[] = [];
    parts.forEach((part, i) => {
      if (part) elements.push(<span key={`t-${i}`}>{part}</span>);
      if (matchedUrls[i]) {
        elements.push(
          <a
            key={`u-${i}`}
            href={matchedUrls[i]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2 break-all"
          >
            {matchedUrls[i].length > 60 ? matchedUrls[i].slice(0, 60) + '...' : matchedUrls[i]}
          </a>
        );
      }
    });
    return <>{elements}</>;
  };

  const isMediaType = msg.message_type !== 'text' && msg.message_type !== 'system';
  const isUploading = msg._optimistic && isMediaType;

  return (
    <>
      {isUploading ? (
        <UploadingOverlay messageType={msg.message_type} />
      ) : (
        <>
          {msg.message_type === 'image' && msg.attachment_url && (
            <button
              onClick={() => setLightboxSrc(msg.attachment_url)}
              className="block rounded-xl overflow-hidden max-w-[300px] mb-1.5 hover:opacity-90 transition-opacity"
            >
              <img
                src={msg.attachment_url}
                alt={msg.attachment_name || 'Photo'}
                className="max-w-full max-h-[280px] object-cover rounded-xl"
                loading="lazy"
              />
            </button>
          )}

          {msg.message_type === 'video' && msg.attachment_url && (
            <VideoPlayer url={msg.attachment_url} />
          )}

          {(msg.message_type === 'audio' || msg.message_type === 'voice') && msg.attachment_url && (
            <AudioPlayer src={msg.attachment_url} name={msg.attachment_name || ''} />
          )}

          {(msg.message_type === 'document' || msg.message_type === 'file') && msg.attachment_url && (
            <DocumentCard
              url={msg.attachment_url}
              name={msg.attachment_name || 'File'}
              size={msg.attachment_size || 0}
              mime={msg.attachment_mime || ''}
            />
          )}
        </>
      )}

      {hasTextContent && (
        isEncrypted(msg.content) ? (
          <div className="flex items-center gap-2 py-0.5">
            <Lock className="w-3.5 h-3.5 text-gray-500" />
            <p className="text-[13px] text-gray-500 italic">Encrypted message</p>
          </div>
        ) : (
          <p className="text-[13px] text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {renderTextWithLinks(msg.content)}
          </p>
        )
      )}

      {urls && urls.length > 0 && msg.message_type === 'text' && (
        <LinkPreviewInline url={urls[0]} />
      )}

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={msg.attachment_name}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
