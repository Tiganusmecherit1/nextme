// Worker entry: serves the embedded PWA and routes /api/* to the Pages Functions handler.
import { onRequest } from '../functions/api/[[route]]';
import { ASSETS } from './assets.gen';

const decoded = new Map<string, Uint8Array>();
const bytes = (p: string) => {
  let b = decoded.get(p);
  if (!b) { b = Uint8Array.from(atob(ASSETS[p].b64), (c) => c.charCodeAt(0)); decoded.set(p, b); }
  return b;
};
const SEC = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'permissions-policy': 'camera=(self), geolocation=(self)' };

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      return (onRequest as any)({ request, env, params: {}, data: {}, waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: () => {}, next: () => new Response('Not found', { status: 404 }), functionPath: url.pathname });
    }
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!ASSETS[p]) p = p.includes('.') && !p.endsWith('.html') ? '' : '/index.html';
    if (!p) return new Response('Not found', { status: 404, headers: SEC });
    const cache = p.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : p === '/sw.js' || p === '/index.html' ? 'no-cache' : 'public, max-age=3600';
    return new Response(bytes(p), { headers: { 'content-type': ASSETS[p].type, 'cache-control': cache, ...SEC } });
  },
};
