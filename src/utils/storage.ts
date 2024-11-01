import axios from 'axios';

export const savePRProgress = async (prUrl: string, progress: number, currentStage: string): Promise<void> => {
  const pr = extractPRNumber(prUrl);
  await axios.post('/api/progress', { pr, progress, state: currentStage });
};

export const getPRProgress = async (prUrl: string): Promise<PRProgress | null> => {
  const pr = extractPRNumber(prUrl);
  const response = await axios.get(`/api/progress?pr=${pr}`);
  if (response.data) {
    const { Progress, State } = response.data;
    return {
      prUrl,
      progress: Progress,
      currentStage: State,
      lastUpdated: Date.now(),
    };
  }
  return null;
};

const extractPRNumber = (prUrl: string): number => {
  const match = prUrl.match(/\/pull\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};