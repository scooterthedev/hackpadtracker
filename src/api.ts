import { supabase } from './utils/supabaseClient';
import { checkPRStatus } from './utils/validation';

export const savePRProgress = async (prUrl: string, progress: number, currentStage: string) => {
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

export const getPRsByStage = async (stage: string) => {
  const { data, error } = await supabase
    .from('pr_progress')
    .select('*')
    .eq('current_stage', stage);

  if (error) {
    console.error('Error fetching PRs by stage:', error);
    return [];
  }
  return data;
};

export const getAllPRs = async () => {
  const { data, error } = await supabase
    .from('pr_progress')
    .select('*');

  if (error) {
    console.error('Error fetching all PRs:', error);
    return [];
  }
  return data;
};

export const cleanupInvalidPRs = async () => {
  const { data: allPRs, error } = await supabase
    .from('pr_progress')
    .select('pr_url');

  if (error || !allPRs) {
    console.error('Error fetching PRs for cleanup:', error);
    return;
  }

  for (const pr of allPRs) {
    const prNumber = pr.pr_url.split('/').pop();
    const { isValid } = await checkPRStatus(prNumber);

    if (!isValid) {
      await supabase
        .from('pr_progress')
        .delete()
        .eq('pr_url', pr.pr_url);
    }
  }
}; 