// Short functional routines ("movement snacks") and evidence-based physiotherapy programmes.
// Movement snacks follow WHO 2020 ("every move counts", break up sedentary time).
// Physio routines follow: NICE NG59 (low back pain, 2016/2020), NICE NG226 (osteoarthritis, 2022) & OARSI 2019,
// Cochrane review "Exercises for mechanical neck disorders" (Gross 2015), and UK BESS/BOA guidance for
// rotator-cuff related shoulder pain (exercise-led rehab). No spinal manipulation or chiropractic.
import type { Anim } from './exercises';

export interface Move {
  name: { ro: string; en: string };
  anim: Anim;
  dose: { ro: string; en: string };
  cue: { ro: string; en: string };
}

export interface Routine {
  id: string;
  kind: 'snack' | 'physio';
  group: string;
  icon: string;
  title: { ro: string; en: string };
  minutes: number;
  when?: { ro: string; en: string };
  moves: Move[];
  why: { ro: string; en: string };
  redFlags?: { ro: string[]; en: string[] };
  source: string;
}

const m = (ro: string, en: string, anim: Anim, dRo: string, dEn: string, cRo: string, cEn: string): Move => ({
  name: { ro, en }, anim, dose: { ro: dRo, en: dEn }, cue: { ro: cRo, en: cEn },
});

export const ROUTINES: Routine[] = [
  // ---------------- Movement snacks ----------------
  {
    id: 'morning', kind: 'snack', group: 'morning', icon: '☀️', minutes: 5,
    title: { ro: 'Trezirea corpului', en: 'Morning wake-up' },
    when: { ro: 'Dimineața, înainte de cafea', en: 'Morning, before coffee' },
    moves: [
      m('Pisica–cămila', 'Cat–cow', 'catcow', '8 repetări', '8 reps', 'Mișcă coloana vertebră cu vertebră, lent.', 'Move the spine slowly, segment by segment.'),
      m('Genuflexiuni', 'Squats', 'squat', '10 repetări', '10 reps', 'Coboară cât e confortabil.', 'Go as low as is comfortable.'),
      m('Brațele sus pe perete', 'Wall slides', 'ohp', '10 repetări', '10 reps', 'Spatele lipit de perete, brațele alunecă în sus.', 'Back on the wall, slide the arms up.'),
      m('Aplecări din șold', 'Hip hinges', 'hinge', '10 repetări', '10 reps', 'Spatele drept, șoldurile înapoi.', 'Flat back, hips back.'),
      m('Mers pe loc alert', 'Brisk marching', 'march', '60 secunde', '60 seconds', 'Ridică genunchii, balansează brațele.', 'Lift the knees, swing the arms.'),
    ],
    why: { ro: 'Mobilitate și circulație după somn; pornește ziua cu o victorie mică.', en: 'Mobility and circulation after sleep; start the day with a small win.' },
    source: 'WHO 2020 Guidelines on physical activity and sedentary behaviour',
  },
  {
    id: 'office', kind: 'snack', group: 'office', icon: '💼', minutes: 4,
    title: { ro: 'Pauza de birou', en: 'Office break' },
    when: { ro: 'La fiecare 60–90 de minute de stat jos', en: 'Every 60–90 minutes of sitting' },
    moves: [
      m('Retracția bărbiei', 'Chin tucks', 'chin_tuck', '10 repetări', '10 reps', 'Trage bărbia înapoi, ca un „dublu bărbie”, privirea înainte.', 'Draw the chin straight back, eyes level.'),
      m('Strângerea omoplaților', 'Shoulder blade squeeze', 'row', '12 repetări', '12 reps', 'Coatele înapoi, omoplații spre buzunarele de la spate.', 'Elbows back, shoulder blades down and together.'),
      m('Ridicări de pe scaun', 'Sit-to-stand', 'squat', '10 repetări', '10 reps', 'Fără mâini, controlat.', 'No hands, controlled.'),
      m('Flotări pe birou', 'Desk push-ups', 'pushup', '10 repetări', '10 reps', 'Biroul să fie stabil.', 'Make sure the desk is stable.'),
      m('Ridicări pe vârfuri', 'Calf raises', 'calf', '15 repetări', '15 reps', 'Pompează sângele din picioare.', 'Pumps blood back from the legs.'),
    ],
    why: { ro: 'Statul jos prelungit e asociat cu risc cardiometabolic; pauzele scurte îl întrerup.', en: 'Prolonged sitting is linked to cardiometabolic risk; short breaks interrupt it.' },
    source: 'WHO 2020; Dunstan et al., Diabetes Care 2012 (breaking up sitting lowers post-meal glucose)',
  },
  {
    id: 'chair', kind: 'snack', group: 'chair', icon: '🪑', minutes: 6,
    title: { ro: 'Pe scaun (potrivit și pentru 60+)', en: 'Chair routine (great for 60+)' },
    when: { ro: 'Oricând, chiar și în fața televizorului', en: 'Any time, even watching TV' },
    moves: [
      m('Mers pe loc așezat', 'Seated marching', 'seated_march', '45 secunde', '45 seconds', 'Spatele drept, genunchii sus alternativ.', 'Sit tall, lift knees alternately.'),
      m('Extensii de genunchi', 'Seated knee extensions', 'legext', '10 pe fiecare picior', '10 each leg', 'Întinde piciorul, ține 2 secunde.', 'Straighten the leg, hold 2 seconds.'),
      m('Rotații ale trunchiului', 'Seated twists', 'twist', '8 pe fiecare parte', '8 each side', 'Rotește din talie, șoldurile fixe.', 'Rotate from the waist, hips still.'),
      m('Ridicări de pe scaun', 'Sit-to-stand', 'squat', '8–10 repetări', '8–10 reps', 'Te poți ajuta cu mâinile la început.', 'Use your hands at first if needed.'),
      m('Echilibru cu sprijin', 'Supported balance', 'balance', '20 s pe fiecare picior', '20 s each leg', 'Ține-te de spătarul scaunului.', 'Hold the chair back.'),
    ],
    why: { ro: 'Forța picioarelor și echilibrul scad riscul de cădere la vârstnici.', en: 'Leg strength and balance reduce fall risk in older adults.' },
    source: 'WHO 2020 (multicomponent activity for older adults); Sherrington et al., Cochrane 2019 (exercise for preventing falls)',
  },
  {
    id: 'after_meal', kind: 'snack', group: 'after_meal', icon: '🚶', minutes: 10,
    title: { ro: 'Plimbarea de după masă', en: 'After-meal walk' },
    when: { ro: 'În primele 30 de minute după masă', en: 'Within 30 minutes after eating' },
    moves: [
      m('Mers în ritm normal', 'Easy-pace walk', 'march', '10 minute', '10 minutes', 'Ritm în care poți vorbi.', 'A pace where you can still talk.'),
    ],
    why: { ro: '10 minute de mers după fiecare masă au redus glicemia de după masă mai mult decât o plimbare de 30 de minute o dată pe zi.', en: 'A 10-minute walk after each meal lowered post-meal glucose more than one daily 30-minute walk.' },
    source: 'Reynolds et al., Diabetologia 2016',
  },
  {
    id: 'evening', kind: 'snack', group: 'evening', icon: '🌙', minutes: 6,
    title: { ro: 'Relaxare de seară', en: 'Evening wind-down' },
    when: { ro: 'Cu 30–60 de minute înainte de somn', en: '30–60 minutes before bed' },
    moves: [
      m('Poziția copilului', 'Child’s pose', 'childpose', '45 secunde', '45 seconds', 'Respiră lent pe nas.', 'Breathe slowly through the nose.'),
      m('Pisica–cămila', 'Cat–cow', 'catcow', '8 repetări', '8 reps', 'Lent, cu respirația.', 'Slow, with the breath.'),
      m('Întinderea flexorilor șoldului', 'Hip flexor stretch', 'lunge', '30 s pe fiecare parte', '30 s each side', 'Strânge fesierul piciorului din spate.', 'Squeeze the rear leg’s glute.'),
      m('Genunchii la piept', 'Knees to chest', 'deadbug', '45 secunde', '45 seconds', 'Pe spate, legănare ușoară.', 'On your back, gentle rocking.'),
      m('Respirație 4–6', '4–6 breathing', 'childpose', '2 minute', '2 minutes', 'Inspiră 4 secunde, expiră 6.', 'Inhale 4 seconds, exhale 6.'),
    ],
    why: { ro: 'Expirul lung activează sistemul nervos parasimpatic și ajută adormirea.', en: 'Long exhales engage the parasympathetic system and help you fall asleep.' },
    source: 'Zaccaro et al., Front Hum Neurosci 2018 (slow breathing review)',
  },

  // ---------------- Physiotherapy (kinetoterapie) ----------------
  {
    id: 'pt_low_back', kind: 'physio', group: 'low_back', icon: '🦴', minutes: 12,
    title: { ro: 'Durere lombară (spate jos)', en: 'Low back pain' },
    moves: [
      m('Înclinări de bazin', 'Pelvic tilts', 'bridge', '10 repetări', '10 reps', 'Pe spate, lipește ușor zona lombară de sol.', 'On your back, gently flatten your lower back.'),
      m('Genunchii la piept', 'Knees to chest', 'deadbug', '3 × 20 s', '3 × 20 s', 'Fără durere ascuțită.', 'No sharp pain.'),
      m('Pisica–cămila', 'Cat–cow', 'catcow', '10 repetări', '10 reps', 'În limita confortului.', 'Within comfort.'),
      m('Bird dog', 'Bird dog', 'birddog', '6 pe fiecare parte', '6 each side', 'Bazinul stabil.', 'Keep the pelvis stable.'),
      m('Pod pentru fesieri', 'Glute bridge', 'bridge', '10 repetări', '10 reps', 'Strânge fesierii, nu arcui spatele.', 'Squeeze the glutes, don’t arch.'),
      m('Mers', 'Walking', 'march', '10–20 minute', '10–20 minutes', 'Rămâi activ: e unul dintre cele mai bune tratamente.', 'Stay active: one of the best treatments.'),
    ],
    why: { ro: 'Ghidul NICE recomandă exercițiul și menținerea activității ca primă linie. Repausul la pat prelungit întârzie vindecarea.', en: 'NICE recommends exercise and staying active as first line. Prolonged bed rest delays recovery.' },
    redFlags: {
      ro: ['Amorțeală în zona inghinală/fese sau probleme noi la urinat sau scaun: URGENȚĂ (112)', 'Slăbiciune progresivă într-un picior', 'Febră, scădere în greutate inexplicabilă sau istoric de cancer', 'Durere după o cădere sau un accident', 'Durere constantă noaptea, care nu se schimbă cu poziția'],
      en: ['Numbness around the groin/buttocks or new bladder/bowel problems: EMERGENCY (112)', 'Progressive weakness in a leg', 'Fever, unexplained weight loss or a history of cancer', 'Pain after a fall or accident', 'Constant night pain that does not change with position'],
    },
    source: 'NICE NG59 (2016, updated 2020); Hayden et al., Cochrane 2021 (exercise therapy for chronic low back pain)',
  },
  {
    id: 'pt_neck', kind: 'physio', group: 'neck', icon: '🧣', minutes: 8,
    title: { ro: 'Gât și umeri încordați', en: 'Neck and tight shoulders' },
    moves: [
      m('Retracția bărbiei', 'Chin tucks', 'chin_tuck', '10 × 5 s', '10 × 5 s', 'Mișcare mică, fără să apleci capul.', 'Small movement, don’t tilt the head.'),
      m('Strângerea omoplaților', 'Shoulder blade squeeze', 'row', '12 repetări', '12 reps', 'Umerii departe de urechi.', 'Shoulders away from ears.'),
      m('Brațele sus pe perete', 'Wall slides', 'ohp', '10 repetări', '10 reps', 'Fără durere.', 'Pain-free.'),
      m('Depărtări cu banda', 'Band pull-aparts', 'raise', '12 repetări', '12 reps', 'Bandă ușoară.', 'Light band.'),
    ],
    why: { ro: 'Exercițiile de întărire pentru gât și umeri reduc durerea cronică de gât (Cochrane).', en: 'Strengthening exercises for the neck and shoulders reduce chronic neck pain (Cochrane).' },
    redFlags: {
      ro: ['Durere după un accident sau o cădere', 'Amorțeală, furnicături sau slăbiciune în brațe', 'Durere de cap bruscă, foarte puternică, amețeli sau tulburări de vedere: URGENȚĂ', 'Febră și gât înțepenit'],
      en: ['Pain after an accident or fall', 'Numbness, tingling or weakness in the arms', 'Sudden severe headache, dizziness or vision problems: EMERGENCY', 'Fever and stiff neck'],
    },
    source: 'Gross et al., Cochrane 2015 (exercises for mechanical neck disorders)',
  },
  {
    id: 'pt_knee', kind: 'physio', group: 'knee', icon: '🦵', minutes: 12,
    title: { ro: 'Genunchi (artroză, durere la scări)', en: 'Knee (osteoarthritis, stair pain)' },
    moves: [
      m('Extensii de genunchi pe scaun', 'Seated knee extensions', 'legext', '3 × 10 pe fiecare', '3 × 10 each', 'Ține 3 secunde sus.', 'Hold 3 seconds at the top.'),
      m('Ridicări de pe scaun', 'Sit-to-stand', 'squat', '3 × 8', '3 × 8', 'Scaun mai înalt dacă doare.', 'Use a higher chair if it hurts.'),
      m('Pod pentru fesieri', 'Glute bridge', 'bridge', '3 × 10', '3 × 10', 'Fesierii protejează genunchiul.', 'Glutes protect the knee.'),
      m('Urcări pe treaptă joasă', 'Low step-ups', 'stepup', '2 × 8 pe fiecare', '2 × 8 each', 'Treaptă de 10–15 cm.', '10–15 cm step.'),
      m('Ridicări pe vârfuri', 'Calf raises', 'calf', '2 × 15', '2 × 15', 'Ține-te de un sprijin.', 'Hold on to support.'),
    ],
    why: { ro: 'NICE: exercițiul terapeutic (forță + aerobic) e tratamentul de bază în artroză. O durere ușoară (până la 3–4 din 10) care trece în 24 h e acceptabilă.', en: 'NICE: therapeutic exercise (strength + aerobic) is core treatment for osteoarthritis. Mild pain (up to 3–4/10) that settles within 24 h is acceptable.' },
    redFlags: {
      ro: ['Genunchi fierbinte, roșu și umflat, cu febră', 'Genunchiul se blochează sau cedează', 'Nu poți călca pe picior după o accidentare', 'Durere și umflare a gambei (posibil cheag): URGENȚĂ'],
      en: ['Hot, red, swollen knee with fever', 'The knee locks or gives way', 'Unable to bear weight after an injury', 'Calf pain and swelling (possible clot): EMERGENCY'],
    },
    source: 'NICE NG226 (2022); OARSI guidelines (Bannuru et al., 2019)',
  },
  {
    id: 'pt_shoulder', kind: 'physio', group: 'shoulder', icon: '💪', minutes: 10,
    title: { ro: 'Umăr (manșeta rotatorilor)', en: 'Shoulder (rotator cuff)' },
    moves: [
      m('Pendulul', 'Pendulum', 'hinge', '30 s', '30 s', 'Brațul atârnă relaxat, cercuri mici.', 'Arm hangs loose, small circles.'),
      m('Strângerea omoplaților', 'Shoulder blade squeeze', 'row', '12 repetări', '12 reps', 'Postură înaltă.', 'Tall posture.'),
      m('Rotații externe cu banda', 'Band external rotation', 'raise', '3 × 12', '3 × 12', 'Cotul lipit de corp, cu un prosop sub braț.', 'Elbow at your side, towel under the arm.'),
      m('Brațele sus pe perete', 'Wall slides', 'ohp', '10 repetări', '10 reps', 'Doar în zona fără durere.', 'Only in the pain-free range.'),
    ],
    why: { ro: 'Pentru durerea de umăr legată de manșeta rotatorilor, exercițiul progresiv e tratamentul de primă linie.', en: 'For rotator-cuff related shoulder pain, progressive exercise is first-line treatment.' },
    redFlags: {
      ro: ['Durere în umărul stâng cu durere în piept, lipsă de aer sau transpirații: URGENȚĂ (112)', 'Nu poți ridica brațul deloc după o cădere', 'Deformare vizibilă după traumatism', 'Febră, umăr roșu și fierbinte'],
      en: ['Left shoulder pain with chest pain, breathlessness or sweating: EMERGENCY (112)', 'Unable to lift the arm at all after a fall', 'Visible deformity after trauma', 'Fever, red and hot shoulder'],
    },
    source: 'BESS/BOA patient care pathway for subacromial shoulder pain (2016); Littlewood et al. 2016',
  },
];
