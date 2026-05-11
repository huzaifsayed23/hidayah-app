/**
 * Safe localStorage wrapper to prevent QuotaExceededError from crashing the app.
 */
export const safeStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('Storage quota exceeded. Clearing non-essential caches...');
        // Clear all caches except the auth token
        const token = localStorage.getItem('hidayah_token');
        localStorage.clear();
        if (token) localStorage.setItem('hidayah_token', token);
        
        // Try setting it again after clearing
        try {
          localStorage.setItem(key, value);
        } catch (retryError) {
          console.error('Storage still full after clearing non-essential data', retryError);
        }
      }
    }
  },
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};
