// Original hard-pixel entrance cues, shared by Map Studio and adventure rooms.
export function drawExitCue(c,x,y,{open=false,beam=1}={}){
 x=x*32;y=y*32;
 if(open){c.fillStyle='#253b37';c.fillRect(x,y+18,32,14);c.fillStyle='#e9daab';c.fillRect(x+2,y+20,28,6);
  if(beam>0){for(let d=0;d<48;d+=2){const spread=Math.floor(d/12)*2;c.fillStyle=d<16?'#e5d4a0':d<32?'#c6c39b':'#afbb9e';c.fillRect(x+4-spread,y+20-d,24+spread*2,2);}}
 }else{c.fillStyle='#4e5e53';c.fillRect(x+2,y+12,28,16);c.fillStyle='#c7ab77';c.fillRect(x+4,y+14,24,12);c.fillStyle='#728776';c.fillRect(x+6,y+16,20,8);c.fillStyle='#ecdbad';for(let a=8;a<=22;a+=6)c.fillRect(x+a,y+18,2,4);}
}
export function drawLandingDust(c,dust,now,{calm=false}={}){
 if(!dust)return;const age=now-dust.start;if(age<0||age>=300)return;
 const frame=calm?0:Math.floor(age/60),x=dust.x*32+16,y=(dust.y+1)*32-2;
 const clusters=frame===0?[[-18,-2,6,4],[12,-2,6,4]]:frame===1?[[-20,-4,6,4],[14,-4,6,4]]:frame===2?[[-22,-6,6,4],[16,-6,6,4],[-2,-2,4,2]]:frame===3?[[-24,-8,4,4],[20,-8,4,4]]:[[-24,-10,2,2],[22,-10,2,2]];
 for(const [dx,dy,w,h]of clusters){c.fillStyle='#aa906a';c.fillRect(x+dx,y+dy,w,h);c.fillStyle='#e2ce9b';c.fillRect(x+dx,y+dy,w,2);if(w>=4){c.fillRect(x+dx+2,y+dy-2,w-4,2);c.fillStyle='#c7ae7f';c.fillRect(x+dx+2,y+dy+h,w-4,2);}}
}
let bank;
export async function loadBuildingArt(){if(bank)return bank;const url=new URL('../assets/review/map-studio-r3/atlas.json',import.meta.url),m=await(await fetch(url)).json(),img=new Image();img.src=new URL(m.image,url).href;await img.decode();bank={img,frames:new Map(m.assets.map(a=>[a.id,a]))};return bank;}
export function drawBuilding(c,bank,o,{open=false,phase=0}={}){
 const a=bank.frames.get('building:'+o.type);if(!a)throw Error('Missing building '+o.type);const columns=a.rect[2]/32,width=o.w||columns,mid=Math.floor(columns/2),targetMid=Math.floor(width/2);for(let col=0;col<width;col++){const source=width===columns?col:col===targetMid?mid:col<targetMid?col===0?0:Math.min(col,mid-1):col===width-1?columns-1:columns-2;c.drawImage(bank.img,a.rect[0]+source*32,a.rect[1],32,a.rect[3],(o.x+col)*32,o.y*32+a.offsetY,32,a.rect[3]);}if(!open&&phase<2){const door=bank.frames.get('door:'+phase);c.drawImage(bank.img,...door.rect,(o.x+targetMid)*32,o.y*32+112,32,64);}
}

let fenceBank;
export async function loadFenceArt(){if(fenceBank)return fenceBank;const url=new URL('../assets/review/fence-r5/atlas.json',import.meta.url),m=await(await fetch(url)).json(),img=new Image();img.src=new URL(m.image,url).href;await img.decode();fenceBank={img,frames:new Map(m.assets.map(a=>[a.id,a]))};return fenceBank;}
