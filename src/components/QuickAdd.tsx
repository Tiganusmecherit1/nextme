// One place to log anything quickly: water, steps, weight, a plate photo, or any other activity.
import { useState } from 'react';
import { useStore } from '../store';
import { api, type FoodEntry } from '../api';
import { todayStr } from '../calc';
import { getLang } from '../i18n';
import { withMove } from '../activity';
import { NumberPrompt, Sheet, go } from './ui';
import { PlateScan } from '../screens/Meals';

type Mode = null | 'menu' | 'steps' | 'weight' | 'activity' | 'photo';

export function QuickAdd() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const [mode, setMode] = useState<Mode>(null);
  const [toast, setToast] = useState('');
  const today = todayStr();
  const d = s.day(today);
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1800); };
  const water = (ml: number) => { s.patchDay(today, { water_ml: d.water_ml + ml }); setMode(null); flash(`💧 +${ml} ml`); };

  const items: [string, string, () => void][] = [
    ['💧', '+250 ml', () => water(250)],
    ['💧', '+500 ml', () => water(500)],
    ['👟', ro ? 'Pași' : 'Steps', () => setMode('steps')],
    ['⚖️', ro ? 'Greutate' : 'Weight', () => setMode('weight')],
    ['📸', ro ? 'Poză farfurie' : 'Plate photo', () => setMode('photo')],
    ['🏃', ro ? 'Altă activitate' : 'Other activity', () => setMode('activity')],
    ['🍽', ro ? 'Masă din plan' : 'Planned meal', () => { setMode(null); go('#/meals'); }],
  ];

  return (
    <>
      <button className="fab" aria-label={ro ? 'Notează rapid' : 'Quick log'} onClick={() => setMode('menu')}>+</button>
      {toast && <div className="toast" role="status">{toast}</div>}
      {mode === 'menu' && (
        <Sheet open onClose={() => setMode(null)} title={ro ? 'Notează rapid' : 'Quick log'}>
          <div className="quick-grid">
            {items.map(([icon, label, fn]) => (
              <button key={label} className="quick-item" onClick={fn}><span>{icon}</span><b>{label}</b></button>
            ))}
          </div>
        </Sheet>
      )}
      {mode === 'steps' && (
        <NumberPrompt label={ro ? 'Pașii de azi (total)' : 'Today’s steps (total)'} initial={d.steps} onClose={() => setMode(null)}
          onSave={(n) => { s.patchDay(today, { steps: n }); flash(`👟 ${n.toLocaleString()}`); }} />
      )}
      {mode === 'weight' && (
        <NumberPrompt decimal label={ro ? 'Greutatea de azi (kg)' : 'Today’s weight (kg)'} initial={s.profile.weightKg} onClose={() => setMode(null)}
          onSave={async (kg) => {
            if (!kg || kg < 30 || kg > 300) return;
            await api('/measurements', { method: 'POST', body: { date: today, weight: kg } });
            await s.saveProfile({ ...s.profile, weightKg: kg });
            s.reloadMeasurements().catch(() => {});
            flash(`⚖️ ${kg} kg`);
          }} />
      )}
      {mode === 'activity' && (
        <NumberPrompt label={ro ? 'Minute de mișcare (mers, bicicletă, sport…)' : 'Minutes of activity (walk, bike, sport…)'} onClose={() => setMode(null)}
          onSave={(min) => { if (min > 0) { s.patchDay(today, { moves: withMove(d, 'act', Math.min(min, 300)) }); flash(`🏃 +${min} min`); } }} />
      )}
      {mode === 'photo' && (
        <Sheet open onClose={() => setMode(null)}>
          <PlateScan onAdd={(items: FoodEntry[]) => { s.patchDay(today, { foods: [...d.foods, ...items] }); setMode(null); flash(ro ? '🍽 Adăugat' : '🍽 Added'); }} />
        </Sheet>
      )}
    </>
  );
}
