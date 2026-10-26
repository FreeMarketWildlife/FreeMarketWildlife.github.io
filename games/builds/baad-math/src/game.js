import { rational, addUnit, transformExact, numeric, exactText, matches } from './exact.js';
import { commitCrossing } from './counting.js';
import { FLOCK, BY_ID, createProgression, planEncounter, displayOperation } from './flock.js';
import { bindCounting, encounterPreview, operationCountTime } from './controls.js';
import { readCollection, recordSheep, renderCollection } from './collection.js';
import { waveInterval } from './pacing.js';
import { drawPerfectBubble } from './sheep-callout.js';
import { createLevitation, stepLevitation, cameraHeight } from './levitation.js';
import { drawDreamSky, drawGrass } from './dream-sky.js';
import { slowArithmetic } from './music.js';
import { FINALE_DURATION, runStats, attackBeat, drawHunter } from './finale.js';
import { drawSheep } from './sheep.js';
import { apply, tolerance, stepRage, countColor, observeAnticipation, isPerfectCrossing, calmForPerfect, countingError, countFeedback, creditCountedSheep } from './rules.js';
import { DreamSounds } from './sound.js';
import { launchFlight, advanceFlight, flightIsGone, FIXED_STEP, launchGap, enterFlight, sheepRadius } from './physics.js';

const $ = id => document.getElementById(id);
const canvas = $('night'), ctx = canvas.getContext('2d');
const colors = Object.fromEntries(FLOCK.map(s => [s.id, s.color]));
let storage; try { storage = localStorage; } catch {}
const collection = readCollection(storage);
const stars = Array.from({ length: 130 }, () => ({
  x: Math.random(), y: Math.random() * .8, r: Math.random() * 1.4 + .3, phase: Math.random() * 6,
}));
let w, h, dpr;
let mode = 'endless', status = 'menu', count = 0, target = 0, plannedTarget = 0;
let mismatchTime = 0;
let exactCount = rational();
let completedRound = null;
let peak = 0, finaleTime = 0, victims = [], biteIndex = -1;
let levitation = createLevitation();
let n = 0, launched = 0, elapsed = 0, rage = 0;
let perfectHits = 0, perfectScore = 0;
let introductions = createProgression();
let revealed = new Set(), cueUntil = 0;
let graceScale = .05;
let next = .45, grace = 0, orbs = [], particles = [], rings = [], lastSide = 1;
const sounds = new DreamSounds();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let previous = performance.now(), lastOp = -10;
let accumulator = 0, visualTime = 0, countKick = 0, crossingGlow = 0, tapGlow = 0, tapSide = 1;

function resize() {
  w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio, 2);
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

function screens(id) {
  for (const name of ['menu', 'play', 'result', 'paused', 'collection']) $(name).hidden = name !== id;
  $('footer').hidden = id === 'play';
  $('pause').disabled = id !== 'play';
  $('collectionButton').disabled = id === 'finale' || id === 'collection';
  $('danger').style.opacity = id === 'play' ? rage * .85 : 0;
}

function begin(m) {
  mode = 'endless'; m = mode; status = 'playing';
  controls.stop();
  $('double').hidden = $('halve').hidden = true;
  mismatchTime = 0;
  exactCount = rational();
  completedRound = null;
  peak = 0; finaleTime = 0; victims = []; biteIndex = -1;
  count = target = plannedTarget = n = launched = elapsed = rage = 0;
  levitation = createLevitation();
  perfectHits = perfectScore = 0; introductions = createProgression();
  revealed = new Set(); cueUntil = 0;
  for (const id of ['double', 'halve', 'encounter']) $(id).getAnimations().forEach(animation => animation.cancel());
  next = .45; grace = 0; accumulator = 0; orbs = []; particles = []; rings = [];
  $('encounter').textContent = '';
  $('operation').replaceChildren();
  lastOp = -10; countKick = crossingGlow = tapGlow = 0;
  $('modeLabel').textContent = 'TIME SURVIVED';
  sounds.start();
  screens('play'); update();
}

function nextSheep() { return orbs.find(orb => orb.entered && !orb.crossed); }
function update() {
  const seconds = Math.floor(elapsed);
  $('time').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  $('count').textContent = exactText(exactCount);
  const feedback = countFeedback(count, target, orbs, exactCount);
  $('count').dataset.feedback = feedback.kind;
  $('count').style.color = feedback.kind === 'ready' ? '#b8ffcf' : countColor(count, target);
  $('count').style.transform = `scale(${1 + countKick * .08})`;
  $('sheep').textContent = n;
  $('runScore').textContent = (n * 100 + perfectScore + Math.floor(elapsed) * 10).toLocaleString();
  $('state').textContent = feedback.kind === 'ready' ? 'READY FOR NEXT' : levitation.space ? 'DRIFTING IN SPACE' : levitation.falling ? 'FALLING' : levitation.height > 0 ? 'DREAMING HIGHER' : feedback.kind === 'error' && rage > .7 ? 'WAKING UP' : feedback.kind === 'error' && rage > .3 ? 'RESTLESS' : 'SOUND ASLEEP';
  if (feedback.kind === 'ready') $('feedback').textContent = '✓ Ready for the next sheep';
  else if (feedback.kind === 'current') $('feedback').textContent = '✓ Current count matched';
  else $('feedback').textContent = 'Adjust your count · rage is rising';
  $('danger').style.opacity = feedback.kind === 'error' ? rage * (.65 + .2 * Math.sin(visualTime * (4 + rage * 5))) : 0;
  $('operation').style.opacity = Math.max(0, 1 - (elapsed - lastOp) / .65);
  $('operation').style.transform = `translate(-50%, ${-(elapsed - lastOp) * 12}px)`;
  $('pace').textContent = elapsed < 15 ? 'SETTLE IN' : elapsed < 30 ? 'DREAM DEEPER' : elapsed < 60 ? 'QUICKENING' : 'FEVER DREAM';
  document.documentElement.style.setProperty('--tap-left', tapSide < 0 ? tapGlow * .1 : 0);
  document.documentElement.style.setProperty('--tap-right', tapSide > 0 ? tapGlow * .1 : 0);
}

function finish() {
  controls.stop();
  completedRound = { count: exactText(exactCount), target: String(target) };
  status = 'finale'; finaleTime = 0; accumulator = 0; biteIndex = -1;
  victims = orbs.map(orb => ({ ...orb, trail: [] }));
  screens('finale'); sounds.finish(false);
}
function showResult() {
  status = 'result'; screens('result');
  const stats = runStats({ sheep: n, perfect: perfectHits, peak, seconds: elapsed, perfectScore });
  $('stars').textContent = stats.score.toLocaleString();
  $('resultCount').textContent = completedRound.count;
  $('resultSheep').textContent = completedRound.target;
  $('again').focus({ preventScroll: true });
}

function tap(delta, event, transformed = null) {
  if (status !== 'playing') return;
  exactCount = transformed ?? addUnit(exactCount, delta, levitation.space);
  count = numeric(exactCount); countKick = 1; tapGlow = 1; tapSide = delta;
  rings.push({ x: event?.clientX ?? w * (delta > 0 ? .78 : .22), y: event?.clientY ?? h * .78, age: 0 });
  observeAnticipation(nextSheep(), count, exactCount);
  creditCountedSheep(orbs, count, exactCount);
  sounds.tap(delta); update();
}
function transformPlayer(op, button) {
  if (status !== 'playing' || button.hidden) return;
  controls.stop();
  const transformed = transformExact(exactCount, op);
  const after = numeric(transformed);
  if (!Number.isFinite(after) || Math.abs(after) > Number.MAX_SAFE_INTEGER) return;
  tap(after - count, undefined, transformed);
}
$('double').onclick = () => transformPlayer('×2', $('double'));
$('halve').onclick = () => transformPlayer('÷2', $('halve'));
const controls = bindCounting({ minus: $('minus'), plus: $('plus'), tap, active: () => status === 'playing' });
for (const button of document.querySelectorAll('[data-mode]')) button.onclick = () => begin(button.dataset.mode);
function pause() {
  if (status !== 'playing') return;
  controls.stop();
  status = 'paused'; accumulator = 0; sounds.pause(); screens('paused');
}
$('pause').onclick = pause;
$('resume').onclick = () => { sounds.resume(); status = 'playing'; accumulator = 0; screens('play'); };
function home() {
  controls.stop(); sounds.stopMusic();
  levitation = createLevitation();
  status = 'menu'; orbs = []; particles = []; rings = []; screens('menu');
  $('best').textContent = '';
}
$('home').onclick = home; $('quit').onclick = home; $('again').onclick = () => begin(mode);
function soundLabel() {
  $('sound').textContent = sounds.enabled ? '♫ On' : '♫ Off';
  $('sound').setAttribute('aria-pressed', String(sounds.enabled));
  $('sound').setAttribute('aria-label', sounds.enabled ? 'Mute sound' : 'Enable sound');
}
$('sound').onclick = () => { sounds.toggle(); soundLabel(); if (sounds.enabled) sounds.baa(); };
soundLabel();
addEventListener('keydown', e => {
  if (!['Escape', ' '].includes(e.key) || e.repeat) return;
  if (e.target.tagName === 'BUTTON' && e.key === ' ') return;
  e.preventDefault();
  if (status === 'collection') $('closeCollection').click();
  else if (status === 'playing') pause(); else if (status === 'paused') $('resume').click();
});
let collectionReturn = 'menu';
function openCollection() {
  if (status === 'finale' || status === 'collection') return;
  collectionReturn = status;
  if (status === 'playing') { pause(); collectionReturn = 'paused'; }
  controls.stop(); status = 'collection'; renderCollection($('flockGrid'), collection);
  const entries = Object.values(collection);
  $('collectionSummary').textContent = `${entries.filter(e => e.seen).length}/${FLOCK.length} seen · ${entries.filter(e => e.perfect).length}/${FLOCK.length} perfected`;
  screens('collection'); $('closeCollection').focus();
}
$('collectionButton').onclick = openCollection;
$('closeCollection').onclick = () => { status = collectionReturn; screens(status === 'result' ? 'result' : status === 'paused' ? 'paused' : 'menu'); $('collectionButton').focus(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

function burst(x, y, color, size = 1) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2, speed = (.02 + Math.random() * .055) * size;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - .025, life: .4 + Math.random() * .25, age: 0, color });
  }
}

function tick(dt) {
  elapsed += dt; controls.step(dt);
  // Plan against every airborne operation, not just those that already crossed.
  // Extended previews delay subsequent launches so overlapping crossings stay ordered.
  if (elapsed >= next) {
    const op = planEncounter(introductions, orbs, plannedTarget, { elapsed, height: levitation.height, space: levitation.space });
    if (op !== null) {
      const after = apply(plannedTarget, op), changed = after - plannedTarget;
      lastSide = Math.random() < .78 ? -lastSide : lastSide;
      const type = BY_ID[op];
      const lead = encounterPreview(type, changed, !revealed.has(op));
      const flight = { ...launchFlight(lastSide, Math.random, lead), op, before: plannedTarget, result: after, readyBeforeCenter: false, counted: false, entered: false };
      orbs.push(flight); plannedTarget = after; launched++;
      next = elapsed + launchGap(waveInterval(elapsed, 0) + Math.max(0, operationCountTime(type, changed) - .4), lead);
      burst(flight.x, .98, colors[op], .65);
      sounds.launch(lastSide);
    }
  }
  observeAnticipation(nextSheep(), count, exactCount);
  creditCountedSheep(orbs, count, exactCount);
  for (const orb of orbs) {
    const crossedNow = advanceFlight(orb, dt);
    if (enterFlight(orb, w, h)) {
      if (orb.op === '×2') $('double').hidden = false;
      if (orb.op === '÷2') $('halve').hidden = false;
      recordSheep(collection, orb.op, false, storage);
      lastOp = elapsed;
      $('operation').replaceChildren();
      const type = BY_ID[orb.op];
      if (type.fraction) {
        const fraction = document.createElement('span');
        fraction.className = 'fraction'; fraction.setAttribute('aria-label', `${type.fraction[0]} over ${type.fraction[1]}`);
        for (const digit of type.fraction) {
          const part = document.createElement('span'); part.textContent = String(digit).replace('-', '−'); fraction.append(part);
        }
        $('operation').append(fraction);
      } else $('operation').textContent = displayOperation(orb.op);
      if (!revealed.has(orb.op)) {
        revealed.add(orb.op);
        if (orb.op !== '+1') {
          cueUntil = elapsed + 1.4;
          $('encounter').textContent = `NEW: ${type.name} · ${displayOperation(type.id)}`;
          const button = orb.op === '×2' ? $('double') : orb.op === '÷2' ? $('halve') : null;
          if (!reducedMotion.matches) for (const element of [$('encounter'), button].filter(Boolean)) {
            element.getAnimations().forEach(animation => animation.cancel());
            element.animate([{ transform: 'scale(.8)', opacity: .4 }, { transform: 'scale(1.12)', opacity: 1, offset: .45 }, { transform: 'scale(1)', opacity: 1 }], { duration: 650, easing: 'ease-out' });
          }
        }
      }
      $('operation').style.color = colors[orb.op];
      observeAnticipation(orb, count, exactCount);
    }
    if (crossedNow && !orb.crossed) {
      const perfect = isPerfectCrossing(orb, count, exactCount);
      const before = target;
      target = commitCrossing(orb, target);
      peak = Math.max(peak, target);
      const budget = operationCountTime(BY_ID[orb.op], target - before);
      grace = elapsed + budget + .15;
      graceScale = Math.min(.05, .25 / Math.max(1, budget));
      if (matches(count, orb.result, exactCount)) orb.counted = true;
      if (perfect) {
        perfectHits++; orb.perfectAt = orb.age; orb.bonus = BY_ID[orb.op].bonus; perfectScore += orb.bonus;
        recordSheep(collection, orb.op, true, storage);
        rage = calmForPerfect(rage); sounds.perfect();
      }
      observeAnticipation(nextSheep(), count, exactCount);
      n++; crossingGlow = 1;
      burst(orb.x, orb.y, colors[orb.op]);
      sounds.cross(orb.op, { perfect });
    }
    if (Math.floor(orb.age / .025) !== Math.floor((orb.age - dt) / .025)) {
      orb.trail.push({ x: orb.x, y: orb.y });
      if (orb.trail.length > 9) orb.trail.shift();
    }
  }
  creditCountedSheep(orbs, count, exactCount);
  orbs = orbs.filter(orb => !flightIsGone(orb));
  for (const p of particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .12 * dt; }
  particles = particles.filter(p => p.age < p.life);
  for (const ring of rings) ring.age += dt;
  rings = rings.filter(ring => ring.age < .4);
  if (elapsed >= cueUntil) $('encounter').textContent = '';
  const error = countingError(count, target, orbs, exactCount);
  const limit = Math.max(tolerance(n), Math.abs(target) * .1);
  mismatchTime = error > 0 ? mismatchTime + dt : 0;
  const incoming = nextSheep();
  const budget = incoming ? operationCountTime(BY_ID[incoming.op], incoming.result - incoming.before) : 0;
  const softness = incoming ? Math.min(.05, .25 / Math.max(1, budget)) : elapsed <= grace ? graceScale : false;
  const buildingRage = error > 0 && mismatchTime > .65 && !softness;
  stepLevitation(levitation, dt, buildingRage);
  // Numeric errors remain errors during a fall; falling adds no separate penalty.
  rage = stepRage(rage, error, limit, dt, softness);
  if (rage > .7 && error > 0) sounds.warning();
  countKick *= Math.exp(-dt * 13); crossingGlow *= Math.exp(-dt * 7); tapGlow *= Math.exp(-dt * 10);
  if (rage >= 1) finish(false);

}

function ellipse(x, y, rx, ry, fill, rotation = 0) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fill();
}
function path(points, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath(); ctx.fill();
}

function drawWolf(time) {
  const playing = ['playing', 'paused', 'finale'].includes(status);
  const drift = (1 - Math.exp(-levitation.height / .32)) * .24;
  const x = playing ? w * (.5 + drift) : w * (w < 600 ? .70 : .77);
  const scale = Math.min(w / (w < 600 ? 490 : 620), h / 650, 1.18) * (playing ? .8 : 1.12);
  const afloat = playing ? 1 - Math.exp(-levitation.height * 8) : 0;
  const sway = reducedMotion.matches ? 0 : Math.sin(time * .65) * 2 * afloat;
  const y = h * (.89 - (playing ? levitation.height - cameraHeight(levitation.height) : 0)) - 28 * scale + sway;
  const restless = status === 'result' && rage >= 1 ? 1 : playing && levitation.height === 0 ? rage : 0;
  const breathe = Math.sin(time * (2 + restless * 4));
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  if (!reducedMotion.matches && afloat) ctx.rotate(levitation.falling ? Math.sin(levitation.fallTime * 2.2) * .10 * Math.min(1, levitation.fallTime) : Math.sin(time * .42) * .018 * afloat);
  if (!playing || levitation.height < .15) ellipse(0, 18, 115, 16, '#050d1770');
  // Curled body, lighter ruff, and a broad tail wrapped around the paws.
  ellipse(13, -15, 83, 48 + breathe * 1.7, '#3a4e62', -.08);
  ellipse(27, -24, 59, 33 + breathe, '#465d70', -.12);
  ctx.strokeStyle = '#c3dfec66'; ctx.lineWidth = 2;
  ctx.shadowColor = '#c4e4f04a'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.ellipse(13, -16, 81, 46 + breathe * 1.7, -.08, 3.4, 5.8); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#283c50'; ctx.beginPath(); ctx.moveTo(76, -22);
  ctx.bezierCurveTo(145, 0, 105, 59, 23, 37); ctx.bezierCurveTo(-15, 27, -22, 14, -13, 8);
  ctx.bezierCurveTo(25, 26, 86, 20, 76, -22); ctx.fill();
  ctx.fillStyle = '#9aacae'; ctx.beginPath(); ctx.moveTo(-13, 8);
  ctx.bezierCurveTo(-29, 11, -34, 21, -15, 29); ctx.bezierCurveTo(5, 42, 25, 40, 33, 36);
  ctx.bezierCurveTo(16, 29, 10, 22, -13, 8); ctx.fill();
  ellipse(-39, 13, 34, 12, '#768c98'); ellipse(-62, 19, 22, 8, '#a6b7ba');
  // Angular ears make the sleeping silhouette distinctly lupine.
  ctx.save(); ctx.translate(-50, -25 - breathe * .9);
  const twitch = restless * Math.sin(time * 8) * 3;
  path([[-27, -5], [-30 - twitch, -61], [3, -29], [26, -50 + twitch], [28, -3]], '#526b7d');
  ctx.strokeStyle = '#c6e0eb6a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-27, -5); ctx.lineTo(-30 - twitch, -61); ctx.lineTo(3, -29); ctx.stroke();
  path([[-23, -41], [-20, -15], [-3, -26]], '#9e9da0');
  path([[12, -26], [23, -38], [23, -12]], '#90959b');
  ellipse(-1, -3, 40, 32, '#607b8a', -.18);
  path([[-35, -8], [-47, 5], [-41, 7], [-49, 16], [-30, 18], [-22, 30], [4, 17]], '#7f99a2');
  ellipse(-19, 16, 31, 16, '#b7c8c5', -.12);
  ellipse(-44, 15, 8, 6, '#142433', .2);
  ctx.strokeStyle = '#213746'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (restless > .72) {
    ellipse(-13, 0, 8, 3.5 + restless * 2, '#e8ba7e'); ellipse(-15, 0, 2, 4, '#182431');
  } else {
    ctx.beginPath(); ctx.moveTo(-21, -1); ctx.quadraticCurveTo(-13, 6, -4, -1); ctx.stroke();
  }
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-38, 23); ctx.quadraticCurveTo(-25, 27, -20, 23); ctx.stroke();
  ctx.restore();
  // Quiet drifting Zs, which disappear as the wolf wakes.
  if (restless < .65) {
    for (let i = 0; i < 3; i++) {
      const phase = ((time * .27 + i / 3) % 1);
      ctx.globalAlpha = Math.sin(phase * Math.PI) * .65 * (1 - restless);
      ctx.fillStyle = '#bfdabc'; ctx.font = `500 ${12 + phase * 8}px 'Space Grotesk',sans-serif`;
      ctx.fillText('z', -78 + phase * 30, -61 - phase * 47);
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

function draw(time) {
  ctx.clearRect(0, 0, w, h);
  const height = ['playing', 'paused', 'finale'].includes(status) ? levitation.height : 0;
  drawDreamSky(ctx, w, h, height, time, stars);
  drawGrass(ctx, w, h, cameraHeight(height), levitation.impact, ['playing', 'paused', 'finale'].includes(status) ? .5 : w < 600 ? .70 : .77, time, reducedMotion.matches);
  if (status !== 'finale' && status !== 'result') drawWolf(time);
  if (status === 'finale') drawFinale();
  if (status === 'result') drawHunter(ctx, w * (w < 600 ? .78 : .77), h * .83, Math.min(w / 500, h / 650, 1.5), { bloody: true, look: -3 });
  if (status === 'playing' || status === 'paused') {
    // The center gate flashes on exactly the event that changes the hidden total.
    ctx.strokeStyle = `rgba(196,224,191,${.08 + crossingGlow * .5})`; ctx.lineWidth = 1 + crossingGlow * 2;
    ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.moveTo(w * .5, h * .26); ctx.lineTo(w * .5, h * .43);
    ctx.moveTo(w * .5, h * .57); ctx.lineTo(w * .5, h * .76); ctx.stroke(); ctx.setLineDash([]);
    for (const orb of orbs) drawOrb(orb);
    for (const orb of orbs) drawPerfectBubble(ctx, orb, w, h, sheepRadius(w), reducedMotion.matches);
    for (const p of particles) {
      ctx.globalAlpha = (1 - p.age / p.life) * .7;
      ellipse(p.x * w, p.y * h, 2, 2, p.color);
    }
    for (const ring of rings) {
      ctx.globalAlpha = (1 - ring.age / .4) * .45; ctx.strokeStyle = '#bfdabc'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, 12 + ring.age * 95, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

}

function drawFinale() {
  const t = finaleTime, beat = attackBeat(t, victims.length);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ctx.save();
  if (!reduced && t > .65 && t < 1.7) ctx.translate(Math.sin(t * 110) * 3, Math.cos(t * 95) * 2);
  for (let i = 0; i < victims.length; i++) {
    if (t >= .65 && (i < beat.index || i === beat.index && beat.phase > .5)) continue;
    const v = victims[i];
    ctx.save();
    if (t >= .65 && i === beat.index) {
      ctx.translate(v.x * w, v.y * h); ctx.scale(1 - beat.phase, 1 - beat.phase); ctx.translate(-v.x * w, -v.y * h);
    }
    drawOrb(v); ctx.globalAlpha = 1;
    // Panic overlay is independent of the shared sheep model.
    for (const dx of [-8, 8]) { ellipse(v.x*w+dx,v.y*h-8,6,8,'#fff9e8'); ellipse(v.x*w+dx,v.y*h-8,2,5,'#182839'); }
    ellipse(v.x*w,v.y*h+11,4,6,'#182839');
    ctx.restore();
  }
  const wake = Math.min(1, Math.max(0, (t - .16) / .49));
  let x = w * (.5 + (1 - Math.exp(-levitation.height / .32)) * .24 * (1 - wake));
  const restingY = h * (.89 - levitation.height + cameraHeight(levitation.height)) - 28 * Math.min(w / (w < 600 ? 490 : 620), h / 650, 1.18) * .8;
  let y = restingY + (h * .5 - restingY) * wake;
  const victim = victims[beat.index];
  if (t >= .65 && t < 1.7 && victim) { x = victim.x * w; y = victim.y * h + 40; }
  const mouth = t < .65 ? 0 : t < 1.7 ? Math.sin(beat.phase * Math.PI) : Math.max(0, Math.sin((t-1.7)*24)) * .3;
  if(t < .16) drawWolf(visualTime);
  else drawHunter(ctx,x,y - Math.min(1,t/.65)*16,Math.min(w/490,h/650,1.1),{
    mouth, lookUp: t >= .5, look: t < .35 ? -5 : t < .5 ? 5 : 0,
    gulp: t > 1.75 ? Math.max(0,Math.sin((t-1.75)/.45*Math.PI)) : 0, bloody: t > .85,
  });
  if(t>.65 && t<1.7 && !reduced) {
    for(let i=0;i<16;i++) {
      const angle=i*2.4, dist=beat.phase*95;
      ellipse(x+Math.cos(angle)*dist,y-30+Math.sin(angle)*dist+beat.phase*25,2+i%3,3+i%4,i%3?'#aa294c':'#eee8d6');
    }
  }
  ctx.fillStyle='#edc7ba';ctx.textAlign='center';ctx.font="600 15px 'Space Grotesk',sans-serif";
  ctx.fillText(t < .65 ? '…oh, no.' : t < 1.7 ? 'SWEET DREAMS.' : 'GULP.',w*.5,h*.25);
  ctx.restore();
}

function drawOrb(orb) {
  const color = colors[orb.op];
  // A larger, landscape-shaped silhouette reads clearly on small phone screens.
  const r = sheepRadius(w);
  for (let i = 1; i < orb.trail.length; i++) {
    ctx.globalAlpha = i / orb.trail.length * .13;
    ctx.strokeStyle = color; ctx.lineWidth = r * .4 * i / orb.trail.length;
    ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(orb.trail[i - 1].x * w, orb.trail[i - 1].y * h);
    ctx.lineTo(orb.trail[i].x * w, orb.trail[i].y * h); ctx.stroke();
  }
  drawSheep(ctx, orb, orb.x * w, orb.y * h, r, color, reducedMotion.matches);
}

function frame(t) {
  const dt = Math.min(.1, (t - previous) / 1000); previous = t;
  if (status !== 'paused') visualTime += dt;
  if (status === 'playing') {
    accumulator += dt;
    while (accumulator >= FIXED_STEP && status === 'playing') { tick(FIXED_STEP); accumulator -= FIXED_STEP; }
    if (status === 'playing') { update(); sounds.updateMusic(slowArithmetic(orbs), levitation.height, levitation.space); }
  }
  if (status === 'finale') {
    finaleTime += dt;
    const beat = attackBeat(finaleTime, victims.length);
    if (finaleTime > .65 && finaleTime < 1.7 && beat.index !== biteIndex) { biteIndex = beat.index; sounds.bite(); }
    if (finaleTime >= FINALE_DURATION) showResult();
  }
  draw(visualTime); requestAnimationFrame(frame);
}
home(); requestAnimationFrame(frame);
