import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { api } from '../api';
import { getLang, t } from '../i18n';
import { Disclaimer, Header, Sheet } from '../components/ui';

export function Calendar() {
  const s = useStore();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [copied, setCopied] = useState(false);
  const ro = getLang() === 'ro';
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const first = ymd(month);
  const lastDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  useEffect(() => { s.loadRange(first, ymd(lastDate)).catch(() => {}); }, [first]); // eslint-disable-line react-hooks/exhaustive-deps

  const offset = (month.getDay() + 6) % 7; // Monday first
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= lastDate.getDate(); i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));
  const today = todayStr();
  const feed = `${location.origin}/api/ics/${s.icsToken}.ics`;
  const wd = ro ? ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const addEvent = async () => {
    if (!sel || !title.trim()) return;
    await api('/events', { method: 'POST', body: { date: sel, time: time || null, title, kind: 'custom' } });
    setTitle(''); setTime('');
    await s.reloadEvents();
  };

  return (
    <div className="page">
      <Header title={t('calendar')} back />
      <section className="card">
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
          <h3>{month.toLocaleDateString(ro ? 'ro-RO' : 'en-GB', { month: 'long', year: 'numeric' })}</h3>
          <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
        </div>
        <div className="cal-grid">
          {wd.map((w, i) => <span key={i} className="cal-wd">{w}</span>)}
          {cells.map((c, i) => {
            if (!c) return <span key={i} />;
            const k = ymd(c);
            const log = s.days[k];
            const planned = s.profile.trainingDays.includes(c.getDay());
            const done = !!log?.workout_done;
            const moved = !!log && (log.moves.length > 0 || log.steps >= 7000);
            const ev = s.events.some((e) => e.date === k);
            return (
              <button key={i} className={'cal-day' + (k === today ? ' now' : '') + (done ? ' done' : planned && k >= today ? ' planned' : '')} onClick={() => setSel(k)}>
                {c.getDate()}
                <span className="dots">{moved && <i className="d2" />}{ev && <i className="d3" />}</span>
              </button>
            );
          })}
        </div>
        <div className="legend small muted">
          <span><i className="lg-done" /> {t('completed')}</span><span><i className="lg-plan" /> {t('planned')}</span><span><i className="d2" /> {t('move')}</span><span><i className="d3" /> {ro ? 'eveniment' : 'event'}</span>
        </div>
      </section>

      <section className="card">
        <h3>🔗 {t('googleCal')}</h3>
        <p className="small muted">{t('googleCalText')}</p>
        <div className="copy-row">
          <input className="input" readOnly value={feed} onFocus={(e) => e.target.select()} />
          <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(feed); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? t('copied') : t('copy')}</button>
        </div>
      </section>
      <Disclaimer />

      {sel && (
        <Sheet open onClose={() => setSel(null)} title={new Date(sel + 'T12:00').toLocaleDateString(ro ? 'ro-RO' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}>
          {(() => {
            const log = s.days[sel];
            return (
              <ul className="ing">
                {log?.workout_done ? <li><span>💪 {t('train')}</span><b>{log.workout_minutes} min</b></li> : null}
                {log?.steps ? <li><span>👟 {t('steps')}</span><b>{log.steps}</b></li> : null}
                {log?.water_ml ? <li><span>💧 {t('water')}</span><b>{(log.water_ml / 1000).toFixed(1)} L</b></li> : null}
                {s.events.filter((e) => e.date === sel).map((e) => (
                  <li key={e.id}><span>📌 {e.time ? e.time + ' · ' : ''}{e.title}</span>
                    <button className="x" onClick={async () => { await api('/events/' + e.id, { method: 'DELETE' }); s.reloadEvents(); }}>×</button></li>
                ))}
              </ul>
            );
          })()}
          <h3>{t('addEvent')}</h3>
          <input className="input" placeholder={t('eventTitle')} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <button className="btn full" onClick={addEvent}>{t('add')}</button>
        </Sheet>
      )}
    </div>
  );
}
