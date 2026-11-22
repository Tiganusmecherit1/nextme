import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, emptyDay, type DayLog } from './api';
import { addDays, macros, todayStr, waterGoalMl, type Profile } from './calc';
import { buildPlan, type Session } from './plan';
import { setLang } from './i18n';
import { isActiveDay, stepGoal } from './activity';

export interface Measurement { id: number; date: string; weight?: number; waist?: number; hip?: number; chest?: number; arm?: number; thigh?: number; neck?: number }
export interface CalEvent { id: number; date: string; time?: string | null; title: string; kind: string }

interface Store {
  username: string;
  icsToken: string;
  profile: Profile;
  ai: { used: number; limit: number };
  setAi: (a: { used: number; limit: number }) => void;
  days: Record<string, DayLog>;
  day: (date: string) => DayLog;
  patchDay: (date: string, patch: Partial<DayLog>) => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  plan: Session[];
  targets: ReturnType<typeof macros> & { waterMl: number };
  measurements: Measurement[];
  reloadMeasurements: () => Promise<void>;
  events: CalEvent[];
  reloadEvents: () => Promise<void>;
  loadRange: (from: string, to: string) => Promise<void>;
  streak: number;
  logout: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
};


export function StoreProvider(props: { username: string; icsToken: string; profile: Profile; ai: { used: number; limit: number }; onProfile: (p: Profile) => void; onLogout: () => void; children: ReactNode }) {
  const { profile } = props;
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [ai, setAi] = useState(props.ai);

  const loadRange = useCallback(async (from: string, to: string) => {
    const r = await api<{ days: DayLog[] }>(`/days?from=${from}&to=${to}`);
    setDays((cur) => {
      const n = { ...cur };
      for (const d of r.days) n[d.date] = d;
      return n;
    });
  }, []);
  const reloadMeasurements = useCallback(async () => {
    const r = await api<{ items: Measurement[] }>('/measurements');
    setMeasurements(r.items);
  }, []);
  const reloadEvents = useCallback(async () => {
    const r = await api<{ items: CalEvent[] }>('/events');
    setEvents(r.items);
  }, []);

  useEffect(() => {
    setLang(profile.lang);
    const today = todayStr();
    loadRange(addDays(today, -90), addDays(today, 1)).catch(() => {});
    reloadMeasurements().catch(() => {});
    reloadEvents().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const day = useCallback((date: string) => days[date] ?? emptyDay(date), [days]);

  const patchDay = useCallback(async (date: string, patch: Partial<DayLog>) => {
    setDays((cur) => ({ ...cur, [date]: { ...(cur[date] ?? emptyDay(date)), ...patch } }));
    const saved = await api<DayLog>(`/day/${date}`, { method: 'PUT', body: patch });
    setDays((cur) => ({ ...cur, [date]: saved }));
  }, []);

  const saveProfile = useCallback(async (p: Profile) => {
    await api('/profile', { method: 'PUT', body: p });
    setLang(p.lang);
    props.onProfile(p);
  }, [props]);

  const plan = useMemo(() => buildPlan(profile), [profile]);
  const targets = useMemo(() => ({ ...macros(profile), waterMl: waterGoalMl(profile) }), [profile]);

  const streak = useMemo(() => {
    let n = 0;
    let d = todayStr();
    const g = stepGoal(profile);
    if (!isActiveDay(days[d], g)) d = addDays(d, -1);
    while (isActiveDay(days[d], g)) { n++; d = addDays(d, -1); }
    return n;
  }, [days, profile]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    props.onLogout();
  }, [props]);

  const value: Store = {
    username: props.username, icsToken: props.icsToken, profile, ai, setAi, days, day, patchDay, saveProfile, plan, targets,
    measurements, reloadMeasurements, events, reloadEvents, loadRange, streak, logout,
  };
  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}
