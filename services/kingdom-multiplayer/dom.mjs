// The battle is shared with the browser; the server never renders or loads assets.
export function createDOM() {
  const drawing = new Proxy({}, { get: () => () => {}, set: () => true });
  const element = () => ({
    innerHTML: '', textContent: '', children: [], clientWidth: 1200, clientHeight: 760,
    width: 180, height: 140, style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, getContext: () => drawing, prepend() {}, appendChild() {}, remove() {},
    querySelectorAll: () => [], querySelector: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 760 }),
  });
  const elements = new Map();
  const document = {
    body: element(), hidden: false, visibilityState: 'visible',
    addEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
    createElement: element,
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  };
  const window = { document, devicePixelRatio: 1, addEventListener() {}, dispatchEvent() {} };
  return { document, window, requestAnimationFrame() {} };
}
