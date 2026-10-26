import {loadAtlas} from './atlas.js';
let atlas;
export async function loadTanoshiArt(){atlas=await loadAtlas(new URL('../assets/playable/tanoshi-outline/atlas.json',import.meta.url));}
export function drawTanoshi(c,individual){
  // Explicit bottom-center cell registration. Decorative discovery actors have
  // no blocker; neither rays nor tail infer collision or overhead projection.
  atlas.draw(c,individual.size||individual.variant,individual.x*32,individual.y*32);
}
