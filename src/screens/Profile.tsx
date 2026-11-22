import { useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { getLang, t } from '../i18n';
import { Chips, Disclaimer, go, Header, Sheet } from '../components/ui';
import { enableReminders, remindersEnabled } from '../reminders';
import { APK_URL, inAndroidApp } from './Sync';

export function ProfileScreen({ onRedo }: { onRedo: () => void }) {
  const s = useStore();
  const [disc, setDisc] = useState(false);
  const [rem, setRem] = useState(remindersEnabled());
  const lang = getLang();
  return (
    <div className="page">
      <Header title={t('profile')} back />
      <section className="card profile-head">
        <div className="avatar big">{(s.profile.name || s.username)[0]?.toUpperCase()}</div>
        <div><h2>{s.profile.name || s.username}</h2><p className="muted small">@{s.username}</p></div>
      </section>
      <button className="card list-item" onClick={() => go('#/progress')}><span className="emoji">📈</span><div><b>{t('progress')}</b></div><span className="chev">›</span></button>
      <button className="card list-item" onClick={() => go('#/calendar')}><span className="emoji">📅</span><div><b>{t('calendar')}</b><p className="small muted">{t('googleCal')}</p></div><span className="chev">›</span></button>
      <button className="card list-item" onClick={() => go('#/sync')}><span className="emoji">⌚</span><div><b>{lang === 'ro' ? 'Ceas și telefon' : 'Watch & phone'}</b><p className="small muted">{lang === 'ro' ? 'Pași și puls automat (Apple Health, Health Connect)' : 'Automatic steps and heart rate (Apple Health, Health Connect)'}</p></div><span className="chev">›</span></button>
      <section className="card">
        <h3>💧 {t('reminders')}</h3>
        <p className="small muted">{t('remindersOn')}</p>
        {rem ? <p className="ok">✓ {lang === 'ro' ? 'Active' : 'On'}</p>
          : <button className="btn sm" onClick={async () => setRem(await enableReminders())}>{t('enable')}</button>}
      </section>
      <section className="card">
        <h3>{t('language')}</h3>
        <Chips options={[{ v: 'ro', label: 'Română' }, { v: 'en', label: 'English' }]} value={s.profile.lang} onChange={(v: 'ro' | 'en') => s.saveProfile({ ...s.profile, lang: v })} />
      </section>
      <section className="card">
        <h3>📲 {t('install')}</h3>
        <p className="small muted">{t('installIos')}</p>
        {!inAndroidApp() && <p className="small"><a href={APK_URL}>🤖 {lang === 'ro' ? 'Android: descarcă aplicația NextMe (cu pași automați)' : 'Android: download the NextMe app (with automatic steps)'}</a></p>}
      </section>
      <button className="btn full ghost" onClick={onRedo}>{t('editProfile')}</button>
      <button className="btn full ghost" onClick={() => setDisc(true)}>{t('disclaimerTitle')}</button>
      <button className="btn full ghost" onClick={s.logout}>{t('logout')}</button>
      <button className="link danger" onClick={async () => { if (confirm(t('confirmDelete'))) { await api('/account', { method: 'DELETE' }); location.reload(); } }}>{t('deleteAccount')}</button>
      <Disclaimer />
      {disc && <Sheet open onClose={() => setDisc(false)} title={t('disclaimerTitle')}>{t('disclaimerFull').split('\n\n').map((x, i) => <p key={i}>{x}</p>)}</Sheet>}
    </div>
  );
}
