import {surfaceCrossing} from './terrain.js?v=71';
import {world as layout} from './world.js?v=71';
export function capturePredictionPose(scene){return {elapsed:scene.elapsed,parts:scene.parts.map(b=>({id:b.getUserData().id,x:b.getPosition().x,y:b.getPosition().y,angle:b.getAngle()}))};}
export function predictionPoseIsCurrent(scene,capture){
 if(!capture||scene.elapsed<capture.elapsed||scene.elapsed-capture.elapsed>1||scene.parts.length!==capture.parts.length)return false;
 return scene.parts.every((b,i)=>{const p=capture.parts[i],q=b.getPosition();return p.id===b.getUserData().id&&Math.hypot(q.x-p.x,q.y-p.y)<=.2&&Math.abs(b.getAngle()-p.angle)<=.4;});
}
// Same canonical physics, advanced in bounded RAF-sized slices rather than pointer events.
export function createPredictionJob(scene,{now=()=>performance.now()}={}){
 if(scene.phase!=='loading'||scene.hand||scene.control||!scene.isLoaded())return null;
 const began=now(),clone=scene.clone();clone.unlatch();const cloneMs=now()-began,points=[];
 let done=false,cancelled=false,result=null,launchTicks=0,flightTicks=0,cpuMs=cloneMs;
 const finish=(reason,obstacle=null)=>{done=true;result={points,release:clone.release??undefined,reason,obstacle};};
 return {get done(){return done;},get cancelled(){return cancelled;},get result(){return result;},get stats(){return {cloneMs,cpuMs,launchTicks,flightTicks};},
  cancel(){done=true;cancelled=true;result=null;},
  advance({maxSteps=300,budgetMs=2.5}={}){
   if(!Number.isInteger(maxSteps)||maxSteps<1||!Number.isFinite(budgetMs)||budgetMs<=0)throw new Error('Invalid prediction budget');
   if(done)return result;const start=now();
   for(let i=0;i<maxSteps&&!done;i++){
    if(i&&now()-start>=budgetMs)break;
    if(!clone.release){clone.step();launchTicks++;if(clone.release)points.push(clone.center());else if(launchTicks>=3000)finish('No separation within five seconds');}
    else {const before=clone.center();clone.step();flightTicks++;const after=clone.center();
     const impact=clone.events.find(e=>e.type==='impact'),surface=layout.surfaces.find(s=>surfaceCrossing(before,after,s,{clearance:.5,bothDirections:true}));
     if(impact||surface)finish('Same physical snapshot; clipped before obstacle',surface?.id??impact?.surface??'obstacle');else {if((flightTicks-1)%30===0)points.push(after);if(flightTicks>=480)finish('Same physical snapshot; short hint');}
    }
   }
   cpuMs+=now()-start;return result;
  }
 };
}

export function predictionAdvice(preview){
 const c=preview?.release?.center;if(!c)return '';
 if(![c.vx,c.vy].every(Number.isFinite))return '';
 const motion=`Release hint: ${Math.abs(c.vx).toFixed(1)} m/s ${c.vx<0?'backward':'forward'}, ${Math.abs(c.vy).toFixed(1)} m/s ${c.vy<0?'down':'up'}.`;
 const obstacle=preview.obstacle==='launch branch'?' Hint stops before the launch branch; compare a different rail mounting or sling length.':'';
 return motion+(c.vx<=0?' Change rail mounting or the load position and compare the next hint.':c.vx<3?' Low forward speed; compare counterweight or rail settings.':'')+obstacle;
}
