/** Immutable sprite definitions. Each frame is its own transparent pixel asset.
 * A future animation controller can change frame/position without changing art.
 */
export const SCENE_SPRITES = Object.freeze({
  landscape: Object.freeze({ path: '/assets/images/pixel/landscape.png', width: 263, height: 168 }),
  bird: Object.freeze({ path: '/assets/images/pixel/bird.png', width: 18, height: 16 }),
  butterfly: Object.freeze({
    width: 9, height: 8,
    pixels: Object.freeze(['000000000','110000011','111010111','011111110','001111100','011010110','010010010','000000000']),
  }),
});

export async function loadSceneSprites() {
  const entries = await Promise.all(Object.entries(SCENE_SPRITES).map(async ([name, definition]) => {
    if (definition.path) {
      const image = new Image();
      image.src = definition.path;
      await image.decode();
      return [name, image];
    }
    const canvas = document.createElement('canvas');
    canvas.width = definition.width;
    canvas.height = definition.height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    definition.pixels.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') context.fillRect(x, y, 1, 1);
    }));
    return [name, canvas];
  }));
  return Object.fromEntries(entries);
}
