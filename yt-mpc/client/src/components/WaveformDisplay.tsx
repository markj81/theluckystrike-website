import React, { useEffect, useRef, useCallback, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions.js';

interface WaveformDisplayProps {
  audioUrl: string | null;
  onAudioDecoded: (buffer: AudioBuffer) => void;
  regionStart: number;
  regionEnd: number;
  onRegionChange: (start: number, end: number) => void;
  chopMode: 'auto' | 'manual';
  manualMarkers: { id: string; time: number }[];
  onAddMarker: (time: number) => void;
  onRemoveMarker: (id: string) => void;
  onMoveMarker: (id: string, time: number) => void;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioUrl,
  onAudioDecoded,
  regionStart,
  regionEnd,
  onRegionChange,
  chopMode,
  manualMarkers,
  onAddMarker,
  onRemoveMarker,
  onMoveMarker,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const selectionRegionRef = useRef<Region | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const updatingRegionRef = useRef(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#533483',
      progressColor: '#e94560',
      cursorColor: '#e94560',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 150,
      normalize: true,
      plugins: [regions],
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('decode', () => {
      const buf = ws.getDecodedData();
      if (buf) {
        onAudioDecoded(buf);
      }
    });

    // Handle region updates
    regions.on('region-updated', (region: Region) => {
      if (region.id === 'selection' && !updatingRegionRef.current) {
        onRegionChange(region.start, region.end);
      }
    });

    return () => {
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load audio URL
  useEffect(() => {
    if (!audioUrl || !wavesurferRef.current) return;
    setIsReady(false);
    wavesurferRef.current.load(audioUrl);
  }, [audioUrl]);

  // Create/update selection region
  useEffect(() => {
    if (!isReady || !regionsRef.current || !wavesurferRef.current) return;

    const dur = wavesurferRef.current.getDuration();
    if (dur <= 0) return;

    updatingRegionRef.current = true;

    // Remove existing selection region
    if (selectionRegionRef.current) {
      selectionRegionRef.current.remove();
      selectionRegionRef.current = null;
    }

    const start = regionStart >= 0 ? regionStart : 0;
    const end = regionEnd > 0 ? regionEnd : dur;

    const region = regionsRef.current.addRegion({
      id: 'selection',
      start,
      end,
      color: 'rgba(233, 69, 96, 0.15)',
      drag: true,
      resize: true,
    });

    selectionRegionRef.current = region;
    updatingRegionRef.current = false;
  }, [isReady, regionStart, regionEnd]);

  // Draw manual chop markers
  useEffect(() => {
    if (!isReady || !regionsRef.current || chopMode !== 'manual') return;

    // Remove existing markers (but not the selection region)
    const allRegions = regionsRef.current.getRegions();
    allRegions.forEach((r) => {
      if (r.id !== 'selection') {
        r.remove();
      }
    });

    // Add manual markers
    manualMarkers.forEach((marker) => {
      regionsRef.current!.addRegion({
        id: marker.id,
        start: marker.time,
        end: marker.time,
        color: 'rgba(255, 200, 50, 0.8)',
        drag: true,
        resize: false,
        content: '✂️',
      });
    });
  }, [isReady, chopMode, manualMarkers]);

  // Handle click to add manual markers
  const handleWaveformClick = useCallback(
    (e: React.MouseEvent) => {
      if (chopMode !== 'manual' || !wavesurferRef.current || !containerRef.current) return;

      // Only add markers on double-click
      if (e.detail !== 2) return;

      if (manualMarkers.length >= 15) return; // Max 15 markers = 16 slices

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeX = clickX / rect.width;
      const time = relativeX * wavesurferRef.current.getDuration();

      if (time >= regionStart && time <= regionEnd) {
        onAddMarker(time);
      }
    },
    [chopMode, manualMarkers.length, regionStart, regionEnd, onAddMarker]
  );

  // Zoom control
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    wavesurferRef.current.zoom(zoom * 50);
  }, [zoom, isReady]);

  const togglePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  const playRegion = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setTime(regionStart);
    wavesurferRef.current.play();
    // Auto-stop at region end
    const checkInterval = setInterval(() => {
      if (wavesurferRef.current && wavesurferRef.current.getCurrentTime() >= regionEnd) {
        wavesurferRef.current.pause();
        clearInterval(checkInterval);
      }
    }, 50);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Waveform
        </h2>
        <div className="flex items-center gap-4 text-sm font-mono text-mpc-text-dim">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Zoom:</span>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Waveform container */}
      <div
        ref={containerRef}
        className="bg-mpc-bg rounded-lg border border-gray-800 overflow-hidden cursor-crosshair"
        onClick={handleWaveformClick}
        style={{ minHeight: 150 }}
      />

      {/* Controls under waveform */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button onClick={togglePlayPause} className="btn-secondary flex items-center gap-1">
            ▶️ Play / Pause
          </button>
          <button onClick={playRegion} className="btn-secondary flex items-center gap-1">
            🔁 Play Selection
          </button>
        </div>

        <div className="text-sm text-mpc-text-dim font-mono">
          Selection: {formatTime(regionStart)} → {formatTime(regionEnd)}
          <span className="ml-2 text-mpc-accent">
            ({formatTime(regionEnd - regionStart)})
          </span>
        </div>
      </div>

      {/* Manual mode hint */}
      {chopMode === 'manual' && (
        <div className="mt-2 text-xs text-mpc-text-dim">
          💡 Double-click within the selection to place chop markers. Right-click a marker to remove it.
          ({manualMarkers.length}/15 markers placed → {manualMarkers.length + 1} slices)
        </div>
      )}
    </div>
  );
};

export default WaveformDisplay;
