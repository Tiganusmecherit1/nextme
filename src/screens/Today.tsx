import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Bar, Disclaimer, go, NumberPrompt, Rings } from '../components/ui';
import { QUOTES, DAILY_TIPS } from '../data/motivation';
import { activeMinutes, MOVE_GOAL, stepGoal } from '../activity';
import { buildDayPlan, nextStep } from '../dayplan';
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
  const ro = getLang() === 'ro';
  const today = todayStr();
  const d = s.day(today);
  const wx = useWeather();
  const [stepsOpen, setStepsOpen] = useState(false);
  const due = useCheckinDue();
  const session = sessionForDate(s.profile, s.plan, new Date());
  const quote = QUOTES[dayIdx() % QUOTES.length];
  const tip = DAILY_TIPS[(dayIdx() * 3) % DAILY_TIPS.length];
  const eaten = sumN(d.foods.map((f) => ({ ...f, fiber: 0 })));
  const goalSteps = stepGoal(s.profile);
  const moveMin = activeMinutes(d);
  const hour = new Date().getHours();
  const plan = buildDayPlan(s.profile, d, session, due);
  const next = nextStep(plan, hour, s.profile.trainingTime);
  const synced = d.steps_source && d.steps_source !== 'manual';
  const needsHealth = !!s.profile.asked && !s.profile.asked.includes('health');

  const wxAdvice = wx
    ? wx.code < 50 && wx.temp >= 5 && wx.temp <= 28
      ? ro ? 'vreme bună pentru plimbarea de azi' : 'good weather for today’s walk'
      : ro ? 'mai bine mișcare în casă azi' : 'better to move indoors today'
    : '';

  return (
    <div className="page">
      <header className="hdr home-hdr">
        <div>
          <p className="date">{new Date().toLocaleDateString(ro ? 'ro-RO' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{greeting()}{s.profile.name ? `, ${s.profile.name}` : ''}</h1>
        </div>
        <button className="avatar" onClick={() => go('#/profile')} aria-label={t('profile')}>{(s.profile.name || s.username)[0]?.toUpperCase()}</button>
      </header>

      {/* Rings: the three daily goals, with their quick actions right below */}
      <section className="card tile-hero">
        <button className="rings-row" onClick={() => go('#/progress')} aria-label={t('progress')}>
          <Rings values={[
            { pct: moveMin / MOVE_GOAL, color: 'var(--coral)' },
            { pct: d.steps / goalSteps, color: 'var(--violet)' },
            { pct: d.water_ml / s.targets.waterMl, color: 'var(--water)' },
          ]} />
          <div className="ring-legend">
            <div><span className="lg c1">{t('move')}</span><b>{moveMin}/{MOVE_GOAL}</b> min</div>
            <div><span className="lg c2">{t('steps')}</span><b>{d.steps.toLocaleString()}/{goalSteps.toLocaleString()}</b></div>
            <div><span className="lg c3">{t('water')}</span><b>{(d.water_ml / 1000).toFixed(1)}/{(s.targets.waterMl / 1000).toFixed(1)}</b> L</div>
          </div>
        </button>
        <div className="ring-actions">
          <button className="btn sm water" onClick={() => s.patchDay(today, { water_ml: d.water_ml + 250 })}>💧 {t('addWater')}</button>
          <button className="btn sm ghost" aria-label="-250 ml" onClick={() => s.patchDay(today, { water_ml: Math.max(0, d.water_ml - 250) })}>−</button>
          {synced
            ? <span className="small muted sync-note">⌚ {t('autoSynced')}{d.resting_hr ? ` · ❤️ ${d.resting_hr}` : ''}</span>
            : <button className="btn sm ghost" onClick={() => setStepsOpen(true)}>👟 {ro ? 'Pași' : 'Steps'}</button>}
        </div>
      </section>

      {/* One clear next step */}
      {next ? (
        <section className={'card tile-wide next-step ' + (next.primary ? 'workout-tile' : next.id === 'checkin' ? 'accent-violet' : 'accent-coral')} onClick={() => go(next.href)}>
          <p className="eyebrow">{ro ? 'Următorul pas' : 'Next up'} · {L(next.when)}</p>
          <h2>{next.icon} {L(next.title)}</h2>
          <p className="muted">{L(next.sub)}</p>
          <button className="btn" onClick={(e) => { e.stopPropagation(); go(next.href); }}>▶ {t('start')}</button>
        </section>
      ) : (
        <section className="card tile-wide accent-coral">
          <p className="eyebrow">{ro ? 'Ziua de azi' : 'Today'}</p>
          <h2>🎉 {ro ? 'Ai bifat tot planul de azi' : 'You’ve done today’s plan'}</h2>
          <p className="muted">{ro ? 'Mai rămâne apa și somnul. Pe mâine!' : 'Just water and sleep left. See you tomorrow!'}</p>
        </section>
      )}

      {needsHealth && (
        <section className="card list-item warn-soft" onClick={() => go('#/profile/health')}>
          <span className="emoji">🩹</span>
          <div><b>{ro ? 'Ai vreo accidentare sau afecțiune?' : 'Any injury or health condition?'}</b>
            <p className="small muted">{ro ? '30 de secunde, ca să-ți adaptez exercițiile înainte de primul antrenament.' : '30 seconds, so I can adapt your exercises before your first workout.'}</p></div>
          <span className="chev">›</span>
        </section>
      )}

      {/* The day in order */}
      <section className="card day-plan">
        <h3>{ro ? 'Planul zilei' : 'Today’s plan'}</h3>
        {plan.map((x) => (
          <button key={x.id} className={'plan-row' + (x.done ? ' done' : '') + (next?.id === x.id ? ' now' : '')} onClick={() => go(x.href)}>
            <span className="plan-check">{x.done ? '✓' : x.icon}</span>
            <div><p className="small muted">{L(x.when)}</p><b>{L(x.title)}</b></div>
            <span className="chev">›</span>
          </button>
        ))}
      </section>

      <div className="tiles">
        <section className="card tile small-tile" onClick={() => go('#/meals')}>
          <h3>🍽 {t('kcal')}</h3>
          <p className="big c1">{eaten.kcal}<span className="unit">/{s.targets.kcal}</span></p>
          <Bar pct={eaten.kcal / s.targets.kcal} color="var(--coral)" />
          <p className="small muted">{t('protein')} {eaten.protein}/{s.targets.protein} g</p>
        </section>
        <section className="card tile small-tile" onClick={() => go('#/progress')}>
          <h3>🔥 {ro ? 'Serie' : 'Streak'}</h3>
          <p className="big">{s.streak}</p>
          <p className="small muted">{t('streak')}</p>
        </section>
      </div>

      <section className="card tile-wide day-notes">
        {wx && <p className="small"><b>{WX_ICON(wx.code)} {wx.temp}°</b> · {wxAdvice}</p>}
        <p className="eyebrow">{t('suggestion')}</p>
        <p>{L(tip)}</p>
        <p className="small muted quote-line">{ro ? `„${quote.ro}”` : `“${quote.en}”`} — {!ro && quote.byEn ? quote.byEn : quote.by}</p>
      </section>

      <Disclaimer />
      {stepsOpen && <NumberPrompt label={t('logSteps')} initial={d.steps} onClose={() => setStepsOpen(false)} onSave={(n) => s.patchDay(today, { steps: n })} />}
    </div>
  );
}
