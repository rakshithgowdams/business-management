export type ModelMainType = 'image' | 'video' | 'music' | 'voice';

export interface ModelSubType {
  key: string;
  label: string;
  description: string;
}

export const MODEL_TYPE_MAP: Record<ModelMainType, ModelSubType[]> = {
  image: [
    { key: 'text-to-image', label: 'Text to Image', description: 'Generate images from text prompts' },
    { key: 'image-to-image', label: 'Image to Image', description: 'Transform existing images' },
    { key: 'image-editing', label: 'Image Editing', description: 'Edit specific parts of images' },
  ],
  video: [
    { key: 'text-to-video', label: 'Text to Video', description: 'Generate videos from text prompts' },
    { key: 'image-to-video', label: 'Image to Video', description: 'Animate still images into video' },
    { key: 'video-to-video', label: 'Video to Video', description: 'Transform or restyle existing videos' },
    { key: 'video-editing', label: 'Video Editing', description: 'Edit or enhance video content' },
    { key: 'speech-to-video', label: 'Speech to Video', description: 'Generate video from speech/audio' },
    { key: 'lip-sync', label: 'Lip Sync', description: 'Sync lip movements to audio' },
  ],
  music: [
    { key: 'text-to-music', label: 'Text to Music', description: 'Generate music from text descriptions' },
  ],
  voice: [
    { key: 'text-to-speech', label: 'Text to Speech', description: 'Convert text to natural speech' },
    { key: 'speech-to-text', label: 'Speech to Text', description: 'Transcribe audio to text' },
    { key: 'audio-to-audio', label: 'Audio to Audio', description: 'Transform or enhance audio' },
  ],
};

export const CATEGORY_COLORS: Record<ModelMainType, { text: string; bg: string; border: string }> = {
  image: { text: 'text-[#FF6B00]', bg: 'bg-[#FF6B00]/10', border: 'border-[#FF6B00]/20' },
  video: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  music: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  voice: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
};

export function detectMainType(modelId: string, endpoint: string): ModelMainType {
  const lower = `${modelId} ${endpoint}`.toLowerCase();
  if (lower.includes('video') || lower.includes('kling') || lower.includes('veo') || lower.includes('wan') || lower.includes('hunyuan')) return 'video';
  if (lower.includes('music') || lower.includes('suno') || lower.includes('audio/gen')) return 'music';
  if (lower.includes('speech') || lower.includes('tts') || lower.includes('voice') || lower.includes('elevenlabs')) return 'voice';
  return 'image';
}

export function detectSubType(modelId: string, endpoint: string, hasImageInput: boolean): string {
  const lower = `${modelId} ${endpoint}`.toLowerCase();
  const main = detectMainType(modelId, endpoint);

  if (main === 'image') {
    if (lower.includes('edit') || lower.includes('inpaint')) return 'image-editing';
    if (hasImageInput || lower.includes('image-to-image') || lower.includes('i2i')) return 'image-to-image';
    return 'text-to-image';
  }
  if (main === 'video') {
    if (lower.includes('lip') || lower.includes('sync')) return 'lip-sync';
    if (lower.includes('speech-to') || lower.includes('audio-to')) return 'speech-to-video';
    if (lower.includes('edit')) return 'video-editing';
    if (lower.includes('video-to') || lower.includes('v2v')) return 'video-to-video';
    if (hasImageInput || lower.includes('image-to') || lower.includes('i2v')) return 'image-to-video';
    return 'text-to-video';
  }
  if (main === 'music') return 'text-to-music';
  if (main === 'voice') {
    if (lower.includes('stt') || lower.includes('transcri') || lower.includes('speech-to-text')) return 'speech-to-text';
    if (lower.includes('audio-to') || lower.includes('sts') || lower.includes('transform')) return 'audio-to-audio';
    return 'text-to-speech';
  }
  return 'text-to-image';
}
