import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Bar, Disclaimer, go, NumberPrompt, Rings } from '../components/ui';
import { QUOTES, DAILY_TIPS } from '../data/motivation';
import { ROUTINES } from '../data/routines';
import { sessionForDate } from '../plan';
import { sumN } from '../meals';
import { useCheckinDue } from './CheckIn';

const dayIdx = () => Math.floor(Date.now() / 864e5);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? t('goodMorning') : h < 18 ? t('goodAfternoon') : t('goodEvening');
}

interface Wx { temp: number; code: number; wind: number }
const WX_ICON = (c: number) => (c === 0 ? '☀️' : c <= 2 ? '🌤️' : c <= 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 67 ? '🌧️' : c <= 77 ? '❄️' : c <= 82 ? '🌦️' : '⛈️');

function useWeather() {
  const [wx, setWx] = useState<Wx | null>(null);
  useEffect(() => {
    const fetchWx = (lat: number, lon: number) =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=temperature_2m,weather_code,wind_speed_10m`)
        .then((r) => r.json())
        .then((d) => setWx({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code, wind: Math.round(d.current.wind_speed_10m) }))
        .catch(() => {});
    let saved: string | null = null;
    try { saved = localStorage.getItem('nm_geo'); } catch { /* ignore */ }
    if (saved) { const [a, b] = saved.split(',').map(Number); fetchWx(a, b); return; }
    fetchWx(44.43, 26.1); // Bucharest until location is allowed
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        try { localStorage.setItem('nm_geo', `${pos.coords.latitude},${pos.coords.longitude}`); } catch { /* ignore */ }
        fetchWx(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { timeout: 8000, maximumAge: 3600e3 }
    );
  }, []);
  return wx;
}

export function Today() {
  const s = useStore();
  const today = todayStr();
  const d = s.day(today);
  const wx = useWeather();
  const [stepsOpen, setStepsOpen] = useState(false);
  const due = useCheckinDue();
  const session = sessionForDate(s.profile, s.plan, new Date());
  const quote = QUOTES[dayIdx() % QUOTES.length];
  const tip = DAILY_TIPS[(dayIdx() * 3) % DAILY_TIPS.length];
  const eaten = sumN(d.foods.map((f) => ({ ...f, fiber: 0 })));
  const stepGoal = 8000;
  const moveMin = d.workout_minutes + d.moves.length * 5;
  const moveGoal = session ? session.estMinutes : 30;
  const hour = new Date().getHours();
  const snack = useMemo(() => {
    if (hour < 10) return ROUTINES.find((r) => r.id === 'morning')!;
    if (hour < 15) return ROUTINES.find((r) => r.id === (s.profile.activity === 'sedentary' ? 'office' : 'after_meal'))!;
    if (hour < 20) return ROUTINES.find((r) => r.id === (s.profile.birthYear <= new Date().getFullYear() - 60 ? 'chair' : 'office'))!;
    return ROUTINES.find((r) => r.id === 'evening')!;
  }, [hour, s.profile]);

  const wxAdvice = wx
    ? wx.code < 50 && wx.temp >= 5 && wx.temp <= 28
      ? getLang() === 'ro' ? 'Vreme bună pentru o plimbare afară.' : 'Good weather for a walk outside.'
      : getLang() === 'ro' ? 'Rămâi activ în casă: rutină scurtă + scări.' : 'Stay active indoors: short routine + stairs.'
    : '';

  return (
    <div className="page">
      <header className="hdr home-hdr">
        <div>
          <p className="date">{new Date().toLocaleDateString(getLang() === 'ro' ? 'ro-RO' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{greeting()}{s.profile.name ? `, ${s.profile.name}` : ''}</h1>
        </div>
        <button className="avatar" onClick={() => go('#/profile')} aria-label={t('profile')}>{(s.profile.name || s.username)[0]?.toUpperCase()}</button>
      </header>

      {/* Hero rings */}
      <section className="card tile-hero" onClick={() => go('#/progress')}>
        <h3>{t('rings')}</h3>
        <div className="rings-row">
          <Rings values={[
            { pct: moveMin / moveGoal, color: 'var(--coral)' },
            { pct: d.steps / stepGoal, color: 'var(--violet)' },
            { pct: d.water_ml / s.targets.waterMl, color: 'var(--water)' },
          ]} />
          <div className="ring-legend">
            <div><span className="lg c1">{t('move')}</span><b>{moveMin}/{moveGoal}</b> min</div>
            <div><span className="lg c2">{t('steps')}</span><b>{d.steps.toLocaleString()}/{stepGoal.toLocaleString()}</b></div>
            <div><span className="lg c3">{t('water')}</span><b>{(d.water_ml / 1000).toFixed(1)}/{(s.targets.waterMl / 1000).toFixed(1)}</b> L</div>
          </div>
        </div>
      </section>

      <div className="tiles">
        <section className="card tile" onClick={() => setStepsOpen(true)}>
          <h3>{t('steps')}</h3>
          <p className="big c2">{d.steps.toLocaleString()}</p>
          <Bar pct={d.steps / stepGoal} color="var(--violet)" />
          {d.steps_source && d.steps_source !== 'manual'
            ? <p className="small muted">⌚ {t('autoSynced')}{d.resting_hr ? ` · ❤️ ${d.resting_hr} bpm ${t('restingShort')}` : d.hr_avg ? ` · ❤️ ~${d.hr_avg} bpm` : ''}</p>
            : <p className="small muted">{t('logSteps')} · <a href="#/sync" onClick={(e) => e.stopPropagation()}>⌚ {t('autoSetup')}</a></p>}
        </section>
        <section className="card tile">
          <h3>{t('water')}</h3>
          <p className="big c3">{(d.water_ml / 1000).toFixed(2)} L</p>
          <Bar pct={d.water_ml / s.targets.waterMl} color="var(--water)" />
          <div className="row gap-s">
            <button className="btn sm water" onClick={() => s.patchDay(today, { water_ml: d.water_ml + 250 })}>{t('addWater')}</button>
            <button className="btn sm ghost" aria-label="-250 ml" onClick={() => s.patchDay(today, { water_ml: Math.max(0, d.water_ml - 250) })}>−</button>
          </div>
        </section>
        <section className="card tile" onClick={() => go('#/meals')}>
          <h3>{t('kcal')}</h3>
          <p className="big c1">{eaten.kcal}</p>
          <Bar pct={eaten.kcal / s.targets.kcal} color="var(--coral)" />
          <p className="small muted">{t('target')} {s.targets.kcal} · {t('protein')} {eaten.protein}/{s.targets.protein} g</p>
        </section>
        <section className="card tile">
          <h3>{t('weather')}</h3>
          {wx ? (<>
            <p className="big">{WX_ICON(wx.code)} {wx.temp}°</p>
            <p className="small muted">{wxAdvice}</p>
          </>) : <p className="muted">…</p>}
        </section>
      </div>

      {due !== null && (
        <section className="card tile-wide accent-violet" onClick={() => go('#/checkin')}>
          <p className="eyebrow">✨ Check-in</p>
          <h2>{due === 0 ? (getLang() === 'ro' ? 'Evaluarea de start' : 'Starting check-in') : (getLang() === 'ro' ? `Schimbările corpului tău · săptămâna ${due}` : `Your body changes · week ${due}`)}</h2>
          <p className="muted">{getLang() === 'ro' ? '20 de întrebări, 2 minute.' : '20 questions, 2 minutes.'}</p>
        </section>
      )}

      <section className="card tile-wide workout-tile" onClick={() => go('#/train')}>
        <p className="eyebrow">{t('todayWorkout')}</p>
        {session ? (<>
          <h2>{L(session.title)}</h2>
          <p className="muted">{session.exercises.length} {getLang() === 'ro' ? 'exerciții' : 'exercises'} · ~{session.estMinutes} {t('minutes')}</p>
          {d.workout_done ? <p className="ok">✓ {t('workoutDone')}</p> : <button className="btn">{t('start')}</button>}
        </>) : (<>
          <h2>{t('restDay')}</h2>
          <p className="muted">{t('restDayText')}</p>
        </>)}
      </section>

      <section className="card tile-wide" onClick={() => go('#/routine/' + snack.id)}>
        <p className="eyebrow">{t('quickMoves')} · {snack.minutes} {t('minutes')}</p>
        <h2>{snack.icon} {L(snack.title)}</h2>
        <p className="muted">{snack.when && L(snack.when)}</p>
      </section>

      <div className="tiles">
        <section className="card tile">
          <h3>🔥 {s.streak}</h3>
          <p className="muted small">{t('streak')}</p>
        </section>
        <section className="card tile" onClick={() => go('#/calendar')}>
          <h3>📅 {t('calendar')}</h3>
          <p className="muted small">{s.profile.trainingDays.length}× / {getLang() === 'ro' ? 'săptămână' : 'week'}</p>
        </section>
      </div>

      <section className="card tile-wide">
        <p className="eyebrow">{t('suggestion')}</p>
        <p className="lead">{L(tip)}</p>
      </section>

      <section className="card tile-wide quote">
        <p className="eyebrow">{t('quoteOfDay')}</p>
        <blockquote>{getLang() === 'ro' ? `„${quote.ro}”` : `“${quote.en}”`}</blockquote>
        <p className="muted small">— {getLang() === 'en' && quote.byEn ? quote.byEn : quote.by}</p>
      </section>

      <Disclaimer />
      {stepsOpen && <NumberPrompt label={t('logSteps')} initial={d.steps} onClose={() => setStepsOpen(false)} onSave={(n) => s.patchDay(today, { steps: n })} />}
    </div>
  );
}
