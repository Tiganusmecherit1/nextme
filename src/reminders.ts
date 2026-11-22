// Water reminders, hourly 9:00–18:00 until the goal is met.
// Android app: native notifications that work with the app closed (android/WaterReminder.kt).
// Browser / installed PWA: runs while the app is open or kept in the background by the OS.
import { getLang } from './i18n';
import { todayStr } from './calc';

const KEY = 'nm_reminders';

interface WaterBridge {
  waterRemindersOn?(): boolean;
  enableWaterReminders?(): void;
  disableWaterReminders?(): void;
  setWater?(date: string, waterMl: number, goalMl: number, lang: string): void;
}
const native = (): WaterBridge | undefined => (window as any).NextMeAndroid;
/** The Android app, but an older build without native reminders: it needs an update. */
export const androidNeedsUpdate = () => { const b = native(); return !!b && typeof b.enableWaterReminders !== 'function'; };

export const remindersEnabled = () => {
  const b = native();
  if (b?.waterRemindersOn) { try { return b.waterRemindersOn(); } catch { return false; } }
  try { return localStorage.getItem(KEY) === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch { return false; }
};

export type EnableResult = 'on' | 'denied' | 'unsupported' | 'update_app' | 'ios_install';

export async function enableReminders(): Promise<EnableResult> {
  const b = native();
  if (b) {
    if (!b.enableWaterReminders) return 'update_app';
    return new Promise((resolve) => {
      const on = (e: Event) => { window.removeEventListener('nextme-water', on); resolve((e as CustomEvent<{ on: boolean }>).detail.on ? 'on' : 'denied'); };
      window.addEventListener('nextme-water', on);
      b.enableWaterReminders!();
    });
  }
  if (!('Notification' in window)) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return ios ? 'ios_install' : 'unsupported'; // iOS only allows notifications for apps added to the Home Screen (iOS 16.4+)
  }
  let p: NotificationPermission = Notification.permission;
  if (p === 'default') p = await Notification.requestPermission();
  try { localStorage.setItem(KEY, p === 'granted' ? '1' : '0'); } catch { /* ignore */ }
  return p === 'granted' ? 'on' : 'denied';
}

export function disableReminders() {
  native()?.disableWaterReminders?.();
  try { localStorage.setItem(KEY, '0'); } catch { /* ignore */ }
}

export function startReminderLoop(get: () => { water: number; goal: number }) {
  let sent = '';
  const tick = async () => {
    const { water, goal } = get();
    const b = native();
    if (b?.setWater) {
      // Keep the native reminder up to date; it does the notifying, even with the app closed.
      const key = `${todayStr()}:${water}:${goal}:${getLang()}`;
      if (key !== sent) { try { b.setWater(todayStr(), water, goal, getLang()); sent = key; } catch { /* ignore */ } }
      return;
    }
    if (!remindersEnabled()) return;
    const now = new Date();
    const h = now.getHours();
    if (h < 9 || h > 18) return;
    if (water >= goal) return;
    const stamp = now.toISOString().slice(0, 13);
    try { if (localStorage.getItem('nm_last_rem') === stamp) return; localStorage.setItem('nm_last_rem', stamp); } catch { return; }
    const left = ((goal - water) / 1000).toFixed(1);
    const ro = getLang() === 'ro';
    const reg = await navigator.serviceWorker?.getRegistration();
    const title = ro ? 'Un pahar de apă? 💧' : 'Time for a glass of water? 💧';
    const body = ro ? `Mai ai ${left} L până la obiectivul de azi.` : `${left} L to go for today’s goal.`;
    try {
      if (reg) await reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'water' });
      else new Notification(title, { body });
    } catch { /* Android Chrome only allows notifications through the service worker */ }
  };
  tick();
  return window.setInterval(tick, 5_000);
}
