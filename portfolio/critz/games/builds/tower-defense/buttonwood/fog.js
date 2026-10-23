// Read-only, cardinal distance from exposed terrain. No physics or save state.
(function () {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const maxLayer = 10, firstOpacity = .28, maxOpacity = .96;
  function opacity(layer) {
    if (!(layer > 0)) return 0;
    return firstOpacity + (maxOpacity - firstOpacity) * (Math.min(maxLayer, layer) - 1) / (maxLayer - 1);
  }
  function build({ left, top, width, height, isExposed }) {
    const layers = new Uint8Array(width * height).fill(maxLayer);
    const queue = new Int32Array(layers.length);
    let head = 0, tail = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (isExposed(left + x, top + y)) { layers[i] = 0; queue[tail++] = i; }
    }
    const visit = (i, layer) => {
      if (layers[i] <= layer) return;
      layers[i] = layer; queue[tail++] = i;
    };
    while (head < tail) {
      const i = queue[head++], layer = layers[i] + 1;
      if (layer >= maxLayer) continue;
      const x = i % width;
      if (x > 0) visit(i - 1, layer);
      if (x + 1 < width) visit(i + 1, layer);
      if (i >= width) visit(i - width, layer);
      if (i + width < layers.length) visit(i + width, layer);
    }
    return { left, top, width, height, layers,
      at(cx, cy) {
        const x = cx - left, y = cy - top;
        return x >= 0 && x < width && y >= 0 && y < height ? layers[y * width + x] : maxLayer;
      }
    };
  }
  A.burialFog = Object.freeze({ maxLayer, firstOpacity, maxOpacity, opacity, build });
})();
