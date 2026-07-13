import * as Tone from 'tone';

export interface PadPlayer {
  player: Tone.Player;
  pitchShift: Tone.PitchShift;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  lowpass: Tone.Filter;
  highpass: Tone.Filter;
  gain: Tone.Gain;
}

export interface MasterChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  lowpass: Tone.Filter;
  highpass: Tone.Filter;
  gain: Tone.Gain;
}

let masterChain: MasterChain | null = null;
const padPlayers: Map<number, PadPlayer> = new Map();

// Global transpose/speed state (combined with per-pad/song values)
let globalTransposeOffset = 0;
let globalSpeedFactor = 1; // 1 = 100%
const padBaseTranspose: Map<number, number> = new Map();
const padBaseSpeed: Map<number, number> = new Map();
let songBaseTranspose = 0;
let songBaseSpeed = 100;

/**
 * Initialize the master effects chain
 */
export function initMasterChain(): MasterChain {
  if (masterChain) return masterChain;

  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
  const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 });
  const lowpass = new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -24 });
  const highpass = new Tone.Filter({ frequency: 20, type: 'highpass', rolloff: -24 });
  const gain = new Tone.Gain(1);

  reverb.chain(delay, lowpass, highpass, gain, Tone.getDestination());

  masterChain = { reverb, delay, lowpass, highpass, gain };
  return masterChain;
}

/**
 * Get or create a pad player with its effects chain
 */
export function createPadPlayer(
  padId: number,
  buffer: Tone.ToneAudioBuffer,
  loop: boolean = false
): PadPlayer {
  // Dispose existing player for this pad
  disposePadPlayer(padId);

  const master = initMasterChain();

  const player = new Tone.Player({
    url: buffer,
    loop,
  });

  const pitchShift = new Tone.PitchShift({ pitch: 0, windowSize: 0.2 });
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
  const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 });
  const lowpass = new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -24 });
  const highpass = new Tone.Filter({ frequency: 20, type: 'highpass', rolloff: -24 });
  const gain = new Tone.Gain(1);

  // Chain: Player → PitchShift → Reverb → Delay → LP → HP → Gain → Master Reverb
  player.chain(pitchShift, reverb, delay, lowpass, highpass, gain, master.reverb);

  const padPlayer: PadPlayer = {
    player,
    pitchShift,
    reverb,
    delay,
    lowpass,
    highpass,
    gain,
  };

  padPlayers.set(padId, padPlayer);
  padBaseTranspose.set(padId, 0);
  padBaseSpeed.set(padId, 100);
  return padPlayer;
}

/**
 * Trigger pad playback
 */
export function triggerPad(padId: number): void {
  const pp = padPlayers.get(padId);
  if (!pp) return;

  if (pp.player.state === 'started') {
    pp.player.stop();
  }
  pp.player.start();
}

/**
 * Stop pad playback
 */
export function stopPad(padId: number): void {
  const pp = padPlayers.get(padId);
  if (!pp) return;

  if (pp.player.state === 'started') {
    pp.player.stop();
  }
}

/**
 * Update pad transpose (pitch in semitones) — combined with global offset
 */
export function setPadTranspose(padId: number, semitones: number): void {
  padBaseTranspose.set(padId, semitones);
  const pp = padPlayers.get(padId);
  if (!pp) return;
  pp.pitchShift.pitch = semitones + globalTransposeOffset;
}

/**
 * Update pad speed (playback rate) — combined with global multiplier
 */
export function setPadSpeed(padId: number, speedPercent: number): void {
  padBaseSpeed.set(padId, speedPercent);
  const pp = padPlayers.get(padId);
  if (!pp) return;
  pp.player.playbackRate = (speedPercent / 100) * globalSpeedFactor;
}

/**
 * Set pad loop mode
 */
export function setPadLoop(padId: number, loop: boolean): void {
  const pp = padPlayers.get(padId);
  if (!pp) return;
  pp.player.loop = loop;
}

/**
 * Update pad effects
 */
export function setPadEffects(
  padId: number,
  effects: { reverb?: number; delay?: number; lowpass?: number; highpass?: number }
): void {
  const pp = padPlayers.get(padId);
  if (!pp) return;

  if (effects.reverb !== undefined) {
    pp.reverb.wet.value = effects.reverb;
  }
  if (effects.delay !== undefined) {
    pp.delay.wet.value = effects.delay;
  }
  if (effects.lowpass !== undefined) {
    // Map 0-1 to 20000Hz-100Hz
    const freq = 20000 * Math.pow(100 / 20000, effects.lowpass);
    pp.lowpass.frequency.value = freq;
  }
  if (effects.highpass !== undefined) {
    // Map 0-1 to 20Hz-20000Hz
    const freq = 20 * Math.pow(20000 / 20, effects.highpass);
    pp.highpass.frequency.value = freq;
  }
}

/**
 * Apply a global transpose offset to ALL audio (pads + song)
 */
export function applyGlobalTranspose(semitones: number): void {
  globalTransposeOffset = semitones;
  // Re-apply to every pad
  padPlayers.forEach((pp, id) => {
    const base = padBaseTranspose.get(id) || 0;
    pp.pitchShift.pitch = base + globalTransposeOffset;
  });
  // Re-apply to song player
  if (songPlayer) {
    songPlayer.pitchShift.pitch = songBaseTranspose + globalTransposeOffset;
  }
}

/**
 * Apply a global speed multiplier to ALL audio (pads + song)
 */
export function applyGlobalSpeed(speedPercent: number): void {
  globalSpeedFactor = speedPercent / 100;
  // Re-apply to every pad
  padPlayers.forEach((pp, id) => {
    const base = padBaseSpeed.get(id) || 100;
    pp.player.playbackRate = (base / 100) * globalSpeedFactor;
  });
  // Re-apply to song player
  if (songPlayer) {
    songPlayer.player.playbackRate = (songBaseSpeed / 100) * globalSpeedFactor;
  }
}

/**
 * Update master effects
 */
export function setMasterEffects(
  effects: { reverb?: number; delay?: number; lowpass?: number; highpass?: number }
): void {
  const master = masterChain;
  if (!master) return;

  if (effects.reverb !== undefined) {
    master.reverb.wet.value = effects.reverb;
  }
  if (effects.delay !== undefined) {
    master.delay.wet.value = effects.delay;
  }
  if (effects.lowpass !== undefined) {
    const freq = 20000 * Math.pow(100 / 20000, effects.lowpass);
    master.lowpass.frequency.value = freq;
  }
  if (effects.highpass !== undefined) {
    const freq = 20 * Math.pow(20000 / 20, effects.highpass);
    master.highpass.frequency.value = freq;
  }
}

/**
 * Dispose a single pad player
 */
export function disposePadPlayer(padId: number): void {
  const pp = padPlayers.get(padId);
  if (!pp) return;

  pp.player.stop();
  pp.player.dispose();
  pp.pitchShift.dispose();
  pp.reverb.dispose();
  pp.delay.dispose();
  pp.lowpass.dispose();
  pp.highpass.dispose();
  pp.gain.dispose();
  padPlayers.delete(padId);
  padBaseTranspose.delete(padId);
  padBaseSpeed.delete(padId);
}

/**
 * Dispose all pad players
 */
export function disposeAllPads(): void {
  padPlayers.forEach((_, id) => disposePadPlayer(id));
  globalTransposeOffset = 0;
  globalSpeedFactor = 1;
}

/**
 * Render a pad's audio offline with all effects baked in
 */
export async function renderPadOffline(
  buffer: AudioBuffer,
  transpose: number,
  speed: number,
  effects: { reverb: number; delay: number; lowpass: number; highpass: number }
): Promise<AudioBuffer> {
  const duration = buffer.duration / (speed / 100) + 2; // extra time for reverb tail
  const sampleRate = buffer.sampleRate;

  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(duration * sampleRate),
    sampleRate
  );

  // Create source
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed / 100;

  // Simple gain for now — full offline pitch shift is complex
  // For export, we apply playback rate change
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1;

  // Apply filters
  const lowpassNode = offlineContext.createBiquadFilter();
  lowpassNode.type = 'lowpass';
  lowpassNode.frequency.value = effects.lowpass > 0
    ? 20000 * Math.pow(100 / 20000, effects.lowpass)
    : 20000;

  const highpassNode = offlineContext.createBiquadFilter();
  highpassNode.type = 'highpass';
  highpassNode.frequency.value = effects.highpass > 0
    ? 20 * Math.pow(20000 / 20, effects.highpass)
    : 20;

  source.connect(lowpassNode);
  lowpassNode.connect(highpassNode);
  highpassNode.connect(gainNode);
  gainNode.connect(offlineContext.destination);

  source.start(0);

  return offlineContext.startRendering();
}

/**
 * Ensure Tone.js audio context is started (required after user interaction)
 */
export async function ensureAudioContext(): Promise<void> {
  if (Tone.getContext().state !== 'running') {
    await Tone.start();
  }
}

// ─── Full Song Player ──────────────────────────────────────────────────────────

export interface SongPlayerState {
  player: Tone.Player;
  pitchShift: Tone.PitchShift;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  lowpass: Tone.Filter;
  highpass: Tone.Filter;
  gain: Tone.Gain;
}

let songPlayer: SongPlayerState | null = null;

/**
 * Create the full-song player with its own independent effects chain
 */
export function createSongPlayer(buffer: Tone.ToneAudioBuffer): SongPlayerState {
  disposeSongPlayer();

  const player = new Tone.Player({
    url: buffer,
    loop: false,
  });

  const pitchShift = new Tone.PitchShift({ pitch: 0, windowSize: 0.2 });
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
  const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 });
  const lowpass = new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -24 });
  const highpass = new Tone.Filter({ frequency: 20, type: 'highpass', rolloff: -24 });
  const gain = new Tone.Gain(1);

  // Route through master chain so global Master Effects apply to song too
  const master = initMasterChain();
  player.chain(pitchShift, reverb, delay, lowpass, highpass, gain, master.reverb);

  songPlayer = { player, pitchShift, reverb, delay, lowpass, highpass, gain };
  songBaseTranspose = 0;
  songBaseSpeed = 100;
  return songPlayer;
}

export function playSong(): void {
  if (!songPlayer) return;
  if (songPlayer.player.state === 'started') {
    songPlayer.player.stop();
  }
  songPlayer.player.start();
}

export function pauseSong(): void {
  if (!songPlayer) return;
  if (songPlayer.player.state === 'started') {
    songPlayer.player.stop();
  }
}

export function stopSong(): void {
  if (!songPlayer) return;
  if (songPlayer.player.state === 'started') {
    songPlayer.player.stop();
  }
}

export function setSongTranspose(semitones: number): void {
  songBaseTranspose = semitones;
  if (!songPlayer) return;
  songPlayer.pitchShift.pitch = semitones + globalTransposeOffset;
}

export function setSongSpeed(speedPercent: number): void {
  songBaseSpeed = speedPercent;
  if (!songPlayer) return;
  songPlayer.player.playbackRate = (speedPercent / 100) * globalSpeedFactor;
}

export function setSongLoop(loop: boolean): void {
  if (!songPlayer) return;
  songPlayer.player.loop = loop;
}

export function setSongVolume(volume: number): void {
  if (!songPlayer) return;
  songPlayer.gain.gain.value = volume;
}

export function setSongEffects(
  effects: { reverb?: number; delay?: number; lowpass?: number; highpass?: number }
): void {
  if (!songPlayer) return;

  if (effects.reverb !== undefined) {
    songPlayer.reverb.wet.value = effects.reverb;
  }
  if (effects.delay !== undefined) {
    songPlayer.delay.wet.value = effects.delay;
  }
  if (effects.lowpass !== undefined) {
    const freq = 20000 * Math.pow(100 / 20000, effects.lowpass);
    songPlayer.lowpass.frequency.value = freq;
  }
  if (effects.highpass !== undefined) {
    const freq = 20 * Math.pow(20000 / 20, effects.highpass);
    songPlayer.highpass.frequency.value = freq;
  }
}

export function isSongPlaying(): boolean {
  return songPlayer?.player.state === 'started';
}

export function disposeSongPlayer(): void {
  if (!songPlayer) return;
  try { songPlayer.player.stop(); } catch {}
  songPlayer.player.dispose();
  songPlayer.pitchShift.dispose();
  songPlayer.reverb.dispose();
  songPlayer.delay.dispose();
  songPlayer.lowpass.dispose();
  songPlayer.highpass.dispose();
  songPlayer.gain.dispose();
  songPlayer = null;
  songBaseTranspose = 0;
  songBaseSpeed = 100;
}
