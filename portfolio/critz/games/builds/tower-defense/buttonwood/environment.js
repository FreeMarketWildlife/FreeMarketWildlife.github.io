/* Buttonwood environment studies. Every painted pixel occupies one world unit. */
(() => {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const P = A.palette;
  const tiles = new Map(), ores = new Map(), terrain = new Map(), atlases = new Map();
  const ATLAS = 128, TERRAIN_CACHE_LIMIT = 768;
  const mod = (n, size) => ((n % size) + size) % size;
  const rect = (g, x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  const canvas = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  };
  const variantOf = n => ((Math.floor(n) % 4) + 4) % 4;
  // Clusters continue across tile edges, avoiding a grid of outlined squares.
  const wrap = (g, x, y, draw) => {
    for (const dx of [-32, 0, 32]) for (const dy of [-32, 0, 32]) {
      g.save();
      g.translate(x + dx, y + dy);
      draw();
      g.restore();
    }
  };
  const pebble = (g, x, y, w, h, base, light, shade) => {
    rect(g, x + 2, y, w - 4, h, base);
    rect(g, x, y + 2, w, h - 4, base);
    rect(g, x + 1, y + 1, w - 2, h - 2, base);
    rect(g, x + 3, y, w - 6, 1, light);
    rect(g, x + 1, y + h - 3, 1, 1, shade);
    rect(g, x + 2, y + h - 2, w - 4, 1, shade);
    rect(g, x + 3, y + h - 1, w - 6, 1, shade);
  };

  // The atlas belongs to the world, not to individual blocks. Every cell crops
  // the same continuous pattern, including fragments that cross a cell boundary.
  const soilOrRock = new Set(['dirt', 'stone', 'deepslate']);
  function worldAtlas(material) {
    if (atlases.has(material)) return atlases.get(material);
    const c = document.createElement('canvas'); c.width = c.height = ATLAS;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const stamp = (x, y, draw) => {
      for (const dx of [-ATLAS, 0, ATLAS]) for (const dy of [-ATLAS, 0, ATLAS]) {
        g.save(); g.translate(x + dx, y + dy); draw(); g.restore();
      }
    };
    if (material === 'dirt') {
      rect(g, 0, 0, ATLAS, ATLAS, P.dirt);
      // Soft humus clumps: low, connected shapes with a little warm exposed soil.
      // Their unequal sizes and positions deliberately cross the 32px cell grid.
      const clumps = [[-8, 8, 23, 7], [34, 17, 28, 8], [84, 3, 22, 6],
        [9, 44, 27, 8], [59, 49, 21, 7], [106, 35, 30, 9],
        [31, 80, 25, 7], [82, 74, 29, 8], [-5, 95, 24, 8],
        [54, 116, 26, 7], [113, 115, 21, 7]];
      clumps.forEach(([x, y, w, h], i) => stamp(x, y, () => {
        rect(g, 4, 0, w - 9, 2, P.dirtShade);
        rect(g, 1, 2, w - 3, h - 3, P.dirtShade);
        rect(g, 5, h - 1, w - 11, 2, P.dirtShade);
        rect(g, w - 8, 1, 8, 2, P.dirtShade);
        if (i % 3 !== 1) {
          rect(g, 5, -1, Math.floor(w / 3), 1, P.dirtLight);
          rect(g, 3, 0, 4, 1, P.dirtLight);
        }
      }));
      for (const [x, y] of [[17, 23], [74, 30], [113, 64], [15, 114], [69, 99]]) {
        stamp(x, y, () => {rect(g, 0, 1, 5, 2, P.dirtLight); rect(g, 1, 0, 3, 1, P.dirtLight)});
      }
    } else {
      const colors = material === 'deepslate' ? [P.deep, P.deepLight, P.deepShade]
        : [P.stone, P.stoneLight, P.stoneShade];
      rect(g, 0, 0, ATLAS, ATLAS, colors[0]);
      // Quiet, irregular planes break across block boundaries instead of making
      // a stack of outlined 32px pebbles. Larger areas remain flat and readable.
      const planes = [[-9, 10, 35, 17], [39, 3, 34, 20], [91, 13, 38, 18],
        [14, 39, 35, 23], [65, 37, 31, 19], [113, 52, 35, 24],
        [-7, 79, 33, 20], [41, 75, 37, 21], [90, 91, 33, 20], [31, 118, 30, 18]];
      planes.forEach(([x, y, w, h], i) => stamp(x, y, () => {
        rect(g, 4, h - 3, w - 8, 3, colors[2]);
        rect(g, w - 4, 5, 3, h - 9, colors[2]);
        rect(g, w - 7, h - 6, 4, 3, colors[2]);
        rect(g, 2, h - 6, 3, 3, colors[2]);
        rect(g, 5, 0, Math.floor(w * .53), 2, colors[1]);
        rect(g, 2, 2, 4, 2, colors[1]);
        if (i % 3 === 0) rect(g, 9, 5, 6, 1, colors[1]);
      }));
    }
    atlases.set(material, c); return c;
  }

  function paintWorldTexture(g, material, worldX, worldY) {
    const atlas = worldAtlas(material), x = mod(worldX, ATLAS), y = mod(worldY, ATLAS);
    // Four whole-atlas blits also handle arbitrary negative world coordinates.
    for (const dx of [0, -ATLAS]) for (const dy of [0, -ATLAS])
      g.drawImage(atlas, -x - dx, -y - dy);
  }

  function sod(g, x, y, width, worldX) {
    g.save(); g.beginPath(); g.rect(x, y, width, 16); g.clip();
    // A restrained organic horizon sits below the living sod. It reads as moist
    // humus rather than a uniform brown surface or a dark border around a block.
    rect(g, x, y, width, 10, P.dirtShade);
    const humus = [13, 12, 14, 15, 12, 11, 13, 14, 12, 15, 13, 12, 16, 13, 12, 14];
    for (let segment = Math.floor(worldX / 8) - 1; segment <= Math.floor((worldX + width) / 8); segment++) {
      const px = x + segment * 8 - worldX, depth = humus[mod(segment, humus.length)];
      rect(g, px, y + 9, 8, depth - 11, P.dirtShade);
      rect(g, px + 1, y + depth - 2, 6, 1, P.dirtShade);
      rect(g, px + 2, y + depth - 1, 4, 1, P.dirtShade);
    }
    rect(g, x, y, width, 5, P.grass);
    // Continuous rounded lobes, and small paired roots tucked into the loam.
    const lobes = [7, 6, 8, 5, 6, 7, 5, 8, 6, 5, 7, 6, 8, 5, 7, 6];
    for (let segment = Math.floor(worldX / 8) - 1; segment <= Math.floor((worldX + width) / 8); segment++) {
      const motif = mod(segment, lobes.length);
      const px = x + segment * 8 - worldX, depth = lobes[motif];
      rect(g, px, y + 4, 8, depth - 4, P.grassShade);
      rect(g, px + 1, y + 4, 6, depth - 4, P.grass);
      rect(g, px + 2, y + depth, 4, 1, P.grassShade);
      if (motif % 3 === 0) {
        rect(g, px + 4, y + depth + 1, 1, 3, P.soilRoot);
        rect(g, px + 3, y + depth + 3, 1, 2, P.soilRoot);
        rect(g, px + 5, y + depth + 2, 2, 1, P.soilRoot);
      }
      rect(g, px + 1, y, 5, 1, P.grassLight);
      rect(g, px + 2, y + 1, 3, 1, P.grassLight);
      if (motif % 4 === 1) rect(g, px + 6, y + 2, 3, 1, P.grassLight);
    }
    g.restore();
  }

  const seamRank = {dirt: 0, stone: 1, deepslate: 2};
  const materialShade = material => material === 'dirt' ? P.dirtShade : material === 'stone' ? P.stoneShade : P.deepShade;
  const materialLight = material => material === 'dirt' ? P.dirtLight : material === 'stone' ? P.stoneLight : P.deepLight;
  const seamDepth = (world, phase) => [3, 4, 4, 6, 6, 4, 3, 3, 5, 5, 3, 2, 3, 5, 5, 4][mod(Math.floor(world / 4) + phase, 16)];

  A.terrain = (material, cx, cy, neighbors = {}) => {
    cx = Math.floor(cx); cy = Math.floor(cy);
    const meadow = neighbors.meadow === true && neighbors.n === null;
    const key = material + ':' + mod(cx, 4) + ':' + mod(cy, 4) + ':' + (meadow ? 1 : 0) + ':' +
      (neighbors.n || '') + ':' + (neighbors.e || '') + ':' + (neighbors.s || '') + ':' + (neighbors.w || '') + ':' +
      (neighbors.ne || '') + ':' + (neighbors.se || '') + ':' + (neighbors.sw || '') + ':' + (neighbors.nw || '');
    const cached = terrain.get(key);
    if (cached) return cached;
    const c = canvas(), g = c.getContext('2d'), wx = cx * 32, wy = cy * 32;
    if (soilOrRock.has(material)) {
      paintWorldTexture(g, material, wx, wy);
      // One owner per material boundary: loam enters stone; stone enters deeper
      // rock. The owner is never painted twice or into an air cell.
      const owns = other => other in seamRank && seamRank[other] < seamRank[material];
      for (const side of ['n', 'e', 's', 'w']) {
        const other = neighbors[side]; if (!owns(other)) continue;
        g.save(); g.beginPath();
        for (let q = 0; q < 32; q++) {
          const vertical = side === 'e' || side === 'w';
          const depth = seamDepth((vertical ? wy : wx) + q, vertical ? mod(cx, 4) : mod(cy, 4));
          if (side === 'n') g.rect(q, 0, 1, depth);
          if (side === 's') g.rect(q, 32 - depth, 1, depth);
          if (side === 'w') g.rect(0, q, depth, 1);
          if (side === 'e') g.rect(32 - depth, q, depth, 1);
        }
        g.clip(); paintWorldTexture(g, other, wx, wy); g.restore();
      }
      // Diagonal ownership closes concave corners when neither cardinal cell
      // carries the owning material. The cluster stays inside this solid cell.
      for (const [corner, a, b, right, bottom] of [
        ['nw', 'n', 'w', false, false], ['ne', 'n', 'e', true, false],
        ['sw', 's', 'w', false, true], ['se', 's', 'e', true, true]]) {
        const other = neighbors[corner];
        if (!owns(other) || neighbors[a] === other || neighbors[b] === other || !neighbors[a] || !neighbors[b]) continue;
        g.save(); g.beginPath();
        for (let row = 0; row < 4; row++) g.rect(right ? 28 + row : 0, bottom ? 31 - row : row, 4 - row, 1);
        g.clip(); paintWorldTexture(g, other, wx, wy); g.restore();
      }
      // Exposed cutaway faces get short material-colored bevels, never outlines
      // between two occupied cells. The full 32px footprint remains solid.
      const shade = materialShade(material), light = materialLight(material);
      if (!neighbors.w) for (let y = 0; y < 32; y++) rect(g, 0, y, Math.floor(mod(wy + y, ATLAS) / 6) % 3 === 0 ? 2 : 1, 1, shade);
      if (!neighbors.e) for (let y = 0; y < 32; y++) rect(g, 30, y, 2, 1, shade);
      if (!neighbors.s) for (let x = 0; x < 32; x++) rect(g, x, 30 + (Math.floor(mod(wx + x, ATLAS) / 7) % 3 === 0 ? 0 : 1), 1, 2, shade);
      if (!neighbors.n) {
        if (material === 'dirt' && meadow) sod(g, 0, 0, 32, wx);
        else for (let x = 0; x < 32; x++) rect(g, x, 0, 1, Math.floor(mod(wx + x, ATLAS) / 9) % 3 === 0 ? 2 : 1, light);
      }
    } else {
      // Solid crafted blocks and foliage retain their existing material grammar.
      g.drawImage(A.tile(material, 0), 0, 0);
    }
    if (terrain.size >= TERRAIN_CACHE_LIMIT) terrain.delete(terrain.keys().next().value);
    terrain.set(key, c); return c;
  };

  A.tile = (material, variant = 0) => {
    variant = variantOf(variant);
    const key = material + ':' + variant;
    if (tiles.has(key)) return tiles.get(key);
    const c = canvas(), g = c.getContext('2d');
    if (soilOrRock.has(material)) {
      paintWorldTexture(g, material, (variant % 2) * 32, Math.floor(variant / 2) * 32);
      tiles.set(key, c); return c;
    }
    const shifts = [[0, 0], [11, 7], [21, 19], [5, 24]];
    const [dx, dy] = shifts[variant];
    if (material === 'bedrock') {
      rect(g, 0, 0, 32, 32, P.deepShade);
      wrap(g, dx, dy, () => {
        rect(g, 2, 4, 20, 4, P.deep);
        rect(g, 4, 3, 15, 1, P.deep);
        rect(g, 9, 9, 20, 3, P.ink);
        rect(g, 6, 20, 19, 4, P.deep);
        rect(g, 3, 23, 20, 3, P.deep);
        rect(g, 8, 19, 8, 1, P.deepLight);
        rect(g, 22, 29, 13, 2, P.ink);
      });
    } else if (material === 'obsidian') {
      rect(g, 0, 0, 32, 32, P.deepShade);
      wrap(g, dx, dy, () => {
        // Stepped glass facets distinguish obsidian from rounded stone planes.
        for (let y = 0; y < 10; y++) rect(g, 3 + Math.floor(y / 2), 4 + y, 13 - Math.floor(y / 2), 1, P.deep);
        for (let y = 0; y < 10; y++) rect(g, 18 - Math.floor(y / 2), 18 + y, 11 + Math.floor(y / 2), 1, P.ink);
        rect(g, 3, 3, 12, 1, P.deepLight);
        rect(g, 4, 4, 3, 1, P.stoneLight);
        rect(g, 18, 17, 10, 1, P.deepLight);
        rect(g, 17, 18, 1, 3, P.deepLight);
      });
    } else if (material === 'wood') {
      rect(g, 0, 0, 32, 32, P.wood);
      // Wide timber grain, shared with architecture rather than dense striping.
      for (const x of [3, 18]) {
        rect(g, x, 0, 2, 32, P.woodShade);
        rect(g, x + 2, 0, 1, 32, P.woodLight);
      }
      wrap(g, 0, dy, () => {
        rect(g, 9, 4, 1, 8, P.woodLight);
        rect(g, 8, 10, 1, 5, P.woodLight);
        rect(g, 10, 20, 4, 2, P.woodShade);
        rect(g, 8, 22, 2, 4, P.woodShade);
        rect(g, 14, 22, 1, 3, P.woodShade);
        rect(g, 10, 25, 4, 1, P.woodLight);
        rect(g, 25, 8, 1, 11, P.woodShade);
        rect(g, 26, 6, 1, 5, P.woodShade);
        rect(g, 27, 21, 1, 7, P.woodLight);
      });
    } else if (material === 'leaves') {
      rect(g, 0, 0, 32, 32, P.grassShade);
      wrap(g, dx, dy, () => {
        for (const [x, y, w, h] of [[1, 1, 15, 11], [18, 5, 16, 12], [4, 16, 18, 13], [23, 24, 13, 12]]) {
          pebble(g, x, y, w, h, P.grass, P.grassLight, P.grassShade);
          rect(g, x + 4, y + 2, Math.max(3, w - 9), 2, P.mint);
        }
      });
    } else {
      rect(g, 0, 0, 32, 32, P.stone);
    }
    tiles.set(key, c);
    return c;
  };

  A.ore = (type, variant = 0) => {
    variant = variantOf(variant);
    const key = type + ':' + variant;
    if (ores.has(key)) return ores.get(key);
    const c = canvas(), g = c.getContext('2d');
    const formations = [
      [[5, 7, 8, 7], [17, 12, 10, 8], [9, 23, 6, 5]],
      [[17, 5, 9, 7], [5, 14, 10, 8], [21, 23, 6, 5]],
      [[8, 4, 9, 8], [18, 18, 9, 8], [4, 23, 6, 5]],
      [[3, 7, 9, 8], [18, 5, 8, 6], [11, 20, 10, 8]]
    ];
    const colors = type === 'copperOre' ? [P.coral, P.coralLight, P.coralShade]
      : type === 'ironOre' ? [P.creamShade, P.creamLight, P.woodShade]
      : [P.deepShade, P.deep, P.ink];
    for (const [x, y, w, h] of formations[variant]) {
      // Warm peach copper, creamy iron, and charcoal coal have separate value ranges.
      pebble(g, x - 1, y - 1, w + 2, h + 2, P.stoneShade, P.stoneShade, P.stoneShade);
      pebble(g, x, y, w, h, colors[0], colors[1], colors[2]);
      rect(g, x + 2, y + 2, 2, 1, colors[1]);
      if (type === 'copperOre' && w > 8) rect(g, x + w - 3, y + h - 3, 2, 2, P.mintShade);
    }
    ores.set(key, c);
    return c;
  };

  A.paintGrass = (g, x, y, width = 32, variant = 0) => {
    x = Math.round(x); y = Math.round(y); width = Math.round(width);
    // Compatibility for standalone gallery scenes; world terrain calls sod with
    // its absolute world X so neighboring caps never restart their pattern.
    sod(g, x, y, width, x);
  };

  // Arrays are ordered base, highlight, shadow; the game owns liquid geometry.
  A.liquidColors = {
    water: [P.water, P.waterLight, P.waterShade],
    lava: [P.lava, P.lavaLight, P.lavaShade],
    oil: [P.deep, P.deepLight, P.ink]
  };

  A.paintGarden = (g, x, y) => {
    x = Math.round(x); y = Math.round(y);
    const r = (a, b, w, h, color) => rect(g, x + a, y + b, w, h, color);
    // Grounded 31 × 16 cluster. Flower centers echo the Workers' gold buttons.
    r(1, -4, 29, 4, P.grassShade);
    for (const [px, py, w, h] of [[2, -7, 7, 6], [8, -10, 8, 9], [17, -7, 9, 6], [25, -5, 5, 4]]) {
      r(px, py + 2, w, h - 2, P.grass);
      r(px + 1, py, w - 2, h - 2, P.grass);
      r(px + 1, py + 1, w - 3, 1, P.mintLight);
    }
    for (const [px, py] of [[10, -14], [22, -10]]) {
      r(px, py + 2, 1, -py - 3, P.mintShade);
      r(px - 1, py - 2, 3, 5, P.creamLight);
      r(px - 2, py - 1, 5, 3, P.creamLight);
      r(px, py, 1, 1, P.gold);
    }
  };
})();
