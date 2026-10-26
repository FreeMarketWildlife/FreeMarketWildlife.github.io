import {surfaceY} from './terrain.js?v=66';
// Linear, read-only advice for fixed authored geometry. Target the likely contact
// section of a long branch, rather than its offscreen midpoint or whole length.
// Gravity/drag/rotation make this advisory, just like moving encounter cues.
export function terrainApproaches(player,layout,{horizon=1.2,payloadRadius=1.5}={}){
 if(!player||![player.x,player.y,player.vx,player.vy,horizon,payloadRadius].every(Number.isFinite)||horizon<=0||payloadRadius<0)return [];
 const obstacles=layout.bumpers.map((p,i)=>({id:`terrain-bumper-${i}`,kind:p.shape==='deflector'?'wooden deflector':'wooden bumper',...p,vx:0,vy:0}));
 for(const s of layout.surfaces){const rate=player.vy-(s.slope??0)*player.vx,distance=player.y-surfaceY(s,player.x);if(Math.abs(rate)<1)continue;
  const time=-distance/rate;if(time<=0||time>horizon)continue;
  const x=player.x+player.vx*time;if(x<s.minX-payloadRadius||x>s.maxX+payloadRadius)continue;
  const targetX=Math.max(s.minX,Math.min(s.maxX,x));obstacles.push({id:`terrain-${s.id}`,kind:s.id==='ground'?'ground':'branch',x:targetX,y:surfaceY(s,targetX),vx:0,vy:0,radius:.2});
 }return obstacles;
}
