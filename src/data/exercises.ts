// Exercise library. Technique cues follow ACSM / NSCA standard coaching guidance.
export type Slot =
  | 'squat' | 'hinge' | 'lunge' | 'push_h' | 'push_v' | 'pull_h' | 'pull_v'
  | 'core' | 'biceps' | 'triceps' | 'calves' | 'glutes' | 'shoulders' | 'balance' | 'quads' | 'hamstrings' | 'chest_iso';

export type Anim =
  | 'squat' | 'hinge' | 'lunge' | 'pushup' | 'bench' | 'ohp' | 'pulldown' | 'row' | 'bentrow' | 'plank' | 'deadbug'
  | 'bridge' | 'curl' | 'pushdown' | 'raise' | 'calf' | 'legext' | 'legcurl' | 'dip' | 'birddog' | 'march' | 'balance'
  | 'crunch' | 'fly' | 'legpress' | 'stepup' | 'superman' | 'sideplank';

export interface Exercise {
  id: string;
  name: { ro: string; en: string };
  slot: Slot;
  anim: Anim;
  /** every listed item is required; 'none' = bodyweight */
  equip: string[];
  level: 1 | 2 | 3;
  avoid: string[]; // injuries for which this is not suggested
  muscles: { ro: string; en: string };
  cues: { ro: string[]; en: string[] };
  prop?: 'bar' | 'db' | 'kb' | 'band';
}

type C = [string, string, string]; // three cues
const ex = (
  id: string, ro: string, en: string, slot: Slot, anim: Anim, equip: string[], level: 1 | 2 | 3, avoid: string[],
  mRo: string, mEn: string, cRo: C, cEn: C, prop?: Exercise['prop']
): Exercise => ({ id, name: { ro, en }, slot, anim, equip, level, avoid, muscles: { ro: mRo, en: mEn }, cues: { ro: cRo, en: cEn }, prop });

export const EXERCISES: Exercise[] = [
  // ---------- SQUAT / QUADS ----------
  ex('bw_squat', 'Genuflexiuni cu greutatea corpului', 'Bodyweight squat', 'squat', 'squat', ['none'], 1, [], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Picioarele la lățimea umerilor', 'Coboară ca pe un scaun, genunchii în direcția vârfurilor', 'Spatele drept, călcâiele pe sol'],
    ['Feet shoulder-width apart', 'Sit back as onto a chair, knees track over toes', 'Neutral spine, heels down']),
  ex('box_squat', 'Genuflexiuni pe scaun', 'Chair squat', 'squat', 'squat', ['none'], 1, [], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Atinge ușor scaunul, nu te lăsa greu', 'Ridică-te împingând prin călcâie', 'Ideal pentru început și 60+'],
    ['Lightly touch the chair, do not plop down', 'Stand up driving through the heels', 'Great for beginners and 60+']),
  ex('goblet_squat', 'Genuflexiuni goblet cu gantera', 'Goblet squat', 'squat', 'squat', ['dumbbells'], 1, [], 'Cvadricepși, fesieri, core', 'Quads, glutes, core',
    ['Ține gantera la piept, coatele în jos', 'Coboară controlat 2–3 secunde', 'Pieptul sus, spatele neutru'],
    ['Hold the dumbbell at your chest, elbows down', 'Lower under control for 2–3 seconds', 'Chest up, neutral spine'], 'db'),
  ex('kb_goblet', 'Genuflexiuni goblet cu kettlebell', 'Kettlebell goblet squat', 'squat', 'squat', ['kettlebell'], 1, [], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Kettlebell-ul ținut de mânere, la piept', 'Genunchii împing ușor spre exterior', 'Expiră la urcare'],
    ['Hold the kettlebell by the horns at the chest', 'Knees push slightly outwards', 'Exhale on the way up'], 'kb'),
  ex('back_squat', 'Genuflexiuni cu bara', 'Barbell back squat', 'squat', 'squat', ['barbell', 'squat_rack'], 2, ['knee', 'lower_back'], 'Cvadricepși, fesieri, spate', 'Quads, glutes, back',
    ['Bara pe trapezi, mâinile strâng bara', 'Inspiră și blochează abdomenul înainte de coborâre', 'Coboară cât îți permite mobilitatea, fără să rotunjești spatele'],
    ['Bar on the upper traps, grip tight', 'Breathe in and brace before descending', 'Go as deep as mobility allows without rounding']),
  ex('smith_squat', 'Genuflexiuni la aparatul Smith', 'Smith machine squat', 'squat', 'squat', ['smith_machine'], 1, ['knee'], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Picioarele puțin în fața barei', 'Deblochează bara rotind încheieturile', 'Coboară controlat, urcă exploziv'],
    ['Feet slightly in front of the bar', 'Unrack by rotating the wrists', 'Lower under control, drive up']),
  ex('leg_press', 'Presă pentru picioare', 'Leg press', 'squat', 'legpress', ['leg_press'], 1, [], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Spatele și bazinul lipite de spătar', 'Nu bloca genunchii la capăt', 'Coboară până la ~90° la genunchi'],
    ['Back and hips pressed into the pad', 'Do not lock your knees at the top', 'Lower to about 90° at the knee']),
  ex('hack_squat', 'Hack squat', 'Hack squat', 'squat', 'squat', ['hack_squat'], 2, ['knee'], 'Cvadricepși', 'Quads',
    ['Umerii sub perne, spatele pe spătar', 'Coboară controlat', 'Împinge prin tot talpa'],
    ['Shoulders under the pads, back on the pad', 'Lower under control', 'Push through the whole foot']),
  ex('leg_extension', 'Extensii pentru cvadriceps', 'Leg extension', 'quads', 'legext', ['leg_extension'], 1, ['knee'], 'Cvadricepși', 'Quads',
    ['Genunchiul aliniat cu axul aparatului', 'Ridică până aproape de extensie completă', 'Coboară în 2–3 secunde'],
    ['Knee lined up with the machine axis', 'Lift to near full extension', 'Lower over 2–3 seconds']),
  ex('wall_sit', 'Scaunul la perete', 'Wall sit', 'quads', 'squat', ['none'], 1, ['knee'], 'Cvadricepși', 'Quads',
    ['Spatele lipit de perete', 'Genunchii la cel mult 90°', 'Respiră normal, nu ține aerul'],
    ['Back flat against the wall', 'Knees at most 90°', 'Breathe normally, do not hold your breath']),

  // ---------- HINGE / HAMSTRINGS / GLUTES ----------
  ex('glute_bridge', 'Pod pentru fesieri', 'Glute bridge', 'glutes', 'bridge', ['none'], 1, [], 'Fesieri, femurali', 'Glutes, hamstrings',
    ['Tălpile pe sol, aproape de bazin', 'Ridică bazinul strângând fesierii', 'Nu arcui excesiv spatele'],
    ['Feet flat, close to your hips', 'Lift your hips by squeezing the glutes', 'Do not over-arch your lower back']),
  ex('hip_thrust', 'Hip thrust cu spatele pe bancă', 'Bench hip thrust', 'glutes', 'bridge', ['flat_bench', 'barbell'], 2, [], 'Fesieri', 'Glutes',
    ['Omoplații pe marginea băncii', 'Bara pe bazin, cu un prosop/protecție', 'Bărbia în piept la vârf'],
    ['Shoulder blades on the bench edge', 'Bar over the hips with padding', 'Chin tucked at the top'], 'bar'),
  ex('glute_machine', 'Aparat pentru fesieri', 'Glute machine', 'glutes', 'bridge', ['glute_machine'], 1, [], 'Fesieri', 'Glutes',
    ['Ajustează scaunul la înălțimea bazinului', 'Împinge prin călcâi', 'Pauză 1 secundă la vârf'],
    ['Set the seat to hip height', 'Drive through the heel', 'Pause 1 second at the top']),
  ex('db_rdl', 'Îndreptări românești cu gantere', 'Dumbbell Romanian deadlift', 'hinge', 'hinge', ['dumbbells'], 1, ['lower_back'], 'Femurali, fesieri, spate', 'Hamstrings, glutes, back',
    ['Împinge șoldurile înapoi, genunchii ușor îndoiți', 'Ganterele aproape de picioare', 'Spatele drept tot timpul'],
    ['Push the hips back, knees soft', 'Keep the dumbbells close to the legs', 'Flat back throughout'], 'db'),
  ex('bb_rdl', 'Îndreptări românești cu bara', 'Barbell Romanian deadlift', 'hinge', 'hinge', ['barbell'], 2, ['lower_back'], 'Femurali, fesieri', 'Hamstrings, glutes',
    ['Bara alunecă pe coapse', 'Coboară până simți întinderea femuralilor', 'Revino strângând fesierii'],
    ['Bar slides along the thighs', 'Lower until you feel the hamstrings stretch', 'Return by squeezing the glutes'], 'bar'),
  ex('kb_swing', 'Kettlebell swing', 'Kettlebell swing', 'hinge', 'hinge', ['kettlebell'], 2, ['lower_back'], 'Fesieri, femurali, cardio', 'Glutes, hamstrings, conditioning',
    ['Mișcarea vine din șolduri, nu din brațe', 'Kettlebell-ul urcă până la piept', 'Abdomenul strâns la vârf'],
    ['Power comes from the hips, not the arms', 'Bell floats to chest height', 'Brace your abs at the top'], 'kb'),
  ex('good_morning_bw', 'Aplecări din șold (fără greutate)', 'Bodyweight hip hinge', 'hinge', 'hinge', ['none'], 1, [], 'Femurali, fesieri', 'Hamstrings, glutes',
    ['Mâinile pe șolduri sau la ceafă', 'Împinge bazinul înapoi cu spatele drept', 'Revino împingând bazinul înainte'],
    ['Hands on hips or behind the head', 'Push your hips back with a flat back', 'Return by pushing the hips forward']),
  ex('back_extension', 'Hiperextensii', 'Back extension', 'hinge', 'superman', ['back_extension'], 1, ['lower_back'], 'Lombari, fesieri', 'Lower back, glutes',
    ['Perna sub oasele bazinului', 'Coboară controlat', 'Urcă doar până la linie dreaptă'],
    ['Pad just below the hip bones', 'Lower under control', 'Rise only to a straight line']),
  ex('leg_curl', 'Flexii pentru femurali la aparat', 'Machine leg curl', 'hamstrings', 'legcurl', ['leg_curl'], 1, [], 'Femurali', 'Hamstrings',
    ['Genunchiul aliniat cu axul aparatului', 'Trage controlat', 'Revino lent'],
    ['Knee lined up with the machine axis', 'Curl under control', 'Return slowly']),
  ex('band_leg_curl', 'Flexii femurali cu banda, pe burtă', 'Band lying leg curl', 'hamstrings', 'legcurl', ['band'], 1, [], 'Femurali', 'Hamstrings',
    ['Banda prinsă de un obiect stabil', 'Bazinul lipit de sol', 'Flexează și revino lent'],
    ['Anchor the band to something stable', 'Hips stay on the floor', 'Curl and return slowly'], 'band'),
  ex('superman', 'Superman', 'Superman', 'hinge', 'superman', ['none'], 1, [], 'Lombari, fesieri', 'Lower back, glutes',
    ['Pe burtă, brațele înainte', 'Ridică ușor brațele și picioarele', 'Privirea în jos, gâtul neutru'],
    ['Face down, arms forward', 'Gently lift arms and legs', 'Look down, neutral neck']),

  // ---------- LUNGE ----------
  ex('reverse_lunge', 'Fandări înapoi', 'Reverse lunge', 'lunge', 'lunge', ['none'], 1, ['knee'], 'Cvadricepși, fesieri, echilibru', 'Quads, glutes, balance',
    ['Pas înapoi, genunchiul din spate spre sol', 'Trunchiul drept', 'Împinge prin călcâiul din față'],
    ['Step back, rear knee toward the floor', 'Torso upright', 'Drive through the front heel']),
  ex('db_lunge', 'Fandări cu gantere', 'Dumbbell lunge', 'lunge', 'lunge', ['dumbbells'], 2, ['knee'], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Ganterele pe lângă corp', 'Pași controlați', 'Genunchiul din față stabil, nu cade spre interior'],
    ['Dumbbells by your sides', 'Controlled steps', 'Front knee stable, not caving in'], 'db'),
  ex('split_squat', 'Genuflexiuni bulgărești', 'Bulgarian split squat', 'lunge', 'lunge', ['flat_bench'], 2, ['knee'], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Piciorul din spate pe bancă', 'Coboară vertical', 'Începe fără greutăți'],
    ['Rear foot on a bench', 'Lower straight down', 'Start without weights']),
  ex('step_up', 'Urcări pe treaptă', 'Step-up', 'lunge', 'stepup', ['none'], 1, [], 'Cvadricepși, fesieri', 'Quads, glutes',
    ['Folosește o treaptă stabilă', 'Urcă împingând prin piciorul de sus', 'Coboară controlat'],
    ['Use a stable step', 'Step up driving through the top leg', 'Step down under control']),

  // ---------- PUSH HORIZONTAL ----------
  ex('incline_pushup', 'Flotări cu mâinile sus (pe masă/perete)', 'Incline push-up', 'push_h', 'pushup', ['none'], 1, ['wrist'], 'Piept, triceps, umeri', 'Chest, triceps, shoulders',
    ['Mâinile pe o suprafață stabilă', 'Corpul în linie dreaptă', 'Coatele la ~45° de corp'],
    ['Hands on a stable surface', 'Body in a straight line', 'Elbows about 45° from the body']),
  ex('knee_pushup', 'Flotări pe genunchi', 'Knee push-up', 'push_h', 'pushup', ['none'], 1, ['wrist'], 'Piept, triceps', 'Chest, triceps',
    ['Linie dreaptă de la genunchi la cap', 'Pieptul coboară între mâini', 'Expiră la împingere'],
    ['Straight line from knees to head', 'Chest lowers between the hands', 'Exhale as you push']),
  ex('pushup', 'Flotări', 'Push-up', 'push_h', 'pushup', ['none'], 2, ['wrist', 'shoulder'], 'Piept, triceps, umeri, core', 'Chest, triceps, shoulders, core',
    ['Abdomenul și fesierii strânși', 'Coboară până aproape de sol', 'Nu lăsa bazinul să cadă'],
    ['Brace abs and glutes', 'Lower close to the floor', 'Do not let the hips sag']),
  ex('db_bench', 'Împins cu gantere pe bancă', 'Dumbbell bench press', 'push_h', 'bench', ['dumbbells', 'flat_bench'], 1, [], 'Piept, triceps', 'Chest, triceps',
    ['Omoplații strânși și coborâți', 'Ganterele coboară lângă piept', 'Împinge pe o traiectorie ușor arcuită'],
    ['Shoulder blades pinched and down', 'Lower dumbbells beside the chest', 'Press up in a slight arc'], 'db'),
  ex('bb_bench', 'Împins cu bara pe bancă', 'Barbell bench press', 'push_h', 'bench', ['barbell', 'flat_bench'], 2, ['shoulder'], 'Piept, triceps, umeri', 'Chest, triceps, shoulders',
    ['Folosește un partener sau opritoare', 'Bara atinge partea de jos a pieptului', 'Tălpile ferm pe sol'],
    ['Use a spotter or safety pins', 'Bar touches the lower chest', 'Feet planted firmly'], 'bar'),
  ex('chest_press', 'Presă pentru piept la aparat', 'Machine chest press', 'push_h', 'bench', ['chest_press'], 1, [], 'Piept, triceps', 'Chest, triceps',
    ['Mânerele la nivelul pieptului', 'Împinge fără să blochezi coatele', 'Revino lent'],
    ['Handles at chest level', 'Press without locking the elbows', 'Return slowly']),
  ex('pec_deck', 'Fluturări la aparat (pec deck)', 'Pec deck fly', 'chest_iso', 'fly', ['pec_deck'], 1, ['shoulder'], 'Piept', 'Chest',
    ['Coatele ușor îndoite', 'Strânge pieptul în față', 'Nu deschide prea mult în spate'],
    ['Elbows slightly bent', 'Squeeze the chest in front', 'Do not open too far back']),
  ex('cable_fly', 'Fluturări la scripete', 'Cable fly', 'chest_iso', 'fly', ['cable_station'], 2, ['shoulder'], 'Piept', 'Chest',
    ['Un pas în față, stabil', 'Brațele descriu un arc', 'Control pe revenire'],
    ['Step forward, stable stance', 'Arms move in an arc', 'Control the return']),

  // ---------- PUSH VERTICAL / SHOULDERS ----------
  ex('db_ohp', 'Presă deasupra capului cu gantere', 'Dumbbell overhead press', 'push_v', 'ohp', ['dumbbells'], 1, ['shoulder'], 'Umeri, triceps', 'Shoulders, triceps',
    ['Abdomenul strâns, nu arcui spatele', 'Împinge până deasupra capului', 'Poți lucra și așezat'],
    ['Brace, do not arch the back', 'Press to overhead', 'Can be done seated'], 'db'),
  ex('machine_ohp', 'Presă pentru umeri la aparat', 'Machine shoulder press', 'push_v', 'ohp', ['shoulder_press_machine'], 1, ['shoulder'], 'Umeri, triceps', 'Shoulders, triceps',
    ['Mânerele la nivelul bărbiei', 'Împinge vertical', 'Spatele lipit de spătar'],
    ['Handles at chin level', 'Press vertically', 'Back against the pad']),
  ex('pike_pushup', 'Flotări pike', 'Pike push-up', 'push_v', 'pushup', ['none'], 2, ['shoulder', 'wrist'], 'Umeri, triceps', 'Shoulders, triceps',
    ['Bazinul sus, corpul în V inversat', 'Capul coboară între mâini', 'Mișcare controlată'],
    ['Hips high, inverted V', 'Head lowers between hands', 'Controlled movement']),
  ex('band_ohp', 'Presă deasupra capului cu banda', 'Band overhead press', 'push_v', 'ohp', ['band'], 1, ['shoulder'], 'Umeri, triceps', 'Shoulders, triceps',
    ['Calcă pe bandă', 'Împinge în sus fără să arcui spatele', 'Revino lent'],
    ['Stand on the band', 'Press up without arching', 'Return slowly'], 'band'),
  ex('lateral_raise', 'Ridicări laterale cu gantere', 'Dumbbell lateral raise', 'shoulders', 'raise', ['dumbbells'], 1, ['shoulder'], 'Deltoid lateral', 'Side delts',
    ['Greutăți mici', 'Ridică până la nivelul umerilor', 'Coatele ușor îndoite'],
    ['Light weights', 'Raise to shoulder height', 'Elbows slightly bent'], 'db'),
  ex('band_pull_apart', 'Depărtări cu banda', 'Band pull-apart', 'shoulders', 'raise', ['band'], 1, [], 'Deltoid posterior, spate sus', 'Rear delts, upper back',
    ['Brațele întinse în față', 'Depărtează banda până la piept', 'Strânge omoplații'],
    ['Arms straight in front', 'Pull the band to your chest', 'Squeeze the shoulder blades'], 'band'),

  // ---------- PULL HORIZONTAL ----------
  ex('db_row', 'Ramat cu gantera, sprijinit', 'One-arm dumbbell row', 'pull_h', 'bentrow', ['dumbbells'], 1, [], 'Spate, biceps', 'Back, biceps',
    ['Sprijin cu mâna pe bancă/scaun', 'Trage cotul spre șold', 'Spatele drept'],
    ['Support one hand on a bench/chair', 'Pull the elbow toward the hip', 'Flat back'], 'db'),
  ex('band_row', 'Ramat cu banda', 'Band row', 'pull_h', 'row', ['band'], 1, [], 'Spate, biceps', 'Back, biceps',
    ['Banda în jurul tălpilor sau prinsă de ușă', 'Trage spre abdomen', 'Strânge omoplații'],
    ['Band around the feet or anchored on a door', 'Pull to the stomach', 'Squeeze the shoulder blades'], 'band'),
  ex('seated_row', 'Ramat la aparat / scripete jos', 'Seated cable row', 'pull_h', 'row', ['seated_row'], 1, [], 'Spate, biceps', 'Back, biceps',
    ['Pieptul sus, spatele drept', 'Trage mânerul spre abdomen', 'Nu te balansa'],
    ['Chest up, back straight', 'Pull the handle to the stomach', 'Do not swing']),
  ex('bb_row', 'Ramat cu bara din aplecat', 'Barbell bent-over row', 'pull_h', 'bentrow', ['barbell'], 2, ['lower_back'], 'Spate, biceps', 'Back, biceps',
    ['Trunchiul aplecat ~45°', 'Bara trasă spre ombilic', 'Spatele neutru'],
    ['Torso about 45°', 'Pull the bar to the navel', 'Neutral back'], 'bar'),
  ex('table_row', 'Ramat inversat sub masă', 'Inverted row under a table', 'pull_h', 'row', ['none'], 2, [], 'Spate, biceps', 'Back, biceps',
    ['Doar sub o masă foarte stabilă', 'Corpul drept, tragi pieptul spre margine', 'Alternativ: prosop prins în ușă'],
    ['Only under a very sturdy table', 'Body straight, pull chest to the edge', 'Alternative: towel in a door']),

  // ---------- PULL VERTICAL ----------
  ex('lat_pulldown', 'Tracțiuni la helcometru', 'Lat pulldown', 'pull_v', 'pulldown', ['lat_pulldown'], 1, [], 'Dorsali, biceps', 'Lats, biceps',
    ['Prindere puțin mai lată decât umerii', 'Trage bara spre partea de sus a pieptului', 'Nu trage după ceafă'],
    ['Grip slightly wider than shoulders', 'Pull to the upper chest', 'Never behind the neck']),
  ex('assisted_pullup', 'Tracțiuni asistate la aparat', 'Assisted pull-up', 'pull_v', 'pulldown', ['assisted_pullup'], 1, [], 'Dorsali, biceps', 'Lats, biceps',
    ['Mai multă contragreutate = mai ușor', 'Bărbia peste bară', 'Coboară complet controlat'],
    ['More counterweight = easier', 'Chin over the bar', 'Lower fully under control']),
  ex('pullup', 'Tracțiuni la bară', 'Pull-up', 'pull_v', 'pulldown', ['pullup_bar'], 3, ['shoulder'], 'Dorsali, biceps, core', 'Lats, biceps, core',
    ['Pornește din atârnare activă', 'Trage coatele spre coaste', 'Fără balans'],
    ['Start from an active hang', 'Drive elbows to the ribs', 'No kipping']),
  ex('band_pulldown', 'Tracțiuni cu banda', 'Band pulldown', 'pull_v', 'pulldown', ['band'], 1, [], 'Dorsali', 'Lats',
    ['Banda prinsă sus (ușă)', 'Trage coatele în jos spre coaste', 'Revino lent'],
    ['Anchor the band high (door)', 'Pull elbows down to the ribs', 'Return slowly'], 'band'),

  // ---------- ARMS ----------
  ex('db_curl', 'Flexii biceps cu gantere', 'Dumbbell curl', 'biceps', 'curl', ['dumbbells'], 1, [], 'Biceps', 'Biceps',
    ['Coatele lipite de corp', 'Fără balans', 'Coboară în 2–3 secunde'],
    ['Elbows pinned to your sides', 'No swinging', 'Lower over 2–3 seconds'], 'db'),
  ex('band_curl', 'Flexii biceps cu banda', 'Band curl', 'biceps', 'curl', ['band'], 1, [], 'Biceps', 'Biceps',
    ['Calcă pe bandă', 'Coatele fixe', 'Control pe revenire'],
    ['Stand on the band', 'Elbows fixed', 'Control the return'], 'band'),
  ex('preacher_curl', 'Flexii biceps la pupitru', 'Preacher curl', 'biceps', 'curl', ['preacher_curl'], 1, [], 'Biceps', 'Biceps',
    ['Axila pe marginea pupitrului', 'Nu extinde brusc la capăt', 'Greutate moderată'],
    ['Armpit on the pad edge', 'Do not snap to full extension', 'Moderate weight']),
  ex('cable_pushdown', 'Extensii triceps la scripete', 'Cable triceps pushdown', 'triceps', 'pushdown', ['cable_station'], 1, [], 'Triceps', 'Triceps',
    ['Coatele lipite de corp', 'Extinde complet', 'Revino până la 90°'],
    ['Elbows tucked', 'Extend fully', 'Return to 90°']),
  ex('bench_dip', 'Flotări pe scaun pentru triceps', 'Chair dip', 'triceps', 'dip', ['none'], 1, ['shoulder', 'wrist'], 'Triceps', 'Triceps',
    ['Scaun stabil, lipit de perete', 'Coboară doar până la 90° la cot', 'Umerii departe de urechi'],
    ['Stable chair against a wall', 'Lower only to 90° at the elbow', 'Shoulders away from ears']),
  ex('db_overhead_ext', 'Extensii triceps deasupra capului', 'Overhead triceps extension', 'triceps', 'pushdown', ['dumbbells'], 1, ['shoulder'], 'Triceps', 'Triceps',
    ['Gantera ținută cu ambele mâini', 'Coatele orientate în față', 'Mișcare doar din cot'],
    ['Hold one dumbbell with both hands', 'Elbows point forward', 'Move only at the elbow'], 'db'),
  ex('dips', 'Flotări la paralele', 'Parallel bar dip', 'triceps', 'dip', ['dip_station'], 3, ['shoulder'], 'Triceps, piept', 'Triceps, chest',
    ['Coboară până la ~90° la cot', 'Trunchiul ușor aplecat', 'Fără balans'],
    ['Lower to about 90° at the elbow', 'Torso slightly forward', 'No swinging']),

  // ---------- CALVES ----------
  ex('calf_raise', 'Ridicări pe vârfuri', 'Standing calf raise', 'calves', 'calf', ['none'], 1, [], 'Gambe', 'Calves',
    ['Sprijin ușor de perete', 'Urcă sus pe vârfuri', 'Coboară lent'],
    ['Lightly hold a wall', 'Rise high onto the toes', 'Lower slowly']),
  ex('calf_machine', 'Gambe la aparat', 'Calf raise machine', 'calves', 'calf', ['calf_raise_machine'], 1, [], 'Gambe', 'Calves',
    ['Amplitudine completă', 'Pauză jos 1 secundă', 'Fără să sari'],
    ['Full range of motion', 'Pause 1 second at the bottom', 'No bouncing']),

  // ---------- CORE ----------
  ex('plank', 'Planșă pe antebrațe', 'Forearm plank', 'core', 'plank', ['none'], 1, ['lower_back'], 'Abdomen, core', 'Abs, core',
    ['Coatele sub umeri', 'Linie dreaptă cap–călcâie', 'Respiră, nu ține aerul'],
    ['Elbows under shoulders', 'Straight line head to heels', 'Breathe, do not hold your breath']),
  ex('dead_bug', 'Dead bug', 'Dead bug', 'core', 'deadbug', ['none'], 1, [], 'Abdomen profund', 'Deep core',
    ['Spatele lipit de sol', 'Brațul și piciorul opus coboară simultan', 'Mișcare lentă'],
    ['Lower back pressed down', 'Lower opposite arm and leg together', 'Move slowly']),
  ex('bird_dog', 'Bird dog', 'Bird dog', 'core', 'birddog', ['none'], 1, [], 'Core, lombari, echilibru', 'Core, lower back, balance',
    ['În patru labe, spatele neutru', 'Întinde brațul și piciorul opus', 'Bazinul nu se rotește'],
    ['On all fours, neutral back', 'Extend opposite arm and leg', 'Keep hips level']),
  ex('side_plank', 'Planșă laterală', 'Side plank', 'core', 'sideplank', ['none'], 2, ['shoulder'], 'Oblici, core', 'Obliques, core',
    ['Cotul sub umăr', 'Bazinul sus, corpul drept', 'Variantă ușoară: pe genunchi'],
    ['Elbow under shoulder', 'Hips up, body straight', 'Easier: from the knees']),
  ex('crunch_machine', 'Abdomene la aparat', 'Ab crunch machine', 'core', 'crunch', ['ab_crunch_machine'], 1, ['neck'], 'Abdomen', 'Abs',
    ['Mișcarea vine din abdomen', 'Expiră la contracție', 'Greutate moderată'],
    ['Movement comes from the abs', 'Exhale as you crunch', 'Moderate weight']),
  ex('pallof', 'Pallof press', 'Pallof press', 'core', 'ohp', ['cable_station'], 2, [], 'Core anti-rotație', 'Anti-rotation core',
    ['Lateral față de scripete', 'Împinge mânerul în față', 'Nu lăsa corpul să se rotească'],
    ['Stand side-on to the cable', 'Press the handle forward', 'Resist the rotation']),

  // ---------- BALANCE (older adults, WHO) ----------
  ex('single_leg_stand', 'Echilibru pe un picior', 'Single-leg balance', 'balance', 'balance', ['none'], 1, [], 'Echilibru, gleznă', 'Balance, ankle',
    ['Lângă un perete sau scaun pentru siguranță', '20–30 secunde pe fiecare picior', 'Progres: cu ochii închiși'],
    ['Next to a wall or chair for safety', '20–30 seconds per leg', 'Progress: eyes closed']),
  ex('heel_toe_walk', 'Mers călcâi–vârf', 'Heel-to-toe walk', 'balance', 'march', ['none'], 1, [], 'Echilibru', 'Balance',
    ['Călcâiul atinge vârful celuilalt picior', 'Privirea înainte', '10–15 pași, lângă un sprijin'],
    ['Heel touches the other foot’s toes', 'Look ahead', '10–15 steps near support']),
];

export const exById = (id: string) => EXERCISES.find((e) => e.id === id);

// Gym machines/equipment that can be recognised from a photo or ticked manually.
export const MACHINES: { id: string; ro: string; en: string }[] = [
  { id: 'leg_press', ro: 'Presă picioare', en: 'Leg press' },
  { id: 'hack_squat', ro: 'Hack squat', en: 'Hack squat' },
  { id: 'leg_extension', ro: 'Extensii cvadriceps', en: 'Leg extension' },
  { id: 'leg_curl', ro: 'Flexii femurali', en: 'Leg curl' },
  { id: 'hip_abductor', ro: 'Abductori', en: 'Hip abductor' },
  { id: 'hip_adductor', ro: 'Adductori', en: 'Hip adductor' },
  { id: 'calf_raise_machine', ro: 'Aparat gambe', en: 'Calf raise machine' },
  { id: 'glute_machine', ro: 'Aparat fesieri', en: 'Glute machine' },
  { id: 'chest_press', ro: 'Presă piept', en: 'Chest press' },
  { id: 'pec_deck', ro: 'Pec deck / fluturări', en: 'Pec deck' },
  { id: 'shoulder_press_machine', ro: 'Presă umeri', en: 'Shoulder press machine' },
  { id: 'lat_pulldown', ro: 'Helcometru', en: 'Lat pulldown' },
  { id: 'seated_row', ro: 'Ramat la aparat', en: 'Seated row' },
  { id: 'cable_station', ro: 'Scripete / cablu', en: 'Cable station' },
  { id: 'assisted_pullup', ro: 'Tracțiuni asistate', en: 'Assisted pull-up' },
  { id: 'smith_machine', ro: 'Aparat Smith', en: 'Smith machine' },
  { id: 'squat_rack', ro: 'Rack genuflexiuni', en: 'Squat rack' },
  { id: 'flat_bench', ro: 'Bancă', en: 'Bench' },
  { id: 'adjustable_bench', ro: 'Bancă reglabilă', en: 'Adjustable bench' },
  { id: 'dumbbells', ro: 'Gantere', en: 'Dumbbells' },
  { id: 'barbell', ro: 'Bară olimpică', en: 'Barbell' },
  { id: 'kettlebell', ro: 'Kettlebell', en: 'Kettlebell' },
  { id: 'pullup_bar', ro: 'Bară tracțiuni', en: 'Pull-up bar' },
  { id: 'dip_station', ro: 'Paralele', en: 'Dip station' },
  { id: 'back_extension', ro: 'Bancă hiperextensii', en: 'Back extension' },
  { id: 'preacher_curl', ro: 'Pupitru biceps', en: 'Preacher curl' },
  { id: 'ab_crunch_machine', ro: 'Aparat abdomene', en: 'Ab crunch machine' },
  { id: 'treadmill', ro: 'Bandă de alergat', en: 'Treadmill' },
  { id: 'stationary_bike', ro: 'Bicicletă', en: 'Stationary bike' },
  { id: 'elliptical', ro: 'Eliptică', en: 'Elliptical' },
  { id: 'rowing_machine', ro: 'Aparat de vâslit', en: 'Rowing machine' },
  { id: 'stair_climber', ro: 'Stepper / scări', en: 'Stair climber' },
];

export const HOME_EQUIPMENT = [
  { id: 'dumbbells', ro: 'Gantere', en: 'Dumbbells' },
  { id: 'band', ro: 'Benzi elastice', en: 'Resistance bands' },
  { id: 'kettlebell', ro: 'Kettlebell', en: 'Kettlebell' },
  { id: 'pullup_bar', ro: 'Bară de tracțiuni', en: 'Pull-up bar' },
  { id: 'flat_bench', ro: 'Bancă', en: 'Bench' },
];
