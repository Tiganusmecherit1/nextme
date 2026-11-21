// Training plan generator.
// Based on: ACSM Position Stand "Progression models in resistance training" (2009),
// ACSM Guidelines for Exercise Testing & Prescription (11th ed.), WHO 2020 physical activity guidelines,
// Schoenfeld et al. 2017 (weekly sets dose-response), ACSM/AHA 2007 older adults recommendations.
import { EXERCISES, type Exercise, type Slot, MACHINES } from './data/exercises';
import { ageOf, type Profile } from './calc';

export interface Prescribed {
  ex: Exercise;
  sets: number;
  reps: string;
  restSec: number;
}
export interface Session {
  key: string;
  title: { ro: string; en: string };
  exercises: Prescribed[];
  warmupMin: number;
  finisher?: { ro: string; en: string };
  estMinutes: number;
}

const TEMPLATES: Record<string, { title: { ro: string; en: string }; slots: Slot[] }> = {
  fullA: { title: { ro: 'Full body A', en: 'Full body A' }, slots: ['squat', 'push_h', 'pull_v', 'glutes', 'push_v', 'core', 'biceps', 'calves'] },
  fullB: { title: { ro: 'Full body B', en: 'Full body B' }, slots: ['hinge', 'pull_h', 'push_v', 'lunge', 'push_h', 'core', 'triceps', 'shoulders'] },
  upper: { title: { ro: 'Trunchi superior', en: 'Upper body' }, slots: ['push_h', 'pull_v', 'push_v', 'pull_h', 'shoulders', 'biceps', 'triceps', 'chest_iso'] },
  lower: { title: { ro: 'Picioare și core', en: 'Lower body & core' }, slots: ['squat', 'hinge', 'lunge', 'hamstrings', 'glutes', 'calves', 'core', 'quads'] },
  push: { title: { ro: 'Împins (piept, umeri, triceps)', en: 'Push (chest, shoulders, triceps)' }, slots: ['push_h', 'push_v', 'chest_iso', 'shoulders', 'triceps', 'core', 'push_h'] },
  pull: { title: { ro: 'Tras (spate, biceps)', en: 'Pull (back, biceps)' }, slots: ['pull_v', 'pull_h', 'hinge', 'biceps', 'shoulders', 'core', 'pull_h'] },
  legs: { title: { ro: 'Picioare', en: 'Legs' }, slots: ['squat', 'hinge', 'lunge', 'quads', 'hamstrings', 'calves', 'glutes'] },
};

function splitFor(days: number): string[] {
  if (days <= 1) return ['fullA'];
  if (days === 2) return ['fullA', 'fullB'];
  if (days === 3) return ['fullA', 'fullB', 'fullA'];
  if (days === 4) return ['upper', 'lower', 'upper', 'lower'];
  if (days === 5) return ['upper', 'lower', 'push', 'pull', 'legs'];
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
}

export function availableEquipment(p: Profile): Set<string> {
  if (p.location === 'home') return new Set(['none', ...p.homeEquipment]);
  const list = p.gymEquipment.length ? p.gymEquipment : MACHINES.map((m) => m.id);
  return new Set(['none', 'band', ...list]);
}

const levelNum = (p: Profile) => {
  const l = p.level === 'beginner' ? 1 : p.level === 'intermediate' ? 2 : 3;
  return ageOf(p) >= 60 ? Math.min(l, 2) : l;
};

function pick(slot: Slot, p: Profile, avail: Set<string>, used: Set<string>, variant: number): Exercise | null {
  const lvl = levelNum(p);
  const cands = EXERCISES.filter(
    (e) =>
      e.slot === slot &&
      e.level <= lvl &&
      e.equip.every((q) => avail.has(q)) &&
      !e.avoid.some((a) => p.injuries.includes(a)) &&
      !used.has(e.id)
  );
  if (!cands.length) return null;
  const older = ageOf(p) >= 60;
  // Scoring: machines/stable options for beginners and 60+, free weights for advanced; vary between days.
  const score = (e: Exercise) => {
    let s = 0;
    const isMachine = e.equip.some((q) => MACHINES.find((m) => m.id === q) && !['dumbbells', 'barbell', 'kettlebell', 'flat_bench', 'pullup_bar'].includes(q));
    if ((lvl === 1 || older) && isMachine) s += 2;
    if (lvl >= 2 && e.equip.some((q) => ['barbell', 'dumbbells'].includes(q))) s += 2;
    if (e.equip[0] !== 'none') s += 1; // prefer loaded options when available
    if (e.level === lvl) s += 1;
    return s;
  };
  const sorted = cands.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const top = sorted.filter((e) => score(e) >= score(sorted[0]) - 1);
  return top[variant % top.length];
}

export function prescription(p: Profile, ex: Exercise): { sets: number; reps: string; restSec: number } {
  const older = ageOf(p) >= 60;
  const lvl = levelNum(p);
  const timed = ex.slot === 'core' || ex.slot === 'balance' || ex.id === 'wall_sit';
  if (timed) {
    const rep = ex.slot === 'balance' ? '20–30 s' : ex.anim === 'plank' || ex.anim === 'sideplank' || ex.id === 'wall_sit' ? (lvl === 1 ? '20–30 s' : '30–45 s') : '8–12';
    return { sets: lvl === 1 ? 2 : 3, reps: rep, restSec: 45 };
  }
  if (older) return { sets: 2, reps: '10–15', restSec: 75 };
  switch (p.goal) {
    case 'wellness':
      return { sets: lvl === 1 ? 2 : 3, reps: '10–15', restSec: 60 };
    case 'fat_loss':
      return { sets: lvl === 1 ? 2 : 3, reps: '10–15', restSec: 45 };
    case 'strength_home':
      return { sets: 3, reps: ex.equip[0] === 'none' ? '10–20' : '8–15', restSec: 60 };
    case 'muscle':
      return { sets: lvl === 1 ? 2 : 3, reps: '8–12', restSec: 90 };
    case 'bodybuilding':
      return { sets: lvl === 1 ? 3 : 4, reps: ['squat', 'hinge', 'push_h', 'pull_v'].includes(ex.slot) ? '6–10' : '10–15', restSec: ['squat', 'hinge'].includes(ex.slot) ? 120 : 75 };
  }
}

export function buildPlan(p: Profile): Session[] {
  const days = Math.max(1, p.trainingDays.length || 3);
  const split = splitFor(days);
  const avail = availableEquipment(p);
  const older = ageOf(p) >= 60;
  const warmupMin = older ? 8 : 6;
  const cooldown = 3;
  const wantFinisher = (p.goal === 'fat_loss' || p.goal === 'wellness') && p.sessionMinutes >= 40;
  const budget = p.sessionMinutes - warmupMin - cooldown - (wantFinisher ? 10 : 0);

  return split.map((key, i) => {
    const tpl = TEMPLATES[key];
    const used = new Set<string>();
    const list: Prescribed[] = [];
    let minutes = 0;
    const slots = [...tpl.slots];
    if (older && !slots.includes('balance')) slots.splice(Math.min(4, slots.length), 0, 'balance');
    for (const slot of slots) {
      const e = pick(slot, p, avail, used, i);
      if (!e) continue;
      const rx = prescription(p, e);
      const per = rx.sets * (0.75 + rx.restSec / 60) + 1;
      if (minutes + per > budget && list.length >= 3) break;
      used.add(e.id);
      list.push({ ex: e, ...rx });
      minutes += per;
    }
    const finisher = wantFinisher
      ? p.location === 'gym'
        ? { ro: '10 min cardio la bicicletă/bandă: 1 min alert, 1 min ușor (zona 2–4)', en: '10 min bike/treadmill: 1 min hard, 1 min easy' }
        : { ro: '10 min: mers alert pe loc / urcări pe treaptă, 40 s lucru, 20 s pauză', en: '10 min: brisk marching / step-ups, 40 s work, 20 s rest' }
      : undefined;
    return {
      key: key + i,
      title: tpl.title,
      exercises: list,
      warmupMin,
      finisher,
      estMinutes: Math.round(warmupMin + cooldown + minutes + (wantFinisher ? 10 : 0)),
    };
  });
}

/** Map a calendar date to the session planned that day (or null for a rest day). */
export function sessionForDate(p: Profile, plan: Session[], date: Date): Session | null {
  const days = [...p.trainingDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // Monday-first order
  const idx = days.indexOf(date.getDay());
  if (idx < 0) return null;
  return plan[idx % plan.length] ?? null;
}
