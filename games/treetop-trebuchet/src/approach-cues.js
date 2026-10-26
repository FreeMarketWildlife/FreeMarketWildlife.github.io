/** Read-only linear approach estimate for already-existing physical encounters.
 * It never spawns, moves or changes collision bounds. Conservative payload radius
 * can warn about near misses; acceleration/rotation make this advisory, not a hit prediction.
 */
export function approachCues(player,encounters,{camera,width,height,scale,horizon=1.2,payloadRadius=1.5}={}){
 if(!player||!camera||![player.x,player.y,player.vx,player.vy,camera.x,camera.y,width,height,scale,horizon,payloadRadius].every(Number.isFinite)||width<100||height<120||scale<=0||horizon<=0||payloadRadius<0)return [];
 const project=p=>({x:width/2+(p.x-camera.x)*scale,y:height/2-(p.y-camera.y)*scale}),origin=project(player),cues=[];
 for(const e of encounters){if(![e.x,e.y,e.vx,e.vy,e.radius].every(Number.isFinite)||e.radius<=0)continue;
  const dx=e.x-player.x,dy=e.y-player.y,vx=player.vx-e.vx,vy=player.vy-e.vy,speed2=vx*vx+vy*vy;
  if(speed2<1)continue;const time=(dx*vx+dy*vy)/speed2;
  if(time<=0||time>horizon||Math.hypot(dx-vx*time,dy-vy*time)>e.radius+payloadRadius)continue;
  const p=project(e),r=e.radius*scale;
  // Retain the cue until the whole silhouette clears the rim and top HUD.
  // A single visible pixel or a body hidden behind the HUD is not useful notice.
  if(p.x-r>=8&&p.x+r<=width-8&&p.y-r>=72&&p.y+r<=height-8)continue;
  const ex=p.x-origin.x,ey=p.y-origin.y;
  const limits=[ex>0?(width-24-origin.x)/ex:ex<0?(24-origin.x)/ex:Infinity,ey>0?(height-24-origin.y)/ey:ey<0?(80-origin.y)/ey:Infinity];
  const t=Math.max(0,Math.min(1,...limits)),x=origin.x+ex*t,y=origin.y+ey*t;
  if(Math.hypot(x-origin.x,y-origin.y)<44)continue;
  cues.push({id:e.id,kind:e.kind,x,y,angle:Math.atan2(ey,ex),time,...(e.shape==='skid'?{interaction:'slide'}:e.shape==='cap'?{interaction:'bounce'}:{})});
 }
 const groups=[];
 for(const cue of cues.sort((a,b)=>a.time-b.time||String(a.id).localeCompare(String(b.id)))){const group=groups.find(g=>Math.hypot(g.x-cue.x,g.y-cue.y)<32);if(group){group.count++;group.members.push(cue.id);}else groups.push({...cue,count:1,members:[cue.id]});}
 return groups.slice(0,4);
}

/** Current swept fixture bounds conservatively extend the warning for a long or
 * stretched pose. The minimum retains the original near-pass margin. */
export function payloadWarningRadius(center,bounds){
 let radius=1.5;if(!center||![center.x,center.y].every(Number.isFinite))return radius;
 for(const box of bounds){const lo=box.lowerBound,hi=box.upperBound;if(!lo||!hi||![lo.x,lo.y,hi.x,hi.y].every(Number.isFinite))continue;for(const x of [lo.x,hi.x])for(const y of [lo.y,hi.y])radius=Math.max(radius,Math.hypot(x-center.x,y-center.y)+.25);}
 return radius;
}
