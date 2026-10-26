import { MAP } from './map.generated.mjs';
export { MAP };
export const VERSION = 2;
export const MAP_CONTRACT = Object.freeze({id:MAP.id,revision:MAP.revision,width:MAP.width,height:MAP.height});
export function compatibleMap(value) {
  return !!value && ['id','revision','width','height'].every(key => value[key] === MAP_CONTRACT[key]);
}
export const MAX_MESSAGE_BYTES = 2048;
export const ROOM_CODE = /^[A-HJ-NP-Z2-9]{6}$/;
export function validPoint(value) {
  return typeof value.x === 'number' && Number.isFinite(value.x) && value.x >= 0 && value.x <= MAP.width &&
    typeof value.y === 'number' && Number.isFinite(value.y) && value.y >= 0 && value.y <= MAP.height;
}
export function validInput(value) {
  if (!value || !Number.isSafeInteger(value.seq) || value.seq < 1 || typeof value.action !== 'object' || !value.action) return false;
  const a = value.action;
  if (!['move', 'attack', 'cast', 'stop', 'recall', 'flash', 'buy'].includes(a.type)) return false;
  // Extra client fields are never forwarded (e.g. damage, hp, team, heroId).
  if (['move', 'cast', 'flash'].includes(a.type) && !validPoint(a)) return false;
  if (a.type === 'attack' && (!Number.isSafeInteger(a.targetId) || a.targetId < 1)) return false;
  if (a.type === 'cast' && (!Number.isInteger(a.slot) || a.slot < 0 || a.slot > 3)) return false;
  if (a.type === 'buy' && !['blade', 'armor', 'boots'].includes(a.item)) return false;
  return true;
}
export function cleanInput(a) {
  const clean = { type: a.type };
  for (const key of ['x', 'y', 'slot', 'targetId', 'item']) if (a[key] !== undefined) clean[key] = a[key];
  if (a.type === 'move') clean.attackMove = a.attackMove === true;
  return clean;
}
export class RateLimit {
  constructor(capacity = 45, perSecond = 30, now = Date.now()) {
    this.tokens = capacity; this.capacity = capacity; this.perSecond = perSecond; this.time = now;
  }
  take(now = Date.now()) {
    this.tokens = Math.min(this.capacity, this.tokens + Math.max(0, now - this.time) * this.perSecond / 1000);
    this.time = now;
    if (this.tokens < 1) return false;
    this.tokens--; return true;
  }
}
