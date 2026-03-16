import type { MessageType } from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-chat`;
const LS_SESSION_KEY = 'mfo_team_session';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function getMessageTypeFromMime(mime: string): MessageType {
  if (IMAGE_TYPES.includes(mime)) return 'image';
  if (VIDEO_TYPES.includes(mime)) return 'video';
  if (AUDIO_TYPES.includes(mime)) return 'audio';
  if (DOCUMENT_TYPES.includes(mime)) return 'document';
  return 'file';
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  return null;
}

export function getFileIcon(mimeOrName: string): 'pdf' | 'doc' | 'xls' | 'ppt' | 'zip' | 'txt' | 'generic' {
  const lower = mimeOrName.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('word') || lower.includes('.doc')) return 'doc';
  if (lower.includes('excel') || lower.includes('sheet') || lower.includes('.xls') || lower.includes('.csv')) return 'xls';
  if (lower.includes('powerpoint') || lower.includes('presentation') || lower.includes('.ppt')) return 'ppt';
  if (lower.includes('zip') || lower.includes('rar') || lower.includes('compress')) return 'zip';
  if (lower.includes('text') || lower.includes('.txt')) return 'txt';
  return 'generic';
}

export async function uploadChatFile(
  file: File,
  conversationId: string,
): Promise<{ url: string; error?: string }> {
  const validation = validateFile(file);
  if (validation) return { url: '', error: validation };

  const sessionToken = localStorage.getItem(LS_SESSION_KEY);
  if (!sessionToken) return { url: '', error: 'Not authenticated' };

  const formData = new FormData();
  formData.append('file', file);
  formData.append('action', 'upload-file');
  formData.append('session_token', sessionToken);
  formData.append('conversation_id', conversationId);

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      return { url: '', error: json.error || 'Upload failed' };
    }
    return { url: json.data.url };
  } catch {
    return { url: '', error: 'Upload failed' };
  }
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

export function getSupportedMimeType(): string {
  const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function getAudioExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
  };
  return map[mimeType] || 'webm';
}
