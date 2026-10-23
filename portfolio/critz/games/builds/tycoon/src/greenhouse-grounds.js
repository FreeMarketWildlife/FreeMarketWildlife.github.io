import {drawContactSprite} from './contact-rules.js';
import {worldFoot,centeredCamera} from './world-space.js';
import {drawEnvironmentTile} from './environment-render.js';
import {applyLighting} from './lighting.js';
let greenhouse;
export async function loadGreenhouseGrounds(){greenhouse=new Image();greenhouse.src=new URL('../assets/review/luke-greenhouse-r2/greenhouse.png',import.meta.url);await greenhouse.decode();}
export function renderGreenhouseGrounds(c,state,time,view,character){
 const foot=worldFoot(view.x,view.y),camera=centeredCamera(foot,c.canvas.width,c.canvas.height,state.gender);
 c.imageSmoothingEnabled=false;c.fillStyle='#426c43';c.fillRect(0,0,c.canvas.width,c.canvas.height);c.save();c.translate(-camera.x,-camera.y);
 for(let y=0;y<13;y++)for(let x=0;x<13;x++)drawEnvironmentTile(c,x>=5&&x<=7&&y>=8?'meadow.path.255.0':`meadow.grass.${(x*7+y*11)%16}`,x*32,y*32);
 const contact=drawContactSprite(c,greenhouse,[0,0,320,192],[48,64,320,192],[1,2,11,6],{kind:'building',key:'luke-greenhouse',overheadRows:2});
 c.fillStyle='#294f40';c.fillRect(107+contact.dx,140+contact.dy,202,29);c.fillStyle='#fff0c6';c.font='bold 12px monospace';c.textAlign='center';c.fillText("LUKE’S GREENHOUSE",208+contact.dx,159+contact.dy);
 c.fillStyle='#294f40';c.fillRect(150,385,116,24);c.fillStyle='#fff0c6';c.font='bold 10px monospace';c.fillText('↓ ROOTPORT',208,401);
 character(c,foot.x,foot.y,{gender:state.gender,facing:view.facing,pose:view.pose,mode:view.action==='run'?'run':'walk'});c.restore();const lighting=applyLighting(c,state);
 return {camera,playerFoot:foot,width:c.canvas.width,height:c.canvas.height,scene:state.scene,lighting,contact};
}
