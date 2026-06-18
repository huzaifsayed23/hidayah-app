import PusherClient from 'pusher-js';
import { HIDAYAH_API_URL } from './api';

let pusherClient: any = null;

/**
 * Client-side pusher instance (Singleton)
 */
export const getPusherClient = () => {
  if (!pusherClient) {
    const isBrowser = typeof window !== 'undefined';
    const isCapacitor = isBrowser && (
      window.location.protocol === 'capacitor:' || 
      (window.location.hostname === 'localhost' && window.location.port === '')
    );

    // Force hardcoded Vercel URL for native mobile apps to bypass local networking restrictions
    const authEndpoint = isCapacitor 
      ? `${HIDAYAH_API_URL}/api/pusher/auth` 
      : (isBrowser ? '/api/pusher/auth' : `${HIDAYAH_API_URL}/api/pusher/auth`);

    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    if (!appKey) {
      console.warn("Pusher App Key is missing. Real-time features disabled.");
      pusherClient = {
        subscribe: () => ({ bind: () => {}, unbind_all: () => {}, unsubscribe: () => {} }),
        unsubscribe: () => {},
        bind: () => {},
        unbind_all: () => {},
      };
      return pusherClient;
    }

    pusherClient = new PusherClient(appKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      userAuthentication: {
        endpoint: authEndpoint,
        transport: 'ajax',
        headers: {
          'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('hidayah_token')}` : '',
        }
      },
      channelAuthorization: {
        endpoint: authEndpoint,
        transport: 'ajax',
        headers: {
          'Authorization': typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('hidayah_token')}` : '',
        }
      }
    });
  }
  return pusherClient;
};
