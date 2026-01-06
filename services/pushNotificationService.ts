import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "./firebaseConfig";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { parseDeepLink } from "../utils/deepLinkHandler";

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      await PushNotifications.register();

      return new Promise((resolve) => {
        PushNotifications.addListener('registration', async ({ value: token }) => {
          console.log('Push registration success, token: ' + token);
          if (token && userId) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
              console.log("✅ Native Token saved successfully!");
            }
          }
          resolve(token);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          resolve(null);
        });
      });
    } catch (error) {
      console.error("Error requesting native notification permission:", error);
      return null;
    }
  }

  if (!messaging) {
    console.log("Notification permission skipped: Messaging not supported");
    return null;
  }

  try {
    console.log("Requesting notification permission for user:", userId);
    const permission = await Notification.requestPermission();
    console.log("Permission status:", permission);
    
    if (permission === "granted") {
      console.log("Getting FCM token...");
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      console.log("FCM Token received:", token ? token.substring(0, 20) + "..." : "null");
      
      if (token && userId) {
        // Save token to user profile
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          console.log("Saving token to user profile...");
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          console.log("✅ Token saved successfully!");
        } else {
          console.error("User document doesn't exist:", userId);
        }
      } else {
        console.error("Token or userId missing:", { hasToken: !!token, userId });
      }
      
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

export const onMessageListener = (addNotification?: any, onDeepLink?: (path: string) => void) =>
  new Promise((resolve) => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        if (addNotification) {
          // Extract deep-link data from notification
          const deepLinkPath = (notification.data as any)?.deepLinkPath || '/';
          addNotification({
            title: notification.title || 'New Notification',
            message: notification.body || '',
            type: 'info',
            projectId: (notification.data as any)?.projectId,
            taskId: (notification.data as any)?.taskId,
            meetingId: (notification.data as any)?.meetingId,
            targetTab: (notification.data as any)?.targetTab,
            deepLinkPath
          });
          
          // Trigger deep-link callback if provided
          if (onDeepLink && deepLinkPath && deepLinkPath !== '/') {
            onDeepLink(deepLinkPath);
          }
        }
        resolve(notification);
      });
      return;
    }

    if (!messaging) {
      resolve(null);
      return;
    }
    onMessage(messaging, (payload) => {
      console.log("📬 Foreground message received:", payload);
      
      // Extract deep-link data from payload
      const deepLinkPath = payload.data?.deepLinkPath || payload.fcmOptions?.link || '/';
      const projectId = payload.data?.projectId;
      const taskId = payload.data?.taskId;
      const meetingId = payload.data?.meetingId;
      const targetTab = payload.data?.targetTab;
      
      // Show browser notification even when app is in foreground
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'notification-' + Date.now(),
          requireInteraction: false,
          data: {
            url: deepLinkPath,
            deepLinkPath,
            projectId,
            taskId,
            meetingId,
            targetTab
          }
        };
        
        const notification = new Notification(notificationTitle, notificationOptions);
        
        // Handle notification click with deep-link support
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          // Use deep-link callback if available, otherwise fallback to URL
          if (onDeepLink && deepLinkPath && deepLinkPath !== '/') {
            onDeepLink(deepLinkPath);
          } else if (deepLinkPath && deepLinkPath !== '/') {
            window.location.href = deepLinkPath;
          }
          
          notification.close();
        };
        
        console.log("✅ Browser notification displayed with deep-link:", deepLinkPath);
      }
      
      // Add notification to app state with deep-link data
      if (addNotification) {
        addNotification({
          title: payload.notification?.title || 'New Notification',
          message: payload.notification?.body || '',
          type: 'info',
          projectId,
          taskId,
          meetingId,
          targetTab,
          deepLinkPath
        });
      }
      
      resolve(payload);
    });
  });

// Get Cloud Function URL from environment or use deployed URL
const getCloudFunctionUrl = () => {
  const customUrl = import.meta.env.VITE_PUSH_FUNCTION_URL;
  
  if (customUrl) {
    return customUrl;
  }
  
  // Use the deployed Cloud Function URL
  return 'https://sendpushnotification-jl3d2uhdra-uc.a.run.app';
};

const PUSH_FUNCTION_URL = getCloudFunctionUrl();

/**
 * Sends a push notification via Cloud Function with deep-link support.
 * @param recipientId - User ID to send notification to
 * @param title - Notification title
 * @param body - Notification body/message
 * @param options - Additional options including deep-link data
 */
export const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string,
  options?: {
    deepLinkPath?: string; // Path like /project/abc123?tab=plan
    projectId?: string;
    taskId?: string;
    meetingId?: string;
    targetTab?: 'discovery' | 'plan' | 'financials' | 'team' | 'timeline' | 'documents' | 'meetings';
    icon?: string;
  }
): Promise<void> => {
  try {
    const payload = {
      recipientId,
      title,
      body,
      deepLinkPath: options?.deepLinkPath || '/',
      projectId: options?.projectId,
      taskId: options?.taskId,
      meetingId: options?.meetingId,
      targetTab: options?.targetTab,
      icon: options?.icon || "/icons/icon-192x192.png"
    };

    // Call Cloud Function
    await fetch(PUSH_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

