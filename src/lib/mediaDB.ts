import { supabase } from './supabase';

const BUCKET = 'media-assets';

function getExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
  };
  return map[mimeType] || 'bin';
}

function buildPath(userId: string, assetId: string, mimeType: string): string {
  const ext = getExt(mimeType);
  return `${userId}/${assetId}.${ext}`;
}

export async function uploadMediaToStorage(
  userId: string,
  assetId: string,
  blob: Blob,
  mimeType: string
): Promise<{ path: string; publicUrl: string } | null> {
  const path = buildPath(userId, assetId, mimeType);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Storage upload failed:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: urlData.publicUrl };
}

export async function uploadFromUrl(
  userId: string,
  assetId: string,
  sourceUrl: string
): Promise<{ path: string; publicUrl: string; size: number } | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || 'application/octet-stream';
    const result = await uploadMediaToStorage(userId, assetId, blob, mimeType);
    if (!result) return null;
    return { ...result, size: blob.size };
  } catch {
    return null;
  }
}

export async function deleteMediaFromStorage(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function saveMediaBlob(
  _id: string,
  _blob: Blob,
  _mimeType: string
): Promise<void> {
  // kept for backward compat - no-op now, upload via uploadMediaToStorage instead
}

export async function getMediaBlob(_id: string): Promise<{ blob: Blob; mimeType: string } | null> {
  return null;
}

export async function deleteMediaBlob(_id: string): Promise<void> {
  // no-op
}

export async function getAllMediaIds(): Promise<string[]> {
  return [];
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}
