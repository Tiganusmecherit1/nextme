export class ApiError extends Error {
  constructor(public code: string, public status: number, public data?: any) { super(code); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new ApiError(data?.error || 'server_error', res.status, data);
  return data as T;
}

export interface DayLog {
  date: string;
  water_ml: number;
  workout_done: number;
  workout_minutes: number;
  steps: number;
  moves: string[];
  foods: FoodEntry[];
}
export interface FoodEntry { name: string; kcal: number; protein: number; carbs: number; fat: number; src?: string }

export const emptyDay = (date: string): DayLog => ({ date, water_ml: 0, workout_done: 0, workout_minutes: 0, steps: 0, moves: [], foods: [] });

/** Resize a photo client-side to keep uploads small (max 1024 px, JPEG). */
export async function fileToDataUrl(file: File, max = 1024): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}
