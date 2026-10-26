// World units are viewport widths/heights. Ordered crossing times preserve operation
// order while launch point, gravity, height, side, and angular velocity vary.
export const CROSSING_TIME = .8;
export const FIXED_STEP = 1 / 120;

export function launchFlight(side, random = Math.random, crossingTime = CROSSING_TIME) {
  const x = side < 0 ? .08 + random() * .16 : .92 - random() * .16;
  const y = 1.09;
  const gravity = (1.75 + random() * .65) * (CROSSING_TIME / crossingTime) ** 2;
  const crossingY = .34 + random() * .15;
  return {
    x, y, vx: (.5 - x) / crossingTime,
    vy: (crossingY - y - .5 * gravity * crossingTime ** 2) / crossingTime,
    gravity, crossingTime, age: 0, angle: (random() - .5) * .5,
    spin: (random() - .5) * 2.2, crossed: false, trail: [],
  };
}

// Restore the normal trajectory over 180ms after the actual center crossing.
// The virtual clock has continuous position and velocity; no coordinate jump.
export function advanceFlight(body, dt) {
  body.motion ??= { x: body.x, y: body.y, vx: body.vx, vy: body.vy, gravity: body.gravity, angle: body.angle };
  const oldAge = body.age;
  body.age += dt;
  const ratio = body.crossingTime / CROSSING_TIME;
  const post = Math.max(0, body.age - body.crossingTime), ramp = .18;
  const u = Math.min(1, post / ramp);
  const integral = u ** 3 - .5 * u ** 4; // integral of smoothstep
  const extra = post <= ramp ? ramp * integral : post - ramp / 2;
  const virtualAge = Math.min(body.age, body.crossingTime) + post + (ratio - 1) * extra;
  const speed = post ? 1 + (ratio - 1) * u * u * (3 - 2 * u) : 1;
  const m = body.motion;
  body.x = m.x + m.vx * virtualAge;
  body.y = m.y + m.vy * virtualAge + .5 * m.gravity * virtualAge ** 2;
  body.vx = m.vx * speed;
  body.vy = (m.vy + m.gravity * virtualAge) * speed;
  body.gravity = m.gravity * speed ** 2;
  body.angle = m.angle + body.spin * virtualAge;
  return oldAge < body.crossingTime && body.age >= body.crossingTime;
}

export const flightIsGone = body => body.age > body.crossingTime && body.y > 1.18;

// Extra preview time for a large jump; subsequent launches wait so crossings
// remain ordered. Standard ±1 sheep keep the original snappy .8-second lead-in.
export const previewTime = change => Math.abs(change) <= 1 ? CROSSING_TIME : Math.max(CROSSING_TIME, Math.abs(change) / 7 + .7);
export const launchGap = (spacing, crossingTime) => Math.max(spacing, crossingTime - CROSSING_TIME + .52);

// Match the rendered wool/ears near the bottom edge, rather than the center gate.
export const sheepRadius = width => Math.max(25, Math.min(width * .075, 38));
export function enterFlight(body, width, height) {
  if (body.entered || body.y * height - sheepRadius(width) * 1.15 > height) return false;
  body.entered = true;
  return true;
}
