import { matches } from './exact.js';
import { resultOf } from './flock.js';
export const apply = resultOf;

export const tolerance = n => 10 + Math.min(6, Math.floor(n / 25));

// Unlocks use active play time; pausing never advances the curriculum.
export function chooseOperation(elapsed, value, random = Math.random) {
  if (elapsed < 15) return '+1';
  const options = ['+1', '+1', '+1', '+1', '+1', '+1', '−1', '−1', '−1', '−1'];
  // One multiplication slot keeps doubles occasional. Large changes still reserve
  // enough tap time through interval(), and projected totals keep division whole.
  if (elapsed >= 30 && Math.abs(value) >= 2 && Math.abs(value) <= 40) options.push('×2');
  if (elapsed >= 60 && value !== 0 && value % 2 === 0) options.push('÷2', '÷2');
  return options[Math.min(options.length - 1, Math.floor(random() * options.length))];
}

// Consecutive crossings retain this spacing even when several sheep are airborne.
// Large changes reserve a seven-taps/second catch-up budget before the next crossing.
export const interval = (n, change) => Math.max(.52, 1.65 - n * .045, Math.abs(change) / 7 + .35);
export const catchUpGrace = change => .14 + Math.abs(change) / 7;
export const starsFor = perfectRatio => perfectRatio >= 1 ? 3 : perfectRatio >= .8 ? 2 : 1;

export function stepRage(rage, error, limit, dt, grace = false) {
  if (error === 0) return Math.max(0, rage - dt * .3);
  // Grace softens catch-up; it never hides a genuine mismatch.
  const rate = .025 + .775 * Math.min(1, error / Math.max(1, limit));
  return Math.min(1, rage + dt * rate * (typeof grace === 'number' ? grace : grace ? .05 : 1));
}

// A small-total floor lets early mistakes move gradually through the gradient too.
export function countColor(count, target) {
  const error = Math.min(1, Math.abs(count - target) / Math.max(10, Math.abs(target)));
  const stops = [[0, [155, 225, 164]], [.35, [239, 169, 105]], [.65, [238, 210, 112]], [1, [245, 112, 123]]];
  const index = stops.findIndex(([at]) => at >= error);
  const [end, to] = stops[Math.max(1, index)], [start, from] = stops[Math.max(1, index) - 1];
  const t = (error - start) / (end - start);
  return `rgb(${from.map((channel, i) => Math.round(channel + (to[i] - channel) * t)).join(', ')})`;
}

// Only visible sheep can be anticipated; the game selects the next crossing.
export function observeAnticipation(flight, count, exact) {
  if (flight && flight.entered !== false && !flight.crossed && flight.age < flight.crossingTime && matches(count, flight.result, exact)) {
    flight.readyBeforeCenter = true;
  }
}
export const isPerfectCrossing = (flight, count, exact) => Boolean(flight.perfectLocked || (flight.readyBeforeCenter && matches(count, flight.result, exact)));
export const calmForPerfect = rage => Math.max(0, rage - .22);
export const perfectPercent = (hits, total) => total > 0 ? Math.floor(hits / total * 100) : 0;

// Exact current total or the NEXT visible operation only. Future operations and
// departed/old totals never authorize an interval of incorrect values.
export function countFeedback(count, target, flights = [], exact) {
  const next = flights.find(f => f.entered && !f.crossed);
  if (matches(count, target, exact)) return { kind: 'current', error: 0, next };
  if (next && matches(count, next.result, exact)) return { kind: 'ready', error: 0, next };
  return { kind: 'error', error: Math.max(Number.MIN_VALUE, Math.abs(count - target)), next };
}
export function countingError(count, target, incoming, exact) {
  const flights = Array.isArray(incoming) ? incoming : incoming ? [{ ...incoming, entered: incoming.entered !== false }] : [];
  return countFeedback(count, target, flights, exact).error;
}

// Credit the next visible incoming sheep and the most recent crossed sheep. Matching
// an old repeated total must not accidentally mark every similar sheep on screen.
export function creditCountedSheep(flights, count, exact) {
  const incoming = flights.find(flight => flight.entered && !flight.crossed) ?? flights.find(flight => flight.entered !== false && !flight.crossed);
  const current = flights.findLast(flight => flight.crossed);
  for (const flight of flights) flight.counted = (flight === incoming || flight === current) && matches(count, flight.result, exact);
}
