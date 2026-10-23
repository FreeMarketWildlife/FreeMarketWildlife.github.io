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
  if (error <= 1) return Math.max(0, rage - dt * .3);
  if (grace) return rage;
  const rate = error >= limit ? .8 : .09 + .38 * (error - 1) / (limit - 1);
  return Math.min(1, rage + dt * rate);
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

// Only visible sheep can be anticipated; the game selects the latest entry.
export function observeAnticipation(flight, count) {
  if (flight && flight.entered !== false && !flight.crossed && flight.age < flight.crossingTime && count === flight.result) {
    flight.readyBeforeCenter = true;
  }
}
export const isPerfectCrossing = (flight, count) => Boolean(flight.perfectLocked || (flight.readyBeforeCenter && count === flight.result));
export const calmForPerfect = rage => Math.max(0, rage - .22);
export const perfectPercent = (hits, total) => total > 0 ? Math.floor(hits / total * 100) : 0;

// Damage eligibility is separate from the midpoint-committed color and perfect score.
// Each visible, still-in-play flight owns only its before→after interval. Keep that
// interval through its departure so crossing cannot suddenly invalidate a held count.
// The caller removes departed flights; invisible/unspawned totals grant no allowance.
export function countingError(count, target, incoming) {
  const flights = Array.isArray(incoming) ? incoming : incoming && !incoming.crossed ? [{ ...incoming, entered: incoming.entered !== false, before: target }] : [];
  let error = Math.abs(count - target);
  for (const flight of flights) {
    if (!flight.entered || !Number.isFinite(flight.before) || !Number.isFinite(flight.result)) continue;
    const low = Math.min(flight.before, flight.result), high = Math.max(flight.before, flight.result);
    error = Math.min(error, Math.max(low - count, count - high, 0));
  }
  return error;
}

// Credit the latest visible incoming sheep and the most recent crossed sheep. Matching
// an old repeated total must not accidentally mark every similar sheep on screen.
export function creditCountedSheep(flights, count) {
  const incoming = flights.findLast(flight => flight.entered && !flight.crossed) ?? flights.find(flight => flight.entered !== false && !flight.crossed);
  const current = flights.findLast(flight => flight.crossed);
  for (const flight of [incoming, current]) if (flight && count === flight.result) flight.counted = true;
}
