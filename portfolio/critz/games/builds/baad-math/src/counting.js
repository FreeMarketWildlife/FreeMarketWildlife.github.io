import { apply } from './rules.js';
// The flight's midpoint is the only commitment point. Repeated calls are inert.
export function commitCrossing(flight, total) {
  if (flight.crossed || flight.age < flight.crossingTime) return total;
  flight.crossed = true;
  return flight.result;
}
export function transformCount(count, op) {
  const result = apply(count, op);
  return Number.isFinite(result) && Math.abs(result) <= Number.MAX_SAFE_INTEGER ? result : count;
}
