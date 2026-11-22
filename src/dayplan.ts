// "Plan of the day": the few things worth doing today, in time order, and the single next step.
import type { DayLog } from './api';
import { ageOf, type Profile } from './calc';
import { hasMove } from './activity';
import { ROUTINES } from './data/routines';
import { bioWorkout } from './data/biohacking';
import type { Session } from './plan';

type T = { ro: string; en: string };
export interface PlanItem {
  id: string;
  icon: string;
  when: T;
  title: T;
  sub: T;
  href: string;
  done: boolean;
  /** hours [from, to) when this item makes sense */
  from: number;
  to: number;
  primary?: boolean;
}

const routine = (id: string) => ROUTINES.find((r) => r.id === id)!;

export function buildDayPlan(p: Profile, d: DayLog, session: Session | null, checkinDue: number | null): PlanItem[] {
  const items: PlanItem[] = [];
  const trainHour = Number((p.trainingTime || '18:00').split(':')[0]) || 18;
  const older = ageOf(p) >= 60;

  if (checkinDue !== null) {
    items.push({
      id: 'checkin', icon: '✨', from: 0, to: 24, done: false, href: '#/checkin',
      when: { ro: 'Oricând', en: 'Any time' },
      title: checkinDue === 0 ? { ro: 'Evaluarea de start', en: 'Starting check-in' } : { ro: `Check-in · săptămâna ${checkinDue}`, en: `Check-in · week ${checkinDue}` },
      sub: { ro: '20 de întrebări, 2 minute', en: '20 questions, 2 minutes' },
    });
  }

  const morning = routine('morning');
  items.push({ id: 'morning', icon: morning.icon, from: 5, to: 11, done: hasMove(d, 'morning'), href: '#/routine/morning',
    when: { ro: 'Dimineața', en: 'Morning' }, title: morning.title, sub: { ro: `${morning.minutes} min, acasă`, en: `${morning.minutes} min, at home` } });

  if (session) {
    items.push({ id: 'workout', icon: '🏋️', from: 0, to: 24, done: d.workout_done > 0, href: '#/workout/' + session.key, primary: true,
      when: { ro: `La ${p.trainingTime}`, en: `At ${p.trainingTime}` }, title: session.title,
      sub: { ro: `${session.exercises.length} exerciții · ~${session.estMinutes} min`, en: `${session.exercises.length} exercises · ~${session.estMinutes} min` } });
  } else {
    const z2 = bioWorkout('zone2')!;
    items.push({ id: 'recovery', icon: z2.icon, from: 0, to: 24, done: hasMove(d, 'bio_zone2'), href: '#/bio/zone2', primary: true,
      when: { ro: 'Zi fără antrenament', en: 'Rest day' }, title: { ro: 'Recuperare activă: Zona 2', en: 'Active recovery: Zone 2' },
      sub: { ro: '30 min mers alert sau bicicletă, poți vorbi', en: '30 min brisk walk or bike, you can still talk' } });
  }

  items.push({ id: 'walk', icon: '🚶', from: 12, to: 22, done: hasMove(d, 'bio_post_meal_walk') || hasMove(d, 'after_meal'), href: '#/bio/post_meal_walk',
    when: { ro: 'După masa principală', en: 'After your main meal' }, title: { ro: 'Plimbare de 10 minute', en: '10-minute walk' },
    sub: { ro: 'Scade glicemia de după masă', en: 'Lowers post-meal blood sugar' } });

  const mid = routine(older ? 'chair' : 'office');
  items.push({ id: mid.id, icon: mid.icon, from: 10, to: 19, done: hasMove(d, mid.id), href: '#/routine/' + mid.id,
    when: { ro: 'Pauză de la stat jos', en: 'Break from sitting' }, title: mid.title, sub: { ro: `${mid.minutes} min`, en: `${mid.minutes} min` } });

  const evening = routine('evening');
  items.push({ id: 'evening', icon: evening.icon, from: 19, to: 24, done: hasMove(d, 'evening'), href: '#/routine/evening',
    when: { ro: 'Seara', en: 'Evening' }, title: evening.title, sub: { ro: `${evening.minutes} min, înainte de somn`, en: `${evening.minutes} min, before bed` } });

  const order = (x: PlanItem) => (x.id === 'checkin' ? -1 : x.id === 'workout' || x.id === 'recovery' ? trainHour : x.from);
  return items.sort((a, b) => order(a) - order(b));
}

/**
 * The single most useful thing to do now: the workout once its hour is close, then a due check-in,
 * then whatever fits the current hour, then anything still open.
 */
export function nextStep(items: PlanItem[], hour: number, trainingTime: string): PlanItem | null {
  const open = items.filter((x) => !x.done);
  const start = open.find((x) => x.id === 'checkin' && x.title.en === 'Starting check-in');
  if (start) return start; // the baseline comes first: everything later is compared to it
  const trainHour = Number((trainingTime || '18:00').split(':')[0]) || 18;
  const main = open.find((x) => x.primary);
  if (main && hour >= trainHour - 2) return main;
  const ck = open.find((x) => x.id === 'checkin');
  if (ck) return ck;
  const now = open.find((x) => !x.primary && hour >= x.from && hour < x.to);
  return now ?? main ?? null;
}
