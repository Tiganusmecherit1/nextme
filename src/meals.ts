import { ING, RECIPES, type Recipe, type Tag } from './data/foods';
import type { Profile } from './calc';

export interface Nutr { kcal: number; protein: number; carbs: number; fat: number; fiber: number }

export function recipeNutrition(r: Pick<Recipe, 'items'>, factor = 1): Nutr {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const [id, g] of r.items) {
    const n = ING[id]?.n;
    if (!n) continue;
    const k = (g * factor) / 100;
    t.kcal += n[0] * k; t.protein += n[1] * k; t.carbs += n[2] * k; t.fat += n[3] * k; t.fiber += n[4] * k;
  }
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat), fiber: Math.round(t.fiber) };
}

export function recipeTags(r: Pick<Recipe, 'items'>): Set<Tag> {
  const s = new Set<Tag>();
  for (const [id] of r.items) for (const t of ING[id].tags || []) s.add(t);
  return s;
}

export function allowed(r: Pick<Recipe, 'items'>, p: Pick<Profile, 'diet' | 'allergies'>) {
  const tags = recipeTags(r);
  const no = new Set<Tag>();
  switch (p.diet) {
    case 'vegetarian': no.add('meat'); no.add('fish'); break;
    case 'pescatarian': no.add('meat'); break;
    case 'vegan':
    case 'fasting': ['meat', 'fish', 'dairy', 'egg'].forEach((t) => no.add(t as Tag)); break;
    case 'fasting_fish': ['meat', 'dairy', 'egg'].forEach((t) => no.add(t as Tag)); break;
  }
  if (p.allergies.includes('gluten')) no.add('gluten');
  if (p.allergies.includes('lactose')) no.add('dairy');
  if (p.allergies.includes('nuts')) no.add('nuts');
  if (p.allergies.includes('egg')) no.add('egg');
  if (p.allergies.includes('fish')) no.add('fish');
  for (const t of tags) if (no.has(t)) return false;
  return true;
}

export interface PlannedMeal { slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'; recipe: Recipe; factor: number; n: Nutr }

const SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 } as const;

/** Day number since epoch: stable rotation so the plan changes daily but is repeatable. */
const dayIndex = (date: string) => Math.floor(new Date(date + 'T12:00:00Z').getTime() / 864e5);

export function dayPlan(p: Profile, date: string, kcalTarget: number): PlannedMeal[] {
  const pool = (slot: Recipe['slot']) => RECIPES.filter((r) => r.slot === slot && allowed(r, p));
  const di = dayIndex(date);
  const out: PlannedMeal[] = [];
  const pick = (list: Recipe[], offset: number) => list[(di * 7 + offset) % list.length] ?? list[0];
  const mains = pool('main');
  const plan: [PlannedMeal['slot'], Recipe[], number][] = [
    ['breakfast', pool('breakfast'), 0],
    ['lunch', mains, 0],
    ['dinner', mains, 3],
    ['snack', pool('snack'), 1],
  ];
  const usedMain = new Set<string>();
  for (const [slot, list, off] of plan) {
    if (!list.length) continue;
    let r = pick(list, off);
    if (slot === 'dinner' && usedMain.has(r.id) && list.length > 1) r = list[(list.indexOf(r) + 1) % list.length];
    if (slot === 'lunch') usedMain.add(r.id);
    const base = recipeNutrition(r).kcal || 1;
    const factor = Math.max(0.6, Math.min(2.2, (kcalTarget * SHARE[slot]) / base));
    const f = Math.round(factor * 20) / 20;
    out.push({ slot, recipe: r, factor: f, n: recipeNutrition(r, f) });
  }
  return out;
}

export function sumN(list: Nutr[]): Nutr {
  return list.reduce((a, b) => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

/** Weekly shopping list aggregated in grams. */
export function shoppingList(p: Profile, startDate: string, kcal: number) {
  const totals: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    for (const m of dayPlan(p, d.toISOString().slice(0, 10), kcal)) {
      for (const [id, g] of m.recipe.items) totals[id] = (totals[id] || 0) + g * m.factor;
    }
  }
  return Object.entries(totals)
    .map(([id, g]) => ({ id, grams: Math.ceil(g / 50) * 50 }))
    .sort((a, b) => b.grams - a.grams);
}
