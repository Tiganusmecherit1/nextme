import { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { hasMove, withMove } from '../activity';
import { BIO_WORKOUTS } from '../data/biohacking';
import { DoneCard } from '../components/DoneCard';
import { Figure } from '../components/Figure';
import { ROUTINES } from '../data/routines';

/** Antrenează → Rapid: short routines, interval timer and the evidence-based biohacking workouts. */
export function QuickList() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const d = s.day(todayStr());
  // the after-meal walk lives with the biohacking workouts (timed, with variants), so it is not listed twice
  const snacks = ROUTINES.filter((r) => r.kind === 'snack' && r.id !== 'after_meal');
  return (<>
    <p className="muted">{t('quickMovesText')}</p>
    <div className="tiles">
      {snacks.map((r) => (
        <button key={r.id} className="card tile routine-tile" onClick={() => go('#/routine/' + r.id)}>
          <span className="emoji">{r.icon}</span>
          <h3>{L(r.title)}</h3>
          <p className="small muted">{r.minutes} {t('minutes')}{hasMove(d, r.id) ? ' · ✓' : ''}</p>
        </button>
      ))}
    </div>
    <button className="card list-item hero-link" onClick={() => go('#/timer')}>
      <span className="emoji">⏱️</span>
      <div><b>{ro ? 'Cronometru interval' : 'Interval timer'}</b><p className="small muted">{ro ? 'Planșe, Tabata: lucru / pauză / runde' : 'Planks, Tabata: work / rest / rounds'}</p></div>
      <span className="chev">›</span>
    </button>
    <div className="row between section-row">
      <h2 className="section-title">🧬 {ro ? 'Biohacking, cu dovezi' : 'Biohacking, evidence-based'}</h2>
      <a className="small" href="#/biohack">{ro ? 'De ce funcționează ›' : 'Why it works ›'}</a>
    </div>
    <div className="tiles">
      {BIO_WORKOUTS.map((w) => (
        <button key={w.id} className="card tile routine-tile bio-tile" onClick={() => go('#/bio/' + w.id)}>
          <span className="emoji">{w.icon}</span>
          <h3>{L(w.title)}</h3>
          <p className="small muted">~{Math.round(w.build(w.defaultVariant, s.profile).reduce((a, x) => a + x.sec, 0) / 60)} min{hasMove(d, 'bio_' + w.id) ? ' · ✓' : ''}</p>
        </button>
      ))}
    </div>
  </>);
}

/** Antrenează → Recuperare: evidence-based physiotherapy routines. */
export function RecoveryList() {
  const s = useStore();
  const d = s.day(todayStr());
  const physio = ROUTINES.filter((r) => r.kind === 'physio');
  const mine = new Set(s.profile.injuries.map((x) => ({ lower_back: 'low_back' } as Record<string, string>)[x] ?? x));
  const sorted = [...physio].sort((a, b) => Number(mine.has(b.group)) - Number(mine.has(a.group)));
  return (<>
    <p className="muted small">{t('physioText')}</p>
    {sorted.map((r) => (
      <button key={r.id} className="card list-item" onClick={() => go('#/routine/' + r.id)}>
        <span className="emoji">{r.icon}</span>
        <div><b>{L(r.title)}</b>{mine.has(r.group) && <span className="pill">{getLang() === 'ro' ? 'pentru tine' : 'for you'}</span>}
          <p className="small muted">{r.moves.length} {getLang() === 'ro' ? 'exerciții' : 'exercises'} · {r.minutes} {t('minutes')}{hasMove(d, r.id) ? ' · ✓' : ''}</p></div>
        <span className="chev">›</span>
      </button>
    ))}
  </>);
}

export function RoutinePlayer({ id }: { id: string }) {
  const s = useStore();
  const r = ROUTINES.find((x) => x.id === id);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const today = todayStr();
  const d = s.day(today);
  if (!r) return null;
  const mv = r.moves[i];
  const last = i === r.moves.length - 1;
  const done = hasMove(d, r.id);
  if (finished) {
    return (
      <div className="page">
        <Header title={L(r.title)} back />
        <DoneCard title={getLang() === 'ro' ? 'Rutină bifată ✓' : 'Routine done ✓'} stats={`${r.minutes} ${t('minutes')} · ${r.moves.length} ${getLang() === 'ro' ? 'mișcări' : 'moves'}`} />
        <Disclaimer />
      </div>
    );
  }
  return (
    <div className="page">
      <Header title={L(r.title)} back />
      <section className="card player">
        <p className="eyebrow">{i + 1} / {r.moves.length}</p>
        <Figure anim={mv.anim} size={220} />
        <h2>{L(mv.name)}</h2>
        <p className="dose">{L(mv.dose)}</p>
        <p className="muted">{L(mv.cue)}</p>
        <div className="row gap">
          <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t('prev')}</button>
          {!last ? <button className="btn" onClick={() => setI(i + 1)}>{t('next')}</button>
            : done ? <button className="btn" disabled>✓ {t('done')}</button>
            : <button className="btn" onClick={() => { s.patchDay(today, { moves: withMove(d, r.id, r.minutes) }); setFinished(true); }}>{t('routineDone')}</button>}
        </div>
      </section>
      {r.redFlags && (
        <section className="card redflags">
          <h3>⚠︎ {t('redFlags')}</h3>
          <ul>{L(r.redFlags).map((x, k) => <li key={k}>{x}</li>)}</ul>
        </section>
      )}
      <section className="card">
        <h3>{t('whyItWorks')}</h3>
        <p>{L(r.why)}</p>
        <p className="src">{t('source')}: {r.source}</p>
      </section>
      <Disclaimer />
    </div>
  );
}
