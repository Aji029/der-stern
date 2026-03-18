// Utility function for sleeping/delay
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if the error is a network error
export const isNetworkError = (error: any) => {
  return (
    error.message === 'Failed to fetch' ||
    error.message.includes('NetworkError') ||
    error.message.includes('Network request failed') ||
    !window.navigator.onLine
  );
};

// Format error message for display
export const formatErrorMessage = (error: any) => {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  return error.message || 'An unexpected error occurred';
};