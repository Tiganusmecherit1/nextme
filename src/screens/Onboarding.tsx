import { useState } from 'react';
import { bmi, bmr, calorieTarget, macros, tdee, waterGoalMl, type Profile } from '../calc';
import { HOME_EQUIPMENT } from '../data/exercises';
import { getLang, setLang, t, type Key } from '../i18n';
import { Chips } from '../components/ui';

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const dayName = (d: number) =>
  (getLang() === 'ro' ? ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])[d];

export function defaultProfile(): Profile {
  return {
    lang: getLang(), name: '', sex: 'male', birthYear: 1990, heightCm: 175, weightKg: 80, activity: 'light', goal: 'wellness',
    level: 'beginner', location: 'gym', homeEquipment: [], gymEquipment: [], trainingDays: [1, 3, 5], trainingTime: '18:00',
    sessionMinutes: 45, injuries: [], conditions: [], diet: 'omnivore', allergies: [], sleepHours: 7, disclaimerAccepted: false,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

type Setter = <K extends keyof Profile>(k: K, v: Profile[K]) => void;
export interface FieldProps { p: Profile; set: Setter; setP: (f: (x: Profile) => Profile) => void }
const year = () => new Date().getFullYear();
const opt = <T extends string>(prefix: string, vals: readonly T[]) => vals.map((v) => ({ v, label: t((prefix + v) as Key) }));

/* ---- Field groups, shared by onboarding and the profile editor ---- */

export function GoalFields({ p, setP }: FieldProps) {
  return (<>
    <label className="lbl">{t('goal')}</label>
    <Chips options={opt('goal_', ['wellness', 'fat_loss', 'muscle', 'bodybuilding', 'strength_home'] as const)} value={p.goal}
      onChange={(v) => setP((x) => ({ ...x, goal: v, location: v === 'strength_home' ? 'home' : x.location }))} />
  </>);
}

export function BodyFields({ p, set }: FieldProps) {
  return (<>
    <label className="lbl">{t('sex')}</label>
    <Chips options={[{ v: 'male', label: t('male') }, { v: 'female', label: t('female') }]} value={p.sex} onChange={(v) => set('sex', v)} />
    <div className="grid2">
      <div><label className="lbl">{t('birthYear')}</label>
        <input className="input" type="number" min={year() - 100} max={year() - 14} value={p.birthYear} onChange={(e) => set('birthYear', Number(e.target.value))} /></div>
      <div><label className="lbl">{t('height')}</label>
        <input className="input" type="number" min={120} max={230} value={p.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))} /></div>
      <div><label className="lbl">{t('weight')}</label>
        <input className="input" type="number" min={35} max={300} step="0.1" value={p.weightKg} onChange={(e) => set('weightKg', Number(e.target.value))} /></div>
      <div><label className="lbl">{t('targetWeight')}</label>
        <input className="input" type="number" min={35} max={300} step="0.1" value={p.targetWeightKg ?? ''} onChange={(e) => set('targetWeightKg', e.target.value ? Number(e.target.value) : undefined)} /></div>
    </div>
    <label className="lbl">{t('activity')}</label>
    <Chips options={opt('act_', ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const)} value={p.activity} onChange={(v) => set('activity', v)} />
  </>);
}

export function TrainingFields({ p, set }: FieldProps) {
  return (<>
    <label className="lbl">{t('level')}</label>
    <Chips options={opt('lvl_', ['beginner', 'intermediate', 'advanced'] as const)} value={p.level} onChange={(v) => set('level', v)} />
    <label className="lbl">{t('where')}</label>
    <Chips options={[{ v: 'gym', label: t('gym') }, { v: 'home', label: t('home') }]} value={p.location} onChange={(v) => set('location', v)} />
    {p.location === 'home' && (<>
      <label className="lbl">{t('homeEq')}</label>
      <Chips multi options={HOME_EQUIPMENT.map((e) => ({ v: e.id, label: e[getLang()] }))} value={p.homeEquipment} onChange={(v) => set('homeEquipment', v)} />
    </>)}
    <label className="lbl">{t('days')}</label>
    <Chips multi options={WEEK.map((d) => ({ v: d, label: dayName(d) }))} value={p.trainingDays} onChange={(v) => set('trainingDays', v)} />
    <div className="grid2">
      <div><label className="lbl">{t('time')}</label>
        <input className="input" type="time" value={p.trainingTime} onChange={(e) => set('trainingTime', e.target.value)} /></div>
    </div>
    <label className="lbl">{t('sessionLen')}</label>
    <Chips options={[20, 30, 45, 60, 75].map((v) => ({ v, label: v + ' min' }))} value={p.sessionMinutes} onChange={(v) => set('sessionMinutes', v)} />
  </>);
}

export function HealthFields({ p, set }: FieldProps) {
  return (<>
    <label className="lbl">{t('injuries')}</label>
    <Chips multi options={opt('inj_', ['knee', 'lower_back', 'shoulder', 'wrist', 'neck', 'hip'])} value={p.injuries} onChange={(v) => set('injuries', v)} />
    <label className="lbl">{t('conditions')}</label>
    <Chips multi options={opt('cond_', ['prediabetes', 'diabetes_t2', 'hypertension', 'heart', 'kidney', 'thyroid', 'osteoporosis', ...(p.sex === 'female' ? ['pregnancy'] : [])])} value={p.conditions} onChange={(v) => set('conditions', v)} />
    <p className="small muted">{getLang() === 'ro' ? 'Dacă nu ai nimic, lasă necompletat.' : 'If none, leave empty.'}</p>
    <label className="lbl">{t('sleep')}</label>
    <Chips options={[5, 6, 7, 8, 9].map((v) => ({ v, label: v + (v === 9 ? '+' : '') + ' h' }))} value={p.sleepHours} onChange={(v) => set('sleepHours', v)} />
  </>);
}

export function DietFields({ p, set }: FieldProps) {
  return (<>
    <label className="lbl">{t('diet')}</label>
    <Chips options={opt('diet_', ['omnivore', 'vegetarian', 'pescatarian', 'vegan', 'fasting', 'fasting_fish'] as const)} value={p.diet} onChange={(v) => set('diet', v)} />
    <label className="lbl">{t('allergies')}</label>
    <Chips multi options={opt('al_', ['gluten', 'lactose', 'nuts', 'egg', 'fish'])} value={p.allergies} onChange={(v) => set('allergies', v)} />
  </>);
}

/**
 * Onboarding: only what the plan needs on day one (goal, body, training, disclaimer), then "Your plan".
 * Health and diet details are asked later, when they first matter (before the first workout / on Meals).
 */
export function Onboarding({ initial, onDone }: { initial?: Profile | null; onDone: (p: Profile) => Promise<void> }) {
  const [p, setP] = useState<Profile>(initial ?? { ...defaultProfile(), asked: [] });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const set: Setter = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const fp = { p, set, setP };

  const steps = [
    <div key="0">
      <h2>{t('obWelcome')}</h2>
      <p className="muted">{t('obWelcomeText')}</p>
      <label className="lbl">{t('language')}</label>
      <Chips options={[{ v: 'ro', label: 'Română' }, { v: 'en', label: 'English' }]} value={p.lang} onChange={(v: 'ro' | 'en') => { setLang(v); set('lang', v); }} />
      <label className="lbl">{t('name')}</label>
      <input className="input" value={p.name} onChange={(e) => set('name', e.target.value.slice(0, 30))} />
      <GoalFields {...fp} />
    </div>,
    <div key="1"><h2>{getLang() === 'ro' ? 'Despre corpul tău' : 'About your body'}</h2><BodyFields {...fp} /></div>,
    <div key="2"><h2>{getLang() === 'ro' ? 'Cum te antrenezi' : 'How you train'}</h2><TrainingFields {...fp} /></div>,
    <div key="3">
      <h2>{t('disclaimerTitle')}</h2>
      <div className="disclaimer-box">{t('disclaimerFull').split('\n\n').map((x, i) => <p key={i}>{x}</p>)}</div>
    </div>,
    <Summary key="4" p={p} />,
  ];

  const last = steps.length - 1;
  const canNext = step !== 2 || p.trainingDays.length > 0;
  const next = async () => {
    if (step === 3) setP((x) => ({ ...x, disclaimerAccepted: true }));
    if (step < last) return setStep(step + 1);
    setBusy(true);
    try { await onDone({ ...p, disclaimerAccepted: true }); } finally { setBusy(false); }
  };

  return (
    <div className="onb">
      <div className="onb-progress"><div style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <div className="onb-body">{steps[step]}</div>
      <div className="onb-actions">
        {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>{t('back')}</button>}
        <button className="btn" disabled={!canNext || busy} onClick={next}>
          {step === 3 ? t('accept') : step === last ? t('start') : t('continue')}
        </button>
      </div>
    </div>
  );
}

function Summary({ p }: { p: Profile }) {
  const m = macros(p);
  return (
    <div>
      <h2>{t('yourPlan')}</h2>
      <div className="stats">
        <div className="stat"><b>{calorieTarget(p)}</b><span>kcal / {getLang() === 'ro' ? 'zi' : 'day'}</span></div>
        <div className="stat"><b>{(waterGoalMl(p) / 1000).toFixed(1)} L</b><span>{t('water')}</span></div>
        <div className="stat"><b>{m.protein} g</b><span>{t('protein')}</span></div>
        <div className="stat"><b>{m.fiber} g</b><span>{t('fiber')}</span></div>
      </div>
      <ul className="facts">
        <li>{t('bmr')}: <b>{bmr(p)} kcal</b> (Mifflin-St Jeor)</li>
        <li>{t('tdee')}: <b>{tdee(p)} kcal</b></li>
        <li>{t('bmi')}: <b>{bmi(p)}</b></li>
        <li>{t('carbs')} {m.carbs} g · {t('fat')} {m.fat} g</li>
      </ul>
      {p.conditions.length > 0 && <p className="warn">⚠︎ {t('medicalNote')}</p>}
      <h3>{getLang() === 'ro' ? 'Ce urmează' : 'What happens next'}</h3>
      <ul className="facts">
        <li>{getLang() === 'ro' ? `Program de 8 săptămâni, ${p.trainingDays.length} zile pe săptămână, la ${p.trainingTime}.` : `An 8-week program, ${p.trainingDays.length} days a week, at ${p.trainingTime}.`}</li>
        <li>{getLang() === 'ro' ? 'Pe ecranul Azi vezi mereu un singur „Următorul pas”. Primul: evaluarea de start (2 minute).' : 'The Today screen always shows one “Next up”. The first: a 2-minute starting check-in.'}</li>
        <li>{getLang() === 'ro' ? 'Accidentările și dieta ți le cer când contează: înainte de primul antrenament și la Mese.' : 'I’ll ask about injuries and diet when they matter: before your first workout and on Meals.'}</li>
      </ul>
    </div>
  );
}
