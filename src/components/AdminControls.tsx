import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { debounce } from 'lodash';

interface AdminControlsProps {
  progress: number;
  currentStage: string;
  stages: string[];
  onProgressChange: (progress: number) => void;
  onProgressChangeComplete: (progress: number) => void;
  onStageChange: (stage: string) => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  progress,
  currentStage,
  stages,
  onProgressChange,
  onProgressChangeComplete,
  onStageChange,
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const isDraggingRef = useRef(false);

  // Sync local progress with prop when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalProgress(progress);
    }
  }, [progress]);

  // Update parent component's state while dragging without API calls
  const debouncedProgressChange = useCallback(
    debounce((value: number) => {
      onProgressChange(value);
    }, 100),
    [onProgressChange]
  );

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    isDraggingRef.current = true;
    setLocalProgress(value);
    debouncedProgressChange(value);
  };

  const handleProgressComplete = () => {
    isDraggingRef.current = false;
    debouncedProgressChange.cancel(); // Cancel any pending debounced updates
    onProgressChangeComplete(localProgress); // Send final value to API
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