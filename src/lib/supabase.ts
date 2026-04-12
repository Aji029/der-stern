import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 5000;
const BATCH_SIZE = 100;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'der-stern'
    }
  },
  db: {
    schema: 'public'
  }
});

// Utility function for sleeping/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is a network error
export const isNetworkError = (error: any): boolean => {
  return (
    error.message === 'Failed to fetch' ||
    error.message.includes('NetworkError') ||
    error.message.includes('Network request failed') ||
    !window.navigator.onLine ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  );
};

// Check if error is a stack depth error
export const isStackDepthError = (error: any): boolean => {
  return error.code === '54001' || error.message?.includes('stack depth limit exceeded');
};

// Enhanced error handling
supabase.handleError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (isNetworkError(error)) {
    return {
      message: 'Connection lost. Retrying...',
      code: 'network_error',
      isRetryable: true
    };
  }

  if (isStackDepthError(error)) {
    return {
      message: 'Operation too complex. Trying alternative approach...',
      code: 'stack_depth_error',
      isRetryable: true,
      useAlternative: true
    };
  }

  if (error.status === 401 || error.code === 'PGRST301') {
    return {
      message: 'Your session has expired. Please log in again.',
      code: 'auth_error',
      isRetryable: false
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'unknown',
    isRetryable: true
  };
};

// Process items in batches
export const processBatch = async <T>(
  items: T[],
  processFn: (item: T) => Promise<void>,
  batchSize = BATCH_SIZE
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processFn));
  }
};

// Enhanced retry logic with exponential backoff
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY
): Promise<T> => {
  let lastError;
  let delay = initialDelay;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check online status before making request
      if (!window.navigator.onLine) {
        await new Promise<void>((resolve) => {
          const onlineHandler = () => {
            window.removeEventListener('online', onlineHandler);
            resolve();
          };
          window.addEventListener('online', onlineHandler);
        });
      }

      const result = await requestFn();
      return result;
    } catch (error: any) {
      lastError = error;
      const handledError = supabase.handleError(error);
      
      if (!handledError.isRetryable) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.4 + 0.8; // Random value between 0.8 and 1.2
        delay = Math.min(delay * 2 * jitter, MAX_RETRY_DELAY);
        
        console.log(`Retry attempt ${i + 1} of ${maxRetries}. Waiting ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
};

// Alternative update function for when RPC hits stack depth limit
export const updatePriceDirectly = async (
  artikelNr: string,
  price: number,
  priceType: 'ek_price' | 'vk_price'
): Promise<void> => {
  const { data, error } = await supabase
    .from('products')
    .update({ [priceType]: price })
    .eq('artikel_nr', artikelNr)
    .select('artikel_nr');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Price update failed: product "${artikelNr}" not found or access denied.`);
  }
};

// Request queue for handling offline/online transitions
if (typeof window !== 'undefined') {
  let offlineQueue: Array<() => Promise<any>> = [];
  let isProcessingQueue = false;

  const processQueue = async () => {
    if (isProcessingQueue || offlineQueue.length === 0) return;
    
    isProcessingQueue = true;
    console.log('Processing queued requests...');

    while (offlineQueue.length > 0) {
      const request = offlineQueue.shift();
      if (request) {
        try {
          await retryRequest(request);
        } catch (error) {
          console.error('Failed to process queued request:', error);
          // Re-queue failed requests that are retryable
          const handledError = supabase.handleError(error);
          if (handledError.isRetryable) {
            offlineQueue.push(request);
          }
        }
      }
    }

    isProcessingQueue = false;
  };

  window.addEventListener('offline', () => {
    console.log('Application is offline. Requests will be queued.');
  });

  window.addEventListener('online', () => {
    console.log('Application is back online.');
    processQueue();
  });

  // Process queue when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.navigator.onLine) {
      processQueue();
    }
  });
}