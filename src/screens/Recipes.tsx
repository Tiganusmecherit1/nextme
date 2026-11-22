import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { todayStr, type Profile, type SavedRecipe } from '../calc';
import { getLang } from '../i18n';
import { Chips, Disclaimer, go, Header, Sheet } from '../components/ui';
import { allowed, recipeNutrition, type Nutr } from '../meals';
import { ING } from '../data/foods';
import { CATS, LIBRARY, OPTIONAL, PANTRY_BASICS, PANTRY_GROUPS, STAPLES, SUBS, STAPLES_EN, STAPLES_RO, type LibRecipe, type RecipeCat } from '../data/recipes';
import { api, ApiError } from '../api';

const ro = () => getLang() === 'ro';
const SHARE: Record<RecipeCat | 'main', number> = { breakfast: 0.25, soup: 0.35, stew: 0.35, oven: 0.35, pan: 0.35, salad: 0.3, snack: 0.12, main: 0.35 };
const catOf = (id: RecipeCat) => CATS.find((c) => c.id === id)!;
const ingName = (id: string) => ING[id]?.[getLang()] ?? id;

/** Portion multiplier that brings a recipe close to the user's calorie share for that meal (in 0.25 steps). */
export function fitFactor(base: Nutr, cat: RecipeCat | 'main', kcalTarget: number) {
  const want = kcalTarget * SHARE[cat];
  const f = want / Math.max(1, base.kcal);
  return Math.max(0.5, Math.min(2.5, Math.round(f * 4) / 4));
}

const nutrLine = (n: Nutr) => `${n.kcal} kcal · P ${n.protein} g · C ${n.carbs} g · G ${n.fat} g`;

/* ───────────── Library ───────────── */
export function RecipeLibrary() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [sort, setSort] = useState<'rec' | 'protein' | 'fast' | 'light'>('rec');
  const fav = s.profile.favRecipes ?? [];
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let l = LIBRARY.filter((r) => allowed(r, s.profile))
      .filter((r) => (cat === 'all' ? true : cat === 'fav' ? fav.includes(r.id) : r.cat === cat))
      .filter((r) => !needle || (r.ro + ' ' + r.en + ' ' + r.items.map(([id]) => ingName(id)).join(' ')).toLowerCase().includes(needle))
      .map((r) => ({ r, n: recipeNutrition(r) }));
    const dens = (n: Nutr) => n.protein / Math.max(1, n.kcal);
    if (sort === 'protein') l.sort((a, b) => b.n.protein - a.n.protein);
    else if (sort === 'fast') l.sort((a, b) => a.r.min - b.r.min);
    else if (sort === 'light') l.sort((a, b) => a.n.kcal - b.n.kcal);
    else if (sort === 'rec') l.sort((a, b) => dens(b.n) - dens(a.n));
    return l;
  }, [q, cat, sort, s.profile, fav]);
  const hidden = LIBRARY.length - LIBRARY.filter((r) => allowed(r, s.profile)).length;

  return (<>
    <input className="input" placeholder={ro() ? '🔍 Caută: pui, ciorbă, ouă…' : '🔍 Search: chicken, soup, eggs…'} value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="chips scroll-x">
      {[{ v: 'all', label: ro() ? 'Toate' : 'All' }, { v: 'fav', label: '★ ' + (ro() ? 'Favorite' : 'Favourites') }, ...CATS.map((c) => ({ v: c.id, label: `${c.emoji} ${ro() ? c.ro : c.en}` }))].map((o) => (
        <button key={o.v} className={'chip' + (cat === o.v ? ' on' : '')} onClick={() => setCat(o.v)}>{o.label}</button>
      ))}
    </div>
    <div className="chips scroll-x">
      {([['rec', ro() ? 'Cele mai proteice / kcal' : 'Most protein per kcal'], ['protein', ro() ? 'Cele mai multe proteine' : 'Most protein'], ['fast', ro() ? 'Cele mai rapide' : 'Fastest'], ['light', ro() ? 'Cele mai ușoare' : 'Lightest']] as const).map(([k, label]) => (
        <button key={k} className={'chip sm' + (sort === k ? ' on' : '')} onClick={() => setSort(k)}>{label}</button>
      ))}
    </div>
    <p className="small muted">{list.length} {ro() ? 'rețete' : 'recipes'} · {ro() ? 'valori pe o porție de bază' : 'values per base portion'}{hidden > 0 ? ` · ${hidden} ${ro() ? 'ascunse după dieta ta' : 'hidden by your diet'}` : ''}</p>
    {list.map(({ r, n }) => <RecipeCard key={r.id} r={r} n={n} fav={fav.includes(r.id)} />)}
    {list.length === 0 && <p className="muted">{ro() ? 'Nimic găsit.' : 'Nothing found.'}</p>}
  </>);
}

function RecipeCard({ r, n, fav, missing }: { r: LibRecipe; n: Nutr; fav?: boolean; missing?: string[] }) {
  const c = catOf(r.cat);
  return (
    <button className="card meal recipe-card" onClick={() => go('#/recipe/' + r.id)}>
      <p className="eyebrow">{c.emoji} {ro() ? c.ro : c.en} · ⏱ {r.min} min{fav ? ' · ★' : ''}</p>
      <h3>{ro() ? r.ro : r.en}</h3>
      <p className="small muted">{n.kcal} kcal · <b className="p-hl">P {n.protein} g</b> · C {n.carbs} g · G {n.fat} g</p>
      {missing && missing.length > 0 && <p className="small miss">{ro() ? 'Îți lipsește: ' : 'Missing: '}{missing.map(ingName).join(', ')}</p>}
    </button>
  );
}

/* ───────────── Recipe detail (library recipe or AI recipe) ───────────── */
export function RecipeScreen({ id }: { id?: string }) {
  const s = useStore();
  const r = LIBRARY.find((x) => x.id === id);
  if (!r) return <div className="page"><Header title={ro() ? 'Rețetă' : 'Recipe'} back /><p className="muted">{ro() ? 'Rețeta nu există.' : 'Recipe not found.'}</p></div>;
  const fav = (s.profile.favRecipes ?? []).includes(r.id);
  const toggleFav = () => {
    const cur = s.profile.favRecipes ?? [];
    s.saveProfile({ ...s.profile, favRecipes: fav ? cur.filter((x) => x !== r.id) : [...cur, r.id] }).catch(() => {});
  };
  return (
    <div className="page">
      <Header title={ro() ? r.ro : r.en} back right={<button className="btn sm ghost" aria-label="favorite" onClick={toggleFav}>{fav ? '★' : '☆'}</button>} />
      <RecipeBody title={ro() ? r.ro : r.en} cat={r.cat} min={r.min} items={r.items} steps={ro() ? r.sRo : r.sEn} />
    </div>
  );
}

function RecipeBody({ title, cat, min, items, steps, ai, onSave, saved }: {
  title: string; cat: RecipeCat | 'main'; min: number; items: [string, number][]; steps: string[]; ai?: boolean; onSave?: () => void; saved?: boolean;
}) {
  const s = useStore();
  const base = recipeNutrition({ items });
  const suggested = fitFactor(base, cat, s.targets.kcal);
  const [f, setF] = useState(suggested);
  const [done, setDone] = useState(false);
  const n = recipeNutrition({ items }, f);
  const pPct = Math.round((n.protein / Math.max(1, s.targets.protein)) * 100);
  const today = todayStr();
  const ate = () => {
    const d = s.day(today);
    s.patchDay(today, { foods: [...d.foods, { name: `${title}${f !== 1 ? ` (${f}×)` : ''}`, kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, src: ai ? 'ai-recipe' : 'recipe' }] });
    setDone(true);
  };
  return (<>
    <section className="card">
      <p className="eyebrow">⏱ {min} min{ai ? ' · ✨ AI' : ''}</p>
      <div className="recipe-macros">
        <div><b>{n.kcal}</b><span>kcal</span></div>
        <div className="p"><b>{n.protein} g</b><span>{ro() ? 'proteine' : 'protein'}</span></div>
        <div><b>{n.carbs} g</b><span>{ro() ? 'carbo' : 'carbs'}</span></div>
        <div><b>{n.fat} g</b><span>{ro() ? 'grăsimi' : 'fat'}</span></div>
      </div>
      <div className="portion-row">
        <button className="btn sm ghost" onClick={() => setF(Math.max(0.5, f - 0.25))} aria-label="-">−</button>
        <b>{f}× {ro() ? 'porție' : 'portion'}</b>
        <button className="btn sm ghost" onClick={() => setF(Math.min(3, f + 0.25))} aria-label="+">+</button>
      </div>
      <p className="small muted">
        {f === suggested
          ? (ro() ? `Porția potrivită pentru ținta ta de ${s.targets.kcal} kcal/zi (≈${Math.round(SHARE[cat] * 100)}% la masa asta). Acoperă ${pPct}% din cele ${s.targets.protein} g proteine pe zi.` : `Portion sized for your ${s.targets.kcal} kcal/day target (≈${Math.round(SHARE[cat] * 100)}% at this meal). Covers ${pPct}% of your ${s.targets.protein} g daily protein.`)
          : (ro() ? `${pPct}% din ținta de proteine. Porția recomandată pentru tine: ${suggested}×.` : `${pPct}% of your protein target. Suggested portion for you: ${suggested}×.`)}
      </p>
    </section>
    <section className="card">
      <h3>{ro() ? 'Ingrediente' : 'Ingredients'}</h3>
      <ul className="ing">{items.map(([id, g]) => <li key={id}><span>{ingName(id)}</span><b>{fmtG(id, g * f)}</b></li>)}</ul>
      <p className="small muted">{ro() ? 'Plus, din cămară: ' : 'Plus, from the cupboard: '}{ro() ? STAPLES_RO : STAPLES_EN}.</p>
    </section>
    <section className="card">
      <h3>{ro() ? 'Cum se face' : 'Method'}</h3>
      <ol className="steps">{steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
    </section>
    <button className="btn full" disabled={done} onClick={ate}>{done ? '✓ ' + (ro() ? 'Adăugat în jurnalul de azi' : 'Added to today’s log') : '✓ ' + (ro() ? 'Am mâncat asta' : 'I ate this')}</button>
    {onSave && <button className="btn full ghost" disabled={saved} onClick={onSave}>{saved ? '★ ' + (ro() ? 'Salvată' : 'Saved') : '☆ ' + (ro() ? 'Salvează rețeta' : 'Save recipe')}</button>}
    <p className="small muted">{ai
      ? (ro() ? 'Rețetă propusă de AI din ingredientele tale. Caloriile și macronutrienții nu vin de la AI: sunt calculate din gramaje cu valorile USDA FoodData Central.' : 'Recipe suggested by AI from your ingredients. Calories and macros are not from the AI: they are calculated from the grams using USDA FoodData Central values.')
      : (ro() ? 'Calorii și macronutrienți calculați din gramaje cu valorile USDA FoodData Central (alimente crude).' : 'Calories and macros calculated from the grams using USDA FoodData Central values (raw foods).')}</p>
    <Disclaimer />
  </>);
}

function fmtG(id: string, g: number) {
  if (id === 'egg' && g >= 45) { const n = Math.round(g / 55 * 2) / 2; return `${n} ${ro() ? (n === 1 ? 'ou' : 'ouă') : n === 1 ? 'egg' : 'eggs'} (${Math.round(g)} g)`; }
  if (g < 20) return `${Math.round(g)} g`;
  return `${Math.round(g / 5) * 5} g`;
}

/* ───────────── Pantry ───────────── */
type AiOut = { title: string; minutes: number; items: { id: string; grams: number }[]; steps: string[] };

export function Pantry() {
  const s = useStore();
  const [sel, setSel] = useState<string[]>(s.profile.pantry ?? []);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(!(s.profile.pantry?.length));
  const timer = useRef<number | undefined>(undefined);
  const profRef = useRef<Profile>(s.profile);
  profRef.current = s.profile;
  useEffect(() => {
    if (JSON.stringify(sel) === JSON.stringify(s.profile.pantry ?? [])) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { s.saveProfile({ ...profRef.current, pantry: sel }).catch(() => {}); }, 900);
    return () => clearTimeout(timer.current);
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const has = new Set(sel);
  const toggle = (id: string) => setSel(has.has(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const needle = q.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!sel.length) return { now: [], one: [], two: [] };
    const h = new Set(sel);
    const rows = LIBRARY.filter((r) => allowed(r, s.profile)).map((r) => {
      const missing = r.items.map(([id]) => id).filter((id) => !h.has(id) && !STAPLES.has(id) && !OPTIONAL.has(id) && !(SUBS[id] || []).some((x) => h.has(x)));
      return { r, n: recipeNutrition(r), missing };
    });
    const by = (k: number) => rows.filter((x) => x.missing.length === k).sort((a, b) => b.n.protein / b.n.kcal - a.n.protein / a.n.kcal);
    return { now: by(0), one: by(1), two: by(2).slice(0, 12) };
  }, [sel, s.profile]);

  return (<>
    <section className="card">
      <div className="row-between">
        <h3>🧺 {ro() ? 'Ce ai în bucătărie' : 'What’s in your kitchen'} <span className="muted small">· {sel.length}</span></h3>
        <button className="btn sm ghost" onClick={() => setEditing(!editing)}>{editing ? (ro() ? 'Gata' : 'Done') : (ro() ? 'Modifică' : 'Edit')}</button>
      </div>
      {!editing && (
        <div className="chips wrap">{sel.length ? sel.map((id) => <button key={id} className="chip sm on" onClick={() => toggle(id)}>{ingName(id)} ×</button>) : <p className="small muted">{ro() ? 'Nimic ales încă.' : 'Nothing picked yet.'}</p>}</div>
      )}
      {editing && (<>
        <p className="small muted">{ro() ? 'Bifează ce ai acum. Se salvează singur și rămâne pentru data viitoare.' : 'Tick what you have. It saves itself for next time.'}</p>
        <input className="input" placeholder={ro() ? '🔍 Caută ingredient' : '🔍 Find ingredient'} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips wrap" style={{ marginBottom: 10 }}>
          <button className="chip sm" onClick={() => setSel([...new Set([...sel, ...PANTRY_BASICS])])}>＋ {ro() ? 'De bază (ulei, ceapă, ouă, cartofi…)' : 'Basics (oil, onion, eggs, potatoes…)'}</button>
          {sel.length > 0 && <button className="chip sm" onClick={() => setSel([])}>✕ {ro() ? 'Golește' : 'Clear'}</button>}
        </div>
        {PANTRY_GROUPS.map((g) => {
          const ids = g.ids.filter((id) => !needle || ingName(id).toLowerCase().includes(needle));
          if (!ids.length) return null;
          return (<div key={g.en} className="pantry-group">
            <p className="eyebrow">{ro() ? g.ro : g.en}</p>
            <div className="chips wrap">{ids.map((id) => <button key={id} className={'chip sm' + (has.has(id) ? ' on' : '')} onClick={() => toggle(id)}>{ingName(id)}</button>)}</div>
          </div>);
        })}
        <p className="small muted">{ro() ? 'Mereu presupuse: ' : 'Always assumed: '}{ro() ? STAPLES_RO : STAPLES_EN}. {ro() ? 'Pui/curcan, ulei/ulei de măsline, iaurt/iaurt grecesc etc. se pot înlocui între ele; pâinea și murăturile sunt opționale.' : 'Chicken/turkey, oil/olive oil, yogurt/Greek yogurt etc. count as swaps; bread and pickles are optional.'}</p>
      </>)}
    </section>

    <AiRecipes sel={sel} />

    {sel.length > 0 && (<>
      <h2 className="section-title">✅ {ro() ? 'Poți găti acum' : 'You can cook now'} <span className="muted small">· {matches.now.length}</span></h2>
      {matches.now.length === 0 && <p className="small muted">{ro() ? 'Încă nicio rețetă din bibliotecă cu tot ce ai. Mai bifează câteva ingrediente sau cere AI-ului.' : 'No library recipe matches everything yet. Tick a few more ingredients or ask the AI.'}</p>}
      {matches.now.map(({ r, n }) => <RecipeCard key={r.id} r={r} n={n} />)}
      {matches.one.length > 0 && <h2 className="section-title">🛒 {ro() ? 'Îți lipsește un singur ingredient' : 'Missing just one ingredient'}</h2>}
      {matches.one.map(({ r, n, missing }) => <RecipeCard key={r.id} r={r} n={n} missing={missing} />)}
      {matches.two.length > 0 && <h2 className="section-title">{ro() ? 'Îți lipsesc două' : 'Missing two'}</h2>}
      {matches.two.map(({ r, n, missing }) => <RecipeCard key={r.id} r={r} n={n} missing={missing} />)}
    </>)}
    <SavedList />
  </>);
}

function AiRecipes({ sel }: { sel: string[] }) {
  const s = useStore();
  const [meal, setMeal] = useState<'main' | 'breakfast' | 'snack'>('main');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [out, setOut] = useState<AiOut[] | null>(null);
  const [open, setOpen] = useState<AiOut | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  useEffect(() => { api('/me').then((r) => r.aiRecipe && setQuota(r.aiRecipe)).catch(() => {}); }, []);

  const usable = sel.filter((id) => ING[id] && allowed({ items: [[id, 1]] }, s.profile));
  const left = quota ? Math.max(0, quota.limit - quota.used) : null;
  const generate = async () => {
    setBusy(true); setMsg(''); setOut(null);
    try {
      const share = meal === 'breakfast' ? 0.25 : meal === 'snack' ? 0.12 : 0.35;
      const avoid: string[] = [];
      if (s.profile.diet && s.profile.diet !== 'omnivore') avoid.push(String(s.profile.diet).replace('_', ' '));
      const r = await api<{ recipes: AiOut[]; used: number; limit: number }>('/ai/recipe', { method: 'POST', body: {
        have: usable.map((id) => ({ id, name: ING[id].ro + ' / ' + ING[id].en })), lang: getLang(), meal,
        kcal: Math.round(s.targets.kcal * share), protein: Math.round(s.targets.protein * (meal === 'snack' ? 0.15 : 0.33)), avoid,
      } });
      setQuota({ used: r.used, limit: r.limit });
      setOut(r.recipes);
      if (!r.recipes.length) setMsg(ro() ? 'AI-ul n-a reușit de data asta. Mai încearcă o dată.' : 'The AI didn’t manage this time. Try once more.');
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      if (code === 'limit_reached') { setMsg(ro() ? 'Ai folosit generările de azi. Revino mâine; biblioteca de mai jos e oricând la dispoziție.' : 'You’ve used today’s generations. Come back tomorrow; the library below is always available.'); if (e instanceof ApiError && e.data) setQuota({ used: e.data.used, limit: e.data.limit }); }
      else setMsg(ro() ? 'AI-ul nu e disponibil acum. Încearcă puțin mai târziu.' : 'AI is unavailable right now. Try again a bit later.');
    } finally { setBusy(false); }
  };
  const saved = s.profile.savedRecipes ?? [];
  const isSaved = (r: AiOut) => saved.some((x) => x.title === r.title);
  const save = (r: AiOut) => {
    const sr: SavedRecipe = { title: r.title, min: r.minutes, items: r.items.map((i) => [i.id, i.grams]), steps: r.steps, lang: getLang() };
    s.saveProfile({ ...s.profile, pantry: s.profile.pantry, savedRecipes: [sr, ...saved].slice(0, 30) }).catch(() => {});
  };

  return (
    <section className="card ai-card">
      <h3>✨ {ro() ? 'Rețete noi din ce ai' : 'New recipes from what you have'}</h3>
      <p className="small muted">{ro() ? 'AI-ul gândește 3 rețete gustoase, bogate în proteine, doar din ingredientele bifate, pe măsura țintei tale.' : 'The AI comes up with 3 tasty, high-protein recipes using only your ticked ingredients, sized to your target.'}{left !== null ? ` ${left} ${ro() ? 'generări rămase azi' : 'generations left today'}.` : ''}</p>
      <Chips options={[{ v: 'main', label: ro() ? 'Prânz / cină' : 'Lunch / dinner' }, { v: 'breakfast', label: ro() ? 'Mic dejun' : 'Breakfast' }, { v: 'snack', label: ro() ? 'Gustare / desert' : 'Snack / dessert' }]} value={meal} onChange={setMeal} />
      <button className="btn full" style={{ marginTop: 10 }} disabled={busy || usable.length < 3 || left === 0} onClick={generate}>
        {busy ? (ro() ? '✨ Gătesc idei… (~20 s)' : '✨ Cooking up ideas… (~20 s)') : usable.length < 3 ? (ro() ? 'Bifează cel puțin 3 ingrediente' : 'Tick at least 3 ingredients') : '✨ ' + (ro() ? 'Generează rețete' : 'Generate recipes')}
      </button>
      {msg && <p className="err">{msg}</p>}
      {out && out.map((r, i) => {
        const n = recipeNutrition({ items: r.items.map((x) => [x.id, x.grams]) });
        return (
          <button key={i} className="card inset meal" style={{ marginTop: 10 }} onClick={() => setOpen(r)}>
            <p className="eyebrow">✨ AI · ⏱ {r.minutes} min</p>
            <h3>{r.title}</h3>
            <p className="small muted">{n.kcal} kcal · <b className="p-hl">P {n.protein} g</b> · C {n.carbs} g · G {n.fat} g</p>
          </button>
        );
      })}
      {open && (
        <Sheet open onClose={() => setOpen(null)} title={open.title}>
          <RecipeBody title={open.title} cat={meal === 'main' ? 'main' : meal} min={open.minutes} items={open.items.map((x) => [x.id, x.grams])} steps={open.steps} ai onSave={() => save(open)} saved={isSaved(open)} />
        </Sheet>
      )}
    </section>
  );
}

function SavedList() {
  const s = useStore();
  const saved = s.profile.savedRecipes ?? [];
  const [open, setOpen] = useState<SavedRecipe | null>(null);
  if (!saved.length) return null;
  const remove = (r: SavedRecipe) => { s.saveProfile({ ...s.profile, savedRecipes: saved.filter((x) => x !== r) }).catch(() => {}); setOpen(null); };
  return (<>
    <h2 className="section-title">★ {ro() ? 'Rețetele tale salvate' : 'Your saved recipes'}</h2>
    {saved.map((r, i) => {
      const n = recipeNutrition({ items: r.items });
      return (
        <button key={i} className="card meal" onClick={() => setOpen(r)}>
          <p className="eyebrow">✨ AI · ⏱ {r.min} min</p>
          <h3>{r.title}</h3>
          <p className="small muted">{nutrLine(n)}</p>
        </button>
      );
    })}
    {open && (
      <Sheet open onClose={() => setOpen(null)} title={open.title}>
        <RecipeBody title={open.title} cat="main" min={open.min} items={open.items} steps={open.steps} ai />
        <button className="btn full ghost" onClick={() => remove(open)}>🗑 {ro() ? 'Șterge din salvate' : 'Remove from saved'}</button>
      </Sheet>
    )}
  </>);
}
