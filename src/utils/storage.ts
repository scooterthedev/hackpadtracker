interface PRProgress {
  prUrl: string;
  progress: number;
  currentStage: string;
}

const STORAGE_KEY = 'pr-progress-data';

export const savePRProgress = (prUrl: string, progress: number, currentStage: string): void => {
  const data = getPRProgressData();
  data[prUrl] = {
    prUrl,
    progress,
    currentStage
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getPRProgressData = (): Record<string, PRProgress> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const getPRProgress = (prUrl: string): PRProgress | null => {
  const data = getPRProgressData();
  return data[prUrl] || null;
};