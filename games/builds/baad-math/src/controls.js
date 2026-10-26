export const holdRate = seconds => seconds >= 3 ? 64 : seconds >= 1 ? 32 : seconds >= .5 ? 16 : 0;
export const newHold = () => ({ age: 0, next: .5 });
export function stepHold(hold, dt, tick) {
  hold.age += dt;
  while (hold.age + 1e-9 >= hold.next) { tick(); hold.next += 1 / holdRate(hold.next); }
}
// Human input allowance follows the same acceleration, with extra reading time.
export function countTime(change) {
  const remaining = Math.max(0, Math.abs(change) - 1); // The initial press counts once.
  if (!remaining) return .25;
  // No repeats before .5s, then 8 counts before 1s and 64 before 3s.
  if (remaining <= 8) return .75 + remaining / 16;
  if (remaining <= 72) return 1.25 + (remaining - 8) / 32;
  return 3.25 + (remaining - 72) / 64;
}
export function bindCounting({ minus, plus, tap, active }) {
  let held = null;
  const stop = () => { held = null; };
  const start = (key, delta, event) => {
    if (!active()) return;
    held = { ...newHold(), key, delta };
    tap(delta, event);
  };
  for (const [button, delta] of [[minus, -1], [plus, 1]]) {
    button.addEventListener('pointerdown', e => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); button.setPointerCapture(e.pointerId); start(e.pointerId, delta, e);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, e => { if (held?.key === e.pointerId) stop(); });
    button.addEventListener('click', e => { if (e.detail === 0) tap(delta); });
    button.addEventListener('contextmenu', e => e.preventDefault());
  }
  const direction = key => ['ArrowLeft', 'a', 'A'].includes(key) ? -1 : ['ArrowRight', 'd', 'D'].includes(key) ? 1 : 0;
  addEventListener('keydown', e => { const delta = direction(e.key); if (delta) { e.preventDefault(); if (!e.repeat) start(e.code, delta); } });
  addEventListener('keyup', e => { if (held?.key === e.code) stop(); });
  addEventListener('blur', stop);
  document.addEventListener('visibilitychange', stop);
  return { stop, step(dt) { if (!active()) return stop(); if (held) stepHold(held, dt, () => tap(held.delta)); } };
}
export const operationCountTime = (type, change) => ['×2', '÷2'].includes(type.id) ? .25 : countTime(change);
export function encounterPreview(type, change, first = true) {
  const teaching = first ? Math.min(1.5, type.slow) : 1 + Math.min(.12, (type.slow - 1) * .15);
  const budget = Math.min(2.2, operationCountTime(type, change));
  if (Math.abs(change) <= 1) return .8 * teaching;
  // Preserve hold-input budget without multiplying it by a tutorial slowdown.
  return Math.max(.8 * teaching, (budget + (first ? .45 : .20)) / .8);
}
