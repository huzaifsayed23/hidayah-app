"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { hidayahFetch } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Bell } from 'lucide-react';

export default function PushNotificationSetup() {
  const router = useRouter();
  const hasRegisteredRef = useRef(false);
  const pathname = usePathname();

  // 1. One-time listener setup
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let regListener: any;
    let regErrListener: any;
    let recvListener: any;
    let actionListener: any;

    const setupListeners = async () => {
      regListener = await PushNotifications.addListener('registration', async (token) => {
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

      regErrListener = await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ', JSON.stringify(error));
      });

      recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', JSON.stringify(notification));
        const title = notification.title || notification.notification?.title || 'New Notification';
        const body = notification.body || notification.notification?.body || '';
        const route = notification.data?.route;
        
        setInAppNotification({ title, body, route });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setInAppNotification(null);
        }, 5000);
      });

      actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', JSON.stringify(notification));
        const data = notification.actionId === 'tap' ? notification.notification.data : notification.notification.data;
        if (data && data.route) {
          router.push(data.route);
        }
      });
    };

    setupListeners();

    return () => {
      if (regListener) regListener.remove();
      if (regErrListener) regErrListener.remove();
      if (recvListener) recvListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [router]);

  // 2. Permission and Registration trigger (runs on mount and path changes)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkUserAndRegister = async () => {
      const token = localStorage.getItem('hidayah_token');
      if (!token) return; // Wait until user is logged in
      if (hasRegisteredRef.current) return;

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
        hasRegisteredRef.current = true;

      } catch (e) {
        console.error('Error setting up push notifications', e);
      }
    };

    checkUserAndRegister();
  }, [pathname]);

  return (
    <AnimatePresence>
      {inAppNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-12 left-4 right-4 z-[9999] bg-[var(--color-hidayah-primary)] border-2 border-[var(--color-hidayah-gold)] rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-start gap-4"
          onClick={() => {
            if (inAppNotification.route) {
              router.push(inAppNotification.route);
            }
            setInAppNotification(null);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-secondary)] flex items-center justify-center shrink-0 border border-[var(--color-hidayah-border)]/30">
            <Bell className="w-5 h-5 text-[var(--color-hidayah-gold)]" />
          </div>
          <div className="flex-1 pt-0.5">
            <h4 className="font-bold text-[var(--color-hidayah-dark)] text-sm leading-tight">{inAppNotification.title}</h4>
            <p className="text-xs text-[var(--color-hidayah-dark)]/70 mt-1 line-clamp-2">{inAppNotification.body}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setInAppNotification(null); }}
            className="p-1 -mr-1 hover:bg-black/5 rounded-full"
          >
            <X className="w-4 h-4 text-[var(--color-hidayah-dark)]/50" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
