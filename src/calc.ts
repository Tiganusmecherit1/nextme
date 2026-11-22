// Evidence-based calculations. Sources are cited inline and shown in the app.
export type Sex = 'male' | 'female';
export type Goal = 'wellness' | 'fat_loss' | 'muscle' | 'bodybuilding' | 'strength_home';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Diet = 'omnivore' | 'vegetarian' | 'pescatarian' | 'vegan' | 'fasting' | 'fasting_fish';

export interface Profile {
  lang: 'ro' | 'en';
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activity: Activity;
  goal: Goal;
  level: Level;
  location: 'gym' | 'home';
  homeEquipment: string[]; // dumbbells, band, pullup_bar, kettlebell, bench
  gymEquipment: string[]; // machine ids available (empty = full standard gym)
  trainingDays: number[]; // 0=Sun..6=Sat
  trainingTime: string; // HH:MM
  sessionMinutes: number;
  injuries: string[]; // knee, lower_back, shoulder, wrist, hip, neck
  conditions: string[]; // diabetes_t2, prediabetes, hypertension, heart, pregnancy, osteoporosis, thyroid, kidney, none
  diet: Diet;
  allergies: string[]; // gluten, lactose, nuts, egg, fish
  sleepHours: number;
  disclaimerAccepted: boolean;
  createdAt: string;
  /** start of the current 8-week program (defaults to createdAt) */
  programStart?: string;
  /** permanent exercise swaps: original exercise id → replacement id */
  swaps?: Record<string, string>;
  /** chosen program template; 'auto' (default) builds from days/equipment/goal */
  program?: string;
  /** custom daily step goal (default from age, see activity.ts) */
  stepGoal?: number;
  /**
   * Progressive profiling: details asked later, when first needed ('health', 'diet').
   * Undefined for profiles made with the old full onboarding, which already answered everything.
   */
  asked?: string[];
}

export const ageOf = (p: Pick<Profile, 'birthYear'>) => new Date().getFullYear() - p.birthYear;
export const ageGroup = (age: number) => (age < 30 ? '20' : age < 40 ? '30' : age < 50 ? '40' : age < 60 ? '50' : '60');

/** Mifflin-St Jeor (1990), Am J Clin Nutr 51:241-7. */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'birthYear'>) {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * ageOf(p);
  return Math.round(p.sex === 'male' ? base + 5 : base - 161);
}

/** Physical activity level multipliers (FAO/WHO/UNU 2001 PAL ranges, common clinical factors). */
export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function tdee(p: Profile) {
  return Math.round(bmr(p) * ACTIVITY_FACTOR[p.activity]);
}

export function bmi(p: Pick<Profile, 'weightKg' | 'heightCm'>) {
  const m = p.heightCm / 100;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}

/**
 * Calorie target.
 * Fat loss: ~20% deficit, max 750 kcal (≈0.5–0.75 kg/week), never under BMR × 1.1 nor 1200 (F) / 1500 (M).
 * Muscle: +10% surplus (lean gain, ISSN 2017 position stand on diets & body composition).
 */
export function calorieTarget(p: Profile) {
  const t = tdee(p);
  let target = t;
  if (p.goal === 'fat_loss') target = t - Math.min(750, Math.round(t * 0.2));
  if (p.goal === 'muscle' || p.goal === 'bodybuilding') target = Math.round(t * 1.1);
  if (p.conditions.includes('pregnancy')) target = t; // no deficits in pregnancy
  const floor = Math.max(Math.round(bmr(p) * 1.1), p.sex === 'female' ? 1200 : 1500);
  return Math.max(floor, Math.round(target / 10) * 10);
}

/**
 * Protein g/kg/day.
 * EFSA PRI 0.83 g/kg (2012); ISSN 2017: 1.4–2.0 g/kg for exercising people;
 * Morton 2018 (BJSM) meta-analysis plateau ≈1.6 g/kg; PROT-AGE 2013: ≥1.0–1.2 g/kg for 65+.
 * Kidney disease: keep to 0.8 g/kg unless the doctor says otherwise.
 */
export function proteinPerKg(p: Profile) {
  if (p.conditions.includes('kidney')) return 0.8;
  const age = ageOf(p);
  if (p.goal === 'muscle' || p.goal === 'bodybuilding') return 1.8;
  if (p.goal === 'fat_loss') return 1.8; // higher protein helps retain lean mass in a deficit
  if (age >= 60) return 1.2;
  return 1.4;
}

export function macros(p: Profile) {
  const kcal = calorieTarget(p);
  // Use an adjusted weight for protein when BMI ≥ 30 so targets stay realistic.
  const refWeight = bmi(p) >= 30 ? 25 * (p.heightCm / 100) ** 2 : p.weightKg;
  const protein = Math.round(proteinPerKg(p) * refWeight);
  const fat = Math.round((kcal * 0.3) / 9); // EFSA reference intake 20–35% of energy
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.max(25, Math.round((kcal / 1000) * 14)); // EFSA AV 25 g/day; IOM 14 g/1000 kcal
  return { kcal, protein, fat, carbs, fiber };
}

/**
 * Daily drinking-water goal (ml).
 * EFSA 2010 adequate total water intake: 2.0 L (women) / 2.5 L (men), ~20% comes from food.
 * Scaled by body weight (≈35 ml/kg), +500 ml per training day hour, clamped to 2–4 L as requested.
 */
export function waterGoalMl(p: Profile) {
  let ml = p.weightKg * 35;
  const extra = { sedentary: 0, light: 150, moderate: 300, active: 500, very_active: 700 }[p.activity];
  ml += extra + (p.trainingDays.length > 0 ? (p.sessionMinutes / 60) * 250 : 0);
  if (p.conditions.includes('pregnancy')) ml += 300; // EFSA: +300 ml in pregnancy
  if (p.conditions.includes('heart') || p.conditions.includes('kidney')) ml = Math.min(ml, 2000); // follow medical advice
  const min = p.conditions.includes('heart') || p.conditions.includes('kidney') ? 1500 : 2000;
  return Math.round(Math.max(min, Math.min(4000, ml)) / 100) * 100;
}

/** Waist-to-height ratio: keep under 0.5 (NICE guideline NG246, 2022 update). */
export const waistToHeight = (waistCm: number, heightCm: number) => Math.round((waistCm / heightCm) * 100) / 100;

/** WHO 2020 guidelines on physical activity. */
export function whoWeekly(age: number) {
  return {
    moderateMin: [150, 300] as const,
    vigorousMin: [75, 150] as const,
    strengthDays: 2,
    balanceDays: age >= 65 ? 3 : 0,
  };
}

export const todayStr = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
};
