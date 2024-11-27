import React, { memo } from 'react';
import StatusQueue from './StatusQueue';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

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
            <Tippy content={stage} key={index}>
              <div
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
            </Tippy>
          ))}
        </div>
      </div>
      <StatusQueue current_stage={currentStage} />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;