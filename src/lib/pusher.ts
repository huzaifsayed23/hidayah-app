import PusherServer from 'pusher';
import PusherClient from 'pusher-js';
import { HIDAYAH_API_URL } from './api';


// Server-side pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

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
      ? `https://hidayah-lgq6.vercel.app/api/pusher/auth` 
      : (isBrowser ? '/api/pusher/auth' : `https://hidayah-lgq6.vercel.app/api/pusher/auth`);

    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
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
