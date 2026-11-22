import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L } from '../i18n';
import { Disclaimer, go, Header, Sheet } from '../components/ui';
import { Figure } from '../components/Figure';
import { EXERCISES, type Exercise } from '../data/exercises';
import { alternatives, suggest, type Prescribed } from '../plan';
import { api } from '../api';
import { beep, keepAwake, unlockAudio } from '../beep';

/* ---------- last logged sets per exercise (shared cache) ---------- */
type LastSets = Record<string, { date: string; sets: { kg: number | null; reps: number }[] }>;
let lastCache: LastSets | null = null;
export async function loadLastSets(force = false): Promise<LastSets> {
  if (!lastCache || force) lastCache = (await api<{ byEx: LastSets }>('/sets/last')).byEx;
  return lastCache;
}
export function useLastSets() {
  const [v, setV] = useState<LastSets | null>(lastCache);
  useEffect(() => { loadLastSets().then(setV).catch(() => setV({})); }, []);
  return v;
}

interface Logged { kg: number | null; reps: number }
interface Saved { ids: string[]; logs: Logged[][]; exIdx: number; startedAt: number }
const timed = (rx: { reps: string }) => /s$/.test(rx.reps);
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

export function WorkoutPlayer({ sessKey }: { sessKey: string }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const date = todayStr();
  const sess = s.plan.find((x) => x.key === sessKey);
  const storeKey = `nm_workout_${date}_${sessKey}`;
  const last = useLastSets();

  const restore = (): Saved | null => { try { return JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch { return null; } };
  const [list, setList] = useState<Prescribed[]>(() => {
    const r = restore();
    if (!sess) return [];
    if (!r) return sess.exercises;
    return sess.exercises.map((p, i) => { const e = EXERCISES.find((x) => x.id === r.ids[i]); return e ? { ...p, ex: e } : p; });
  });
  const [logs, setLogs] = useState<Logged[][]>(() => restore()?.logs ?? (sess?.exercises.map(() => []) ?? []));
  const [exIdx, setExIdx] = useState<number>(() => restore()?.exIdx ?? -1); // -1 = warm-up
  const [startedAt] = useState<number>(() => restore()?.startedAt ?? Date.now());
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [swapOpen, setSwapOpen] = useState(false);
  const [finished, setFinished] = useState<null | { minutes: number; sets: number; volume: number }>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (finished) return;
    try { localStorage.setItem(storeKey, JSON.stringify({ ids: list.map((p) => p.ex.id), logs, exIdx, startedAt } satisfies Saved)); } catch { /* ignore */ }
  }, [list, logs, exIdx, startedAt, finished, storeKey]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const restLeft = restEnd ? Math.ceil((restEnd - now) / 1000) : 0;
  const restBeep = useRef(-1);
  useEffect(() => {
    if (!restEnd) return;
    if (restLeft <= 3 && restLeft >= 1 && restBeep.current !== restLeft) { restBeep.current = restLeft; beep('tick'); }
    if (restLeft <= 0) { restBeep.current = -1; setRestEnd(null); beep('go'); }
  }, [restLeft, restEnd]);
  useEffect(() => { let rel = () => {}; keepAwake().then((r) => { rel = r; }); return () => rel(); }, []);

  if (!sess) return <div className="page"><Header title="—" back /><p className="muted">{ro ? 'Antrenamentul nu mai există în plan.' : 'This workout is no longer in your plan.'}</p></div>;

  const finish = async () => {
    setSaving(true);
    const sets = list.flatMap((p, i) => (logs[i] || []).map((l, k) => ({ ex: p.ex.id, set: k + 1, kg: l.kg, reps: l.reps })));
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    try {
      if (sets.length) await api('/workouts', { method: 'POST', body: { date, session_key: sessKey, minutes, sets } });
      else await s.patchDay(date, { workout_done: 1, workout_minutes: minutes });
      await loadLastSets(true);
      s.patchDay(date, { workout_done: 1, workout_minutes: Math.max(minutes, s.day(date).workout_minutes) });
      try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
      setFinished({ minutes, sets: sets.length, volume: Math.round(sets.reduce((a, x) => a + (x.kg ?? 0) * x.reps, 0)) });
    } catch {
      alert(ro ? 'Nu s-a putut salva. Verifică internetul și încearcă din nou.' : 'Could not save. Check your connection and try again.');
    } finally { setSaving(false); }
  };

  if (finished) {
    return (
      <div className="page">
        <Header title={ro ? 'Gata!' : 'Done!'} />
        <section className="card tile-wide accent-coral">
          <h2 className="cheer">{ro ? 'Antrenament terminat 💪' : 'Workout complete 💪'}</h2>
          <p>{finished.minutes} min · {finished.sets} {ro ? 'serii' : 'sets'}{finished.volume ? ` · ${finished.volume.toLocaleString()} kg ${ro ? 'ridicate în total' : 'lifted in total'}` : ''}</p>
          <p className="small muted">{ro ? 'Data viitoare îți propun greutățile pe baza a ce ai făcut azi.' : 'Next time I’ll suggest weights based on what you did today.'}</p>
        </section>
        <button className="btn full" onClick={() => go('#/today')}>{ro ? 'Înapoi la Azi' : 'Back to Today'}</button>
        <Disclaimer />
      </div>
    );
  }

  const total = list.length;
  const progressPct = exIdx < 0 ? 0 : Math.min(100, ((exIdx + (logs[exIdx]?.length ?? 0) / Math.max(1, list[exIdx]?.sets ?? 1)) / total) * 100);

  if (exIdx < 0) {
    return (
      <div className="page">
        <Header title={L(sess.title)} back />
        <div className="onb-progress"><div style={{ width: '0%' }} /></div>
        <section className="card">
          <p className="eyebrow">🔥 {ro ? 'Încălzire' : 'Warm-up'} · {sess.warmupMin} min</p>
          <h2>{ro ? 'Pregătește corpul' : 'Get your body ready'}</h2>
          <p className="small muted">{ro
            ? `${sess.warmupMin} minute de mers alert, bicicletă sau mișcări ușoare de articulații, apoi 1–2 serii ușoare la primul exercițiu.`
            : `${sess.warmupMin} minutes of brisk walking, bike or easy joint circles, then 1–2 light sets of the first exercise.`}</p>
          <ol className="steps-list">{list.map((p, i) => <li key={i}>{L(p.ex.name)} <span className="muted small">· {p.sets} × {p.reps}</span></li>)}</ol>
        </section>
        <button className="btn full" onClick={() => setExIdx(0)}>▶ {ro ? 'Începe' : 'Start'}</button>
        <Disclaimer />
      </div>
    );
  }

  const p = list[exIdx];
  const done = logs[exIdx] ?? [];
  const setNo = done.length + 1;
  const allSetsDone = done.length >= p.sets;
  const lastSets = last?.[p.ex.id]?.sets;
  const sug = suggest(s.profile, p.ex, p, lastSets);

  const logSet = (l: Logged) => {
    unlockAudio();
    const next = logs.map((x, i) => (i === exIdx ? [...x, l] : x));
    setLogs(next);
    if ((next[exIdx]?.length ?? 0) < p.sets) setRestEnd(Date.now() + p.restSec * 1000);
    else if (exIdx < total - 1) setRestEnd(Date.now() + Math.min(p.restSec, 90) * 1000);
  };
  const goNext = () => { setRestEnd(null); if (exIdx < total - 1) setExIdx(exIdx + 1); };
  const swapTo = async (e: Exercise, permanent: boolean) => {
    setList(list.map((x, i) => (i === exIdx ? { ...x, ex: e } : x)));
    setLogs(logs.map((x, i) => (i === exIdx ? [] : x)));
    setSwapOpen(false);
    if (permanent) {
      const orig = sess.exercises[exIdx]?.ex.id ?? p.ex.id;
      await s.saveProfile({ ...s.profile, swaps: { ...(s.profile.swaps || {}), [orig]: e.id } });
    }
  };

  return (
    <div className="page workout">
      <Header title={L(sess.title)} back />
      <div className="onb-progress"><div style={{ width: `${progressPct}%` }} /></div>
      <p className="small muted center">{ro ? 'Exercițiul' : 'Exercise'} {exIdx + 1} / {total}</p>

      <section className="card figure-card">
        <Figure id={p.ex.id} anim={p.ex.anim} size={200} />
      </section>
      <section className="card">
        <h2>{L(p.ex.name)}</h2>
        <p className="eyebrow">{L(p.ex.muscles)}</p>
        <details className="cues-box"><summary className="small">{ro ? 'Cum se face' : 'How to'}</summary>
          <ol className="cues">{L(p.ex.cues).map((c, i) => <li key={i}>{c}</li>)}</ol>
        </details>
        <p className="target"><b>{p.sets} × {p.reps}</b> · {ro ? 'pauză' : 'rest'} {p.restSec}s</p>
        {lastSets && <p className="small muted">{ro ? 'Data trecută' : 'Last time'}: {lastSets.map((x) => (x.kg ? `${x.kg}×${x.reps}` : `${x.reps}`)).join(' · ')}</p>}
        {sug.note && <p className="small tip">📈 {L(sug.note)}</p>}
        <div className="set-list">
          {done.map((l, i) => <span key={i} className="chip on">✓ {ro ? 'Seria' : 'Set'} {i + 1}: {l.kg ? `${l.kg} kg × ` : ''}{l.reps}{timed(p) ? ' s' : ''}</span>)}
        </div>
      </section>

      {restEnd ? (
        <section className="card rest-card">
          <p className="eyebrow">{ro ? 'Pauză' : 'Rest'}</p>
          <p className="rest-time">{fmt(restLeft)}</p>
          <div className="row gap">
            <button className="btn ghost" onClick={() => setRestEnd(Math.max(Date.now() + 1000, (restEnd ?? Date.now()) - 15000))}>−15 s</button>
            <button className="btn ghost" onClick={() => setRestEnd((restEnd ?? Date.now()) + 15000)}>+15 s</button>
            <button className="btn" onClick={() => (allSetsDone ? goNext() : setRestEnd(null))}>{allSetsDone ? (ro ? 'Exercițiul următor' : 'Next exercise') : (ro ? 'Sari peste pauză' : 'Skip rest')}</button>
          </div>
        </section>
      ) : allSetsDone ? (
        exIdx < total - 1
          ? <button className="btn full" onClick={goNext}>{ro ? 'Exercițiul următor' : 'Next exercise'} → {L(list[exIdx + 1].ex.name)}</button>
          : <button className="btn full" disabled={saving} onClick={finish}>🏁 {ro ? 'Termină și salvează' : 'Finish and save'}</button>
      ) : (
        <SetInput key={`${exIdx}-${setNo}-${p.ex.id}`} setNo={setNo} sets={p.sets} isTimed={timed(p)}
          weighted={!p.ex.equip.every((q) => q === 'none' || q === 'band')}
          initKg={done[done.length - 1]?.kg ?? sug.kg} initReps={done[done.length - 1]?.reps ?? sug.reps} onLog={logSet} />
      )}

      <div className="row gap">
        <button className="btn ghost sm" onClick={() => setSwapOpen(true)}>⇄ {ro ? 'Înlocuiește' : 'Swap'}</button>
        {!allSetsDone && <button className="btn ghost sm" onClick={() => (exIdx < total - 1 ? goNext() : finish())}>{ro ? 'Sari peste' : 'Skip'}</button>}
        {exIdx > 0 && <button className="btn ghost sm" onClick={() => { setRestEnd(null); setExIdx(exIdx - 1); }}>← {ro ? 'Înapoi' : 'Back'}</button>}
      </div>
      {exIdx === total - 1 && !allSetsDone && done.length > 0 && <button className="link" onClick={finish}>{ro ? 'Termină acum și salvează' : 'Finish now and save'}</button>}
      <p className="small muted">{ro ? 'Oprește-te la durere ascuțită, amețeală sau durere în piept.' : 'Stop with sharp pain, dizziness or chest pain.'}</p>
      {swapOpen && <SwapSheet current={p.ex} onClose={() => setSwapOpen(false)} onPick={swapTo} />}
    </div>
  );
}

function SetInput({ setNo, sets, isTimed, weighted, initKg, initReps, onLog }: {
  setNo: number; sets: number; isTimed: boolean; weighted: boolean; initKg: number | null; initReps: number; onLog: (l: Logged) => void;
}) {
  const ro = getLang() === 'ro';
  const [kg, setKg] = useState<string>(initKg != null ? String(initKg) : '');
  const [reps, setReps] = useState<number>(initReps);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => { if (!timerStart) return; const t = setInterval(() => tick((x) => x + 1), 200); return () => clearInterval(t); }, [timerStart]);
  const elapsed = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;
  const remaining = reps - elapsed;
  const tb = useRef(-1);
  useEffect(() => {
    if (!timerStart) return;
    if (remaining <= 3 && remaining >= 1 && tb.current !== remaining) { tb.current = remaining; beep('tick'); }
    if (remaining <= 0) { beep('end'); setTimerStart(null); onLog({ kg: null, reps }); }
  });
  const step = (d: number) => setReps(Math.max(0, reps + d));
  const kgStep = (d: number) => setKg(String(Math.max(0, Math.round(((parseFloat(kg.replace(',', '.')) || 0) + d) * 4) / 4)));

  return (
    <section className="card set-card">
      <p className="eyebrow">{ro ? 'Seria' : 'Set'} {setNo} / {sets}</p>
      {isTimed ? (
        <>
          <p className="rest-time">{fmt(timerStart ? Math.max(0, remaining) : reps)}</p>
          {timerStart
            ? <button className="btn full ghost" onClick={() => { setTimerStart(null); onLog({ kg: null, reps: Math.max(1, elapsed) }); }}>■ {ro ? `M-am oprit la ${elapsed} s` : `Stopped at ${elapsed} s`}</button>
            : <>
                <div className="row gap center-row">
                  <button className="btn ghost sm" onClick={() => setReps(Math.max(5, reps - 5))}>−5 s</button>
                  <button className="btn ghost sm" onClick={() => setReps(reps + 5)}>+5 s</button>
                </div>
                <div className="row gap">
                  <button className="btn" onClick={() => { unlockAudio(); setTimerStart(Date.now()); }}>▶ {ro ? `Pornește ${reps} s` : `Start ${reps} s`}</button>
                </div>
                <button className="link" onClick={() => onLog({ kg: null, reps })}>{ro ? `Am ținut deja ${reps} s` : `Already held ${reps} s`}</button>
              </>}
        </>
      ) : (
        <>
          <div className="steppers">
            {weighted && (
              <div className="stepper">
                <span className="small muted">kg</span>
                <div className="row"><button className="btn ghost sm" onClick={() => kgStep(-2.5)}>−</button>
                  <input className="input num" inputMode="decimal" value={kg} placeholder="0" onChange={(e) => setKg(e.target.value)} />
                  <button className="btn ghost sm" onClick={() => kgStep(2.5)}>+</button></div>
              </div>
            )}
            <div className="stepper">
              <span className="small muted">{ro ? 'repetări' : 'reps'}</span>
              <div className="row"><button className="btn ghost sm" onClick={() => step(-1)}>−</button>
                <input className="input num" inputMode="numeric" value={reps} onChange={(e) => setReps(Math.max(0, parseInt(e.target.value) || 0))} />
                <button className="btn ghost sm" onClick={() => step(1)}>+</button></div>
            </div>
          </div>
          <button className="btn full" disabled={reps <= 0} onClick={() => onLog({ kg: weighted && kg ? parseFloat(kg.replace(',', '.')) || null : null, reps })}>✓ {ro ? 'Serie făcută' : 'Set done'}</button>
        </>
      )}
    </section>
  );
}

export function SwapSheet({ current, onClose, onPick, permanentOnly }: { current: Exercise; onClose: () => void; onPick: (e: Exercise, permanent: boolean) => void; permanentOnly?: boolean }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const alts = useMemo(() => alternatives(s.profile, current), [s.profile, current]);
  const [sel, setSel] = useState<Exercise | null>(null);
  return (
    <Sheet open onClose={onClose} title={ro ? 'Înlocuiește exercițiul' : 'Swap exercise'}>
      <p className="small muted">{ro ? `Alternative pentru ${current.name.ro}, aceeași mișcare, cu echipamentul tău:` : `Alternatives to ${current.name.en}, same movement, with your equipment:`}</p>
      {alts.length === 0 && <p className="muted">{ro ? 'Nu am alternative cu echipamentul tău.' : 'No alternatives with your equipment.'}</p>}
      {alts.map((e) => (
        <button key={e.id} className={'ex-row' + (sel?.id === e.id ? ' sel' : '')} onClick={() => setSel(e)}>
          <Figure id={e.id} anim={e.anim} size={56} playing={false} />
          <div><b>{L(e.name)}</b><p className="small muted">{L(e.muscles)}</p></div>
        </button>
      ))}
      {sel && (
        <div className="row gap sticky-actions">
          {!permanentOnly && <button className="btn ghost" onClick={() => onPick(sel, false)}>{ro ? 'Doar azi' : 'Just today'}</button>}
          <button className="btn" onClick={() => onPick(sel, true)}>{ro ? 'Mereu (în plan)' : 'Always (in plan)'}</button>
        </div>
      )}
    </Sheet>
  );
}
