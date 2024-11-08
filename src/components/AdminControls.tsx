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
  onBulkUpdate,
  prUrls,
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
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

  const handleProgressComplete = async () => {
    const allPRsToUpdate = [...selectedPRs];
    
    // Add the current PR if it's not already in the selected list
    if (prUrls.length > 0 && !selectedPRs.includes(prUrls[0])) {
      allPRsToUpdate.push(prUrls[0]);
    }

    // Format URLs if needed
    const formattedPRs = allPRsToUpdate.map(url => {
      // Extract PR number from URL
      const prNumber = url.split('/').pop();
      return `https://github.com/hackclub/hackpad/pull/${prNumber}`;
    });

    if (formattedPRs.length > 0) {
      await onBulkUpdate(formattedPRs, localProgress, currentStage);
    } else {
      await onProgressChangeComplete(localProgress);
    }
  };

  const handleStageSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStage = e.target.value;
    onStageChange(selectedStage);
    if (selectedPRs.length > 0) {
      const stageIndex = stages.indexOf(selectedStage);
      const newProgress = Math.round((stageIndex / (stages.length - 1)) * 100);
      await onBulkUpdate(selectedPRs, newProgress, selectedStage);
    }
  };

  const handlePRSelection = (prUrl: string) => {
    setSelectedPRs(prev => {
      if (prev.includes(prUrl)) {
        return prev.filter(url => url !== prUrl);
      } else {
        return [...prev, prUrl];
      }
    });
  };

  return (
    <div className="space-y-4 border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
      <div className="flex items-center space-x-2 text-blue-400">
        <Lock className="w-4 h-4" />
        <h3 className="text-sm font-medium">Admin Controls</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Select PRs to Update</label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {stagePRs.map((pr) => (
              <div key={pr.pr_url} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedPRs.includes(pr.pr_url)}
                  onChange={() => handlePRSelection(pr.pr_url)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-300">{pr.pr_url}</label>
              </div>
            ))}
          </div>
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