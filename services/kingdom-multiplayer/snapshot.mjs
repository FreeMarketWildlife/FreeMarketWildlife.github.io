// Explicit rendering whitelist: never serialize live unit references, paths or target bins.
const FIELDS = ('id kind kit conqueror name species role team x y hp maxHp radius range damage speed lane progress bells cs level xp mana maxMana respawn shield facing moving walk attackAnim dead slow buff flash flashCooldown recall overhead pickWidth pickHeight color scale ranged cd demoAnimation demoAnimLeft stun rooted haste empower wrath').split(' ');
export function serializeWorld(state) {
  const units = state.units.map(unit => {
    const out = {};
    for (const key of FIELDS) if (unit[key] !== undefined && (unit[key] === null || typeof unit[key] !== 'object')) out[key] = unit[key];
    if (unit.skills) out.skills = [...unit.skills];
    return out;
  });
  const visual = (list, limit) => list.slice(-limit).map(value => {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === 'source' || key === 'target') out[key + 'Id'] = item?.id;
      else if (item === null || ['number', 'string', 'boolean'].includes(typeof item)) out[key] = item;
      else if (key === 'trail') out.trail = item.slice(-5).map(p => ({ x: p.x, y: p.y }));
    }
    return out;
  });
  return { clock: state.clock, winner: state.winner, kills: [...state.kills], units,
    effects: visual(state.effects || [], 80), projectiles: visual(state.projectiles || [], 120),
    skillshots: visual(state.skillshots || [], 60) };
}
export function deltaWorld(previous, current) {
  const old = new Map(previous.units.map(u => [u.id, u]));
  const ids = new Set(current.units.map(u => u.id));
  const units = [];
  for (const unit of current.units) {
    const before = old.get(unit.id);
    if (!before) { units.push(unit); continue; }
    const changed = { id: unit.id };
    for (const [key, value] of Object.entries(unit)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(value)) changed[key] = value;
    }
    if (Object.keys(changed).length > 1) units.push(changed);
  }
  return { ...current, units, removed: previous.units.filter(u => !ids.has(u.id)).map(u => u.id) };
}
