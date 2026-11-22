import { useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { ageOf, todayStr, type Profile } from '../calc';
import { getLang, t, type Key } from '../i18n';
import { Chips, Disclaimer, go, Header, Sheet } from '../components/ui';
import { disableReminders, enableReminders, remindersEnabled, type EnableResult } from '../reminders';
import { stepGoal } from '../activity';
import { APK_URL, inAndroidApp } from './Sync';
import { BodyFields, DietFields, GoalFields, HealthFields, TrainingFields, type FieldProps } from './Onboarding';

type Section = 'goal' | 'body' | 'training' | 'health' | 'diet' | 'steps';
const SECTIONS: Section[] = ['goal', 'body', 'training', 'health', 'diet', 'steps'];

/** Profile = settings. Every group of details is edited on its own, without redoing the onboarding. */
export function ProfileScreen({ open }: { open?: string }) {
  const s = useStore();
  const [disc, setDisc] = useState(false);
  const [rem, setRem] = useState(remindersEnabled());
  const [remMsg, setRemMsg] = useState<Exclude<EnableResult, 'on'> | null>(null);
  const [edit, setEdit] = useState<Section | null>(SECTIONS.includes(open as Section) ? (open as Section) : null);
  const ro = getLang() === 'ro';
  const p = s.profile;
  const list = (xs: string[], prefix: string) => (xs.length ? xs.map((x) => t((prefix + x) as Key)).join(', ') : ro ? 'nimic declarat' : 'none');

  const rows: [Section, string, string, string][] = [
    ['goal', '🎯', ro ? 'Nume și obiectiv' : 'Name and goal', `${p.name || s.username} · ${t(('goal_' + p.goal) as Key)}`],
    ['body', '⚖️', ro ? 'Corp și activitate' : 'Body and activity', `${p.weightKg} kg · ${p.heightCm} cm · ${ageOf(p)} ${ro ? 'ani' : 'yrs'}`],
    ['training', '🏋️', ro ? 'Antrenament' : 'Training', `${p.trainingDays.length}× / ${ro ? 'săpt.' : 'week'} · ${p.sessionMinutes} min · ${p.location === 'gym' ? t('gym') : t('home')} · ${p.trainingTime}`],
    ['health', '🩹', ro ? 'Sănătate și somn' : 'Health and sleep', `${list([...p.injuries.map((x) => 'inj_' + x), ...p.conditions.map((x) => 'cond_' + x)], '')} · ${p.sleepHours} h`],
    ['diet', '🥗', ro ? 'Alimentație' : 'Diet', `${t(('diet_' + p.diet) as Key)}${p.allergies.length ? ' · ' + list(p.allergies, 'al_') : ''}`],
    ['steps', '👟', ro ? 'Ținta de pași' : 'Step goal', `${stepGoal(p).toLocaleString()} ${ro ? 'pe zi' : 'a day'}${p.stepGoal ? '' : ro ? ' (după vârstă)' : ' (by age)'}`],
  ];

  return (
    <div className="page">
      <Header title={t('profile')} back />
      <section className="card profile-head">
        <div className="avatar big">{(p.name || s.username)[0]?.toUpperCase()}</div>
        <div><h2>{p.name || s.username}</h2><p className="small muted">@{s.username}</p></div>
      </section>

      <h2 className="section-title">{ro ? 'Datele mele' : 'My details'}</h2>
      <section className="card group">
        {rows.map(([k, icon, title, sub]) => (
          <button key={k} className="list-item group-row" onClick={() => setEdit(k)}>
            <span className="emoji">{icon}</span>
            <div><b>{title}</b><p className="small muted">{sub}</p></div>
            <span className="chev">›</span>
          </button>
        ))}
      </section>

      <h2 className="section-title">{ro ? 'Setări' : 'Settings'}</h2>
      <button className="card list-item" onClick={() => go('#/sync')}><span className="emoji">⌚</span><div><b>{ro ? 'Ceas și telefon' : 'Watch & phone'}</b><p className="small muted">{ro ? 'Pași și puls automat (Apple Health, Health Connect)' : 'Automatic steps and heart rate (Apple Health, Health Connect)'}</p></div><span className="chev">›</span></button>
      <section className="card">
        <h3>💧 {t('reminders')}</h3>
        <p className="small muted">{t('remindersOn')}</p>
        {rem ? <p className="ok">✓ {ro ? 'Active' : 'On'} · <button className="link" style={{ width: 'auto', padding: 0 }} onClick={() => { disableReminders(); setRem(false); }}>{ro ? 'Oprește' : 'Turn off'}</button></p>
          : <button className="btn sm" onClick={async () => { const r = await enableReminders(); setRem(r === 'on'); setRemMsg(r === 'on' ? null : r); }}>{t('enable')}</button>}
        {remMsg && <p className="small warn-t">{{
          denied: ro ? 'Notificările sunt blocate. Deschide Setări telefon → Aplicații → NextMe (sau browserul) → Notificări → Permite, apoi apasă din nou Activează.' : 'Notifications are blocked. Open phone Settings → Apps → NextMe (or your browser) → Notifications → Allow, then tap Enable again.',
          update_app: ro ? 'Ai o versiune mai veche a aplicației Android. Descarcă versiunea nouă de mai jos și instalează-o peste cea veche.' : 'Your Android app is an older version. Download the new one below and install it over the old one.',
          ios_install: ro ? 'Pe iPhone, notificările merg doar dacă adaugi NextMe pe ecranul principal (Safari → Partajează → Adaugă pe ecranul principal) și îl deschizi de acolo.' : 'On iPhone, notifications only work after you add NextMe to the Home Screen (Safari → Share → Add to Home Screen) and open it from there.',
          unsupported: ro ? 'Browserul acesta nu permite notificări. Încearcă aplicația Android sau Chrome.' : 'This browser does not support notifications. Try the Android app or Chrome.',
        }[remMsg]}{remMsg === 'update_app' && <> <a href={APK_URL}>{ro ? 'Descarcă NextMe.apk' : 'Download NextMe.apk'}</a></>}</p>}
      </section>
      <section className="card">
        <h3>{t('language')}</h3>
        <Chips options={[{ v: 'ro', label: 'Română' }, { v: 'en', label: 'English' }]} value={p.lang} onChange={(v: 'ro' | 'en') => s.saveProfile({ ...p, lang: v })} />
      </section>
      <section className="card">
        <h3>📲 {t('install')}</h3>
        <p className="small muted">{t('installIos')}</p>
        {!inAndroidApp() && <p className="small"><a href={APK_URL}>🤖 {ro ? 'Android: descarcă aplicația NextMe (cu pași automați)' : 'Android: download the NextMe app (with automatic steps)'}</a></p>}
      </section>
      <button className="btn full ghost" onClick={() => setDisc(true)}>{t('disclaimerTitle')}</button>
      <button className="btn full ghost" onClick={s.logout}>{t('logout')}</button>
      <button className="link danger" onClick={async () => { if (confirm(t('confirmDelete'))) { await api('/account', { method: 'DELETE' }); location.reload(); } }}>{t('deleteAccount')}</button>
      <Disclaimer />
      {disc && <Sheet open onClose={() => setDisc(false)} title={t('disclaimerTitle')}>{t('disclaimerFull').split('\n\n').map((x, i) => <p key={i}>{x}</p>)}</Sheet>}
      {edit && <EditSheet section={edit} title={rows.find((r) => r[0] === edit)![2]} onClose={() => setEdit(null)} />}
    </div>
  );
}

/** Edits one group of profile fields. Also used from other screens to ask a missing detail when it first matters. */
export function EditSheet({ section, title, onClose }: { section: Section; title: string; onClose: () => void }) {
  const s = useStore();
  const ro = getLang() === 'ro';
  const [p, setP0] = useState<Profile>(s.profile);
  const [busy, setBusy] = useState(false);
  const setP = (f: (x: Profile) => Profile) => setP0(f);
  const fp: FieldProps = { p, set: (k, v) => setP0((x) => ({ ...x, [k]: v })), setP };
  const valid = section !== 'training' || p.trainingDays.length > 0;

  const save = async () => {
    setBusy(true);
    try {
      const asked = p.asked && ['health', 'diet'].includes(section) && !p.asked.includes(section) ? [...p.asked, section] : p.asked;
      await s.saveProfile({ ...p, asked });
      if (section === 'body' && p.weightKg !== s.profile.weightKg) {
        await api('/measurements', { method: 'POST', body: { date: todayStr(), weight: p.weightKg } }).catch(() => {});
        s.reloadMeasurements().catch(() => {});
      }
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} title={title}>
      {section === 'goal' && (<>
        <label className="lbl">{t('name')}</label>
        <input className="input" value={p.name} onChange={(e) => fp.set('name', e.target.value.slice(0, 30))} />
        <GoalFields {...fp} />
      </>)}
      {section === 'body' && <BodyFields {...fp} />}
      {section === 'training' && (<>
        <TrainingFields {...fp} />
        <p className="small muted">{ro ? 'Planul se reface pe loc. Ciclul de 8 săptămâni continuă de unde ai rămas.' : 'Your plan updates right away. The 8-week cycle continues where you are.'}</p>
      </>)}
      {section === 'health' && <HealthFields {...fp} />}
      {section === 'diet' && <DietFields {...fp} />}
      {section === 'steps' && (<>
        <p className="small muted">{ro
          ? 'Implicit: 8.000 pași/zi sub 60 de ani, 7.000 peste 60. Beneficiul pentru mortalitate se plafonează în jur de 8.000–10.000, respectiv 6.000–8.000 (Paluch et al., Lancet Public Health 2022).'
          : 'Default: 8,000 steps/day under 60, 7,000 from 60. The mortality benefit levels off around 8,000–10,000 and 6,000–8,000 respectively (Paluch et al., Lancet Public Health 2022).'}</p>
        <Chips options={[0, 6000, 7000, 8000, 10000, 12000].map((v) => ({ v, label: v ? v.toLocaleString() : ro ? 'După vârstă' : 'By age' }))}
          value={p.stepGoal ?? 0} onChange={(v: number) => setP0((x) => ({ ...x, stepGoal: v || undefined }))} />
      </>)}
      <div className="row gap sheet-actions">
        <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        <button className="btn" disabled={busy || !valid} onClick={save}>{t('save')}</button>
      </div>
    </Sheet>
  );
}
