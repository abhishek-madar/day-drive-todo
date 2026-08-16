import webpush from 'web-push';
import { config } from '../config';

webpush.setVapidDetails(
  config.vapidSubject,
  config.vapidPublicKey,
  config.vapidPrivateKey
);

export const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      
      return false;
    }
    console.error('Push error:', error);
    throw error;
  }
};
