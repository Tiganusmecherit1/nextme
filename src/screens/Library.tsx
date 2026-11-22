import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { getLang, L } from '../i18n';
import { Disclaimer, go, Header } from '../components/ui';
import { Figure } from '../components/Figure';
import { EXERCISES, type Exercise, type Slot } from '../data/exercises';
import { availableEquipment } from '../plan';

export const GROUPS: { id: string; ro: string; en: string; slots: Slot[] }[] = [
  { id: 'legs', ro: 'Picioare', en: 'Legs', slots: ['squat', 'lunge', 'quads', 'hamstrings', 'calves'] },
  { id: 'glutes', ro: 'Fesieri și lombari', en: 'Glutes & lower back', slots: ['glutes', 'hinge'] },
  { id: 'chest', ro: 'Piept', en: 'Chest', slots: ['push_h', 'chest_iso'] },
  { id: 'back', ro: 'Spate', en: 'Back', slots: ['pull_h', 'pull_v'] },
  { id: 'shoulders', ro: 'Umeri', en: 'Shoulders', slots: ['push_v', 'shoulders'] },
  { id: 'arms', ro: 'Brațe', en: 'Arms', slots: ['biceps', 'triceps'] },
  { id: 'core', ro: 'Abdomen și core', en: 'Abs & core', slots: ['core'] },
  { id: 'balance', ro: 'Echilibru', en: 'Balance', slots: ['balance'] },
];
const FREE = ['dumbbells', 'barbell', 'kettlebell', 'band', 'flat_bench', 'pullup_bar', 'squat_rack', 'adjustable_bench', 'none'];
const EQUIP: { id: string; ro: string; en: string; test: (e: Exercise) => boolean }[] = [
  { id: 'none', ro: 'Fără echipament', en: 'No equipment', test: (e) => e.equip.every((q) => q === 'none') },
  { id: 'dumbbells', ro: 'Gantere', en: 'Dumbbells', test: (e) => e.equip.includes('dumbbells') },
  { id: 'barbell', ro: 'Bară', en: 'Barbell', test: (e) => e.equip.some((q) => ['barbell', 'smith_machine'].includes(q)) },
  { id: 'kettlebell', ro: 'Kettlebell', en: 'Kettlebell', test: (e) => e.equip.includes('kettlebell') },
  { id: 'band', ro: 'Elastic', en: 'Band', test: (e) => e.equip.includes('band') },
  { id: 'machine', ro: 'Aparate', en: 'Machines', test: (e) => e.equip.some((q) => !FREE.includes(q)) },
];
const LEVELS = [{ v: 1, ro: 'Începător', en: 'Beginner' }, { v: 2, ro: 'Mediu', en: 'Intermediate' }, { v: 3, ro: 'Avansat', en: 'Advanced' }];

export function Library() {
  const s = useStore();
  const ro = getLang() === 'ro';
  const lang = getLang();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [equip, setEquip] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [mine, setMine] = useState(true);
  const avail = useMemo(() => availableEquipment(s.profile), [s.profile]);

  const list = useMemo(() => EXERCISES.filter((e) => {
    if (q && !(e.name.ro + ' ' + e.name.en + ' ' + e.muscles.ro + ' ' + e.muscles.en).toLowerCase().includes(q.toLowerCase())) return false;
    if (group && !GROUPS.find((g) => g.id === group)!.slots.includes(e.slot)) return false;
    if (equip && !EQUIP.find((x) => x.id === equip)!.test(e)) return false;
    if (level && e.level !== level) return false;
    if (mine && (!e.equip.every((x) => avail.has(x)) || e.avoid.some((a) => s.profile.injuries.includes(a)))) return false;
    return true;
  }), [q, group, equip, level, mine, avail, s.profile.injuries]);

  const chip = (on: boolean, label: string, onClick: () => void, key: string) => <button key={key} className={'chip' + (on ? ' on' : '')} onClick={onClick}>{label}</button>;

  return (
    <div className="page">
      <Header title={ro ? 'Exerciții' : 'Exercises'} back />
      <input className="input" placeholder={ro ? 'Caută (ex. planșă, umeri)' : 'Search (e.g. plank, shoulders)'} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips scroll-x">
        {chip(mine, ro ? '✓ Potrivite pentru mine' : '✓ Right for me', () => setMine(!mine), 'mine')}
        {LEVELS.map((l) => chip(level === l.v, l[lang], () => setLevel(level === l.v ? null : l.v), 'l' + l.v))}
      </div>
      <div className="chips scroll-x">{GROUPS.map((g) => chip(group === g.id, g[lang], () => setGroup(group === g.id ? null : g.id), g.id))}</div>
      <div className="chips scroll-x">{EQUIP.map((x) => chip(equip === x.id, x[lang], () => setEquip(equip === x.id ? null : x.id), x.id))}</div>
      <p className="small muted">{list.length} {ro ? 'exerciții' : 'exercises'}{mine ? (ro ? ' · cu echipamentul tău, fără cele nepotrivite pentru accidentările tale' : ' · with your equipment, excluding ones unsuited to your injuries') : ''}</p>
      {GROUPS.map((g) => {
        const items = list.filter((e) => g.slots.includes(e.slot));
        if (!items.length) return null;
        return (
          <section key={g.id} className="card">
            <h3>{g[lang]}</h3>
            {items.map((e) => (
              <button key={e.id} className="ex-row" onClick={() => go('#/exercise/' + e.id)}>
                <Figure anim={e.anim} prop={e.prop} size={56} playing={false} />
                <div><b>{L(e.name)}</b><p className="small muted">{L(e.muscles)} · {LEVELS[e.level - 1][lang]}</p></div>
              </button>
            ))}
          </section>
        );
      })}
      {list.length === 0 && <p className="muted center">{ro ? 'Niciun exercițiu cu filtrele alese.' : 'No exercises match these filters.'}</p>}
      <Disclaimer />
    </div>
  );
}
