import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AdminControlsProps {
  progress: number;
  currentStage: string;
  stages: string[];
  onProgressChange: (progress: number) => void;
  onProgressChangeComplete: (progress: number) => void;
  onStageChange: (stage: string) => void;
}

const PROGRESS_STORAGE_KEY = 'admin-progress';

const AdminControls: React.FC<AdminControlsProps> = ({
  progress,
  currentStage,
  stages,
  onProgressChange,
  onProgressChangeComplete,
  onStageChange,
}) => {
  // Initialize from props or local storage
  const [localProgress, setLocalProgress] = useState(() => {
    const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return storedProgress ? Number(storedProgress) : progress;
  });
  
  const isDraggingRef = useRef(false);
  const lastSyncedValueRef = useRef(progress);

  // Sync with props when server state changes and we're not dragging
  useEffect(() => {
    if (!isDraggingRef.current && progress !== lastSyncedValueRef.current) {
      setLocalProgress(progress);
      localStorage.setItem(PROGRESS_STORAGE_KEY, String(progress));
      lastSyncedValueRef.current = progress;
    }
  }, [progress]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    isDraggingRef.current = true;
    setLocalProgress(value);
    localStorage.setItem(PROGRESS_STORAGE_KEY, String(value));
    onProgressChange(value); // Update UI immediately
  };

  const handleProgressComplete = () => {
    isDraggingRef.current = false;
    // Only send POST if value actually changed
    if (localProgress !== lastSyncedValueRef.current) {
      onProgressChangeComplete(localProgress);
      lastSyncedValueRef.current = localProgress;
    }
  };

  return (
    <div className="space-y-4 border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
      <div className="flex items-center space-x-2 text-blue-400">
        <Lock className="w-4 h-4" />
        <h3 className="text-sm font-medium">Admin Controls</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Progress</label>
          <input
            type="range"
            min="0"
            max="100"
            value={localProgress}
            onChange={handleProgressChange}
            onMouseUp={handleProgressComplete}
            onTouchEnd={handleProgressComplete}
            onMouseLeave={handleProgressComplete}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-sm text-gray-400 mt-1">{localProgress}%</div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Current Stage</label>
          <select
            value={currentStage}
            onChange={(e) => onStageChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;