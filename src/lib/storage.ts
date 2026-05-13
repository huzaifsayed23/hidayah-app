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
  },
  /**
   * Specifically for the community feed cache to keep it in sync with interactions
   */
  updateCommunityCache: (postId: string, updates: any) => {
    try {
      const cached = localStorage.getItem('hidayah_community_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.posts) {
          data.posts = data.posts.map((p: any) => 
            (p._id === postId || p.id === postId) ? { ...p, ...updates } : p
          );
          localStorage.setItem('hidayah_community_cache', JSON.stringify(data));
        }
      }
    } catch (e) {}
  },
  /**
   * Specifically for the profile saved tab
   */
  updateProfileSaveCache: (post: any, isSaved: boolean) => {
    try {
      const cached = localStorage.getItem('hidayah_profile_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.posts) {
          if (isSaved) {
            // Only add if not already there
            if (!data.posts.some((p: any) => (p._id === post._id || p.id === post._id))) {
              data.posts.unshift(post);
            }
          } else {
            // Remove if unsaved
            data.posts = data.posts.filter((p: any) => (p._id !== post._id && p.id !== post._id));
          }
          localStorage.setItem('hidayah_profile_cache', JSON.stringify(data));
        }
      }
    } catch (e) {}
  }
};
