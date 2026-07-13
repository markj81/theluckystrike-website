import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import audioBufferToWav from 'audiobuffer-to-wav';

import YouTubeInput from './components/YouTubeInput';
import WaveformDisplay from './components/WaveformDisplay';
import PadGrid from './components/PadGrid';
import PadSettings from './components/PadSettings';
import Toolbar from './components/Toolbar';
import SongPlayer from './components/SongPlayer';

import {
  PadState,
  PadEffects,
  MasterEffects,
  ChopMarker,
  ChopMode,
  KEY_TO_PAD,
  createDefaultPad,
} from './types';

import { detectTransients, sliceAudioBuffer } from './utils/audioUtils';
import {
  createPadPlayer,
  triggerPad,
  stopPad,
  setPadTranspose,
  setPadSpeed,
  setPadLoop,
  setPadEffects,
  setMasterEffects,
  ensureAudioContext,
  disposeAllPads,
  renderPadOffline,
  applyGlobalTranspose,
  applyGlobalSpeed,
  createSongPlayer,
  playSong,
  pauseSong,
  stopSong,
  setSongTranspose,
  setSongSpeed,
  setSongLoop,
  setSongVolume,
  setSongEffects,
  disposeSongPlayer,
} from './utils/toneEngine';

function App() {
  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');

  // Region selection
  const [regionStart, setRegionStart] = useState(0);
  const [regionEnd, setRegionEnd] = useState(0);

  // Chop mode
  const [chopMode, setChopMode] = useState<ChopMode>('auto');
  const [manualMarkers, setManualMarkers] = useState<ChopMarker[]>([]);

  // Pads
  const [pads, setPads] = useState<PadState[]>(
    Array.from({ length: 16 }, (_, i) => createDefaultPad(i + 1))
  );
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [selectedPad, setSelectedPad] = useState<number | null>(null);

  // Global controls
  const [globalTranspose, setGlobalTranspose] = useState(0);
  const [globalSpeed, setGlobalSpeed] = useState(100);
  const [masterEffectsState, setMasterEffectsState] = useState<MasterEffects>({
    reverb: 0,
    delay: 0,
    lowpass: 0,
    highpass: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Song player state
  const [songPlayerReady, setSongPlayerReady] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false);

  // Refs for active pad tracking
  const heldKeys = useRef<Set<string>>(new Set());

  // Handle audio loaded from YouTube
  const handleAudioLoaded = useCallback((url: string, title: string) => {
    setAudioUrl(url);
    setVideoTitle(title);
    setError(null);
    // Reset pads and song player
    disposeAllPads();
    disposeSongPlayer();
    setSongPlayerReady(false);
    setIsSongPlaying(false);
    setPads(Array.from({ length: 16 }, (_, i) => createDefaultPad(i + 1)));
    setActivePads(new Set());
    setManualMarkers([]);
  }, []);

  // Handle audio buffer decoded from waveform
  const handleAudioDecoded = useCallback((buffer: AudioBuffer) => {
    setAudioBuffer(buffer);
    setRegionStart(0);
    setRegionEnd(buffer.duration);

    // Create the full song player
    ensureAudioContext().then(() => {
      const toneBuffer = new Tone.ToneAudioBuffer(buffer);
      createSongPlayer(toneBuffer);
      setSongPlayerReady(true);
      setIsSongPlaying(false);
    });
  }, []);

  // Song player controls
  const handleSongPlay = useCallback(async () => {
    await ensureAudioContext();
    playSong();
    setIsSongPlaying(true);
  }, []);

  const handleSongPause = useCallback(() => {
    pauseSong();
    setIsSongPlaying(false);
  }, []);

  const handleSongStop = useCallback(() => {
    stopSong();
    setIsSongPlaying(false);
  }, []);

  const handleSongTranspose = useCallback((semitones: number) => {
    setSongTranspose(semitones);
  }, []);

  const handleSongSpeed = useCallback((speed: number) => {
    setSongSpeed(speed);
  }, []);

  const handleSongLoop = useCallback((loop: boolean) => {
    setSongLoop(loop);
  }, []);

  const handleSongVolume = useCallback((volume: number) => {
    setSongVolume(volume);
  }, []);

  const handleSongEffects = useCallback((effects: Partial<PadEffects>) => {
    setSongEffects(effects);
  }, []);

  // Region change
  const handleRegionChange = useCallback((start: number, end: number) => {
    setRegionStart(start);
    setRegionEnd(end);
  }, []);

  // Manual markers
  const handleAddMarker = useCallback((time: number) => {
    setManualMarkers((prev) => {
      if (prev.length >= 15) return prev;
      return [...prev, { id: `marker-${Date.now()}`, time }];
    });
  }, []);

  const handleRemoveMarker = useCallback((id: string) => {
    setManualMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleMoveMarker = useCallback((id: string, time: number) => {
    setManualMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, time } : m))
    );
  }, []);

  // Chop action
  const handleChop = useCallback(async () => {
    if (!audioBuffer) return;

    await ensureAudioContext();

    const start = regionStart;
    const end = regionEnd;

    let markers: number[];

    if (chopMode === 'auto') {
      markers = detectTransients(audioBuffer, start, end, 16);
    } else {
      // Use manual markers
      const sortedMarkers = [...manualMarkers]
        .map((m) => m.time)
        .sort((a, b) => a - b);
      markers = sortedMarkers;
    }

    // Slice audio buffer
    const slices = sliceAudioBuffer(audioBuffer, start, end, markers);

    // Update pads with sliced buffers
    const newPads = pads.map((pad, i) => {
      const slice = slices[i] || null;
      if (slice) {
        // Create Tone buffer and player from native AudioBuffer
        const toneBuffer = new Tone.ToneAudioBuffer(slice);
        createPadPlayer(pad.id, toneBuffer, pad.mode === 'loop');
      }

      const boundaries = [start, ...markers.sort((a, b) => a - b), end];
      return {
        ...pad,
        buffer: slice,
        startTime: boundaries[i] || start,
        endTime: boundaries[i + 1] || end,
      };
    });

    setPads(newPads);
  }, [audioBuffer, regionStart, regionEnd, chopMode, manualMarkers, pads]);

  // Pad trigger
  const handlePadTrigger = useCallback(
    async (padId: number) => {
      await ensureAudioContext();
      triggerPad(padId);
      setActivePads((prev) => new Set(prev).add(padId));

      const pad = pads.find((p) => p.id === padId);
      if (pad && pad.mode === 'oneshot' && pad.buffer) {
        const duration = (pad.buffer.duration / (pad.speed / 100)) * 1000;
        setTimeout(() => {
          setActivePads((prev) => {
            const next = new Set(prev);
            next.delete(padId);
            return next;
          });
        }, duration);
      }
    },
    [pads]
  );

  // Pad release (for loop mode)
  const handlePadRelease = useCallback((padId: number) => {
    stopPad(padId);
    setActivePads((prev) => {
      const next = new Set(prev);
      next.delete(padId);
      return next;
    });
  }, []);

  // Toggle pad mode
  const handleToggleMode = useCallback(
    (padId: number) => {
      setPads((prev) =>
        prev.map((p) => {
          if (p.id === padId) {
            const newMode = p.mode === 'oneshot' ? 'loop' : 'oneshot';
            setPadLoop(padId, newMode === 'loop');
            return { ...p, mode: newMode };
          }
          return p;
        })
      );
    },
    []
  );

  // Open pad settings
  const handleOpenSettings = useCallback((padId: number) => {
    setSelectedPad(padId);
  }, []);

  // Per-pad transpose
  const handlePadTranspose = useCallback((padId: number, semitones: number) => {
    setPadTranspose(padId, semitones);
    setPads((prev) =>
      prev.map((p) => (p.id === padId ? { ...p, transpose: semitones } : p))
    );
  }, []);

  // Per-pad speed
  const handlePadSpeed = useCallback((padId: number, speed: number) => {
    setPadSpeed(padId, speed);
    setPads((prev) =>
      prev.map((p) => (p.id === padId ? { ...p, speed } : p))
    );
  }, []);

  // Per-pad effects
  const handlePadEffects = useCallback(
    (padId: number, effects: Partial<PadEffects>) => {
      setPadEffects(padId, effects);
      setPads((prev) =>
        prev.map((p) =>
          p.id === padId
            ? { ...p, effects: { ...p.effects, ...effects } }
            : p
        )
      );
    },
    []
  );

  // Global transpose change — applies to ALL audio (pads + song)
  const handleGlobalTranspose = useCallback(
    (value: number) => {
      setGlobalTranspose(value);
      applyGlobalTranspose(value);
    },
    []
  );

  // Global speed change — applies to ALL audio (pads + song)
  const handleGlobalSpeed = useCallback(
    (value: number) => {
      setGlobalSpeed(value);
      applyGlobalSpeed(value);
    },
    []
  );

  // Master effects
  const handleMasterEffects = useCallback(
    (effects: Partial<MasterEffects>) => {
      setMasterEffectsState((prev) => {
        const updated = { ...prev, ...effects };
        setMasterEffects(updated);
        return updated;
      });
    },
    []
  );

  // Export
  const handleExport = useCallback(async () => {
    if (!audioBuffer || !pads.some((p) => p.buffer)) return;

    setIsExporting(true);

    try {
      const zip = new JSZip();
      const exportFolder = zip.folder('export')!;

      // Export full song
      const fullSongWav = audioBufferToWav(audioBuffer);
      exportFolder.file('full_song.wav', fullSongWav);

      // Export each pad
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!pad.buffer) continue;

        try {
          const rendered = await renderPadOffline(
            pad.buffer,
            pad.transpose,
            pad.speed,
            pad.effects
          );
          const wavData = audioBufferToWav(rendered);
          const padNum = String(pad.id).padStart(2, '0');
          exportFolder.file(`pad_${padNum}.wav`, wavData);
        } catch (err) {
          console.error(`Failed to render pad ${pad.id}:`, err);
          // Fall back to raw buffer
          const wavData = audioBufferToWav(pad.buffer);
          const padNum = String(pad.id).padStart(2, '0');
          exportFolder.file(`pad_${padNum}.wav`, wavData);
        }
      }

      // Generate zip
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const filename = videoTitle
        ? `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_samples.zip`
        : 'dj_samples.zip';

      saveAs(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [audioBuffer, pads, videoTitle]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const key = e.key.toLowerCase();
      const padId = KEY_TO_PAD[key];

      if (padId && !heldKeys.current.has(key)) {
        heldKeys.current.add(key);
        handlePadTrigger(padId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const padId = KEY_TO_PAD[key];

      if (padId) {
        heldKeys.current.delete(key);
        const pad = pads.find((p) => p.id === padId);
        if (pad?.mode === 'loop') {
          handlePadRelease(padId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pads, handlePadTrigger, handlePadRelease]);

  const selectedPadState = selectedPad
    ? pads.find((p) => p.id === selectedPad)
    : null;

  const hasPads = pads.some((p) => p.buffer !== null);

  return (
    <div className="min-h-screen bg-mpc-bg">
      {/* Header */}
      <header className="bg-mpc-surface border-b border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mpc-accent rounded-lg flex items-center justify-center text-xl font-bold shadow-lg">
              🎛️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DJ Sample Pad</h1>
              <p className="text-xs text-mpc-text-dim">YouTube → Chop → Play → Export</p>
            </div>
          </div>
          <div className="text-xs text-mpc-text-dim font-mono">
            Keys: C V B N • F G H J • R T Y U • 5 6 7 8
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Error display */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* YouTube Input */}
        <YouTubeInput
          onAudioLoaded={handleAudioLoaded}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
        />

        {/* Waveform */}
        {audioUrl && (
          <WaveformDisplay
            audioUrl={audioUrl}
            onAudioDecoded={handleAudioDecoded}
            regionStart={regionStart}
            regionEnd={regionEnd}
            onRegionChange={handleRegionChange}
            chopMode={chopMode}
            manualMarkers={manualMarkers}
            onAddMarker={handleAddMarker}
            onRemoveMarker={handleRemoveMarker}
            onMoveMarker={handleMoveMarker}
          />
        )}

        {/* Toolbar (chop controls, global effects, export) */}
        {audioUrl && (
          <Toolbar
            videoTitle={videoTitle}
            chopMode={chopMode}
            onChopModeChange={setChopMode}
            onChop={handleChop}
            globalTranspose={globalTranspose}
            onGlobalTransposeChange={handleGlobalTranspose}
            globalSpeed={globalSpeed}
            onGlobalSpeedChange={handleGlobalSpeed}
            masterEffects={masterEffectsState}
            onMasterEffectsChange={handleMasterEffects}
            onExport={handleExport}
            isExporting={isExporting}
            hasAudio={!!audioBuffer}
            hasPads={hasPads}
          />
        )}

        {/* Song Player — full song playback with effects */}
        {audioUrl && (
          <SongPlayer
            audioBuffer={audioBuffer}
            videoTitle={videoTitle}
            isReady={songPlayerReady}
            onPlay={handleSongPlay}
            onPause={handleSongPause}
            onStop={handleSongStop}
            onTransposeChange={handleSongTranspose}
            onSpeedChange={handleSongSpeed}
            onLoopChange={handleSongLoop}
            onVolumeChange={handleSongVolume}
            onEffectsChange={handleSongEffects}
            isPlaying={isSongPlaying}
          />
        )}

        {/* Pad Grid */}
        <PadGrid
          pads={pads}
          activePads={activePads}
          onTrigger={handlePadTrigger}
          onRelease={handlePadRelease}
          onToggleMode={handleToggleMode}
          onOpenSettings={handleOpenSettings}
        />
      </main>

      {/* Pad Settings Modal */}
      {selectedPadState && (
        <PadSettings
          pad={selectedPadState}
          onClose={() => setSelectedPad(null)}
          onTransposeChange={handlePadTranspose}
          onSpeedChange={handlePadSpeed}
          onEffectsChange={handlePadEffects}
        />
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-mpc-text-dim border-t border-gray-800/50">
        DJ Sample Pad — Right-click a pad to open settings
      </footer>
    </div>
  );
}

export default App;
