import {BEAR_ART} from './route-bear.js';
let image;
export async function loadBearArt(){image=new Image();image.src=new URL('../assets/playable/tanoshi-outline/bear.png',import.meta.url);await image.decode();if(image.width!==96||image.height!==96)throw Error('Invalid native bear frame');return image;}
export function drawBear(c,x,y){c.drawImage(image,x*32+BEAR_ART.drawOffset[0],y*32+BEAR_ART.drawOffset[1]);}
