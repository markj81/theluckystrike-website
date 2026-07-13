import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PadEffects } from '../types';

interface SongPlayerProps {
  audioBuffer: AudioBuffer | null;
  videoTitle: string;
  isReady: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onTransposeChange: (semitones: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopChange: (loop: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onEffectsChange: (effects: Partial<PadEffects>) => void;
  isPlaying: boolean;
}

const SongPlayer: React.FC<SongPlayerProps> = ({
  audioBuffer,
  videoTitle,
  isReady,
  onPlay,
  onPause,
  onStop,
  onTransposeChange,
  onSpeedChange,
  onLoopChange,
  onVolumeChange,
  onEffectsChange,
  isPlaying,
}) => {
  const [transpose, setTranspose] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [loop, setLoop] = useState(false);
  const [volume, setVolume] = useState(100);
  const [effects, setEffects] = useState<PadEffects>({
    reverb: 0,
    delay: 0,
    lowpass: 0,
    highpass: 0,
  });
  const [showEffects, setShowEffects] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);

  // Track playback time
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - currentTime * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const duration = audioBuffer?.duration || 0;
        if (duration > 0 && elapsed >= duration / (speed / 100)) {
          if (loop) {
            startTimeRef.current = Date.now();
            setCurrentTime(0);
          } else {
            setCurrentTime(duration);
            clearInterval(intervalRef.current);
          }
        } else {
          setCurrentTime(elapsed * (speed / 100));
        }
      }, 50);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, loop, audioBuffer]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      setCurrentTime(0);
      startTimeRef.current = Date.now();
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleStop = useCallback(() => {
    onStop();
    setCurrentTime(0);
  }, [onStop]);

  const handleTranspose = useCallback((val: number) => {
    const clamped = Math.max(-24, Math.min(24, val));
    setTranspose(clamped);
    onTransposeChange(clamped);
  }, [onTransposeChange]);

  const handleSpeed = useCallback((val: number) => {
    const clamped = Math.max(50, Math.min(200, val));
    setSpeed(clamped);
    onSpeedChange(clamped);
  }, [onSpeedChange]);

  const handleLoop = useCallback(() => {
    const newLoop = !loop;
    setLoop(newLoop);
    onLoopChange(newLoop);
  }, [loop, onLoopChange]);

  const handleVolume = useCallback((val: number) => {
    setVolume(val);
    onVolumeChange(val / 100);
  }, [onVolumeChange]);

  const handleEffect = useCallback((key: keyof PadEffects, val: number) => {
    const newEffects = { ...effects, [key]: val / 100 };
    setEffects(newEffects);
    onEffectsChange({ [key]: val / 100 });
  }, [effects, onEffectsChange]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const duration = audioBuffer?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isReady) return null;

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🔊</span>
          Song Player
        </h2>
        {videoTitle && (
          <span className="text-sm text-mpc-text-dim truncate max-w-xs">
            {videoTitle}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-mpc-bg rounded-full mb-3 overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          setCurrentTime(pct * duration);
        }}
      >
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-mpc-accent to-mpc-accent-glow rounded-full transition-all duration-100"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between text-xs font-mono text-mpc-text-dim mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Transport controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Play / Pause */}
        <button
          onClick={handlePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all
            ${isPlaying
              ? 'bg-mpc-accent shadow-pad-active text-white'
              : 'bg-mpc-pad hover:bg-mpc-pad-active shadow-pad text-white'
            }`}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="w-10 h-10 rounded-full bg-mpc-pad hover:bg-gray-600 shadow-pad flex items-center justify-center text-lg text-white transition-colors"
        >
          ⏹
        </button>

        {/* Loop toggle */}
        <button
          onClick={handleLoop}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
            ${loop
              ? 'bg-mpc-accent/20 border-mpc-accent text-mpc-accent'
              : 'bg-mpc-bg border-gray-700 text-mpc-text-dim hover:text-white'
            }`}
        >
          🔁 {loop ? 'Loop ON' : 'Loop OFF'}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-mpc-text-dim">🔉</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolume(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-xs font-mono text-mpc-text-dim w-8">{volume}%</span>
        </div>
      </div>

      {/* Transpose & Speed row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Transpose */}
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800">
          <label className="text-xs text-mpc-text-dim block mb-2">
            Transpose
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTranspose(transpose - 1)}
              className="btn-secondary px-2 py-0.5 text-xs"
            >−</button>
            <input
              type="range"
              min="-24"
              max="24"
              value={transpose}
              onChange={(e) => handleTranspose(parseInt(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => handleTranspose(transpose + 1)}
              className="btn-secondary px-2 py-0.5 text-xs"
            >+</button>
            <span className="font-mono text-sm text-mpc-accent min-w-[44px] text-center">
              {transpose > 0 ? '+' : ''}{transpose}st
            </span>
          </div>
        </div>

        {/* Speed */}
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800">
          <label className="text-xs text-mpc-text-dim block mb-2">
            Speed
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpeed(speed - 5)}
              className="btn-secondary px-2 py-0.5 text-xs"
            >−</button>
            <input
              type="range"
              min="50"
              max="200"
              value={speed}
              onChange={(e) => handleSpeed(parseInt(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => handleSpeed(speed + 5)}
              className="btn-secondary px-2 py-0.5 text-xs"
            >+</button>
            <span className="font-mono text-sm text-mpc-accent min-w-[44px] text-center">
              {speed}%
            </span>
          </div>
        </div>
      </div>

      {/* Effects toggle */}
      <button
        onClick={() => setShowEffects(!showEffects)}
        className="text-xs text-mpc-text-dim hover:text-mpc-accent transition-colors mb-2"
      >
        {showEffects ? '▼' : '▶'} Effects
        {(effects.reverb > 0 || effects.delay > 0 || effects.lowpass > 0 || effects.highpass > 0) && (
          <span className="ml-1 text-mpc-accent">●</span>
        )}
      </button>

      {/* Effects panel */}
      {showEffects && (
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'reverb' as const, label: 'Reverb', icon: '🌊' },
            { key: 'delay' as const, label: 'Delay', icon: '📡' },
            { key: 'lowpass' as const, label: 'Low-Pass Filter', icon: '⬇️' },
            { key: 'highpass' as const, label: 'High-Pass Filter', icon: '⬆️' },
          ]).map(({ key, label, icon }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs w-5">{icon}</span>
              <span className="text-xs text-mpc-text-dim w-20">{label}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(effects[key] * 100)}
                onChange={(e) => handleEffect(key, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-mono text-mpc-accent w-10 text-right">
                {Math.round(effects[key] * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongPlayer;
