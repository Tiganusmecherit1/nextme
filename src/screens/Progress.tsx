import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { isActiveDay, stepGoal } from '../activity';
import { addDays, bmi, bmr, tdee, todayStr, waistToHeight } from '../calc';
import { api } from '../api';
import { getLang, t, type Key } from '../i18n';
import { Disclaimer, go, Header, Sheet } from '../components/ui';
import { BADGES } from '../data/motivation';
import { activeMinutes, MOVE_GOAL } from '../activity';
import { Rings } from '../components/ui';
import { exById } from '../data/exercises';
import { useLastSets } from './Workout';
import { L } from '../i18n';

const FIELDS = ['weight', 'waist', 'hip', 'chest', 'arm', 'thigh', 'neck'] as const;

function Chart({ points, color }: { points: { x: string; y: number }[]; color: string }) {
  if (points.length < 2) return <p className="small muted">{getLang() === 'ro' ? 'Adaugă cel puțin 2 măsurători pentru grafic.' : 'Add at least 2 entries to see a chart.'}</p>;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys), max = Math.max(...ys);
  const pad = (max - min) * 0.15 || 1;
  const W = 300, H = 110;
  const px = (i: number) => 8 + (i / (points.length - 1)) * (W - 16);
  const py = (y: number) => H - 10 - ((y - (min - pad)) / (max - min + 2 * pad)) * (H - 20);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(p.y).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="trend">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={px(i)} cy={py(p.y)} r="3.5" fill={color}><title>{p.x}: {p.y}</title></circle>)}
      <text x="8" y="12" className="chart-t">{max}</text>
      <text x="8" y={H - 1} className="chart-t">{min}</text>
    </svg>
  );
}

export function useBadges() {
  const s = useStore();
  return useMemo(() => {
    const days = Object.values(s.days);
    const workouts = days.filter((d) => d.workout_done).length;
    const moves = days.reduce((a, d) => a + (d.moves?.length ?? 0), 0);
    const hydro = days.filter((d) => d.water_ml >= s.targets.waterMl).length;
    let best = 0, run = 0;
    const sorted = Object.keys(s.days).sort();
    if (sorted.length) {
      for (let d = sorted[0]; d <= todayStr(); d = addDays(d, 1)) { run = isActiveDay(s.days[d], stepGoal(s.profile)) ? run + 1 : 0; best = Math.max(best, run); }
    }
    const ws = s.measurements.filter((m) => m.weight);
    const earned = new Set<string>();
    if (workouts >= 1) earned.add('first_workout');
    if (best >= 3) earned.add('streak3');
    if (best >= 7) earned.add('streak7');
    if (best >= 30) earned.add('streak30');
    if (workouts >= 10) earned.add('workouts10');
    if (workouts >= 50) earned.add('workouts50');
    if (hydro >= 7) earned.add('hydro7');
    if (moves >= 10) earned.add('mover10');
    if (s.measurements.length) earned.add('measured');
    if (ws.length >= 2 && ws[0].weight! - ws[ws.length - 1].weight! >= 2) earned.add('minus2');
    if (days.some((d) => d.steps >= 10000)) earned.add('steps10k');
    return earned;
  }, [s.days, s.measurements, s.targets.waterMl, s.profile]);
}

export function Progress() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [field, setField] = useState<(typeof FIELDS)[number]>('weight');
  const earned = useBadges();
  const lang = getLang();
  const lastWaist = [...s.measurements].reverse().find((m) => m.waist)?.waist;
  const ratio = lastWaist ? waistToHeight(lastWaist, s.profile.heightCm) : null;
  const pts = s.measurements.filter((m) => (m as any)[field]).map((m) => ({ x: m.date, y: (m as any)[field] as number }));

  const save = async () => {
    await api('/measurements', { method: 'POST', body: { date: todayStr(), ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v.replace(',', '.'))])) } });
    if (form.weight) await s.saveProfile({ ...s.profile, weightKg: Number(form.weight.replace(',', '.')) });
    setForm({}); setOpen(false);
    await s.reloadMeasurements();
  };

  return (
    <div className="page">
      <Header title={t('progress')} right={<button className="btn sm ghost" onClick={() => setOpen(true)}>📏 {lang === 'ro' ? 'Măsurători' : 'Measure'}</button>} />
      <WeekCard />
      <button className="card list-item accent-violet" onClick={() => go('#/checkin')}>
        <span className="emoji">✨</span>
        <div><b>{lang === 'ro' ? 'Schimbările corpului tău' : 'Your body changes'}</b><p className="small muted">{lang === 'ro' ? 'Check-in la 1, 2, 3 săptămâni, apoi lunar' : 'Check-in at 1, 2, 3 weeks, then monthly'}</p></div>
        <span className="chev">›</span>
      </button>
      <section className="card">
        <h3>{t('measurements')}</h3>
        <div className="chips scroll-x">
          {FIELDS.map((f) => <button key={f} className={'chip' + (field === f ? ' on' : '')} onClick={() => setField(f)}>{t(f as Key).replace(/ \(.*\)/, '')}</button>)}
        </div>
        <Chart points={pts} color="var(--coral)" />
        {ratio && <p className="small">{t('whtr')}: <b>{ratio}</b> · <span className={ratio < 0.5 ? 'ok' : 'warn-t'}>{ratio < 0.5 ? t('whtrOk') : t('whtrHigh')}</span></p>}
        {s.measurements.length > 0 && (
          <ul className="ing">
            {[...s.measurements].reverse().slice(0, 8).map((m) => (
              <li key={m.id}><span>{m.date}</span>
                <span className="small">{FIELDS.filter((f) => (m as any)[f]).map((f) => `${t(f as Key).replace(/ \(.*\)/, '')} ${(m as any)[f]}`).join(' · ')}</span>
                <button className="x" onClick={async () => { await api('/measurements/' + m.id, { method: 'DELETE' }); s.reloadMeasurements(); }}>×</button></li>
            ))}
          </ul>
        )}
      </section>
      <Strength />
      <button className="card list-item" onClick={() => go('#/calendar')}>
        <span className="emoji">📅</span>
        <div><b>{t('calendar')}</b><p className="small muted">{lang === 'ro' ? 'Istoricul pe luni și sincronizare cu Google Calendar' : 'Monthly history and Google Calendar sync'}</p></div>
        <span className="chev">›</span>
      </button>
      <section className="card">
        <h3>{t('myNumbers')}</h3>
        <ul className="facts">
          <li>{t('bmr')}: <b>{bmr(s.profile)} kcal</b></li>
          <li>{t('tdee')}: <b>{tdee(s.profile)} kcal</b></li>
          <li>{t('target')}: <b>{s.targets.kcal} kcal</b> · {t('protein')} {s.targets.protein} g · {t('fiber')} {s.targets.fiber} g</li>
          <li>{t('waterGoal')}: <b>{(s.targets.waterMl / 1000).toFixed(1)} L</b></li>
          <li>{t('bmi')}: <b>{bmi(s.profile)}</b></li>
        </ul>
      </section>
      <section className="card">
        <h3>{t('badges')} · {earned.size}/{BADGES.length}</h3>
        <div className="badges">
          {BADGES.map((b) => (
            <div key={b.id} className={'badge' + (earned.has(b.id) ? ' on' : '')} title={lang === 'ro' ? b.descRo : b.descEn}>
              <span>{b.icon}</span><b>{lang === 'ro' ? b.ro : b.en}</b><small>{lang === 'ro' ? b.descRo : b.descEn}</small>
            </div>
          ))}
        </div>
      </section>
      <Disclaimer />
      {open && (
        <Sheet open onClose={() => setOpen(false)} title={t('measurements')}>
          <div className="grid2">
            {FIELDS.map((f) => (
              <div key={f}><label className="lbl">{t(f as Key)}</label>
                <input className="input" inputMode="decimal" value={form[f] ?? ''} onChange={(e) => setForm({ ...form, [f]: e.target.value.replace(/[^\d.,]/g, '') })} /></div>
            ))}
          </div>
          <p className="small muted">{lang === 'ro' ? 'Măsoară dimineața, pe nemâncate, după toaletă. Talia: la nivelul buricului, la expir normal.' : 'Measure in the morning, before eating. Waist: at navel level, after a normal exhale.'}</p>
          <button className="btn full" onClick={save}>{t('save')}</button>
        </Sheet>
      )}
    </div>
  );
}

/** The last 7 days as mini rings, plus the week's totals. */
function WeekCard() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const goalSteps = stepGoal(s.profile);
  const today = todayStr();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const days = dates.map((d) => s.day(d));
  const active = days.filter((d) => isActiveDay(d, goalSteps)).length;
  const workouts = days.filter((d) => d.workout_done).length;
  const minutes = days.reduce((a, d) => a + activeMinutes(d), 0);
  const logged = days.filter((d) => d.steps > 0);
  const avgSteps = logged.length ? Math.round(logged.reduce((a, d) => a + d.steps, 0) / logged.length) : 0;
  const wd = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(ro ? 'ro-RO' : 'en-GB', { weekday: 'narrow' });
  return (
    <section className="card">
      <h3>{ro ? 'Ultimele 7 zile' : 'Last 7 days'}</h3>
      <div className="week-rings">
        {days.map((d, i) => (
          <div key={dates[i]} className={'wr' + (dates[i] === today ? ' today' : '')}>
            <Rings size={40} values={[
              { pct: activeMinutes(d) / MOVE_GOAL, color: 'var(--coral)' },
              { pct: d.steps / goalSteps, color: 'var(--violet)' },
              { pct: d.water_ml / s.targets.waterMl, color: 'var(--water)' },
            ]} />
            <span>{wd(dates[i])}</span>
          </div>
        ))}
      </div>
      <div className="pr-row four">
        <div><span className="small muted">{ro ? 'Zile active' : 'Active days'}</span><b>{active}/7</b></div>
        <div><span className="small muted">{ro ? 'Antrenamente' : 'Workouts'}</span><b>{workouts}</b></div>
        <div><span className="small muted">{ro ? 'Minute' : 'Minutes'}</span><b>{minutes}</b></div>
        <div><span className="small muted">{ro ? 'Pași/zi' : 'Steps/day'}</span><b>{avgSteps ? avgSteps.toLocaleString() : '—'}</b></div>
      </div>
      <p className="small muted">{ro ? `OMS: 150–300 min de mișcare moderată pe săptămână. Tu: ${minutes} min.` : `WHO: 150–300 min of moderate activity a week. You: ${minutes} min.`}</p>
    </section>
  );
}

/** Where your strength is now: heaviest set of the last session, per exercise, most recent first. */
function Strength() {
  const last = useLastSets();
  const ro = getLang() === 'ro';
  const rows = Object.entries(last ?? {})
    .map(([id, v]) => ({ id, date: v.date, kg: v.sets.reduce((m, x) => Math.max(m, x.kg ?? 0), 0), reps: v.sets.reduce((m, x) => Math.max(m, x.reps), 0) }))
    .filter((r) => exById(r.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  if (!rows.length) return null;
  return (
    <section className="card">
      <h3>💪 {ro ? 'Forța ta acum' : 'Your strength now'}</h3>
      <ul className="ing">
        {rows.map((r) => (
          <li key={r.id} onClick={() => go('#/exercise/' + r.id)} className="tap">
            <span>{L(exById(r.id)!.name)}</span><b>{r.kg ? `${r.kg} kg` : `${r.reps} ${ro ? 'rep.' : 'reps'}`}</b>
          </li>
        ))}
      </ul>
      <p className="small muted">{ro ? 'Apasă pe un exercițiu pentru istoric și recorduri.' : 'Tap an exercise for its history and records.'}</p>
    </section>
  );
}
