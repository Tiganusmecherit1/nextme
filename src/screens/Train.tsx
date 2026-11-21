import { useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Chips, Disclaimer, go, Header, Sheet } from '../components/ui';
import { Figure } from '../components/Figure';
import { exById, MACHINES } from '../data/exercises';
import { sessionForDate, type Session } from '../plan';
import { api, ApiError, fileToDataUrl } from '../api';

const DOW = () => (getLang() === 'ro' ? ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

export function Train() {
  const s = useStore();
  const today = todayStr();
  const todaySession = sessionForDate(s.profile, s.plan, new Date());
  const [open, setOpen] = useState<string | null>(todaySession?.key ?? s.plan[0]?.key ?? null);
  const [gymOpen, setGymOpen] = useState(false);
  const days = [...s.profile.trainingDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const d = s.day(today);

  return (
    <div className="page">
      <Header title={t('train')} right={s.profile.location === 'gym' && <button className="btn sm ghost" onClick={() => setGymOpen(true)}>🏋️ {t('myGym')}</button>} />
      <p className="muted">{t('weeklyPlan')} · {s.profile.trainingDays.length}× {s.profile.sessionMinutes} min · {L({ ro: s.profile.location === 'gym' ? 'sală' : 'acasă', en: s.profile.location })}</p>

      {s.plan.map((sess, i) => (
        <SessionCard key={sess.key} sess={sess} dayLabel={DOW()[days[i % Math.max(1, days.length)]] ?? ''}
          isToday={todaySession?.key === sess.key} open={open === sess.key} onToggle={() => setOpen(open === sess.key ? null : sess.key)}
          done={todaySession?.key === sess.key && !!d.workout_done}
          onDone={() => s.patchDay(today, { workout_done: 1, workout_minutes: sess.estMinutes })} />
      ))}

      <section className="card small-card">
        <p className="small">📈 {t('progression')}</p>
      </section>
      <Disclaimer />
      {gymOpen && <MyGym onClose={() => setGymOpen(false)} />}
    </div>
  );
}

function SessionCard({ sess, dayLabel, isToday, open, onToggle, done, onDone }: { sess: Session; dayLabel: string; isToday: boolean; open: boolean; onToggle: () => void; done: boolean; onDone: () => void }) {
  return (
    <section className={'card session' + (isToday ? ' today' : '')}>
      <button className="session-head" onClick={onToggle}>
        <div>
          <p className="eyebrow">{dayLabel}{isToday ? ` · ${t('today')}` : ''}</p>
          <h2>{L(sess.title)}</h2>
          <p className="muted small">{sess.exercises.length} {getLang() === 'ro' ? 'exerciții' : 'exercises'} · ~{sess.estMinutes} {t('minutes')}</p>
        </div>
        <span className="chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="ex-list">
          <div className="ex-row warm"><span>🔥</span><div><b>{t('warmup')}</b><p className="small muted">{sess.warmupMin} {t('warmupText')}</p></div></div>
          {sess.exercises.map((p, i) => (
            <button key={i} className="ex-row" onClick={() => go('#/exercise/' + p.ex.id)}>
              <Figure anim={p.ex.anim} prop={p.ex.prop} size={64} playing={false} />
              <div>
                <b>{L(p.ex.name)}</b>
                <p className="small muted">{p.sets} {t('sets')} × {p.reps} · {t('rest')} {p.restSec}s</p>
              </div>
            </button>
          ))}
          {sess.finisher && <div className="ex-row warm"><span>⚡</span><div><b>{t('finisher')}</b><p className="small muted">{L(sess.finisher)}</p></div></div>}
          {isToday && (done ? <p className="ok center">✓ {t('workoutDone')}</p> : <button className="btn full" onClick={onDone}>{t('markDone')}</button>)}
        </div>
      )}
    </section>
  );
}

export function ExerciseDetail({ id }: { id: string }) {
  const ex = exById(id);
  if (!ex) return null;
  return (
    <div className="page">
      <Header title={L(ex.name)} back />
      <section className="card figure-card"><Figure anim={ex.anim} prop={ex.prop} size={240} /></section>
      <section className="card">
        <p className="eyebrow">{L(ex.muscles)}</p>
        <ol className="cues">{L(ex.cues).map((c, i) => <li key={i}>{c}</li>)}</ol>
        <p className="small muted">{getLang() === 'ro' ? 'Respiră constant: expiră la efort. Oprește-te la durere ascuțită, amețeală sau durere în piept.' : 'Breathe steadily: exhale on effort. Stop with sharp pain, dizziness or chest pain.'}</p>
      </section>
      <Disclaimer />
    </div>
  );
}

function MyGym({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [eq, setEq] = useState<string[]>(s.profile.gymEquipment);
  const [scan, setScan] = useState<{ id: string; alternatives: string[]; confidence: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const name = (id: string) => { const m = MACHINES.find((x) => x.id === id); return m ? m[getLang()] : id; };

  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setMsg(''); setScan(null);
    try {
      const image = await fileToDataUrl(f);
      const r = await api('/ai/machine', { method: 'POST', body: { image, lang: getLang() } });
      s.setAi({ used: r.used, limit: r.limit });
      setScan(r);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setMsg(code === 'limit_reached' ? t('aiLimit') : t('aiUnavailable'));
    } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  const addEq = (id: string) => setEq((x) => (x.includes(id) ? x : [...x, id]));

  return (
    <Sheet open onClose={onClose} title={t('myGym')}>
      <section className="card inset">
        <h3>📷 {t('scanMachine')}</h3>
        <p className="small muted">{t('scanMachineText')}</p>
        <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button className="btn" disabled={busy || s.ai.used >= s.ai.limit} onClick={() => file.current?.click()}>{busy ? t('analyzing') : '📷 ' + t('scanMachine')}</button>
        <p className="small muted">{Math.max(0, s.ai.limit - s.ai.used)} {t('aiLeft')}</p>
        {msg && <p className="err">{msg}</p>}
        {scan && (
          <div className="scan-res">
            {scan.id !== 'unknown' ? (
              <p>{t('recognized')}: <b>{name(scan.id)}</b> <button className="btn sm" onClick={() => addEq(scan.id)}>{t('addToGym')}</button></p>
            ) : <p>{t('notSure')}</p>}
            {scan.alternatives.map((a) => <button key={a} className="chip" onClick={() => addEq(a)}>+ {name(a)}</button>)}
          </div>
        )}
      </section>
      <p className="small muted">{t('myGymText')}</p>
      <Chips multi options={MACHINES.map((m) => ({ v: m.id, label: m[getLang()] }))} value={eq} onChange={setEq} />
      <div className="row gap sticky-actions">
        <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        <button className="btn" onClick={async () => { await s.saveProfile({ ...s.profile, gymEquipment: eq }); onClose(); }}>{t('save')}</button>
      </div>
    </Sheet>
  );
}
