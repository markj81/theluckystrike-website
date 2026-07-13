import React from 'react';
import { MasterEffects } from '../types';

interface ToolbarProps {
  videoTitle: string;
  chopMode: 'auto' | 'manual';
  onChopModeChange: (mode: 'auto' | 'manual') => void;
  onChop: () => void;
  globalTranspose: number;
  onGlobalTransposeChange: (value: number) => void;
  globalSpeed: number;
  onGlobalSpeedChange: (value: number) => void;
  masterEffects: MasterEffects;
  onMasterEffectsChange: (effects: Partial<MasterEffects>) => void;
  onExport: () => void;
  isExporting: boolean;
  hasAudio: boolean;
  hasPads: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  videoTitle,
  chopMode,
  onChopModeChange,
  onChop,
  globalTranspose,
  onGlobalTransposeChange,
  globalSpeed,
  onGlobalSpeedChange,
  masterEffects,
  onMasterEffectsChange,
  onExport,
  isExporting,
  hasAudio,
  hasPads,
}) => {
  return (
    <div className="panel space-y-4">
      {/* Title & chop controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {videoTitle && (
          <div className="text-sm text-mpc-text-dim truncate max-w-xs">
            🎵 <span className="text-mpc-text font-medium">{videoTitle}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Chop mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            <button
              onClick={() => onChopModeChange('auto')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                chopMode === 'auto'
                  ? 'bg-mpc-accent text-white'
                  : 'bg-mpc-bg text-mpc-text-dim hover:text-white'
              }`}
            >
              Auto Chop
            </button>
            <button
              onClick={() => onChopModeChange('manual')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                chopMode === 'manual'
                  ? 'bg-mpc-accent text-white'
                  : 'bg-mpc-bg text-mpc-text-dim hover:text-white'
              }`}
            >
              Manual Chop
            </button>
          </div>

          <button
            onClick={onChop}
            disabled={!hasAudio}
            className="btn-primary text-sm"
          >
            ✂️ Chop to Pads
          </button>
        </div>
      </div>

      {/* Global controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Transpose */}
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800">
          <label className="text-xs text-mpc-text-dim block mb-2">
            Global Transpose
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGlobalTransposeChange(Math.max(-24, globalTranspose - 1))}
              className="btn-secondary px-2 py-0.5 text-xs"
            >
              −
            </button>
            <span className="font-mono text-sm text-mpc-accent min-w-[40px] text-center">
              {globalTranspose > 0 ? '+' : ''}{globalTranspose}st
            </span>
            <button
              onClick={() => onGlobalTransposeChange(Math.min(24, globalTranspose + 1))}
              className="btn-secondary px-2 py-0.5 text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Global Speed */}
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800">
          <label className="text-xs text-mpc-text-dim block mb-2">
            Global Speed
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGlobalSpeedChange(Math.max(50, globalSpeed - 5))}
              className="btn-secondary px-2 py-0.5 text-xs"
            >
              −
            </button>
            <input
              type="range"
              min="50"
              max="200"
              value={globalSpeed}
              onChange={(e) => onGlobalSpeedChange(parseInt(e.target.value))}
              className="flex-1 h-1"
            />
            <span className="font-mono text-sm text-mpc-accent min-w-[40px] text-center">
              {globalSpeed}%
            </span>
            <button
              onClick={() => onGlobalSpeedChange(Math.min(200, globalSpeed + 5))}
              className="btn-secondary px-2 py-0.5 text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Master Effects */}
        <div className="bg-mpc-bg rounded-lg p-3 border border-gray-800 col-span-1 md:col-span-2">
          <label className="text-xs text-mpc-text-dim block mb-2">
            Master Effects
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {(['reverb', 'delay', 'lowpass', 'highpass'] as const).map((fx) => (
              <div key={fx} className="flex items-center gap-2">
                <span className="text-[10px] text-mpc-text-dim w-14 capitalize">
                  {fx === 'lowpass' ? 'LP Filter' : fx === 'highpass' ? 'HP Filter' : fx}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(masterEffects[fx] * 100)}
                  onChange={(e) =>
                    onMasterEffectsChange({ [fx]: parseInt(e.target.value) / 100 })
                  }
                  className="flex-1 h-1"
                />
                <span className="text-[10px] font-mono text-mpc-accent w-8 text-right">
                  {Math.round(masterEffects[fx] * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
      {hasPads && (
        <div className="flex justify-end">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="btn-primary flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                </svg>
                Exporting...
              </>
            ) : (
              <>📦 Export ZIP</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
