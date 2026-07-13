export interface PadState {
  id: number;
  buffer: AudioBuffer | null;
  startTime: number;      // Start time in seconds within the full audio
  endTime: number;        // End time in seconds within the full audio
  mode: 'oneshot' | 'loop';
  transpose: number;      // Semitones (-24 to +24)
  speed: number;          // Percentage (50–200, where 100 = normal)
  effects: PadEffects;
  isPlaying: boolean;
}

export interface PadEffects {
  reverb: number;          // Wet/dry 0-1
  delay: number;           // Wet/dry 0-1
  lowpass: number;         // 0-1 (0 = full open 20kHz, 1 = fully closed ~100Hz)
  highpass: number;        // 0-1 (0 = fully open 20Hz, 1 = fully closed ~20kHz)
}

export interface MasterEffects {
  reverb: number;
  delay: number;
  lowpass: number;
  highpass: number;
}

export interface ChopMarker {
  id: string;
  time: number;           // Position in seconds
}

export type ChopMode = 'auto' | 'manual';

export interface AppState {
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;
  isLoading: boolean;
  error: string | null;
  videoTitle: string;
  regionStart: number;
  regionEnd: number;
  chopMode: ChopMode;
  manualMarkers: ChopMarker[];
  pads: PadState[];
  globalTranspose: number;
  globalSpeed: number;
  masterEffects: MasterEffects;
  isExporting: boolean;
}

export const DEFAULT_PAD_EFFECTS: PadEffects = {
  reverb: 0,
  delay: 0,
  lowpass: 0,
  highpass: 0,
};

export const createDefaultPad = (id: number): PadState => ({
  id,
  buffer: null,
  startTime: 0,
  endTime: 0,
  mode: 'oneshot',
  transpose: 0,
  speed: 100,
  effects: { ...DEFAULT_PAD_EFFECTS },
  isPlaying: false,
});

// Keyboard mapping: bottom row = pads 1-4, up to top = pads 13-16
export const KEY_TO_PAD: Record<string, number> = {
  'c': 1,  'v': 2,  'b': 3,  'n': 4,
  'f': 5,  'g': 6,  'h': 7,  'j': 8,
  'r': 9,  't': 10, 'y': 11, 'u': 12,
  '5': 13, '6': 14, '7': 15, '8': 16,
};

export const PAD_TO_KEY: Record<number, string> = Object.fromEntries(
  Object.entries(KEY_TO_PAD).map(([k, v]) => [v, k.toUpperCase()])
);

export const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
