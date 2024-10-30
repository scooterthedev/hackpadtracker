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