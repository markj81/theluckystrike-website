import React from 'react';
import { PadState, PadEffects } from '../types';

interface PadSettingsProps {
  pad: PadState;
  onClose: () => void;
  onTransposeChange: (padId: number, semitones: number) => void;
  onSpeedChange: (padId: number, speed: number) => void;
  onEffectsChange: (padId: number, effects: Partial<PadEffects>) => void;
}

const PadSettings: React.FC<PadSettingsProps> = ({
  pad,
  onClose,
  onTransposeChange,
  onSpeedChange,
  onEffectsChange,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
         onClick={onClose}>
      <div className="panel max-w-md w-full mx-4 space-y-4"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            Pad {pad.id} Settings
          </h3>
          <button onClick={onClose} className="text-mpc-text-dim hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Transpose */}
        <div>
          <label className="text-sm text-mpc-text-dim block mb-1">
            Transpose: <span className="font-mono text-mpc-accent">
              {pad.transpose > 0 ? '+' : ''}{pad.transpose} st
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTransposeChange(pad.id, Math.max(-24, pad.transpose - 1))}
              className="btn-secondary px-2 py-1 text-sm"
            >
              −
            </button>
            <input
              type="range"
              min="-24"
              max="24"
              value={pad.transpose}
              onChange={(e) => onTransposeChange(pad.id, parseInt(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => onTransposeChange(pad.id, Math.min(24, pad.transpose + 1))}
              className="btn-secondary px-2 py-1 text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="text-sm text-mpc-text-dim block mb-1">
            Speed: <span className="font-mono text-mpc-accent">{pad.speed}%</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSpeedChange(pad.id, Math.max(50, pad.speed - 5))}
              className="btn-secondary px-2 py-1 text-sm"
            >
              −
            </button>
            <input
              type="range"
              min="50"
              max="200"
              value={pad.speed}
              onChange={(e) => onSpeedChange(pad.id, parseInt(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() => onSpeedChange(pad.id, Math.min(200, pad.speed + 5))}
              className="btn-secondary px-2 py-1 text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-mpc-text-dim">Effects (Wet/Dry)</h4>

          {(['reverb', 'delay', 'lowpass', 'highpass'] as const).map((fx) => (
            <div key={fx} className="flex items-center gap-3">
              <span className="text-xs text-mpc-text-dim w-16 capitalize">{fx === 'lowpass' ? 'Low-Pass' : fx === 'highpass' ? 'High-Pass' : fx}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(pad.effects[fx] * 100)}
                onChange={(e) =>
                  onEffectsChange(pad.id, { [fx]: parseInt(e.target.value) / 100 })
                }
                className="flex-1"
              />
              <span className="text-xs font-mono text-mpc-accent w-10 text-right">
                {Math.round(pad.effects[fx] * 100)}%
              </span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-primary w-full mt-4">
          Done
        </button>
      </div>
    </div>
  );
};

export default PadSettings;
