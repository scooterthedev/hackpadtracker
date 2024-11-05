import React, { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AdminControlsProps {
  initialProgress: number;
  currentStage: string;
  stages: string[];
  onProgressComplete: (progress: number) => void;
  onStageChange: (stage: string) => void;
}

interface StoredData {
  progress: number;
  stage: string;
}

const STORAGE_KEY = 'admin-controls-data';

const AdminControls: React.FC<AdminControlsProps> = ({
  initialProgress,
  currentStage,
  stages,
  onProgressComplete,
  onStageChange,
}) => {
  const [localData, setLocalData] = useState<StoredData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      progress: initialProgress,
      stage: currentStage
    };
  });
  
  const isDraggingRef = useRef(false);
  const lastValueRef = useRef(localData.progress);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = Number(e.target.value);
    const newData = { ...localData, progress };
    setLocalData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    isDraggingRef.current = true;
  };

  const handleStageChange = (stage: string) => {
    const newData = { ...localData, stage };
    setLocalData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    onStageChange(stage);
  };

  const handleProgressComplete = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!isDraggingRef.current && lastValueRef.current !== localData.progress) {
      onProgressComplete(localData.progress);
      lastValueRef.current = localData.progress;
    }
  }, [localData.progress, onProgressComplete]);

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
            value={localData.progress}
            onChange={handleProgressChange}
            onMouseUp={handleProgressComplete}
            onTouchEnd={handleProgressComplete}
            onMouseLeave={handleProgressComplete}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-sm text-gray-400 mt-1">{localData.progress}%</div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Current Stage</label>
          <select
            value={localData.stage}
            onChange={(e) => handleStageChange(e.target.value)}
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