// Biohacking: only practices with published evidence. Every claim below is tied to a source in `sources`.
// Evidence labels: 'rct' = randomised trials / meta-analysis of trials; 'cohort' = observational (association,
// not proof of cause); 'caution' = evidence says "be careful" or "no extra benefit".
import type { Profile } from '../calc';
import { ageOf } from '../calc';

type T = { ro: string; en: string };
export interface Source { label: string; url: string }
export type Evidence = 'rct' | 'cohort' | 'caution';

export interface BioTopic {
  id: string;
  icon: string;
  title: T;
  evidence: Evidence;
  summary: T;
  how: { ro: string[]; en: string[] };
  caution?: T;
  workout?: string;
  sources: Source[];
}

export type SegKind = 'warm' | 'work' | 'recover' | 'steady' | 'cool';
export interface Segment { kind: SegKind; sec: number; label: T; cue: T; exId?: string }

export interface BioVariant { id: string; label: T }
export interface BioWorkout {
  id: string;
  icon: string;
  title: T;
  text: T;
  topic: string;
  /** shown as "Intensity" line, uses heart-rate zones from age */
  zone: 'z2' | 'z45' | 'vig' | 'light' | 'strength';
  variants: BioVariant[];
  defaultVariant: string;
  build: (variant: string, p: Profile) => Segment[];
  vigorous?: boolean;
}

// ---------- Sources (checked: DOI / PubMed / WHO) ----------
const S = {
  who2020: { label: 'Bull FC et al. WHO 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med 2020;54:1451–62', url: 'https://doi.org/10.1136/bjsports-2020-102955' },
  sanMillan: { label: 'San-Millán I, Brooks GA. Metabolic flexibility in athletes vs less-fit people (lactate, fat oxidation). Sports Med 2018;48:467–79', url: 'https://doi.org/10.1007/s40279-017-0751-x' },
  seiler: { label: 'Seiler S. Training intensity distribution in endurance athletes. Int J Sports Physiol Perform 2010;5:276–91', url: 'https://doi.org/10.1123/ijspp.5.3.276' },
  mandsager: { label: 'Mandsager K et al. Cardiorespiratory fitness and long-term mortality (122,007 patients). JAMA Netw Open 2018;1(6):e183605', url: 'https://doi.org/10.1001/jamanetworkopen.2018.3605' },
  kodama: { label: 'Kodama S et al. Cardiorespiratory fitness as a predictor of mortality and CV events: meta-analysis. JAMA 2009;301:2024–35', url: 'https://doi.org/10.1001/jama.2009.681' },
  helgerud: { label: 'Helgerud J et al. Aerobic high-intensity intervals (4×4 min) improve VO2max more than moderate training. Med Sci Sports Exerc 2007;39:665–71', url: 'https://doi.org/10.1249/mss.0b013e3180304570' },
  momma: { label: 'Momma H et al. Muscle-strengthening activities and mortality: meta-analysis of cohort studies. Br J Sports Med 2022;56:755–63', url: 'https://doi.org/10.1136/bjsports-2021-105061' },
  reynolds: { label: 'Reynolds AN et al. Walking 10 min after each meal vs 30 min at any time (type 2 diabetes, crossover RCT). Diabetologia 2016;59:2572–78', url: 'https://doi.org/10.1007/s00125-016-4085-2' },
  dipietro: { label: 'DiPietro L et al. Three 15-min post-meal walks improve 24-h glucose in older adults. Diabetes Care 2013;36:3262–68', url: 'https://doi.org/10.2337/dc13-0084' },
  buffey: { label: 'Buffey AJ et al. Interrupting prolonged sitting with light walking: meta-analysis of cardiometabolic markers. Sports Med 2022;52:1765–87', url: 'https://doi.org/10.1007/s40279-022-01649-4' },
  stamatakis: { label: 'Stamatakis E et al. Vigorous intermittent lifestyle physical activity (VILPA) and mortality, UK Biobank. Nat Med 2022;28:2521–29', url: 'https://doi.org/10.1038/s41591-022-02100-x' },
  laukkanen: { label: 'Laukkanen T et al. Sauna bathing and fatal cardiovascular and all-cause mortality (2,315 Finnish men). JAMA Intern Med 2015;175:542–48', url: 'https://doi.org/10.1001/jamainternmed.2014.8187' },
  roberts: { label: 'Roberts LA et al. Post-exercise cold water immersion attenuates muscle adaptations to strength training. J Physiol 2015;593:4285–301', url: 'https://doi.org/10.1113/JP270570' },
  schoenfeld: { label: 'Schoenfeld BJ et al. Fasted vs non-fasted aerobic exercise: body composition. J Int Soc Sports Nutr 2014;11:54', url: 'https://doi.org/10.1186/s12970-014-0054-7' },
  tanaka: { label: 'Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited (208 − 0.7 × age). J Am Coll Cardiol 2001;37:153–56', url: 'https://doi.org/10.1016/S0735-1097(00)01054-8' },
  acsm: { label: 'Riebe D et al. ACSM recommendations for exercise preparticipation health screening. Med Sci Sports Exerc 2015;47:2473–79', url: 'https://doi.org/10.1249/MSS.0000000000000664' },
} satisfies Record<string, Source>;

export const HR_SOURCES = [S.tanaka, S.acsm];

/** Tanaka 2001: HRmax ≈ 208 − 0.7 × age. An estimate (±10 bpm typical spread). */
export const hrMax = (p: Pick<Profile, 'birthYear'>) => Math.round(208 - 0.7 * ageOf(p));
export const zones = (p: Pick<Profile, 'birthYear'>) => {
  const m = hrMax(p);
  const r = (a: number, b: number) => `${Math.round(m * a)}–${Math.round(m * b)}`;
  return { max: m, z2: r(0.6, 0.7), z45: r(0.85, 0.95), light: r(0.5, 0.6), vig: r(0.77, 0.95) };
};

// ---------- Topics ----------
export const BIO_TOPICS: BioTopic[] = [
  {
    id: 'zone2', icon: '🫀', evidence: 'rct', workout: 'zone2',
    title: { ro: 'Cardio în Zona 2 (2–3 ore/săptămână)', en: 'Zone 2 cardio (2–3 hours/week)' },
    summary: {
      ro: '„Zona 2” este efort moderat, ușor sub pragul la care respirația devine grea: poți vorbi în propoziții întregi. 2–3 ore pe săptămână se încadrează în recomandarea OMS de 150–300 de minute de activitate moderată, asociată cu risc mai mic de boli cardiovasculare, diabet de tip 2 și mortalitate. La sportivi, mare parte din antrenament se face la această intensitate, iar persoanele mai antrenate ard mai multe grăsimi și curăță mai bine lactatul la același efort.',
      en: '“Zone 2” is moderate effort, just below the point where breathing gets hard: you can still talk in full sentences. 2–3 hours a week fits the WHO recommendation of 150–300 minutes of moderate activity, which is linked to lower risk of heart disease, type 2 diabetes and death. Endurance athletes do most of their training at this intensity, and fitter people burn more fat and clear lactate better at the same effort.',
    },
    how: {
      ro: ['Mers alert în pantă, bicicletă, eliptică, înot sau alergare ușoară.', 'Testul vorbirii: poți vorbi, dar nu poți cânta.', 'Ca reper: aproximativ 60–70% din pulsul maxim estimat.', 'Împarte cum îți convine: de ex. 4 × 40 min sau 3 × 50 min pe săptămână.'],
      en: ['Brisk uphill walking, cycling, elliptical, swimming or easy jogging.', 'Talk test: you can talk but not sing.', 'As a guide: about 60–70% of your estimated max heart rate.', 'Split it as you like, e.g. 4 × 40 min or 3 × 50 min a week.'],
    },
    caution: {
      ro: '„Zona 2” nu are o definiție unică; procentele de puls sunt aproximative. Beneficiile la populația generală sunt demonstrate pentru activitatea moderată în general, nu pentru o zonă exactă.',
      en: '“Zone 2” has no single definition; heart-rate percentages are approximate. In the general population the benefits are shown for moderate activity in general, not for one exact zone.',
    },
    sources: [S.who2020, S.sanMillan, S.seiler],
  },
  {
    id: 'vo2max', icon: '🚀', evidence: 'rct', workout: 'norwegian_4x4',
    title: { ro: 'VO2max și intervalele 4×4 „norvegiene”', en: 'VO2max and the “Norwegian” 4×4 intervals' },
    summary: {
      ro: 'VO2max (capacitatea aerobă) este unul dintre cei mai puternici predictori ai longevității: într-un studiu pe 122.007 pacienți testați pe bandă, cei cu fitness scăzut au avut un risc de deces mult mai mare decât cei cu fitness ridicat, fără o limită superioară a beneficiului. În studiul lui Helgerud, 4 intervale de 4 minute la 90–95% din pulsul maxim, cu 3 minute de recuperare activă, de 3 ori pe săptămână, timp de 8 săptămâni, au crescut VO2max cu circa 7%, mai mult decât antrenamentul moderat de durată egală ca energie.',
      en: 'VO2max (aerobic capacity) is one of the strongest predictors of longevity: in a study of 122,007 patients tested on a treadmill, those with low fitness had a much higher risk of death than those with high fitness, with no upper limit to the benefit. In Helgerud’s trial, 4 intervals of 4 minutes at 90–95% of max heart rate, with 3 minutes of active recovery, 3 times a week for 8 weeks, raised VO2max by about 7%, more than moderate training of equal energy cost.',
    },
    how: {
      ro: ['Încălzire 10 min ușor, apoi 4 × 4 min tare (85–95% puls maxim: poți spune doar câteva cuvinte).', 'Între intervale 3 min mers/pedalat ușor.', 'Răcire 5 min. Total ~38 min.', '1 sesiune pe săptămână e un început bun; 2 maxim pentru majoritatea oamenilor, pe lângă Zona 2.', 'Începători: 2–3 intervale în primele săptămâni.'],
      en: ['Warm up 10 min easy, then 4 × 4 min hard (85–95% max HR: you can only say a few words).', '3 min easy walking/pedalling between intervals.', 'Cool down 5 min. Total ~38 min.', 'Once a week is a good start; twice is plenty for most people, on top of Zone 2.', 'Beginners: 2–3 intervals in the first weeks.'],
    },
    caution: {
      ro: 'Asocierea fitness–mortalitate este observațională. Efortul viguros cere avizul medicului dacă ai boli de inimă, hipertensiune necontrolată, diabet cu complicații sau simptome la efort (ghidul ACSM de screening).',
      en: 'The fitness–mortality link is observational. Vigorous effort needs a doctor’s OK if you have heart disease, uncontrolled high blood pressure, diabetes with complications or symptoms on exertion (ACSM screening guidance).',
    },
    sources: [S.mandsager, S.kodama, S.helgerud, S.acsm],
  },
  {
    id: 'strength', icon: '💪', evidence: 'cohort', workout: 'strength_min',
    title: { ro: 'Forță de 2 ori pe săptămână', en: 'Strength twice a week' },
    summary: {
      ro: 'O meta-analiză a studiilor de cohortă a găsit că exercițiile de forță sunt asociate cu un risc cu ~10–17% mai mic de deces din orice cauză, boli cardiovasculare, cancer și diabet. Beneficiul maxim a apărut la aproximativ 30–60 de minute pe săptămână; combinația forță + aerobic a fost cea mai bună. OMS recomandă forță pentru toate grupele mari de mușchi în cel puțin 2 zile pe săptămână.',
      en: 'A meta-analysis of cohort studies found strength training linked to ~10–17% lower risk of death from any cause, heart disease, cancer and diabetes. The largest benefit appeared at about 30–60 minutes a week; strength plus aerobic was best. WHO recommends strength work for all major muscle groups on at least 2 days a week.',
    },
    how: {
      ro: ['Programul tău din Antrenament acoperă deja asta.', 'În zilele aglomerate: circuitul „Forță minimă” de ~20 min (genuflexiuni, împins, tras, balama de șold, planșă).', 'Ultimele repetări trebuie să fie grele, dar cu tehnică bună.'],
      en: ['Your program in Workout already covers this.', 'On busy days: the ~20-min “Minimum strength” circuit (squat, push, pull, hip hinge, plank).', 'The last reps should feel hard, with good form.'],
    },
    caution: {
      ro: 'Datele sunt observaționale și auto-raportate; peste ~1 oră/săptămână beneficiul suplimentar asupra mortalității e neclar (nu și pentru masă musculară sau forță).',
      en: 'Data are observational and self-reported; above ~1 hour/week the extra mortality benefit is unclear (not so for muscle or strength gains).',
    },
    sources: [S.momma, S.who2020],
  },
  {
    id: 'post_meal', icon: '🚶', evidence: 'rct', workout: 'post_meal_walk',
    title: { ro: 'Plimbarea de 10–15 minute după masă (glicemie)', en: '10–15 minute walk after meals (blood sugar)' },
    summary: {
      ro: 'Mușchii care lucrează preiau glucoza din sânge. La adulți cu diabet de tip 2, 10 minute de mers după fiecare masă principală au redus glicemia de după masă cu ~12% față de 30 de minute de mers făcute oricând, iar după cină efectul a fost ~22%. La vârstnici cu risc, trei plimbări de 15 minute după mese au fost cel puțin la fel de bune ca o plimbare de 45 de minute. Și pauzele scurte de mers care întrerup statul jos scad glicemia și insulina după masă.',
      en: 'Working muscles pull glucose out of the blood. In adults with type 2 diabetes, 10 minutes of walking after each main meal lowered post-meal blood sugar by ~12% compared with 30 minutes of walking at any time, and by ~22% after dinner. In older adults at risk, three 15-minute post-meal walks were at least as good as one 45-minute walk. Short walking breaks from sitting also lower post-meal glucose and insulin.',
    },
    how: {
      ro: ['Pornește în primele 30 de minute după masă.', 'Ritm lejer spre moderat; contează mai mult momentul decât viteza.', 'Cel mai mare câștig: după masa cea mai bogată în carbohidrați (de obicei cina).', 'Alternativă în casă: mers pe loc, urcat scări, treburi casnice.'],
      en: ['Start within 30 minutes after eating.', 'Easy to moderate pace; timing matters more than speed.', 'Biggest gain: after the most carb-heavy meal (often dinner).', 'Indoor option: marching in place, stairs, housework.'],
    },
    caution: {
      ro: 'Dacă iei insulină sau sulfoniluree, discută cu medicul (risc de hipoglicemie). Studiile sunt mici și pe termen scurt.',
      en: 'If you take insulin or sulfonylureas, talk to your doctor (risk of low blood sugar). The studies are small and short-term.',
    },
    sources: [S.reynolds, S.dipietro, S.buffey],
  },
  {
    id: 'vilpa', icon: '⚡', evidence: 'cohort', workout: 'vilpa',
    title: { ro: '„Gustări” de efort viguros (VILPA)', en: 'Vigorous “exercise snacks” (VILPA)' },
    summary: {
      ro: 'Într-un studiu UK Biobank pe ~25.000 de adulți care nu făceau sport, accelerometrele au arătat că cei care aveau zilnic ~3 reprize de 1–2 minute de efort viguros în viața de zi cu zi (urcat scări repede, mers foarte alert, cărat cumpărături) au avut cu ~38–40% mai puține decese din orice cauză și cancer și cu ~48–49% mai puține decese cardiovasculare, comparativ cu cei fără astfel de reprize.',
      en: 'In a UK Biobank study of ~25,000 adults who did not exercise, wrist monitors showed that people with ~3 daily bouts of 1–2 minutes of vigorous everyday activity (fast stair climbing, very brisk walking, carrying shopping) had ~38–40% fewer deaths from any cause and cancer and ~48–49% fewer cardiovascular deaths than those with none.',
    },
    how: {
      ro: ['De 3 ori pe zi, 1 minut în care respiri greu: scări în pas alert, urcare în pantă, mers foarte rapid.', 'Folosește cronometrul de 1 minut de mai jos.', 'Se adună cu gustările de mișcare din tabul Mișcare.'],
      en: ['3 times a day, 1 minute that makes you breathe hard: brisk stairs, uphill walking, very fast walking.', 'Use the 1-minute timer below.', 'Adds up with the movement snacks in the Move tab.'],
    },
    caution: {
      ro: 'Studiu observațional: arată o asociere, nu dovedește cauza. Cu boli de inimă, întreabă medicul înainte de efort viguros.',
      en: 'Observational study: it shows an association, not proof of cause. With heart disease, ask your doctor before vigorous effort.',
    },
    sources: [S.stamatakis, S.who2020],
  },
  {
    id: 'sauna', icon: '🧖', evidence: 'cohort',
    title: { ro: 'Sauna', en: 'Sauna' },
    summary: {
      ro: 'Într-o cohortă finlandeză de 2.315 bărbați urmăriți ~20 de ani, cei care foloseau sauna de 4–7 ori pe săptămână au avut un risc mai mic de moarte subită cardiacă, deces cardiovascular și deces din orice cauză decât cei care mergeau o dată pe săptămână. Ședințe mai lungi (peste 19 min) au fost asociate cu risc mai mic.',
      en: 'In a Finnish cohort of 2,315 men followed for ~20 years, those using a sauna 4–7 times a week had a lower risk of sudden cardiac death, cardiovascular death and death from any cause than those going once a week. Longer sessions (over 19 min) were linked to lower risk.',
    },
    how: {
      ro: ['Saună uscată tradițională (~80 °C), sesiuni de 10–20 min, după cum tolerezi.', 'Hidratează-te bine înainte și după.', 'Ieși imediat dacă ai amețeală sau greață.'],
      en: ['Traditional dry sauna (~80 °C), 10–20 min sessions, as tolerated.', 'Hydrate well before and after.', 'Get out right away if you feel dizzy or sick.'],
    },
    caution: {
      ro: 'Doar observațional, numai bărbați finlandezi de vârstă medie; persoanele care merg des la saună pot fi mai sănătoase din alte motive. Fără alcool în saună. Evit-o dacă ești însărcinată, ai angină instabilă, infarct recent sau tensiune foarte mică, fără avizul medicului.',
      en: 'Observational only, middle-aged Finnish men only; frequent sauna users may be healthier for other reasons. No alcohol in the sauna. Avoid it if pregnant, with unstable angina, a recent heart attack or very low blood pressure unless your doctor agrees.',
    },
    sources: [S.laukkanen],
  },
  {
    id: 'cold', icon: '🧊', evidence: 'caution',
    title: { ro: 'Atenție: apa rece imediat după forță', en: 'Caution: cold water right after strength' },
    summary: {
      ro: 'Într-un studiu controlat, 10 minute în apă rece (10 °C) după fiecare antrenament de forță, timp de 12 săptămâni, au dus la câștiguri mai mici de masă musculară și forță decât recuperarea activă. Imersia rece a redus semnalele anabolice din mușchi.',
      en: 'In a controlled trial, 10 minutes in cold water (10 °C) after every strength session for 12 weeks led to smaller muscle and strength gains than active recovery. Cold immersion blunted anabolic signalling in muscle.',
    },
    how: {
      ro: ['Dacă scopul e masa musculară, nu face baie rece imediat după forță.', 'Dacă îți place expunerea la rece, fă-o în zile fără forță sau separat de antrenament.', 'Intră treptat, niciodată singur în ape deschise.'],
      en: ['If your goal is muscle, skip the cold bath right after strength work.', 'If you enjoy cold exposure, do it on non-strength days or apart from training.', 'Get in gradually, never alone in open water.'],
    },
    caution: {
      ro: 'Șocul la frig crește brusc pulsul și tensiunea: evită-l cu boli de inimă sau hipertensiune fără avizul medicului.',
      en: 'Cold shock sharply raises heart rate and blood pressure: avoid it with heart disease or high blood pressure unless your doctor agrees.',
    },
    sources: [S.roberts],
  },
  {
    id: 'fasted', icon: '🍽️', evidence: 'caution',
    title: { ro: 'Antrenamentul pe stomacul gol nu topește mai multă grăsime', en: 'Fasted training does not burn more fat' },
    summary: {
      ro: 'Într-un studiu randomizat de 4 săptămâni, cu deficit caloric identic, cardio făcut pe nemâncate și cardio după masă au dus la aceeași scădere în greutate și de grăsime. Ce contează e deficitul caloric total și cât de constant te antrenezi.',
      en: 'In a 4-week randomised trial with the same calorie deficit, fasted cardio and fed cardio produced the same loss of weight and fat. What matters is the total calorie deficit and how consistently you train.',
    },
    how: {
      ro: ['Antrenează-te la ora la care o poți face constant.', 'Pentru intervale grele sau forță, o gustare cu 1–2 ore înainte ajută de obicei performanța.'],
      en: ['Train at the time you can stick with.', 'For hard intervals or strength, a snack 1–2 hours before usually helps performance.'],
    },
    caution: {
      ro: 'Cu diabet tratat cu insulină sau sulfoniluree, efortul pe nemâncate crește riscul de hipoglicemie. Studiul a fost mic (20 de femei tinere).',
      en: 'With diabetes treated with insulin or sulfonylureas, fasted exercise raises the risk of low blood sugar. The study was small (20 young women).',
    },
    sources: [S.schoenfeld],
  },
];

// ---------- Workouts (guided, timed segments) ----------
const min = (n: number) => n * 60;
const seg = (kind: SegKind, sec: number, lro: string, len: string, cro: string, cen: string, exId?: string): Segment =>
  ({ kind, sec, label: { ro: lro, en: len }, cue: { ro: cro, en: cen }, exId });

const circuitFor = (p: Profile): string[] => {
  const eq = p.location === 'gym' ? ['dumbbells', 'band'] : p.homeEquipment || [];
  const db = eq.includes('dumbbells') || p.location === 'gym';
  return [
    db ? 'goblet_squat' : 'bw_squat',
    p.level === 'beginner' ? 'incline_pushup' : 'pushup',
    db ? 'db_row' : eq.includes('band') ? 'band_row' : 'table_row',
    db ? 'db_rdl' : 'glute_bridge',
    'split_squat',
    'plank',
  ];
};

export const BIO_WORKOUTS: BioWorkout[] = [
  {
    id: 'norwegian_4x4', icon: '🚀', topic: 'vo2max', zone: 'z45', vigorous: true,
    title: { ro: 'Intervale 4×4 (VO2max)', en: '4×4 intervals (VO2max)' },
    text: { ro: 'Protocolul Helgerud: 10 min încălzire, 4 min tare / 3 min ușor, răcire 5 min. Pe bandă în pantă, bicicletă, vâslit sau alergare în deal.', en: 'Helgerud protocol: 10 min warm-up, 4 min hard / 3 min easy, 5 min cool-down. Incline treadmill, bike, rower or hill running.' },
    variants: [
      { id: '2', label: { ro: '2 intervale (început)', en: '2 intervals (start)' } },
      { id: '3', label: { ro: '3 intervale', en: '3 intervals' } },
      { id: '4', label: { ro: '4 intervale', en: '4 intervals' } },
    ],
    defaultVariant: '4',
    build: (v) => {
      const n = Number(v) || 4;
      const out: Segment[] = [seg('warm', min(10), 'Încălzire', 'Warm-up', 'Ușor, crește treptat ritmul. Poți vorbi liber.', 'Easy, build up gradually. You can talk freely.')];
      for (let i = 1; i <= n; i++) {
        out.push(seg('work', min(4), `Interval ${i} / ${n}`, `Interval ${i} / ${n}`, 'Tare: 85–95% din pulsul maxim. Poți spune doar câteva cuvinte. Primul minut urcă treptat.', 'Hard: 85–95% of max heart rate. You can only say a few words. Ease into it over the first minute.'));
        if (i < n) out.push(seg('recover', min(3), 'Recuperare activă', 'Active recovery', 'Mers sau pedalat ușor, nu te opri complet.', 'Walk or pedal easily, don’t stop completely.'));
      }
      out.push(seg('cool', min(5), 'Răcire', 'Cool-down', 'Ușor, lasă pulsul să coboare.', 'Easy, let your heart rate come down.'));
      return out;
    },
  },
  {
    id: 'zone2', icon: '🫀', topic: 'zone2', zone: 'z2',
    title: { ro: 'Zona 2: cardio constant', en: 'Zone 2: steady cardio' },
    text: { ro: 'Efort moderat constant. Mers alert în pantă, bicicletă, eliptică sau alergare ușoară. Ținta: 2–3 ore pe săptămână în total.', en: 'Steady moderate effort. Brisk uphill walking, cycling, elliptical or easy jogging. Target: 2–3 hours a week in total.' },
    variants: [
      { id: '30', label: { ro: '30 min', en: '30 min' } },
      { id: '45', label: { ro: '45 min', en: '45 min' } },
      { id: '60', label: { ro: '60 min', en: '60 min' } },
    ],
    defaultVariant: '45',
    build: (v) => {
      const total = Number(v) || 45;
      return [
        seg('warm', min(5), 'Încălzire', 'Warm-up', 'Pornește ușor.', 'Start easy.'),
        seg('steady', min(total - 8), 'Zona 2', 'Zone 2', 'Poți vorbi în propoziții, dar nu poți cânta. Dacă gâfâi, încetinește.', 'You can talk in sentences but not sing. If you’re panting, slow down.'),
        seg('cool', min(3), 'Răcire', 'Cool-down', 'Ușor.', 'Easy.'),
      ];
    },
  },
  {
    id: 'post_meal_walk', icon: '🚶', topic: 'post_meal', zone: 'light',
    title: { ro: 'Plimbare după masă', en: 'After-meal walk' },
    text: { ro: 'Pornește în primele 30 de minute după masă. Cel mai mult contează după cină sau după masa cu cei mai mulți carbohidrați.', en: 'Start within 30 minutes after eating. It matters most after dinner or the most carb-heavy meal.' },
    variants: [
      { id: '10', label: { ro: '10 min', en: '10 min' } },
      { id: '15', label: { ro: '15 min', en: '15 min' } },
    ],
    defaultVariant: '10',
    build: (v) => [seg('steady', min(Number(v) || 10), 'Mers', 'Walk', 'Ritm lejer spre moderat. În casă: mers pe loc sau scări.', 'Easy to moderate pace. Indoors: march in place or take the stairs.')],
  },
  {
    id: 'vilpa', icon: '⚡', topic: 'vilpa', zone: 'vig', vigorous: true,
    title: { ro: 'Gustare viguroasă de 1 minut', en: '1-minute vigorous snack' },
    text: { ro: 'Un minut în care respiri greu: scări în pas alert, mers foarte rapid sau în pantă. Repetă de ~3 ori pe zi.', en: 'One minute that makes you breathe hard: brisk stairs, very fast or uphill walking. Repeat ~3 times a day.' },
    variants: [
      { id: '1', label: { ro: '1 × 1 min', en: '1 × 1 min' } },
      { id: '2', label: { ro: '2 × 1 min', en: '2 × 1 min' } },
    ],
    defaultVariant: '1',
    build: (v) => {
      const n = Number(v) || 1;
      const out: Segment[] = [];
      for (let i = 1; i <= n; i++) {
        out.push(seg('work', 60, n > 1 ? `Repriza ${i}` : 'Efort viguros', n > 1 ? `Bout ${i}` : 'Vigorous effort', 'Respiri greu, poți spune doar câteva cuvinte.', 'Breathing hard, you can only say a few words.'));
        if (i < n) out.push(seg('recover', 90, 'Ușor', 'Easy', 'Mers lejer.', 'Easy walking.'));
      }
      return out;
    },
  },
  {
    id: 'strength_min', icon: '💪', topic: 'strength', zone: 'strength',
    title: { ro: 'Forță minimă eficientă', en: 'Minimum effective strength' },
    text: { ro: 'Circuit pentru tot corpul, 40 s lucru / 20 s pauză. Exercițiile se adaptează echipamentului tău. Fă-l de 2 ori pe săptămână dacă nu ajungi la programul complet.', en: 'Full-body circuit, 40 s work / 20 s rest. Exercises adapt to your equipment. Do it twice a week when you can’t fit in the full program.' },
    variants: [
      { id: '2', label: { ro: '2 runde (~15 min)', en: '2 rounds (~15 min)' } },
      { id: '3', label: { ro: '3 runde (~21 min)', en: '3 rounds (~21 min)' } },
    ],
    defaultVariant: '3',
    build: (v, p) => {
      const rounds = Number(v) || 3;
      const ids = circuitFor(p);
      const out: Segment[] = [seg('warm', min(3), 'Încălzire', 'Warm-up', 'Mers pe loc, rotiri de umeri și șolduri, câteva genuflexiuni ușoare.', 'March in place, shoulder and hip circles, a few easy squats.')];
      for (let r = 1; r <= rounds; r++) {
        ids.forEach((id, k) => {
          out.push(seg('work', 40, `Runda ${r} / ${rounds}`, `Round ${r} / ${rounds}`, 'Tehnică bună; ultimele repetări să fie grele.', 'Good form; the last reps should feel hard.', id));
          if (!(r === rounds && k === ids.length - 1)) out.push(seg('recover', 20, 'Pauză', 'Rest', 'Respiră, pregătește următorul exercițiu.', 'Breathe, set up for the next one.', ids[(k + 1) % ids.length]));
        });
      }
      return out;
    },
  },
];

export const bioWorkout = (id: string) => BIO_WORKOUTS.find((w) => w.id === id);
export const bioTopic = (id: string) => BIO_TOPICS.find((t) => t.id === id);
/** Conditions where vigorous intervals need a doctor's OK first (ACSM 2015 screening). */
export const needsClearance = (p: Profile) => p.conditions?.some((c) => ['heart', 'hypertension', 'pregnancy', 'diabetes_t2', 'kidney'].includes(c));
