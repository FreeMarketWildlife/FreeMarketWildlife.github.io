// Buttonwood scenery is pure presentation of the existing settlement clock.
(function () {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const P = A.palette;
  const S = A.skyPalette = Object.freeze({
    dawnSky: '#77728e', dawnHorizon: '#db9b9a', dawnCloud: '#d4abb5',
    dawnCloudShade: '#a8849a', dawnHill: '#8b8c91', dawnNearHill: '#787e7c',
    sunriseSky: '#b9c3bb', sunriseHorizon: '#f3cfa2', sunriseCloud: '#f5dcc0',
    sunriseCloudShade: '#dfae93', sunriseHill: '#afbba1', sunriseNearHill: '#91a084',
    sunsetSky: '#b9b5bd', sunsetHorizon: '#efba88', sunsetCloud: '#f7d5ac',
    sunsetCloudShade: '#d99b85', sunsetHill: '#aaa899', sunsetNearHill: '#938e80',
    duskSky: '#77768f', duskHorizon: '#d49a9c', duskCloud: '#d7afb6',
    duskCloudShade: '#ac819a', duskHill: '#878b91', duskNearHill: '#727a7c'
  });
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const key = (at, sky, horizon, cloud, cloudShade, hill, nearHill) => ({
    at, colors: Object.fromEntries(Object.entries({sky, horizon, cloud, cloudShade, hill, nearHill}).map(([k, v]) => [k, rgb(v)]))
  });
  const night = at => key(at, P.nightSky, P.nightHorizon, P.nightCloud, P.nightHill, P.nightHill, P.nightNearHill);
  const day = at => key(at, P.sky, P.horizon, P.creamLight, P.creamShade, P.hill, P.nearHill);
  const keys = [
    night(0),
    key(9, S.dawnSky, S.dawnHorizon, S.dawnCloud, S.dawnCloudShade, S.dawnHill, S.dawnNearHill),
    key(20, S.sunriseSky, S.sunriseHorizon, S.sunriseCloud, S.sunriseCloudShade, S.sunriseHill, S.sunriseNearHill),
    day(30), day(150),
    key(160, S.sunsetSky, S.sunsetHorizon, S.sunsetCloud, S.sunsetCloudShade, S.sunsetHill, S.sunsetNearHill),
    key(172, S.duskSky, S.duskHorizon, S.duskCloud, S.duskCloudShade, S.duskHill, S.duskNearHill),
    night(180), night(240)
  ];

  // All inputs and outputs are seconds. The game still owns its 180s day / 60s night.
  A.skyState = function (seconds, dayNumber = 1) {
    const input = Number.isFinite(seconds) ? seconds : 0;
    const cycle = Math.floor(input / 240);
    const t = ((input % 240) + 240) % 240;
    const absoluteSeconds = (Math.max(1, Number.isFinite(dayNumber) ? dayNumber : 1) - 1 + cycle) * 240 + t;
    let i = 1;
    while (i < keys.length - 1 && t > keys[i].at) i++;
    const a = keys[i - 1], b = keys[i];
    const blend = smooth((t - a.at) / (b.at - a.at));
    const colors = {};
    for (const name of Object.keys(a.colors)) colors[name] = mix(a.colors[name], b.colors[name], blend);
    const darkness = t < 30 ? 1 - smooth(t / 30) : t < 150 ? 0 : t < 180 ? smooth((t - 150) / 30) : 1;
    const warmth = t < 30 ? Math.sin(Math.PI * t / 30) : t < 150 ? 0 : t < 180 ? Math.sin(Math.PI * (t - 150) / 30) : 0;
    colors.cave = mix(rgb(P.cave), rgb(P.nightCave), darkness);
    const phase = t < 30 ? 'sunrise' : t < 150 ? 'day' : t < 180 ? 'sunset' : 'night';
    return {
      seconds: t, absoluteSeconds, phase, darkness, warmth, colors,
      tint: {color: css(mix(rgb(P.coralLight), rgb(P.nightSky), darkness)), alpha: Math.max(darkness * .22, warmth * .075)},
      sunAlpha: smooth(t / 7) * (1 - smooth((t - 170) / 10)) * (t < 180 ? 1 : 0),
      moonAlpha: t < 30 ? 1 - smooth(t / 30) : t < 150 ? 0 : t < 180 ? smooth((t - 150) / 30) : 1,
      starAlpha: darkness * darkness
    };
  };

  // Coordinates are already in world pixels. The caller applies camera zoom once.
  A.paintSky = function (g, options) {
    const {seconds = 0, day = 1, camX = 0} = options;
    const state = A.skyState(seconds, day);
    const width = Math.max(0, Math.ceil(Number.isFinite(options.width) ? options.width : 0));
    const height = Math.max(0, Math.ceil(Number.isFinite(options.height) ? options.height : 0));
    const ground = Math.round(Number.isFinite(options.ground) ? options.ground : 0);
    const skyHeight = Math.max(0, Math.min(height, ground));
    const oldAlpha = g.globalAlpha;
    g.save();
    g.globalAlpha = 1;
    g.fillStyle = css(state.colors.cave);
    g.fillRect(0, 0, width, height);
    if (!width || !skyHeight) { g.restore(); g.globalAlpha = oldAlpha; return state; }
    const rect = (x, y, w, h, color, alpha = 1) => {
      const left = Math.max(0, Math.round(x)), top = Math.max(0, Math.round(y));
      const right = Math.min(width, Math.round(x + w)), bottom = Math.min(skyHeight, Math.round(y + h));
      if (right <= left || bottom <= top || alpha <= 0) return;
      g.globalAlpha = clamp(alpha);
      g.fillStyle = Array.isArray(color) ? css(color) : color;
      g.fillRect(left, top, right - left, bottom - top);
    };
    // Broad, discrete color planes keep pixel scenery crisp while their palette evolves.
    const bands = [0, .18, .36, .56, .74, .90, 1];
    for (let i = 0; i < bands.length - 1; i++) {
      const top = Math.round(ground * bands[i]), bottom = Math.round(ground * bands[i + 1]);
      rect(0, top, width, bottom - top, mix(state.colors.sky, state.colors.horizon, i / (bands.length - 2)));
    }
    const camY = Number.isFinite(options.camY) ? options.camY : 0;
    const skyGround = ground + camY * .96;
    const skySpan = Math.max(100, ground + camY);
    const drift = Number.isFinite(camX) ? camX : 0;
    const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const targets = A.paintWinterStars ? A.paintWinterStars(g,options,rect) : [];
    A.lastSkyObjects=targets;
    if(A.paintMeteorShower)A.paintMeteorShower(g,options,rect);
    const disc = (x, y, r, color, alpha) => {
      // Fixed integer scanlines create a deliberately stepped, unblurred disc.
      for (let row = -r; row <= r; row++) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - row * row)));
        rect(x - half, y + row, half * 2 + 1, 1, color, alpha);
      }
    };
    const sunT = clamp(state.seconds / 180);
    const sunX = Math.round(width * (.14 + sunT * .72));
    const sunY = Math.round(skyGround - 18 - Math.sin(Math.PI * sunT) * skySpan * .65);
    if (state.sunAlpha > .1 && sunY>=0 && sunY<skyHeight) targets.push({key:'sun',kind:'sun',name:'Sun',fact:'Our nearest star. Eight light-minutes away!',x:sunX,y:sunY,radius:9});
    if (state.sunAlpha > 0) {
      if (state.warmth > 0) {
        rect(sunX - 20, sunY - 8, 41, 17, P.gold, state.sunAlpha * state.warmth * .14);
        rect(sunX - 14, sunY - 14, 29, 29, P.gold, state.sunAlpha * state.warmth * .1);
      }
      disc(sunX, sunY, 9, P.creamLight, state.sunAlpha);
      rect(sunX - 6, sunY + 5, 13, 2, P.gold, state.sunAlpha * .55);
    }
    const moonSeconds = state.seconds < 30 ? state.seconds + 240 : state.seconds;
    const moonT = clamp((moonSeconds - 150) / 120);
    const moonX = Math.round(width * (.12 + moonT * .75));
    const moonY = Math.round(skyGround + 8 - Math.sin(Math.PI * moonT) * skySpan * .68);
    if (state.moonAlpha > .1 && moonY>=0 && moonY<skyHeight) targets.push({key:'moon',kind:'moon',name:'Moon',fact:'The same side faces Earth. A loyal little face!',x:moonX,y:moonY,radius:7});
    if (state.moonAlpha > 0) {
      if(A.lunar){
        // Dawn retains the previous night's phase; a new phase begins at dusk.
        const nightDay=state.seconds<30?Math.max(1,day-1):day;
        g.globalAlpha=state.moonAlpha*.9;
        A.lunar.paint(g,moonX,moonY,7,A.lunar.phaseForNight(nightDay),!!A.meteorSkyState?.active);
      }else{
        disc(moonX, moonY, 7, P.cream, state.moonAlpha * .9);
        rect(moonX - 3, moonY - 2, 2, 2, P.creamShade, state.moonAlpha * .65);
        rect(moonX + 1, moonY + 2, 3, 2, P.creamShade, state.moonAlpha * .6);
      }
    }
    // Two airy banks: cream light on top, a peach/lavender underside at twilight.
    const cloudPeriod = 296;
    const cloudShift = ((state.absoluteSeconds * .38 + drift * .045) % cloudPeriod + cloudPeriod) % cloudPeriod;
    for (let tile = -1; tile <= Math.ceil(width / cloudPeriod); tile++) {
      const base = tile * cloudPeriod - cloudShift;
      const cloud = (x, y, variant) => {
        const shape=[[x+8,y+5,48+variant*7,6],[x,y+3,61+variant*6,4],[x+8,y,45+variant*5,5],[x+18,y-4,20+variant*3,5],[x+39,y-1,15,5]];
        if(y+11>0&&y-4<skyHeight)targets.push({key:'cloud:'+tile+':'+variant,kind:'cloud',name:'Cloud',fact:'Tiny water drops or ice crystals. Sky confetti!',x:x+30,y:y+3,contains:p=>p.y<skyHeight&&shape.some(([xx,yy,w,h])=>p.x>=xx&&p.x<xx+w&&p.y>=yy&&p.y<yy+h)});
        const alpha = .85 - state.darkness * .21;
        rect(x + 8, y + 5, 48 + variant * 7, 6, state.colors.cloudShade, alpha);
        rect(x, y + 3, 61 + variant * 6, 4, state.colors.cloud, alpha);
        rect(x + 8, y, 45 + variant * 5, 5, state.colors.cloud, alpha);
        rect(x + 18, y - 4, 20 + variant * 3, 5, state.colors.cloud, alpha);
        rect(x + 39, y - 1, 15, 5, state.colors.cloud, alpha);
      };
      cloud(base + 33, Math.round((ground + camY) * .27 - camY * .06), 0);
      cloud(base + 173, Math.round((ground + camY) * .48 - camY * .10), 1);
    }
    // Gallery callers without biome inputs retain the approved meadow baseline.
    if (options.biomeWeights && A.paintBiomeScenery) {
      A.paintBiomeScenery(g, {width, height, ground, camX: drift, camY, state,
        weights: options.biomeWeights, seed: options.biomeSeed || 0, targets});
    } else for (const layer of [0, 1]) {
      const step = layer ? 8 : 12;
      const parallax = drift * (layer ? .11 : .065);
      const color = layer ? state.colors.nearHill : state.colors.hill;
      for (let x = 0; x < width; x += step) {
        const wave = Math.sin((x + parallax) / (layer ? 57 : 91)) * (layer ? 5 : 9)
          + Math.sin((x + parallax + 37) / (layer ? 113 : 169)) * (layer ? 3 : 6);
        const rise = Math.max(3, Math.round((layer ? 10 : 25) + wave));
        rect(x, ground - rise, Math.min(step, width - x), rise, color);
      }
    }
    g.restore();
    g.globalAlpha = oldAlpha;
    return state;
  };
})();
