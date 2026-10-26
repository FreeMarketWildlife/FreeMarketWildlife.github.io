import { VERSION, MAP, MAP_CONTRACT, compatibleMap, MAX_MESSAGE_BYTES, RateLimit, validInput, cleanInput } from './protocol.mjs';
import { deltaWorld } from './snapshot.mjs';

const RECONNECT_MS = 90000;
const textBytes = value => new TextEncoder().encode(value).byteLength;
export class Room {
  constructor(code, simulation, { now = () => Date.now(), token = () => crypto.randomUUID() } = {}) {
    this.code = code; this.sim = simulation; this.now = now; this.token = token;
    this.peers = new Map(); this.connections = new Set(); this.started = false;
    this.tick = 0; this.lastSnapshot = null; this.lastActive = now(); this.host = null;
    this.stats = { commands: 0, rejected: 0, snapshots: 0, snapshotBytes: 0, maxTickMs: 0 };
    this.heroes = () => this.sim.api.state().units.filter(u => u.kind === 'hero');
  }
  send(socket, message) {
    if (!socket || socket.readyState !== 1) return;
    try { socket.send(JSON.stringify(message)); } catch { this.disconnect(socket); }
  }
  error(socket, code) { this.stats.rejected++; this.send(socket, { type: 'error', code }); }
  connect(socket) {
    socket.limit = new RateLimit(45, 30, this.now());
    socket.joinedAt = this.now(); this.connections.add(socket); this.lastActive = this.now();
    this.send(socket, { type: 'hello', version: VERSION, map: MAP_CONTRACT, room: this.code });
  }
  receive(socket, raw) {
    if (!this.connections.has(socket)) return;
    if (typeof raw !== 'string' || textBytes(raw) > MAX_MESSAGE_BYTES) {
      socket.close(1009, 'Message too large'); this.disconnect(socket); return;
    }
    if (!socket.limit.take(this.now())) {
      socket.strikes = (socket.strikes || 0) + 1;
      if (socket.strikes > 20) { socket.close(1008, 'Rate limit'); this.disconnect(socket); }
      else this.error(socket, 'RATE_LIMIT');
      return;
    }
    let msg; try { msg = JSON.parse(raw); } catch { this.error(socket, 'INVALID_JSON'); return; }
    if (!msg || Array.isArray(msg) || typeof msg !== 'object') return this.error(socket, 'INVALID_MESSAGE');
    if (msg.type === 'join') return this.join(socket, msg);
    const peer = socket.peer;
    if (!peer || peer.socket !== socket) return this.error(socket, 'JOIN_REQUIRED');
    this.lastActive = this.now();
    if (msg.type === 'ping') { this.send(socket, { type: 'pong', sent: typeof msg.sent === 'number' ? msg.sent : 0 }); return; }
    if (msg.type === 'ready' && !this.started) { peer.ready = msg.ready === true; this.broadcastLobby(); return; }
    if (msg.type === 'pick' && !this.started) {
      const hero = this.heroes().find(u => u.id === msg.heroId);
      if (!hero || [...this.peers.values()].some(p => p !== peer && p.heroId === hero.id)) return this.error(socket, 'SLOT_TAKEN');
      peer.heroId = hero.id; peer.ready = false; this.controls();
      this.send(socket, { type: 'picked', heroId: hero.id }); this.broadcastLobby(); return;
    }
    if (msg.type === 'start') {
      if (this.host !== peer.id) return this.error(socket, 'HOST_ONLY');
      if (this.started) return;
      const active = [...this.peers.values()].filter(p => p.socket);
      if (active.some(p => p !== peer && !p.ready)) return this.error(socket, 'NOT_READY');
      this.started = true; this.controls(); this.broadcastLobby(); this.broadcastSnapshot(true); return;
    }
    if (msg.type === 'leave') {
      this.peers.delete(peer.id); socket.peer = null; this.disconnect(socket);
      socket.close(1000, 'Left room'); return;
    }
    if (msg.type === 'input') {
      if (!this.started) return this.error(socket, 'NOT_STARTED');
      if (!validInput(msg) || msg.seq <= peer.seq) return this.error(socket, 'INVALID_INPUT');
      peer.seq = msg.seq;
      const a = cleanInput(msg.action);
      const hero = this.heroes().find(u => u.id === peer.heroId);
      if (!hero || hero.hp <= 0) return;
      if ((hero.stun > 0 || hero.rooted > 0) && ['move', 'flash'].includes(a.type)) return;
      if (a.type === 'attack') {
        const target = this.sim.api.state().units.find(u => u.id === a.targetId);
        if (!target || target.team === hero.team || target.hp <= 0) return this.error(socket, 'INVALID_TARGET');
        a.x = target.x; a.y = target.y;
      }
      if (a.type === 'buy') this.buy(hero, a.item);
      else this.sim.api.input(peer.heroId, a);
      this.stats.commands++; return;
    }
    this.error(socket, 'INVALID_MESSAGE');
  }
  join(socket, msg) {
    if (socket.peer) return this.error(socket, 'ALREADY_JOINED');
    if (msg.version !== VERSION) return this.error(socket, 'VERSION_MISMATCH');
    if (!compatibleMap(msg.map)) return this.error(socket, 'MAP_MISMATCH');
    this.prune();
    let peer = typeof msg.token === 'string' && msg.token.length <= 100 ? this.peers.get(msg.token) : null;
    if (!peer && msg.token) return this.error(socket, 'RESUME_EXPIRED');
    if (!peer) {
      if (this.started) return this.error(socket, 'MATCH_STARTED');
      const occupied = new Set([...this.peers.values()].map(p => p.heroId));
      // Alternate team assignment, while picks allow friends to organize teams.
      const heroes = this.heroes();
      const counts = [0, 1].map(team => [...this.peers.values()].filter(p => heroes.find(h => h.id === p.heroId)?.team === team).length);
      const team = counts[0] <= counts[1] ? 0 : 1;
      const hero = heroes.find(h => h.team === team && !occupied.has(h.id)) || heroes.find(h => !occupied.has(h.id));
      if (!hero || this.peers.size >= 10) return this.error(socket, 'ROOM_FULL');
      const id = this.token();
      peer = { id, heroId: hero.id, name: typeof msg.name === 'string' ? msg.name.slice(0, 24).replace(/[\x00-\x1f]/g, '') : 'Conqueror', ready: false, seq: 0 };
      this.peers.set(id, peer); if (!this.host) this.host = id;
    }
    if (peer.socket && peer.socket !== socket) {
      const old = peer.socket;
      old.peer = null; this.connections.delete(old); old.close(1000, 'Reconnected elsewhere');
    }
    peer.socket = socket; peer.until = Infinity; socket.peer = peer;
    this.controls();
    this.send(socket, { type: 'welcome', version: VERSION, map: MAP_CONTRACT, token: peer.id, heroId: peer.heroId, seq: peer.seq, room: this.code });
    this.send(socket, { type: 'snapshot', version: VERSION, map: MAP_CONTRACT, full: true, tick: this.tick, ...this.sim.snapshot() });
    this.broadcastLobby();
  }
  buy(hero, item) {
    const base = MAP.fountains[hero.team];
    const price = { blade: 120, armor: 100, boots: 80 }[item];
    if (!price || hero.bells < price || Math.hypot(hero.x - base.x, hero.y - base.y) > 500) return;
    hero.bells -= price;
    if (item === 'blade') hero.damage += 18;
    if (item === 'armor') { hero.maxHp += 200; hero.hp += 200; }
    if (item === 'boots') hero.speed += 25;
  }
  controls() { this.sim.api.setControlled([...this.peers.values()].filter(p => p.socket).map(p => p.heroId)); }
  disconnect(socket) {
    if (!this.connections.delete(socket)) return;
    const peer = socket.peer;
    if (peer?.socket === socket) { peer.socket = null; peer.until = this.now() + RECONNECT_MS; peer.ready = false; }
    this.controls(); this.lastActive = this.now(); this.electHost(); this.broadcastLobby();
  }
  electHost() {
    if (![...this.peers.values()].some(p => p.id === this.host && p.socket)) this.host = [...this.peers.values()].find(p => p.socket)?.id || null;
  }
  prune() {
    for (const [id, peer] of this.peers) if (!peer.socket && peer.until < this.now()) this.peers.delete(id);
    for (const socket of [...this.connections]) if (!socket.peer && this.now() - socket.joinedAt > 10000) {
      socket.close(1008, 'Join timeout'); this.disconnect(socket);
    }
    this.electHost();
  }
  lobby() {
    return { type: 'lobby', version: VERSION, map: MAP_CONTRACT, room: this.code, started: this.started, slots: this.heroes().map(hero => {
      const p = [...this.peers.values()].find(peer => peer.heroId === hero.id);
      return { heroId: hero.id, kit: hero.kit, name: hero.name, team: hero.team, player: p?.name || null,
        connected: !!p?.socket, ready: p?.ready || false, bot: !p?.socket, reserved: !!p && !p.socket, host: !!p && p.id === this.host };
    }) };
  }
  broadcastLobby() { const lobby = this.lobby(); for (const p of this.peers.values()) this.send(p.socket, lobby); }
  broadcastSnapshot(full = false) {
    const current = this.sim.snapshot();
    const payload = { type: 'snapshot', version: VERSION, map: MAP_CONTRACT, tick: this.tick, full: full || !this.lastSnapshot,
      ...(full || !this.lastSnapshot ? current : deltaWorld(this.lastSnapshot, current)) };
    const json = JSON.stringify(payload);
    this.stats.snapshots++; this.stats.snapshotBytes += textBytes(json);
    for (const peer of this.peers.values()) {
      if (peer.socket?.bufferedAmount > 256000) { peer.socket.close(1013, 'Slow connection'); this.disconnect(peer.socket); }
      else this.send(peer.socket, payload);
    }
    this.lastSnapshot = current;
  }
  step() {
    this.prune();
    if (!this.started || ![...this.peers.values()].some(p => p.socket)) return;
    const start = performance.now();
    this.sim.step(0.05); this.tick++;
    this.stats.maxTickMs = Math.max(this.stats.maxTickMs, performance.now() - start);
    if (this.tick % 2 === 0) this.broadcastSnapshot();
  }
  close() { for (const socket of this.connections) socket.close(1001, 'Room closed'); this.connections.clear(); }
}
