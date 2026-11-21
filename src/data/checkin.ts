// Body-changes check-in. Answers 1–5 (1 = much worse / never, 5 = much better / always).
// Population-level risk figures come from large cohort studies and meta-analyses; they describe groups
// of people who keep an activity level, never a personal guarantee.
export type Group = 'physical' | 'nervous' | 'aesthetic' | 'habits';

export const QUESTIONS: { g: Group; ro: string; en: string }[] = [
  { g: 'physical', ro: 'Cât de multă energie ai în timpul zilei?', en: 'How much energy do you have during the day?' },
  { g: 'physical', ro: 'Cât de ușor urci 2–3 etaje pe scări?', en: 'How easily can you climb 2–3 flights of stairs?' },
  { g: 'physical', ro: 'Cât de puternic te simți la exercițiile de forță?', en: 'How strong do you feel in strength exercises?' },
  { g: 'physical', ro: 'Cât de repede îți revii după efort?', en: 'How quickly do you recover after effort?' },
  { g: 'physical', ro: 'Cât de mobil și „dezlegat” te simți (aplecat, ridicat de jos)?', en: 'How mobile do you feel (bending, getting up from the floor)?' },
  { g: 'physical', ro: 'Cât de puțin te dor spatele, gâtul sau articulațiile?', en: 'How little do your back, neck or joints hurt?' },
  { g: 'nervous', ro: 'Cât de bine dormi?', en: 'How well do you sleep?' },
  { g: 'nervous', ro: 'Cât de bună îți e dispoziția?', en: 'How good is your mood?' },
  { g: 'nervous', ro: 'Cât de bine faci față stresului?', en: 'How well do you handle stress?' },
  { g: 'nervous', ro: 'Cât de concentrat ești la muncă?', en: 'How focused are you at work?' },
  { g: 'nervous', ro: 'Cât de motivat ești să te miști?', en: 'How motivated are you to move?' },
  { g: 'aesthetic', ro: 'Cum îți vin hainele (mai larg = mai bine)?', en: 'How do your clothes fit (looser = better)?' },
  { g: 'aesthetic', ro: 'Cât de dreaptă îți e postura?', en: 'How upright is your posture?' },
  { g: 'aesthetic', ro: 'Cât de mulțumit ești de ce vezi în oglindă?', en: 'How happy are you with what you see in the mirror?' },
  { g: 'aesthetic', ro: 'Cât de încrezător te simți în corpul tău?', en: 'How confident do you feel in your body?' },
  { g: 'habits', ro: 'Cât de des ți-ai atins obiectivul de apă?', en: 'How often did you hit your water goal?' },
  { g: 'habits', ro: 'Cât de rar ai poftă de dulciuri?', en: 'How rarely do you crave sweets?' },
  { g: 'habits', ro: 'Cât de des ai mâncat legume la mese?', en: 'How often did you eat vegetables at meals?' },
  { g: 'habits', ro: 'Cât de des te-ai ridicat de pe scaun și ai mers?', en: 'How often did you get up and walk?' },
  { g: 'habits', ro: 'Cât de mulțumit ești de consecvența ta?', en: 'How happy are you with your consistency?' },
];

export const SCALE = {
  ro: ['Deloc', 'Puțin', 'Mediu', 'Bine', 'Foarte bine'],
  en: ['Not at all', 'A little', 'Average', 'Good', 'Very good'],
};

/** Check-in schedule in weeks from account creation: baseline, 1, 2, 3, then every 4 weeks. */
export function dueWeek(weeksSinceStart: number, done: number[]): number | null {
  const plan = [0, 1, 2, 3];
  for (let w = 7; w <= 520; w += 4) plan.push(w);
  for (const w of plan) if (w <= weeksSinceStart && !done.includes(w)) return w;
  return null;
}

type T = { ro: string; en: string };

/** What typically happens in the body at this stage, if training was regular. */
export function expectedChanges(week: number): { physical: T[]; nervous: T[]; aesthetic: T[] } {
  if (week <= 1) return {
    physical: [
      { ro: 'Mușchii folosesc mai bine glucoza: sensibilitatea la insulină crește deja după un singur antrenament și durează 24–48 de ore.', en: 'Muscles use glucose better: insulin sensitivity rises after a single workout and lasts 24–48 hours.' },
      { ro: 'Tensiunea arterială scade câteva ore după fiecare antrenament (hipotensiune post-efort).', en: 'Blood pressure drops for several hours after each workout (post-exercise hypotension).' },
    ],
    nervous: [
      { ro: 'Primele câștiguri de forță vin din creier: învață să activeze mai multe fibre musculare, mai coordonat.', en: 'Early strength gains come from the brain: it learns to recruit more muscle fibres, in better sync.' },
      { ro: 'Dispoziția și somnul se îmbunătățesc adesea din primele zile de mișcare.', en: 'Mood and sleep often improve within the first days of moving.' },
    ],
    aesthetic: [
      { ro: 'Încă nu se vede mult în oglindă, și e normal. Postura și „prezența” se schimbă primele.', en: 'Not much shows in the mirror yet, and that’s normal. Posture and presence change first.' },
    ],
  };
  if (week <= 3) return {
    physical: [
      { ro: 'Volumul de sânge crește și inima pompează mai eficient; efortul pare mai ușor la același ritm.', en: 'Blood volume rises and the heart pumps more efficiently; the same pace feels easier.' },
      { ro: 'Capacitatea aerobă (VO₂max) începe să crească după 2–3 săptămâni de antrenament regulat.', en: 'Aerobic capacity (VO₂max) starts rising after 2–3 weeks of regular training.' },
      { ro: 'Forța crește vizibil la exerciții: tendoanele și mușchii se adaptează la încărcare.', en: 'Strength rises noticeably: tendons and muscles adapt to the load.' },
    ],
    nervous: [
      { ro: 'Coordonarea și tehnica se fixează; mișcările devin automate.', en: 'Coordination and technique settle in; movements become automatic.' },
      { ro: 'Rutina începe să devină obicei: creierul o asociază cu recompensa.', en: 'The routine starts becoming a habit: the brain links it to reward.' },
    ],
    aesthetic: [
      { ro: 'Mușchii pot părea mai „plini” (mai mult glicogen și apă în ei).', en: 'Muscles can look fuller (more glycogen and water inside).' },
      { ro: 'Dacă ești în deficit caloric, talia începe să scadă cu primii centimetri.', en: 'If you’re in a calorie deficit, your waist starts losing the first centimetres.' },
    ],
  };
  return {
    physical: [
      { ro: 'Creșterea masei musculare devine măsurabilă (de obicei după 6–8 săptămâni).', en: 'Muscle growth becomes measurable (usually after 6–8 weeks).' },
      { ro: 'Oasele răspund la încărcare: celulele osoase (osteocite) simt forțele și semnalizează construcția de os nou.', en: 'Bones respond to loading: bone cells (osteocytes) sense the forces and signal new bone building.' },
      { ro: 'Tensiunea de repaus poate scădea cu câțiva mmHg după 8–12 săptămâni.', en: 'Resting blood pressure can drop by a few mmHg after 8–12 weeks.' },
    ],
    nervous: [
      { ro: 'Mai multă reziliență la stres și somn mai profund.', en: 'More resilience to stress and deeper sleep.' },
    ],
    aesthetic: [
      { ro: 'Schimbări vizibile de compoziție corporală: mai mult mușchi, mai puțină grăsime, mai ales dacă alimentația e aliniată.', en: 'Visible body-composition changes: more muscle, less fat, especially with aligned nutrition.' },
    ],
  };
}

/** Internal health: population-level associations for people who keep this activity level. */
export const INTERNAL: { ro: string; en: string; src: string; needs: 'aerobic' | 'strength' | 'any' }[] = [
  { ro: 'Adulții care fac 150–300 min/săptămână de mișcare moderată au o mortalitate generală cu ~31% mai mică decât cei inactivi.', en: 'Adults doing 150–300 min/week of moderate activity have ~31% lower all-cause mortality than inactive adults.', src: 'Arem et al., JAMA Intern Med 2015', needs: 'aerobic' },
  { ro: 'Activitatea fizică regulată este asociată cu un risc de boli cardiovasculare (inclusiv infarct) cu 20–35% mai mic.', en: 'Regular physical activity is associated with a 20–35% lower risk of cardiovascular disease (including heart attack).', src: 'Warburton et al., CMAJ 2006', needs: 'aerobic' },
  { ro: 'Persoanele foarte active au un risc de AVC cu ~25% mai mic.', en: 'Highly active people have ~25% lower stroke risk.', src: 'Lee et al., Stroke 2003', needs: 'aerobic' },
  { ro: '150 min/săptămână de mers alert sunt asociate cu un risc de diabet tip 2 cu ~26% mai mic.', en: '150 min/week of brisk walking is associated with ~26% lower type 2 diabetes risk.', src: 'Smith et al., Diabetologia 2016', needs: 'aerobic' },
  { ro: 'Mișcarea în timpul liber este asociată cu risc mai mic pentru 13 tipuri de cancer (de ex. colon −16%, sân −10%).', en: 'Leisure-time activity is associated with lower risk of 13 cancer types (e.g. colon −16%, breast −10%).', src: 'Moore et al., JAMA Intern Med 2016', needs: 'aerobic' },
  { ro: 'Exercițiile de forță 30–60 min/săptămână sunt asociate cu un risc cu 10–17% mai mic de deces, boli cardiovasculare, cancer și diabet.', en: 'Strength training 30–60 min/week is associated with 10–17% lower risk of death, cardiovascular disease, cancer and diabetes.', src: 'Momma et al., Br J Sports Med 2022', needs: 'strength' },
  { ro: 'Persoanele active au un risc de fractură de șold (legată de osteoporoză) cu ~38–45% mai mic.', en: 'Active people have ~38–45% lower risk of hip fracture (linked to osteoporosis).', src: 'Moayyeri, Ann Epidemiol 2008', needs: 'strength' },
  { ro: 'Echivalentul a 2,5 ore/săptămână de mers alert este asociat cu un risc de depresie cu ~25% mai mic.', en: 'The equivalent of 2.5 h/week of brisk walking is associated with ~25% lower depression risk.', src: 'Pearce et al., JAMA Psychiatry 2022', needs: 'any' },
  { ro: 'Programele de exerciții de echilibru și forță reduc numărul de căderi la vârstnici cu ~23%.', en: 'Balance and strength exercise programmes reduce falls in older adults by ~23%.', src: 'Sherrington et al., Cochrane 2019', needs: 'strength' },
];

export function groupScores(ans: number[]) {
  const out: Record<Group, number> = { physical: 0, nervous: 0, aesthetic: 0, habits: 0 };
  const cnt: Record<Group, number> = { physical: 0, nervous: 0, aesthetic: 0, habits: 0 };
  QUESTIONS.forEach((q, i) => { if (ans[i]) { out[q.g] += ans[i]; cnt[q.g]++; } });
  (Object.keys(out) as Group[]).forEach((g) => { out[g] = cnt[g] ? out[g] / cnt[g] : 0; });
  return out;
}

export const CHEERS = {
  big: [
    { ro: 'BRAVO! Corpul tău răspunde exact cum trebuie.', en: 'WELL DONE! Your body is responding exactly as it should.' },
    { ro: 'Ești pe drumul cel bun. Continuă așa!', en: 'You’re on the right track. Keep up the good work!' },
  ],
  small: [
    { ro: 'Consecvența e cheia. Schimbările mari se construiesc din zile obișnuite.', en: 'Consistency is the key. Big changes are built from ordinary days.' },
    { ro: 'Nu te descuraja: multe schimbări au loc înăuntru înainte să se vadă în oglindă.', en: 'Don’t get discouraged: many changes happen inside before the mirror shows them.' },
    { ro: 'Nu sabota progresul cu dulciuri „de consolare”. Un fruct și o plimbare fac mai mult.', en: 'Don’t sabotage progress with “comfort” sweets. A fruit and a walk do more.' },
  ],
};
