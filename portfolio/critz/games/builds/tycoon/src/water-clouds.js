// Review-only sunny weather; no adventure weather/save schema change.
export const CLOUD_START=600,CLOUD_END=900;
export const cloudsVisible=(minute,weather='sunny')=>weather==='sunny'&&minute>=CLOUD_START&&minute<CLOUD_END;
export function cloudSun(minute){const a=Math.PI*(Math.max(CLOUD_START,Math.min(CLOUD_END,minute))-360)/720;return {east:Math.cos(a),up:Math.sin(a)};}
export async function loadCloudArt(){const url=new URL('../assets/review/water-clouds/atlas.json',import.meta.url),manifest=await(await fetch(url)).json(),image=new Image();image.src=new URL(manifest.image,url).href;await image.decode();return {manifest,draw(c,variant,minute,x,y){const m=Math.max(600,Math.min(900,Math.floor(minute))),n=variant*301+m-600;c.save();c.translate(Math.round(x),Math.round(y)+64);c.scale(1,-1);c.drawImage(image,n%12*96,Math.floor(n/12)*64,96,64,0,0,96,64);c.restore();}};}
