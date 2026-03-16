export interface CameraRig {
  body: string;
  lens: string;
  focalLength: number;
  aperture: string;
  filmLook: string;
  aspectRatio: string;
}

export interface CinematicSession {
  id?: string;
  prompt: string;
  enhancedPrompt: string;
  genre: string;
  tone: string;
  duration: string;
  platform: string;
  styleReference: string | null;
  subjectReference: string | null;
  characterLock: boolean;
  cameraRig: CameraRig;
  heroFrames: string[];
  selectedHeroFrame: number;
  videoModel: string;
  videoDuration: string;
  motionDescription: string;
  cameraMovements: string[];
  motionIntensity: number;
  motionSpeed: string;
  additionalMotion: string;
  finalVideoUrl: string;
}

export interface AICharacter {
  id: string;
  user_id: string;
  name: string;
  character_type: string;
  gender: string;
  age_range: string;
  style_notes: string;
  signature_elements: string;
  background_preference: string;
  photos_count: number;
  reference_paths: string[];
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  category: 'input' | 'process' | 'output' | 'utility';
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  status: 'empty' | 'ready' | 'running' | 'complete' | 'error';
  output?: string;
}

export interface WorkflowConnection {
  id: string;
  fromNode: string;
  toNode: string;
}

export interface SavedWorkflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}
