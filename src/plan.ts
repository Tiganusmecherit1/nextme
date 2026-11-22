// Training plan generator.
// Based on: ACSM Position Stand "Progression models in resistance training" (2009),
// ACSM Guidelines for Exercise Testing & Prescription (11th ed.), WHO 2020 physical activity guidelines,
// Schoenfeld et al. 2017 (weekly sets dose-response), ACSM/AHA 2007 older adults recommendations.
import { EXERCISES, HOLDS, type Exercise, type Slot, MACHINES } from './data/exercises';
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

/* ---------- Ready-made programs ---------- */
export interface Program { id: string; days?: number; split?: string[]; minutes?: number; home?: boolean; older?: boolean;
  title: { ro: string; en: string }; text: { ro: string; en: string } }
export const PROGRAMS: Program[] = [
  { id: 'auto', title: { ro: 'Făcut pentru tine', en: 'Made for you' },
    text: { ro: 'Construit din zilele, echipamentul, obiectivul și vârsta ta.', en: 'Built from your days, equipment, goal and age.' } },
  { id: 'full3', days: 3, split: ['fullA', 'fullB', 'fullA'], title: { ro: 'Full body · 3 zile', en: 'Full body · 3 days' },
    text: { ro: 'Tot corpul, de 3 ori pe săptămână. Cel mai bun început: fiecare mușchi lucrează de 2–3 ori pe săptămână.', en: 'Whole body, 3 times a week. The best start: every muscle trains 2–3 times a week.' } },
  { id: 'ul4', days: 4, split: ['upper', 'lower', 'upper', 'lower'], title: { ro: 'Sus / Jos · 4 zile', en: 'Upper / Lower · 4 days' },
    text: { ro: 'Două zile pentru trunchiul superior, două pentru picioare. Pentru cine are deja câteva luni de sală.', en: 'Two upper-body days, two lower-body days. For people with a few months of training.' } },
  { id: 'ppl', days: 6, split: ['push', 'pull', 'legs', 'push', 'pull', 'legs'], title: { ro: 'Împins / Tras / Picioare · 6 zile', en: 'Push / Pull / Legs · 6 days' },
    text: { ro: 'Volum mare, pentru avansați și masă musculară. Cere somn și recuperare bune.', en: 'High volume, for advanced lifters and muscle gain. Needs good sleep and recovery.' } },
  { id: 'home20', days: 3, split: ['fullA', 'fullB', 'fullA'], minutes: 20, home: true, title: { ro: '20 de minute acasă · 3 zile', en: '20 minutes at home · 3 days' },
    text: { ro: 'Scurt, fără sală: greutatea corpului plus ce ai acasă.', en: 'Short, no gym: bodyweight plus whatever you have at home.' } },
  { id: 'older', days: 3, split: ['fullA', 'fullB', 'fullA'], older: true, title: { ro: 'Forță + echilibru 60+ · 3 zile', en: 'Strength + balance 60+ · 3 days' },
    text: { ro: 'Exerciții stabile, 2 serii de 10–15 și echilibru în fiecare zi; reduce riscul de cădere (Sherrington 2019).', en: 'Stable exercises, 2 sets of 10–15 and balance every day; lowers fall risk (Sherrington 2019).' } },
];
export const DEFAULT_DAYS: Record<number, number[]> = { 1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
export const programOf = (p: Profile) => PROGRAMS.find((x) => x.id === p.program) ?? PROGRAMS[0];

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
  const older = ageOf(p) >= 60 || programOf(p).older === true;
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
  const older = ageOf(p) >= 60 || programOf(p).older === true;
  const lvl = levelNum(p);
  const timed = ex.slot === 'core' || ex.slot === 'balance' || HOLDS.has(ex.id);
  if (timed) {
    const rep = ex.slot === 'balance' ? '20–30 s' : ex.anim === 'plank' || ex.anim === 'sideplank' || HOLDS.has(ex.id) ? (lvl === 1 ? '20–30 s' : '30–45 s') : '8–12';
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

/* ---------- 8-week program ----------
 * ACSM 2009 recommends periodised programs: start with an adaptation period, build volume, then raise
 * intensity, and plan lighter recovery weeks. The 8th week is a lighter (deload) week: half the sets, same weights. */
export type Phase = 'adapt' | 'build' | 'intense' | 'deload';
export const PHASE_INFO: Record<Phase, { name: { ro: string; en: string }; text: { ro: string; en: string } }> = {
  adapt: { name: { ro: 'Adaptare', en: 'Adaptation' }, text: { ro: 'Înveți mișcările. Alege greutăți cu care ai mai putea face încă 3 repetări.', en: 'Learn the movements. Pick weights that leave about 3 reps in the tank.' } },
  build: { name: { ro: 'Construire', en: 'Build' }, text: { ro: 'Volum complet. Când faci toate repetările, crești greutatea data viitoare.', en: 'Full volume. When you hit all reps, add weight next time.' } },
  intense: { name: { ro: 'Intensificare', en: 'Intensify' }, text: { ro: 'Mai puține repetări, greutăți mai mari la exercițiile de bază.', en: 'Fewer reps, heavier weights on the main lifts.' } },
  deload: { name: { ro: 'Săptămână ușoară', en: 'Deload week' }, text: { ro: 'Jumătate din serii, aceleași greutăți. Corpul se reface și apoi începe un ciclu nou.', en: 'Half the sets, same weights. Your body recovers, then a new cycle starts.' } },
};
export const PROGRAM_WEEKS = 8;
export function programWeek(p: Profile, date = new Date()): { week: number; cycle: number; phase: Phase } {
  const start = new Date((p.programStart || p.createdAt) + 'T00:00:00');
  const days = Math.max(0, Math.floor((date.getTime() - start.getTime()) / 864e5));
  const w = Math.floor(days / 7);
  const week = (w % PROGRAM_WEEKS) + 1;
  const phase: Phase = week <= 2 ? 'adapt' : week <= 5 ? 'build' : week <= 7 ? 'intense' : 'deload';
  return { week, cycle: Math.floor(w / PROGRAM_WEEKS) + 1, phase };
}
const MAIN = ['squat', 'hinge', 'push_h', 'pull_v', 'pull_h', 'push_v'];
function applyPhase(rx: { sets: number; reps: string; restSec: number }, ex: Exercise, phase: Phase, p: Profile) {
  const timed = /s$/.test(rx.reps);
  if (phase === 'adapt') return { ...rx, sets: Math.max(2, rx.sets - (rx.sets >= 3 ? 1 : 0)) };
  if (phase === 'deload') return { ...rx, sets: Math.max(1, Math.ceil(rx.sets / 2)) };
  if (phase === 'intense' && !timed && ageOf(p) < 60 && MAIN.includes(ex.slot) && ['muscle', 'bodybuilding', 'strength_home'].includes(p.goal)) {
    const m = rx.reps.match(/^(\d+)–(\d+)$/);
    const reps = m ? `${Math.max(4, +m[1] - 2)}–${Math.max(6, +m[2] - 2)}` : rx.reps;
    return { sets: Math.min(5, rx.sets + 1), reps, restSec: rx.restSec + 30 };
  }
  return rx;
}

/** Same-movement alternatives the user can do with their equipment and injuries. */
export function alternatives(p: Profile, ex: Exercise): Exercise[] {
  const avail = availableEquipment(p);
  const lvl = levelNum(p);
  return EXERCISES.filter((e) => e.id !== ex.id && e.slot === ex.slot && e.level <= Math.min(3, lvl + 1) &&
    e.equip.every((q) => avail.has(q)) && !e.avoid.some((a) => p.injuries.includes(a)));
}

/* ---------- Progression (ACSM 2009: when 1–2 reps above the target range are done, add ~2–10% load) ---------- */
export interface Suggestion { kg: number | null; reps: number; note: { ro: string; en: string } | null }
const range = (reps: string) => { const m = reps.match(/(\d+)\D+(\d+)/); return m ? [+m[1], +m[2]] : [+reps || 10, +reps || 10]; };
const stepFor = (ex: Exercise) => ex.equip.includes('dumbbells') ? 2 : ex.equip.includes('kettlebell') ? 4 : ex.equip.includes('barbell') || ex.equip.includes('smith_machine') ? 2.5 : 2.5;
export function suggest(p: Profile, ex: Exercise, rx: Prescribed | { sets: number; reps: string }, last?: { kg: number | null; reps: number }[]): Suggestion {
  const [lo, hi] = range(rx.reps);
  const bodyweight = ex.equip.every((q) => q === 'none' || q === 'band');
  if (!last?.length) return { kg: null, reps: hi, note: null };
  const lastKg = last.reduce((m, x) => Math.max(m, x.kg ?? 0), 0) || null;
  const allTop = last.length >= Math.min(rx.sets, 2) && last.every((x) => x.reps >= hi);
  const missed = last.some((x) => x.reps < lo);
  if (bodyweight || lastKg === null) {
    if (allTop) {
      const harder = alternatives(p, ex).find((e) => e.level > ex.level);
      return { kg: null, reps: hi, note: harder
        ? { ro: `Ai făcut toate repetările. Poți trece la: ${harder.name.ro}.`, en: `You hit all reps. You can move up to: ${harder.name.en}.` }
        : { ro: 'Ai făcut toate repetările: mergi mai lent (3 s la coborâre) sau adaugă o serie.', en: 'You hit all reps: slow down (3 s lowering) or add a set.' } };
    }
    const best = Math.max(...last.map((x) => x.reps));
    return { kg: null, reps: Math.min(hi, best + 1), note: { ro: `Data trecută: ${best} repetări. Încearcă ${Math.min(hi, best + 1)}.`, en: `Last time: ${best} reps. Try ${Math.min(hi, best + 1)}.` } };
  }
  if (allTop) {
    const next = Math.round((lastKg + stepFor(ex)) * 4) / 4;
    return { kg: next, reps: lo, note: { ro: `Ai făcut toate repetările cu ${lastKg} kg → azi ${next} kg.`, en: `You hit all reps at ${lastKg} kg → today ${next} kg.` } };
  }
  if (missed) return { kg: lastKg, reps: lo, note: { ro: `Rămâi la ${lastKg} kg până faci toate repetările.`, en: `Stay at ${lastKg} kg until you hit all reps.` } };
  const best = Math.max(...last.map((x) => x.reps));
  return { kg: lastKg, reps: Math.min(hi, best + 1), note: { ro: `${lastKg} kg, încearcă cu o repetare în plus.`, en: `${lastKg} kg, aim for one more rep.` } };
}

export function buildPlan(profile: Profile, date = new Date()): Session[] {
  const prog = programOf(profile);
  const p: Profile = { ...profile, ...(prog.minutes ? { sessionMinutes: prog.minutes } : {}), ...(prog.home ? { location: 'home' as const } : {}) };
  const { phase } = programWeek(p, date);
  const days = Math.max(1, p.trainingDays.length || 3);
  const split = prog.split ?? splitFor(days);
  const avail = availableEquipment(p);
  const older = ageOf(p) >= 60 || prog.older === true;
  const warmupMin = prog.minutes && prog.minutes <= 25 ? 4 : older ? 8 : 6;
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
      const picked = pick(slot, p, avail, used, i);
      if (!picked) continue;
      const sw = p.swaps?.[picked.id];
      const e = (sw && EXERCISES.find((x) => x.id === sw && x.equip.every((q) => avail.has(q)))) || picked;
      const base = applyPhase(prescription(p, e), e, phase, p);
      const rx = prog.minutes && prog.minutes <= 25 ? { ...base, restSec: Math.min(base.restSec, 45) } : base;
      const per = rx.sets * (0.75 + rx.restSec / 60) + 1;
      if (minutes + per > budget && list.length >= 3) break;
      used.add(e.id);
      used.add(picked.id);
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
