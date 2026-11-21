import { useMemo, useState } from 'react';
import { useStore, isActive } from '../store';
import { addDays, bmi, bmr, tdee, todayStr, waistToHeight } from '../calc';
import { api } from '../api';
import { getLang, t, type Key } from '../i18n';
import { Disclaimer, go, Header, Sheet } from '../components/ui';
import { BADGES } from '../data/motivation';

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
      for (let d = sorted[0]; d <= todayStr(); d = addDays(d, 1)) { run = isActive(s.days[d]) ? run + 1 : 0; best = Math.max(best, run); }
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
  }, [s.days, s.measurements, s.targets.waterMl]);
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
      <Header title={t('progress')} back right={<button className="btn sm" onClick={() => setOpen(true)}>+ {t('add')}</button>} />
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
