import React, { useState, useEffect } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { getAllPRs } from '../api.ts';

interface AdminControlsProps {
  progress: number;
  currentStage: string;
  acrylicCut: boolean;
  soldered: boolean;
  stages: string[];
  onProgressChange: (newProgress: number) => void;
  onProgressChangeComplete: (newProgress: number) => Promise<void>;
  onStageChange: (selectedStage: string) => void;
  prUrls: string[];
  onBulkUpdate: (selectedPrs: string[], newProgress: number, newStage: string) => Promise<void>;
  currentPrUrl: string;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  progress,
  currentStage,
  acrylicCut,
  soldered,
  stages,
  onProgressChange,
  onProgressChangeComplete,
  onStageChange,
  onBulkUpdate,
  prUrls,
  currentPrUrl,
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [stagePRs, setStagePRs] = useState<Array<{ pr_url: string }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localAcrylicCut, setLocalAcrylicCut] = useState(acrylicCut);
  const [localSoldered, setLocalSoldered] = useState(soldered);

  useEffect(() => {
    setLocalProgress(progress);
    setLocalAcrylicCut(acrylicCut);
    setLocalSoldered(soldered);
  }, [progress, acrylicCut, soldered]);

  useEffect(() => {
    const fetchPRs = async () => {
      const prs = await getAllPRs();
      setStagePRs(prs);
    };

    fetchPRs();
  }, []);

  const formatPRNumber = (url: string) => {
    const prNumber = url.split('/').pop();
    return `PR: ${prNumber}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalProgress(value);
    onProgressChange(value);
  };

  const handleProgressComplete = async () => {
    const allPRsToUpdate = [...selectedPRs];
    
    if (!allPRsToUpdate.includes(currentPrUrl)) {
      allPRsToUpdate.push(currentPrUrl);
    }

    if (allPRsToUpdate.length > 0) {
      await onBulkUpdate(allPRsToUpdate, localProgress, currentStage);
    } else {
      await onProgressChangeComplete(localProgress);
    }
  };

  const handleStageSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStage = e.target.value;
    onStageChange(selectedStage);
    
    const allPRsToUpdate = [...selectedPRs];
    if (!allPRsToUpdate.includes(currentPrUrl)) {
      allPRsToUpdate.push(currentPrUrl);
    }

    if (allPRsToUpdate.length > 0) {
      const stageIndex = stages.indexOf(selectedStage);
      const newProgress = Math.round((stageIndex / (stages.length - 1)) * 100);
      await onBulkUpdate(allPRsToUpdate, newProgress, selectedStage);
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

  const handleAcrylicCutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setLocalAcrylicCut(value);
    // Update local storage and sync with DB
    // Implement similar to progress handling
  };

  const handleSolderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setLocalSoldered(value);
    // Update local storage and sync with DB
    // Implement similar to progress handling
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
          
          {/* Selected PRs display */}
          {selectedPRs.length > 0 && (
            <div className="mb-2 space-y-1">
              {selectedPRs.map(pr => (
                <div key={pr} className="flex items-center justify-between bg-gray-700/50 px-2 py-1 rounded">
                  <span className="text-sm text-gray-300">{formatPRNumber(pr)}</span>
                  <button
                    onClick={() => handlePRSelection(pr)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <span>Select PRs</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {stagePRs.map((pr) => (
                  <div
                    key={pr.pr_url}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-600/50 cursor-pointer"
                    onClick={() => handlePRSelection(pr.pr_url)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPRs.includes(pr.pr_url)}
                      onChange={() => {}}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{formatPRNumber(pr.pr_url)}</span>
                  </div>
                ))}
              </div>
            )}
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
          <label className="block text-sm text-gray-400 mb-1">Acrylic Cut?</label>
          <input
            type="checkbox"
            checked={localAcrylicCut}
            onChange={handleAcrylicCutChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Soldered?</label>
          <input
            type="checkbox"
            checked={localSoldered}
            onChange={handleSolderedChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
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