import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Smile, ArrowLeft, Users,
  Reply, Pencil, Trash2, X, Check, ChevronDown,
  Pin, Forward, Bookmark, SmilePlus, Mic, Square,
  Image as ImageIcon, Lock,
} from 'lucide-react';
import type { ChatMessage, Conversation, TypingUser, ChatAttachment, MessageType } from '../../../lib/messaging/types';
import { useTeamAuth } from '../../../context/TeamAuthContext';
import { chatService } from '../../../lib/messaging/chatService';
import { uploadChatFile, getMessageTypeFromMime, createImagePreview, formatFileSize, validateFile, getSupportedMimeType, getAudioExtension } from '../../../lib/messaging/fileUpload';
import ChatAttachmentMenu from './ChatAttachmentMenu';
import MessageBubbleContent from './MessageBubbleContent';
import toast from 'react-hot-toast';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface Props {
  conversation: Conversation;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  onSendMessage: (content: string, replyToId?: string, attachment?: { url: string; name: string; type: MessageType; size: number; mime: string }) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: (isTyping: boolean) => void;
  onBack: () => void;
  onLoadMore: () => void;
  onOpenPinned: () => void;
  onForwardMessage: (message: ChatMessage) => void;
  onOptimisticMessage: (msg: ChatMessage) => void;
  onRemoveOptimistic: (tempId: string) => void;
  hasMore: boolean;
  loading: boolean;
}

export default function ChatWindow({
  conversation,
  messages,
  typingUsers,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTyping,
  onBack,
  onLoadMore,
  onOpenPinned,
  onForwardMessage,
  onOptimisticMessage,
  onRemoveOptimistic,
  hasMore,
  loading,
}: Props) {
  const { member } = useTeamAuth();
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editInput, setEditInput] = useState('');
  const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [reactionPicker, setReactionPicker] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileDropRef = useRef<HTMLDivElement>(null);

  const otherMember = conversation.type === 'direct'
    ? conversation.members.find(m => m.id !== member?.id)
    : null;

  const headerName = conversation.type === 'group'
    ? conversation.name
    : otherMember?.display_name || otherMember?.full_name || 'Unknown';

  const headerSubtext = conversation.type === 'group'
    ? `${conversation.members.length} members`
    : otherMember?.is_online ? 'Online' : 'Offline';

  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [conversation.id]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    isAtBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setShowScrollBottom(!isAtBottomRef.current);

    if (container.scrollTop < 50 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInput = (value: string) => {
    setInput(value);
    onTyping(value.length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
  };

  const sendTextMessage = () => {
    if (!input.trim() && pendingFiles.length === 0) return;

    if (pendingFiles.length > 0) {
      sendFilesWithCaption();
      return;
    }

    onSendMessage(input.trim(), replyTo?.id);
    setInput('');
    setReplyTo(null);
    onTyping(false);
    inputRef.current?.focus();
  };

  const sendFilesWithCaption = async () => {
    const caption = input.trim();
    const files = [...pendingFiles];
    setPendingFiles([]);
    setInput('');
    setReplyTo(null);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const tempId = `optimistic-${Date.now()}-${i}`;

      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: member?.id || '',
        content: i === 0 ? caption : '',
        message_type: f.type,
        attachment_url: f.preview || '',
        attachment_name: f.name,
        attachment_size: f.size,
        attachment_mime: f.file.type,
        reply_to_id: i === 0 ? replyTo?.id || null : null,
        forwarded_from: null,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: member ? {
          id: member.id,
          full_name: member.full_name,
          avatar_url: member.avatar_url || '',
          role: member.role,
          profile_pic_url: '',
          display_name: '',
        } : null,
        reply_to: null,
        _optimistic: true,
        _uploadProgress: 0,
      };

      onOptimisticMessage(optimisticMsg);

      try {
        const { url, error } = await uploadChatFile(f.file, conversation.id);
        if (error) {
          toast.error(`Failed to upload ${f.name}: ${error}`);
          onRemoveOptimistic(tempId);
          continue;
        }

        onSendMessage(
          i === 0 ? caption : '',
          i === 0 ? replyTo?.id : undefined,
          { url, name: f.name, type: f.type, size: f.size, mime: f.file.type },
        );
        onRemoveOptimistic(tempId);
      } catch {
        toast.error(`Failed to upload ${f.name}`);
        onRemoveOptimistic(tempId);
      }
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    const newAttachments: ChatAttachment[] = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        toast.error(err);
        continue;
      }
      const msgType = getMessageTypeFromMime(file.type);
      let preview: string | undefined;
      if (msgType === 'image') {
        preview = await createImagePreview(file);
      }
      newAttachments.push({ file, preview, type: msgType, name: file.name, size: file.size });
    }
    if (newAttachments.length > 0) {
      setPendingFiles(prev => [...prev, ...newAttachments]);
      inputRef.current?.focus();
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const handleEdit = () => {
    if (!editingMessage || !editInput.trim()) return;
    onEditMessage(editingMessage.id, editInput.trim());
    setEditingMessage(null);
    setEditInput('');
  };

  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    if (msg.is_deleted || msg._optimistic) return;
    e.preventDefault();
    setContextMenu({ messageId: msg.id, x: e.clientX, y: e.clientY });
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    setReactionPicker(null);
    const res = await chatService.reactToMessage(messageId, emoji);
    if (res.error) toast.error(res.error);
  };

  const handlePin = async (messageId: string) => {
    setContextMenu(null);
    const res = await chatService.pinMessage(conversation.id, messageId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.data?.pinned ? 'Message pinned' : 'Message unpinned');
    }
  };

  const handleBookmark = async (messageId: string) => {
    setContextMenu(null);
    const res = await chatService.bookmarkMessage(messageId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.data?.bookmarked ? 'Message saved' : 'Message unsaved');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (fileDropRef.current && !fileDropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFilesSelected(files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files: File[] = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
      await handleFilesSelected(files);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        toast.error('Voice recording is not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        const ext = getAudioExtension(mimeType);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });

        const tempId = `optimistic-voice-${Date.now()}`;
        const optimisticMsg: ChatMessage = {
          id: tempId,
          conversation_id: conversation.id,
          sender_id: member?.id || '',
          content: '',
          message_type: 'voice',
          attachment_url: '',
          attachment_name: file.name,
          attachment_size: file.size,
          attachment_mime: mimeType,
          reply_to_id: null,
          forwarded_from: null,
          is_edited: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: member ? {
            id: member.id,
            full_name: member.full_name,
            avatar_url: member.avatar_url || '',
            role: member.role,
            profile_pic_url: '',
            display_name: '',
          } : null,
          reply_to: null,
          _optimistic: true,
          _uploadProgress: 50,
        };
        onOptimisticMessage(optimisticMsg);

        try {
          const { url, error } = await uploadChatFile(file, conversation.id);
          if (error) {
            toast.error('Failed to send voice message');
            onRemoveOptimistic(tempId);
            return;
          }
          onSendMessage('', undefined, { url, name: file.name, type: 'voice', size: file.size, mime: mimeType });
          onRemoveOptimistic(tempId);
        } catch {
          toast.error('Failed to send voice message');
          onRemoveOptimistic(tempId);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const renderAvatar = (msg: ChatMessage) => {
    const pic = msg.sender?.profile_pic_url || msg.sender?.avatar_url;
    const name = msg.sender?.display_name || msg.sender?.full_name || '?';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isManagement = msg.sender?.role === 'management';

    if (pic) {
      return <img src={pic} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
    }
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
        isManagement ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
      }`}>
        {initials}
      </div>
    );
  };

  const renderReactions = (msg: ChatMessage) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {msg.reactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => handleReaction(msg.id, r.emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
              r.reacted_by_me
                ? 'bg-brand-500/15 border-brand-500/30 text-brand-300'
                : 'bg-white/[0.04] border-white/[0.06] text-gray-400 hover:bg-white/[0.08]'
            }`}
            title={r.members.map(m => m.name).join(', ')}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        ))}
        <button
          onClick={() => setReactionPicker(reactionPicker === msg.id ? null : msg.id)}
          className="flex items-center px-1.5 py-0.5 rounded-full text-[11px] bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
        >
          <SmilePlus className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const COMMON_EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😅', '😢',
    '🔥', '❤️', '👍', '👎', '🎉', '💯', '🙏', '✅',
    '👀', '💪', '🤝', '⭐', '💡', '📌', '🚀', '💬',
  ];

  return (
    <div
      ref={fileDropRef}
      className="flex flex-col h-full bg-dark-900 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-brand-500/10 border-2 border-dashed border-brand-500/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-brand-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-brand-300">Drop files here</p>
            <p className="text-sm text-gray-400 mt-1">Images, videos, documents, audio</p>
          </div>
        </div>
      )}

      <div className="h-16 bg-dark-800 border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {conversation.type === 'group' ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0">
            <Users className="w-5 h-5" />
          </div>
        ) : (
          <div className="relative shrink-0">
            {(() => {
              const pic = otherMember?.profile_pic_url || otherMember?.avatar_url;
              const name = otherMember?.display_name || otherMember?.full_name || '?';
              const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              if (pic) return <img src={pic} alt={name} className="w-10 h-10 rounded-full object-cover" />;
              return (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  otherMember?.role === 'management' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  {initials}
                </div>
              );
            })()}
            {otherMember?.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-dark-800" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{headerName}</h3>
          {typingUsers.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
              <span className="text-xs text-emerald-400 font-medium truncate">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing`
                  : `${typingUsers.map(u => u.name).join(', ')} are typing`}
              </span>
            </div>
          ) : (
            <p className={`text-xs ${otherMember?.is_online ? 'text-emerald-400' : 'text-gray-500'}`}>
              {headerSubtext}
            </p>
          )}
        </div>

        <button
          onClick={onOpenPinned}
          className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/[0.06] transition-colors"
          title="Pinned Messages"
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
      >
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {loading ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-gray-500 font-medium px-3 py-1 bg-dark-800 rounded-full">
                {formatDateSeparator(group.date)}
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {group.messages.map((msg, mi) => {
              const isOwn = msg.sender_id === member?.id;
              const showAvatar = !isOwn && (mi === 0 || group.messages[mi - 1].sender_id !== msg.sender_id);
              const showName = conversation.type === 'group' && showAvatar;
              const isConsecutive = mi > 0 && group.messages[mi - 1].sender_id === msg.sender_id;

              if (msg.message_type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[11px] text-gray-500 bg-dark-800 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-[5px]' : 'mt-4'} ${
                    msg._optimistic ? 'opacity-70' : ''
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                >
                  <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-8 shrink-0">
                        {showAvatar && renderAvatar(msg)}
                      </div>
                    )}

                    <div className="min-w-0">
                      {showName && msg.sender && (
                        <p className={`text-[11px] font-medium mb-1 ${
                          msg.sender.role === 'management' ? 'text-blue-400' : 'text-emerald-400'
                        }`}>
                          {msg.sender.display_name || msg.sender.full_name}
                        </p>
                      )}

                      {msg.forwarded_from && !msg.is_deleted && (
                        <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-500">
                          <Forward className="w-3 h-3" />
                          <span>Forwarded message</span>
                        </div>
                      )}

                      {msg.reply_to && !msg.is_deleted && (
                        <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-brand-500 bg-white/[0.03] ${isOwn ? 'ml-auto' : ''}`}>
                          <p className="text-[10px] text-brand-400 font-medium">
                            {msg.reply_to.sender?.full_name || 'Unknown'}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                            {msg.reply_to.message_type !== 'text' ? `Sent a ${msg.reply_to.message_type}` : msg.reply_to.content}
                          </p>
                        </div>
                      )}

                      <div
                        className={`relative group px-3.5 py-2.5 rounded-2xl transition-all duration-200 ${
                          msg.is_deleted
                            ? 'bg-white/[0.03] border border-white/[0.04]'
                            : isOwn
                              ? 'bg-gradient-to-br from-brand-600/25 to-brand-600/15 border border-brand-500/15 shadow-sm shadow-brand-500/5'
                              : 'bg-dark-700/80 border border-white/[0.06] shadow-sm shadow-black/10'
                        } ${isOwn && !isConsecutive ? 'rounded-tr-md' : ''} ${!isOwn && !isConsecutive ? 'rounded-tl-md' : ''}`}
                      >
                        {msg.is_pinned && (
                          <div className="flex items-center gap-1 mb-1 -mt-0.5">
                            <Pin className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[9px] text-amber-400/70 font-medium">Pinned</span>
                          </div>
                        )}

                        <MessageBubbleContent msg={msg} />

                        <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <Lock className="w-2.5 h-2.5 text-gray-600/60" />
                          <span className="text-[10px] text-gray-600">
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {msg.is_edited && !msg.is_deleted && (
                            <span className="text-[10px] text-gray-600 italic">edited</span>
                          )}
                          {msg._optimistic && (
                            <span className="text-[10px] text-brand-400/70 font-medium">sending...</span>
                          )}
                        </div>

                        {!msg.is_deleted && !msg._optimistic && (
                          <div className={`absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-dark-800 border border-white/[0.08] rounded-lg px-0.5 py-0.5 shadow-lg z-20 ${
                            isOwn ? 'right-0' : 'left-0'
                          }`}>
                            <button
                              onClick={() => setReactionPicker(reactionPicker === msg.id ? null : msg.id)}
                              className="p-1.5 rounded-md hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-colors"
                              title="React"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setReplyTo(msg)}
                              className="p-1.5 rounded-md hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-colors"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onForwardMessage(msg)}
                              className="p-1.5 rounded-md hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-colors"
                              title="Forward"
                            >
                              <Forward className="w-3.5 h-3.5" />
                            </button>
                            {isOwn && (
                              <>
                                <button
                                  onClick={() => { setEditingMessage(msg); setEditInput(msg.content); }}
                                  className="p-1.5 rounded-md hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteMessage(msg.id)}
                                  className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {reactionPicker === msg.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setReactionPicker(null)} />
                            <div className={`absolute z-40 flex items-center gap-0.5 bg-dark-700 border border-white/[0.08] rounded-xl px-2 py-1.5 shadow-2xl ${
                              isOwn ? 'right-0 -top-12' : 'left-0 -top-12'
                            }`}>
                              {QUICK_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-lg transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {renderReactions(msg)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 p-2.5 bg-dark-700 border border-white/10 rounded-full shadow-xl hover:bg-dark-600 transition-colors z-10"
        >
          <ChevronDown className="w-5 h-5 text-gray-300" />
        </button>
      )}

      {pendingFiles.length > 0 && (
        <div className="px-4 py-3 bg-dark-800 border-t border-white/[0.06]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pendingFiles.map((f, i) => (
              <div key={i} className="relative shrink-0 group/file">
                {f.preview ? (
                  <img src={f.preview} alt={f.name} className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-dark-700 border border-white/[0.08] flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-[8px] text-gray-600 truncate max-w-[56px]">
                      {f.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <p className="text-[8px] text-gray-600 text-center mt-0.5 truncate max-w-[64px]">
                  {formatFileSize(f.size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingMessage && (
        <div className="px-4 py-2 bg-dark-800 border-t border-white/[0.06] flex items-center gap-3">
          <Pencil className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400 font-medium">Editing message</p>
            <p className="text-xs text-gray-500 truncate">{editingMessage.content}</p>
          </div>
          <button onClick={() => { setEditingMessage(null); setEditInput(''); }} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {replyTo && !editingMessage && (
        <div className="px-4 py-2 bg-dark-800 border-t border-white/[0.06] flex items-center gap-3">
          <Reply className="w-4 h-4 text-brand-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-400 font-medium">
              Replying to {replyTo.sender?.display_name || replyTo.sender?.full_name || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {replyTo.message_type !== 'text' ? `Sent a ${replyTo.message_type}` : replyTo.content}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-3 bg-dark-800 border-t border-white/[0.06] shrink-0">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <button
              onClick={cancelVoiceRecording}
              className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cancel"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-mono font-medium">{formatRecordingTime(recordingTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/50 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
            <button
              onClick={stopVoiceRecording}
              className="p-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-white transition-all duration-200 active:scale-95"
              title="Send voice"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : editingMessage ? (
          <div className="flex items-end gap-2">
            <textarea
              value={editInput}
              onChange={e => setEditInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
              className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
              rows={1}
              autoFocus
            />
            <button
              onClick={handleEdit}
              disabled={!editInput.trim()}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 rounded-xl text-white transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <ChatAttachmentMenu
              open={showAttachMenu}
              onToggle={() => setShowAttachMenu(!showAttachMenu)}
              onFilesSelected={handleFilesSelected}
            />

            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2.5 rounded-xl transition-colors ${
                  showEmojiPicker ? 'text-brand-400 bg-brand-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-40 bg-dark-700 border border-white/[0.08] rounded-2xl p-3 shadow-2xl">
                    <div className="grid grid-cols-8 gap-1 w-[240px]">
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                            inputRef.current?.focus();
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-lg transition-transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={pendingFiles.length > 0 ? 'Add a caption...' : 'Type a message...'}
              className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 bg-dark-700 border border-white/[0.08] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
              rows={1}
            />

            {input.trim() || pendingFiles.length > 0 ? (
              <button
                onClick={sendTextMessage}
                className="p-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-white transition-all duration-200 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startVoiceRecording}
                className="p-2.5 text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all duration-200 active:scale-95"
                title="Hold to record voice"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-dark-700 border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const msg = messages.find(m => m.id === contextMenu.messageId);
                if (msg) setReplyTo(msg);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
            >
              <Reply className="w-4 h-4" /> Reply
            </button>
            <button
              onClick={() => {
                const msg = messages.find(m => m.id === contextMenu.messageId);
                if (msg) onForwardMessage(msg);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
            >
              <Forward className="w-4 h-4" /> Forward
            </button>
            <button
              onClick={() => {
                const msg = messages.find(m => m.id === contextMenu.messageId);
                if (msg && msg.content) {
                  navigator.clipboard.writeText(msg.content);
                  toast.success('Copied to clipboard');
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
            <button
              onClick={() => handlePin(contextMenu.messageId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
            >
              <Pin className="w-4 h-4" /> Pin / Unpin
            </button>
            <button
              onClick={() => handleBookmark(contextMenu.messageId)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
            >
              <Bookmark className="w-4 h-4" /> Save / Unsave
            </button>
            {contextMenu && messages.find(m => m.id === contextMenu.messageId)?.sender_id === member?.id && (
              <>
                <div className="h-px bg-white/[0.06] my-1" />
                <button
                  onClick={() => {
                    const msg = messages.find(m => m.id === contextMenu.messageId);
                    if (msg) { setEditingMessage(msg); setEditInput(msg.content); }
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06]"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => { onDeleteMessage(contextMenu.messageId); setContextMenu(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
