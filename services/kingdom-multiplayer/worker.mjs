import { Room } from './room.mjs';
import { createSimulation } from './simulation.generated.mjs';
import { ROOM_CODE, RateLimit, VERSION, MAP_CONTRACT, compatibleMap } from './protocol.mjs';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const creationLimits = new Map();
const allowed = (req, env) => !req.headers.get('Origin') ||
  (env.ALLOWED_ORIGINS || 'https://freemarketwildlife.com,https://www.freemarketwildlife.com').split(',').includes(req.headers.get('Origin'));
function reply(req, status, value) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (req.headers.get('Origin')) headers['Access-Control-Allow-Origin'] = req.headers.get('Origin');
  return new Response(JSON.stringify(value), { status, headers });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!allowed(req, env)) return new Response('Forbidden', { status: 403 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': req.headers.get('Origin') || '', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin', 'Access-Control-Max-Age': '600',
    } });
    if (url.pathname === '/api/kingdom/health' && req.method === 'GET') return reply(req, 200, { ok: true, transport: 'websocket', version: VERSION, map: MAP_CONTRACT });
    if (url.pathname === '/api/kingdom/rooms' && req.method === 'POST') {
      const ip = req.headers.get('CF-Connecting-IP') || 'local';
      if (!creationLimits.has(ip)) {
        // Bounded per-isolate abuse protection; edge/account quotas remain a deployment concern.
        if (creationLimits.size >= 2000) return reply(req, 503, { error: 'BUSY' });
        creationLimits.set(ip, new RateLimit(5, 1 / 60));
      }
      if (!creationLimits.get(ip).take()) return reply(req, 429, { error: 'RATE_LIMIT' });
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = [...crypto.getRandomValues(new Uint8Array(6))].map(v => alphabet[v % alphabet.length]).join('');
        const stub = env.KINGDOM_ROOMS.get(env.KINGDOM_ROOMS.idFromName(code));
        const result = await stub.fetch(new Request('https://room/create', { method: 'POST', body: code }));
        if (result.ok) return reply(req, 201, { room: code, version: VERSION, map: MAP_CONTRACT });
      }
      return reply(req, 503, { error: 'BUSY' });
    }
    const match = /^\/api\/kingdom\/rooms\/([^/]+)\/socket$/.exec(url.pathname);
    if (match && ROOM_CODE.test(match[1]) && req.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return env.KINGDOM_ROOMS.get(env.KINGDOM_ROOMS.idFromName(match[1])).fetch(req);
    }
    return reply(req, 404, { error: 'NOT_FOUND' });
  },
};

export class KingdomRoom {
  constructor(state, env) { this.state = state; this.env = env; this.room = null; this.timer = null; }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/create' && req.method === 'POST') {
      const code = await req.text();
      if (!ROOM_CODE.test(code)) return new Response('Bad room', { status: 400 });
      // Serialize check-and-create against concurrent room-code collisions.
      return this.state.blockConcurrencyWhile(async () => {
        const existing = await this.state.storage.get('room');
        if (existing && Date.now() - existing.created < 2 * 60 * 60 * 1000) return new Response('Exists', { status: 409 });
        await this.state.storage.put('room', { code, created: Date.now(), version: VERSION, map: MAP_CONTRACT });
        this.room?.close(); this.room = null;
        return new Response('Created', { status: 201 });
      });
    }
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 });
    if (!allowed(req, this.env)) return new Response('Forbidden', { status: 403 });
    const metadata = await this.state.storage.get('room');
    if (!metadata || Date.now() - metadata.created > 2 * 60 * 60 * 1000) return new Response('Room expired', { status: 404 });
    if (metadata.version !== VERSION || !compatibleMap(metadata.map)) return new Response('Room uses a different game map; create a new room', { status: 409 });
    if (!this.room) this.room = new Room(metadata.code, createSimulation());
    if (this.room.connections.size >= 16) return new Response('Room full', { status: 429 });
    const pair = new WebSocketPair(); const client = pair[0], server = pair[1]; server.accept();
    this.room.connect(server);
    server.addEventListener('message', e => this.room.receive(server, e.data));
    const close = () => {
      this.room.disconnect(server);
      if (!this.room.connections.size && this.timer) { clearInterval(this.timer); this.timer = null; }
    };
    server.addEventListener('close', close); server.addEventListener('error', close);
    if (!this.timer) this.timer = setInterval(() => this.room.step(), 50);
    return new Response(null, { status: 101, webSocket: client });
  }
}
