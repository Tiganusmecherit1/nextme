import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L } from '../i18n';
import { Disclaimer, Header } from '../components/ui';
import { DoneCard } from '../components/DoneCard';
import { withMove } from '../activity';
import { Figure } from '../components/Figure';
import { EXERCISES } from '../data/exercises';
import { beep, keepAwake, unlockAudio } from '../beep';

interface Cfg { work: number; rest: number; rounds: number; prep: number; exIds: string[] }
const DEFAULT: Cfg = { work: 30, rest: 20, rounds: 8, prep: 10, exIds: [] };
const PRESETS: { label: string; work: number; rest: number; rounds: number }[] = [
  { label: 'Tabata 20/10 × 8', work: 20, rest: 10, rounds: 8 },
  { label: '30/20 × 8', work: 30, rest: 20, rounds: 8 },
  { label: '30/30 × 6', work: 30, rest: 30, rounds: 6 },
  { label: '40/20 × 6', work: 40, rest: 20, rounds: 6 },
  { label: '45/15 × 5', work: 45, rest: 15, rounds: 5 },
];
// Exercises that suit a timed interval: planks, holds, bodyweight core.
const TIMED = EXERCISES.filter((e) => e.slot === 'core' && e.equip.every((q) => q === 'none') || ['wall_sit', 'glute_bridge', 'bw_squat', 'single_leg_stand'].includes(e.id));
const KEY = 'nm_timer_cfg';
const load = (): Cfg => { try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULT; } };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

type Phase = 'prep' | 'work' | 'rest' | 'done';

export function IntervalTimer() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const [cfg, setCfg] = useState<Cfg>(load);
  const [run, setRun] = useState<null | { phase: Phase; round: number; endsAt: number; pausedLeft: number | null }>(null);
  const [now, setNow] = useState(Date.now());
  const release = useRef<() => void>(() => {});
  const lastBeep = useRef<number>(-1);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* ignore */ } }, [cfg]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 100); return () => { clearInterval(t); release.current(); }; }, []);

  const left = run ? (run.pausedLeft ?? Math.ceil((run.endsAt - now) / 1000)) : 0;

  // phase transitions + countdown beeps
  useEffect(() => {
    if (!run || run.pausedLeft !== null || run.phase === 'done') return;
    if (left <= 3 && left >= 1 && lastBeep.current !== left) { lastBeep.current = left; beep('tick'); }
    if (left > 0) return;
    lastBeep.current = -1;
    const t = Date.now();
    if (run.phase === 'prep' || run.phase === 'rest') {
      beep('go');
      setRun({ phase: 'work', round: run.phase === 'prep' ? 1 : run.round + 1, endsAt: t + cfg.work * 1000, pausedLeft: null });
    } else if (run.phase === 'work') {
      if (run.round >= cfg.rounds) {
        beep('end');
        setRun({ ...run, phase: 'done' });
        release.current();
        const d = s.day(todayStr());
        s.patchDay(todayStr(), { moves: withMove(d, 'interval', (cfg.rounds * (cfg.work + cfg.rest) + cfg.prep) / 60) });
      } else if (cfg.rest > 0) {
        beep('rest');
        setRun({ phase: 'rest', round: run.round, endsAt: t + cfg.rest * 1000, pausedLeft: null });
      } else {
        beep('go');
        setRun({ phase: 'work', round: run.round + 1, endsAt: t + cfg.work * 1000, pausedLeft: null });
      }
    }
  }, [left, run, cfg, s]);

  const start = async () => {
    unlockAudio();
    release.current = await keepAwake();
    lastBeep.current = -1;
    setRun({ phase: 'prep', round: 0, endsAt: Date.now() + cfg.prep * 1000, pausedLeft: null });
  };
  const pause = () => run && setRun(run.pausedLeft === null ? { ...run, pausedLeft: Math.max(0, left) } : { ...run, endsAt: Date.now() + run.pausedLeft * 1000, pausedLeft: null });
  const stop = () => { release.current(); setRun(null); };
  const exFor = (round: number) => (cfg.exIds.length ? EXERCISES.find((e) => e.id === cfg.exIds[(Math.max(1, round) - 1) % cfg.exIds.length]) : undefined);
  const total = cfg.prep + cfg.rounds * cfg.work + (cfg.rounds - 1) * cfg.rest;

  if (run) {
    const ex = run.phase === 'rest' ? exFor(run.round + 1) : exFor(run.round || 1);
    const phaseLabel = { prep: ro ? 'Pregătește-te' : 'Get ready', work: ro ? 'LUCRU' : 'WORK', rest: ro ? 'PAUZĂ' : 'REST', done: ro ? 'Gata!' : 'Done!' }[run.phase];
    const dur = run.phase === 'work' ? cfg.work : run.phase === 'rest' ? cfg.rest : cfg.prep;
    const pct = run.phase === 'done' ? 1 : 1 - Math.max(0, left) / Math.max(1, dur);
    return (
      <div className={'page timer-run ph-' + run.phase}>
        <Header title={ro ? 'Cronometru interval' : 'Interval timer'} />
        <div className="timer-face">
          <svg viewBox="0 0 200 200" className="timer-ring" aria-hidden="true">
            <circle cx="100" cy="100" r="90" className="trk" />
            <circle cx="100" cy="100" r="90" className="val" style={{ strokeDasharray: 565.5, strokeDashoffset: 565.5 * (1 - pct) }} />
          </svg>
          <div className="timer-center">
            <p className="timer-phase">{phaseLabel}</p>
            <p className="timer-left">{run.phase === 'done' ? '✓' : fmt(Math.max(0, left))}</p>
            {run.phase !== 'done' && <p className="small">{ro ? 'Runda' : 'Round'} {Math.max(1, run.phase === 'rest' ? run.round + 1 : run.round || 1)} / {cfg.rounds}</p>}
          </div>
        </div>
        {ex && run.phase !== 'done' && (
          <section className="card timer-ex">
            <Figure id={ex.id} anim={ex.anim} size={90} playing={run.phase === 'work'} />
            <div><p className="small muted">{run.phase === 'work' ? (ro ? 'Acum' : 'Now') : (ro ? 'Urmează' : 'Next')}</p><b>{L(ex.name)}</b></div>
          </section>
        )}
        {run.phase === 'done' ? (
          <DoneCard title={ro ? 'Bravo! 💪' : 'Well done! 💪'} stats={ro ? `${cfg.rounds} runde × ${cfg.work} s` : `${cfg.rounds} rounds × ${cfg.work} s`} />
        ) : (
          <div className="row gap">
            <button className="btn ghost" onClick={stop}>■ Stop</button>
            <button className="btn" onClick={pause}>{run.pausedLeft === null ? (ro ? '❚❚ Pauză' : '❚❚ Pause') : (ro ? '▶ Continuă' : '▶ Resume')}</button>
          </div>
        )}
      </div>
    );
  }

  const num = (k: 'work' | 'rest' | 'rounds' | 'prep', step: number, min: number, max: number, label: string, unit: string) => (
    <div className="stepper">
      <span className="small muted">{label}</span>
      <div className="row">
        <button className="btn ghost sm" onClick={() => setCfg({ ...cfg, [k]: Math.max(min, cfg[k] - step) })}>−</button>
        <span className="num-val">{cfg[k]}{unit}</span>
        <button className="btn ghost sm" onClick={() => setCfg({ ...cfg, [k]: Math.min(max, cfg[k] + step) })}>+</button>
      </div>
    </div>
  );
  const toggleEx = (id: string) => setCfg({ ...cfg, exIds: cfg.exIds.includes(id) ? cfg.exIds.filter((x) => x !== id) : [...cfg.exIds, id] });

  return (
    <div className="page">
      <Header title={ro ? 'Cronometru interval' : 'Interval timer'} back />
      <section className="card">
        <p className="small muted">{ro ? 'Pentru planșe, Tabata sau orice exercițiu pe timp. Sună și vibrează la 3-2-1 și la schimbarea fazei; ecranul rămâne aprins.' : 'For planks, Tabata or any timed exercise. Beeps and vibrates at 3-2-1 and on each phase change; the screen stays on.'}</p>
        <div className="chips scroll-x">
          {PRESETS.map((p) => <button key={p.label} className={'chip' + (p.work === cfg.work && p.rest === cfg.rest && p.rounds === cfg.rounds ? ' on' : '')}
            onClick={() => setCfg({ ...cfg, work: p.work, rest: p.rest, rounds: p.rounds })}>{p.label}</button>)}
        </div>
        <div className="steppers timer-steppers">
          {num('work', 5, 5, 600, ro ? 'Lucru' : 'Work', ' s')}
          {num('rest', 5, 0, 600, ro ? 'Pauză' : 'Rest', ' s')}
          {num('rounds', 1, 1, 50, ro ? 'Runde' : 'Rounds', '')}
          {num('prep', 5, 0, 60, ro ? 'Pregătire' : 'Get ready', ' s')}
        </div>
        <p className="small muted center">{ro ? 'Durată totală' : 'Total time'}: {fmt(total)}</p>
        <button className="btn full" onClick={start}>▶ {ro ? 'Pornește' : 'Start'}</button>
      </section>
      <section className="card">
        <h3>{ro ? 'Exerciții pe runde (opțional)' : 'Exercises per round (optional)'}</h3>
        <p className="small muted">{ro ? 'Alege unul sau mai multe; se schimbă în ordine la fiecare rundă.' : 'Pick one or more; they rotate in order each round.'}</p>
        <div className="chips wrap">
          {TIMED.map((e) => {
            const i = cfg.exIds.indexOf(e.id);
            return <button key={e.id} className={'chip' + (i >= 0 ? ' on' : '')} onClick={() => toggleEx(e.id)}>{i >= 0 ? `${i + 1}. ` : ''}{L(e.name)}</button>;
          })}
        </div>
      </section>
      <Disclaimer />
    </div>
  );
}
