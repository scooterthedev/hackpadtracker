import React, { memo } from 'react';
import StatusQueue from './StatusQueue';

interface ProgressBarProps {
  progress: number;
  currentStage: string;
  acrylicCut: boolean;
  soldered: boolean;
  stages: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = memo(({ progress, currentStage, acrylicCut, soldered, stages }) => {
  const totalSegments = stages.length;
  const completedSegments = Math.floor((progress / 100) * totalSegments);

  return (
    <div className="space-y-2">
      <div className="relative pt-1">
        <div className="flex gap-1.5">
          {stages.map((stage, index) => (
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
              title={stage}
            />
          ))}
        </div>
      </div>
      <StatusQueue current_stage={currentStage} />
      <div className="flex space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Acrylic Cut:</span>
          <span className={`text-sm ${acrylicCut ? 'text-green-400' : 'text-red-400'}`}>
            {acrylicCut ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Soldered:</span>
          <span className={`text-sm ${soldered ? 'text-green-400' : 'text-red-400'}`}>
            {soldered ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;