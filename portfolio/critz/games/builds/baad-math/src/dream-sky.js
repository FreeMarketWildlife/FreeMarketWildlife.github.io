// Libriam Globe palette: its sub-moon Moon; massive ringed parent Kronos;
// complementary blue Zuhal and orange dwarf sun. Dream distances are illustrative.
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
const seed = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function oval(ctx, x, y, rx, ry, color, angle = 0) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); ctx.fill();
}
function halo(ctx, x, y, radius, color) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, color); light.addColorStop(1, '#b9dbe900');
  ctx.fillStyle = light; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function planet(ctx, x, y, r, color, rings = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.30);
  if (rings) {
    ctx.save(); ctx.globalAlpha *= .6;
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = i % 4 ? color : '#72828f'; ctx.lineWidth = r * .012;
      ctx.beginPath(); ctx.ellipse(0, 0, r * (1.35 + i * .025), r * (.31 + i * .006), 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  const light = ctx.createRadialGradient(r * .2, -r * .5, 0, -r * .3, r * .4, r * 1.5);
  light.addColorStop(0, color); light.addColorStop(.6, '#737079'); light.addColorStop(1, '#101c30');
  oval(ctx, 0, 0, r, r, light);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  // Irregular cloud belts curl around the limb, with fine bright seams.
  for (let i = -35; i <= 35; i++) {
    const latitude = i * r * .03;
    ctx.beginPath();
    for (let j = 0; j <= 60; j++) {
      const xx = -r + j / 60 * r * 2;
      const curl = Math.sin(xx / r * 8 + i * .6) * r * .008 + Math.sin(xx / r * 19 - i * .2) * r * .003;
      const yy = latitude + Math.cos(xx / r * 1.5) * r * .035 + curl;
      if (!j) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.strokeStyle = i % 4 === 0 ? '#e9cc9650' : i % 3 ? '#d5aa8032' : '#55516645';
    ctx.lineWidth = r * (.009 + seed(i + 90) * .015); ctx.stroke();
  }
  // A slowly wound storm in the southern cloud belts.
  for (let i = 15; i > 0; i--) oval(ctx, r * .24, r * .42, r * .10 * i / 15, r * .034 * i / 15,
    i % 2 ? '#c7986735' : '#edd1a325', -.08);
  const dusk = ctx.createRadialGradient(-r * .3, -r * .4, r * .15, -r * .3, -r * .4, r * 1.65);
  dusk.addColorStop(0, '#07152a00'); dusk.addColorStop(.45, '#07152a00');
  dusk.addColorStop(.8, '#07152a55'); dusk.addColorStop(1, '#07152acc');
  ctx.fillStyle = dusk; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  if (rings) {
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = i % 5 ? color : '#72828f'; ctx.lineWidth = r * .008;
      ctx.beginPath(); ctx.ellipse(0, 0, r * (1.35 + i * .025), r * (.31 + i * .006), 0, 0, Math.PI); ctx.stroke();
    }
  }
  ctx.restore();
}
function fullMoon(ctx, x, y, r) {
  halo(ctx, x, y, r * 4.8, '#b8d6e51b');
  halo(ctx, x, y, r * 1.6, '#d7e4ef28');
  const pearl = ctx.createRadialGradient(x - r * .25, y - r * .3, 0, x, y, r * 1.1);
  pearl.addColorStop(0, '#f0efdb'); pearl.addColorStop(.72, '#d6ded6'); pearl.addColorStop(1, '#a6bdc8');
  oval(ctx, x, y, r, r, pearl);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * .98, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 55; i++) {
    const a = seed(i + 11) * Math.PI * 2, d = Math.sqrt(seed(i + 67)) * r * .94, cr = r * (.018 + seed(i + 99) * .13);
    oval(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, cr, cr * .8, i % 3 ? '#6e8d9c16' : '#7897a125', a);
  }
  ctx.restore();
}
export function drawDreamSky(ctx, w, h, height, time, stars) {
  const space = smooth((height - .6) / 2.8);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, mix([4, 9, 22], [3, 7, 18], space));
  bg.addColorStop(.6, mix([10, 21, 38], [10, 18, 34], space));
  bg.addColorStop(1, mix([18, 33, 43], [18, 31, 46], space));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (const s of stars) {
    ctx.globalAlpha = .18 + (.5 + .5 * Math.sin(time * .18 + s.phase)) * .4;
    oval(ctx, s.x * w, ((s.y + Math.log1p(height) * .00035) % 1) * h, s.r * .8, s.r * .8, '#c8d8df');
  }
  ctx.globalAlpha = 1;
  // Skybox bodies barely move with altitude: Kronos is enormous and far away.
  const skyShift = Math.log1p(height) * h * .0012;
  ctx.save(); ctx.globalAlpha = .13 + space * .32;
  planet(ctx, w * .12, -h * .16 + skyShift, Math.max(w * .58, h * .68), '#d9b889', true);
  ctx.restore();
  // From Libriam, distant Zuhal reads as a bright blue-white point, not a nearby disc.
  const zx = w * .87, zy = h * .22 + skyShift * .2;
  halo(ctx, zx, zy, 19, '#aacfff22');
  oval(ctx, zx, zy, 1.8, 1.8, '#d9eaff');
  ctx.save(); ctx.strokeStyle = '#bbd8ff55'; ctx.lineWidth = .7;
  ctx.beginPath(); ctx.moveTo(zx - 5, zy); ctx.lineTo(zx + 5, zy); ctx.moveTo(zx, zy - 6); ctx.lineTo(zx, zy + 6); ctx.stroke(); ctx.restore();
  // A fully illuminated Moon, Libriam's own sub-satellite, behind the dreamer.
  const mx = w * .69, my = h * .36 + skyShift * .35, mr = Math.min(w * .125, h * .115);
  fullMoon(ctx, mx, my, mr);
  // Broad, restrained moonlight across the clearing, not a theatrical spotlight.
  ctx.save(); ctx.globalAlpha = 1 - space * .8;
  ctx.save(); ctx.translate(mx, h * .73); ctx.scale(.8, 1.8);
  halo(ctx, 0, 0, Math.min(w * .65, h * .42), '#c3e3f00a');
  ctx.restore();
  ctx.restore();
  if (space > 0) {
    ctx.save(); ctx.globalAlpha = space * .65;
    halo(ctx, w * .82, h * .045, Math.min(w, h) * .10, '#ffba722b');
    oval(ctx, w * .82, h * .045, Math.min(w, h) * .012, Math.min(w, h) * .012, '#ffce98'); ctx.restore();
  }
  // Nearby wisps convey ascent while the celestial skybox stays almost fixed.
  if (height > .15) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const y = ((seed(i+700) + height * .19) % 1.5 - .2) * h;
      ctx.globalAlpha = Math.min(.08, height * .08) * (height > 3.4 ? .4 : 1);
      oval(ctx, w * seed(i+720), y, w * (.22 + seed(i+730)*.2), h * .025, '#b9cfe5');
    }
    if (space > .3) {
      const phase = (time + 7) % 19;
      if (phase < .65) {
        const x = w * (.16 + phase * .6), y = h * (.12 + phase * .2);
        ctx.globalAlpha = Math.sin(phase / .65 * Math.PI) * .65;
        ctx.strokeStyle = '#d2e8ff'; ctx.lineWidth = 1.2;
        ctx.beginPath();ctx.moveTo(x-w*.08,y-h*.025);ctx.lineTo(x,y);ctx.stroke();
      }
    }
    ctx.restore();
  }
  if (height > 1.3) {
    const altitude = Math.min(height, 3.4);
    const r = Math.max(h * .16, h * 2.8 / (1 + altitude * .48));
    const cy = h * .98 + r - Math.min(h * .32, (altitude - 1.3) * h * .10);
    ctx.save(); ctx.globalAlpha = smooth((height - 1.3) / 1.5) * .75;
    ctx.shadowBlur = 15; ctx.shadowColor = '#83c7ce';
    oval(ctx, w * .5, cy, r * 1.006, r * 1.006, '#83c7ce60'); ctx.shadowBlur = 0;
    const world = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    world.addColorStop(0, '#397281'); world.addColorStop(.3, '#163f57'); world.addColorStop(1, '#050d1b');
    oval(ctx, w * .5, cy, r, r, world); ctx.restore();
  }
}

const flowerColors = ['#e6e7ef', '#9575e0', '#b58be4', '#efce69', '#5798e6', '#7682ee'];
const flowerShades = [
  ['#dedfeb', '#f3f0e2', '#c9d8f2'],
  ['#8e68cf', '#b19be8', '#745bc4'],
  ['#c399eb', '#9773d2', '#b78ecf'],
  ['#f2d472', '#e9be54', '#f4e3a1'],
  ['#5598e2', '#7cb8ef', '#4579c9'],
  ['#7b8dea', '#626ed3', '#a2a4f0'],
];
function flower(ctx, x, y, size, species, color, lean = 0) {
  const top = y - size * (species === 1 ? 6 : 3.6);
  ctx.strokeStyle = '#527b6a'; ctx.lineWidth = Math.max(.5, size * .22);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - size, top + size * 2, x + lean, top); ctx.stroke();
  oval(ctx, x - size * .7, y - size * 1.3, size * 1.2, size * .36, '#4f8067', -.5);
  if (size > 1.1) oval(ctx, x + size * .7, y - size * 2, size * .95, size * .28, '#6e9774', .5);
  if (species === 1) { // Lupines: rising tiers of lavender bells.
    for (let j = 0; j < 5; j++) {
      const s = size * (1 - j * .12), yy = top + size * 2.5 - j * size * .7;
      oval(ctx, x + lean - s * .5, yy, s * .75, s * .52, color, -.3);
      oval(ctx, x + lean + s * .5, yy, s * .75, s * .52, color, .3);
    }
  } else if (species === 4) { // Nodding bluebells.
    for (let j = 0; j < 3; j++) oval(ctx, x + lean + (j % 2 ? -1 : 1) * size, top + j * size * .9, size * .75, size, color, .3);
  } else {
    const petals = species === 0 ? 8 : species === 2 ? 5 : species === 3 ? 4 : 6;
    for (let j = 0; j < petals; j++) {
      const a = j / petals * Math.PI * 2;
      oval(ctx, x + lean + Math.cos(a) * size * .85, top + Math.sin(a) * size * .85, size * .86, size * .47, color, a);
      if (size > 1.4) oval(ctx, x + lean + Math.cos(a) * size * .96, top + Math.sin(a) * size * .96 - size * .12, size * .48, size * .18, '#f0efff35', a);
    }
    oval(ctx, x + lean, top, size * .42, size * .42, species === 3 ? '#836b44' : '#dac788');
  }
}
const fields = [
  { horizon: .72, depth: .16, color: '#233d48', light: '#385660', count: 1900, size: .70 },
  { horizon: .79, depth: .34, color: '#1b3b3d', light: '#345c58', count: 2900, size: 1.10 },
  { horizon: .87, depth: .66, color: '#15332f', light: '#315749', count: 3600, size: 1.65 },
  { horizon: .95, depth: 1, color: '#102b28', light: '#244e3e', count: 2800, size: 3.0 },
];
let fieldCache;
function hillY(x, w, h, layer) {
  return h * fields[layer].horizon + Math.sin(x / w * 5 + layer * 2.2) * h * .035 + Math.cos(x / w * 8 + layer) * h * .018;
}
function buildFields(w, h) {
  const layers = fields.map((field, layer) => {
    const canvas = document.createElement('canvas'); canvas.width = w + 160; canvas.height = h + 70;
    const c = canvas.getContext('2d'); c.translate(80, 0);
    const earth = c.createLinearGradient(0, h * field.horizon - h * .05, 0, h * 1.08);
    earth.addColorStop(0, field.light); earth.addColorStop(.4, field.color); earth.addColorStop(1, '#102824');
    c.fillStyle = earth; c.beginPath(); c.moveTo(-80, h + 70);
    for (let x = -80; x <= w + 80; x += 5) c.lineTo(x, hillY(x, w, h, layer));
    c.lineTo(w + 80, h + 70); c.closePath(); c.fill();
    const count = Math.round(field.count * Math.max(.60, Math.min(2.1, w / 850)));
    // Fill a deep swathe of every hill, so no bare strips appear between layers.
    // Depth-sorting puts close petals in front; broad seed patches weave colors together.
    const blooms = Array.from({ length: count }, (_, i) => {
      const key = i + layer * 13001, x = seed(key) * (w + 160) - 80;
      const depth = seed(key + 291), base = hillY(x, w, h, layer);
      const y = base + 1 + depth * Math.max(30, h * (layer === 3 ? .18 : .17));
      const scale = field.size * (.65 + depth * 1.5) * Math.min(1.25, Math.max(.85, w / 850));
      // Mixed wildflowers within overlapping drifts of blue, purple, white, and gold.
      const patch = Math.sin(x / w * 12 + layer * 2.4) + Math.sin(depth * 7 + layer);
      const pick = seed(key + 890);
      const species = pick < .5 ? (patch > .7 ? 4 : patch < -.6 ? 1 : layer % 2 ? 3 : 0) : Math.floor(seed(key + 778) * 6);
      return { x, y, scale, species, key, depth };
    }).sort((a, b) => a.y - b.y);
    for (const bloom of blooms) {
      const { x, y, scale, species, key, depth } = bloom;
      if (y - scale * 7 > h + 70) continue;
      c.globalAlpha = .64 + depth * .31;
      const color = flowerShades[species][Math.floor(seed(key + 582) * 3)];
      flower(c, x, y, scale, species, color, (seed(key + 76) - .5) * scale);
      if (key % 4 === 0) {
        c.strokeStyle = '#73957836'; c.lineWidth = .7; c.beginPath(); c.moveTo(x + 5, y + 3); c.quadraticCurveTo(x + 2, y - scale * 3, x + 7, y - scale * 5); c.stroke();
      }
    }
    c.globalAlpha = 1;
    return canvas;
  });
  return { w, h, layers };
}
export function drawGrass(ctx, w, h, camera, impact = 0, restingX = .5, time = 0, reduced = false) {
  if (!fieldCache || fieldCache.w !== w || fieldCache.h !== h) fieldCache = buildFields(w, h);
  for (const [layer, field] of fields.entries()) {
    const vertical = camera * h * field.depth;
    if (h * field.horizon + vertical > h + 70) continue;
    // Nearby flowers travel faster than the far hills. Small wind adds quiet life.
    const wind = reduced ? 0 : Math.sin(time * .17 + layer) * (1 + layer * .8);
    const horizontal = -Math.sin(camera * .5) * 34 * field.depth + wind;
    ctx.drawImage(fieldCache.layers[layer], -80 + horizontal, vertical);
  }
  const ground = h * .89 + camera * h;
  if (ground < h * 1.2) {
    oval(ctx, w * restingX, ground + 3, Math.min(w * .18, 160), 10, '#132e27');
    halo(ctx, w * .57, ground - h * .07, Math.min(w, h) * .43, '#c9e6db0d');
    if (impact > 0) {
      ctx.save(); ctx.globalAlpha = impact * .35;
      for (let i = 0; i < 12; i++) {
        const x = w * restingX + Math.sin(i * 7) * (1 - impact) * 130;
        oval(ctx, x, ground - Math.sin((1 - impact) * Math.PI) * (18 + i * 2), 2, 1, flowerColors[i % 6], i);
      }
      ctx.restore();
    }
  }
  // Moonlit night exposure across the landscape; retain the cool petal colors.
  ctx.fillStyle = '#020b24'; ctx.globalAlpha = .47; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
  // Just a handful of fireflies, softly breathing over the flower fields.
  const visibility = 1 - smooth(camera / 1.2);
  if (visibility > 0) {
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const t = reduced ? 0 : time;
      const x = (seed(i + 23) * .9 + .05) * w + Math.sin(t * .23 + i * 2) * 13;
      const y = h * (.73 + seed(i + 18) * .23) + camera * h * .5 + Math.cos(t * .19 + i) * 9;
      ctx.globalAlpha = visibility * (.18 + .42 * (.5 + .5 * Math.sin(t * .7 + i * 3)));
      halo(ctx, x, y, 12, '#dae99455'); oval(ctx, x, y, 1.1, 1.1, '#f1edb3');
    }
    ctx.restore();
  }
}
