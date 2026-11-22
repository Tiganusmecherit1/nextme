import { useEffect, useId, useRef, useState } from 'react';
import type { Anim } from '../data/exercises';
import { FIGS, type Key, type Limb, type Prop, type Shape, type Spec, type V } from './figures';

// ---------------------------------------------------------------------------
// Exercise figure renderer.
// Poses are described with joint angles (forward kinematics) or with a fixed
// hand/foot target (two-bone inverse kinematics), so bones keep their length
// through the whole animation and planted hands/feet do not slide.
// Angle convention (side view, figure faces right): 0° = pointing down,
// 90° = pointing forward, 180° = pointing up, -90° = pointing backwards.
// ---------------------------------------------------------------------------

const L = { torso: 23, neck: 3.2, head: 5.4, ua: 13, fa: 12.5, th: 19, sh: 19, ft: 6.2 };
const SW = 6.6; // front view: half shoulder width
const HW = 4.4; // front view: half hip width

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dir = (a: number): V => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p: V, a: number, len: number, mirror = 1): V => {
  const d = dir(a);
  return [p[0] + d[0] * len * mirror, p[1] + d[1] * len];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const angOf = (from: V, to: V, mirror = 1) => deg(Math.atan2((to[0] - from[0]) * mirror, to[1] - from[1]));
const near = (a: number, ref: number) => {
  while (a - ref > 180) a -= 360;
  while (a - ref < -180) a += 360;
  return a;
};

/** Two-bone IK: returns the absolute angles of both bones reaching `target` from `root`. */
function ik(root: V, target: V, l1: number, l2: number, bend: number, mirror: number): [number, number] {
  const dx = (target[0] - root[0]) * mirror;
  const dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.001);
  const base = Math.atan2(dx, dy); // angle in our convention (0 = down)
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const a1 = base + bend * A;
  const j: V = [Math.sin(a1) * l1, Math.cos(a1) * l1];
  const a2 = Math.atan2(dx - j[0], dy - j[1]);
  return [deg(a1), deg(a2)];
}

interface Body {
  H: V; S: V; head: V; M?: V;
  an: V[]; af: V[]; ln: V[]; lf: V[]; // [root, mid, end, (toe)]
  front: boolean;
}

function roots(k: Key, front: boolean) {
  const S0 = add(k.h, 180 - k.t, L.torso * (k.ts ?? 1));
  const S: V = [S0[0], S0[1] - (k.sh ?? 0)];
  if (!front) return { S, sN: S, sF: S, hN: k.h, hF: k.h };
  // front view: torso lean rotates the shoulder line
  const ox = Math.cos(rad(k.t)), oy = Math.sin(rad(k.t));
  return {
    S,
    sN: [S[0] - SW * ox, S[1] + SW * oy] as V, sF: [S[0] + SW * ox, S[1] - SW * oy] as V,
    hN: [k.h[0] - HW, k.h[1]] as V, hF: [k.h[0] + HW, k.h[1]] as V,
  };
}

function limbAngles(l: Limb | undefined, root: V, l1: number, l2: number, defBend: number, mirror: number): number[] | null {
  if (!l) return null;
  if (l.a) return l.a.slice();
  if (l.ik) {
    const r = ik(root, l.ik, l1, l2, (l.bend ?? defBend), mirror);
    return [r[0], r[1], l.f ?? 92];
  }
  return null;
}

function limb(kA: Key, kB: Key, name: 'an' | 'af' | 'ln' | 'lf', t: number, rootA: V, rootB: V, root: V, front: boolean): V[] {
  const isArm = name[0] === 'a';
  const l1 = isArm ? L.ua : L.th, l2 = isArm ? L.fa : L.sh;
  const fb = name === 'af' ? 'an' : name === 'lf' ? 'ln' : null;
  const A = kA[name] ?? (fb ? kA[fb] : undefined);
  const B = kB[name] ?? (fb ? kB[fb] : undefined) ?? A;
  const mirror = front && (name === 'an' || name === 'ln') ? -1 : 1;
  const defBend = isArm ? (front ? -1 : -1) : front ? 1 : 1;
  const sc = (x?: number | number[]): [number, number] => (x === undefined ? [1, 1] : typeof x === 'number' ? [x, x] : [x[0], x[1]]);
  const sa = sc(A?.s), sb = sc(B?.s ?? A?.s);
  const s1 = lerp(sa[0], sb[0], t), s2 = lerp(sa[1], sb[1], t);
  let ang: number[];
  if (A?.ik && B?.ik) {
    const tgt = lerpV(A.ik, B.ik, t);
    const bend = A.bend ?? defBend;
    const r = ik(root, tgt, l1 * s1, l2 * s2, bend, mirror);
    ang = [r[0], r[1], lerp(A.f ?? 92, B.f ?? 92, t)];
  } else {
    const aa = limbAngles(A, rootA, l1, l2, defBend, mirror) ?? (isArm ? [0, 0] : [0, 0, 92]);
    const bb = limbAngles(B, rootB, l1, l2, defBend, mirror) ?? aa;
    ang = aa.map((v, i) => lerp(v, near(bb[i] ?? v, v), t));
  }
  const p1 = add(root, ang[0], l1 * s1, mirror);
  const p2 = add(p1, ang[1], l2 * s2, mirror);
  if (isArm) return [root, p1, p2];
  const toe = add(p2, ang[2] ?? 92, front ? 3.4 : L.ft, mirror);
  return [root, p1, p2, toe];
}

function pose(spec: Spec, t: number): Body {
  if (spec.flat) {
    // top-down / rotated front view: build an upright front figure, then rotate it about the hip
    const rot = rad(lerp(spec.a.t, spec.b.t, t));
    const up = pose({ ...spec, flat: false, front: true, a: { ...spec.a, t: 0 }, b: { ...spec.b, t: 0 } }, t);
    const c = Math.cos(rot), s = Math.sin(rot), o = up.H;
    const R = (p: V): V => { const x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; };
    return { ...up, S: R(up.S), head: R(up.head), an: up.an.map(R), af: up.af.map(R), ln: up.ln.map(R), lf: up.lf.map(R) };
  }
  const { a, b } = spec;
  const front = !!spec.front;
  const k: Key = {
    h: lerpV(a.h, b.h, t), t: lerp(a.t, b.t, t), c: lerp(a.c ?? 0, b.c ?? 0, t), hd: lerp(a.hd ?? 0, b.hd ?? 0, t),
    ts: lerp(a.ts ?? 1, b.ts ?? 1, t), sh: lerp(a.sh ?? 0, b.sh ?? 0, t), hx: lerp(a.hx ?? 0, b.hx ?? 0, t), hy: lerp(a.hy ?? 0, b.hy ?? 0, t),
  };
  const rA = roots(a, front), rB = roots(b, front), r = roots(k, front);
  const neckDir = 180 - k.t - (front ? 0 : k.hd!);
  const Sh: V = [r.S[0], r.S[1] + k.sh!]; // the head does not rise with a shrug
  const neck = add(Sh, 180 - k.t, L.neck * 0.6);
  const h0 = add(neck, neckDir, L.neck * 0.4 + L.head);
  const head: V = [h0[0] + k.hx!, h0[1] + k.hy!];
  let M: V | undefined;
  if (k.c) {
    const mid = lerpV(k.h, r.S, 0.5);
    const n = dir(90 - k.t); // perpendicular, pointing to the figure's front/belly side
    M = [mid[0] + n[0] * k.c, mid[1] + n[1] * k.c];
  }
  return {
    H: k.h, S: r.S, head, M, front,
    an: limb(a, b, 'an', t, rA.sN, rB.sN, r.sN, front),
    af: limb(a, b, 'af', t, rA.sF, rB.sF, r.sF, front),
    ln: limb(a, b, 'ln', t, rA.hN, rB.hN, r.hN, front),
    lf: limb(a, b, 'lf', t, rA.hF, rB.hF, r.hF, front),
  };
}

// ---------------------------------------------------------------------------
const f1 = (n: number) => Math.round(n * 10) / 10;
const pts = (ps: V[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join('');

const STEEL = '#c7c9d1';
const STEEL_D = '#7c7f8a';
const FRAME = '#3a3a40';
const FRAME_L = '#55555d';
const PAD = '#4a4a52';

function shape(s: Shape, i: number) {
  const [k, ...v] = s;
  switch (k) {
    case 'r': { // rect x y w h [rot] [fill]
      const [x, y, w, h, rot = 0] = v as number[];
      const fill = (s as any)[6] ?? FRAME;
      return <rect key={i} x={x} y={y} width={w} height={h} rx={Math.min(1.6, h / 2, w / 2)} fill={fill} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined} />;
    }
    case 'pad': { // pad x y w h [rot]
      const [x, y, w, h, rot = 0] = v as number[];
      return <rect key={i} x={x} y={y} width={w} height={h} rx={Math.min(2.4, h / 2)} fill={PAD} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined} />;
    }
    case 'l': { // line x1 y1 x2 y2 [w]
      const [x1, y1, x2, y2, w = 2] = v as number[];
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={FRAME_L} strokeWidth={w} strokeLinecap="round" />;
    }
    case 'c': { // circle x y r
      const [x, y, r] = v as number[];
      return <circle key={i} cx={x} cy={y} r={r} fill={FRAME_L} />;
    }
    case 'wall': {
      const [x] = v as number[];
      return <rect key={i} x={x} y={4} width={3} height={88} fill={FRAME} />;
    }
    case 'pulley': {
      const [x, y] = v as number[];
      return <g key={i}><circle cx={x} cy={y} r={2.2} fill={FRAME_L} /><circle cx={x} cy={y} r={0.8} fill={STEEL_D} /></g>;
    }
    default:
      return null;
  }
}

function joint(b: Body, at: Prop['at']): V {
  switch (at) {
    case 'wn': return b.an[2];
    case 'wf': return b.af[2];
    case 'w': return lerpV(b.an[2], b.af[2], 0.5);
    case 'en': return b.an[1];
    case 'an': return b.ln[2];
    case 'af': return b.lf[2];
    case 'kn': return b.ln[1];
    case 'kf': return b.lf[1];
    case 'k': return lerpV(b.ln[1], b.lf[1], 0.5);
    case 'hip': return b.H;
    case 'sh': return b.S;
    case 'chest': return lerpV(b.S, b.H, 0.22);
    case 'head': return b.head;
    case 'tn': return b.ln[3];
    default: return b.H;
  }
}

function prop(p: Prop, b: Body, i: number, uid: string) {
  const j0 = joint(b, p.at);
  const j: V = [j0[0] + (p.dx ?? 0), j0[1] + (p.dy ?? 0)];
  switch (p.k) {
    case 'db': // dumbbell seen end-on (side view)
      return <g key={i}><circle cx={j[0]} cy={j[1]} r={3.9} fill={STEEL_D} /><circle cx={j[0]} cy={j[1]} r={2.5} fill={STEEL} /></g>;
    case 'dbh': { // dumbbell seen along its length (front view / neutral grip)
      const rot = p.rot ?? 0;
      return <g key={i} transform={`rotate(${rot} ${j[0]} ${j[1]})`}><rect x={j[0] - 5} y={j[1] - 0.8} width={10} height={1.6} fill={STEEL_D} /><rect x={j[0] - 6.4} y={j[1] - 2.8} width={2.6} height={5.6} rx={0.8} fill={STEEL} /><rect x={j[0] + 3.8} y={j[1] - 2.8} width={2.6} height={5.6} rx={0.8} fill={STEEL} /></g>;
    }
    case 'kb':
      return <g key={i}><path d={`M${j[0] - 2.4} ${j[1] + 2.6}Q${j[0]} ${j[1] - 2.6} ${j[0] + 2.4} ${j[1] + 2.6}`} stroke={STEEL} strokeWidth={1.4} fill="none" /><circle cx={j[0]} cy={j[1] + 5.6} r={4} fill={STEEL} /><circle cx={j[0] - 1.2} cy={j[1] + 4.6} r={1.1} fill="#fff" fillOpacity={0.35} /></g>;
    case 'plate': // barbell seen end-on: plate + sleeve
      return <g key={i}><circle cx={j[0]} cy={j[1]} r={p.r ?? 7.2} fill={STEEL_D} fillOpacity={0.9} /><circle cx={j[0]} cy={j[1]} r={(p.r ?? 7.2) - 1.6} fill="none" stroke={STEEL} strokeWidth={0.8} strokeOpacity={0.6} /><circle cx={j[0]} cy={j[1]} r={1.3} fill={STEEL} /></g>;
    case 'barh': { // bar/handle seen along its length (front view)
      const w = p.w ?? 34;
      return <g key={i}><rect x={j[0] - w / 2} y={j[1] - 0.8} width={w} height={1.6} fill={STEEL} />{p.plates !== false && <><rect x={j[0] - w / 2 - 1} y={j[1] - 6} width={3} height={12} rx={1} fill={STEEL_D} /><rect x={j[0] + w / 2 - 2} y={j[1] - 6} width={3} height={12} rx={1} fill={STEEL_D} /></>}</g>;
    }
    case 'rect': { // machine part that moves with a joint (back pad, carriage)
      const w = p.w ?? 5, h = p.h ?? 20, rot = p.rot ?? 0;
      return <rect key={i} x={j[0] - w / 2} y={j[1] - h / 2} width={w} height={h} rx={Math.min(2.2, w / 2)} fill={PAD} transform={`rotate(${rot} ${j[0]} ${j[1]})`} />;
    }
    case 'handle': // small cable/machine handle at the hand
      return <circle key={i} cx={j[0]} cy={j[1]} r={1.6} fill={STEEL} />;
    case 'pad': // roller pad attached to a joint (leg extension / curl)
      return <circle key={i} cx={j[0]} cy={j[1]} r={p.r ?? 3.2} fill={PAD} stroke={FRAME_L} strokeWidth={0.8} />;
    case 'sled': { // leg press foot plate
      const rot = p.rot ?? 0;
      return <rect key={i} x={j[0] - 1.6} y={j[1] - 10} width={3.2} height={20} rx={1.2} fill={FRAME_L} transform={`rotate(${rot} ${j[0]} ${j[1]})`} />;
    }
    case 'cable': {
      const [x, y] = p.from!;
      return <line key={i} x1={x} y1={y} x2={j[0]} y2={j[1]} stroke={STEEL} strokeOpacity={0.7} strokeWidth={0.8} />;
    }
    case 'band': {
      if (p.from) return <line key={i} x1={p.from[0]} y1={p.from[1]} x2={j[0]} y2={j[1]} stroke={`url(#band${uid})`} strokeWidth={1.8} strokeLinecap="round" />;
      const j2 = joint(b, p.to!);
      return <line key={i} x1={j[0]} y1={j[1]} x2={j2[0]} y2={j2[1]} stroke={`url(#band${uid})`} strokeWidth={1.8} strokeLinecap="round" />;
    }
    case 'loop': { // mini band around both knees / ankles
      const j2 = joint(b, p.to!);
      const c = lerpV(j, j2, 0.5);
      const rx = Math.max(2.2, Math.hypot(j2[0] - j[0], j2[1] - j[1]) / 2 + 1.6);
      const ang = deg(Math.atan2(j2[1] - j[1], j2[0] - j[0]));
      return <ellipse key={i} cx={c[0]} cy={c[1]} rx={rx} ry={2.2} fill="none" stroke={`url(#band${uid})`} strokeWidth={1.4} transform={`rotate(${ang} ${c[0]} ${c[1]})`} />;
    }
    default:
      return null;
  }
}

export function Figure({ id, anim, size = 160, playing = true, T }: {
  id?: string; anim: Anim | string; prop?: unknown; size?: number; playing?: boolean; T?: number;
}) {
  const spec: Spec = (id && FIGS[id]) || FIGS[anim] || FIGS.squat;
  const uid = useId().replace(/:/g, '');
  const [t, setT] = useState(spec.still ?? 1);
  const raf = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!playing || reduce) { setT(spec.still ?? 1); return; }
    const start = performance.now();
    const period = spec.dur ?? 2800;
    const tick = (now: number) => {
      const ph = ((now - start) / period) * Math.PI * 2;
      setT((1 - Math.cos(ph)) / 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [spec, playing]);

  const tt = T ?? t;
  const b = pose(spec, tt);
  const props = spec.props ?? [];
  const back = props.filter((p) => p.z === 'back' || p.k === 'cable' || (p.k === 'band' && !!p.from));
  const farP = props.filter((p) => !back.includes(p) && (p.at === 'wf' || p.at === 'af' || p.at === 'kf'));
  const frontP = props.filter((p) => !back.includes(p) && !farP.includes(p));
  const torso = b.front ? null : b.M ? `M${f1(b.H[0])} ${f1(b.H[1])}Q${f1(b.M[0])} ${f1(b.M[1])} ${f1(b.S[0])} ${f1(b.S[1])}` : pts([b.H, b.S]);
  const lowest = Math.max(b.ln[3][1], b.lf[3][1], b.ln[2][1], b.lf[2][1]);
  const cx = (b.H[0] + b.S[0]) / 2;
  const showGhost = T === undefined && !playing && size >= 120 && spec.ghost !== false;
  const g = showGhost ? pose(spec, 1 - (spec.still ?? 1)) : null;
  const farCol = '#6a4cc9';

  const limbs = (body: Body, which: 'an' | 'af' | 'ln' | 'lf', stroke: string, op = 1) => {
    const ps = body[which];
    const isArm = which[0] === 'a';
    return (
      <g stroke={stroke} strokeOpacity={op} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={pts([ps[0], ps[1]])} strokeWidth={isArm ? 5.4 : 7.2} />
        <path d={pts([ps[1], ps[2]])} strokeWidth={isArm ? 4.4 : 5.8} />
        {!isArm && <path d={pts([ps[2], ps[3]])} strokeWidth={3.6} />}
      </g>
    );
  };

  // small thumbnails: zoom in on the figure (framing is fixed per exercise, not per frame)
  let vb = '0 0 100 100';
  if (size < 110) {
    const ps: V[] = [];
    for (const ph of [0, 1]) { const q = pose(spec, ph); ps.push(q.head, q.S, q.H, ...q.an, ...q.af, ...q.ln, ...q.lf); }
    const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
    const x0 = Math.min(...xs) - 6, x1 = Math.max(...xs) + 6, y0 = Math.min(...ys) - 7, y1 = Math.max(...ys, 92.6) + 3;
    const side = Math.min(100, Math.max(56, x1 - x0, y1 - y0));
    const cxv = Math.min(100 - side / 2, Math.max(side / 2, (x0 + x1) / 2));
    const cyv = Math.min(100 - side / 2, Math.max(side / 2, (y0 + y1) / 2));
    vb = `${f1(cxv - side / 2)} ${f1(cyv - side / 2)} ${f1(side)} ${f1(side)}`;
  }
  return (
    <svg viewBox={vb} width={size} height={size} role="img" aria-label="exercise illustration" className="figure">
      <defs>
        <linearGradient id={`fg${uid}`} gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="80" y2="95">
          <stop offset="0" stopColor="#ff7a45" />
          <stop offset="0.55" stopColor="#ff4f6d" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={`band${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0" stopColor="#2fd0ff" />
          <stop offset="1" stopColor="#7aa8ff" />
        </linearGradient>
        <radialGradient id={`sh${uid}`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {spec.floor !== false && <line x1="6" y1="92.6" x2="94" y2="92.6" stroke="var(--line, #3a3a3c)" strokeWidth="0.8" strokeLinecap="round" />}
      {spec.floor !== false && lowest > 84 && <ellipse cx={cx} cy={92.6} rx={spec.shadow ?? 20} ry={2.2} fill={`url(#sh${uid})`} />}
      {(spec.scene ?? []).map(shape)}
      {g && (
        <g opacity={0.16}>
          {(['lf', 'af', 'ln', 'an'] as const).map((w) => <g key={w}>{limbs(g, w, '#a78bfa')}</g>)}
          {g.front ? <path d={pts([g.an[0], g.af[0], g.lf[0], g.ln[0]]) + 'Z'} fill="#a78bfa" /> : <path d={pts([g.H, g.S])} stroke="#a78bfa" strokeWidth={9.5} strokeLinecap="round" />}
          <circle cx={g.head[0]} cy={g.head[1]} r={L.head} fill="#a78bfa" />
        </g>
      )}
      {back.map((p, i) => prop(p, b, i, uid))}
      {/* far side limbs */}
      {limbs(b, 'lf', b.front ? `url(#fg${uid})` : farCol)}
      {limbs(b, 'af', b.front ? `url(#fg${uid})` : farCol)}
      {farP.map((p, i) => prop(p, b, 100 + i, uid))}
      {/* torso */}
      {b.front ? (
        <path d={pts([b.an[0], b.af[0], b.lf[0], b.ln[0]]) + 'Z'} fill={`url(#fg${uid})`} stroke={`url(#fg${uid})`} strokeWidth={3.4} strokeLinejoin="round" />
      ) : (
        <path d={torso!} stroke={`url(#fg${uid})`} strokeWidth={9.6} strokeLinecap="round" fill="none" />
      )}
      {limbs(b, 'ln', `url(#fg${uid})`)}
      {limbs(b, 'an', `url(#fg${uid})`)}
      <circle cx={f1(b.head[0])} cy={f1(b.head[1])} r={L.head} fill="#ff6a3d" />
      {frontP.map((p, i) => prop(p, b, 200 + i, uid))}
    </svg>
  );
}
