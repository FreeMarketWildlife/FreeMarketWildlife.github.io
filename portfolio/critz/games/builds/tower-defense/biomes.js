// Geographic presentation only: terrain, resources, weather and progression do not depend on biomes.
(function () {
  'use strict';
  const ids = Object.freeze(['mountains', 'plains', 'jungle', 'ocean']);
  const names = Object.freeze({mountains: 'Mountains', plains: 'Plains', jungle: 'Jungle', ocean: 'Ocean'});
  const span = 3072, jitter = 384, transition = 384;
  const normalizeSeed = seed => Number.isFinite(seed) ? seed >>> 0 : 0;
  const normalizeX = x => Number.isFinite(x) ? x : 0;
  function hash(seed, n) {
    let a = (normalizeSeed(seed) ^ Math.imul(n, 0x9e3779b1)) >>> 0;
    a = Math.imul(a ^ a >>> 16, 0x21f0aaad);
    a = Math.imul(a ^ a >>> 15, 0x735a2d97);
    return ((a ^ a >>> 15) >>> 0) / 4294967296;
  }
  function boundary(seed, index) {
    return index * span - span / 2 + Math.floor((hash(seed ^ 0x48c07, index) * 2 - 1) * jitter);
  }
  function idAtIndex(seed, index) {
    // Every four regions contains all four biomes, in independently shuffled order.
    const group = Math.floor(index / ids.length), order = [...ids];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(hash(seed ^ 0x537acd, group * 13 + i) * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (group === 0) {
      const first = order.indexOf('mountains');
      [order[0], order[first]] = [order[first], order[0]];
    }
    return order[index - group * ids.length];
  }
  function regionAt(seed, x) {
    seed = normalizeSeed(seed); x = normalizeX(x);
    let index = Math.floor((x + span / 2) / span);
    if (x < boundary(seed, index)) index--;
    else if (x >= boundary(seed, index + 1)) index++;
    const start = boundary(seed, index), end = boundary(seed, index + 1);
    return {id: idAtIndex(seed, index), index, start, end, width: end - start, seed};
  }
  function weightsAt(seed, x) {
    x = normalizeX(x);
    const r = regionAt(seed, x), weights = {mountains: 0, plains: 0, jungle: 0, ocean: 0};
    let other = null, t = 0;
    if (x - r.start < transition / 2) {
      other = idAtIndex(r.seed, r.index - 1); t = (transition / 2 - (x - r.start)) / transition;
    } else if (r.end - x < transition / 2) {
      other = idAtIndex(r.seed, r.index + 1); t = (transition / 2 - (r.end - x)) / transition;
    }
    t = t * t * (3 - 2 * t);
    weights[r.id] += 1 - t;
    if (other) weights[other] += t;
    return weights;
  }
  window.ButtonwoodBiomes = Object.freeze({ids, names, span, transition, regionAt, weightsAt,
    biomeAt: (seed, x) => regionAt(seed, x).id, hash});
})();
