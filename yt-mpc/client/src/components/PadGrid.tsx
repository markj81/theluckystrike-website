import React from 'react';
import Pad from './Pad';
import { PadState } from '../types';

interface PadGridProps {
  pads: PadState[];
  activePads: Set<number>;
  onTrigger: (padId: number) => void;
  onRelease: (padId: number) => void;
  onToggleMode: (padId: number) => void;
  onOpenSettings: (padId: number) => void;
}

const PadGrid: React.FC<PadGridProps> = ({
  pads,
  activePads,
  onTrigger,
  onRelease,
  onToggleMode,
  onOpenSettings,
}) => {
  // Arrange pads in MPC layout (bottom row = 1-4, top row = 13-16)
  const rows = [
    pads.filter((p) => p.id >= 13 && p.id <= 16), // Top row
    pads.filter((p) => p.id >= 9 && p.id <= 12),  // Upper-mid
    pads.filter((p) => p.id >= 5 && p.id <= 8),   // Lower-mid
    pads.filter((p) => p.id >= 1 && p.id <= 4),   // Bottom row
  ];

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="text-2xl">🎹</span>
        Pad Grid
      </h2>
      <div className="grid grid-rows-4 gap-2">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-2">
            {row.map((pad) => (
              <Pad
                key={pad.id}
                pad={pad}
                isActive={activePads.has(pad.id)}
                onTrigger={onTrigger}
                onRelease={onRelease}
                onToggleMode={onToggleMode}
                onOpenSettings={onOpenSettings}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PadGrid;
