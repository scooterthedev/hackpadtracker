import React, { useState, useCallback } from 'react';
import axios from 'axios';

interface ProgressBarProps {
  progress: number;
  prUrl: string;
  isAdmin: boolean;
  stages: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress}) => {
  const [currentProgress] = useState(progress);
    const debounce = (func: (...args: unknown[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: unknown[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const savePRProgress = async (prUrl: string, progress: number, currentStage: string): Promise<void> => {
    const pr = extractPRNumber(prUrl);
    await axios.post('/api/progress', { pr, progress, state: currentStage });
  };

  const extractPRNumber = (prUrl: string): number => {
    const match = prUrl.match(/\/pull\/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const debouncedSavePRProgress = useCallback(debounce((prUrl: string, newProgress: number, newStage: string) => {
    savePRProgress(prUrl, newProgress, newStage);
  }, 1000), []);

  // Create 10 segments
  const totalSegments = 10;
  const completedSegments = Math.floor((currentProgress / 100) * totalSegments);

  return (
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
  );
};

export default ProgressBar;