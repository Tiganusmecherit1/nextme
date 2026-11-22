import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, L, t } from '../i18n';
import { Chips, Disclaimer, go, Header, Sheet } from '../components/ui';
import { Figure } from '../components/Figure';
import { exById, MACHINES } from '../data/exercises';
import { DEFAULT_DAYS, PHASE_INFO, PROGRAM_WEEKS, PROGRAMS, programOf, programWeek, sessionForDate, type Session } from '../plan';
import { SwapSheet, useLastSets } from './Workout';
import type { Exercise } from '../data/exercises';
import { api, ApiError, fileToDataUrl } from '../api';
import { QuickList, RecoveryList } from './Move';
import { EditSheet } from './Profile';

const DOW = () => (getLang() === 'ro' ? ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

export function Train({ section = 'program' }: { section?: string }) {
  const ro = getLang() === 'ro';
  const segs: [string, string, string][] = [
    ['program', '#/train', ro ? 'Programul meu' : 'My program'],
    ['quick', '#/train/quick', ro ? 'Rapid' : 'Quick'],
    ['recovery', '#/train/recovery', ro ? 'Recuperare' : 'Recovery'],
  ];
  const cur = segs.some(([k]) => k === section) ? section : 'program';
  return (
    <div className="page">
      <Header title={t('trainTab')} right={<button className="btn sm ghost" onClick={() => go('#/library')}>📚 {ro ? 'Exerciții' : 'Exercises'}</button>} />
      <div className="segmented" role="tablist">
        {segs.map(([k, href, label]) => (
          <button key={k} role="tab" aria-selected={cur === k} className={cur === k ? 'on' : ''} onClick={() => location.replace(href)}>{label}</button>
        ))}
      </div>
      {cur === 'quick' ? <QuickList /> : cur === 'recovery' ? <RecoveryList /> : <ProgramSection />}
      <Disclaimer />
    </div>
  );
}

function ProgramSection() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const today = todayStr();
  const todaySession = sessionForDate(s.profile, s.plan, new Date());
  const [open, setOpen] = useState<string | null>(todaySession?.key ?? s.plan[0]?.key ?? null);
  const [gymOpen, setGymOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const days = [...s.profile.trainingDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const d = s.day(today);
  const pick = (key: string) => {
    setOpen(key);
    setTimeout(() => document.getElementById('sess-' + key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const needsHealth = !!s.profile.asked && !s.profile.asked.includes('health');
  return (<>
    {needsHealth && (
      <button className="card list-item warn-soft" onClick={() => setHealthOpen(true)}>
        <span className="emoji">🩹</span>
        <div><b>{ro ? 'Înainte de primul antrenament' : 'Before your first workout'}</b><p className="small muted">{ro ? 'Ai vreo accidentare sau afecțiune? Îți adaptez exercițiile.' : 'Any injury or condition? I’ll adapt your exercises.'}</p></div>
        <span className="chev">›</span>
      </button>
    )}
    <ProgramCard />
    <WeekStrip onPick={pick} />
    <p className="muted small">{t('weeklyPlan')} · {s.profile.trainingDays.length}× {s.profile.sessionMinutes} min · {L({ ro: s.profile.location === 'gym' ? 'sală' : 'acasă', en: s.profile.location === 'gym' ? 'gym' : 'home' })} · <a href="#/profile/training">{ro ? 'schimbă' : 'change'}</a></p>

    {s.plan.map((sess, i) => (
      <SessionCard key={sess.key} sess={sess} dayLabel={DOW()[days[i % Math.max(1, days.length)]] ?? ''}
        isToday={todaySession?.key === sess.key} open={open === sess.key} onToggle={() => setOpen(open === sess.key ? null : sess.key)}
        done={todaySession?.key === sess.key && !!d.workout_done}
        onDone={() => s.patchDay(today, { workout_done: 1, workout_minutes: sess.estMinutes })} />
    ))}

    {s.profile.location === 'gym' && (
      <button className="card list-item" onClick={() => setGymOpen(true)}>
        <span className="emoji">📷</span>
        <div><b>{ro ? 'Sala mea: recunoaște un aparat' : 'My gym: identify a machine'}</b><p className="small muted">{ro ? 'Fă o poză unui aparat și află ce exerciții poți face pe el.' : 'Snap a machine and see which exercises it is for.'}</p></div>
        <span className="chev">›</span>
      </button>
    )}
    <section className="card small-card">
      <p className="small">📈 {t('progression')}</p>
    </section>
    {gymOpen && <MyGym onClose={() => setGymOpen(false)} />}
    {healthOpen && <EditSheet section="health" title={ro ? 'Sănătate' : 'Health'} onClose={() => setHealthOpen(false)} />}
  </>);
}

/** This week at a glance: training days, today, and what's already done. */
function WeekStrip({ onPick }: { onPick: (key: string) => void }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const names = ro ? ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return (
    <div className="week-strip">
      {names.map((n, i) => {
        const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const sess = sessionForDate(s.profile, s.plan, date);
        const key = ymd(date);
        const isToday = key === todayStr();
        const done = !!s.day(key).workout_done;
        const past = key < todayStr();
        return (
          <button key={i} className={'wd' + (sess ? ' train' : '') + (isToday ? ' today' : '') + (done ? ' done' : '') + (past && sess && !done ? ' missed' : '')}
            disabled={!sess} onClick={() => sess && onPick(sess.key)} aria-label={sess ? L(sess.title) : undefined}>
            <span>{n}</span>
            <b>{date.getDate()}</b>
            <i>{done ? '✓' : sess ? '●' : ''}</i>
          </button>
        );
      })}
    </div>
  );
}

function ProgramCard() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const pw = programWeek(s.profile);
  const info = PHASE_INFO[pw.phase];
  const prog = programOf(s.profile);
  const [pick, setPick] = useState(false);
  const choose = async (id: string) => {
    const pr = PROGRAMS.find((x) => x.id === id)!;
    const days = pr.days && s.profile.trainingDays.length !== pr.days ? DEFAULT_DAYS[pr.days] : s.profile.trainingDays;
    await s.saveProfile({ ...s.profile, program: id, programStart: todayStr(), trainingDays: days });
    setPick(false);
  };
  return (
    <section className="card program-card">
      <div className="row between">
        <p className="eyebrow">{L(prog.title)} · {ro ? `ciclul ${pw.cycle}` : `cycle ${pw.cycle}`}</p>
        <button className="link small" onClick={() => setPick(true)}>{ro ? 'Schimbă' : 'Change'}</button>
      </div>
      <h2>{ro ? `Săptămâna ${pw.week} din ${PROGRAM_WEEKS}` : `Week ${pw.week} of ${PROGRAM_WEEKS}`} · {L(info.name)}</h2>
      <div className="weeks">{Array.from({ length: PROGRAM_WEEKS }, (_, i) => <span key={i} className={'wk' + (i + 1 < pw.week ? ' past' : i + 1 === pw.week ? ' now' : '') + (i + 1 === PROGRAM_WEEKS ? ' deload' : '')} />)}</div>
      <p className="small muted">{L(info.text)}</p>
      {pick && (
        <Sheet open onClose={() => setPick(false)} title={ro ? 'Alege programul' : 'Choose a program'}>
          <p className="small muted">{ro ? 'Schimbarea pornește un ciclu nou de 8 săptămâni. Dacă programul are alt număr de zile, îți ajustez zilele (le poți schimba din profil).' : 'Changing starts a new 8-week cycle. If the program has a different number of days, I adjust your days (you can change them in your profile).'}</p>
          {PROGRAMS.map((x) => (
            <button key={x.id} className={'card inset list-item prog-item' + (x.id === prog.id ? ' sel' : '')} onClick={() => choose(x.id)}>
              <div><b>{L(x.title)}</b><p className="small muted">{L(x.text)}</p></div>
              {x.id === prog.id && <span className="ok">✓</span>}
            </button>
          ))}
        </Sheet>
      )}
    </section>
  );
}

function SessionCard({ sess, dayLabel, isToday, open, onToggle, done, onDone }: { sess: Session; dayLabel: string; isToday: boolean; open: boolean; onToggle: () => void; done: boolean; onDone: () => void }) {
  const s = useStore();
  const last = useLastSets();
  const [swap, setSwap] = useState<Exercise | null>(null);
  const doSwap = async (e: Exercise) => {
    // map back to the originally generated exercise so the swap survives plan rebuilds
    const orig = Object.entries(s.profile.swaps || {}).find(([, v]) => v === swap!.id)?.[0] ?? swap!.id;
    await s.saveProfile({ ...s.profile, swaps: { ...(s.profile.swaps || {}), [orig]: e.id } });
    setSwap(null);
  };
  return (
    <section id={'sess-' + sess.key} className={'card session' + (isToday ? ' today' : '')}>
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
          {sess.exercises.map((p, i) => {
            const l = last?.[p.ex.id]?.sets;
            const top = l?.reduce((m, x) => Math.max(m, x.kg ?? 0), 0);
            return (
              <div key={i} className="ex-row-wrap">
                <button className="ex-row" onClick={() => go('#/exercise/' + p.ex.id)}>
                  <Figure id={p.ex.id} anim={p.ex.anim} size={64} playing={false} />
                  <div>
                    <b>{L(p.ex.name)}</b>
                    <p className="small muted">{p.sets} {t('sets')} × {p.reps} · {t('rest')} {p.restSec}s{top ? ` · ${getLang() === 'ro' ? 'ultima' : 'last'} ${top} kg` : ''}</p>
                  </div>
                </button>
                <button className="swap-btn" aria-label={getLang() === 'ro' ? 'Înlocuiește' : 'Swap'} onClick={() => setSwap(p.ex)}>⇄</button>
              </div>
            );
          })}
          {sess.finisher && <div className="ex-row warm"><span>⚡</span><div><b>{t('finisher')}</b><p className="small muted">{L(sess.finisher)}</p></div></div>}
          {done ? <p className="ok center">✓ {t('workoutDone')}</p> : <button className="btn full" onClick={() => go('#/workout/' + sess.key)}>▶ {getLang() === 'ro' ? 'Începe antrenamentul ghidat' : 'Start guided workout'}</button>}
          {isToday && !done && <button className="link" onClick={onDone}>{getLang() === 'ro' ? 'Bifează fără să notezi seriile' : 'Mark done without logging sets'}</button>}
        </div>
      )}
      {swap && <SwapSheet current={swap} permanentOnly onClose={() => setSwap(null)} onPick={(e) => doSwap(e)} />}
    </section>
  );
}

export function ExerciseDetail({ id }: { id: string }) {
  const ex = exById(id);
  const ro = getLang() === 'ro';
  const [hist, setHist] = useState<{ date: string; set_no: number; kg: number | null; reps: number }[] | null>(null);
  useEffect(() => { api<{ items: any[] }>('/sets/' + id).then((r) => setHist(r.items)).catch(() => setHist([])); }, [id]);
  if (!ex) return null;
  const timedEx = ex.slot === 'core' || ex.slot === 'balance' || ex.id === 'wall_sit';
  // one point per day: heaviest set (or most reps/seconds for bodyweight)
  const days = Object.values((hist ?? []).reduce<Record<string, { date: string; kg: number; reps: number; e1rm: number; sets: string[] }>>((acc, x) => {
    const d = (acc[x.date] ??= { date: x.date, kg: 0, reps: 0, e1rm: 0, sets: [] });
    d.kg = Math.max(d.kg, x.kg ?? 0);
    d.reps = Math.max(d.reps, x.reps);
    if (x.kg) d.e1rm = Math.max(d.e1rm, x.kg * (1 + x.reps / 30)); // Epley estimate
    d.sets.push(x.kg ? `${x.kg}×${x.reps}` : `${x.reps}${timedEx ? ' s' : ''}`);
    return acc;
  }, {}));
  const weighted = days.some((d) => d.kg > 0);
  const vals = days.map((d) => (weighted ? d.kg : d.reps));
  const best = { kg: Math.max(0, ...days.map((d) => d.kg)), reps: Math.max(0, ...days.map((d) => d.reps)), e1rm: Math.round(Math.max(0, ...days.map((d) => d.e1rm))) };
  const W = 300, H = 110, min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => `${vals.length === 1 ? W / 2 : (i / (vals.length - 1)) * (W - 20) + 10},${H - 10 - (max === min ? 0.5 : (v - min) / (max - min)) * (H - 30)}`).join(' ');
  return (
    <div className="page">
      <Header title={L(ex.name)} back />
      <section className="card figure-card"><Figure id={ex.id} anim={ex.anim} size={240} /></section>
      <section className="card">
        <p className="eyebrow">{L(ex.muscles)}</p>
        <ol className="cues">{L(ex.cues).map((c, i) => <li key={i}>{c}</li>)}</ol>
        <p className="small muted">{ro ? 'Respiră constant: expiră la efort. Oprește-te la durere ascuțită, amețeală sau durere în piept.' : 'Breathe steadily: exhale on effort. Stop with sharp pain, dizziness or chest pain.'}</p>
      </section>
      <section className="card">
        <h3>📈 {ro ? 'Progresul tău' : 'Your progress'}</h3>
        {hist === null ? <p className="muted small">…</p> : days.length === 0 ? (
          <p className="small muted">{ro ? 'Încă nu ai serii notate. Fă un antrenament ghidat și apare aici.' : 'No sets logged yet. Do a guided workout and it shows up here.'}</p>
        ) : (<>
          <div className="pr-row">
            {weighted && <div><b>{best.kg} kg</b><span className="small muted">{ro ? 'cea mai mare greutate' : 'heaviest'}</span></div>}
            <div><b>{best.reps}{timedEx ? ' s' : ''}</b><span className="small muted">{timedEx ? (ro ? 'cel mai lung' : 'longest') : (ro ? 'cele mai multe repetări' : 'most reps')}</span></div>
            {weighted && best.e1rm > 0 && <div><b>~{best.e1rm} kg</b><span className="small muted">{ro ? '1 repetare max. (estimat)' : '1-rep max (estimate)'}</span></div>}
          </div>
          {days.length > 1 && (
            <svg viewBox={`0 0 ${W} ${H}`} className="hist-chart" role="img" aria-label={ro ? 'Grafic progres' : 'Progress chart'}>
              <polyline points={pts} fill="none" stroke="var(--coral)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {pts.split(' ').map((p, i) => { const [x, y] = p.split(','); return <circle key={i} cx={x} cy={y} r="4" fill="var(--coral)" />; })}
            </svg>
          )}
          <ul className="hist-list">{days.slice(-8).reverse().map((d) => <li key={d.date}><span className="muted small">{new Date(d.date + 'T00:00:00').toLocaleDateString(ro ? 'ro-RO' : 'en-GB', { day: 'numeric', month: 'short' })}</span> {d.sets.join(' · ')}</li>)}</ul>
          {weighted && <p className="small muted">{ro ? '1RM estimat cu formula Epley; e doar orientativ, nu-l testa fără supraveghere.' : '1RM estimated with the Epley formula; a rough guide only, don’t test it unsupervised.'}</p>}
        </>)}
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
