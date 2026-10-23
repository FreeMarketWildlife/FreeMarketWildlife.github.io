import {enemyRecipe} from './grove-map.js?v=49';
/** External impact punctuation belongs to a recorded surface, never the moving
 * volunteer or decorative art. Reads immutable simulation maps and events only. */
const sources=new WeakMap(),MAX_AGE=.23;
function sourceIndex(map){
 if(!map||!Array.isArray(map.objects))return null;
 if(!sources.has(map))sources.set(map,new Map(map.objects.map(o=>[o.id,o])));
 return sources.get(map);
}
export function surfaceImpactSource(sim,hit){
 if(!hit||!Number.isFinite(hit.seq)||!Number.isFinite(hit.time)||!Number.isFinite(hit.x)||!Number.isFinite(hit.y)||!Number.isFinite(hit.strength)||!hit.normal||![hit.normal.x,hit.normal.y].every(Number.isFinite)||Math.hypot(hit.normal.x,hit.normal.y)<1e-8)return null;
 if(['foliage','sap'].includes(hit.material))return null;
 const source=hit.id==='forest-floor'?{id:'forest-floor',type:'ground',material:'stone',collision:true,bounce:.18}:sourceIndex(sim.map)?.get(hit.id);
 if(!source||source.collision!==true||['foliage','sap'].includes(source.material))return null;
 return source;
}
export function recentContactFeedback(sim){
 if(!sim?.release||sim.phase!=='flight'||!Number.isFinite(sim.time))return null;
 const eligible=[];
 for(const hit of sim.contactEvents??[]){
  if(!hit)continue;
  const age=sim.time-hit.time;if(age<0||age>MAX_AGE||(hit.strength<.3&&!hit.power))continue;
  const source=surfaceImpactSource(sim,hit);if(source)eligible.push({hit,source});
 }
 if(!eligible.length)return null;
 const latest=Math.max(...eligible.map(e=>e.hit.time));
 // All manifolds/powers resolved in one solver tick share its timestamp. The
 // strongest wins, with sequence as deterministic tie-breaker; no stacked words.
 const {hit,source}=eligible.filter(e=>Math.abs(e.hit.time-latest)<1e-8).sort((a,b)=>b.hit.strength-a.hit.strength||b.hit.seq-a.hit.seq)[0];
 const effect=source.type==='enemy'?enemyRecipe(source.kind)?.effect:null;
 const word=hit.power?(effect==='snare'?'SNAG!':['gust','updraft','spin'].includes(effect)?'POP!':'BUMP!'):(['leaf','bumper'].includes(source.material)&&source.bounce>=.6?'BOING!':'BONK!');
 const length=Math.hypot(hit.normal.x,hit.normal.y),age=sim.time-hit.time;
 return{id:hit.id,seq:hit.seq,x:hit.x,y:hit.y,time:hit.time,normal:{x:hit.normal.x/length,y:hit.normal.y/length},word,alpha:.85*Math.max(0,1-age/MAX_AGE)};
}
export function layoutContactWord(feedback,project,{width,height}={}){
 if(!feedback||typeof feedback.word!=='string'||!feedback.normal||![feedback.normal.x,feedback.normal.y,feedback.alpha].every(Number.isFinite)||![width,height].every(Number.isFinite)||width<160||height<150)return null;
 const point=project(feedback);if(!Array.isArray(point)||!point.every(Number.isFinite))return null;
 const x=point[0]+feedback.normal.x*24,y=point[1]-feedback.normal.y*24,half=feedback.word.length*4.5+3;
 const bounds={left:x-half,right:x+half,top:y-12,bottom:y+4};
 // Suppress whole words near screen edges or fixed controls; never pin a word
 // somewhere else on screen, which would falsely relocate the contact source.
 if(point[0]<0||point[0]>width||point[1]<0||point[1]>height||bounds.left<12||bounds.right>width-12||bounds.top<96||bounds.bottom>height-16)return null;
 if(bounds.left<88&&bounds.right>0&&bounds.bottom>92&&bounds.top<402)return null;
 return{x,y,point:[...point],word:feedback.word,alpha:feedback.alpha};
}
export function drawContactWord(c,feedback,project,viewport){
 const word=layoutContactWord(feedback,project,viewport);if(!word||word.alpha<=0)return;
 c.save();c.globalAlpha=word.alpha;c.font='bold 12px Trebuchet MS,sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#fff0ba';c.strokeText(word.word,word.x,word.y);c.fillStyle='#594e3e';c.fillText(word.word,word.x,word.y);c.restore();
}
