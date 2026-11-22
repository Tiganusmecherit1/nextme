// Shared "well done" summary at the end of any workout or routine: what you did, today's rings, and what's next.
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L } from '../i18n';
import { activeMinutes, MOVE_GOAL, stepGoal } from '../activity';
import { buildDayPlan, nextStep } from '../dayplan';
import { sessionForDate } from '../plan';
import { go, Rings } from './ui';
import { back } from '../nav';

export function DoneCard({ title, stats, note }: { title: string; stats?: string; note?: string }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const d = s.day(todayStr());
  const mins = activeMinutes(d);
  const session = sessionForDate(s.profile, s.plan, new Date());
  const next = nextStep(buildDayPlan(s.profile, d, session, null), new Date().getHours(), s.profile.trainingTime);
  return (
    <>
      <section className="card tile-wide accent-coral done-card">
        <h2 className="cheer">{title}</h2>
        {stats && <p>{stats}</p>}
        {note && <p className="small muted">{note}</p>}
        <div className="rings-row">
          <Rings size={92} values={[
            { pct: mins / MOVE_GOAL, color: 'var(--coral)' },
            { pct: d.steps / stepGoal(s.profile), color: 'var(--violet)' },
            { pct: d.water_ml / s.targets.waterMl, color: 'var(--water)' },
          ]} />
          <div className="ring-legend">
            <div><span className="lg c1">{ro ? 'Mișcare azi' : 'Move today'}</span><b>{mins}/{MOVE_GOAL}</b> min</div>
            <div className="small muted">{mins >= MOVE_GOAL ? (ro ? 'Inelul de mișcare e închis 🎉' : 'Move ring closed 🎉') : (ro ? `Încă ${MOVE_GOAL - mins} min până închizi inelul` : `${MOVE_GOAL - mins} min to close the ring`)}</div>
          </div>
        </div>
      </section>
      {next && (
        <button className="card list-item" onClick={() => go(next.href)}>
          <span className="emoji">{next.icon}</span>
          <div><p className="small muted">{ro ? 'Urmează' : 'Up next'} · {L(next.when)}</p><b>{L(next.title)}</b></div>
          <span className="chev">›</span>
        </button>
      )}
      <div className="row gap">
        <button className="btn ghost" onClick={back}>{ro ? 'Înapoi' : 'Back'}</button>
        <button className="btn" onClick={() => go('#/today')}>{ro ? 'Vezi ziua' : 'See today'}</button>
      </div>
    </>
  );
}
