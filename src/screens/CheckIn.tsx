import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import { addDays, todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { CHEERS, dueWeek, expectedChanges, groupScores, INTERNAL, QUESTIONS, SCALE, type Group } from '../data/checkin';

interface Checkin { id: number; date: string; week: number; answers: number[] }
let cache: Checkin[] | null = null;
const listeners = new Set<(c: Checkin[]) => void>();
async function loadCheckins(force = false) {
  if (!cache || force) {
    cache = (await api<{ items: Checkin[] }>('/checkins')).items;
    listeners.forEach((l) => l(cache!));
  }
  return cache;
}
function useCheckins() {
  const [c, setC] = useState<Checkin[] | null>(cache);
  useEffect(() => {
    listeners.add(setC);
    loadCheckins().then(setC).catch(() => {});
    return () => { listeners.delete(setC); };
  }, []);
  return c;
}

const weeksSince = (start: string) => Math.floor((Date.now() - new Date(start + 'T00:00:00').getTime()) / (7 * 864e5));

export function useCheckinDue(): number | null {
  const { profile } = useStore();
  const c = useCheckins();
  if (!c) return null;
  return dueWeek(weeksSince(profile.createdAt), c.map((x) => x.week));
}

export function CheckIn() {
  const s = useStore();
  const list = useCheckins();
  const due = useCheckinDue();
  const [ans, setAns] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Checkin | null>(null);
  const ro = getLang() === 'ro';

  if (!list) return <div className="page"><Header title="Check-in" back /></div>;
  const week = due ?? weeksSince(s.profile.createdAt);
  const shown = result ?? (due === null && list.length ? list[list.length - 1] : null);

  if (shown) return <Result c={shown} all={list} />;

  const q = QUESTIONS[i];
  const pick = async (v: number) => {
    const next = [...ans];
    next[i] = v;
    setAns(next);
    if (i < QUESTIONS.length - 1) return setI(i + 1);
    const c = { date: todayStr(), week, answers: next };
    await api('/checkins', { method: 'POST', body: c });
    await loadCheckins(true);
    setResult({ id: 0, ...c });
  };

  return (
    <div className="page">
      <Header title={week === 0 ? (ro ? 'Evaluarea de start' : 'Starting check-in') : (ro ? `Check-in · săptămâna ${week}` : `Check-in · week ${week}`)} back />
      <div className="onb-progress"><div style={{ width: `${((i + 1) / QUESTIONS.length) * 100}%` }} /></div>
      <section className="card q-card">
        <p className="eyebrow">{i + 1} / {QUESTIONS.length}</p>
        <h2>{L(q)}</h2>
        <div className="scale">
          {SCALE[getLang()].map((lab, k) => (
            <button key={k} className={'scale-btn' + (ans[i] === k + 1 ? ' on' : '')} onClick={() => pick(k + 1)}>
              <b>{k + 1}</b><span>{lab}</span>
            </button>
          ))}
        </div>
        {i > 0 && <button className="link" onClick={() => setI(i - 1)}>{t('back')}</button>}
      </section>
      <Disclaimer />
    </div>
  );
}

function Result({ c, all }: { c: Checkin; all: Checkin[] }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const base = all.find((x) => x.week === 0) ?? all[0];
  const now = groupScores(c.answers);
  const before = base && base !== c && base.date !== c.date ? groupScores(base.answers) : null;
  const delta = (g: Group) => (before ? now[g] - before[g] : 0);

  // Objective data since start
  const start = s.profile.createdAt;
  const objective = useMemo(() => {
    let workouts = 0, activeDays = 0, minutes = 0, days = 0;
    for (let d = start; d <= c.date; d = addDays(d, 1)) {
      days++;
      const x = s.days[d];
      if (!x) continue;
      if (x.workout_done) workouts++;
      if (x.workout_done || x.moves.length || x.steps >= 7000) activeDays++;
      minutes += x.workout_minutes + x.moves.length * 5 + (x.steps >= 7000 ? 20 : 0);
    }
    const weeks = Math.max(1, days / 7);
    return { workouts, activeDays, perWeek: Math.round(minutes / weeks), weeks };
  }, [s.days, start, c.date]);

  const ms = s.measurements;
  const first = ms[0], last = ms[ms.length - 1];
  const dWeight = first && last && first !== last && first.weight && last.weight ? Math.round((last.weight - first.weight) * 10) / 10 : null;
  const dWaist = first && last && first !== last && first.waist && last.waist ? Math.round((last.waist - first.waist) * 10) / 10 : null;

  const improved = (Object.keys(now) as Group[]).filter((g) => delta(g) >= 0.4).length;
  const big = c.week > 0 && (improved >= 2 || objective.workouts >= c.week * 2);
  const cheers = big ? CHEERS.big : CHEERS.small;
  const exp = expectedChanges(c.week);
  const strengthDone = objective.workouts >= Math.max(1, c.week) * 2;
  const aerobicDone = objective.perWeek >= 150;
  const internal = c.week === 0 ? [] : INTERNAL.filter((x) => (x.needs === 'any' ? aerobicDone || strengthDone : x.needs === 'aerobic' ? aerobicDone : strengthDone));
  const internalGoals = INTERNAL.filter((x) => !internal.includes(x)).slice(0, c.week === 0 ? 4 : 2);

  const G: { g: Group; ro: string; en: string; icon: string }[] = [
    { g: 'physical', ro: 'Fizic', en: 'Physical', icon: '💪' },
    { g: 'nervous', ro: 'Sistem nervos', en: 'Nervous system', icon: '🧠' },
    { g: 'aesthetic', ro: 'Estetic', en: 'Aesthetic', icon: '✨' },
    { g: 'habits', ro: 'Obiceiuri', en: 'Habits', icon: '🔁' },
  ];

  return (
    <div className="page">
      <Header title={c.week === 0 ? (ro ? 'Punctul de start' : 'Your baseline') : (ro ? `Săptămâna ${c.week}` : `Week ${c.week}`)} back />
      <section className={'card tile-wide ' + (big ? 'accent-coral' : 'accent-violet')}>
        <h2 className="cheer">{c.week === 0 ? (ro ? 'Gata! Ai pus punctul de plecare.' : 'Done! Your starting point is set.') : L(cheers[c.week % cheers.length])}</h2>
        {c.week > 0 && !big && <p>{L(cheers[(c.week + 1) % cheers.length])}</p>}
        <p className="muted small">
          {ro ? `${objective.workouts} antrenamente · ${objective.activeDays} zile active · ~${objective.perWeek} min mișcare/săptămână` : `${objective.workouts} workouts · ${objective.activeDays} active days · ~${objective.perWeek} min activity/week`}
          {dWeight !== null && ` · ${dWeight > 0 ? '+' : ''}${dWeight} kg`}{dWaist !== null && ` · ${dWaist > 0 ? '+' : ''}${dWaist} cm ${ro ? 'talie' : 'waist'}`}
        </p>
      </section>

      <section className="card">
        <h3>{ro ? 'Cum te simți (1–5)' : 'How you feel (1–5)'}</h3>
        {G.map((x) => (
          <div key={x.g} className="score-row">
            <span>{x.icon} {ro ? x.ro : x.en}</span>
            <b>{now[x.g].toFixed(1)}</b>
            {before && <span className={delta(x.g) >= 0 ? 'ok' : 'warn-t'}>{delta(x.g) >= 0 ? '▲' : '▼'} {Math.abs(delta(x.g)).toFixed(1)}</span>}
          </div>
        ))}
      </section>

      {c.week > 0 && (<>
        <ChangeCard n="1" title={ro ? 'La nivel fizic' : 'Physical level'} items={exp.physical} />
        <ChangeCard n="2" title={ro ? 'La nivel nervos' : 'Nervous system'} items={exp.nervous} />
        <ChangeCard n="3" title={ro ? 'La nivel estetic' : 'Aesthetic level'} items={exp.aesthetic} />
      </>)}

      <section className="card">
        <h3>{c.week > 0 ? '4. ' : ''}{ro ? 'La nivel intern: ce câștigi pe termen lung' : 'Internal level: your long-term gains'}</h3>
        <p className="muted small">{ro ? 'Cifre din studii pe sute de mii de oameni: arată riscul mediu al celor care mențin acest nivel de mișcare, nu o garanție personală.' : 'Figures from studies of hundreds of thousands of people: the average risk of those who keep this activity level, not a personal guarantee.'}</p>
        {c.week === 0 ? <p>{ro ? 'Iată ce deblochezi dacă rămâi activ:' : 'Here’s what you unlock if you stay active:'}</p> : internal.length > 0 ? internal.map((x, k) => <p key={k} className="fact">✅ {L(x)} <span className="src">{x.src}</span></p>)
          : <p>{ro ? 'Încă nu ai atins pragurile din studii. Iată ce deblochezi:' : 'You haven’t hit the study thresholds yet. Here’s what you unlock:'}</p>}
        {internalGoals.map((x, k) => <p key={'g' + k} className="fact dim">🎯 {L(x)} <span className="src">{x.src}</span></p>)}
      </section>

      <button className="btn full" onClick={() => go('#/today')}>{t('done')}</button>
      <Disclaimer />
    </div>
  );
}

function ChangeCard({ n, title, items }: { n: string; title: string; items: { ro: string; en: string }[] }) {
  return (
    <section className="card">
      <h3>{n}. {title}</h3>
      {items.map((x, i) => <p key={i} className="fact">• {L(x)}</p>)}
    </section>
  );
}
