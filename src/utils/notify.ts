/** Request notification permission if not already decided. Safe to call repeatedly. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/** Show a notification when the page is backgrounded or for an end-of-phase alert. */
export function notify(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' });
  } catch {
    /* ignore — some browsers require a service worker registration */
  }
}
