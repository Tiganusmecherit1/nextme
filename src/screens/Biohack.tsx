import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { DoneCard } from '../components/DoneCard';
import { withMove } from '../activity';
import { Figure } from '../components/Figure';
import { exById } from '../data/exercises';
import { beep, keepAwake, unlockAudio } from '../beep';
import { BIO_TOPICS, bioTopic, bioWorkout, HR_SOURCES, needsClearance, zones, type BioWorkout, type Evidence, type Segment } from '../data/biohacking';

const EVID: Record<Evidence, { ro: string; en: string; cls: string }> = {
  rct: { ro: 'Studii controlate', en: 'Controlled trials', cls: 'ev-rct' },
  cohort: { ro: 'Observațional', en: 'Observational', cls: 'ev-cohort' },
  caution: { ro: 'Atenție', en: 'Caution', cls: 'ev-caution' },
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const totalMin = (segs: Segment[]) => Math.round(segs.reduce((a, x) => a + x.sec, 0) / 60);

function ZoneLine({ w }: { w: BioWorkout }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const z = zones(s.profile);
  const txt = {
    z2: ro ? `Zona 2: ~${z.z2} bpm · poți vorbi, nu poți cânta` : `Zone 2: ~${z.z2} bpm · you can talk, not sing`,
    z45: ro ? `Intervale: ~${z.z45} bpm · doar câteva cuvinte` : `Intervals: ~${z.z45} bpm · only a few words`,
    vig: ro ? `Viguros: peste ~${Math.round(z.max * 0.77)} bpm · respiri greu` : `Vigorous: above ~${Math.round(z.max * 0.77)} bpm · breathing hard`,
    light: ro ? 'Ușor–moderat · conversație liberă' : 'Easy–moderate · comfortable conversation',
    strength: ro ? 'Forță · ultimele 2–3 repetări grele' : 'Strength · last 2–3 reps hard',
  }[w.zone];
  return <p className="small bio-zone">❤️ {txt}</p>;
}

export function Biohack() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const z = zones(s.profile);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="page">
      <Header title="Biohacking" back />
      <section className="card bio-hero">
        <p className="eyebrow">{ro ? 'Doar ce are dovezi' : 'Evidence only'}</p>
        <h2>{ro ? 'Obiceiuri cu efect măsurat asupra sănătății și longevității' : 'Habits with a measured effect on health and longevity'}</h2>
        <p className="small muted">{ro
          ? 'Fiecare recomandare are sursa dedesubt și o etichetă: „studii controlate” (cauză-efect), „observațional” (asociere, nu dovadă) sau „atenție”. Nu includem trucuri fără dovezi.'
          : 'Every recommendation has its source below and a label: “controlled trials” (cause and effect), “observational” (association, not proof) or “caution”. No tricks without evidence.'}</p>
      </section>

      <section className="card">
        <h3>❤️ {ro ? 'Zonele tale de puls (estimare)' : 'Your heart-rate zones (estimate)'}</h3>
        <div className="pr-row">
          <div><span className="small muted">{ro ? 'Puls maxim' : 'Max HR'}</span><b>{z.max}</b></div>
          <div><span className="small muted">{ro ? 'Zona 2' : 'Zone 2'}</span><b>{z.z2}</b></div>
          <div><span className="small muted">4×4</span><b>{z.z45}</b></div>
        </div>
        <p className="small muted">{ro
          ? 'Formula Tanaka (208 − 0,7 × vârsta). Poate greși cu ±10 bătăi; testul vorbirii e un reper la fel de bun. Beta-blocantele și alte medicamente schimbă pulsul.'
          : 'Tanaka formula (208 − 0.7 × age). It can be off by ±10 beats; the talk test is just as good a guide. Beta-blockers and other drugs change heart rate.'}</p>
        <ul className="src-list">{HR_SOURCES.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></li>)}</ul>
      </section>

      {needsClearance(s.profile) && (
        <section className="card redflags">
          <h3>⚠︎ {ro ? 'Întreabă medicul înainte de efort viguros' : 'Ask your doctor before vigorous effort'}</h3>
          <p className="small">{ro
            ? 'Ai trecut în profil o afecțiune (inimă, tensiune, diabet, rinichi sau sarcină). Ghidul ACSM recomandă avizul medicului înainte de intervale intense. Plimbările și Zona 2 ușoară sunt de obicei un început sigur.'
            : 'Your profile lists a condition (heart, blood pressure, diabetes, kidney or pregnancy). ACSM guidance advises a doctor’s OK before intense intervals. Walks and easy Zone 2 are usually a safe start.'}</p>
        </section>
      )}

      <button className="card list-item hero-link" onClick={() => go('#/train/quick')}>
        <span className="emoji">🏃</span>
        <div><b>{ro ? 'Antrenamentele ghidate' : 'Guided workouts'}</b><p className="small muted">{ro ? 'Le găsești în Antrenează → Rapid: 4×4, Zona 2, plimbare după masă, VILPA, forță minimă.' : 'In Train → Quick: 4×4, Zone 2, after-meal walk, VILPA, minimum strength.'}</p></div>
        <span className="chev">›</span>
      </button>

      <h2 className="section-title">📖 {ro ? 'Ce spun studiile' : 'What the studies say'}</h2>
      {BIO_TOPICS.map((tp) => {
        const ev = EVID[tp.evidence];
        const isOpen = open === tp.id;
        return (
          <section key={tp.id} className="card bio-topic">
            <button className="session-head" onClick={() => setOpen(isOpen ? null : tp.id)} aria-expanded={isOpen}>
              <div>
                <span className={'ev-badge ' + ev.cls}>{L(ev)}</span>
                <h3>{tp.icon} {L(tp.title)}</h3>
              </div>
              <span className="chev">{isOpen ? '▴' : '▾'}</span>
            </button>
            {isOpen && (
              <div className="bio-body">
                <p>{L(tp.summary)}</p>
                <h4>{ro ? 'Cum aplici' : 'How to apply'}</h4>
                <ul>{L(tp.how).map((x, k) => <li key={k}>{x}</li>)}</ul>
                {tp.caution && <p className="small bio-caution">⚠︎ {L(tp.caution)}</p>}
                {tp.workout && <button className="btn full" onClick={() => go('#/bio/' + tp.workout)}>▶ {ro ? 'Antrenamentul ghidat' : 'Guided workout'}</button>}
                <p className="small muted">{ro ? 'Surse' : 'Sources'}:</p>
                <ul className="src-list">{tp.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></li>)}</ul>
              </div>
            )}
          </section>
        );
      })}
      <Disclaimer />
    </div>
  );
}

type Run = { i: number; endsAt: number; pausedLeft: number | null; done: boolean };

export function BioWorkoutPlayer({ id }: { id: string }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const w = bioWorkout(id);
  const [variant, setVariant] = useState(w?.defaultVariant ?? '');
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(Date.now());
  const release = useRef<() => void>(() => {});
  const lastBeep = useRef(-1);
  const segs = w ? w.build(variant, s.profile) : [];

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => { clearInterval(t); release.current(); }; }, []);
  const left = run ? (run.pausedLeft ?? Math.ceil((run.endsAt - now) / 1000)) : 0;

  const finish = () => {
    beep('end');
    release.current();
    const today = todayStr();
    const d = s.day(today);
    s.patchDay(today, { moves: withMove(d, 'bio_' + id, segs.reduce((a, x) => a + x.sec, 0) / 60) });
  };

  useEffect(() => {
    if (!run || run.done || run.pausedLeft !== null) return;
    if (left <= 3 && left >= 1 && lastBeep.current !== left) { lastBeep.current = left; beep('tick'); }
    if (left > 0) return;
    lastBeep.current = -1;
    const next = run.i + 1;
    if (next >= segs.length) { setRun({ ...run, done: true }); finish(); return; }
    const k = segs[next].kind;
    beep(k === 'work' ? 'go' : 'rest');
    setRun({ i: next, endsAt: Date.now() + segs[next].sec * 1000, pausedLeft: null, done: false });
  }, [left, run]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!w) return null;
  const topic = bioTopic(w.topic);

  const start = async () => {
    unlockAudio();
    release.current = await keepAwake();
    lastBeep.current = -1;
    beep(segs[0].kind === 'work' ? 'go' : 'rest');
    setRun({ i: 0, endsAt: Date.now() + segs[0].sec * 1000, pausedLeft: null, done: false });
  };
  const pause = () => run && setRun(run.pausedLeft === null ? { ...run, pausedLeft: Math.max(0, left) } : { ...run, endsAt: Date.now() + run.pausedLeft * 1000, pausedLeft: null });
  const skip = () => run && setRun({ ...run, endsAt: Date.now(), pausedLeft: null });
  const stop = () => { release.current(); setRun(null); };

  if (run) {
    const sg = segs[run.i];
    const ph = run.done ? 'done' : sg.kind === 'work' ? 'work' : sg.kind === 'steady' ? 'work' : sg.kind === 'recover' ? 'rest' : 'prep';
    const pct = run.done ? 1 : 1 - Math.max(0, left) / Math.max(1, sg.sec);
    const ex = sg.exId ? exById(sg.exId) : undefined;
    const nextSeg = segs[run.i + 1];
    const remaining = segs.slice(run.i + 1).reduce((a, x) => a + x.sec, 0) + Math.max(0, left);
    return (
      <div className={'page timer-run ph-' + ph}>
        <Header title={L(w.title)} />
        <div className="timer-face">
          <svg viewBox="0 0 200 200" className="timer-ring" aria-hidden="true">
            <circle cx="100" cy="100" r="90" className="trk" />
            <circle cx="100" cy="100" r="90" className="val" style={{ strokeDasharray: 565.5, strokeDashoffset: 565.5 * (1 - pct) }} />
          </svg>
          <div className="timer-center">
            <p className="timer-phase">{run.done ? (ro ? 'GATA!' : 'DONE!') : L(sg.label).toUpperCase()}</p>
            <p className="timer-left">{run.done ? '✓' : fmt(Math.max(0, left))}</p>
            {!run.done && <p className="small">{ro ? 'Rămas' : 'Left'} {fmt(remaining)}</p>}
          </div>
        </div>
        {!run.done && (
          <section className="card">
            {ex && (
              <div className="timer-ex">
                <Figure id={ex.id} anim={ex.anim} size={90} playing={sg.kind === 'work'} />
                <div><p className="small muted">{sg.kind === 'work' ? (ro ? 'Acum' : 'Now') : (ro ? 'Urmează' : 'Next')}</p><b>{L(ex.name)}</b></div>
              </div>
            )}
            <p>{L(sg.cue)}</p>
            {nextSeg && !ex && <p className="small muted">{ro ? 'Urmează' : 'Next'}: {nextSeg.exId ? L(exById(nextSeg.exId)?.name ?? nextSeg.label) : L(nextSeg.label)} · {fmt(nextSeg.sec)}</p>}
          </section>
        )}
        {run.done ? (
          <DoneCard title={ro ? 'Bravo! 💪' : 'Well done! 💪'} stats={ro ? `${totalMin(segs)} minute bifate în ziua de azi` : `${totalMin(segs)} minutes logged for today`} />
        ) : (
          <div className="row gap">
            <button className="btn ghost" onClick={stop}>■ Stop</button>
            <button className="btn" onClick={pause}>{run.pausedLeft === null ? (ro ? '❚❚ Pauză' : '❚❚ Pause') : (ro ? '▶ Continuă' : '▶ Resume')}</button>
            <button className="btn ghost" onClick={skip}>⏭</button>
          </div>
        )}
        <p className="small muted center">{ro ? 'Oprește-te imediat dacă ai durere în piept, amețeală sau lipsă de aer neobișnuită.' : 'Stop at once if you get chest pain, dizziness or unusual breathlessness.'}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Header title={L(w.title)} back />
      <section className="card">
        <p className="eyebrow">Biohacking · ~{totalMin(segs)} min</p>
        <p>{L(w.text)}</p>
        <ZoneLine w={w} />
        <div className="chips">
          {w.variants.map((v) => <button key={v.id} className={'chip' + (v.id === variant ? ' on' : '')} onClick={() => setVariant(v.id)}>{L(v.label)}</button>)}
        </div>
        <ol className="bio-segs">
          {compact(segs).map((g, k) => (
            <li key={k} className={'seg-' + g.kind}>
              <span>{g.count > 1 ? `${g.count} × ` : ''}{g.exId ? L(exById(g.exId)?.name ?? g.label) : L(g.label).replace(/ \d+ \/ \d+$/, '')}</span>
              <b>{fmt(g.sec)}</b>
            </li>
          ))}
        </ol>
        <p className="small muted">{ro ? 'Sună și vibrează la 3-2-1 și la fiecare schimbare; ecranul rămâne aprins.' : 'Beeps and vibrates at 3-2-1 and at every change; the screen stays on.'}</p>
        <button className="btn full" onClick={start}>▶ {ro ? 'Pornește' : 'Start'}</button>
      </section>
      {w.vigorous && needsClearance(s.profile) && (
        <section className="card redflags">
          <p className="small">⚠︎ {ro ? 'Profilul tău are o afecțiune pentru care ghidurile cer avizul medicului înainte de efort viguros.' : 'Your profile lists a condition for which guidelines advise a doctor’s OK before vigorous effort.'}</p>
        </section>
      )}
      {topic && (
        <section className="card">
          <h3>{ro ? 'De ce funcționează' : 'Why it works'}</h3>
          <p className="small">{L(topic.summary)}</p>
          <ul className="src-list">{topic.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></li>)}</ul>
        </section>
      )}
      <Disclaimer />
    </div>
  );
}

/** Groups the segment list for display: consecutive identical blocks collapse into "N ×". */
function compact(segs: Segment[]) {
  const out: (Segment & { count: number })[] = [];
  const key = (x: Segment) => `${x.kind}|${x.sec}|${x.exId ?? ''}|${x.label.en.replace(/ \d+ \/ \d+$/, '')}`;
  // for circuits show one round only
  const hasEx = segs.some((x) => x.exId);
  const list = hasEx ? segs.filter((x) => x.kind !== 'recover') : segs;
  for (const x of list) {
    const last = out[out.length - 1];
    if (!hasEx && last && key(last) === key(x)) last.count++;
    else if (hasEx && x.exId && out.some((o) => o.exId === x.exId)) out.find((o) => o.exId === x.exId)!.count++;
    else out.push({ ...x, count: 1 });
  }
  return out;
}
