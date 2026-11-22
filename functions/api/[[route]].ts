// NextMe API — Cloudflare Pages Functions (single router)
interface Env {
  DB: D1Database;
  AI?: Ai;
  AI_DAILY_LIMIT?: string;
  VISION_MODEL?: string;
}

type Ctx = EventContext<Env, string, Record<string, unknown>>;

const SESSION_DAYS = 60;
const COOKIE = 'nm_session';

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
const err = (code: string, status = 400) => json({ error: code }, status);

const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const randomToken = (n = 32) => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return b64(a).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c] as string);
};

async function hashPassword(password: string, saltB64: string) {
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return b64(bits);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function getCookie(req: Request, name: string) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function sessionCookie(req: Request, token: string, maxAge: number) {
  const secure = new URL(req.url).protocol === 'https:' ? ' Secure;' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`;
}

async function currentUser(ctx: Ctx): Promise<{ id: number; username: string; ics_token: string } | null> {
  const token = getCookie(ctx.request, COOKIE);
  if (!token) return null;
  const row = await ctx.env.DB.prepare(
    'SELECT u.id, u.username, u.ics_token FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?'
  )
    .bind(token, Date.now())
    .first<{ id: number; username: string; ics_token: string }>();
  return row ?? null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayUTC = () => new Date().toISOString().slice(0, 10);

async function readJson<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/* ---------------- AI vision ---------------- */
const MACHINE_IDS = [
  'leg_press', 'hack_squat', 'leg_extension', 'leg_curl', 'hip_abductor', 'hip_adductor', 'calf_raise_machine',
  'glute_machine', 'chest_press', 'pec_deck', 'shoulder_press_machine', 'lat_pulldown', 'seated_row',
  'cable_station', 'assisted_pullup', 'smith_machine', 'squat_rack', 'flat_bench', 'adjustable_bench',
  'dumbbells', 'barbell', 'kettlebell', 'pullup_bar', 'dip_station', 'back_extension', 'preacher_curl',
  'ab_crunch_machine', 'treadmill', 'stationary_bike', 'elliptical', 'rowing_machine', 'stair_climber',
];

async function runVision(env: Env, prompt: string, dataUrl: string): Promise<string> {
  if (!env.AI) throw new Error('ai_unavailable');
  const model = env.VISION_MODEL || '@cf/meta/llama-3.2-11b-vision-instruct';
  const base64 = dataUrl.split(',')[1] || '';
  const bytes = Array.from(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
  const call = () =>
    (env.AI as any).run(model, {
      messages: [{ role: 'user', content: prompt }],
      image: bytes,
      max_tokens: 700,
      temperature: 0.2,
    });
  let out: any;
  try {
    out = await call();
  } catch (e: any) {
    // Llama 3.2 Vision requires a one-time license acceptance on the account.
    if (String(e?.message || e).toLowerCase().includes('agree')) {
      await (env.AI as any).run(model, { prompt: 'agree' });
      out = await call();
    } else throw e;
  }
  return String(out?.response ?? out?.result?.response ?? '');
}

function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function consumeAiQuota(env: Env, userId: number) {
  const limit = parseInt(env.AI_DAILY_LIMIT || '5', 10);
  const date = todayUTC();
  const row = await env.DB.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').bind(userId, date).first<{ count: number }>();
  const used = row?.count ?? 0;
  if (used >= limit) return { ok: false, used, limit };
  await env.DB.prepare(
    'INSERT INTO ai_usage (user_id, date, count) VALUES (?, ?, 1) ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1'
  )
    .bind(userId, date)
    .run();
  return { ok: true, used: used + 1, limit };
}


/* ---------------- Device sync (Apple Health via Shortcuts, Health Connect via webhook apps) ---------------- */
async function sha256(s: string) {
  return b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
const numIn = (v: unknown, min: number, max: number): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};
// Local calendar date of an ISO time. Times with an offset keep their own date; UTC times are converted to the given zone.
function localDate(iso: string, tz: string): string | null {
  const s = String(iso || '');
  if (/^\d{4}-\d{2}-\d{2}T[^Z]*[+-]\d{2}:?\d{2}$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

interface DayPatch { steps?: number; source: string; resting?: number; hrSum?: number; hrN?: number; hrMax?: number; hrAvg?: number }

async function applySync(env: Env, userId: number, date: string, p: DayPatch) {
  await env.DB.prepare('INSERT OR IGNORE INTO daily_logs (user_id, date) VALUES (?, ?)').bind(userId, date).run();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (p.steps !== undefined) sets.push('steps = ?', 'steps_source = ?'), vals.push(p.steps, p.source);
  if (p.resting !== undefined) sets.push('resting_hr = ?'), vals.push(p.resting);
  if (p.hrAvg !== undefined) sets.push('hr_avg = ?', 'hr_sum = 0', 'hr_n = 0'), vals.push(p.hrAvg);
  if (p.hrN) sets.push('hr_sum = hr_sum + ?', 'hr_n = hr_n + ?', 'hr_avg = (hr_sum + ?) / (hr_n + ?)'), vals.push(p.hrSum, p.hrN, p.hrSum, p.hrN);
  if (p.hrMax !== undefined) sets.push('hr_max = MAX(COALESCE(hr_max, 0), ?)'), vals.push(p.hrMax);
  if (!sets.length) return;
  await env.DB.prepare(`UPDATE daily_logs SET ${sets.join(', ')} WHERE user_id = ? AND date = ?`).bind(...vals, userId, date).run();
}

async function handleSync(env: Env, request: Request, url: URL, token: string) {
  const u = await env.DB.prepare('SELECT id FROM users WHERE sync_token_hash = ?').bind(await sha256(token)).first<{ id: number }>();
  if (!u) return err('bad_token', 401);
  const raw = await request.text();
  if (raw.length > 2_000_000) return err('too_large', 413);
  let body: any = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  for (const [k, v] of url.searchParams) if (body[k] === undefined) body[k] = v;
  const tz = typeof body.timezone === 'string' && /^[A-Za-z_]+\/[A-Za-z_\/-]+$/.test(body.timezone) ? body.timezone : 'Europe/Bucharest';
  const days = new Map<string, DayPatch>();
  const day = (d: string, source: string) => { let x = days.get(d); if (!x) days.set(d, (x = { source })); return x; };

  if (Array.isArray(body.steps) || Array.isArray(body.heart_rate) || Array.isArray(body.resting_heart_rate)) {
    // Health Connect webhook format: arrays of records with ISO times
    const src = 'health_connect';
    const touched = new Set<string>();
    const stmts: D1PreparedStatement[] = [];
    for (const r of (Array.isArray(body.steps) ? body.steps : []).slice(0, 5000)) {
      const c = numIn(r?.count, 0, 100000);
      const d = localDate(r?.start_time, tz);
      if (c === null || !d || !r.end_time) continue;
      touched.add(d);
      stmts.push(env.DB.prepare('INSERT OR REPLACE INTO sync_steps (user_id, date, start_time, end_time, count) VALUES (?, ?, ?, ?, ?)')
        .bind(u.id, d, String(r.start_time).slice(0, 40), String(r.end_time).slice(0, 40), c));
    }
    for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
    for (const d of touched) {
      const t = await env.DB.prepare('SELECT SUM(count) AS n FROM sync_steps WHERE user_id = ? AND date = ?').bind(u.id, d).first<{ n: number }>();
      day(d, src).steps = Math.min(100000, t?.n ?? 0);
    }
    for (const r of (Array.isArray(body.heart_rate) ? body.heart_rate : []).slice(0, 20000)) {
      const bpm = numIn(r?.avg ?? r?.bpm, 25, 230);
      const d = localDate(r?.time ?? r?.start_time, tz);
      if (bpm === null || !d) continue;
      const x = day(d, src);
      x.hrSum = (x.hrSum ?? 0) + bpm; x.hrN = (x.hrN ?? 0) + 1;
      const mx = numIn(r?.max ?? r?.bpm, 25, 230);
      if (mx !== null) x.hrMax = Math.max(x.hrMax ?? 0, mx);
    }
    for (const r of (Array.isArray(body.resting_heart_rate) ? body.resting_heart_rate : []).slice(0, 500)) {
      const bpm = numIn(r?.bpm ?? r?.beats_per_minute, 25, 150);
      const d = localDate(r?.time ?? r?.start_time, tz);
      if (bpm !== null && d) day(d, src).resting = bpm;
    }
  } else {
    // Simple totals format (iOS Shortcuts / any automation): {date?, steps?, resting_hr?, hr_avg?, hr_max?}
    const d = DATE_RE.test(String(body.date || '')) ? String(body.date) : localDate(new Date().toISOString(), tz)!;
    const x = day(d, String(body.source || 'apple_health').replace(/[^a-z_]/g, '').slice(0, 20) || 'apple_health');
    const steps = numIn(body.steps, 0, 100000); if (steps !== null) x.steps = steps;
    const rest = numIn(body.resting_hr, 25, 150); if (rest !== null) x.resting = rest;
    const avg = numIn(body.hr_avg ?? body.heart_rate, 25, 230); if (avg !== null) x.hrAvg = avg;
    const mx = numIn(body.hr_max, 25, 230); if (mx !== null) x.hrMax = mx;
  }

  for (const [d, p] of days) if (DATE_RE.test(d)) await applySync(env, u.id, d, p);
  await env.DB.prepare("UPDATE users SET last_sync_at = datetime('now') WHERE id = ?").bind(u.id).run();
  return json({ ok: true, days: [...days.keys()].sort() });
}

/* ---------------- ICS ---------------- */
function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

async function buildIcs(env: Env, userId: number) {
  const prof = await env.DB.prepare('SELECT data FROM profiles WHERE user_id = ?').bind(userId).first<{ data: string }>();
  const p = prof ? JSON.parse(prof.data) : {};
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NextMe//Calendar//RO', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:NextMe', 'METHOD:PUBLISH'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ro = (p.lang || 'ro') === 'ro';
  // Recurring training days from the profile
  const days: number[] = Array.isArray(p.trainingDays) ? p.trainingDays : [];
  const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  if (days.length) {
    const time = /^\d{2}:\d{2}$/.test(p.trainingTime || '') ? p.trainingTime : '18:00';
    const start = new Date();
    const ymd = start.toISOString().slice(0, 10).replace(/-/g, '');
    const hhmm = time.replace(':', '');
    const dur = Math.max(20, Math.min(120, parseInt(p.sessionMinutes || 45, 10)));
    const endMin = parseInt(time.slice(0, 2)) * 60 + parseInt(time.slice(3)) + dur;
    const endT = String(Math.floor(endMin / 60) % 24).padStart(2, '0') + String(endMin % 60).padStart(2, '0');
    lines.push(
      'BEGIN:VEVENT',
      `UID:nextme-training-${userId}@nextme`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Bucharest:${ymd}T${hhmm}00`,
      `DTEND;TZID=Europe/Bucharest:${ymd}T${endT}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => map[d]).join(',')}`,
      `SUMMARY:${icsEscape(ro ? 'NextMe · Antrenament' : 'NextMe · Workout')}`,
      `DESCRIPTION:${icsEscape(ro ? 'Deschide NextMe pentru planul de azi.' : 'Open NextMe for today\'s plan.')}`,
      'END:VEVENT'
    );
  }
  const ev = await env.DB.prepare('SELECT id, date, time, title FROM events WHERE user_id = ? ORDER BY date LIMIT 500').bind(userId).all<any>();
  for (const e of ev.results || []) {
    const d = String(e.date).replace(/-/g, '');
    lines.push('BEGIN:VEVENT', `UID:nextme-ev-${e.id}@nextme`, `DTSTAMP:${stamp}`);
    if (e.time && /^\d{2}:\d{2}$/.test(e.time)) {
      lines.push(`DTSTART;TZID=Europe/Bucharest:${d}T${e.time.replace(':', '')}00`, 'DURATION:PT1H');
    } else {
      lines.push(`DTSTART;VALUE=DATE:${d}`);
    }
    lines.push(`SUMMARY:${icsEscape('NextMe · ' + e.title)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/* ---------------- Router ---------------- */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const method = request.method;

  try {
    // Public ICS feed for Google Calendar "From URL"
    const icsMatch = path.match(/^\/ics\/([A-Za-z0-9_-]{20,})\.ics$/);
    if (icsMatch && method === 'GET') {
      const u = await env.DB.prepare('SELECT id FROM users WHERE ics_token = ?').bind(icsMatch[1]).first<{ id: number }>();
      if (!u) return new Response('Not found', { status: 404 });
      return new Response(await buildIcs(env, u.id), {
        headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'max-age=3600' },
      });
    }

    if (path === '/auth/register' && method === 'POST') {
      const { username, password } = await readJson<{ username?: string; password?: string }>(request);
      const name = String(username || '').trim();
      if (!/^[A-Za-z0-9._-]{3,24}$/.test(name)) return err('bad_username');
      if (String(password || '').length < 8 || String(password).length > 200) return err('weak_password');
      const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(name).first();
      if (exists) return err('username_taken', 409);
      const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
      const hash = await hashPassword(String(password), salt);
      const res = await env.DB.prepare('INSERT INTO users (username, pass_hash, salt, ics_token) VALUES (?, ?, ?, ?)')
        .bind(name, hash, salt, randomToken(24))
        .run();
      const userId = res.meta.last_row_id as number;
      const token = randomToken();
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(token, userId, Date.now() + SESSION_DAYS * 864e5)
        .run();
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, token, SESSION_DAYS * 86400) });
    }

    if (path === '/auth/login' && method === 'POST') {
      const { username, password } = await readJson<{ username?: string; password?: string }>(request);
      const u = await env.DB.prepare('SELECT id, pass_hash, salt FROM users WHERE username = ?')
        .bind(String(username || '').trim())
        .first<{ id: number; pass_hash: string; salt: string }>();
      if (!u) return err('bad_credentials', 401);
      const hash = await hashPassword(String(password || ''), u.salt);
      if (!timingSafeEqual(hash, u.pass_hash)) return err('bad_credentials', 401);
      const token = randomToken();
      await env.DB.batch([
        env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(u.id, Date.now()),
        env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, u.id, Date.now() + SESSION_DAYS * 864e5),
      ]);
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, token, SESSION_DAYS * 86400) });
    }

    if (path === '/auth/logout' && method === 'POST') {
      const token = getCookie(request, COOKIE);
      if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, '', 0) });
    }

    // Public device-sync webhook, authorised by a per-user secret token in the URL
    const syncMatch = path.match(/^\/sync\/([A-Za-z0-9_-]{20,})$/);
    if (syncMatch && method === 'POST') return handleSync(env, request, url, syncMatch[1]);

    // Everything below requires a session
    const user = await currentUser(ctx);
    if (!user) return err('unauthorized', 401);

    if (path === '/me' && method === 'GET') {
      const prof = await env.DB.prepare('SELECT data FROM profiles WHERE user_id = ?').bind(user.id).first<{ data: string }>();
      const ai = await env.DB.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').bind(user.id, todayUTC()).first<{ count: number }>();
      const sync = await env.DB.prepare('SELECT sync_token_hash IS NOT NULL AS on_, last_sync_at FROM users WHERE id = ?').bind(user.id).first<{ on_: number; last_sync_at: string | null }>();
      return json({
        user: { username: user.username, icsToken: user.ics_token },
        profile: prof ? JSON.parse(prof.data) : null,
        ai: { used: ai?.count ?? 0, limit: parseInt(env.AI_DAILY_LIMIT || '5', 10) },
        sync: { enabled: !!sync?.on_, lastAt: sync?.last_sync_at ? sync.last_sync_at.replace(' ', 'T') + 'Z' : null },
      });
    }

    if (path === '/sync/token' && method === 'POST') {
      const token = randomToken(24);
      await env.DB.prepare('UPDATE users SET sync_token_hash = ? WHERE id = ?').bind(await sha256(token), user.id).run();
      return json({ token, url: new URL('/api/sync/' + token, request.url).toString() });
    }
    if (path === '/sync/token' && method === 'DELETE') {
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET sync_token_hash = NULL WHERE id = ?').bind(user.id),
        env.DB.prepare('DELETE FROM sync_steps WHERE user_id = ?').bind(user.id),
      ]);
      return json({ ok: true });
    }

    if (path === '/profile' && method === 'PUT') {
      const body = await readJson(request);
      const data = JSON.stringify(body ?? {});
      if (data.length > 20000) return err('too_large', 413);
      await env.DB.prepare(
        "INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
      )
        .bind(user.id, data)
        .run();
      return json({ ok: true });
    }

    if (path === '/account' && method === 'DELETE') {
      await env.DB.batch(
        ['sessions', 'profiles', 'daily_logs', 'measurements', 'events', 'ai_usage', 'checkins', 'sync_steps', 'workout_sets'].map((t) =>
          env.DB.prepare(`DELETE FROM ${t} WHERE user_id = ?`).bind(user.id)
        ).concat([env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)])
      );
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request, '', 0) });
    }

    if (path === '/days' && method === 'GET') {
      const from = url.searchParams.get('from') || '';
      const to = url.searchParams.get('to') || '';
      if (!DATE_RE.test(from) || !DATE_RE.test(to)) return err('bad_range');
      const r = await env.DB.prepare(
        'SELECT date, water_ml, workout_done, workout_minutes, steps, steps_source, resting_hr, hr_avg, hr_max, moves, foods FROM daily_logs WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date'
      )
        .bind(user.id, from, to)
        .all<any>();
      return json({ days: (r.results || []).map((d) => ({ ...d, foods: JSON.parse(d.foods || '[]'), moves: JSON.parse(d.moves || '[]') })) });
    }

    const dayMatch = path.match(/^\/day\/(\d{4}-\d{2}-\d{2})$/);
    if (dayMatch && method === 'PUT') {
      const date = dayMatch[1];
      const b = await readJson<{ water_ml?: number; workout_done?: number; workout_minutes?: number; steps?: number; moves?: unknown[]; foods?: unknown[] }>(request);
      const cur = await env.DB.prepare('SELECT water_ml, workout_done, workout_minutes, steps, moves, foods FROM daily_logs WHERE user_id = ? AND date = ?')
        .bind(user.id, date)
        .first<any>();
      const water = b.water_ml !== undefined ? Math.max(0, Math.min(10000, Math.round(Number(b.water_ml) || 0))) : cur?.water_ml ?? 0;
      const done = b.workout_done !== undefined ? (b.workout_done ? 1 : 0) : cur?.workout_done ?? 0;
      const mins = b.workout_minutes !== undefined ? Math.max(0, Math.min(600, Math.round(Number(b.workout_minutes) || 0))) : cur?.workout_minutes ?? 0;
      const steps = b.steps !== undefined ? Math.max(0, Math.min(100000, Math.round(Number(b.steps) || 0))) : cur?.steps ?? 0;
      const moves = b.moves !== undefined ? JSON.stringify(Array.isArray(b.moves) ? b.moves.slice(0, 40).map((m) => String(m).slice(0, 40)) : []) : cur?.moves ?? '[]';
      const foods = b.foods !== undefined ? JSON.stringify(Array.isArray(b.foods) ? b.foods.slice(0, 60) : []) : cur?.foods ?? '[]';
      if (foods.length > 30000) return err('too_large', 413);
      await env.DB.prepare(
        'INSERT INTO daily_logs (user_id, date, water_ml, workout_done, workout_minutes, steps, moves, foods) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET water_ml = excluded.water_ml, workout_done = excluded.workout_done, workout_minutes = excluded.workout_minutes, steps = excluded.steps, moves = excluded.moves, foods = excluded.foods'
      )
        .bind(user.id, date, water, done, mins, steps, moves, foods)
        .run();
      if (b.steps !== undefined) await env.DB.prepare("UPDATE daily_logs SET steps_source = 'manual' WHERE user_id = ? AND date = ?").bind(user.id, date).run();
      return json({ date, water_ml: water, workout_done: done, workout_minutes: mins, steps, moves: JSON.parse(moves), foods: JSON.parse(foods) });
    }

    if (path === '/measurements' && method === 'GET') {
      const r = await env.DB.prepare('SELECT * FROM measurements WHERE user_id = ? ORDER BY date, id').bind(user.id).all<any>();
      return json({ items: r.results || [] });
    }
    if (path === '/measurements' && method === 'POST') {
      const b = await readJson<any>(request);
      const date = DATE_RE.test(b.date) ? b.date : todayUTC();
      const num = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 && n < 400 ? Math.round(n * 10) / 10 : null;
      };
      const vals = ['weight', 'waist', 'hip', 'chest', 'arm', 'thigh', 'neck'].map((k) => num(b[k]));
      if (vals.every((v) => v === null)) return err('empty');
      await env.DB.prepare('INSERT INTO measurements (user_id, date, weight, waist, hip, chest, arm, thigh, neck) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(user.id, date, ...vals)
        .run();
      return json({ ok: true });
    }
    const measDel = path.match(/^\/measurements\/(\d+)$/);
    if (measDel && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM measurements WHERE id = ? AND user_id = ?').bind(Number(measDel[1]), user.id).run();
      return json({ ok: true });
    }

    if (path === '/checkins' && method === 'GET') {
      const r = await env.DB.prepare('SELECT id, date, week, answers FROM checkins WHERE user_id = ? ORDER BY date, id').bind(user.id).all<any>();
      return json({ items: (r.results || []).map((c) => ({ ...c, answers: JSON.parse(c.answers) })) });
    }
    if (path === '/checkins' && method === 'POST') {
      const b = await readJson<any>(request);
      const answers = Array.isArray(b.answers) ? b.answers.slice(0, 30).map((n: unknown) => Math.max(1, Math.min(5, Math.round(Number(n) || 3)))) : null;
      if (!answers || answers.length < 10) return err('bad_checkin');
      await env.DB.prepare('INSERT INTO checkins (user_id, date, week, answers) VALUES (?, ?, ?, ?)')
        .bind(user.id, DATE_RE.test(b.date) ? b.date : todayUTC(), Math.max(0, Math.min(520, Math.round(Number(b.week) || 0))), JSON.stringify(answers))
        .run();
      return json({ ok: true });
    }

    // Guided workout: save all sets of one session and mark the day as trained
    if (path === '/workouts' && method === 'POST') {
      const b = await readJson<any>(request);
      const date = DATE_RE.test(b.date) ? b.date : todayUTC();
      const key = String(b.session_key || '').slice(0, 40);
      const sets = (Array.isArray(b.sets) ? b.sets : []).slice(0, 120).map((x: any) => ({
        ex: String(x.ex || '').replace(/[^a-z0-9_]/g, '').slice(0, 40),
        set: Math.max(1, Math.min(20, Math.round(Number(x.set) || 1))),
        kg: x.kg === null || x.kg === undefined || x.kg === '' ? null : Math.max(0, Math.min(500, Math.round(Number(x.kg) * 4) / 4)),
        reps: Math.max(0, Math.min(600, Math.round(Number(x.reps) || 0))),
      })).filter((x: any) => x.ex && x.reps > 0);
      if (!key || !sets.length) return err('empty');
      const mins = Math.max(1, Math.min(300, Math.round(Number(b.minutes) || 0)));
      await env.DB.batch([
        env.DB.prepare('DELETE FROM workout_sets WHERE user_id = ? AND date = ? AND session_key = ?').bind(user.id, date, key),
        ...sets.map((x: any) => env.DB.prepare('INSERT INTO workout_sets (user_id, date, session_key, exercise_id, set_no, kg, reps) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(user.id, date, key, x.ex, x.set, x.kg, x.reps)),
        env.DB.prepare('INSERT INTO daily_logs (user_id, date, workout_done, workout_minutes) VALUES (?, ?, 1, ?) ON CONFLICT(user_id, date) DO UPDATE SET workout_done = 1, workout_minutes = MAX(workout_minutes, excluded.workout_minutes)')
          .bind(user.id, date, mins),
      ]);
      return json({ ok: true, saved: sets.length });
    }
    // Last logged session per exercise (for progression suggestions)
    if (path === '/sets/last' && method === 'GET') {
      const r = await env.DB.prepare(
        `SELECT s.exercise_id, s.date, s.set_no, s.kg, s.reps FROM workout_sets s
         JOIN (SELECT exercise_id, MAX(date) AS d FROM workout_sets WHERE user_id = ? GROUP BY exercise_id) m
           ON m.exercise_id = s.exercise_id AND m.d = s.date
         WHERE s.user_id = ? ORDER BY s.exercise_id, s.set_no`
      ).bind(user.id, user.id).all<any>();
      const byEx: Record<string, { date: string; sets: { kg: number | null; reps: number }[] }> = {};
      for (const x of r.results || []) (byEx[x.exercise_id] ??= { date: x.date, sets: [] }).sets.push({ kg: x.kg, reps: x.reps });
      return json({ byEx });
    }
    // Full history of one exercise
    const histMatch = path.match(/^\/sets\/([a-z0-9_]{1,40})$/);
    if (histMatch && method === 'GET') {
      const r = await env.DB.prepare('SELECT date, set_no, kg, reps FROM workout_sets WHERE user_id = ? AND exercise_id = ? ORDER BY date, set_no LIMIT 2000')
        .bind(user.id, histMatch[1]).all<any>();
      return json({ items: r.results || [] });
    }

    if (path === '/events' && method === 'GET') {
      const r = await env.DB.prepare('SELECT id, date, time, title, kind FROM events WHERE user_id = ? ORDER BY date, time').bind(user.id).all();
      return json({ items: r.results || [] });
    }
    if (path === '/events' && method === 'POST') {
      const b = await readJson<any>(request);
      if (!DATE_RE.test(b.date) || !String(b.title || '').trim()) return err('bad_event');
      const time = /^\d{2}:\d{2}$/.test(b.time || '') ? b.time : null;
      await env.DB.prepare('INSERT INTO events (user_id, date, time, title, kind) VALUES (?, ?, ?, ?, ?)')
        .bind(user.id, b.date, time, String(b.title).trim().slice(0, 80), ['gym', 'cardio', 'custom'].includes(b.kind) ? b.kind : 'custom')
        .run();
      return json({ ok: true });
    }
    const evDel = path.match(/^\/events\/(\d+)$/);
    if (evDel && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').bind(Number(evDel[1]), user.id).run();
      return json({ ok: true });
    }

    if ((path === '/ai/plate' || path === '/ai/machine') && method === 'POST') {
      const b = await readJson<{ image?: string; lang?: string }>(request);
      const image = String(b.image || '');
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 1_400_000) return err('bad_image');
      if (!env.AI) return err('ai_unavailable', 503);
      const q = await consumeAiQuota(env, user.id);
      if (!q.ok) return json({ error: 'limit_reached', used: q.used, limit: q.limit }, 429);
      const ro = b.lang !== 'en';
      if (path === '/ai/plate') {
        const prompt =
          'You are a nutrition assistant. Identify each food on this plate, estimate its weight in grams from visual portion size, and estimate calories, protein, carbohydrates and fat for that weight using standard food composition values (USDA / European tables). ' +
          `Write food names in ${ro ? 'Romanian' : 'English'}. ` +
          'Answer ONLY with JSON: {"items":[{"name":"","grams":0,"kcal":0,"protein":0,"carbs":0,"fat":0}],"confidence":"low|medium|high"}. If there is no food, return {"items":[]}.';
        const text = await runVision(env, prompt, image);
        const data = extractJson(text) || { items: [] };
        const items = (Array.isArray(data.items) ? data.items : []).slice(0, 12).map((i: any) => ({
          name: String(i.name || '?').slice(0, 60),
          grams: Math.round(Number(i.grams) || 0),
          kcal: Math.round(Number(i.kcal) || 0),
          protein: Math.round(Number(i.protein) || 0),
          carbs: Math.round(Number(i.carbs) || 0),
          fat: Math.round(Number(i.fat) || 0),
        }));
        return json({ items, confidence: data.confidence || 'low', used: q.used, limit: q.limit });
      }
      const prompt =
        'You are a gym equipment expert. Identify the gym machine or equipment in this photo. Choose the best match ONLY from this list of ids: ' +
        MACHINE_IDS.join(', ') +
        '. Answer ONLY with JSON: {"id":"<one id from the list or unknown>","alternatives":["<id>","<id>"],"confidence":"low|medium|high"}.';
      const text = await runVision(env, prompt, image);
      const data = extractJson(text) || {};
      const id = MACHINE_IDS.includes(data.id) ? data.id : 'unknown';
      const alternatives = (Array.isArray(data.alternatives) ? data.alternatives : []).filter((x: string) => MACHINE_IDS.includes(x) && x !== id).slice(0, 3);
      return json({ id, alternatives, confidence: data.confidence || 'low', used: q.used, limit: q.limit });
    }

    return err('not_found', 404);
  } catch (e: any) {
    console.error(e);
    const msg = String(e?.message || e);
    if (msg === 'ai_unavailable') return err('ai_unavailable', 503);
    return err('server_error', 500);
  }
};
