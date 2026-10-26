import {escapeAltitude} from './space-policy.js?v=70';
import {mapLevels,gravityScaleAt} from './grove-map.js?v=70';

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const metres=v=>`${Math.abs(v)>=1e7?v.toExponential(1):Math.round(v).toLocaleString('en-US')} m`;
/** A schematic Y-only chart: forest/tree detail is expanded and sky compressed.
 * Fractions run from the top of the strip. Never infer escape from altitude.
 * The simulation must explicitly supply spaceState === 'escaped'. */
export function altitudeStripState({map,altitude,animal,spaceState='bound',gravityFactor}={}){
 if(!map?.tree||!map?.launch)throw Error('An authored Grove map is required.');
 const treeCenter=map.tree.height/2,spaceStart=map.version===4?960:mapLevels(map).find(l=>l.id==='space').low;
 // Old custom maps can put a tall tree above the start of starlight. Keep the
 // tree centre in the middle and move the compression break above that crown.
 const skyBreak=Math.max(spaceStart,map.tree.height),top=escapeAltitude(map);
 const crownBottom=map.tree.height-(map.tree.crownDepth??map.tree.height*.5);
 const anchors=map.version===4?[{altitude:0,fraction:.94},{altitude:8,fraction:.75},{altitude:crownBottom,fraction:.5},{altitude:map.tree.height,fraction:.25},{altitude:top,fraction:.025}]:[{altitude:0,fraction:.94},{altitude:treeCenter,fraction:.5},{altitude:skyBreak,fraction:.24},{altitude:top,fraction:.065}];
 const fractionAt=y=>{
  if(y<=0)return anchors[0].fraction;if(y>=top)return anchors.at(-1).fraction;
  for(let i=1;i<anchors.length;i++)if(y<=anchors[i].altitude){const a=anchors[i-1],b=anchors[i],t=(y-a.altitude)/(b.altitude-a.altitude);return a.fraction+(b.fraction-a.fraction)*t;}
 };
 const known=typeof altitude==='number'&&!Number.isNaN(altitude),escaped=spaceState==='escaped';
 const edge=!known?'unknown':altitude<0?'below':altitude>top?'above':'inside';
 // Prepared volunteers still use ordinary gravity; only the released body
 // receives the map's altitude field. Prefer an explicit actual solver factor.
 const actualGravity=Number.isFinite(gravityFactor)&&gravityFactor>=0&&gravityFactor<=1?gravityFactor:null;
 const gravity=known?(actualGravity??gravityScaleAt(altitude,map)):null;
 const status=!known?'Height unknown':escaped?'Free drift':gravity<.999?'Low gravity':'In the grove';
 const altitudeLabel=!known?'Altitude unavailable':!Number.isFinite(altitude)?(altitude>0?'Above map':'Below floor'):metres(altitude);
 const displayLabel=edge==='above'?`${metres(top)}+`:edge==='below'?'Below 0 m':altitudeLabel;
 const name=animal?.name??'Critter';
 const landmarks={floor:{altitude:0,fraction:fractionAt(0)},tree:{altitude:treeCenter,fraction:fractionAt(treeCenter)},crown:{altitude:map.tree.height,fraction:fractionAt(map.tree.height)},space:{altitude:spaceStart,fraction:fractionAt(spaceStart)},top:{altitude:top,fraction:fractionAt(top)}};
 const label=`${name}: ${altitudeLabel}. ${status}${!escaped&&known?`; gravity ${Math.round(gravity*100)} percent`:''}. Height only; horizontal distance is not shown. Nonlinear scale: upper sky compressed. Forest floor 0 m; Grandfather Tree centre ${metres(treeCenter)}, crown ${metres(map.tree.height)}; starlight ${metres(spaceStart)}; free-drift boundary ${metres(top)}.${edge==='below'?' Marker is pinned below the floor.':edge==='above'?' Marker is pinned above the map.':''}`;
 return{altitude,altitudeLabel,displayLabel,animalId:animal?.id??'',spaceState:escaped?'escaped':'bound',status,gravityFactor:gravity,fraction:known?fractionAt(altitude):null,edge,anchors,landmarks,label};
}
const line=(c,points,color,width=1)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
const oval=(c,x,y,rx,ry,fill)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();};
/** Draw in CSS pixels; caller owns canvas backing scale, layout and ARIA label.
 * Pass the existing drawCritter function as drawMarker to reuse every species.
 * Stateless drawing follows pause/retry/resize without an animation clock. */
export function drawAltitudeStrip(c,{width=44,height=420,map,altitude,animal,spaceState='bound',gravityFactor,drawMarker}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Finite positive strip dimensions required.');
 const state=altitudeStripState({map,altitude,animal,spaceState,gravityFactor}),cx=width/2,left=2,right=width-2,w=right-left;
 c.save();c.clearRect(0,0,width,height);c.lineJoin='round';c.lineCap='round';
 c.beginPath();c.roundRect(left,1,w,height-2,Math.min(12,w/2));c.clip();
 const sky=c.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#212846');sky.addColorStop(.23,'#626c9a');sky.addColorStop(.25,'#abc5bc');sky.addColorStop(.46,'#91aa75');sky.addColorStop(.56,'#356e54');sky.addColorStop(.72,'#204e42');sky.addColorStop(.84,'#536747');sky.addColorStop(1,'#4e4031');c.fillStyle=sky;c.fillRect(left,1,w,height-2);
 // Fixed star/planet shapes never animate while paused or suggest X movement.
 for(const [x,y,r]of[[.22,.095,.8],[.76,.145,1],[.65,.045,.6],[.29,.19,.6]])oval(c,width*x,height*y,r,r,'#fff1c2');
 oval(c,cx,height*.1,Math.min(7,w*.2),Math.min(7,w*.2),'#d7d5b8');oval(c,cx+3,height*.1-2,Math.min(6,w*.17),Math.min(6,w*.17),'#535f7b');
 // A full jungle stratum: overlapping trees, understory and hanging vines.
 // It fills the second quarter rather than leaving a bare oak trunk there.
 if(map.version===4){
  const jungleTop=height*state.anchors[2].fraction,jungleBottom=height*state.anchors[1].fraction,depth=jungleBottom-jungleTop;
  for(let i=0;i<7;i++){
   const x=left+w*(.1+i*.135),top=jungleTop+depth*(.08+(i%3)*.13),base=jungleBottom+depth*.1;
   line(c,[[x,base],[x,top]],i%2?'#665b36':'#82704a',Math.max(1,w*.045));
   for(const [dx,dy]of[[-.08,.07],[.09,.11],[0,0]])oval(c,x+w*dx,top+depth*dy,w*(.16+(i%2)*.025),depth*.14,['#285c46','#397d50','#568e55'][i%3]);
   if(i%2===0)line(c,[[x+w*.08,top+depth*.05],[x+w*.11,top+depth*.36],[x+w*.05,top+depth*.54]],'#91a463',.8);
  }
  for(let i=0;i<8;i++)oval(c,left+w*(i+.4)/8,jungleBottom-depth*(.02+(i%2)*.1),w*.15,depth*.14,i%2?'#366c45':'#527f49');
 }
 // Roots and crown span their actual model altitudes on the nonlinear chart.
 const floorY=height*state.landmarks.floor.fraction,treeY=height*state.landmarks.tree.fraction,crownY=height*state.landmarks.crown.fraction;
 c.fillStyle='#785335';c.fillRect(cx-2.8,crownY+4,5.6,floorY-crownY);
 line(c,[[cx-2,floorY-5],[cx-10,floorY+2]],'#bd9760',2);line(c,[[cx+2,floorY-5],[cx+10,floorY+3]],'#bd9760',2);
 line(c,[[cx,treeY+20],[cx-10,treeY+9]],'#bd9760',2);line(c,[[cx,treeY+7],[cx+10,treeY-4]],'#bd9760',2);
 const crownBottomY=map.version===4?height*state.anchors[2].fraction:crownY+22;
 // Crown width follows its world proportions at this vertical scale. The
 // narrow strip crops the sides; it must never squeeze the whole crown in.
 const crownDepth=crownBottomY-crownY,crownRadius=map.version===4?map.tree.crownRadius*crownDepth/map.tree.crownDepth:w*.44;
 oval(c,cx,(crownY+crownBottomY)/2,crownRadius,crownDepth/2,'#557d50');
 for(const [offset,fraction]of[[-.28,.3],[.25,.5],[-.22,.7]])oval(c,cx+crownRadius*offset,crownY+crownDepth*fraction,crownRadius*.72,crownDepth*.29,fraction===.5?'#73975d':'#86a76b');
 c.fillStyle='#b79560';c.fillRect(left,floorY+3,w,height-floorY);line(c,[[left,floorY+3],[right,floorY+3]],'#e3d5a1',1);
 c.restore();
 // Outline and marker are outside the clipped background: arrows remain clear.
 c.save();c.beginPath();c.roundRect(left,1,w,height-2,Math.min(12,w/2));c.strokeStyle='#e4dfb9';c.lineWidth=1;c.stroke();
 if(state.fraction!==null){
  const y=clamp(height*state.fraction,13,height-18),radius=Math.min(13,w*.35);
  oval(c,cx,y,radius,radius,'#fff0ba');c.beginPath();c.ellipse(cx,y,radius,radius,0,0,Math.PI*2);c.strokeStyle='#293b36';c.lineWidth=1.5;c.stroke();
  if(drawMarker&&animal)drawMarker(c,animal,cx,y,Math.min(23,w*.68),0,false);
  if(state.edge==='above'||state.edge==='below'){const d=state.edge==='above'?-1:1,ay=y+d*(radius+3);line(c,[[cx-3,ay-d*3],[cx,ay],[cx+3,ay-d*3]],'#fff4c9',2);}

 }
 c.restore();return state;
}
