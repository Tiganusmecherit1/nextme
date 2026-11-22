// Ingredient values per 100 g (raw/dry unless noted), from USDA FoodData Central (SR Legacy)
// and the Romanian/European composition equivalents. kcal, protein, carbs, fat, fiber.
export type Tag = 'meat' | 'fish' | 'dairy' | 'egg' | 'gluten' | 'nuts';
export interface Ingredient {
  ro: string;
  en: string;
  n: [number, number, number, number, number];
  tags?: Tag[];
}

export const ING: Record<string, Ingredient> = {
  oats: { ro: 'fulgi de ovăz', en: 'rolled oats', n: [389, 16.9, 66.3, 6.9, 10.6], tags: ['gluten'] },
  bread_ww: { ro: 'pâine integrală', en: 'wholemeal bread', n: [247, 13, 41, 3.4, 7], tags: ['gluten'] },
  egg: { ro: 'ouă', en: 'eggs', n: [143, 12.6, 0.7, 9.5, 0], tags: ['egg'] },
  telemea: { ro: 'telemea de vacă', en: 'telemea (white cheese)', n: [264, 14.2, 4.1, 21.3, 0], tags: ['dairy'] },
  cottage: { ro: 'brânză de vaci', en: 'cottage cheese', n: [84, 11, 4.3, 2.3, 0], tags: ['dairy'] },
  yogurt: { ro: 'iaurt 2%', en: 'plain yogurt 2%', n: [63, 5.3, 7, 1.6, 0], tags: ['dairy'] },
  kefir: { ro: 'chefir', en: 'kefir', n: [41, 3.8, 4.5, 1, 0], tags: ['dairy'] },
  milk: { ro: 'lapte 1,5%', en: 'milk 1.5%', n: [46, 3.4, 4.9, 1.5, 0], tags: ['dairy'] },
  sour_cream: { ro: 'smântână 12%', en: 'sour cream 12%', n: [133, 2.7, 3.9, 12, 0], tags: ['dairy'] },
  chicken: { ro: 'piept de pui', en: 'chicken breast', n: [120, 22.5, 0, 2.6, 0], tags: ['meat'] },
  chicken_thigh: { ro: 'pulpă de pui dezosată', en: 'boneless chicken thigh', n: [121, 19.7, 0, 4.1, 0], tags: ['meat'] },
  pork: { ro: 'mușchi de porc', en: 'pork loin', n: [143, 21.2, 0, 5.7, 0], tags: ['meat'] },
  pork_mince: { ro: 'carne tocată de porc slabă', en: 'lean pork mince', n: [190, 19, 0, 12.5, 0], tags: ['meat'] },
  beef_mince: { ro: 'carne tocată de vită 10%', en: 'lean beef mince 10%', n: [176, 20, 0, 10, 0], tags: ['meat'] },
  turkey: { ro: 'piept de curcan', en: 'turkey breast', n: [114, 23.7, 0, 1.5, 0], tags: ['meat'] },
  mackerel: { ro: 'macrou', en: 'mackerel', n: [205, 18.6, 0, 13.9, 0], tags: ['fish'] },
  hake: { ro: 'file de merluciu', en: 'hake fillet', n: [86, 18.3, 0, 1.3, 0], tags: ['fish'] },
  tuna: { ro: 'ton în apă (conservă)', en: 'canned tuna in water', n: [116, 25.5, 0, 0.8, 0], tags: ['fish'] },
  sardines: { ro: 'sardine (conservă, scurse)', en: 'canned sardines, drained', n: [208, 24.6, 0, 11.5, 0], tags: ['fish'] },
  lentils: { ro: 'linte uscată', en: 'dry lentils', n: [352, 24.6, 63.4, 1.1, 10.7] },
  beans: { ro: 'fasole boabe uscată', en: 'dry white beans', n: [333, 23.4, 60.3, 0.9, 15.2] },
  chickpeas: { ro: 'năut uscat', en: 'dry chickpeas', n: [378, 20.5, 63, 6, 12.2] },
  rice: { ro: 'orez', en: 'rice', n: [365, 7.1, 80, 0.7, 1.3] },
  buckwheat: { ro: 'hrișcă', en: 'buckwheat', n: [343, 13.3, 71.5, 3.4, 10] },
  cornmeal: { ro: 'mălai (pentru mămăligă)', en: 'cornmeal (polenta)', n: [362, 8.1, 76.9, 3.6, 7.3] },
  pasta_ww: { ro: 'paste integrale', en: 'wholewheat pasta', n: [348, 14.6, 75, 1.4, 10], tags: ['gluten'] },
  bulgur: { ro: 'bulgur', en: 'bulgur', n: [342, 12.3, 75.9, 1.3, 12.5], tags: ['gluten'] },
  potato: { ro: 'cartofi', en: 'potatoes', n: [77, 2, 17.5, 0.1, 2.2] },
  cabbage: { ro: 'varză albă', en: 'white cabbage', n: [25, 1.3, 5.8, 0.1, 2.5] },
  sauerkraut: { ro: 'varză murată', en: 'sauerkraut', n: [19, 0.9, 4.3, 0.1, 2.9] },
  carrot: { ro: 'morcovi', en: 'carrots', n: [41, 0.9, 9.6, 0.2, 2.8] },
  onion: { ro: 'ceapă', en: 'onion', n: [40, 1.1, 9.3, 0.1, 1.7] },
  tomato: { ro: 'roșii', en: 'tomatoes', n: [18, 0.9, 3.9, 0.2, 1.2] },
  tomato_paste: { ro: 'pastă de roșii', en: 'tomato paste', n: [82, 4.3, 18.9, 0.5, 4.1] },
  cucumber: { ro: 'castraveți', en: 'cucumber', n: [15, 0.7, 3.6, 0.1, 0.5] },
  pepper: { ro: 'ardei gras', en: 'bell pepper', n: [31, 1, 6, 0.3, 2.1] },
  zucchini: { ro: 'dovlecei', en: 'zucchini', n: [17, 1.2, 3.1, 0.3, 1] },
  eggplant: { ro: 'vinete', en: 'eggplant', n: [25, 1, 5.9, 0.2, 3] },
  spinach: { ro: 'spanac', en: 'spinach', n: [23, 2.9, 3.6, 0.4, 2.2] },
  broccoli: { ro: 'broccoli', en: 'broccoli', n: [34, 2.8, 6.6, 0.4, 2.6] },
  cauliflower: { ro: 'conopidă', en: 'cauliflower', n: [25, 1.9, 5, 0.3, 2] },
  green_beans: { ro: 'fasole verde', en: 'green beans', n: [31, 1.8, 7, 0.2, 2.7] },
  peas: { ro: 'mazăre (congelată)', en: 'green peas (frozen)', n: [81, 5.4, 14.5, 0.4, 5.7] },
  beetroot: { ro: 'sfeclă roșie', en: 'beetroot', n: [43, 1.6, 9.6, 0.2, 2.8] },
  celery_root: { ro: 'țelină rădăcină', en: 'celeriac', n: [42, 1.5, 9.2, 0.3, 1.8] },
  mushrooms: { ro: 'ciuperci champignon', en: 'mushrooms', n: [22, 3.1, 3.3, 0.3, 1] },
  apple: { ro: 'măr', en: 'apple', n: [52, 0.3, 13.8, 0.2, 2.4] },
  banana: { ro: 'banană', en: 'banana', n: [89, 1.1, 22.8, 0.3, 2.6] },
  berries: { ro: 'fructe de pădure congelate', en: 'frozen mixed berries', n: [50, 0.7, 12, 0.3, 3.5] },
  plums: { ro: 'prune', en: 'plums', n: [46, 0.7, 11.4, 0.3, 1.4] },
  oil: { ro: 'ulei de floarea-soarelui', en: 'sunflower oil', n: [884, 0, 0, 100, 0] },
  olive_oil: { ro: 'ulei de măsline', en: 'olive oil', n: [884, 0, 0, 100, 0] },
  walnuts: { ro: 'miez de nucă', en: 'walnuts', n: [654, 15.2, 13.7, 65.2, 6.7], tags: ['nuts'] },
  sunflower_seeds: { ro: 'semințe de floarea-soarelui', en: 'sunflower seeds', n: [584, 20.8, 20, 51.5, 8.6] },
  flax: { ro: 'semințe de in măcinate', en: 'ground flaxseed', n: [534, 18.3, 28.9, 42.2, 27.3] },
  peanut_butter: { ro: 'unt de arahide', en: 'peanut butter', n: [588, 25, 20, 50, 6], tags: ['nuts'] },
  honey: { ro: 'miere', en: 'honey', n: [304, 0.3, 82.4, 0, 0.2] },
  // Added for the recipe library (USDA FoodData Central SR Legacy, raw unless noted)
  garlic: { ro: 'usturoi', en: 'garlic', n: [149, 6.4, 33.1, 0.5, 2.1] },
  leek: { ro: 'praz', en: 'leek', n: [61, 1.5, 14.2, 0.3, 1.8] },
  barley: { ro: 'arpacaș', en: 'pearl barley', n: [352, 9.9, 77.7, 1.2, 15.6], tags: ['gluten'] },
  semolina: { ro: 'griș', en: 'semolina', n: [360, 12.7, 72.8, 1.1, 3.9], tags: ['gluten'] },
  flour: { ro: 'făină albă', en: 'white flour', n: [364, 10.3, 76.3, 1, 2.7], tags: ['gluten'] },
  breadcrumbs: { ro: 'pesmet', en: 'breadcrumbs', n: [395, 13.4, 72, 5.3, 4.5], tags: ['gluten'] },
  cocoa: { ro: 'cacao neîndulcită', en: 'unsweetened cocoa', n: [228, 19.6, 57.9, 13.7, 37] },
  butter: { ro: 'unt', en: 'butter', n: [717, 0.9, 0.1, 81.1, 0], tags: ['dairy'] },
  pickles: { ro: 'castraveți murați', en: 'pickled cucumbers', n: [11, 0.3, 2.4, 0.2, 1] },
  cascaval: { ro: 'cașcaval', en: 'cașcaval (yellow cheese)', n: [356, 24.9, 2.2, 27.4, 0], tags: ['dairy'] },
  greek_yogurt: { ro: 'iaurt grecesc 2%', en: 'Greek yogurt 2%', n: [73, 10, 3.9, 1.9, 0], tags: ['dairy'] },
  urda: { ro: 'urdă', en: 'urdă (whey cheese, like ricotta)', n: [138, 11.4, 5.1, 7.9, 0], tags: ['dairy'] },
  chicken_liver: { ro: 'ficat de pui', en: 'chicken liver', n: [119, 16.9, 0.7, 4.8, 0], tags: ['meat'] },
  trout: { ro: 'păstrăv', en: 'trout', n: [141, 19.9, 0, 6.2, 0], tags: ['fish'] },
  carp: { ro: 'crap', en: 'carp', n: [127, 17.8, 0, 5.6, 0], tags: ['fish'] },
  turkey_mince: { ro: 'carne tocată de curcan', en: 'turkey mince', n: [150, 18.7, 0, 8.3, 0], tags: ['meat'] },
  beef: { ro: 'carne de vită slabă (pulpă)', en: 'lean beef (round)', n: [120, 22.9, 0, 3, 0], tags: ['meat'] },
  beans_canned: { ro: 'fasole albă la conservă (scursă)', en: 'canned white beans, drained', n: [114, 7.3, 21.1, 0.3, 4.8] },
};

export interface Recipe {
  id: string;
  slot: 'breakfast' | 'main' | 'snack';
  ro: string;
  en: string;
  items: [string, number][]; // ingredient id, grams for 1 base portion
  stepsRo: string;
  stepsEn: string;
  gutFriendly?: boolean; // fermented or very high fibre
}

export const RECIPES: Recipe[] = [
  // Breakfasts
  { id: 'oats_yogurt', slot: 'breakfast', ro: 'Ovăz cu iaurt, măr și nucă', en: 'Oats with yogurt, apple and walnuts', items: [['oats', 50], ['yogurt', 150], ['apple', 120], ['walnuts', 15]], stepsRo: 'Lasă ovăzul în iaurt peste noapte sau 10 minute. Adaugă mărul ras și nuca.', stepsEn: 'Soak the oats in yogurt overnight or 10 minutes. Add grated apple and walnuts.', gutFriendly: true },
  { id: 'omelette_veg', slot: 'breakfast', ro: 'Omletă cu ardei și roșii, pâine integrală', en: 'Pepper and tomato omelette with wholemeal bread', items: [['egg', 120], ['pepper', 70], ['tomato', 100], ['onion', 20], ['bread_ww', 60], ['oil', 5]], stepsRo: 'Călește ușor legumele, adaugă ouăle bătute și gătește la foc mic.', stepsEn: 'Soften the vegetables, add beaten eggs, cook on low heat.' },
  { id: 'cottage_plate', slot: 'breakfast', ro: 'Brânză de vaci cu roșii, castraveți și pâine integrală', en: 'Cottage cheese with tomatoes, cucumber and wholemeal bread', items: [['cottage', 180], ['tomato', 120], ['cucumber', 120], ['bread_ww', 60]], stepsRo: 'Asezonează brânza cu sare puțină, piper și mărar.', stepsEn: 'Season the cheese with a little salt, pepper and dill.' },
  { id: 'eggs_telemea', slot: 'breakfast', ro: 'Ouă fierte, telemea și legume', en: 'Boiled eggs, telemea and vegetables', items: [['egg', 120], ['telemea', 35], ['tomato', 120], ['cucumber', 120], ['bread_ww', 50]], stepsRo: 'Fierbe ouăle 9 minute. Servește cu legume crude.', stepsEn: 'Boil the eggs 9 minutes. Serve with raw vegetables.' },
  { id: 'oats_pb', slot: 'breakfast', ro: 'Terci de ovăz cu banană, unt de arahide și in (de post)', en: 'Porridge with banana, peanut butter and flax (vegan)', items: [['oats', 60], ['banana', 100], ['peanut_butter', 15], ['flax', 10]], stepsRo: 'Fierbe ovăzul în 250 ml apă 3–5 minute. Adaugă banana, untul de arahide și inul.', stepsEn: 'Cook the oats in 250 ml water 3–5 minutes. Top with banana, peanut butter and flax.', gutFriendly: true },
  { id: 'hummus_toast', slot: 'breakfast', ro: 'Pâine integrală cu humus de casă și legume (de post)', en: 'Wholemeal toast with homemade hummus and vegetables (vegan)', items: [['chickpeas', 40], ['olive_oil', 7], ['bread_ww', 70], ['pepper', 100], ['cucumber', 100]], stepsRo: 'Năutul fiert se pasează cu ulei, lămâie, usturoi. Ține 3–4 zile la frigider.', stepsEn: 'Blend cooked chickpeas with oil, lemon and garlic. Keeps 3–4 days chilled.' },
  { id: 'kefir_oats_berries', slot: 'breakfast', ro: 'Chefir cu ovăz și fructe de pădure', en: 'Kefir with oats and berries', items: [['kefir', 250], ['oats', 45], ['berries', 100], ['sunflower_seeds', 10]], stepsRo: 'Amestecă și lasă 10 minute să se înmoaie ovăzul.', stepsEn: 'Mix and leave 10 minutes for the oats to soften.', gutFriendly: true },
  { id: 'buckwheat_milk', slot: 'breakfast', ro: 'Hrișcă cu lapte și prune', en: 'Buckwheat with milk and plums', items: [['buckwheat', 50], ['milk', 200], ['plums', 120], ['walnuts', 10]], stepsRo: 'Fierbe hrișca 12 minute, apoi adaugă laptele cald și fructele.', stepsEn: 'Simmer buckwheat 12 minutes, add warm milk and fruit.', gutFriendly: true },

  // Mains (lunch / dinner)
  { id: 'ciorba_pui', slot: 'main', ro: 'Ciorbă de legume cu piept de pui', en: 'Romanian vegetable sour soup with chicken', items: [['chicken', 130], ['carrot', 80], ['onion', 50], ['celery_root', 40], ['potato', 100], ['green_beans', 60], ['tomato_paste', 15], ['oil', 5], ['bread_ww', 40]], stepsRo: 'Fierbe puiul cu legumele, acrește cu borș sau zeamă de lămâie. Leuștean la final.', stepsEn: 'Simmer chicken with vegetables, sour with borș or lemon juice. Add lovage at the end.' },
  { id: 'ciorba_perisoare', slot: 'main', ro: 'Ciorbă de perișoare', en: 'Meatball sour soup (perișoare)', items: [['beef_mince', 110], ['rice', 15], ['carrot', 60], ['onion', 50], ['celery_root', 40], ['potato', 80], ['tomato_paste', 15], ['bread_ww', 40]], stepsRo: 'Formează perișoare din carne, orez și ceapă; fierbe-le în supa de legume. Acrește cu borș.', stepsEn: 'Shape meatballs with rice and onion; simmer in vegetable broth. Sour with borș.' },
  { id: 'iahnie', slot: 'main', ro: 'Iahnie de fasole cu salată de varză murată (de post)', en: 'White bean stew with sauerkraut salad (vegan)', items: [['beans', 80], ['onion', 80], ['carrot', 50], ['tomato_paste', 20], ['oil', 10], ['sauerkraut', 150]], stepsRo: 'Fasolea înmuiată peste noapte se fierbe, apoi se adaugă ceapa călită și pasta de roșii.', stepsEn: 'Soak beans overnight, cook, then add sautéed onion and tomato paste.', gutFriendly: true },
  { id: 'linte', slot: 'main', ro: 'Mâncare de linte cu legume (de post)', en: 'Lentil and vegetable stew (vegan)', items: [['lentils', 80], ['onion', 60], ['carrot', 60], ['tomato', 150], ['oil', 10], ['bread_ww', 40]], stepsRo: 'Linte fiartă 20–25 minute cu legumele, cimbru și foi de dafin.', stepsEn: 'Simmer lentils 20–25 minutes with vegetables, thyme and bay leaf.', gutFriendly: true },
  { id: 'tocanita_pui', slot: 'main', ro: 'Tocăniță de pui cu mămăligă și castraveți murați', en: 'Chicken stew with polenta', items: [['chicken_thigh', 150], ['pepper', 100], ['onion', 60], ['tomato', 150], ['oil', 8], ['cornmeal', 60]], stepsRo: 'Călește ceapa și ardeiul, adaugă puiul și roșiile, înăbușă 30 minute. Mămăliga: 60 g mălai la 250 ml apă.', stepsEn: 'Soften onion and pepper, add chicken and tomatoes, braise 30 minutes. Polenta: 60 g cornmeal to 250 ml water.' },
  { id: 'varza_porc', slot: 'main', ro: 'Varză călită cu mușchi de porc', en: 'Braised cabbage with pork', items: [['cabbage', 300], ['pork', 130], ['onion', 50], ['tomato_paste', 15], ['oil', 8], ['bread_ww', 40]], stepsRo: 'Călește varza tocată cu ceapa, adaugă carnea rumenită și pasta de roșii, cimbru, piper.', stepsEn: 'Braise shredded cabbage with onion, add browned pork, tomato paste, thyme and pepper.' },
  { id: 'sarmale', slot: 'main', ro: 'Sarmale în foi de varză murată (porție mică) cu smântână', en: 'Stuffed sauerkraut rolls with sour cream', items: [['pork_mince', 100], ['rice', 25], ['sauerkraut', 150], ['onion', 40], ['tomato_paste', 15], ['sour_cream', 30], ['cornmeal', 30]], stepsRo: 'Umple foile cu carne, orez și ceapă, fierbe încet 2–3 ore cu varză tocată și pastă de roșii.', stepsEn: 'Fill leaves with meat, rice and onion; simmer 2–3 hours with chopped cabbage and tomato paste.', gutFriendly: true },
  { id: 'pui_cartofi', slot: 'main', ro: 'Pulpe de pui la cuptor cu cartofi și salată de varză', en: 'Baked chicken thighs with potatoes and coleslaw', items: [['chicken_thigh', 150], ['potato', 220], ['oil', 10], ['cabbage', 150], ['carrot', 40]], stepsRo: 'Cuptor 200°C, 40 minute, cu usturoi și boia. Salata: varză și morcov ras cu oțet și ulei.', stepsEn: 'Oven 200°C for 40 minutes with garlic and paprika. Slaw: cabbage and carrot with vinegar and oil.' },
  { id: 'macrou', slot: 'main', ro: 'Macrou la cuptor cu cartofi și dovlecei', en: 'Baked mackerel with potatoes and zucchini', items: [['mackerel', 150], ['potato', 200], ['zucchini', 150], ['oil', 5]], stepsRo: 'Cuptor 200°C, 25 minute, cu lămâie și mărar. Bogat în omega-3.', stepsEn: 'Oven 200°C, 25 minutes, with lemon and dill. Rich in omega-3.' },
  { id: 'merluciu', slot: 'main', ro: 'Merluciu cu orez și broccoli', en: 'Hake with rice and broccoli', items: [['hake', 180], ['rice', 60], ['broccoli', 200], ['oil', 8]], stepsRo: 'Peștele la tigaie 3–4 minute pe parte. Broccoli la abur 5 minute.', stepsEn: 'Pan-fry fish 3–4 minutes per side. Steam broccoli 5 minutes.' },
  { id: 'paste_ton', slot: 'main', ro: 'Paste integrale cu ton și sos de roșii', en: 'Wholewheat pasta with tuna and tomato sauce', items: [['pasta_ww', 80], ['tuna', 110], ['tomato', 200], ['onion', 40], ['olive_oil', 8]], stepsRo: 'Sos rapid din roșii și ceapă, adaugă tonul la final. Paste al dente.', stepsEn: 'Quick tomato and onion sauce, add tuna at the end. Pasta al dente.' },
  { id: 'bolognese', slot: 'main', ro: 'Paste bolognese cu vită și legume', en: 'Beef bolognese with vegetables', items: [['pasta_ww', 80], ['beef_mince', 110], ['tomato', 150], ['tomato_paste', 20], ['onion', 50], ['carrot', 40], ['oil', 5]], stepsRo: 'Carnea rumenită cu ceapă și morcov, apoi roșii, 25 minute la foc mic.', stepsEn: 'Brown the meat with onion and carrot, add tomatoes, simmer 25 minutes.' },
  { id: 'ghiveci_ou', slot: 'main', ro: 'Ghiveci de legume cu ochiuri', en: 'Vegetable ghiveci with fried eggs', items: [['eggplant', 150], ['zucchini', 150], ['pepper', 100], ['onion', 60], ['tomato', 150], ['oil', 10], ['egg', 110], ['bread_ww', 40]], stepsRo: 'Legumele înăbușite 30 minute. Ochiurile la final, direct în tigaie.', stepsEn: 'Braise vegetables 30 minutes. Crack the eggs on top at the end.' },
  { id: 'salata_ton', slot: 'main', ro: 'Salată cu ton, năut și legume', en: 'Tuna, chickpea and vegetable salad', items: [['tuna', 110], ['chickpeas', 40], ['cucumber', 150], ['tomato', 150], ['onion', 30], ['olive_oil', 10]], stepsRo: 'Năut fiert (sau din conservă, clătit), legume tăiate, ulei, lămâie.', stepsEn: 'Cooked or canned (rinsed) chickpeas, chopped vegetables, oil and lemon.', gutFriendly: true },
  { id: 'mazare_pui', slot: 'main', ro: 'Mâncare de mazăre cu pui', en: 'Pea stew with chicken', items: [['peas', 200], ['chicken', 130], ['onion', 60], ['tomato_paste', 20], ['oil', 8], ['bread_ww', 30]], stepsRo: 'Mazărea cu ceapă și pui, 20 minute. Mărar la final.', stepsEn: 'Peas with onion and chicken, 20 minutes. Dill at the end.', gutFriendly: true },
  { id: 'pilaf_hrisca', slot: 'main', ro: 'Pilaf de hrișcă cu ciuperci (de post)', en: 'Buckwheat pilaf with mushrooms (vegan)', items: [['buckwheat', 70], ['mushrooms', 200], ['onion', 60], ['carrot', 50], ['oil', 10], ['sunflower_seeds', 10]], stepsRo: 'Călește ciupercile și ceapa, adaugă hrișca și apă dublă, 15 minute.', stepsEn: 'Sauté mushrooms and onion, add buckwheat and twice the water, 15 minutes.', gutFriendly: true },
  { id: 'bulgur_naut', slot: 'main', ro: 'Bulgur cu năut și legume la tigaie (de post)', en: 'Bulgur with chickpeas and vegetables (vegan)', items: [['bulgur', 70], ['chickpeas', 45], ['pepper', 100], ['zucchini', 120], ['olive_oil', 10]], stepsRo: 'Bulgurul se hidratează 15 minute în apă fiartă. Legumele la tigaie, apoi amestecă.', stepsEn: 'Soak bulgur 15 minutes in boiled water. Stir-fry vegetables and combine.', gutFriendly: true },
  { id: 'ciorba_fasole', slot: 'main', ro: 'Ciorbă de fasole (de post)', en: 'Bean sour soup (vegan)', items: [['beans', 60], ['carrot', 60], ['onion', 60], ['celery_root', 40], ['pepper', 50], ['tomato_paste', 15], ['oil', 7], ['bread_ww', 40]], stepsRo: 'Fasolea înmuiată se fierbe cu legumele, se acrește cu borș. Tarhon și leuștean.', stepsEn: 'Cook soaked beans with vegetables, sour with borș. Tarragon and lovage.', gutFriendly: true },
  { id: 'omleta_spanac', slot: 'main', ro: 'Omletă cu spanac și telemea', en: 'Spinach and telemea omelette', items: [['egg', 165], ['spinach', 150], ['telemea', 30], ['bread_ww', 50], ['oil', 5]], stepsRo: 'Spanacul călit 2 minute, apoi ouăle și telemeaua mărunțită.', stepsEn: 'Wilt spinach 2 minutes, add eggs and crumbled telemea.' },
  { id: 'curcan_legume', slot: 'main', ro: 'Piept de curcan la grătar cu legume coapte și mămăligă', en: 'Grilled turkey with roasted vegetables and polenta', items: [['turkey', 150], ['zucchini', 150], ['pepper', 100], ['eggplant', 100], ['olive_oil', 10], ['cornmeal', 50]], stepsRo: 'Legumele la cuptor 25 minute. Curcanul la grătar 5–6 minute pe parte.', stepsEn: 'Roast vegetables 25 minutes. Grill turkey 5–6 minutes per side.' },
  { id: 'sardine_salad', slot: 'main', ro: 'Salată de cartofi cu sardine și ceapă roșie', en: 'Potato salad with sardines and red onion', items: [['potato', 220], ['sardines', 90], ['onion', 40], ['cucumber', 100], ['olive_oil', 5]], stepsRo: 'Cartofii fierți, răciți (amidon rezistent), cu sardine, ceapă și oțet.', stepsEn: 'Boiled, cooled potatoes (resistant starch) with sardines, onion and vinegar.', gutFriendly: true },
  { id: 'conopida_pui', slot: 'main', ro: 'Pui cu conopidă la cuptor și iaurt cu usturoi', en: 'Chicken with roasted cauliflower and garlic yogurt', items: [['chicken', 150], ['cauliflower', 250], ['olive_oil', 10], ['yogurt', 100], ['bread_ww', 40]], stepsRo: 'Conopida cu boia și ulei la 200°C, 25 minute; puiul la tigaie.', stepsEn: 'Roast cauliflower with paprika and oil at 200°C for 25 minutes; pan-fry the chicken.' },

  // Snacks
  { id: 'snack_kefir', slot: 'snack', ro: 'Chefir și un măr', en: 'Kefir and an apple', items: [['kefir', 250], ['apple', 150]], stepsRo: '', stepsEn: '', gutFriendly: true },
  { id: 'snack_nuts', slot: 'snack', ro: 'Nucă și o pară/măr', en: 'Walnuts and an apple', items: [['walnuts', 20], ['apple', 150]], stepsRo: '', stepsEn: '' },
  { id: 'snack_cottage', slot: 'snack', ro: 'Brânză de vaci cu fructe de pădure', en: 'Cottage cheese with berries', items: [['cottage', 150], ['berries', 100]], stepsRo: '', stepsEn: '' },
  { id: 'snack_hummus', slot: 'snack', ro: 'Humus cu bastonașe de morcov și ardei (de post)', en: 'Hummus with carrot and pepper sticks (vegan)', items: [['chickpeas', 30], ['olive_oil', 5], ['carrot', 100], ['pepper', 100]], stepsRo: '', stepsEn: '' },
  { id: 'snack_yogurt', slot: 'snack', ro: 'Iaurt cu semințe de in și miere puțină', en: 'Yogurt with flax and a little honey', items: [['yogurt', 200], ['flax', 10], ['honey', 7]], stepsRo: '', stepsEn: '', gutFriendly: true },
  { id: 'snack_banana_pb', slot: 'snack', ro: 'Banană cu unt de arahide (de post)', en: 'Banana with peanut butter (vegan)', items: [['banana', 120], ['peanut_butter', 15]], stepsRo: '', stepsEn: '' },
];
