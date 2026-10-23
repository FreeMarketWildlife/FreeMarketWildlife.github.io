/** Provisional animation state observes motion/contact; never alters a body. */
export function encounterAnimationState({time,lastContact=null,player,enemy,radius=1}){
 if(!Number.isFinite(time)||!player||!enemy)return 'idle';if(Number.isFinite(lastContact)&&time>=lastContact&&time-lastContact<.35)return 'post';
 const dx=enemy.x-player.x,dy=enemy.y-player.y,vx=player.vx-enemy.vx,vy=player.vy-enemy.vy,speed2=vx*vx+vy*vy;if(![dx,dy,vx,vy,radius].every(Number.isFinite)||speed2<1)return 'idle';const t=(dx*vx+dy*vy)/speed2;return t>0&&t<.5&&Math.hypot(dx-vx*t,dy-vy*t)<radius+1.5?'pre':'idle';
}
