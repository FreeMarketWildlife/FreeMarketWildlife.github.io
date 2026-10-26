import { BY_ID, displayOperation } from './flock.js';
// Shared canvas renderer: used by gameplay and the visual review page.
export function drawSheep(ctx, orb, x, y, r, color, reduced = false) {
  const ellipse = (x, y, rx, ry, fill, rotation = 0) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fill();
  };
  const type = BY_ID[orb.op] ?? BY_ID['+1'];
  const mood = type.mood;
  const happy = Boolean(orb.counted);
  ctx.globalAlpha = happy ? 1 : orb.crossed ? .88 : 1;
  const direction = orb.vx < 0 ? -1 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1);
  // A gentle tumble lets faces stay recognizable while wool and hooves rotate.
  ctx.rotate(reduced ? 0 : Math.sin(orb.angle) * type.spin);
  const face = '#344454', hoof = '#273748';
  const kick = Math.sin(orb.age * (happy ? 22 : 14)) * (happy ? .17 : .1);
  // Four tiny kicking legs and dark rounded hooves.
  for (const [lx, ly, angle] of [[-.55, .63, -.15], [.2, .67, .12], [-.25, .6, .2], [.48, .54, -.1]]) {
    ellipse(lx * r, ly * r, r * .115, r * .3, face, angle + kick);
    ellipse(lx * r + kick * r, (ly + .22) * r, r * .15, r * .1, hoof);
  }
  // Tail and creamy colored wool, shaded underneath and puffed along the rim.
  ellipse(-r * 1.04, -r * .1, r * .26, r * .22, color, -.4);
  ctx.shadowColor = happy ? '#c2f7d2' : color; ctx.shadowBlur = happy ? 14 : orb.crossed ? 0 : 9;
  ellipse(-r * .12, 0, r * 1.05, r * .77, color); ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ellipse(-r * .12 + Math.cos(a) * r * .88, Math.sin(a) * r * .62, r * .3, r * .27, color);
  }
  ellipse(-r * .15, r * .39, r * .74, r * .21, '#26394d13');
  // Soft curls create wool texture rather than an operation coin.
  ctx.strokeStyle = '#ffffff65'; ctx.lineWidth = Math.max(1, r * .04);
  for (const [cx, cy] of [[-.65, -.25], [-.1, -.47], [.32, -.2], [-.62, .23], [.22, .31]]) {
    ctx.beginPath(); ctx.arc(cx * r, cy * r, r * .13, .2, Math.PI * 1.65); ctx.stroke();
  }
  // Floppy ears, a charcoal face, sparkling eyes, blush, and a little smile.
  ellipse(r * .57, -r * .35, r * .35, r * .15, face, -.55);
  ellipse(r * 1.19, -r * .28, r * .3, r * .14, face, .6);
  ellipse(r * .55, -r * .34, r * .19, r * .07, '#d998a0', -.55);
  ellipse(r * 1.19, -r * .27, r * .16, r * .065, '#d998a0', .6);
  ellipse(r * .87, -r * .03, r * .44, r * .54, face, -.12);
  if (happy) {
    ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = r * .055; ctx.lineCap = 'round';
    for (const ex of [.71, 1.02]) {
      ctx.beginPath(); ctx.moveTo((ex - .09) * r, -r * .06);
      ctx.quadraticCurveTo(ex * r, -r * .28, (ex + .09) * r, -r * .06); ctx.stroke();
    }
  } else for (const [index, ex] of [.71, 1.02].entries()) {
    const goofy = ['goofy', 'hyper', 'excitable'].includes(mood), ey = goofy && index === 1 ? -.2 : -.12;
    ellipse(r * ex, r * ey, r * (goofy && index === 1 ? .13 : .095), r * (goofy ? .15 : .125), '#fff9e8');
    ellipse(r * (ex + (goofy ? (index ? -.035 : .04) : .015)), r * (ey + .015), r * .051, r * .076, '#172638');
    ellipse(r * (ex + .035), r * (ey - .02), r * .02, r * .025, '#ffffff');
  }
  ellipse(r * .58, r * .14, r * .09, r * .05, '#df99a666');
  ellipse(r * 1.12, r * .17, r * .08, r * .05, '#df99a666');
  ellipse(r * .87, r * .16, r * .055, r * .04, '#dfacb4');
  ctx.strokeStyle = '#b8c6ca'; ctx.lineWidth = r * .04; ctx.lineCap = 'round';
  if (happy) {
    // A big open yay mouth and delighted eyes override every original mood.
    ellipse(r * .87, r * .29, r * .19, r * .17, '#172638');
    ellipse(r * .87, r * .39, r * .12, r * .065, '#f4a4b7');
    ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = r * .035;
    ctx.beginPath(); ctx.moveTo(r * .71, r * .18); ctx.quadraticCurveTo(r * .87, r * .25, r * 1.03, r * .18); ctx.stroke();
  } else if (['angry', 'furious'].includes(mood)) {
    // Low inward brows, a cross little frown, and a tiny forehead crease.
    ctx.strokeStyle = '#111e2d'; ctx.lineWidth = r * .08;
    ctx.beginPath(); ctx.moveTo(r * .58, -r * .34); ctx.lineTo(r * .82, -r * .21);
    ctx.moveTo(r * .92, -r * .21); ctx.lineTo(r * 1.16, -r * .34); ctx.stroke();
    ctx.strokeStyle = '#d3b6bd'; ctx.lineWidth = r * .04;
    ctx.beginPath(); ctx.moveTo(r * .72, r * .35); ctx.quadraticCurveTo(r * .87, r * .2, r * 1.02, r * .35); ctx.stroke();
  } else if (['goofy', 'hyper'].includes(mood)) {
    // Uneven eyes, an open grin, and a wagging tongue: gleefully chaotic.
    ellipse(r * .9, r * .29, r * .18, r * .15, '#182839', -.2);
    ellipse(r * .97, r * .39, r * .09, r * .16, '#f2a0ae', Math.sin(orb.age * 15) * .3);
    ctx.strokeStyle = '#bd647f'; ctx.lineWidth = r * .025;
    ctx.beginPath(); ctx.moveTo(r * .97, r * .34); ctx.lineTo(r * .97, r * .46); ctx.stroke();
    ctx.strokeStyle = '#edf0da'; ctx.lineWidth = r * .04;
    ctx.beginPath(); ctx.moveTo(r * .59, -r * .4); ctx.lineTo(r * .77, -r * .43); ctx.stroke();
  } else if (['crying', 'pleading'].includes(mood)) {
    // Worried brows, a trembling pout, and continuous blue tear streams.
    ctx.strokeStyle = '#c1d1df'; ctx.lineWidth = r * .04;
    ctx.beginPath(); ctx.moveTo(r * .58, -r * .36); ctx.lineTo(r * .8, -r * .43);
    ctx.moveTo(r * .94, -r * .43); ctx.lineTo(r * 1.15, -r * .36); ctx.stroke();
    ctx.strokeStyle = '#88d9ff'; ctx.lineWidth = r * .065;
    for (const ex of [.69, 1.05]) {
      ctx.beginPath(); ctx.moveTo(r * ex, 0); ctx.quadraticCurveTo(r * (ex - .06), r * .22, r * ex, r * .42); ctx.stroke();
      const drop = (orb.age * 1.7 + ex) % 1;
      ellipse(r * ex, r * (.35 + drop * .48), r * .065 * (1 - drop * .3), r * .105, '#91dcff');
    }
    ctx.strokeStyle = '#d2dce5'; ctx.lineWidth = r * .045;
    ctx.beginPath(); ctx.moveTo(r * .77, r * .34); ctx.quadraticCurveTo(r * .87, r * .24, r * .97, r * .34); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(r * .87, r * .2); ctx.quadraticCurveTo(r * .84, r * .3, r * .74, r * .25); ctx.stroke();
  }
  if (!happy) {
    ctx.strokeStyle = mood === 'shadow' ? '#cfabff' : '#e5e4db'; ctx.lineWidth = r * .045;
    if (mood === 'sleepy') {
      for (const ex of [.71, 1.02]) {
        ellipse(ex*r, -.12*r, .13*r, .14*r, face);
        ctx.beginPath(); ctx.moveTo((ex-.09)*r,-.1*r); ctx.lineTo((ex+.09)*r,-.1*r);ctx.stroke();
      }
      ellipse(.87*r,.3*r,.1*r,.12*r,'#172638');
    } else if (mood === 'skeptical' || mood === 'smirk') {
      ctx.beginPath();ctx.moveTo(.58*r,-.4*r);ctx.lineTo(.83*r,-.43*r);
      ctx.moveTo(.93*r,-.25*r);ctx.lineTo(1.15*r,-.25*r);ctx.stroke();
      ctx.beginPath();ctx.moveTo(.74*r,.32*r);ctx.quadraticCurveTo(.92*r,.4*r,1.05*r,.19*r);ctx.stroke();
    } else if (mood === 'nervous') {
      ctx.beginPath();ctx.moveTo(.59*r,-.3*r);ctx.lineTo(.8*r,-.43*r);ctx.moveTo(.94*r,-.43*r);ctx.lineTo(1.14*r,-.3*r);ctx.stroke();
      ctx.beginPath();ctx.moveTo(.7*r,.3*r);for(let i=0;i<7;i++)ctx.lineTo((.7+i*.05)*r,(.3+(i%2)*.06)*r);ctx.stroke();
      ellipse(1.22*r,.1*r,.06*r,.12*r,'#b8e9ff');
    } else if (mood === 'blank') {
      ellipse(.71*r,-.12*r,.13*r,.14*r,face);ellipse(1.02*r,-.12*r,.13*r,.14*r,face);
      ellipse(.71*r,-.12*r,.035*r,.035*r,'#e5e4db');ellipse(1.02*r,-.12*r,.035*r,.035*r,'#e5e4db');
      ctx.beginPath();ctx.moveTo(.75*r,.31*r);ctx.lineTo(.99*r,.31*r);ctx.stroke();
    } else if (mood === 'eager' || mood === 'excitable') {
      ellipse(.87*r,.3*r,.18*r,.14*r,'#172638');ellipse(.87*r,.37*r,.13*r,.05*r,'#f4a4b7');
      ctx.beginPath();ctx.moveTo(.7*r,.21*r);ctx.quadraticCurveTo(.87*r,.29*r,1.04*r,.21*r);ctx.stroke();
    } else if (mood === 'shadow') {
      ctx.shadowColor='#b878ff';ctx.shadowBlur=12;
      for(const ex of [.71,1.02])ellipse(ex*r,-.12*r,.06*r,.12*r,'#e6cbff');
      ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(.74*r,.29*r);ctx.quadraticCurveTo(.87*r,.39*r,1.02*r,.24*r);ctx.stroke();
    }
    if (mood === 'furious') {ctx.strokeStyle='#fff1dc';ctx.lineWidth=.09*r;ctx.beginPath();ctx.moveTo(.73*r,.31*r);ctx.lineTo(1.02*r,.31*r);ctx.stroke();}
  }
  // A wool forelock sits between the ears.
  for (const [fx, fy] of [[.61, -.49], [.85, -.55], [1.06, -.47]]) ellipse(fx * r, fy * r, r * .18, r * .16, color);
  if (['goofy', 'hyper'].includes(mood)) {
    ctx.strokeStyle = color; ctx.lineWidth = r * .075;
    ctx.beginPath(); ctx.moveTo(r * .67, -r * .64); ctx.lineTo(r * .5, -r * .99); ctx.lineTo(r * .86, -r * .8); ctx.lineTo(r * 1.01, -r * 1.03); ctx.stroke();
  }
  if (happy) {
    ctx.strokeStyle = '#f6df9b'; ctx.lineWidth = r * .04;
    const pulse = 1 + Math.sin(orb.age * 7) * .1;
    for (const [sx, sy, size] of [[1.22, -.78, .12], [.46, -.98, .09]]) {
      ctx.beginPath(); ctx.moveTo((sx - size * pulse) * r, sy * r); ctx.lineTo((sx + size * pulse) * r, sy * r);
      ctx.moveTo(sx * r, (sy - size * pulse) * r); ctx.lineTo(sx * r, (sy + size * pulse) * r); ctx.stroke();
    }
  }
  ctx.restore();
  // The arithmetic stays upright on the sheep's side for quick reading.
  const ink = type.legendary || ['blank', 'furious'].includes(mood) ? '#f2ecff' : '#1b2838';
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${r * .75}px 'Space Grotesk',sans-serif`;
  if (type.fraction) {
    const cx = x - direction * r * .2;
    ctx.font = `700 ${r * .49}px 'Space Grotesk',sans-serif`;
    ctx.fillText(String(type.fraction[0]).replace('-', '−'), cx, y - r * .25);
    ctx.fillText(String(type.fraction[1]), cx, y + r * .3);
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.5, r * .045);
    ctx.beginPath(); ctx.moveTo(cx - r * .22, y + r * .025); ctx.lineTo(cx + r * .22, y + r * .025); ctx.stroke();
  } else {
    if (orb.op.length > 2) ctx.font = `700 ${r * .55}px 'Space Grotesk',sans-serif`;
    ctx.fillText(displayOperation(orb.op), x - direction * r * .2, y + r * .03);
  }
  ctx.globalAlpha = 1;
}
