import { useEffect, useRef, useState } from 'react';
import type { Anim } from '../data/exercises';

type P = [number, number];
interface Pose { H: P; S: P; E: P; W: P; P: P; K: P; F: P; M?: P; E2?: P; W2?: P; K2?: P; F2?: P }

const stand: Pose = { H: [50, 17], S: [50, 27], E: [51, 41], W: [52, 54], P: [50, 54], K: [51, 74], F: [50, 94] };
const seated: Pose = { H: [40, 28], S: [40, 38], E: [44, 52], W: [50, 60], P: [42, 64], K: [60, 64], F: [60, 86] };
const quad: Pose = { H: [78, 68], S: [70, 72], E: [70, 83], W: [70, 93], P: [42, 72], K: [42, 93], F: [26, 93] };
const up = (p: Pose, dy: number, keep: (keyof Pose)[] = ['F']): Pose => {
  const o: any = {};
  for (const k of Object.keys(p) as (keyof Pose)[]) o[k] = keep.includes(k) ? p[k] : [p[k]![0], p[k]![1] - dy];
  return o;
};

type Scene = 'bench' | 'chair' | 'box' | 'chairBack' | undefined;
const POSES: Record<Anim, { a: Pose; b: Pose; scene?: Scene }> = {
  squat: { a: { ...stand, E: [62, 29], W: [74, 29] }, b: { H: [57, 37], S: [52, 46], E: [64, 47], W: [76, 47], P: [36, 70], K: [56, 72], F: [50, 94] } },
  hinge: { a: stand, b: { H: [74, 42], S: [66, 46], E: [66, 58], W: [66, 70], P: [40, 54], K: [45, 74], F: [48, 94] } },
  lunge: {
    a: { ...stand, K2: [51, 74], F2: [50, 94] },
    b: { H: [50, 29], S: [50, 39], E: [51, 52], W: [52, 64], P: [50, 66], K: [66, 72], F: [66, 94], K2: [40, 88], F2: [26, 92] },
  },
  pushup: {
    a: { H: [80, 66], S: [72, 70], E: [72, 82], W: [72, 93], P: [44, 78], K: [30, 85], F: [16, 92] },
    b: { H: [78, 82], S: [70, 85], E: [62, 80], W: [72, 93], P: [44, 86], K: [30, 89], F: [16, 92] },
  },
  bench: {
    a: { H: [72, 67], S: [64, 70], E: [64, 57], W: [64, 44], P: [40, 70], K: [24, 66], F: [22, 92] },
    b: { H: [72, 67], S: [64, 70], E: [57, 70], W: [64, 60], P: [40, 70], K: [24, 66], F: [22, 92] },
    scene: 'bench',
  },
  ohp: { a: { ...stand, H: [48, 17], E: [58, 36], W: [56, 26] }, b: { ...stand, H: [47, 18], E: [53, 14], W: [53, 2] } },
  pulldown: { a: { ...stand, E: [53, 12], W: [54, 1] }, b: { ...stand, E: [58, 38], W: [56, 26] } },
  row: {
    a: { H: [39, 50], S: [38, 60], E: [52, 66], W: [66, 72], P: [36, 86], K: [54, 82], F: [72, 88] },
    b: { H: [38, 50], S: [37, 60], E: [26, 66], W: [40, 70], P: [36, 86], K: [54, 82], F: [72, 88] },
  },
  bentrow: {
    a: { H: [72, 40], S: [64, 44], E: [64, 58], W: [64, 70], P: [40, 54], K: [45, 74], F: [48, 94] },
    b: { H: [72, 40], S: [64, 44], E: [52, 46], W: [57, 58], P: [40, 54], K: [45, 74], F: [48, 94] },
  },
  plank: {
    a: { H: [78, 75], S: [70, 79], E: [70, 93], W: [82, 93], P: [44, 81], K: [30, 86], F: [16, 92] },
    b: { H: [78, 74], S: [70, 79], E: [70, 93], W: [82, 93], P: [44, 79], K: [30, 85], F: [16, 92] },
  },
  sideplank: {
    a: { H: [78, 73], S: [70, 79], E: [70, 93], W: [82, 93], P: [44, 87], K: [30, 90], F: [16, 93] },
    b: { H: [78, 72], S: [70, 79], E: [70, 93], W: [82, 93], P: [44, 79], K: [30, 86], F: [16, 93] },
  },
  deadbug: {
    a: { H: [76, 84], S: [68, 86], E: [68, 73], W: [68, 60], P: [44, 86], K: [44, 70], F: [56, 70], E2: [68, 73], W2: [68, 60], K2: [44, 70], F2: [56, 70] },
    b: { H: [76, 84], S: [68, 86], E: [68, 73], W: [68, 60], P: [44, 86], K: [44, 70], F: [56, 70], E2: [80, 80], W2: [92, 82], K2: [30, 80], F2: [14, 84] },
  },
  bridge: {
    a: { H: [80, 88], S: [72, 90], E: [62, 92], W: [54, 92], P: [48, 90], K: [36, 74], F: [28, 94] },
    b: { H: [80, 88], S: [72, 90], E: [62, 92], W: [54, 92], P: [50, 74], K: [34, 70], F: [28, 94] },
  },
  curl: { a: stand, b: { ...stand, W: [59, 29] } },
  pushdown: { a: { ...stand, E: [52, 41], W: [61, 30] }, b: { ...stand, E: [52, 41], W: [53, 55] } },
  raise: { a: stand, b: { ...stand, E: [62, 30], W: [74, 28] } },
  calf: { a: stand, b: up(stand, 5) },
  legext: { a: seated, b: { ...seated, F: [80, 62] }, scene: 'chair' },
  legcurl: { a: { ...seated, F: [80, 62] }, b: { ...seated, F: [55, 85] }, scene: 'chair' },
  dip: {
    a: { H: [50, 24], S: [50, 34], E: [44, 46], W: [40, 58], P: [52, 60], K: [70, 62], F: [72, 92] },
    b: { H: [50, 34], S: [50, 44], E: [36, 48], W: [40, 58], P: [52, 70], K: [70, 70], F: [74, 93] },
    scene: 'chairBack',
  },
  birddog: { a: { ...quad, E2: quad.E, W2: quad.W, K2: quad.K, F2: quad.F }, b: { ...quad, E2: [82, 70], W2: [94, 70], K2: [24, 72], F2: [8, 72] } },
  catcow: { a: { ...quad, H: [80, 63], S: [70, 74], M: [56, 79] }, b: { ...quad, H: [76, 81], S: [70, 70], M: [56, 62] } },
  march: {
    a: { ...stand, K: [60, 64], F: [58, 82], K2: [48, 75], F2: [44, 94], E: [58, 42], W: [64, 34], E2: [44, 41], W2: [42, 54] },
    b: { ...stand, K: [48, 75], F: [44, 94], K2: [60, 64], F2: [58, 82], E: [44, 41], W: [42, 54], E2: [58, 42], W2: [64, 34] },
  },
  balance: {
    a: { ...stand, E: [60, 33], W: [70, 38], K2: [58, 66], F2: [54, 82] },
    b: { ...stand, H: [51, 17], E: [60, 34], W: [70, 39], K2: [59, 66], F2: [55, 82] },
  },
  crunch: {
    a: { H: [80, 86], S: [72, 88], E: [70, 80], W: [76, 78], P: [48, 88], K: [36, 72], F: [28, 94] },
    b: { H: [74, 72], S: [68, 78], E: [66, 70], W: [72, 68], P: [48, 88], K: [36, 72], F: [28, 94] },
  },
  fly: { a: { ...stand, E: [40, 30], W: [33, 27] }, b: { ...stand, E: [62, 30], W: [72, 29] } },
  legpress: {
    a: { H: [16, 44], S: [20, 52], E: [28, 64], W: [36, 70], P: [36, 74], K: [46, 54], F: [62, 58] },
    b: { H: [16, 44], S: [20, 52], E: [28, 64], W: [36, 70], P: [36, 74], K: [56, 62], F: [76, 54] },
  },
  stepup: {
    a: { H: [49, 25], S: [48, 35], E: [49, 49], W: [50, 61], P: [46, 62], K: [62, 62], F: [64, 80], K2: [44, 80], F2: [42, 94] },
    b: { H: [57, 11], S: [56, 21], E: [57, 35], W: [58, 47], P: [57, 48], K: [61, 64], F: [64, 80], K2: [55, 66], F2: [57, 79] },
    scene: 'box',
  },
  superman: {
    a: { H: [76, 88], S: [68, 90], E: [80, 92], W: [92, 92], P: [44, 91], K: [30, 92], F: [16, 92] },
    b: { H: [77, 84], S: [68, 87], E: [80, 85], W: [92, 81], P: [44, 91], K: [30, 88], F: [16, 84] },
  },
  chin_tuck: { a: { ...stand, H: [54, 17] }, b: { ...stand, H: [49, 17] } },
  seated_march: {
    a: { ...seated, K: [60, 56], F: [62, 76], K2: [60, 64], F2: [60, 86] },
    b: { ...seated, K: [60, 64], F: [60, 86], K2: [60, 56], F2: [62, 76] },
    scene: 'chair',
  },
  childpose: {
    a: { H: [64, 89], S: [56, 87], E: [72, 92], W: [86, 92], P: [30, 84], K: [40, 93], F: [24, 93] },
    b: { H: [64, 87], S: [56, 84], E: [72, 92], W: [86, 92], P: [30, 83], K: [40, 93], F: [24, 93] },
  },
  twist: { a: { ...seated, E: [52, 42], W: [62, 38] }, b: { ...seated, E: [32, 42], W: [24, 38] }, scene: 'chair' },
};

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function mix(a: Pose, b: Pose, t: number): Pose {
  const o: any = {};
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const bk = (b[k] ?? a[k]) as P;
    o[k] = lerp(a[k] as P, bk, t);
  }
  for (const k of Object.keys(b) as (keyof Pose)[]) if (!(k in o)) o[k] = b[k];
  return o;
}

const line = (a: P, b: P) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;

export function Figure({ anim, prop, size = 160, playing = true }: { anim: Anim; prop?: 'bar' | 'db' | 'kb' | 'band'; size?: number; playing?: boolean }) {
  const def = POSES[anim] ?? POSES.squat;
  const [t, setT] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!playing || reduce) { setT(0.5); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const ph = ((now - start) / 2600) * Math.PI * 2;
      setT((1 - Math.cos(ph)) / 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [anim, playing]);

  const p = mix(def.a, def.b, t);
  const torso = p.M ? `M${p.S[0]} ${p.S[1]}Q${p.M[0]} ${p.M[1]} ${p.P[0]} ${p.P[1]}` : line(p.S, p.P);
  const neckBase = p.S;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="exercise animation" className="figure">
      <defs>
        <linearGradient id="fg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--coral)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <line x1="4" y1="95.5" x2="96" y2="95.5" stroke="var(--line)" strokeWidth="1" />
      {def.scene === 'bench' && <rect x="22" y="73" width="56" height="5" rx="2" fill="var(--prop)" />}
      {def.scene === 'chair' && <g fill="var(--prop)"><rect x="30" y="65" width="22" height="4" rx="1.5" /><rect x="30" y="34" width="4" height="33" rx="1.5" /><rect x="31" y="68" width="3" height="27" /><rect x="48" y="68" width="3" height="27" /></g>}
      {def.scene === 'chairBack' && <g fill="var(--prop)"><rect x="28" y="58" width="16" height="4" rx="1.5" /><rect x="29" y="61" width="3" height="34" /><rect x="40" y="61" width="3" height="34" /></g>}
      {def.scene === 'box' && <rect x="54" y="80" width="28" height="15" rx="2" fill="var(--prop)" />}
      <g stroke="var(--violet)" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" fill="none">
        {p.K2 && p.F2 && <path d={line(p.P, p.K2) + line(p.K2, p.F2).replace('M', ' M')} />}
        {p.E2 && p.W2 && <path d={line(p.S, p.E2) + line(p.E2, p.W2).replace('M', ' M')} />}
      </g>
      <g stroke="url(#fg)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={torso} />
        <path d={line(p.P, p.K) + ' ' + line(p.K, p.F)} />
        <path d={line(neckBase, p.E) + ' ' + line(p.E, p.W)} />
      </g>
      <circle cx={p.H[0]} cy={p.H[1]} r="6.2" fill="var(--coral)" />
      {prop === 'db' && <rect x={p.W[0] - 5} y={p.W[1] - 2.5} width="10" height="5" rx="2" fill="var(--text)" />}
      {prop === 'bar' && <g><line x1={p.W[0] - 14} y1={p.W[1]} x2={p.W[0] + 14} y2={p.W[1]} stroke="var(--text)" strokeWidth="2" /><circle cx={p.W[0]} cy={p.W[1]} r="5.5" fill="none" stroke="var(--text)" strokeWidth="2.2" /></g>}
      {prop === 'kb' && <circle cx={p.W[0]} cy={p.W[1] + 4} r="4.5" fill="var(--text)" />}
      {prop === 'band' && <path d={line(p.W, p.F)} stroke="var(--water)" strokeWidth="1.5" strokeDasharray="2 2" />}
      {anim === 'legpress' && <rect x={p.F[0] - 1} y={p.F[1] - 12} width="4" height="24" rx="1" fill="var(--prop)" transform={`rotate(-20 ${p.F[0]} ${p.F[1]})`} />}
    </svg>
  );
}
