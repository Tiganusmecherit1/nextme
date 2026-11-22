// Daily activity accounting. Every routine / interval / biohacking workout is stored in DayLog.moves as
// "<id>@<minutes>" so the Move ring counts real minutes (older entries without "@" fall back to the routine length).
import type { DayLog } from './api';
import { ageOf, type Profile } from './calc';
import { ROUTINES } from './data/routines';

export const moveId = (entry: string) => entry.split('@')[0];
export const hasMove = (d: DayLog, id: string) => (d.moves ?? []).some((m) => moveId(m) === id);

function entryMinutes(entry: string) {
  const [id, min] = entry.split('@');
  if (min !== undefined && !Number.isNaN(Number(min))) return Number(min);
  return ROUTINES.find((r) => r.id === id)?.minutes ?? 5;
}

/** Minutes from routines, intervals, biohacking workouts and manually logged activity. */
export const moveMinutes = (d: DayLog) => (d.moves ?? []).reduce((a, m) => a + entryMinutes(m), 0);
/** Everything that counts toward the Move ring. */
export const activeMinutes = (d: DayLog) => (d.workout_minutes || 0) + moveMinutes(d);

/** Adds (or updates, keeping the longer duration) a move entry. Ids starting with "act" are free activity and always append. */
export function withMove(d: DayLog, id: string, minutes: number): string[] {
  const min = Math.max(1, Math.round(minutes));
  const list = d.moves ?? [];
  if (id === 'act') {
    const n = list.filter((m) => moveId(m).startsWith('act')).length;
    return [...list, `act${n + 1}@${min}`];
  }
  const i = list.findIndex((m) => moveId(m) === id);
  if (i < 0) return [...list, `${id}@${min}`];
  const next = [...list];
  next[i] = `${id}@${Math.max(min, entryMinutes(list[i]))}`;
  return next;
}

/**
 * Daily goals, the same everywhere (rings, streak, badges).
 * Move: WHO 2020 recommends 150–300 min/week of moderate activity → 30 min/day on 5 days.
 * Steps: Paluch et al., Lancet Public Health 2022 (15 cohorts, 47,471 adults): mortality benefit levels off
 * at ~6,000–8,000 steps/day for 60+ and ~8,000–10,000 for under 60. A custom goal from the profile wins.
 */
export const MOVE_GOAL = 30;
export const stepGoal = (p: Profile) => p.stepGoal || (ageOf(p) >= 60 ? 7000 : 8000);

/** An "active day" for the streak and badges: workout done, any routine or logged activity, or the step goal reached. */
export const isActiveDay = (d: DayLog | undefined, goalSteps: number) =>
  !!d && (d.workout_done > 0 || (d.moves?.length ?? 0) > 0 || d.steps >= goalSteps);
