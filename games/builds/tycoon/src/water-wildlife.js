export const WATER_FRAMES=32,WATER_FRAME_SECONDS=.1,WATER_LOOP_SECONDS=WATER_FRAMES*WATER_FRAME_SECONDS;
// Review-only ecology: no adventure state or collision mutations.
export const fishWindow=minute=>(minute>=360&&minute<480)||(minute>=1080&&minute<1200);
export function createTurtle(x,y){return {x,y,phase:'basking',age:0};}
export function updateTurtle(t,hero,seconds,{calm=false}={}){
 t.age+=seconds;
 if(t.phase==='basking'&&Math.hypot(hero.x-t.x,hero.y-t.y)<72){t.phase='sliding';t.age=0;}
 else if(t.phase==='sliding'&&t.age>=(calm?.1:.8)){t.phase='submerged';t.age=0;}
 else if(t.phase==='submerged'&&t.age>8&&Math.hypot(hero.x-t.x,hero.y-t.y)>100){t.phase='returning';t.age=0;}
 else if(t.phase==='returning'&&t.age>=1){t.phase='basking';t.age=0;}
 return t;
}
export function turtleOffset(t){const f=t.phase==='sliding'?Math.min(1,t.age/.8):t.phase==='returning'?1-Math.min(1,t.age):t.phase==='submerged'?1:0;return {x:Math.round(f*22),y:Math.round(f*12),visible:t.phase!=='submerged'};}
export function fishPose(time,index,minute,calm=false){if(!fishWindow(minute)||calm)return null;const phase=(time+index*2.7)%9;if(phase>1.4)return null;const p=phase/1.4;return {x:Math.round(p*32),y:-Math.round(Math.sin(p*Math.PI)*29),frame:p<.4?0:p<.7?1:2,splash:p>.8};}
export async function loadWaterArt(){const url=new URL('../assets/review/water-wildlife/atlas.json',import.meta.url),m=await(await fetch(url)).json(),img=new Image();img.src=new URL(m.image,url).href;await img.decode();const entries=new Map(m.assets.map(a=>[a.id,a]));return (c,id,x,y)=>{const a=entries.get(id);c.drawImage(img,a.x,a.y,32,32,Math.round(x),Math.round(y),32,32);};}
