// Short beeps + vibration for timers. The AudioContext must be unlocked by a tap (call unlockAudio from a click).
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { /* no audio */ }
}

export function beep(kind: 'tick' | 'go' | 'rest' | 'end' = 'tick') {
  try {
    if (!ctx) return;
    const freq = kind === 'go' ? 1046 : kind === 'rest' ? 523 : kind === 'end' ? 784 : 880;
    const dur = kind === 'tick' ? 0.12 : kind === 'end' ? 0.6 : 0.35;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  } catch { /* ignore */ }
  try { navigator.vibrate?.(kind === 'tick' ? 60 : kind === 'end' ? [300, 100, 300] : 250); } catch { /* ignore */ }
}

/** Keeps the screen on while a timer runs (where supported). */
export async function keepAwake(): Promise<() => void> {
  try {
    const lock = await (navigator as any).wakeLock?.request('screen');
    return () => { try { lock?.release(); } catch { /* ignore */ } };
  } catch {
    return () => {};
  }
}
