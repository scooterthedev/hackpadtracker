export const isValidGitHubPRUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'github.com' &&
      urlObj.pathname.split('/').length >= 5 &&
      urlObj.pathname.includes('/pull/')
    );
  } catch {
    return false;
  }
};

export const checkPRStatus = async (prNumber: string): Promise<{isValid: boolean; isMerged: boolean}> => {
  try {
    const response = await fetch(`https://api.github.com/repos/hackclub/hackpad/pulls/${prNumber}`);
    const data = await response.json();
    
    if (response.status === 404) {
      return { isValid: false, isMerged: false };
    }
    
    return { 
      isValid: true, 
      isMerged: data.merged === true 
    };
  } catch (error) {
    console.error('Error checking PR status:', error);
    return { isValid: false, isMerged: false };
  }
};