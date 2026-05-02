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
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      userAuthentication: {
        endpoint: `${HIDAYAH_API_URL}/api/pusher/auth`,

        transport: 'ajax',
      },
      channelAuthorization: {
        endpoint: `${HIDAYAH_API_URL}/api/pusher/auth`,

        transport: 'ajax',
      }
    });
  }
  return pusherClient;
};
