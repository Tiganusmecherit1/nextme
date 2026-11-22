// Pose library for exercise illustrations (original artwork, drawn in code).
// See Figure.tsx for the angle convention. Every exercise id gets its own entry;
// generic `Anim` keys remain as fallbacks for older data.
export type V = [number, number];
/** a = absolute angles [upper, lower, foot]; ik = fixed end point; s = length scale (foreshortening) */
export interface Limb { a?: number[]; ik?: V; bend?: number; f?: number; s?: number | number[] }
/** h = hip, t = torso lean (0 upright, 90 = shoulders ahead of hips), c = spine curve, hd = head nod,
 *  ts = torso length scale, sh = shoulder shrug, hx = head shift; an/af = near/far arm, ln/lf = near/far leg */
export interface Key { h: V; t: number; c?: number; hd?: number; ts?: number; sh?: number; hx?: number; hy?: number; an?: Limb; af?: Limb; ln?: Limb; lf?: Limb }
export type Shape = [string, ...(number | string)[]];
export interface Prop {
  k: 'rect' | 'db' | 'dbh' | 'kb' | 'plate' | 'barh' | 'handle' | 'pad' | 'sled' | 'cable' | 'band' | 'loop';
  at?: 'wn' | 'wf' | 'w' | 'en' | 'an' | 'af' | 'kn' | 'kf' | 'k' | 'hip' | 'sh' | 'chest' | 'head' | 'tn';
  to?: Prop['at'];
  from?: V; dx?: number; dy?: number; r?: number; rot?: number; w?: number; h?: number; plates?: boolean; z?: 'back';
}
export interface Spec {
  a: Key; b: Key; front?: boolean; /** front view rotated by t (top-down lying figures, side plank) */ flat?: boolean; scene?: Shape[]; props?: Prop[];
  /** which phase (0 = a, 1 = b) is shown when not animating */
  still?: number; dur?: number; floor?: boolean; shadow?: number; ghost?: boolean;
}

export const FIGS: Record<string, Spec> = {};

// ---------------------------------------------------------------- helpers
const GY = 90; // ankle height of a planted foot
const A = (u: number, l = u): Limb => ({ a: [u, l] });
const G = (u: number, l = u, f = 92): Limb => ({ a: [u, l, f] });
const IK = (x: number, y: number, bend?: number, f?: number): Limb => ({ ik: [x, y], bend, f });
const k = (h: V, t: number, rest: Partial<Key> = {}): Key => ({ h, t, ...rest });
/** Standing upright, feet together under the hips. */
const stand = (rest: Partial<Key> = {}, x = 50): Key => ({ h: [x, 52], t: 0, ln: G(0, 0), lf: G(0, 0), an: A(0, 0), ...rest });
const def = (ids: string | string[], s: Spec) => { for (const id of Array.isArray(ids) ? ids : [ids]) FIGS[id] = s; };
const merge = (s: Spec, o: Partial<Spec>): Spec => ({ ...s, ...o });

// scenes
const BENCH = (x = 24, w = 52, y = 74): Shape[] => [['pad', x, y, w, 4.2], ['r', x + 4, y + 4, 2.6, 92.6 - y - 4], ['r', x + w - 6.6, y + 4, 2.6, 92.6 - y - 4]];
const CHAIR = (x = 30, y = 66, back = true): Shape[] => [['pad', x, y, 22, 3.6], ['r', x + 1, y + 3, 2.4, 92.6 - y - 3], ['r', x + 18.6, y + 3, 2.4, 92.6 - y - 3], ...(back ? ([['r', x, y - 30, 3, 31]] as Shape[]) : [])];
const BOX = (x: number, w = 26, h = 14): Shape[] => [['r', x, 92.6 - h, w, h, 0, '#3f3f46']];
const BAR = (x1 = 30, x2 = 70, y = 8): Shape[] => [['l', x1, y, x2, y, 2.2], ['r', x1 - 2, y - 2, 3, 94.6 - y, 0], ['r', x2 - 1, y - 2, 3, 94.6 - y, 0]];
const TOWER = (x: number): Shape[] => [['r', x - 2, 6, 4, 86.6]];

const deg = (r: number) => (r * 180) / Math.PI;
/** torso lean that points from hip `h` to shoulder `s` */
const tOf = (h: V, s: V) => deg(Math.atan2(s[0] - h[0], -(s[1] - h[1])));
/** a straight body: shoulder at `sh`, hip placed 23 units towards `to` (ankle or knee) */
const line = (sh: V, to: V, rest: Partial<Key> = {}): Key => {
  const d = Math.hypot(to[0] - sh[0], to[1] - sh[1]);
  const h: V = [sh[0] + ((to[0] - sh[0]) / d) * 23, sh[1] + ((to[1] - sh[1]) / d) * 23];
  return { h, t: tOf(h, sh), ...rest };
};
/** hip + shoulder position (torso length is kept, shoulder gives the direction) */
const hs = (h: V, s: V, rest: Partial<Key> = {}): Key => ({ h, t: tOf(h, s), ...rest });
const feetAt = (xn: number, xf = xn, y = GY): Partial<Key> => ({ ln: IK(xn, y), lf: IK(xf, y) });
const sym = (l: Limb): Partial<Key> => ({ an: l, af: l });
const legs = (l: Limb): Partial<Key> => ({ ln: l, lf: l });
const db2: Prop[] = [{ k: 'db', at: 'wf' }, { k: 'db', at: 'wn' }];
const db1: Prop[] = [{ k: 'db', at: 'wn' }];
const plateH: Prop[] = [{ k: 'plate', at: 'wn' }];
const SMITH = (x = 58): Shape[] => [['r', x - 1.5, 4, 3, 88.6, 0, '#2f2f35'], ['r', x - 6, 4, 12, 2.4, 0, '#2f2f35']];
const RACK = (x = 66): Shape[] => [['r', x, 6, 3, 86.6, 0, '#2f2f35'], ['r', x - 6, 28, 7, 2]];
const ARMS_FWD = sym(A(90, 90));
const HANDS_CHEST = sym(A(25, 160));
const HANDS_HEAD = sym(A(150, -30));
const HANDS_HIPS = { an: A(-30, 30), af: A(-30, 30) };

// =============================================================== SQUAT / QUADS
const SQ_BOT = (rest: Partial<Key> = {}) => k([38, 73], 40, { ...feetAt(51, 49), ...rest });
def(['bw_squat', 'tempo_squat'], { a: stand(ARMS_FWD), b: SQ_BOT(sym(A(95, 95))) });
def('box_squat', { a: stand(ARMS_FWD), b: k([36, 68], 34, { ...feetAt(52, 50), ...sym(A(92, 92)) }), scene: CHAIR(16, 70, false) });
def(['sit_to_stand'], { a: k([36, 68], 22, { ...feetAt(52, 50), ...HANDS_CHEST }), b: stand(HANDS_CHEST), still: 0, scene: CHAIR(16, 70) });
def('goblet_squat', { a: stand(sym(A(12, 165))), b: SQ_BOT(sym(A(32, 168))), props: [{ k: 'db', at: 'wn', dx: 1.5, dy: -1 }] });
def('kb_goblet', { a: stand(sym(A(12, 165))), b: SQ_BOT(sym(A(32, 168))), props: [{ k: 'kb', at: 'wn', dx: 1.5, dy: -4 }] });
def('db_squat', { a: stand(), b: k([39, 72], 32, { ...feetAt(51, 49), ...sym(A(2, 0)) }), props: db2 });
def('back_squat', { a: stand(sym(A(-35, 150))), b: SQ_BOT(sym(A(15, 175))), props: [{ k: 'plate', at: 'sh', dx: -1.5, dy: 1 }], scene: RACK(70) });
def('smith_squat', { a: stand(sym(A(-35, 150))), b: k([40, 73], 34, { ...feetAt(56, 54), ...sym(A(15, 175)) }), props: [{ k: 'plate', at: 'sh', dx: -1.5, dy: 1 }], scene: SMITH(49) });
def('front_squat', { a: stand(sym(A(95, -85))), b: k([41, 75], 24, { ...feetAt(51, 49), ...sym(A(110, -70)) }), props: [{ k: 'plate', at: 'sh', dx: 4, dy: 1 }], scene: RACK(70) });
def('hack_squat', {
  a: k([50, 53], -22, { ...feetAt(63, 61, 88), ...sym(A(-20, 172)) }), b: k([40, 71], -22, { ...feetAt(63, 61, 88), ...sym(A(-20, 172)) }),
  scene: [['l', 24, 92, 58, 32, 2.6], ['r', 54, 89, 18, 3.2, -14]],
  props: [{ k: 'rect', at: 'chest', w: 4.5, h: 26, rot: 22, dx: -6.5, dy: 4, z: 'back' }, { k: 'pad', at: 'sh', r: 2.6, dx: 1.5, dy: -1.5 }],
});
const LP_SCENE: Shape[] = [['pad', 26, 76, 18, 4.2, -8], ['pad', 21, 58, 5, 24, -55], ['r', 32, 80, 3, 12.6], ['l', 52, 78, 86, 49, 2.4], ['r', 74, 58, 3, 34.6]];
const LP = (ext: boolean, far?: Limb) => k([36, 76], -55, { ln: IK(ext ? 64 : 53, ext ? 53 : 62, 1, 130), lf: far ?? IK(ext ? 64 : 53, ext ? 53 : 62, 1, 130), ...sym(A(35, 75)) });
def('leg_press', { a: LP(false), b: LP(true), scene: LP_SCENE, props: [{ k: 'sled', at: 'an', rot: -40, dx: 2.4, dy: -2 }] });
def('single_leg_press', { a: LP(false, G(150, 20)), b: LP(true, G(150, 20)), scene: LP_SCENE, props: [{ k: 'sled', at: 'an', rot: -40, dx: 2.4, dy: -2 }] });
const LEGEXT_SCENE: Shape[] = [['pad', 30, 69, 24, 4.2], ['pad', 28, 40, 4.5, 30, -6], ['r', 36, 73, 3, 19.6], ['c', 56, 70, 1.6]];
def('leg_extension', { a: k([40, 66], -4, { ...legs(G(90, 2, 92)), ...sym(A(10, 40)) }), b: k([40, 66], -4, { ...legs(G(90, 85, 160)), ...sym(A(10, 40)) }), scene: LEGEXT_SCENE, props: [{ k: 'pad', at: 'an', dx: 1, dy: -3 }] });
def('wall_sit', { a: k([36, 70], 0, { ...feetAt(56, 54), ...sym(A(10, 20)) }), b: k([36, 70.5], 0, { ...feetAt(56, 54), ...sym(A(10, 20)) }), scene: [['wall', 27]], ghost: false });
def('sumo_squat_db', {
  front: true,
  a: stand({ ln: IK(34, GY, 1, 30), lf: IK(66, GY, 1, 30), h: [50, 55], an: IK(49, 54), af: IK(51, 54) }),
  b: stand({ ln: IK(34, GY, 1, 30), lf: IK(66, GY, 1, 30), h: [50, 67], an: IK(49, 66), af: IK(51, 66) }),
  props: [{ k: 'dbh', at: 'w', rot: 90, dy: 4 }],
});
def('band_squat', { a: stand(sym(A(25, 172))), b: SQ_BOT(sym(A(35, 175))), props: [{ k: 'band', at: 'an', to: 'wn' }] });
def('heel_elevated_squat', {
  a: stand({ ...ARMS_FWD, h: [50, 49], ...feetAt(51, 49, 87) }), b: k([40, 71], 26, { ...feetAt(52, 50, 87), ...sym(A(95, 95)) }),
  scene: [['r', 44, 88, 14, 4.6, 0, '#4a4a52']],
});
def('spanish_squat', {
  a: stand({ ...HANDS_CHEST, ...feetAt(56, 54), h: [55, 52] }), b: k([38, 72], 14, { ...feetAt(56, 54), ...HANDS_CHEST }),
  scene: [['r', 86, 40, 4, 52.6]], props: [{ k: 'band', at: 'kn', from: [86, 66] }],
});
def('jump_squat', {
  a: SQ_BOT(sym(A(-40, -30))), b: k([50, 40], 2, { ...legs(G(0, 4, 40)), ...sym(A(170, 175)) }), still: 1,
});
def('step_down', {
  a: k([42, 36], 0, { ln: IK(43, 74), lf: G(8, 8, 120), an: A(30, 40) }), b: k([34, 50], 30, { ln: IK(43, 74), lf: G(30, 20, 120), an: A(80, 85) }),
  scene: BOX(28, 22, 18),
});

// =============================================================== HINGE / POSTERIOR CHAIN
const HINGE_B = (rest: Partial<Key> = {}) => k([40, 53], 78, { ...feetAt(51, 49), ...sym(A(0, 0)), ...rest });
def('db_rdl', { a: stand(), b: HINGE_B(), props: db2 });
def('bb_rdl', { a: stand(), b: HINGE_B(), props: plateH });
def('good_morning_bw', { a: stand(HANDS_HEAD), b: HINGE_B(HANDS_HEAD) });
def('band_good_morning', { a: stand(sym(A(20, 175))), b: HINGE_B(sym(A(100, 200))), props: [{ k: 'band', at: 'an', to: 'sh' }] });
def('kb_swing', {
  a: k([40, 58], 68, { ...feetAt(53, 47), ...sym(A(-25, -25)) }), b: stand({ ...feetAt(53, 47), ...sym(A(92, 92)) }),
  props: [{ k: 'kb', at: 'wn', dy: -2 }], dur: 1600,
});
def('deadlift', { a: k([33, 66], 50, { ...feetAt(51, 49), an: IK(55, 85.4), af: IK(55, 85.4) }), b: stand(), props: plateH, still: 0 });
def('kb_deadlift', { a: k([35, 66], 46, { ...feetAt(53, 47), an: IK(52, 80), af: IK(52, 80) }), b: stand({ ...feetAt(53, 47) }), props: [{ k: 'kb', at: 'wn', dy: -1 }], still: 0 });
def('sl_rdl', {
  a: stand(), b: k([44, 52], 86, { ln: IK(47, GY, 1), lf: G(-84, -84, -10), ...sym(A(2, 2)) }), props: db1,
});
def('cable_pull_through', {
  a: k([42, 56], 72, { ...feetAt(53, 47), ...sym(A(-20, -20)) }), b: stand({ ...feetAt(53, 47), ...sym(A(12, 12)) }),
  scene: TOWER(14), props: [{ k: 'cable', at: 'wn', from: [14, 86] }, { k: 'handle', at: 'wn' }],
});
def('back_extension', {
  a: k([54, 54], 145, { ...legs(IK(30, 84)), ...HANDS_CHEST }), b: k([54, 54], 48, { ...legs(IK(30, 84)), ...HANDS_CHEST }),
  scene: [['pad', 52, 52, 5, 14, -45], ['pad', 26, 82, 8, 4, -45], ['l', 30, 92, 58, 62, 2.4], ['r', 52, 64, 3, 28.6]], still: 1,
});
const LEGCURL_SCENE: Shape[] = [['pad', 30, 69, 24, 4.2], ['pad', 28, 40, 4.5, 30, -6], ['r', 36, 73, 3, 19.6], ['pad', 52, 60, 10, 3.2]];
def('leg_curl', { a: k([40, 66], -4, { ...legs(G(90, 88, 160)), ...sym(A(10, 40)) }), b: k([40, 66], -4, { ...legs(G(90, -5, 100)), ...sym(A(10, 40)) }), scene: LEGCURL_SCENE, props: [{ k: 'pad', at: 'an', dx: -1, dy: 3 }] });
const PRONE = (rest: Partial<Key> = {}) => k([44, 87.6], 90, { ...legs(G(-90, -90, -110)), ...sym(A(10, 90)), ...rest });
def('band_leg_curl', { a: PRONE(), b: PRONE({ ...legs(G(-90, -175, -120)) }), props: [{ k: 'band', at: 'an', from: [8, 88] }], scene: [['r', 6, 82, 3, 10.6]] });
def('superman', { a: PRONE({ ...sym(A(90, 90)) }), b: PRONE({ t: 82, ...legs(G(-98, -98, -110)), ...sym(A(100, 100)), hd: -10 }) });
def('prone_y_raise', { a: PRONE({ ...sym(A(90, 90)) }), b: PRONE({ t: 85, ...sym(A(104, 104)), hd: -6 }) });
def('nordic_curl', {
  a: k([40, 69], 0, { ...legs(G(0, -90, -100)), ...sym(A(30, 60)) }), b: k([53, 76], 48, { ...legs(G(-48, -90, -100)), ...sym(A(80, 70)) }),
  scene: [['pad', 32, 89, 16, 3.6], ['pad', 16, 84, 6, 4]],
});
def('towel_leg_curl', {
  a: k([38, 87.6], -90, { ...legs(IK(76, GY, 1)), ...sym(A(90, 90)) }), b: k([40, 80], -76, { ...legs(IK(60, GY, 1)), ...sym(A(90, 90)) }),
  props: [{ k: 'pad', at: 'an', r: 2.2, dx: 1, dy: 1.5 }],
});

// =============================================================== GLUTES
const SUP_L = (h: V = [44, 87.6]) => k(h, -90, { ...legs(IK(60, GY)), ...sym(A(88, 88)) });
const BRIDGE_UP = (rest: Partial<Key> = {}) => hs([47, 74], [25, 84.5], { ...legs(IK(60, GY)), ...sym(A(80, 90)), ...rest });
def(['glute_bridge', 'pelvic_tilt'], { a: SUP_L(), b: BRIDGE_UP() });
FIGS.pelvic_tilt = { a: SUP_L(), b: hs([44, 86], [21, 87.6], { ...legs(IK(60, GY)), ...sym(A(88, 88)) }), ghost: false };
def('single_leg_bridge', { a: k([44, 87.6], -90, { ln: IK(60, GY), lf: G(150, 120), ...sym(A(88, 88)) }), b: BRIDGE_UP({ lf: G(118, 118) }) });
def('bridge_march', { a: BRIDGE_UP(), b: BRIDGE_UP({ lf: G(175, 95) }) });
def('band_bridge', { a: SUP_L(), b: BRIDGE_UP(), props: [{ k: 'loop', at: 'kn', to: 'kf' }] });
const HT_SCENE: Shape[] = [['pad', 6, 74, 22, 4.2], ['r', 10, 78, 2.6, 14.6], ['r', 22, 78, 2.6, 14.6]];
const HT_A = hs([38, 84], [22, 70], { ...legs(IK(60, GY)), an: IK(39, 79), af: IK(39, 79) });
const HT_B = hs([45, 70], [22, 71], { ...legs(IK(60, GY)), an: IK(45, 65), af: IK(45, 65) });
def('hip_thrust', { a: HT_A, b: HT_B, scene: HT_SCENE, props: [{ k: 'plate', at: 'hip', dy: -5 }] });
def('db_hip_thrust', { a: HT_A, b: HT_B, scene: HT_SCENE, props: [{ k: 'db', at: 'hip', dy: -5 }] });
def('glute_machine', {
  a: k([48, 56], 58, { ln: G(60, -20, 60), lf: IK(46, GY), an: A(60, 100), af: A(60, 100) }), b: k([48, 56], 58, { ln: G(-80, -95, -40), lf: IK(46, GY), an: A(60, 100), af: A(60, 100) }),
  scene: [['pad', 58, 40, 5, 18, 32], ['pad', 62, 52, 16, 3.4], ['r', 70, 55, 3, 37.6]], props: [{ k: 'pad', at: 'an', r: 2.6 }],
});
const SIDE_LY = (rest: Partial<Key> = {}) => k([52, 84], -90, { lf: G(72, -95, -60), ln: G(72, -95, -60), af: A(-92, -60), an: A(60, 100), ...rest });
def('clamshell', { a: SIDE_LY(), b: SIDE_LY({ ln: G(125, -47, -60) }), props: [{ k: 'loop', at: 'kn', to: 'kf' }] });
const QUAD = (rest: Partial<Key> = {}) => hs([44, 70], [66, 64.5], { ...legs(G(0, -90, -95)), an: IK(66, 89.5), af: IK(66, 89.5), ...rest });
def('quadruped_hip_ext', { a: QUAD(), b: QUAD({ ln: G(-92, -92, -100) }) });
def('standing_hip_abduction', {
  front: true, a: stand({ an: A(38, 30), af: IK(57, 50, 1) }), b: stand({ an: A(38, 30), af: IK(57, 50, 1), lf: G(30, 30, 60), t: -3 }),
  scene: [['r', 20, 50, 3, 42.6], ['pad', 14, 48, 16, 3]],
});
def('hip_abduction_machine', {
  front: true,
  a: k([50, 69], 0, { an: A(25, 10), af: A(25, 10), ln: { a: [80, 0, 30], s: [0.2, 1] }, lf: { a: [80, 0, 30], s: [0.2, 1] } }),
  b: k([50, 69], 0, { an: A(25, 10), af: A(25, 10), ln: { a: [88, 2, 30], s: [0.62, 1] }, lf: { a: [88, 2, 30], s: [0.62, 1] } }),
  scene: [['pad', 38, 38, 24, 30], ['pad', 34, 70, 32, 4], ['r', 48, 74, 4, 18.6]], props: [{ k: 'rect', at: 'kn', w: 3, h: 10, dx: -2.5, dy: 2 }, { k: 'rect', at: 'kf', w: 3, h: 10, dx: 2.5, dy: 2 }],
});
def('band_lateral_walk', {
  front: true,
  a: k([50, 58], 0, { ln: IK(42, GY, 1, 20), lf: IK(58, GY, 1, 20), ...HANDS_HIPS }),
  b: k([56, 58], 0, { ln: IK(44, GY, 1, 20), lf: IK(72, GY, 1, 20), ...HANDS_HIPS }),
  props: [{ k: 'loop', at: 'an', to: 'af', dy: -3 }], dur: 1800,
});

// =============================================================== LUNGE / STEP
const LUNGE_B = (rest: Partial<Key> = {}) => k([44, 69], 4, { ln: IK(58, GY), lf: IK(24, 86, 1, 45), ...rest });
def(['reverse_lunge', 'walking_lunge'], { a: stand(), b: LUNGE_B({ ...HANDS_HIPS }) });
def(['db_lunge', 'db_reverse_lunge'], { a: stand(), b: LUNGE_B(), props: db2 });
def('split_squat_static', { a: k([45, 55], 2, { ln: IK(58, GY), lf: IK(26, 86, 1, 45), ...HANDS_HIPS }), b: LUNGE_B({ ...HANDS_HIPS, lf: IK(26, 86, 1, 45) }) });
def('smith_split_squat', {
  a: k([45, 55], 2, { ln: IK(58, GY), lf: IK(26, 86, 1, 45), ...sym(A(-35, 150)) }), b: LUNGE_B({ lf: IK(26, 86, 1, 45), ...sym(A(10, 172)) }),
  scene: SMITH(43), props: [{ k: 'plate', at: 'sh', dx: -1.5, dy: 1 }],
});
def('split_squat', {
  a: k([47, 54], 2, { ln: IK(61, GY), lf: IK(22, 71, 1, -95), ...HANDS_HIPS }), b: k([44, 68], 6, { ln: IK(61, GY), lf: IK(22, 71, 1, -95), ...HANDS_HIPS }),
  scene: BENCH(4, 26, 74),
});
def('lateral_lunge', {
  front: true,
  a: k([50, 57], 0, { ln: IK(31, GY, 1, 20), lf: IK(69, GY, 1, 20), an: IK(48, 42), af: IK(52, 42) }),
  b: k([39, 68], 0, { ln: IK(31, GY, 1, 20), lf: IK(69, GY, 1, 20), an: IK(37, 53), af: IK(41, 53) }),
});
const STEP = BOX(52, 28, 16);
def(['step_up'], { a: k([44, 58], 8, { ln: IK(61, 74), lf: IK(42, GY), an: A(-25, -15), af: A(25, 40) }), b: k([61, 36], 0, { ln: IK(61, 74), lf: G(60, -10), an: A(25, 40), af: A(-25, -15) }), scene: STEP });
def('db_step_up', { a: k([44, 58], 8, { ln: IK(61, 74), lf: IK(42, GY) }), b: k([61, 36], 0, { ln: IK(61, 74), lf: G(10, -10) }), scene: STEP, props: db2 });
def('lateral_step_up', {
  front: true,
  a: k([48, 58], 0, { ln: IK(42, GY, 1, 20), lf: IK(62, 74, 1, 20), ...HANDS_HIPS }), b: k([58, 36], 0, { ln: G(6, 4, 20), lf: IK(63, 74, 1, 20), ...HANDS_HIPS }),
  scene: BOX(55, 28, 16),
});

// =============================================================== PUSH (CHEST)
const PU_TOP = (rest: Partial<Key> = {}) => line([68, 64], [10, 86], { ...legs(IK(10, 86, 1, 15)), ...sym(IK(68, 89.5)), ...rest });
const PU_BOT = (rest: Partial<Key> = {}) => line([71, 79], [10, 86], { ...legs(IK(10, 86, 1, 15)), ...sym(IK(67, 89.5)), ...rest });
def(['pushup', 'close_grip_pushup'], { a: PU_TOP(), b: PU_BOT() });
const kneel = (sh: V, knee: V, rest: Partial<Key> = {}): Key => {
  const b = line(sh, knee);
  const th = deg(Math.atan2(knee[0] - b.h[0], knee[1] - b.h[1]));
  return { ...b, ...legs(G(th, -125, -100)), ...rest };
};
def('knee_pushup', { a: kneel([66, 64], [30, 88], sym(IK(66, 89.5))), b: kneel([70, 78], [30, 88], sym(IK(66, 89.5))) });
const TABLE = (x = 62, w = 30, y = 68): Shape[] => [['r', x, y, w, 3.2, 0, '#4a4a52'], ['r', x + 2, y + 3, 2.4, 92.6 - y - 3], ['r', x + w - 4.4, y + 3, 2.4, 92.6 - y - 3]];
def(['incline_pushup', 'desk_pushup'], { a: line([63, 46], [22, GY], { ...legs(IK(22, GY, 1, 70)), ...sym(IK(68, 66.5)) }), b: line([69, 55], [22, GY], { ...legs(IK(22, GY, 1, 70)), ...sym(IK(68, 66.5)) }), scene: TABLE(62, 30, 68) });
def('wall_pushup', { a: line([58, 33], [44, GY], { ...legs(IK(44, GY, 1, 92)), ...sym(IK(77, 35)) }), b: line([66, 32], [44, GY], { ...legs(IK(44, GY, 1, 92)), ...sym(IK(77, 35)) }), scene: [['wall', 79]] });
def('decline_pushup', { a: line([76, 64.5], [16, 71], { ...legs(IK(16, 71, 1, 5)), ...sym(IK(76, 89.5)) }), b: line([79, 79], [16, 71], { ...legs(IK(16, 71, 1, 5)), ...sym(IK(75, 89.5)) }), scene: BENCH(4, 24, 74) });
def('pike_pushup', { a: hs([44, 54], [62, 70], { ...legs(IK(28, 88, 1, 30)), ...sym(IK(63, 89.5)), hd: 20 }), b: hs([47, 58], [63, 78], { ...legs(IK(28, 88, 1, 30)), ...sym(IK(63, 89.5)), hd: 20 }) });

const SUP_B = (rest: Partial<Key> = {}) => k([40, 69.4], 90, { ...legs(IK(27, GY, -1)), ...rest });
const PRESS_A = sym(A(178, 180)), PRESS_B = sym(A(-60, 170));
def('db_bench', { a: SUP_B(PRESS_A), b: SUP_B(sym(A(-60, 165))), scene: BENCH(24, 52, 74), props: db2 });
def(['bb_bench', 'close_grip_bench'], { a: SUP_B(PRESS_A), b: SUP_B(PRESS_B), scene: [...BENCH(24, 52, 74), ...RACK(74)], props: plateH });
def('smith_bench', { a: SUP_B(PRESS_A), b: SUP_B(PRESS_B), scene: [...SMITH(60), ...BENCH(24, 52, 74)], props: plateH });
const INC = (arms: Partial<Key>) => k([40, 70], 55, { ...legs(IK(27, GY, -1)), ...arms });
const INC_SCENE: Shape[] = [['pad', 28, 73, 18, 4.2], ['pad', 50.2, 53.9, 4.5, 28, 55], ['r', 36, 77, 3, 15.6], ['r', 58, 66, 3, 26.6]];
def('db_incline_bench', { a: INC(sym(A(178, 180))), b: INC(sym(A(-25, 172))), scene: INC_SCENE, props: db2 });
def('bb_incline_bench', { a: INC(sym(A(178, 180))), b: INC(sym(A(-25, 172))), scene: INC_SCENE, props: plateH });
def('db_floor_press', { a: k([40, 87.6], 90, { ...legs(IK(28, GY, -1)), ...sym(A(178, 180)) }), b: k([40, 87.6], 90, { ...legs(IK(28, GY, -1)), ...sym(A(-75, 178)) }), props: db2 });
const SEAT_SCENE: Shape[] = [['pad', 28, 73, 22, 4], ['pad', 30, 40, 4.5, 33], ['r', 38, 77, 3, 15.6]];
const SEATED = (arms: Partial<Key>, t = -4) => k([40, 70], t, { ...legs(G(90, 0)), ...arms });
def('chest_press', { a: SEATED(sym(A(-65, 90))), b: SEATED(sym(A(88, 90))), scene: [...SEAT_SCENE, ['r', 76, 20, 3, 72.6]], props: [{ k: 'handle', at: 'wn' }] });
def('band_chest_press', {
  a: stand({ ln: IK(58, GY), lf: IK(42, GY), h: [50, 53], ...sym(A(-65, 90)) }), b: stand({ ln: IK(58, GY), lf: IK(42, GY), h: [50, 53], ...sym(A(88, 90)), t: 6 }),
  scene: [['r', 10, 20, 3, 72.6]], props: [{ k: 'band', at: 'wn', from: [12, 36] }],
});
// flies / pullover
def('db_fly', {
  flat: true, floor: false,
  a: k([38, 56], 90, { an: { a: [60, 60], s: 0.3 }, af: { a: [60, 60], s: 0.3 }, ...legs({ a: [6, 6, 20], s: [1, 0.35] }) }),
  b: k([38, 56], 90, { an: A(88, 100), af: A(88, 100), ...legs({ a: [6, 6, 20], s: [1, 0.35] }) }),
  scene: [['pad', 22, 50.5, 50, 11]], props: [{ k: 'dbh', at: 'wn' }, { k: 'dbh', at: 'wf' }],
});
const PEC = (arms: Partial<Key>) => k([50, 69], 0, { ...arms, ...legs({ a: [70, 0, 30], s: [0.25, 1] }) });
def('pec_deck', {
  front: true, a: PEC({ an: A(88, 178), af: A(88, 178) }), b: PEC({ an: { a: [-60, 178], s: [0.5, 1] }, af: { a: [-60, 178], s: [0.5, 1] } }),
  scene: [['pad', 38, 30, 24, 38], ['pad', 34, 70, 32, 4], ['r', 48, 74, 4, 18.6], ['l', 30, 8, 70, 8, 2.4]], props: [{ k: 'rect', at: 'en', w: 3.4, h: 10, dy: -5 }, { k: 'rect', at: 'wf', w: 3.4, h: 10, dy: 6.5 }],
});
def('reverse_pec_deck', {
  front: true, a: PEC({ an: { a: [88, 88], s: 0.3 }, af: { a: [88, 88], s: 0.3 } }), b: PEC({ an: A(88, 90), af: A(88, 90) }),
  scene: [['pad', 34, 70, 32, 4], ['r', 48, 74, 4, 18.6]], props: [{ k: 'handle', at: 'wn' }, { k: 'handle', at: 'wf' }],
});
const TOWERS: Shape[] = [...TOWER(10), ...TOWER(90)];
def('cable_fly', {
  front: true, a: stand({ an: A(118, 112), af: A(118, 112), ln: IK(44, GY, 1, 20), lf: IK(56, GY, 1, 20) }), b: stand({ an: IK(48.5, 50), af: IK(51.5, 50), ln: IK(44, GY, 1, 20), lf: IK(56, GY, 1, 20) }),
  scene: [...TOWERS, ['pulley', 12, 14], ['pulley', 88, 14]], props: [{ k: 'cable', at: 'wn', from: [12, 14] }, { k: 'cable', at: 'wf', from: [88, 14] }, { k: 'handle', at: 'wn' }, { k: 'handle', at: 'wf' }],
});
def('low_cable_fly', {
  front: true, a: stand({ an: A(32, 28), af: A(32, 28), ln: IK(44, GY, 1, 20), lf: IK(56, GY, 1, 20) }), b: stand({ an: IK(48.5, 30), af: IK(51.5, 30), ln: IK(44, GY, 1, 20), lf: IK(56, GY, 1, 20) }),
  scene: [...TOWERS, ['pulley', 12, 84], ['pulley', 88, 84]], props: [{ k: 'cable', at: 'wn', from: [12, 84] }, { k: 'cable', at: 'wf', from: [88, 84] }, { k: 'handle', at: 'wn' }, { k: 'handle', at: 'wf' }],
});
def('band_fly', {
  front: true, a: stand({ an: A(88, 92), af: A(88, 92) }), b: stand({ an: { a: [88, 88], s: 0.32 }, af: { a: [88, 88], s: 0.32 } }),
  props: [{ k: 'band', at: 'wn', to: 'wf', z: 'back' }],
});
def('db_pullover', { a: SUP_B(sym(A(178, 178))), b: SUP_B(sym(A(88, 92))), scene: BENCH(24, 52, 74), props: [{ k: 'db', at: 'wn' }] });

// =============================================================== SHOULDERS
const OHP_A = sym(A(25, 180)), OHP_B = sym(A(177, 178));
def(['db_ohp'], { a: stand(OHP_A), b: stand(OHP_B), props: db2 });
def('arnold_press', { a: stand(sym(A(60, 172))), b: stand(OHP_B), props: db2 });
def('bb_ohp', { a: stand(sym(A(22, 178))), b: stand({ ...OHP_B, t: -3 }), props: plateH });
def('kb_press', { a: stand({ an: A(22, 178), af: A(0, 0) }), b: stand({ an: A(177, 178), af: A(0, 0) }), props: [{ k: 'kb', at: 'wn', dy: -3 }] });
def('band_ohp', { a: stand(OHP_A), b: stand(OHP_B), props: [{ k: 'band', at: 'an', to: 'wn' }] });
const SEAT_UP: Shape[] = [['pad', 30, 73, 20, 4], ['pad', 31, 36, 4.5, 37], ['r', 38, 77, 3, 15.6]];
def('seated_db_ohp', { a: SEATED(OHP_A, 0), b: SEATED(OHP_B, 0), scene: SEAT_UP, props: db2 });
def('machine_ohp', { a: SEATED(sym(A(20, 178)), 0), b: SEATED(OHP_B, 0), scene: [...SEAT_UP, ['r', 66, 4, 3, 88.6]], props: [{ k: 'handle', at: 'wn' }] });
def('smith_ohp', { a: SEATED(sym(A(22, 178)), 0), b: SEATED(OHP_B, 0), scene: [...SMITH(52), ...SEAT_UP], props: plateH });
def('wall_slide', { front: true, a: stand({ an: A(82, 178), af: A(82, 178) }), b: stand({ an: A(150, 172), af: A(150, 172) }) });
def('lateral_raise', { front: true, a: stand({ an: A(10, 8), af: A(10, 8), ...legs(G(3, 3, 30)) }), b: stand({ an: A(86, 90), af: A(86, 90), ...legs(G(3, 3, 30)) }), props: [{ k: 'dbh', at: 'wn', rot: 90 }, { k: 'dbh', at: 'wf', rot: 90 }] });
def('band_lateral_raise', { front: true, a: stand({ an: A(10, 8), af: A(10, 8), ...legs(G(3, 3, 30)) }), b: stand({ an: A(86, 90), af: A(86, 90), ...legs(G(3, 3, 30)) }), props: [{ k: 'band', at: 'an', to: 'wn' }, { k: 'band', at: 'af', to: 'wf' }] });
def('cable_lateral_raise', {
  front: true, a: stand({ an: A(10, 10), af: A(-12, -14), ...legs(G(3, 3, 30)) }), b: stand({ an: A(10, 10), af: A(86, 90), ...legs(G(3, 3, 30)) }),
  scene: [...TOWER(12), ['pulley', 14, 84]], props: [{ k: 'cable', at: 'wf', from: [14, 84] }, { k: 'handle', at: 'wf' }],
});
def('front_raise', { a: stand(sym(A(4, 4))), b: stand(sym(A(88, 88))), props: db2 });
def('rear_delt_fly', {
  front: true, a: k([50, 58], 0, { ts: 0.5, hy: 7, an: A(4, 4), af: A(4, 4), ...legs(G(4, -4, 30)) }), b: k([50, 58], 0, { ts: 0.5, hy: 7, an: A(84, 92), af: A(84, 92), ...legs(G(4, -4, 30)) }),
  props: [{ k: 'dbh', at: 'wn', rot: 90 }, { k: 'dbh', at: 'wf', rot: 90 }],
});
def('band_pull_apart', { front: true, a: stand({ an: { a: [88, 88], s: 0.3 }, af: { a: [88, 88], s: 0.3 } }), b: stand({ an: A(86, 92), af: A(86, 92) }), props: [{ k: 'band', at: 'wn', to: 'wf' }] });
def('band_external_rotation', {
  front: true, a: stand({ an: { a: [3, -40], s: [1, 0.35] }, af: { a: [3, -40], s: [1, 0.35] } }), b: stand({ an: A(3, 88), af: A(3, 88) }),
  props: [{ k: 'band', at: 'wn', to: 'wf' }],
});
def('db_shrug', { front: true, a: stand({ an: A(4, 2), af: A(4, 2) }), b: stand({ an: A(4, 2), af: A(4, 2), sh: 4 }), props: [{ k: 'dbh', at: 'wn', rot: 90 }, { k: 'dbh', at: 'wf', rot: 90 }] });
const PALLOF = (s: number, ik: V): Spec['a'] => stand({ an: { ik: [ik[0] - 1, ik[1]], s }, af: { ik: [ik[0] + 1, ik[1]], s }, ln: IK(43, GY, 1, 20), lf: IK(57, GY, 1, 20) });
def('pallof', { front: true, a: PALLOF(1, [50, 41]), b: PALLOF(0.42, [50, 39]), scene: [...TOWER(90), ['pulley', 88, 40]], props: [{ k: 'cable', at: 'w', from: [88, 40] }, { k: 'handle', at: 'w' }] });
def('band_pallof', { front: true, a: PALLOF(1, [50, 41]), b: PALLOF(0.42, [50, 39]), scene: [['r', 89, 20, 3, 72.6]], props: [{ k: 'band', at: 'w', from: [89, 40] }] });

// =============================================================== ROWS (HORIZONTAL PULL)
const BENT = (arms: Partial<Key>) => k([40, 54], 70, { ...feetAt(51, 49), ...arms });
const ROW_A = sym(A(0, 0)), ROW_B = sym(A(-102, 5));
def(['db_bent_row'], { a: BENT(ROW_A), b: BENT(ROW_B), props: db2 });
def(['bb_row', 'bb_row_underhand'], { a: BENT(ROW_A), b: BENT(ROW_B), props: plateH });
const ONE_ARM = (an: Limb): Key => k([46, 53], 90, { ln: IK(40, GY), lf: G(0, -90, -95), an, af: IK(70, 71) });
def('db_row', { a: ONE_ARM(A(0, 0)), b: ONE_ARM(A(-100, 2)), scene: BENCH(24, 56, 74), props: db1 });
def('kb_row', { a: ONE_ARM(A(0, 0)), b: ONE_ARM(A(-100, 2)), scene: BENCH(24, 56, 74), props: [{ k: 'kb', at: 'wn', dy: -2 }] });
const CSR = (arms: Partial<Key>) => k([42, 66], 45, { ...legs(IK(16, GY, 1, 60)), ...arms });
def('chest_supported_row', { a: CSR(ROW_A), b: CSR(sym(A(-95, 0))), scene: [['pad', 51.7, 46.8, 4.5, 30, 45], ['pad', 30, 69, 18, 4], ['r', 40, 73, 3, 19.6], ['r', 60, 66, 3, 26.6]], props: db2 });
def('renegade_row', {
  a: line([68, 64], [10, 86], { ln: IK(12, 87, 1, 15), lf: IK(8, 86, 1, 15), an: IK(68, 87), af: IK(68, 87) }),
  b: line([68, 64.5], [10, 86], { ln: IK(12, 87, 1, 15), lf: IK(8, 86, 1, 15), an: A(-95, 0), af: IK(68, 87) }),
  props: db2,
});
const SEATED_ROW = (t: number, arms: Partial<Key>) => k([34, 74], t, { ...legs(IK(66, 82, 1, 160)), ...arms });
def('seated_row', {
  a: SEATED_ROW(14, sym(A(92, 92))), b: SEATED_ROW(-6, sym(A(-55, 92))),
  scene: [['pad', 20, 77, 28, 3.6], ['r', 30, 80, 3, 12.6], ['r', 70, 70, 4, 22.6], ['pulley', 82, 76]], props: [{ k: 'cable', at: 'wn', from: [82, 76] }, { k: 'handle', at: 'wn' }],
});
def(['band_row'], {
  a: k([34, 87], 12, { ...legs(G(90, 90, 180)), ...sym(A(90, 92)) }), b: k([34, 87], -6, { ...legs(G(90, 90, 180)), ...sym(A(-55, 92)) }),
  props: [{ k: 'band', at: 'an', to: 'wn', dx: 1, dy: -3 }],
});
const INV = (sh: V, hand: V): Key => line(sh, [4, 88], { ...legs(IK(4, 88, 1, 150)), ...sym(IK(hand[0], hand[1])) });
def('table_row', { a: INV([64, 77], [65, 53.5]), b: INV([64, 62], [65, 53.5]), scene: [['r', 50, 51, 42, 3, 0, '#4a4a52'], ['r', 86, 54, 2.4, 38.6]] });
def('smith_inverted_row', { a: INV([64, 77], [65, 53]), b: INV([64, 62], [65, 53]), scene: [...SMITH(65), ['l', 52, 53, 78, 53, 2.4]] });
def('face_pull', {
  a: stand({ ...sym(A(80, 80)), ln: IK(56, GY), lf: IK(44, GY) }), b: stand({ an: { a: [-80, 150], s: [0.55, 1] }, af: { a: [-80, 150], s: [0.55, 1] }, ln: IK(56, GY), lf: IK(44, GY), t: -4 }),
  scene: [...TOWER(88), ['pulley', 86, 20]], props: [{ k: 'cable', at: 'wn', from: [86, 20] }, { k: 'handle', at: 'wn' }],
});
def('band_face_pull', {
  a: stand({ ...sym(A(80, 80)), ln: IK(56, GY), lf: IK(44, GY) }), b: stand({ an: { a: [-80, 150], s: [0.55, 1] }, af: { a: [-80, 150], s: [0.55, 1] }, ln: IK(56, GY), lf: IK(44, GY), t: -4 }),
  scene: [['r', 88, 10, 3, 82.6]], props: [{ k: 'band', at: 'wn', from: [88, 20] }],
});
def('cable_row_single', {
  a: k([48, 54], 18, { ln: IK(60, GY), lf: IK(34, GY, 1, 60), an: A(78, 78), af: A(10, 20) }), b: k([46, 54], 4, { ln: IK(60, GY), lf: IK(34, GY, 1, 60), an: A(-60, 88), af: A(10, 20) }),
  scene: [...TOWER(90), ['pulley', 88, 46]], props: [{ k: 'cable', at: 'wn', from: [88, 46] }, { k: 'handle', at: 'wn' }],
});
def('scap_squeeze', { a: stand(sym(A(10, 92))), b: stand(sym(A(-30, 85))) });

// =============================================================== VERTICAL PULL / HANG
const HANG = (h: V, t: number, rest: Partial<Key> = {}) => k(h, t, { ...sym(IK(52, 7.5)), ...legs(G(14, -45, 40)), ...rest });
const BAR_S = BAR(26, 74, 7);
def(['pullup', 'chinup'], { a: HANG([47, 57], -4), b: HANG([49, 40], 6), scene: BAR_S, floor: false });
def('negative_pullup', { a: HANG([49, 40], 6), b: HANG([47, 57], -4), scene: BAR_S, floor: false, dur: 4200, still: 0 });
def('scap_pullup', { a: HANG([47, 58], -4), b: HANG([47, 55], -2), scene: BAR_S, floor: false, ghost: false });
def('dead_hang', { a: HANG([47, 57], -4), b: HANG([47, 57.5], -4), scene: BAR_S, floor: false, ghost: false });
def('hanging_knee_raise', { a: HANG([47, 57], -4, legs(G(0, 0, 40))), b: HANG([48, 57], -10, legs(G(105, 5, 60))), scene: BAR_S, floor: false });
def('assisted_pullup', {
  a: HANG([47, 57], -4, legs(G(0, -88, -100))), b: HANG([49, 42], 6, legs(G(0, -88, -100))),
  scene: [...BAR_S, ['r', 26, 7, 3, 85.6]], props: [{ k: 'rect', at: 'kn', w: 14, h: 3.4, dx: -5, dy: 3 }], floor: true,
});
const PD_SCENE: Shape[] = [...TOWER(30), ['pulley', 32, 8], ['pad', 40, 67, 18, 3.6], ['r', 46, 70, 3, 22.6], ['pad', 56, 60, 10, 3.4]];
def(['lat_pulldown', 'close_grip_pulldown'], {
  a: k([50, 66], -6, { ...legs(IK(66, GY, 1)), ...sym(A(170, 176)) }), b: k([50, 66], -14, { ...legs(IK(66, GY, 1)), ...sym(A(-150, 172)) }),
  scene: PD_SCENE, props: [{ k: 'cable', at: 'wn', from: [32, 8] }, { k: 'barh', at: 'wn', w: 16, plates: false }],
});
def('band_pulldown', {
  a: stand({ ...sym(A(168, 172)), ln: IK(53, GY), lf: IK(45, GY) }), b: stand({ ...sym(A(-25, 160)), ln: IK(53, GY), lf: IK(45, GY) }),
  props: [{ k: 'band', at: 'wn', from: [60, 2] }],
});
def('straight_arm_pulldown', {
  a: k([44, 53], 22, { ...feetAt(52, 48), ...sym(A(150, 150)) }), b: k([44, 53], 22, { ...feetAt(52, 48), ...sym(A(5, 5)) }),
  scene: [...TOWER(88), ['pulley', 86, 10]], props: [{ k: 'cable', at: 'wn', from: [86, 10] }, { k: 'barh', at: 'wn', w: 10, plates: false }],
});

// =============================================================== ARMS
const CURL_A = sym(A(0, 4)), CURL_B = sym(A(8, 152));
def(['db_curl', 'hammer_curl', 'reverse_curl'], { a: stand(CURL_A), b: stand(CURL_B), props: db2 });
def('bb_curl', { a: stand(CURL_A), b: stand(CURL_B), props: plateH });
def('band_curl', { a: stand(CURL_A), b: stand(CURL_B), props: [{ k: 'band', at: 'an', to: 'wn' }] });
def('cable_curl', { a: stand(sym(A(6, 30))), b: stand(CURL_B), scene: [...TOWER(86), ['pulley', 84, 86]], props: [{ k: 'cable', at: 'wn', from: [84, 86] }, { k: 'barh', at: 'wn', w: 10, plates: false }] });
def('preacher_curl', {
  a: k([42, 70], 18, { ...legs(G(90, 0)), ...sym(A(40, 62)) }), b: k([42, 70], 18, { ...legs(G(90, 0)), ...sym(A(40, 168)) }),
  scene: [['pad', 54.5, 44, 5, 18, -50], ['r', 62, 52, 3, 40.6], ['pad', 30, 73, 20, 4], ['r', 38, 77, 3, 15.6]], props: db1,
});
def('incline_db_curl', {
  a: k([46, 70], -35, { ...legs(G(80, 10)), ...sym(A(0, 2)) }), b: k([46, 70], -35, { ...legs(G(80, 10)), ...sym(A(2, 150)) }),
  scene: [['pad', 32.6, 49.7, 4.5, 28, -35], ['pad', 38, 73, 18, 4], ['r', 44, 77, 3, 15.6]], props: db2,
});
def('concentration_curl', {
  a: k([40, 70], 38, { ...legs(G(88, 2)), an: A(14, 8), af: A(70, 60) }), b: k([40, 70], 38, { ...legs(G(88, 2)), an: A(14, 165), af: A(70, 60) }),
  scene: BENCH(18, 30, 73.5), props: db1,
});
const PD_TOWER: Shape[] = [...TOWER(82), ['pulley', 79, 8]];
def('cable_pushdown', { a: stand({ t: 8, ...sym(A(6, 140)) }), b: stand({ t: 8, ...sym(A(6, 4)) }), scene: PD_TOWER, props: [{ k: 'cable', at: 'wn', from: [79, 8] }, { k: 'barh', at: 'wn', w: 10, plates: false }] });
def('band_pushdown', { a: stand({ t: 8, ...sym(A(6, 140)) }), b: stand({ t: 8, ...sym(A(6, 4)) }), scene: [['r', 80, 4, 3, 88.6]], props: [{ k: 'band', at: 'wn', from: [80, 8] }] });
def('db_overhead_ext', { a: stand(sym(A(172, -12))), b: stand(sym(A(172, 176))), props: [{ k: 'db', at: 'wn' }] });
def('cable_overhead_ext', {
  a: k([50, 53], 26, { ln: IK(62, GY), lf: IK(38, GY, 1, 60), ...sym(A(150, 10)) }), b: k([50, 53], 26, { ln: IK(62, GY), lf: IK(38, GY, 1, 60), ...sym(A(150, 146)) }),
  scene: [...TOWER(14), ['pulley', 16, 80]], props: [{ k: 'cable', at: 'wn', from: [16, 80] }, { k: 'handle', at: 'wn' }],
});
def('db_kickback', { a: k([40, 55], 75, { ...feetAt(51, 49), ...sym(A(-100, 2)) }), b: k([40, 55], 75, { ...feetAt(51, 49), ...sym(A(-100, -98)) }), props: db2 });
def('skull_crusher', { a: SUP_B(sym(A(165, 168))), b: SUP_B(sym(A(160, 62))), scene: BENCH(24, 52, 74), props: db2 });
def('bench_dip', {
  a: k([51, 63], -2, { ...legs(IK(80, GY, 1, 100)), ...sym(IK(49, 64.5)) }), b: k([53, 75], 2, { ...legs(IK(80, GY, 1, 100)), ...sym(IK(49, 64.5)) }),
  scene: CHAIR(28, 66), still: 1,
});
def('dips', {
  a: k([50, 45], 2, { ...sym(IK(52, 47)), ...legs(G(10, -50, 20)) }), b: k([47, 56], 16, { ...sym(IK(52, 47)), ...legs(G(10, -50, 20)) }),
  scene: [['l', 40, 47.5, 64, 47.5, 2.6], ['r', 60, 47, 3, 45.6]],
});

// =============================================================== CALVES / SHINS
def('calf_raise', { a: stand(), b: stand({ h: [50, 47.5], ...legs(G(0, 0, 25)) }) });
def('single_leg_calf', {
  a: stand({ lf: G(-10, -80, -40), an: IK(72, 34), af: IK(72, 34) }), b: stand({ h: [50, 47.5], ln: G(0, 0, 25), lf: G(-10, -80, -40), an: IK(72, 34), af: IK(72, 34) }),
  scene: [['wall', 74]],
});
const STEPC = (heelUp: boolean): Key => {
  const toe: V = [52, 82];
  const f = heelUp ? 40 : 120;
  const ank: V = [toe[0] - 6.2 * Math.sin((f * Math.PI) / 180), toe[1] - 6.2 * Math.cos((f * Math.PI) / 180)];
  return stand({ h: [ank[0], ank[1] - 38], ...legs(G(0, 0, f)), an: IK(74, 36), af: IK(74, 36) });
};
def('step_calf_raise', { a: STEPC(false), b: STEPC(true), scene: [...BOX(46, 28, 10), ['wall', 76]] });
def('calf_machine', { a: STEPC(false), b: STEPC(true), scene: [...BOX(46, 22, 10), ['r', 68, 8, 3, 84.6]], props: [{ k: 'rect', at: 'sh', w: 10, h: 3.4, dy: -3 }] });
def('seated_calf_db', {
  a: k([36, 70], 0, { ...legs(G(90, 0, 92)), ...sym(A(40, 80)) }), b: k([36, 70], 0, { ...legs(G(101, 0, 28)), ...sym(A(40, 80)) }),
  scene: CHAIR(20, 72.5), props: [{ k: 'db', at: 'kn', dy: -4 }],
});
def('tibialis_raise', { a: k([37, 54], -12, { ...legs(IK(51, GY, 1, 92)), ...sym(A(5, 5)) }), b: k([37, 54], -12, { ...legs(IK(51, GY, 1, 150)), ...sym(A(5, 5)) }), scene: [['wall', 26]] });

// =============================================================== CORE
const FPLANK = (sh: V, rest: Partial<Key> = {}) => line(sh, [10, 86], { ...legs(IK(10, 86, 1, 15)), ...sym(A(0, 90)), ...rest });
def('plank', { a: FPLANK([68, 75]), b: FPLANK([68, 74.4]), ghost: false });
def('plank_knees', { a: kneel([68, 75], [30, 88], sym(A(0, 90))), b: kneel([68, 74.4], [30, 88], sym(A(0, 90))), ghost: false });
def('plank_high', { a: PU_TOP(), b: PU_TOP({ h: [46, 74.2] }), ghost: false });
def('plank_leg_lift', { a: FPLANK([68, 75]), b: FPLANK([68, 75], { lf: G(-96, -96, -80) }) });
def('plank_shoulder_tap', { a: PU_TOP(), b: PU_TOP({ an: A(40, 150) }) });
def('mountain_climber', {
  a: PU_TOP({ ln: G(52, -40, 20), lf: IK(10, 86, 1, 15) }), b: PU_TOP({ lf: G(52, -40, 20), ln: IK(10, 86, 1, 15) }), dur: 1400,
});
const SPL = (lift: number, knees = false): Key => k([46, 77 - lift], 68 + lift, {
  af: { a: [70, 160], s: [1, 0.45] }, an: A(110, 110),
  ...(knees ? legs({ a: [0, 0, 0], s: [1, 0.4] }) : legs(G(0, 0, 0))),
});
def('side_plank', { flat: true, a: SPL(0), b: SPL(3) });
def('side_plank_knee', { flat: true, a: { ...SPL(0, true), h: [52, 80] }, b: { ...SPL(3, true), h: [52, 77] } });
const SUP_R = (rest: Partial<Key> = {}) => k([40, 87.6], 90, { ...legs(IK(28, GY, -1)), ...sym(A(-90, -90)), ...rest });
const TABLETOP = legs(G(180, -90, -90));
def('dead_bug', { a: SUP_R({ ...TABLETOP, ...sym(A(180, 180)) }), b: SUP_R({ ...TABLETOP, ...sym(A(180, 180)), an: A(95, 95), lf: G(-96, -96, -100) }) });
def('hollow_hold', { a: SUP_R({ h: [40, 86.6], t: 74, ...legs(G(-100, -100, -110)), ...sym(A(100, 100)) }), b: SUP_R({ h: [40, 86.6], t: 72, ...legs(G(-102, -102, -110)), ...sym(A(102, 102)) }), ghost: false });
const HANDS_BEHIND_HEAD_SUP = sym(A(150, 70));
def('crunch', { a: SUP_R(sym(A(-96, -96))), b: SUP_R({ t: 66, c: -3, ...sym(A(-110, -112)) }) });
def('reverse_crunch', { a: SUP_R(TABLETOP), b: SUP_R({ h: [42, 84], t: 98, ...legs(G(142, -120, -100)) }) });
def('bicycle_crunch', {
  a: SUP_R({ t: 70, ...HANDS_BEHIND_HEAD_SUP, ln: G(150, -100, -90), lf: G(-100, -100, -110) }),
  b: SUP_R({ t: 70, ...HANDS_BEHIND_HEAD_SUP, lf: G(150, -100, -90), ln: G(-100, -100, -110) }), dur: 1800,
});
def('heel_taps', { a: SUP_R({ t: 74, ...sym(A(-92, -92)) }), b: SUP_R({ t: 72, ...sym(A(-80, -80)) }) });
def('lying_leg_raise', { a: SUP_R(legs(G(-93, -93, -100))), b: SUP_R(legs(G(-178, -178, -100))) });
def('flutter_kicks', { a: SUP_R({ t: 82, ln: G(-98, -98, -110), lf: G(-110, -110, -120) }), b: SUP_R({ t: 82, lf: G(-98, -98, -110), ln: G(-110, -110, -120) }), dur: 1200 });
def(['knees_to_chest'], { a: SUP_R({ ...legs(G(140, -110, -100)), ...sym(A(150, 120)) }), b: SUP_R({ ...legs(G(158, -100, -100)), ...sym(A(162, 110)) }) });
def('seated_knee_tuck', {
  a: k([40, 86], -35, { ...legs(G(100, 100, 150)), ...sym(IK(22, 89.5)) }), b: k([40, 86], -28, { ...legs(G(145, 70, 120)), ...sym(IK(22, 89.5)) }),
});
def('bear_hold', { a: hs([44, 67], [66, 64.5], { ...legs(G(2, -75, -60)), ...sym(IK(66, 89.5)) }), b: hs([44, 66.4], [66, 64.5], { ...legs(G(3, -75, -60)), ...sym(IK(66, 89.5)) }), ghost: false });
const RT = (side: number): Key => k([50, 84], side * 16, {
  ln: { a: [150, 20, 40], s: [0.7, 0.9] }, lf: { a: [150, 20, 40], s: [0.7, 0.9] },
  an: IK(50 + side * 16 - 1, 76), af: IK(50 + side * 16 + 1, 76),
});
def('russian_twist', { front: true, a: RT(-1), b: RT(1), props: [{ k: 'dbh', at: 'w' }] });
def('cable_woodchop', {
  front: true,
  a: k([50, 56], 8, { ln: IK(40, GY, 1, 20), lf: IK(60, GY, 1, 20), an: IK(69, 17), af: IK(71, 17) }),
  b: k([50, 60], -10, { ln: IK(40, GY, 1, 20), lf: IK(60, GY, 1, 20), an: IK(33, 72), af: IK(35, 72) }),
  scene: [...TOWER(90), ['pulley', 88, 10]], props: [{ k: 'cable', at: 'w', from: [88, 10] }, { k: 'handle', at: 'w' }],
});
def('cable_crunch', {
  a: k([44, 70], 8, { ...legs(G(0, -90, -95)), an: A(155, -40), af: A(155, -40) }), b: k([42, 70], 88, { c: 4, hd: 20, ...legs(G(0, -90, -95)), an: A(100, -80), af: A(100, -80) }),
  scene: [...TOWER(86), ['pulley', 84, 8]], props: [{ k: 'cable', at: 'wn', from: [84, 8] }, { k: 'handle', at: 'wn' }],
});
def('crunch_machine', {
  a: SEATED(sym(A(20, 160)), -4), b: SEATED({ ...sym(A(55, 190)), c: 3, hd: 8 }, 34),
  scene: [...SEAT_SCENE], props: [{ k: 'rect', at: 'chest', w: 3.4, h: 10, dx: 6, rot: 0 }],
});

// =============================================================== CARRIES / WALKING / BALANCE
const STEP_A: Partial<Key> = { ln: G(24, 6, 100), lf: G(-18, -38, 40), an: A(-22, -10), af: A(24, 40) };
const STEP_B: Partial<Key> = { lf: G(24, 6, 100), ln: G(-18, -38, 40), af: A(-22, -10), an: A(24, 40) };
const walkK = (h: V, side: Partial<Key>, extra: Partial<Key> = {}) => k(h, 4, { ...side, ...extra });
def(['walk', 'backward_walk'], { a: walkK([50, 53.5], STEP_A), b: walkK([50, 53.5], STEP_B), dur: 1500 });
def('march', {
  a: stand({ ln: G(80, 0), lf: G(0, 0), an: A(-30, -10), af: A(40, 70) }), b: stand({ lf: G(80, 0), ln: G(0, 0), af: A(-30, -10), an: A(40, 70) }), dur: 1400,
});
def('farmer_carry', { a: walkK([50, 53.5], { ...STEP_A, ...sym(A(2, 2)) }), b: walkK([50, 53.5], { ...STEP_B, ...sym(A(2, 2)) }), props: db2, dur: 1600 });
def('suitcase_carry', {
  front: true, a: stand({ an: A(5, 2), af: A(10, 10), ln: G(0, 0, 30), lf: G(6, -12, 30) }), b: stand({ an: A(5, 2), af: A(10, 10), lf: G(0, 0, 30), ln: G(6, -12, 30) }),
  props: [{ k: 'dbh', at: 'wn', rot: 90 }], dur: 1600,
});
def('heel_toe_walk', { a: walkK([50, 52.5], { ln: G(12, 4, 100), lf: G(-10, -20, 60), ...sym(A(50, 55)) }), b: walkK([50, 52.5], { lf: G(12, 4, 100), ln: G(-10, -20, 60), ...sym(A(50, 55)) }), dur: 2000 });
def('toe_walk', { a: walkK([50, 49], { ...STEP_A, ln: G(20, 6, 40), lf: G(-16, -30, 30) }), b: walkK([50, 49], { ...STEP_B, lf: G(20, 6, 40), ln: G(-16, -30, 30) }), dur: 1500 });
def('sideways_walk', {
  front: true, a: stand({ ln: IK(45, GY, 1, 20), lf: IK(55, GY, 1, 20), ...HANDS_HIPS }), b: stand({ h: [55, 52.5], ln: IK(46, GY, 1, 20), lf: IK(66, GY, 1, 20), ...HANDS_HIPS }), dur: 1800,
});
def('tandem_stand', { a: k([51, 52], 0, { ln: IK(55, GY), lf: IK(48, GY), ...sym(A(28, 30)) }), b: k([51, 52], -2, { ln: IK(55, GY), lf: IK(48, GY), ...sym(A(32, 34)) }), ghost: false });
def('single_leg_stand', { a: stand({ lf: G(50, -10), ...sym(A(18, 18)) }), b: stand({ lf: G(52, -8), ...sym(A(22, 22)), t: 1 }), ghost: false });
def(['supported_balance'], { a: stand({ lf: G(-5, -70, -40), an: IK(70, 52), af: A(6, 6) }), b: stand({ lf: G(-5, -78, -40), an: IK(70, 52), af: A(6, 6) }), scene: CHAIR(64, 66), ghost: false });
def('weight_shift', {
  front: true, a: k([43, 54], 0, { ln: IK(38, GY, 1, 20), lf: IK(62, GY, 1, 20), ...HANDS_HIPS }), b: k([57, 54], 0, { ln: IK(38, GY, 1, 20), lf: IK(62, GY, 1, 20), ...HANDS_HIPS }),
});
def('star_reach', {
  front: true, a: k([46, 56], 0, { ln: IK(45, GY, 1, 20), lf: G(30, 30, 60), an: A(70, 75), af: A(70, 75) }), b: k([46, 56], 0, { ln: IK(45, GY, 1, 20), lf: { a: [12, 12, 30], s: [0.85, 0.85] }, an: A(70, 75), af: A(70, 75) }),
});
def('bird_dog', { a: QUAD(), b: QUAD({ an: A(95, 95), lf: G(-92, -92, -100) }) });

// =============================================================== MOBILITY / ROUTINE MOVES
def('catcow', { a: QUAD({ c: 6, hd: -22 }), b: QUAD({ c: -6, hd: 26 }), dur: 4200 });
def('childpose', { a: hs([34, 77], [56, 84], { ...legs(G(53, -90, -95)), ...sym(A(80, 92)), hd: 10 }), b: hs([34, 76], [56, 83.5], { ...legs(G(53, -90, -95)), ...sym(A(80, 92)), hd: 10 }), ghost: false, dur: 5000 });
def('breathing', { a: k([40, 70], 0, { ...legs(G(90, 0)), an: A(20, 100), af: A(20, 100) }), b: k([40, 70], 0, { ...legs(G(90, 0)), an: A(20, 100), af: A(20, 100), sh: 1.2 }), scene: CHAIR(28, 72.5), ghost: false, dur: 6000 });
def('chin_tuck', { a: stand({ hx: 1.8 }), b: stand({ hx: -2.4 }), ghost: false });
def('seated_march', { a: k([40, 70], 0, { ln: G(115, 20), lf: G(90, 0), ...sym(A(20, 60)) }), b: k([40, 70], 0, { lf: G(115, 20), ln: G(90, 0), ...sym(A(20, 60)) }), scene: CHAIR(28, 72.5), dur: 1600 });
def('seated_knee_ext', { a: k([40, 70], 0, { ln: G(90, 0), lf: G(90, 0), ...sym(A(20, 60)) }), b: k([40, 70], 0, { ln: G(90, 86, 170), lf: G(90, 0), ...sym(A(20, 60)) }), scene: CHAIR(28, 72.5) });
def('seated_twist', {
  front: true, a: k([50, 70], 0, { hx: -2.2, an: IK(53, 41), af: IK(45, 41), ...legs({ a: [80, 0, 30], s: [0.2, 1] }) }), b: k([50, 70], 0, { hx: 2.2, an: IK(55, 41), af: IK(47, 41), ...legs({ a: [80, 0, 30], s: [0.2, 1] }) }),
  scene: [['pad', 36, 71, 28, 3.6], ['r', 38, 74, 2.4, 18.6], ['r', 59.6, 74, 2.4, 18.6]],
});
def('hip_flexor_stretch', {
  a: k([44, 70], -2, { ln: IK(63, GY), lf: G(-8, -90, -95), ...HANDS_HIPS }), b: k([49, 71], -4, { ln: IK(63, GY), lf: G(-28, -90, -95), ...HANDS_HIPS }), dur: 4000,
});
def('pendulum', { a: k([38, 53], 62, { ...feetAt(46, 40), an: A(-12, -12), af: IK(72, 56) }), b: k([38, 53], 62, { ...feetAt(46, 40), an: A(14, 14), af: IK(72, 56) }), scene: TABLE(66, 26, 56), dur: 2400 });

// =============================================================== FALLBACKS for generic Anim keys
const ALIAS: Record<string, string> = {
  squat: 'bw_squat', hinge: 'good_morning_bw', lunge: 'reverse_lunge', bench: 'db_bench', ohp: 'db_ohp', pulldown: 'lat_pulldown',
  row: 'seated_row', bentrow: 'db_bent_row', deadbug: 'dead_bug', bridge: 'glute_bridge', curl: 'db_curl', pushdown: 'cable_pushdown',
  raise: 'lateral_raise', calf: 'calf_raise', legext: 'leg_extension', legcurl: 'leg_curl', dip: 'bench_dip', birddog: 'bird_dog',
  balance: 'supported_balance', fly: 'cable_fly', legpress: 'leg_press', stepup: 'step_up', sideplank: 'side_plank', twist: 'seated_twist',
};
for (const [k2, v] of Object.entries(ALIAS)) if (!FIGS[k2]) FIGS[k2] = FIGS[v];
