import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { getPRsByStage } from '../api';

interface AdminControlsProps {
  progress: number;
  currentStage: string;
  stages: string[];
  onProgressChange: (newProgress: number) => void;
  onProgressChangeComplete: (newProgress: number) => Promise<void>;
  onStageChange: (selectedStage: string) => void;
  prUrls: string[];
  onBulkUpdate: (selectedPrs: string[], newProgress: number, newStage: string) => Promise<void>;
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
  const [selectedPrUrl, setSelectedPrUrl] = useState<string>('');
  const [stagePRs, setStagePRs] = useState<Array<{ pr_url: string }>>([]);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    const fetchPRsForStage = async () => {
      const prs = await getPRsByStage(currentStage);
      setStagePRs(prs);
    };

    if (currentStage) {
      fetchPRsForStage();
    }
  }, [currentStage]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalProgress(value);
    onProgressChange(value);
  };

  const handleProgressComplete = () => {
    onProgressChangeComplete(localProgress);
  };

  const handleStageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStage = e.target.value;
    onStageChange(selectedStage);
    setSelectedPrUrl(''); // Reset selected PR when stage changes
  };

  return (
    <div className="space-y-4 border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
      <div className="flex items-center space-x-2 text-blue-400">
        <Lock className="w-4 h-4" />
        <h3 className="text-sm font-medium">Admin Controls</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Select PR URL</label>
          <select
            value={selectedPrUrl}
            onChange={(e) => setSelectedPrUrl(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a PR</option>
            {stagePRs.map((pr) => (
              <option key={pr.pr_url} value={pr.pr_url}>
                {pr.pr_url}
              </option>
            ))}
          </select>
        </div>

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
      </div>
    </div>
  );
};

export default AdminControls;