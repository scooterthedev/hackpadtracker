import React, { memo } from 'react';
import StatusQueue from './StatusQueue';

interface ProgressBarProps {
  progress: number;
  currentStage: string;
}

const ProgressBar: React.FC<ProgressBarProps> = memo(({ progress, currentStage }) => {
  const totalSegments = 10;
  const completedSegments = Math.floor((progress / 100) * totalSegments);

  return (
    <div className="space-y-2">
      <div className="relative pt-1">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSegments }).map((_, index) => (
            <div
              key={index}
              className={`
                h-4 flex-1 rounded-sm
                ${index < completedSegments 
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-700/50 border border-gray-700'
                }
                ${index === completedSegments - 1 ? 'animate-pulse' : ''}
                transition-all duration-300 ease-in-out
              `}
            />
          ))}
        </div>
      </div>
      <StatusQueue stage={currentStage || 'PR Approved'} />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;