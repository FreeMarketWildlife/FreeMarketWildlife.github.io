/* One native art grid per scene. Zoom repeats every art pixel by the same
   whole number of device pixels, including on high-density mobile displays. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CADPixelGrid = api;
})(typeof globalThis === 'object' ? globalThis : this, function (root) {
  'use strict';

  function density(value = root.devicePixelRatio || 1) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('Pixel density must be positive.');
    return value;
  }

  function nativeSize(canvas) {
    const { width, height } = canvas;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new RangeError('Scene dimensions must be positive native-pixel integers.');
    }
    return { width, height };
  }

  function available(value, name) {
    if (value !== Infinity && (!Number.isFinite(value) || value < 0)) {
      throw new RangeError(name + ' must be nonnegative.');
    }
    return value;
  }

  function integerScale(value) {
    if (!Number.isInteger(value) || value < 1) throw new RangeError('Scene zoom must use whole device pixels.');
    return value;
  }

  function fitScale(canvas, availableWidth, availableHeight = Infinity, dpr = density()) {
    const size = nativeSize(canvas);
    density(dpr);
    const horizontal = available(availableWidth, 'Available width') * dpr / size.width;
    const vertical = available(availableHeight, 'Available height') * dpr / size.height;
    const fit = Math.min(horizontal, vertical);
    if (!Number.isFinite(fit)) throw new RangeError('At least one scene bound must be finite.');
    // If one physical pixel per art pixel cannot fit, report overflow instead
    // of shrinking selected pixels or introducing a fractional art grid.
    return Math.max(1, Math.floor(fit + 1e-9));
  }

  function alignScene(canvas, dpr = density()) {
    density(dpr);
    canvas.style.translate = 'none';
    if (!canvas.getBoundingClientRect) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(rect.left * dpr) / dpr - rect.left;
    const y = Math.round(rect.top * dpr) / dpr - rect.top;
    canvas.style.translate = x + 'px ' + y + 'px';
    return { x, y };
  }

  function applyScene(canvas, options = {}) {
    const size = nativeSize(canvas), dpr = density(options.dpr);
    const availableWidth = options.availableWidth ?? canvas.parentElement?.clientWidth ?? size.width;
    const availableHeight = options.availableHeight ?? Infinity;
    available(availableWidth, 'Available width');
    available(availableHeight, 'Available height');
    const maxScale = options.maxScale === undefined ? Infinity : integerScale(options.maxScale);
    const scale = Math.min(maxScale, options.scale === undefined
      ? fitScale(canvas, availableWidth, availableHeight, dpr)
      : integerScale(options.scale));
    const cssWidth = size.width * scale / dpr;
    const cssHeight = size.height * scale / dpr;
    Object.assign(canvas.style, {
      width: cssWidth + 'px', height: cssHeight + 'px',
      maxWidth: 'none', maxHeight: 'none', flexShrink: '0',
      imageRendering: 'pixelated'
    });
    const context = canvas.getContext?.('2d');
    if (context) context.imageSmoothingEnabled = false;
    const origin = alignScene(canvas, dpr);
    return {
      nativeWidth: size.width, nativeHeight: size.height,
      scale, dpr, cssScale: scale / dpr, cssWidth, cssHeight, origin,
      overflowX: cssWidth > availableWidth + 1e-9,
      overflowY: cssHeight > availableHeight + 1e-9
    };
  }

  return Object.freeze({ fitScale, applyScene, alignScene });
});
