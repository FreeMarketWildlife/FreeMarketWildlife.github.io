// Each perfect belongs to its sheep and travels with it, rather than the HUD.
export function perfectBubble(orb, w, h, r) {
  if (orb.perfectAt === undefined) return null;
  const age = orb.age - orb.perfectAt;
  if (age < 0 || age >= 1.05) return null;
  const width = w < 600 ? 100 : 118, height = w < 600 ? 33 : 38;
  // Sit above the face; switch sides with the flight and keep the bubble on screen.
  const face = orb.x * w + Math.sign(orb.vx) * r * .7;
  const beside = orb.x * w + (orb.vx > 0 ? r * 1.65 : -r * 1.65 - width);
  const side = h < 500 && beside >= 12 && beside + width <= w - 12;
  const x = side ? beside : Math.max(12, Math.min(w - width - 12, face - width * .5));
  const y = Math.max(side ? 110 : 65, Math.min(h - height - 12, side ? orb.y * h - height * .5 : orb.y * h - r * 1.2 - height - 10));
  return { x, y, width, height, age, face, side, opacity: Math.min(1, (1.05 - age) / .25) };
}

export function drawPerfectBubble(ctx, orb, w, h, r, reduced = false) {
  const reward = perfectBubble(orb, w, h, r);
  if (!reward) return;
  const { x, y, width, height, age, opacity } = reward;
  const pop = reduced ? 1 : 1 - Math.exp(-age * 16) * Math.cos(age * 22) * .38;
  const rise = reduced ? 0 : Math.min(age, .8) * 16;
  ctx.save(); ctx.globalAlpha = opacity;
  ctx.translate(x + width / 2, y + height / 2 - rise); ctx.scale(pop, pop);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${w < 600 ? 21 : 25}px 'Space Grotesk',sans-serif`;
  ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#142331';
  ctx.shadowColor = '#e9d58c88'; ctx.shadowBlur = 12;
  const label = orb.bonus ? `Perfect +${orb.bonus}` : 'Perfect';
  if (orb.bonus) ctx.font = `700 ${w < 600 ? 15 : 18}px 'Space Grotesk',sans-serif`;
  ctx.strokeText(label, 0, 0);
  const gold = ctx.createLinearGradient(0, -14, 0, 14);
  gold.addColorStop(0, '#fff9de'); gold.addColorStop(1, '#e4c576');
  ctx.fillStyle = gold; ctx.fillText(label, 0, 0); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#f4df9a'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2, distance = 10 + Math.min(age * 70, 32);
    const sx = Math.cos(angle) * (width / 2 + distance * .4), sy = Math.sin(angle) * distance;
    ctx.globalAlpha = opacity * Math.max(0, 1 - age / .65);
    ctx.beginPath(); ctx.moveTo(sx - 2, sy); ctx.lineTo(sx + 2, sy); ctx.moveTo(sx, sy - 3); ctx.lineTo(sx, sy + 3); ctx.stroke();
  }
  ctx.restore();
}
