export type HapticIntensity = 'off' | 'low' | 'medium' | 'high' | 'ultra';

export interface TimeSignature {
  beats: number;
  subdivision: number;
  name: string;
  accentIndices?: number[]; // default [0]
}

export interface HapticConfig {
  intensity: HapticIntensity;
  accentFirstBeat: boolean;
  vibrateOnPhone: boolean;
  vibrateOnFit3: boolean;
  durationMs: number;
  accentDurationMs: number;
}

export type SoundType = 'woodblock' | 'digital' | 'beep' | 'hiit-kick' | 'silent';

export interface ExercisePreset {
  id: string;
  label: string;
  bpm: number;
  category: 'Caminar' | 'Trote' | 'Running' | 'Maratón' | 'HIIT / Cardio';
  description: string;
  spmRange: string;
}

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  currentBeat: number; // 0-indexed
  sound: SoundType;
  volume: number; // 0 to 1
  soundEnabled: boolean;
  hapticConfig: HapticConfig;
}

export interface Fit3BandStatus {
  connected: boolean;
  deviceName: string;
  battery: number;
  activeTile: 'metronome' | 'haptics' | 'cadence';
  isWristActive: boolean;
  lastGesture: string | null;
}
