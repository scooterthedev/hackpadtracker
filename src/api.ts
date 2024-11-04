import { supabase } from './utils/supabaseClient';
import { debounce } from 'lodash';

const debouncedSavePRProgress = debounce(async (prUrl: string, progress: number, currentStage: string) => {
  const { data, error } = await supabase
    .from('pr_progress')
    .upsert(
      { pr_url: prUrl, progress, current_stage: currentStage },
      { 
        onConflict: 'pr_url',
        ignoreDuplicates: false
      }
    );

  if (error) {
    console.error('Error saving progress:', error);
  }
  return data;
}, 1000);

export const savePRProgress = (prUrl: string, progress: number, currentStage: string) => {
  return debouncedSavePRProgress(prUrl, progress, currentStage);
};

export const getPRProgress = async (prUrl: string) => {
  const { data, error } = await supabase
    .from('pr_progress')
    .select('*')
    .eq('pr_url', prUrl)
    .single();

  if (error) {
    console.error('Error fetching progress:', error);
    return null;
  }
  return data;
}; 