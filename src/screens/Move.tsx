import { useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { Figure } from '../components/Figure';
import { ROUTINES } from '../data/routines';

export function Move() {
  const s = useStore();
  const d = s.day(todayStr());
  const snacks = ROUTINES.filter((r) => r.kind === 'snack');
  const physio = ROUTINES.filter((r) => r.kind === 'physio');
  return (
    <div className="page">
      <Header title={t('move')} />
      <p className="muted">{t('quickMovesText')}</p>
      <div className="tiles">
        {snacks.map((r) => (
          <button key={r.id} className="card tile routine-tile" onClick={() => go('#/routine/' + r.id)}>
            <span className="emoji">{r.icon}</span>
            <h3>{L(r.title)}</h3>
            <p className="small muted">{r.minutes} {t('minutes')}{d.moves.includes(r.id) ? ' · ✓' : ''}</p>
          </button>
        ))}
      </div>
      <h2 className="section-title">🩺 {t('physio')}</h2>
      <p className="muted small">{t('physioText')}</p>
      {physio.map((r) => (
        <button key={r.id} className="card list-item" onClick={() => go('#/routine/' + r.id)}>
          <span className="emoji">{r.icon}</span>
          <div><b>{L(r.title)}</b><p className="small muted">{r.moves.length} {getLang() === 'ro' ? 'exerciții' : 'exercises'} · {r.minutes} {t('minutes')}</p></div>
          <span className="chev">›</span>
        </button>
      ))}
      <Disclaimer />
    </div>
  );
}

export function RoutinePlayer({ id }: { id: string }) {
  const s = useStore();
  const r = ROUTINES.find((x) => x.id === id);
  const [i, setI] = useState(0);
  const today = todayStr();
  const d = s.day(today);
  if (!r) return null;
  const mv = r.moves[i];
  const last = i === r.moves.length - 1;
  const done = d.moves.includes(r.id);
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
            : <button className="btn" onClick={() => s.patchDay(today, { moves: [...d.moves, r.id] })}>{t('routineDone')}</button>}
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
