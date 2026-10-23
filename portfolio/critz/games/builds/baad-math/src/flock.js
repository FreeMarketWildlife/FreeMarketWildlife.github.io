// One catalogue drives arithmetic, discovery order, art, collection, and rewards.
const sheep = (id, name, color, mood, bonus, weight, math, extra = {}) =>
  ({ id, name, color, mood, bonus, weight, math, spin: .32, slow: 1, ...extra });
export const FLOCK = [
  sheep('+1', 'Happy', '#f2efdf', 'happy', 50, 40, n => n + 1),
  sheep('−1', 'Angry', '#f58992', 'angry', 75, 12, n => n - 1),
  sheep('×2', 'Goofy', '#eac47b', 'goofy', 150, 3, n => n * 2, { slow: 1.25, spin: .55 }),
  sheep('÷2', 'Crying', '#98c7f1', 'crying', 200, 1, n => n / 2, { fraction: [1, 2], slow: 1.5 }),
  sheep('+2', 'Eager', '#91dfb5', 'eager', 100, 18, n => n + 2),
  sheep('−2', 'Furious', '#b44e6b', 'furious', 125, 3, n => n - 2),
  sheep('+5', 'Excitable', '#c0e676', 'excitable', 175, 12, n => n + 5, { spin: .7 }),
  sheep('×3', 'Hyper', '#f5a765', 'hyper', 300, 1.5, n => n * 3, { slow: 1.8, spin: 1 }),
  sheep('⅓', 'Sleepy', '#b9e3fa', 'sleepy', 300, .7, n => n / 3, { fraction: [1, 3], slow: 1.8, spin: .7 }),
  sheep('⅔', 'Skeptical', '#63b9d6', 'skeptical', 400, .7, n => n / 3 * 2, { fraction: [2, 3], slow: 2, spin: .55 }),
  sheep('¼', 'Nervous', '#538de6', 'nervous', 400, .5, n => n / 4, { fraction: [1, 4], slow: 2.1, spin: .8 }),
  sheep('¾', 'Pleading', '#999eea', 'pleading', 500, .6, n => n / 4 * 3, { fraction: [3, 4], slow: 2.2, spin: .7 }),
  sheep('↺0', 'Blank', '#737f90', 'blank', 550, .15, () => 0, { slow: 2.3 }),
  sheep('×−1', 'Backwards', '#ba89e5', 'smirk', 650, .35, n => -n, { space: true, slow: 2.3, spin: 1.2 }),
  sheep('×−2', 'Antimatter', '#dd81d8', 'hyper', 800, .25, n => n * -2, { space: true, slow: 2.5, spin: 1.5 }),
  sheep('−½', 'Blue Eclipse', '#7292de', 'crying', 850, .3, n => -n / 2, { space: true, fraction: [-1, 2], slow: 2.5, spin: 1.1 }),
  sheep('×−3', 'Supernova', '#e68cbe', 'excitable', 1000, .2, n => n * -3, { space: true, slow: 2.8, spin: 1.6 }),
  sheep('−⅓', 'Cold Moon', '#709fc3', 'sleepy', 1000, .2, n => -n / 3, { space: true, fraction: [-1, 3], slow: 2.6, spin: 1.2 }),
  sheep('−⅔', 'Blue Shift', '#4696b5', 'skeptical', 1100, .2, n => -n / 3 * 2, { space: true, fraction: [-2, 3], slow: 2.7, spin: 1.3 }),
  sheep('−¼', 'Deep Freeze', '#5268c7', 'nervous', 1100, .15, n => -n / 4, { space: true, fraction: [-1, 4], slow: 2.8, spin: 1.2 }),
  sheep('−¾', 'Eventide', '#8a7dc4', 'pleading', 1250, .15, n => -n / 4 * 3, { space: true, fraction: [-3, 4], slow: 3, spin: 1.4 }),
  sheep('×0', 'Legendary Shadow', '#171326', 'shadow', 2500, .015, () => 0, { legendary: true, slow: 3.2, spin: 1.6 }),
];
export const BY_ID = Object.fromEntries(FLOCK.map(s => [s.id, s]));
export const resultOf = (value, id) => BY_ID[id].math(value);
export const displayOperation = id => id === '÷2' ? '½' : id;
export function eligible(type, value, { space = false, height = 0, elapsed = 0 } = {}) {
  if (type.space && !space) return false;
  if (type.legendary && (elapsed <= 180 || height <= 0)) return false;
  if (type.fraction && value % type.fraction[1] !== 0) return false;
  const after = type.math(value);
  return Number.isSafeInteger(after) && Math.abs(after) <= 99999 && (space || after >= 0)
    && (!type.fraction || value !== 0) && (!(type.id.startsWith('×') && type.id !== '×0') || Math.abs(value) >= 2);
}

export const createProgression = () => ({ seen: new Set(), pending: null, solo: false, nextWave: 0, index: 0 });
// One complete wave cycle between debuts. Actual launch time, not
// eligibility time, starts the next wait. Space/legend gates never skip the order.
export function planEncounter(state, flights, value, context, random = Math.random) {
  if (state.solo) { if (flights.length) return null; state.solo = false; }
  const wave = Math.floor(context.elapsed / 26);
  const upcoming = FLOCK[state.index];
  if (!state.pending && upcoming && wave >= state.nextWave && eligible(upcoming, value, context)) {
    // Legend roll once per scheduled encounter, never once per physics tick.
    if (!upcoming.legendary || random() < .003) state.pending = upcoming.id;
  }
  if (state.pending) {
    if (flights.length) return null;
    const id = state.pending;
    state.pending = null; state.solo = true; state.seen.add(id); state.index++;
    state.nextWave = wave + 1;
    return id;
  }
  const options = FLOCK.filter(s => state.seen.has(s.id) && eligible(s, value, context));
  if (!options.length) return null;
  // Additive sheep dominate; large downward jumps become rarer as totals grow.
  // In negative space, favor operations moving the total back upward as well.
  const weights = options.map(s => {
    const change = s.math(value) - value;
    return s.weight / (change < 0 ? 1 + Math.abs(change) / 5 : 1 + Math.max(0, change - 20) / 50);
  });
  let pick = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) { pick -= weights[i]; if (pick <= 0) return options[i].id; }
  return options.at(-1).id;
}
