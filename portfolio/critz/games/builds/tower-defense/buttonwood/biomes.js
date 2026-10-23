// Native backdrop family. Art Bible §§3–4, 8, 10–12: clustered silhouettes,
// quiet distant planes, named palette, and one source pixel per world unit.
(function () {
  'use strict';
  const A = window.ButtonwoodArt, P = A.palette;
  const clamp = x => Math.max(0, Math.min(1, x));
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const tokens = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, rgb(v)]));
  const hash = (seed, n) => window.ButtonwoodBiomes.hash(seed, n);

  // Uses only integer rectangles. The engine composites the whole sky before
  // applying fractional camera zoom, so touching shapes cannot acquire seams.
  A.paintBiomeScenery = function (g, options) {
    const {state, seed = 0, weights = {mountains: 1}} = options;
    const width = Math.max(0, Math.ceil(options.width)), height = Math.max(0, Math.ceil(options.height));
    const ground = Math.round(options.ground), bottom = Math.min(height, ground);
    if (!width || bottom <= 0 || !state) return;
    const camX = Number.isFinite(options.camX) ? options.camX : 0;
    const camY = Number.isFinite(options.camY) ? options.camY : 0;
    let depth = 1;
    const darkness = state.darkness, phase = state.absoluteSeconds;
    const oldAlpha = g.globalAlpha;
    let weight = 1, recording = null;
    const register=(key,kind,name,fact,shape)=>{if(!options.targets||weight<=.15||!shape.length)return;const first=shape[0];options.targets.push({key,kind,name,fact,x:first[0]+first[2]/2,y:first[1]+first[3]/2,contains:p=>shape.some(([x,y,w,h])=>p.x>=x&&p.x<x+w&&p.y>=y&&p.y<y+h)})};
    const target=(key,kind,name,fact,draw)=>{const previous=recording,shape=[];recording=shape;draw();recording=previous;register(key,kind,name,fact,shape)};
    g.save();
    const rect = (x, y, w, h, color, alpha = 1) => {
      const left = Math.max(0, Math.round(x)), top = Math.max(0, Math.round(y + camY * (1 - depth)));
      const right = Math.min(width, Math.round(x + w)), end = Math.min(bottom, Math.round(y + h + camY * (1 - depth)));
      if (right <= left || end <= top || alpha <= 0) return;
      g.globalAlpha = clamp(alpha * weight); g.fillStyle = color;
      g.fillRect(left, top, right - left, end - top);
      if(recording)recording.push([left,top,right-left,end-top]);
    };
    const color = (token, distance, shade = 0) => {
      const lit = mix(tokens[token], state.colors.horizon, distance);
      const night = mix(state.colors.nearHill, state.colors.hill, distance);
      return css(mix(mix(lit, night, darkness * .88), state.colors.nearHill, shade));
    };
    const ellipse = (x, y, rx, ry, fill) => {
      // Two-pixel scanline groups are deliberate crown contours, never resampled art.
      for (let dy = -ry; dy < ry; dy += 2) {
        const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - ((dy + 1) / ry) ** 2)));
        rect(x - half, y + dy, half * 2 + 1, 2, fill);
      }
    };
    const screenX = (x, parallax) => Math.round(x - camX * parallax + width / 2);
    const repeat = (period, parallax, fn, padding = period) => {
      depth = parallax;
      const left = camX * parallax - width / 2;
      for (let n = Math.floor((left - padding) / period); n <= Math.ceil((left + width + padding) / period); n++) fn(n);
    };
    const hills = (parallax, base, amplitude, period, fill, salt = 0) => {
      depth = parallax;
      const offset = hash(seed, salt) * 2000;
      for (let x = 0; x < width; x += 3) {
        const q = x - width / 2 + camX * parallax + offset;
        const rise = Math.round(base + Math.sin(q / period) * amplitude + Math.sin(q / (period * 2.3) + 1.4) * amplitude * .45);
        rect(x, ground - rise, Math.min(3, width - x), rise + Math.max(0,-camY * (1 - depth)), fill);
      }
    };
    const pine = (x, baseline, h, fill, light) => {
      rect(x - 1, baseline - h, 2, h, fill);
      for (let tier = 0; tier < 4; tier++) {
        const top = baseline - h + tier * h * .17, reach = 3 + tier * 2;
        for (let row = 0; row < h * .33; row += 2) {
          const half = Math.round(1 + row / h * reach * 2);
          rect(x - half, top + row, half * 2 + 1, 2, fill);
          if (row > 3 && row < h * .2) rect(x - half, top + row, 2, 2, light);
        }
      }
    };
    const crown = (x, top, w, h, fill, light, salt) => {
      ellipse(x, top + h * .55, w * .5, h * .45, fill);
      ellipse(x - w * .27, top + h * .51, w * .32, h * .33, fill);
      ellipse(x + w * .27, top + h * .49, w * .33, h * .34, fill);
      ellipse(x - w * .12, top + h * .3, w * .32, h * .3, fill);
      // Broad upper-left light clusters, leaving the lower crown a quiet mass.
      ellipse(x - w * .15, top + h * .24, w * .22, h * .18, light);
      ellipse(x - w * .39, top + h * .42, w * .17, h * .15, light);
      if (hash(seed, salt) > .5) ellipse(x + w * .22, top + h * .35, w * .15, h * .15, light);
    };
    const mountains = () => {
      const ranges = [
        {p: .035, period: 378, min: 117, max: 86, base: 19, fill: color('deepLight', .72), face: color('stone', .79), snow: color('creamLight', .61)},
        {p: .08, period: 312, min: 100, max: 61, base: 17, fill: color('mintShade', .70), face: color('stoneShade', .75), snow: color('cream', .67)}
      ];
      for (const [layer, r] of ranges.entries()) {
        repeat(r.period, r.p, n => {
          const h = r.min + hash(seed ^ (layer * 171), n + 94) * r.max;
          const center = n * r.period + (hash(seed, n + layer * 31) - .5) * r.period * .3;
          const x0 = screenX(center - r.period * .65, r.p), x1 = screenX(center, r.p), x2 = screenX(center + r.period * .74, r.p);
          const peak = ground - h, snowShape=[];
          if(options.targets && weight>.15)options.targets.push({key:'mountain:'+layer+':'+n,kind:'mountain',name:'Mountain',fact:'Higher air is usually colder. Bring mittens!',x:x1,y:peak+camY*(1-r.p)+16,contains:p=>{if(p.x<x0||p.x>x2||p.y>=bottom)return false;const t=clamp(p.x<x1?(p.x-x0)/(x1-x0):(x2-p.x)/(x2-x1)),shoulder=t<.4?t*.77:.308+(t-.4)*1.154,rise=Math.round(r.base+shoulder*(h-r.base));return p.y>=ground-rise+camY*(1-r.p)}});
          for (let x = x0; x <= x2; x += 2) {
            const left = x < x1, t = clamp(left ? (x - x0) / (x1 - x0) : (x2 - x) / (x2 - x1));
            const shoulder = t < .4 ? t * .77 : .308 + (t - .4) * 1.154;
            const rise = Math.round(r.base + shoulder * (h - r.base));
            rect(x, ground - rise, 2, rise + Math.max(0,-camY * (1 - depth)), left ? r.fill : r.face);
            if (rise > h * .76) {
              const snow = Math.min(rise - h * .76, 9 + Math.sin((x - x1) / 11) * 5 + (left ? 4 : 0));
              recording=snowShape;rect(x, ground - rise, 2, snow, r.snow);recording=null;
            }
            if (!left && t > .27 && t < .69) {
              const notch = Math.round(peak + (1 - t) * h * 1.04);
              rect(x, notch, 2, 4, r.fill);
            }
          }
          register('snow:'+layer+':'+n,'snow','Mountain snow','Cold summits keep their snow. Tiny white hats!',snowShape);
        });
      }
      const haze = css(mix(state.colors.hill, state.colors.horizon, .35));
      rect(0, ground - 47, width, 12, haze, .35);
      hills(.15, 40, 17, 109, color('mintShade', .62), 991);
      const tree = color('mintShade', .55), light = color('mint', .53);
      repeat(51, .19, n => {
        const x = screenX(n * 51 + hash(seed, n + 39) * 24, .19);
        const h = 22 + Math.floor(hash(seed, n + 123) * 23);
        target('tree:mountains:'+n,'tree','Pine tree','Keeps its needles through winter. Cozy green coat!',()=>pine(x, ground - 13, h, tree, light));
      });
      hills(.27, 12, 5, 68, color('grassShade', .58), 351);
    };
    const plains = () => {
      hills(.035, 62, 23, 160, color('mint', .75), 113);
      hills(.075, 44, 16, 115, color('grass', .72), 227);
      const tree = color('mintShade', .69), light = color('mint', .68), trunk = color('woodShade', .80);
      repeat(217, .12, n => {
        const x = screenX(n * 217 + hash(seed, n + 95) * 82, .12);
        target('tree:plains:'+n,'tree','Tree','Leaves use sunlight to make food. Solar snacks!',()=>{
        const h = 34 + Math.floor(hash(seed, n + 554) * 20), floor = ground - 26;
        rect(x - 2, floor - h + 15, 4, h - 15, trunk);
        rect(x - 9, floor - h + 28, 10, 3, trunk);
        crown(x, floor - h, 48 + hash(seed, n + 914) * 20, 31, tree, light, n);
        if (hash(seed, n + 102) > .3) {
          rect(x + 40, floor - 20, 3, 21, trunk);
          crown(x + 40, floor - 39, 40, 26, tree, light, n + 1);
        }
        });
      });
      hills(.18, 24, 11, 151, color('grass', .64), 863);
      hills(.27, 11, 4, 74, color('grassShade', .61), 826);
      const meadow = color('grassLight', .68);
      repeat(58, .25, n => {
        const x = screenX(n * 58 + hash(seed, n + 991) * 12, .25), y = ground - 12;
        rect(x, y, 13, 1, meadow); rect(x + 4, y - 2, 8, 1, meadow);
      });
    };
    const jungle = () => {
      hills(.035, 85, 25, 159, color('mintShade', .83), 812);
      for (const layer of [0, 1, 2]) {
        const p = [.055, .12, .22][layer], period = [110, 147, 187][layer];
        const distance = [.80, .69, .58][layer];
        const fill = color('grassShade', distance), light = color('mintShade', distance + .025);
        const trunk = color('woodShade', distance + .06), vine = color('grassShade', distance + .03);
        repeat(period, p, n => {
          const salt = n + layer * 99, x = screenX(n * period + hash(seed, salt + 44) * period * .45, p);
          target('tree:jungle:'+layer+':'+n,'tree','Jungle tree','Leaves catch sunshine. A leafy solar kitchen!',()=>{
          const h = [88, 117, 150][layer] + hash(seed, salt + 410) * [50, 55, 74][layer];
          const top = ground - h, floor = ground - 9;
          const trunkWidth = [4, 6, 8][layer], w = [85, 117, 147][layer] + hash(seed, salt + 632) * 21;
          rect(x - trunkWidth / 2, top + 18, trunkWidth, floor - top - 18, trunk);
          // The narrow fork and buttress roots explain the rounded foliage above.
          rect(x - trunkWidth / 2 - 2, floor - 10, trunkWidth + 4, 10, trunk);
          rect(x - 19, top + 33, 21, 4, trunk); rect(x + 1, top + 41, 18, 4, trunk);
          crown(x, top, w, 55 + layer * 10, fill, light, salt);
          if (layer) {
            const length = 23 + hash(seed, salt + 765) * 24;
            rect(x - w * .26, top + 39, 1, length, vine);
            rect(x - w * .26 - 2, top + 39 + length, 3, 2, vine);
            rect(x + w * .3, top + 44, 1, length * .75, vine);
          }
          if (layer === 2 && hash(seed, salt) > .35) crown(x + 41, ground - 54, 70, 40, fill, light, salt + 1);
          });
        }, period * 1.3);
        if (layer < 2) rect(0, ground - 36 - layer * 12, width, 14, css(state.colors.hill), .20);
      }
      hills(.29, 16, 5, 66, color('grassShade', .56), 772);
    };
    const ocean = () => {
      depth = .055;
      const horizon = ground - 91, sea = color('water', .51), farSea = color('waterLight', .58);
      rect(0, horizon, width, 91, farSea);
      rect(0, horizon + 16, width, 75, color('water', .66));
      rect(0, horizon + 37, width, 54, color('water', .58));
      rect(0, horizon + 63, width, 28, sea);
      rect(0, horizon, width, 1, color('creamLight', .64));
      // Low islands sit in the water plane, visibly separate from the playable land.
      repeat(421, .055, n => {
        const center = screenX(n * 421 + hash(seed, n + 501) * 100, .055);
        const span = 82 + hash(seed, n + 804) * 97, h = 16 + hash(seed, n + 901) * 35;
        for (let x = -span; x < span; x += 3) {
          const t = Math.max(0, 1 - Math.abs(x / span));
          const rise = Math.round(t * h + Math.sin(t * Math.PI) * 6);
          rect(center + x, horizon + 4 - rise, 3, rise, color('mintShade', .78));
        }
        rect(center - span * .7, horizon + 4, span * 1.4, 2, color('stoneLight', .77));
        if(h>29)target('tree:ocean:'+n,'tree','Palm tree','Fronds are leaves. A tiny seaside sun umbrella!',()=>{const y=horizon+4-h,x=center;rect(x,y-19,2,20,color('woodShade',.80));for(let side of [-1,1])for(let step=0;step<5;step++){rect(x+side*step*3,y-22+Math.floor(step*step/5),4,2,color('mintShade',.73));rect(x+side*step*2,y-26+step,3,2,color('mint',.74))}});
      });
      const ripple = color('waterLight', .48), shadow = color('waterShade', .75);
      for (let band = 0; band < 6; band++) {
        const p = .065 + band * .018, y = horizon + 12 + band * 12;
        repeat(121 + band * 19, p, n => {
          const step = Math.floor(phase / 1.7), drift = (step + n * 7 + band * 3) % 9;
          const x = screenX(n * (121 + band * 19) + hash(seed, n + band * 43) * 42 + drift, p);
          const length = 10 + band * 3 + Math.floor(hash(seed, n + band * 17) * 18);
          rect(x, y, length, 1, ripple, .75);
          if (band > 1) rect(x + 19, y + 5, length * .6, 1, shadow, .40);
        });
      }
      hills(.21, 13, 5, 98, color('stoneLight', .60), 951);
      hills(.28, 6, 2, 73, color('mintShade', .62), 195);
    };
    for (const [id, draw] of Object.entries({mountains, plains, jungle, ocean})) {
      weight = clamp(Number(weights[id]) || 0);
      if (weight > .001) draw();
    }
    g.restore(); g.globalAlpha = oldAlpha;
  };
})();
