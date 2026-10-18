import { loadSceneSprites } from './scene-sprites.js';

/** A transparent, viewport-sized, event-rendered stage. No animation runs.
 * Future motion belongs in a separate controller that updates actor transforms
 * and requests a render. Never scale individual sprites independently.
 */
const stage = document.querySelector('[data-pixel-scene]');
if (stage) {
  const layers = new Map([...stage.querySelectorAll('canvas')].map(canvas => [canvas.dataset.sceneLayer, canvas]));
  let sprites;
  const state = {
    animation: false,
    actors: [
      { id: 'perched-bird', sprite: 'bird', frame: 0, layer: 'wildlife', visible: true },
      { id: 'butterfly-one', sprite: 'butterfly', frame: 0, layer: 'wildlife', visible: true },
      { id: 'butterfly-two', sprite: 'butterfly', frame: 0, layer: 'wildlife', visible: true },
    ],
  };
  function render() {
    const pixel = parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'), 10);
    const columns = Math.ceil(stage.clientWidth / pixel);
    const rows = Math.ceil(stage.clientHeight / pixel);
    const contexts = new Map();
    for (const [name, canvas] of layers) {
      canvas.width = columns;
      canvas.height = rows;
      canvas.style.width = `${columns * pixel}px`;
      canvas.style.height = `${rows * pixel}px`;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = false;
      contexts.set(name, context);
    }
    stage.dataset.pixelSize = String(pixel);
    stage.dataset.grid = `${columns}x${rows}`;
    if (!sprites) return;
    const portrait = stage.clientWidth <= 680;
    const compact = portrait && stage.clientHeight < 700;
    const shortLandscape = !portrait && stage.clientHeight < 480;
    // Mobile gets a compact composition, with every output pixel still on the
    // same grid. Only scenery is cropped; the DOM navigation is never scaled.
    const landscapeWidth = compact ? 184 : 263;
    const landscapeHeight = compact ? 118 : 168;
    let x = columns - landscapeWidth + (portrait ? 30 : 0);
    let y = rows - landscapeHeight - (portrait ? 32 : 0);
    if (shortLandscape) { x = columns - 230; y = rows - 148; }
    x = Math.round(x); y = Math.round(y);
    contexts.get('scenery').drawImage(sprites.landscape, x, y, landscapeWidth, landscapeHeight);
    const ratio = landscapeWidth / 263;
    const positions = [
      [Math.round(x + 75 * ratio), Math.round(y + 94 * ratio)],
      [Math.round(x + 166 * ratio), Math.round(y + 124 * ratio)],
      [Math.round(x + 240 * ratio), Math.round(y + 91 * ratio)],
    ];
    state.actors.forEach((actor, index) => {
      [actor.x, actor.y] = positions[index];
      if (actor.visible) contexts.get(actor.layer).drawImage(sprites[actor.sprite], actor.x, actor.y);
    });
    stage.dataset.ready = 'true';
  }
  // ResizeObserver handles orientation and browser chrome changes; there is no
  // requestAnimationFrame, interval, or timer driving the scene.
  new ResizeObserver(render).observe(stage);
  loadSceneSprites().then(loaded => { sprites = loaded; render(); }).catch(() => {
    stage.dataset.ready = 'error'; // Navigation remains fully usable without art.
  });
  render();
}
