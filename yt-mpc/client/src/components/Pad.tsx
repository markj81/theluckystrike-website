import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PadState, PAD_TO_KEY } from '../types';

interface PadProps {
  pad: PadState;
  isActive: boolean;
  onTrigger: (padId: number) => void;
  onRelease: (padId: number) => void;
  onToggleMode: (padId: number) => void;
  onOpenSettings: (padId: number) => void;
}

const Pad: React.FC<PadProps> = ({
  pad,
  isActive,
  onTrigger,
  onRelease,
  onToggleMode,
  onOpenSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [pressed, setPressed] = useState(false);

  // Draw mini waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !pad.buffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = pad.buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    ctx.clearRect(0, 0, width, height);

    const drawWaveform = (highlightProgress?: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < width; i++) {
        let min = 1;
        let max = -1;

        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j] || 0;
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        const yMin = ((1 + min) * height) / 2;
        const yMax = ((1 + max) * height) / 2;

        if (highlightProgress !== undefined && i / width <= highlightProgress) {
          ctx.fillStyle = '#e94560';
        } else {
          ctx.fillStyle = 'rgba(83, 52, 131, 0.6)';
        }

        ctx.fillRect(i, yMax, 1, Math.max(1, yMin - yMax));
      }
    };

    drawWaveform();

    // Animate when playing
    if (isActive) {
      let start = Date.now();
      const duration = pad.buffer.duration * 1000;

      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = pad.mode === 'loop'
          ? (elapsed % duration) / duration
          : Math.min(elapsed / duration, 1);

        drawWaveform(progress);

        if (isActive && (pad.mode === 'loop' || progress < 1)) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [pad.buffer, isActive, pad.mode]);

  const handleMouseDown = useCallback(() => {
    setPressed(true);
    onTrigger(pad.id);
  }, [pad.id, onTrigger]);

  const handleMouseUp = useCallback(() => {
    setPressed(false);
    if (pad.mode === 'loop') {
      onRelease(pad.id);
    }
  }, [pad.id, pad.mode, onRelease]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onOpenSettings(pad.id);
    },
    [pad.id, onOpenSettings]
  );

  const keyLabel = PAD_TO_KEY[pad.id] || '';

  return (
    <div
      className={`pad-button aspect-square flex flex-col items-center justify-center p-2 
        ${isActive ? 'active' : ''} 
        ${pressed ? 'scale-95' : ''}
        ${pad.buffer ? 'opacity-100' : 'opacity-40'}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Pad number + key */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-bold text-mpc-text-dim">{pad.id}</span>
        <span className="text-[10px] font-mono text-mpc-accent bg-mpc-bg/50 px-1 rounded">
          {keyLabel}
        </span>
      </div>

      {/* Mini waveform canvas */}
      <canvas
        ref={canvasRef}
        width={80}
        height={40}
        className="w-full h-8 rounded"
      />

      {/* Mode indicator */}
      <div className="flex items-center justify-between w-full mt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMode(pad.id);
          }}
          className="text-[10px] font-mono text-mpc-text-dim hover:text-mpc-accent transition-colors"
        >
          {pad.mode === 'oneshot' ? '▶ ONE' : '🔁 LOOP'}
        </button>

        {/* Transpose indicator */}
        {pad.transpose !== 0 && (
          <span className="text-[10px] font-mono text-yellow-400">
            {pad.transpose > 0 ? '+' : ''}{pad.transpose}st
          </span>
        )}
      </div>

      {/* Active glow overlay */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-mpc-accent/20 pointer-events-none animate-pad-glow" />
      )}
    </div>
  );
};

export default Pad;
