"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { hidayahFetch } from '@/lib/api';

export default function PushNotificationSetup() {
  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    // Only run on native platforms and if we have a user
    if (!Capacitor.isNativePlatform()) return;

    const checkUserAndRegister = async () => {
      const token = localStorage.getItem('hidayah_token');
      if (!token || hasRegistered) return;

      try {
        // Create Android channels before requesting permission
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'messages',
            name: 'Messages',
            description: 'Notifications for new messages',
            importance: 5,
            visibility: 1,
          });
          await PushNotifications.createChannel({
            id: 'requests',
            name: 'Requests',
            description: 'Notifications for requests',
            importance: 5,
            visibility: 1,
          });
        }

        // Request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('User denied push notification permission');
          return;
        }

        // Register with Apple / Google to receive token
        await PushNotifications.register();

        setHasRegistered(true);

      } catch (e) {
        console.error('Error setting up push notifications', e);
      }
    };

    checkUserAndRegister();

    // Listeners
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Send to backend
        try {
          await hidayahFetch('/api/users/fcm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value })
          });
        } catch (e) {
          console.error("Failed to register FCM token with backend", e);
        }
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ', JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', JSON.stringify(notification));
        // You could show a local toast here if you want
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', JSON.stringify(notification));
        // Handle deep link or routing here if needed
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [hasRegistered]);

  return null;
}
