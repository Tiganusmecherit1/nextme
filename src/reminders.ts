// Water reminders, hourly 9:00–18:00 until the goal is met.
// Runs while the app is open or kept in the background by the OS. Server push is planned for phase 2.
import { getLang } from './i18n';

const KEY = 'nm_reminders';
export const remindersEnabled = () => {
  try { return localStorage.getItem(KEY) === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch { return false; }
};

export async function enableReminders() {
  if (!('Notification' in window)) return false;
  const p = await Notification.requestPermission();
  try { localStorage.setItem(KEY, p === 'granted' ? '1' : '0'); } catch { /* ignore */ }
  return p === 'granted';
}

export function startReminderLoop(get: () => { water: number; goal: number }) {
  const tick = async () => {
    if (!remindersEnabled()) return;
    const now = new Date();
    const h = now.getHours();
    if (h < 9 || h > 18) return;
    const { water, goal } = get();
    if (water >= goal) return;
    const stamp = now.toISOString().slice(0, 13);
    try { if (localStorage.getItem('nm_last_rem') === stamp) return; localStorage.setItem('nm_last_rem', stamp); } catch { return; }
    const left = ((goal - water) / 1000).toFixed(1);
    const ro = getLang() === 'ro';
    const reg = await navigator.serviceWorker?.getRegistration();
    const title = ro ? 'Un pahar de apă? 💧' : 'Time for a glass of water? 💧';
    const body = ro ? `Mai ai ${left} L până la obiectivul de azi.` : `${left} L to go for today’s goal.`;
    if (reg) reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'water' });
    else new Notification(title, { body });
  };
  tick();
  return window.setInterval(tick, 60_000);
}
