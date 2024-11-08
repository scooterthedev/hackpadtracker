import React, { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AdminControlsProps {
  progress: number;
  currentStage: string;
  stages: string[];
  onProgressChange: (progress: number) => void;
  onProgressChangeComplete: (progress: number) => void;
  onStageChange: (stage: string) => void;
  prUrls: string[];
  onBulkUpdate: (selectedPrs: string[], newProgress: number, newStage: string) => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  progress,
  currentStage,
  stages,
  onProgressChange,
  onProgressChangeComplete,
  onStageChange,
  prUrls,
  onBulkUpdate,
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const [selectedPrs, setSelectedPrs] = useState<string[]>([]);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalProgress(progress);
    }
  }, [progress]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    isDraggingRef.current = true;
    setLocalProgress(value);
    onProgressChange(value);
  };

  const handleProgressComplete = () => {
    isDraggingRef.current = false;
    onProgressChangeComplete(localProgress);
  };

  const handleStageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStage = e.target.value;
    onStageChange(selectedStage);
  };

  const handleCheckboxChange = (prUrl: string) => {
    setSelectedPrs((prev) =>
      prev.includes(prUrl) ? prev.filter((url) => url !== prUrl) : [...prev, prUrl]
    );
  };

  const handleBulkUpdate = () => {
    onBulkUpdate(selectedPrs, localProgress, currentStage);
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
            onChange={handleStageSelect}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h4 className="text-sm text-gray-400 mb-1">Select PRs to Update</h4>
          {prUrls.map((prUrl) => (
            <div key={prUrl} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedPrs.includes(prUrl)}
                onChange={() => handleCheckboxChange(prUrl)}
                className="mr-2"
              />
              <span className="text-gray-300">{prUrl}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleBulkUpdate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
        >
          Update Selected PRs
        </button>
      </div>
    </div>
  );
};

export default AdminControls;