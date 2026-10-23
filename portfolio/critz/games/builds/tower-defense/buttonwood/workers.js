/* Buttonwood Workers: native, hand-placed pixels; every pose shares a ground anchor. */
(function () {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const cache = new Map();
  A.workerFrames = Object.freeze({ idle: 4, walk: 6, work: 6 });
  A.workerAnchor = Object.freeze({ x: 18, y: 31 });

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  }

  function colors(variant) {
    const p = A.palette;
    return {
      O: p.ink, o: p.outline, c: p.cream, v: p.creamLight, S: p.creamShade,
      M: p.mint, L: p.mintLight, d: p.mintShade,
      f: variant === 1 ? p.darkSkin : p.skin,
      h: variant === 1 ? p.darkSkinLight : p.skinLight,
      a: variant === 1 ? p.darkSkinShade : p.skinShade,
      R: variant === 1 ? p.ink : variant === 2 ? p.coralShade : p.hair,
      r: variant === 1 ? p.outline : variant === 2 ? p.coral : p.hairLight,
      k: p.coral, K: p.coralShade, g: p.gold, G: p.goldShade,
      w: p.wood, W: p.woodLight, b: p.woodShade,
      s: p.stone, l: p.stoneLight, D: p.stoneShade,
    };
  }

  function stamp(ctx, x, y, rows, paint) {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const color = paint[row[dx]];
        if (color) { ctx.fillStyle = color; ctx.fillRect(x + dx, y + dy, 1, 1); }
      }
    });
  }

  // A tilted, soft crown and rising brim are the shared Worker silhouette.
  const head = [
    '........OOOOOO',
    '.......OOvvvvvOO',
    '......OvvvvvvvvvO',
    '.....OvcccccccvvvO',
    '....OvcccvccccccvvO',
    '...OvccccccccccvvvO',
    '..OvccccccMMMMMvvvOO',
    '.OvcccMMMMMvvvvvvvvvO',
    'OvccMMMvvvvvSSSSSSvvO',
    'OcMMvvvSSSSSRRRRRRO',
    '.OvvSSSRRRRRrrrrRRO',
    '..OOSSRRrrRhfffRRRO',
    '...ORRrRRRhhfffhffRO',
    '..ORrrRRRafhfffhffRO',
    '..ORrRRRaffhfffffffO',
    '...ORRRRaafhffkkffO',
    '....ORRRRaaffffffO',
    '.........OOaaaOOO',
  ];

  const torso = [
    '...OccMccMO',
    '..OvcMdccMdO',
    '..OvcgMMMgMO',
    '..OSMdMLMMdO',
    '...OMLMMMMdO',
    '...OMMMMMMdO',
    '...OMMddMMdO',
    '...OMdOOdMdO',
  ];

  const feet = [
    ['...OMMO.OMMO', '..ObwwO.ObwwO', '..ObWWO.ObWWO', '..OOOOO.OOOOO'],
    ['..OMMO...OMMO', '.ObwwO...ObwwO', '.ObWWO....ObWO', '.OOOOO....OOOO'],
    ['...OMMO.OMMO', '...ObwO.ObwO', '...ObWO.ObWWO', '...OOOO.OOOOO'],
    ['...OMMO.OMMO', '...ObwO.ObwwO', '...ObWO.ObWWO', '...OOOO.OOOOO'],
    ['..OMMO...OMMO', '..ObwO...ObwwO', '..ObWWO..ObWWO', '..OOOOO..OOOOO'],
    ['...OMMO.OMMO', '..ObwwO.ObwO', '..ObWWO.ObWO', '..OOOOO.OOOO'],
  ];

  const leftSleeve = ['.OO', 'OvcO', 'OcfO', '.OfO', '.OaO', '..O'];
  const rightSleeve = ['OO', 'cvO', 'cfO', 'ffO', 'aO', 'O'];

  // Tools are posed directly on the grid; no fractional rotation or stretching.
  function tool(ctx, frame, p) {
    const poses = [
      { x: 25, y: 15, rows: ['..OO', '..OWO', '...OWO', '....OWO', '.....OWO', '......OWO', '.......OWO', '.....OOOOOO', '....OlsssDO', '.....OOOOO'] },
      { x: 26, y: 5, rows: ['...OOOOOO', '..OllsssDO', '...OOwOOO', '....OWO', '....OWO', '...OWO', '...OWO', '..OWO', '..OWO', '.OWO', '.OWO', 'OWO'] },
      { x: 25, y: 3, rows: ['..OOOOOOOO', '.OllssssDDO', '..OOOOwOOO', '.....OWO', '.....OWO', '.....OWO', '.....OWO', '.....OWO', '....OWO', '....OWO', '....OWO', '...OWO', '...OWO', '..OWO', '..OO'] },
      { x: 23, y: 20, rows: ['.OOOO', 'OWWWWOO', '.OOOOwWOO', '....OOwWWOO', '......OOOOwOO', '.........OlDO', '.........OlDO', '.........ODO', '..........O'] },
      { x: 23, y: 20, rows: ['.OOOO', 'OWWWWOO', '.OOOOwWOO', '....OOwWWOO', '......OOOOwOO', '.........OlDO', '.........OlDO', '.........ODO', '..........O'] },
      { x: 25, y: 17, rows: ['.OO', '.OWO', '..OWO', '...OWO', '....OWO', '.....OWO', '......OWO', '....OOOOOO', '...OllsssDO', '....OOOOO'] },
    ];
    const q = poses[frame]; stamp(ctx, q.x, q.y, q.rows, p);
  }

  function drawWorker(ctx, state, frame, variant) {
    const p = colors(variant);
    const bob = state === 'walk' && (frame === 1 || frame === 4) ? -1 : 0;
    const lean = state === 'work' && (frame === 3 || frame === 4) ? 1 : 0;
    // Feet keep the same ground line while the body rises by one pixel in passing poses.
    const legPose = feet[state === 'walk' ? frame : 0];
    stamp(ctx, 11, 27, legPose, p);
    if (bob) stamp(ctx, 11, 26, [legPose[0]], p);
    stamp(ctx, 11 + lean, 19 + bob, torso, p);
    stamp(ctx, 6 + lean, 1 + bob, head, p);
    // Neck is tucked under the curled hair, with a cream collar beside each strap.
    stamp(ctx, 17 + lean, 18 + bob, ['OfaO', 'caaMc'], p);
    const blink = state === 'idle' && frame === 3;
    stamp(ctx, 18 + lean, 13 + bob, blink ? ['o...o', '.....'] : ['O...O', 'O...O'], p);
    stamp(ctx, 20 + lean, 16 + bob, ['K.K', '.K.'], p);
    if (state === 'work') {
      stamp(ctx, 11 + lean, 20 + bob, leftSleeve, p);
      tool(ctx, frame, p);
      if (frame === 1 || frame === 2) {
        stamp(ctx, 24, 17, ['..OO', '.OhfO', 'OvffO', 'OvcO', '.OO'], p);
      } else if (frame === 3 || frame === 4) {
        stamp(ctx, 24, 21, ['OOO', 'vcffO', 'cffaO', '.OOO'], p);
      } else {
        stamp(ctx, 23, 21, ['OO', 'vcOO', 'cfffO', '.aaO', '..O'], p);
      }
    } else {
      const swing = state === 'walk' ? [0, -1, -1, 0, 1, 1][frame] : 0;
      stamp(ctx, 10 - swing, 20 + bob, leftSleeve, p);
      stamp(ctx, 23 + swing, 20 + bob, rightSleeve, p);
    }
  }

  A.worker = function ({ state = 'idle', frame = 0, variant = 0, dir = 1 } = {}) {
    if (!Object.hasOwn(A.workerFrames, state)) state = 'idle';
    variant = ((Math.floor(variant) % 3) + 3) % 3;
    frame = ((Math.floor(frame) % A.workerFrames[state]) + A.workerFrames[state]) % A.workerFrames[state];
    const key = `${state}:${frame}:${variant}:${dir < 0 ? -1 : 1}`;
    if (cache.has(key)) return cache.get(key);
    const c = canvas(40, 32), ctx = c.getContext('2d');
    if (dir < 0) { ctx.translate(A.workerAnchor.x * 2, 0); ctx.scale(-1, 1); }
    drawWorker(ctx, state, frame, variant);
    cache.set(key, c); return c;
  };

  // Portrait uses its own composition on a native 32 × 32 canvas.
  A.workerIcon = function (variant = 0) {
    variant = ((Math.floor(variant) % 3) + 3) % 3;
    const key = `icon:${variant}`;
    if (cache.has(key)) return cache.get(key);
    const c = canvas(32, 32), ctx = c.getContext('2d'), p = colors(variant);
    stamp(ctx, 3, 2, [
      '.........OOOOOO',
      '........OOvvvvvOO',
      '.......OvvvvvvvvvO',
      '......OvcccccccvvvO',
      '.....OvcccvccccccvvO',
      '....OvccccccccccvvvO',
      '...OvccccccMMMMMvvvOO',
      '..OvcccMMMMMvvvvvvvvvO',
      '.OvccMMMvvvvvSSSSSSvvO',
      '.OcMMvvvSSSSSRRRRRRO',
      '..OvvSSSRRRRRrrrrRRO',
      '...OOSSRRrrRhfffRRRO',
      '....ORRrRRRhhfffhffRO',
      '...ORrrRRRafhfffhffRO',
      '...ORrRRRaffhfffffffO',
      '....ORRRRaafhffkkffO',
      '.....ORRRRaaffffffO',
      '..........OOaaaOOO',
    ], p);
    stamp(ctx, 16, 15, ['O...O', 'O...O'], p);
    stamp(ctx, 18, 18, ['K.K', '.K.'], p);
    stamp(ctx, 14, 20, ['OfaO', 'caaMc'], p);
    stamp(ctx, 5, 21, [
      '....OOcMcccMOO',
      '...OvvcMdcdMccO',
      '..OvvvcgMMMgccvO',
      '..OcvOdMLMLMdOvcO',
      '.OfhOOMMMMMMdOOfO',
      '.OfaOOMMMMMMdOOfO',
      '..OO.OMMdddMdO.O',
      '.....OMMdOdMdO',
      '.....OOOO.OOO',
    ], p);
    cache.set(key, c); return c;
  };
})();
