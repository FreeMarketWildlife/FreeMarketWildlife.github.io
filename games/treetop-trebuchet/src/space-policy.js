import {mapLevels,spaceScale} from './grove-map.js?v=70';
import {critter} from './build-catalog.js?v=70';

const finite=(value,low,high)=>Number.isFinite(value)&&value>=low&&value<=high;
/** Enough world context to validate a completed run after an editor-map change.
 * This is not a copy of the user's world or a claim about real lunar escape. */
export function spaceWorldDescriptor(map){
 const version=map?.version,height=map?.height,treeHeight=map?.tree?.height??map?.treeHeight,launchY=map?.launch?.y??map?.launchY;
 if(![2,3,4].includes(version)||(version===4?height!==3000:!finite(height,600,3000))||!finite(treeHeight,version===4?40:350,version===4?140:1800)||launchY!==(version===2?300:version===4?32:600))throw Error('Invalid space world.');
 return{version,height,treeHeight,launchY};
}
/** An authored arcade boundary, above the crown and the reduced-gravity field. */
export function escapeAltitude(map){
 const world=spaceWorldDescriptor(map),k=spaceScale(world),spaceStart=mapLevels(world).find(l=>l.id==='space').low;
 return Math.max(world.height,spaceStart+80*k,world.treeHeight+100*k);
}
/** Released-body callers only. A point already above the boundary is not a new
 * crossing, and descending or non-finite poses cannot qualify. */
export function spaceCrossingFraction(previous,current,threshold,launchY=0){
 if(!finite(threshold,0,10000)||!Number.isFinite(launchY)||![previous?.y,current?.y,current?.vy].every(Number.isFinite)||current.vy<=0)return null;
 const from=previous.y+launchY,to=current.y+launchY;
 if(from>threshold||to<threshold||!(to>from))return null;
 return Math.max(0,Math.min(1,(threshold-from)/(to-from)));
}
const signed=(object,key,limit=1e6)=>{if(!finite(object?.[key],-limit,limit))throw Error('Invalid space pose.');return object[key];};
const positive=(object,key,limit=1e6)=>{if(!finite(object?.[key],0,limit))throw Error('Invalid space result.');return object[key];};
const note=(value,label)=>{if(typeof value!=='string'||value.length>300)throw Error(`Invalid space ${label}.`);return value;};
/** Canonical immutable crossing data. Live drift is never used as reward input.
 * Validation returns only known fields and never mutates a simulation or save. */
export function validateSpaceEscape(record){
 if(!record||record.version!==1)throw Error('Invalid space escape.');
 const world=spaceWorldDescriptor(record.world),threshold=escapeAltitude(world),altitude=positive(record,'altitude',10000),time=positive(record,'time');
 if(!finite(record.threshold,0,10000)||Math.abs(record.threshold-threshold)>1e-6||Math.abs(altitude-threshold)>1e-5)throw Error('Invalid space boundary.');
 const a=critter(record.animal);if(record.grams!==a.grams)throw Error('Invalid space volunteer.');
 const payload={x:signed(record.payload,'x'),y:signed(record.payload,'y'),vx:signed(record.payload,'vx'),vy:signed(record.payload,'vy'),angle:signed(record.payload,'angle'),omega:signed(record.payload,'omega')};
 if(payload.vy<=0||Math.abs(payload.y+world.launchY-altitude)>1e-5)throw Error('Space escape must record an upward boundary crossing.');
 const source=record.release,release={x:signed(source,'x'),y:signed(source,'y'),vx:signed(source,'vx'),vy:signed(source,'vy'),time:positive(source,'time'),speed:positive(source,'speed'),angle:signed(source,'angle'),energy:positive(source,'energy',1e18),reason:note(source?.reason,'release')};
 if(release.time>time||Math.abs(release.speed-Math.hypot(release.vx,release.vy))>1e-6*Math.max(1,release.speed))throw Error('Invalid space release.');
 const distance=positive(record,'distance'),height=positive(record,'height'),failure=note(record.failure,'failure');
 if(!['','Sling cord snapped','Beam overloaded'].includes(failure))throw Error('An invalid flight cannot escape.');
 if(height+1e-5<payload.y)throw Error('Invalid space height.');
 return{version:1,world,threshold,altitude,time,payload,distance,height,release,failure,grams:a.grams,animal:a.id};
}
