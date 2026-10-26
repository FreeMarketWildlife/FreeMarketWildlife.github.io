// Player controls produce dyadic rationals. Keep their numerator/denominator
// exact instead of allowing repeated halves and additions to round to a target.
const gcd = (a, b) => b ? gcd(b, a % b) : a < 0n ? -a : a;
export function rational(n = 0n, d = 1n) {
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
export const addUnit = (q, delta, negatives = true) => {
  const n = q.n + BigInt(delta) * q.d;
  return rational(!negatives && n < 0n ? 0n : n, q.d);
};
export const transformExact = (q, op) => op === '×2' ? rational(q.n * 2n, q.d) : rational(q.n, q.d * 2n);
export const numeric = q => {
  const whole = q.n / q.d, remainder = q.n % q.d;
  // Divide before converting: huge dyadic denominators cannot yield Infinity/Infinity.
  return Number(whole) + Number(remainder * 1000000000000000n / q.d) / 1e15;
};
export const exactText = q => {
  if (q.d === 1n) return String(q.n);
  if (q.d > 65536n) return `${q.n}/${q.d}`;
  const digits = q.d.toString(2).length - 1;
  const scaled = (q.n < 0n ? -q.n : q.n) * 5n ** BigInt(digits);
  const text = String(scaled).padStart(digits + 1, '0');
  return `${q.n < 0n ? '-' : ''}${text.slice(0,-digits)}.${text.slice(-digits).replace(/0+$/, '')}`;
};
export const matches = (count, target, q) => q ? q.n === BigInt(target) * q.d : count === target;
