// Quietly breathe between 18-second swells and 8-second lulls. Smoothstep
// blends both edges over two seconds, without a wave banner or abrupt switch.
const smooth = t => t * t * (3 - 2 * t);
export function recoveryAt(seconds) {
  const phase = Math.max(0, seconds) % 26;
  if (phase < 18) return 0;
  if (phase < 20) return smooth((phase - 18) / 2);
  if (phase < 24) return 1;
  return 1 - smooth((phase - 24) / 2);
}

export function waveInterval(seconds, change) {
  // Exponential pressure, bounded by readable crossings and the tap budget.
  // Lulls still offer real breathing room even very late in an endless run.
  const surge = Math.max(.52, 1.65 * Math.exp(-seconds / 65));
  const lull = Math.max(1.65, surge * 1.65);
  const gap = surge + (lull - surge) * recoveryAt(seconds);
  return Math.max(gap, Math.abs(change) / 7 + .35);
}

export function createIntroductions() {
  return { seen: new Set(), pending: null, solo: false };
}

// Reserve the next operation before draining the sky. This avoids rerolling a
// first encounter away while waiting, and keeps every debut alone until gone.
export function nextEncounter(state, flights, choose) {
  if (state.solo) {
    if (flights.length) return null;
    state.solo = false;
  }
  state.pending ??= choose();
  const op = state.pending;
  if (!state.seen.has(op) && flights.length) return null;
  state.solo = !state.seen.has(op);
  state.seen.add(op);
  state.pending = null;
  return op;
}
