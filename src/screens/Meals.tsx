import { useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr } from '../calc';
import { getLang, t, type Key } from '../i18n';
import { Bar, Disclaimer, Header, Sheet } from '../components/ui';
import { dayPlan, shoppingList, sumN, type PlannedMeal } from '../meals';
import { ING } from '../data/foods';
import { api, ApiError, fileToDataUrl, type FoodEntry } from '../api';

export function Meals() {
  const s = useStore();
  const today = todayStr();
  const d = s.day(today);
  const plan = dayPlan(s.profile, today, s.targets.kcal);
  const [openMeal, setOpenMeal] = useState<PlannedMeal | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const eaten = sumN(d.foods.map((f) => ({ ...f, fiber: 0 })));
  const planned = sumN(plan.map((m) => m.n));
  const lang = getLang();

  const addFoods = (items: FoodEntry[]) => s.patchDay(today, { foods: [...d.foods, ...items] });

  return (
    <div className="page">
      <Header title={t('meals')} right={<button className="btn sm ghost" onClick={() => setShopOpen(true)}>🛒</button>} />
      <section className="card">
        <h3>{t('eaten')}</h3>
        <div className="macro"><span>{t('kcal')}</span><b>{eaten.kcal} / {s.targets.kcal}</b></div>
        <Bar pct={eaten.kcal / s.targets.kcal} color="var(--coral)" />
        <div className="macro"><span>{t('protein')}</span><b>{eaten.protein} / {s.targets.protein} g</b></div>
        <Bar pct={eaten.protein / s.targets.protein} color="var(--violet)" />
        <div className="macro"><span>{t('carbs')}</span><b>{eaten.carbs} / {s.targets.carbs} g</b></div>
        <Bar pct={eaten.carbs / s.targets.carbs} color="var(--water)" />
        <div className="macro"><span>{t('fat')}</span><b>{eaten.fat} / {s.targets.fat} g</b></div>
        <Bar pct={eaten.fat / s.targets.fat} color="var(--amber)" />
        {d.foods.length > 0 && (
          <ul className="food-log">
            {d.foods.map((f, i) => (
              <li key={i}><span>{f.name}</span><span className="muted">{f.kcal} kcal</span>
                <button className="x" aria-label={t('delete')} onClick={() => s.patchDay(today, { foods: d.foods.filter((_, k) => k !== i) })}>×</button></li>
            ))}
          </ul>
        )}
      </section>

      <PlateScan onAdd={addFoods} />

      <h2 className="section-title">{t('mealPlan')} · {planned.kcal} kcal · {planned.fiber} g {t('fiber').toLowerCase()}</h2>
      {plan.map((m) => (
        <button key={m.slot} className="card meal" onClick={() => setOpenMeal(m)}>
          <p className="eyebrow">{t(m.slot as Key)}</p>
          <h3>{m.recipe[lang]}</h3>
          <p className="small muted">{m.n.kcal} kcal · P {m.n.protein} g · C {m.n.carbs} g · G {m.n.fat} g{m.recipe.gutFriendly ? ` · 🦠 ${t('gutFriendly')}` : ''}</p>
        </button>
      ))}
      <Disclaimer />

      {openMeal && (
        <Sheet open onClose={() => setOpenMeal(null)} title={openMeal.recipe[lang]}>
          <p className="small muted">{openMeal.factor !== 1 && `${openMeal.factor}× ${t('portion')} · `}{openMeal.n.kcal} kcal · P {openMeal.n.protein} · C {openMeal.n.carbs} · G {openMeal.n.fat} · {t('fiber')} {openMeal.n.fiber} g</p>
          <h3>{t('ingredients')}</h3>
          <ul className="ing">{openMeal.recipe.items.map(([id, g]) => <li key={id}><span>{ING[id][lang]}</span><b>{Math.round((g * openMeal.factor) / 5) * 5} g</b></li>)}</ul>
          {openMeal.recipe.stepsRo && (<><h3>{t('howTo')}</h3><p>{lang === 'ro' ? openMeal.recipe.stepsRo : openMeal.recipe.stepsEn}</p></>)}
          <button className="btn full" onClick={() => { addFoods([{ name: openMeal.recipe[lang], ...openMeal.n, src: 'plan' }]); setOpenMeal(null); }}>✓ {t('ate')}</button>
        </Sheet>
      )}
      {shopOpen && (
        <Sheet open onClose={() => setShopOpen(false)} title={t('shopping')}>
          <ul className="ing">{shoppingList(s.profile, today, s.targets.kcal).map((x) => (
            <li key={x.id}><span>{ING[x.id][lang]}</span><b>{x.grams >= 1000 ? (x.grams / 1000).toFixed(1) + ' kg' : x.grams + ' g'}</b></li>
          ))}</ul>
        </Sheet>
      )}
    </div>
  );
}

function PlateScan({ onAdd }: { onAdd: (f: FoodEntry[]) => void }) {
  const s = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<(FoodEntry & { grams: number })[] | null>(null);
  const [msg, setMsg] = useState('');
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setMsg(''); setItems(null);
    try {
      const image = await fileToDataUrl(f);
      const r = await api('/ai/plate', { method: 'POST', body: { image, lang: getLang() } });
      s.setAi({ used: r.used, limit: r.limit });
      setItems(r.items);
      if (!r.items.length) setMsg(getLang() === 'ro' ? 'Nu am găsit mâncare în poză.' : 'No food found in the photo.');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setMsg(code === 'limit_reached' ? t('aiLimit') : t('aiUnavailable'));
    } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  return (
    <section className="card">
      <h3>📸 {t('plateScan')}</h3>
      <p className="small muted">{t('plateText')} {Math.max(0, s.ai.limit - s.ai.used)} {t('aiLeft')}.</p>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <button className="btn" disabled={busy || s.ai.used >= s.ai.limit} onClick={() => file.current?.click()}>{busy ? t('analyzing') : '📷 ' + t('plateScan')}</button>
      {msg && <p className="err">{msg}</p>}
      {items && items.length > 0 && (
        <>
          <ul className="food-log">
            {items.map((f, i) => (
              <li key={i}><span>{f.name} <span className="muted">~{f.grams} g</span></span><span>{f.kcal} kcal</span>
                <button className="x" onClick={() => setItems(items.filter((_, k) => k !== i))}>×</button></li>
            ))}
          </ul>
          <button className="btn full" onClick={() => { onAdd(items.map(({ grams, ...f }) => ({ ...f, name: `${f.name} (~${grams} g)`, src: 'ai' }))); setItems(null); }}>{t('addToLog')}</button>
        </>
      )}
    </section>
  );
}
