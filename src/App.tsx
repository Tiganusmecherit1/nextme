import { SyncScreen } from './screens/Sync';
import { WorkoutPlayer } from './screens/Workout';
import { IntervalTimer } from './screens/Timer';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import type { Profile } from './calc';
import { todayStr } from './calc';
import { setLang, t } from './i18n';
import { StoreProvider, useStore } from './store';
import { Auth } from './screens/Auth';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { Train, ExerciseDetail } from './screens/Train';
import { Move, RoutinePlayer } from './screens/Move';
import { Meals } from './screens/Meals';
import { Calendar } from './screens/Calendar';
import { Learn, LessonView, Supplements } from './screens/Learn';
import { Progress } from './screens/Progress';
import { ProfileScreen } from './screens/Profile';
import { CheckIn } from './screens/CheckIn';
import { startReminderLoop } from './reminders';

type Me = { user: { username: string; icsToken: string }; profile: Profile | null; ai: { used: number; limit: number } };

function useHash() {
  const [h, setH] = useState(location.hash || '#/today');
  useEffect(() => {
    const on = () => { setH(location.hash || '#/today'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return h;
}

export default function App() {
  const [me, setMe] = useState<Me | null | 'anon'>(null);
  const [redo, setRedo] = useState(false);

  const load = () =>
    api<Me>('/me')
      .then((m) => { if (m.profile) setLang(m.profile.lang); setMe(m); })
      .catch((e) => setMe(e instanceof ApiError && e.status === 401 ? 'anon' : 'anon'));
  useEffect(() => { load(); }, []);

  if (me === null) return <div className="splash"><div className="logo-big">Next<span>Me</span></div></div>;
  if (me === 'anon') return <Auth onDone={load} />;
  if (!me.profile || redo)
    return (
      <Onboarding initial={me.profile} onDone={async (p) => {
        await api('/profile', { method: 'PUT', body: p });
        setRedo(false);
        setMe({ ...me, profile: p });
        location.hash = '#/today';
      }} />
    );

  return (
    <StoreProvider key={me.user.username} username={me.user.username} icsToken={me.user.icsToken} profile={me.profile} ai={me.ai}
      onProfile={(p) => setMe({ ...me, profile: p })} onLogout={() => setMe('anon')}>
      <Shell onRedo={() => setRedo(true)} />
    </StoreProvider>
  );
}

function Shell({ onRedo }: { onRedo: () => void }) {
  const hash = useHash();
  const s = useStore();
  const ref = useRef({ water: 0, goal: 2000 });
  ref.current = { water: s.day(todayStr()).water_ml, goal: s.targets.waterMl };
  useEffect(() => { const id = startReminderLoop(() => ref.current); return () => clearInterval(id); }, []);

  const [, route, arg] = hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/) || [];
  let screen;
  switch (route) {
    case 'train': screen = <Train />; break;
    case 'exercise': screen = <ExerciseDetail id={arg} />; break;
    case 'move': screen = <Move />; break;
    case 'routine': screen = <RoutinePlayer id={arg} />; break;
    case 'meals': screen = <Meals />; break;
    case 'calendar': screen = <Calendar />; break;
    case 'learn': screen = <Learn />; break;
    case 'lesson': screen = <LessonView id={arg} />; break;
    case 'supplements': screen = <Supplements />; break;
    case 'progress': screen = <Progress />; break;
    case 'profile': screen = <ProfileScreen onRedo={onRedo} />; break;
    case 'checkin': screen = <CheckIn />; break;
    case 'sync': screen = <SyncScreen />; break;
    case 'workout': screen = <WorkoutPlayer sessKey={arg} />; break;
    case 'timer': screen = <IntervalTimer />; break;
    default: screen = <Today />;
  }
  const tab = ['train', 'exercise', 'workout'].includes(route) ? 'train' : ['move', 'routine', 'timer'].includes(route) ? 'move' : route === 'meals' ? 'meals'
    : ['learn', 'lesson', 'supplements'].includes(route) ? 'learn' : 'today';
  const tabs: [string, string, string][] = [
    ['today', '◎', t('today')], ['train', '🏋', t('train')], ['move', '⚡', t('move')], ['meals', '🍽', t('meals')], ['learn', '📚', t('learn')],
  ];
  return (
    <>
      <main>{screen}</main>
      <nav className="tabbar">
        {tabs.map(([k, icon, label]) => (
          <a key={k} href={'#/' + k} className={tab === k ? 'on' : ''}><span className="ti">{icon}</span><span>{label}</span></a>
        ))}
      </nav>
    </>
  );
}
