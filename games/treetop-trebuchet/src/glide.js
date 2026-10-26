/**
 * 2D still-air, quasi-steady membrane + tail model; x right / y up, radians.
 * Coefficients/proportions are gameplay tuning, not measured squirrel biology.
 * Right (+1) deflects the tail to pitch down; left (-1) pitches up / flares.
 * Both surfaces evaluate their LOCAL air velocity (including angular motion).
 * Lift is perpendicular to that velocity; drag opposes it. Applying the returned
 * COM force AND torque gives F dot v + torque * omega <= 0, even while tumbling.
 * Input is an ideal massless incidence change, not a powered body-pitch motor.
 * Its internal actuator losses/inertia are omitted; it cannot add modeled energy.
 */
export const GLIDE_DEFAULTS = Object.freeze({
  airDensity: 1.225, liftSlope: 4, maxLiftCoefficient: 1.1,
  zeroLiftDrag: .12, inducedDrag: .12, broadsideDrag: 1.1,
  incidence: .10, controlIncidence: .12, stallAngle: .42,
  tailAreaFraction: .22, tailArm: .28, tailIncidence: -.08,
  maxAcceleration: 35, maxSpeed: 100,
});
const bounded = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
export function aerodynamicForces({ vx, vy, mass, area, pitch = 0, input = 0, angularVelocity = 0 }, options = {}) {
  if (![vx, vy, mass, area, pitch, input, angularVelocity].every(Number.isFinite) || mass <= 0 || area < 0)
    throw new RangeError('Finite velocity, pitch, angular velocity and input; positive mass and nonnegative area required');
  const p = { ...GLIDE_DEFAULTS, ...options };
  for (const key of Object.keys(GLIDE_DEFAULTS)) if (!Number.isFinite(p[key])) throw new RangeError(`Invalid aerodynamic parameter: ${key}`);
  if (p.airDensity < 0 || p.liftSlope < 0 || p.maxLiftCoefficient < 0 || p.zeroLiftDrag < 0 || p.inducedDrag < 0 || p.broadsideDrag < 0 || p.stallAngle <= 0 || p.maxAcceleration <= 0 || p.maxSpeed <= 0 || p.tailAreaFraction < 0 || p.tailAreaFraction > 1 || p.tailArm < 0)
    throw new RangeError('Invalid aerodynamic coefficient or stability limit');
  const speed = Math.hypot(vx, vy), control = bounded(input, -1, 1);
  if (!Number.isFinite(speed)) throw new RangeError('Velocity magnitude overflow');
  function surface(fraction, distance, incidence) {
    const rx = -distance * Math.cos(pitch), ry = -distance * Math.sin(pitch);
    const ux = vx - angularVelocity * ry, uy = vy + angularVelocity * rx;
    const localSpeed = Math.hypot(ux, uy), alpha = wrap(pitch - Math.atan2(uy, ux) + incidence);
    const sinAlpha = Math.sin(alpha), stallSin = Math.sin(Math.min(p.stallAngle, Math.PI / 2));
    const attached = Math.exp(-Math.pow(Math.abs(sinAlpha) / stallSin, 4));
    const cl = bounded(p.liftSlope * Math.sin(2 * alpha) / 2, -p.maxLiftCoefficient, p.maxLiftCoefficient) * attached;
    const cd = p.zeroLiftDrag + p.inducedDrag * cl * cl + p.broadsideDrag * sinAlpha * sinAlpha;
    const q = .5 * p.airDensity * Math.min(localSpeed, p.maxSpeed) ** 2;
    const lift = q * area * fraction * cl, drag = q * area * fraction * cd;
    const nx = localSpeed ? ux / localSpeed : 0, ny = localSpeed ? uy / localSpeed : 0;
    const fx = -drag * nx - lift * ny, fy = -drag * ny + lift * nx;
    return { fx, fy, torque: rx * fy - ry * fx, dissipatedPower: -drag * localSpeed,
      localSpeed, alpha, lift, drag, cl, cd, q, stalled: Math.abs(sinAlpha) > stallSin };
  }
  const wing = surface(1 - p.tailAreaFraction, 0, p.incidence);
  const tail = surface(p.tailAreaFraction, p.tailArm, p.tailIncidence + control * p.controlIncidence);
  // Cap the SUM of magnitudes, not just net force; opposite surface forces
  // cannot hide an unbounded couple. Scale force and torque together to retain
  // the local-airflow energy identity. This is disclosed numerical tuning.
  const rawMagnitude = Math.hypot(wing.fx, wing.fy) + Math.hypot(tail.fx, tail.fy);
  const forceLimit = mass * p.maxAcceleration;
  const scale = Math.min(1, forceLimit / (rawMagnitude || 1));
  const fx = (wing.fx + tail.fx) * scale, fy = (wing.fy + tail.fy) * scale;
  const torque = tail.torque * scale;
  const translationalPower = fx * vx + fy * vy, rotationalPower = torque * angularVelocity;
  const power = (wing.dissipatedPower + tail.dissipatedPower) * scale;
  if (![rawMagnitude, forceLimit, fx, fy, torque, power, translationalPower, rotationalPower].every(Number.isFinite))
    throw new RangeError('Aerodynamic force or power magnitude overflow');
  return { fx, fy, torque, power,
    diagnostic: { speed, alpha: wing.alpha, lift: (wing.lift + tail.lift) * scale,
      drag: (wing.drag + tail.drag) * scale, liftCoefficient: wing.cl, dragCoefficient: wing.cd,
      translationalPower, rotationalPower, actuatorPower: 0, dynamicPressure: wing.q,
      forceLimited: scale < 1, speedLimited: wing.localSpeed > p.maxSpeed || tail.localSpeed > p.maxSpeed,
      inputLimited: control !== input, stalled: wing.stalled,
      tailAlpha: tail.alpha, tailStalled: tail.stalled,
      // Full-flow equilibrium is not auto-solved or imposed on the body.
      tailIncidence: p.tailIncidence + control * p.controlIncidence,
    },
  };
}
