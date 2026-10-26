import { FLOCK, displayOperation } from './flock.js';
import { drawSheep } from './sheep.js';
const KEY = 'baad-flock-v1';
export function readCollection(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    return Object.fromEntries(FLOCK.filter(s => data?.[s.id]).map(s => [s.id, {
      seen: Math.max(0, Math.floor(Number(data[s.id].seen) || 0)),
      perfect: Math.max(0, Math.floor(Number(data[s.id].perfect) || 0)),
    }]));
  } catch { return {}; }
}
export function recordSheep(data, id, perfect, storage) {
  const entry = data[id] ??= { seen: 0, perfect: 0 };
  if (perfect) entry.perfect++; else entry.seen++;
  try { storage.setItem(KEY, JSON.stringify(data)); } catch {}
}
export function renderCollection(container, data) {
  container.replaceChildren();
  for (const type of FLOCK) {
    const entry = data[type.id], card = document.createElement('article');
    card.className = 'sheep-card' + (entry?.seen ? ' discovered' : '') + (entry?.perfect ? ' mastered' : '');
    const canvas = document.createElement('canvas'); canvas.width = 230; canvas.height = 140;
    if (entry?.seen) drawSheep(canvas.getContext('2d'), { op: type.id, vx: 1, angle: 0, age: 0, counted: Boolean(entry.perfect) }, 103, 70, 36, type.color);
    else { const c = canvas.getContext('2d'); c.fillStyle = '#8091a3'; c.font = '32px sans-serif'; c.textAlign = 'center'; c.fillText('?', 115, 85); }
    const name = document.createElement('h3'); name.textContent = entry?.seen ? `${type.name} · ${displayOperation(type.id)}` : 'Undiscovered';
    const stats = document.createElement('p'); stats.textContent = entry?.seen ? `Seen ${entry.seen} · Perfect ${entry.perfect}` : type.space ? 'Beyond the atmosphere' : type.legendary ? 'A rare shadow in flight' : 'Keep dreaming';
    const reward = document.createElement('small'); reward.textContent = entry?.seen ? `Perfect +${type.bonus.toLocaleString()}${entry.perfect ? ' · ★' : ''}` : 'Not seen yet';
    card.append(canvas, name, stats, reward); container.append(card);
  }
}
