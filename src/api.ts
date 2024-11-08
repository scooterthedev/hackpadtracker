import { supabase } from './utils/supabaseClient';

export const savePRProgress = async (prUrl: string, progress: number, currentStage: string) => {
  console.log('💾 Saving PR progress:', {
    prUrl,
    progress,
    currentStage
  });

  try {
    const { data, error } = await supabase
      .from('pr_progress')
      .upsert(
        { 
          pr_url: prUrl, 
          progress, 
          current_stage: currentStage 
        },
        { 
          onConflict: 'pr_url',
          ignoreDuplicates: false
        }
      );

    if (error) {
      console.error('❌ Error saving PR progress:', {
        error,
        message: error.message,
        prUrl,
        progress,
        currentStage
      });
      throw error;
    }

    console.log('✅ Successfully saved PR progress:', {
      prUrl,
      progress,
      currentStage,
      data
    });

    return data;
  } catch (error) {
    console.error('💥 Unexpected error in savePRProgress:', {
      error,
      prUrl,
      progress,
      currentStage,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const getPRProgress = async (prUrl: string) => {
  console.log('📡 Fetching PR progress:', { prUrl });
  
  if (!prUrl) {
    console.log('⚠️ No PR URL provided');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('pr_progress')
      .select('*')
      .eq('pr_url', prUrl)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        console.log('ℹ️ No progress found for PR:', { prUrl });
        return null;
      }
      
      console.error('❌ Error fetching PR progress:', {
        error,
        message: error.message,
        prUrl
      });
      return null;
    }

    console.log('✅ Successfully fetched PR progress:', {
      prUrl,
      data
    });
    
    return data;
  } catch (error) {
    console.error('💥 Unexpected error in getPRProgress:', {
      error,
      prUrl,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

export const getAllPRUrls = async () => {
  console.log('📡 Fetching all PR URLs');
  
  try {
    const { data, error } = await supabase
      .from('pr_progress')
      .select('pr_url');

    if (error) {
      console.error('❌ Error fetching PR URLs:', {
        error,
        message: error.message
      });
      return [];
    }

    console.log('✅ Successfully fetched PR URLs:', {
      count: data.length
    });
    
    return data.map(row => row.pr_url);
  } catch (error) {
    console.error('💥 Unexpected error in getAllPRUrls:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}; 