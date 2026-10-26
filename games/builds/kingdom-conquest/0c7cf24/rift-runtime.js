/* Full world mode only. Classic arena keeps its original initialization/art.
 * Geometry is shared by browser and authoritative simulation. */
if(MAP){
window.STRUCTURE_MODELS=[{id:'structure:tower',model:'assets/structures/tower.glb',worldHeight:360},{id:'structure:barracks',model:'assets/structures/barracks.glb',worldHeight:210},{id:'structure:castle',model:'assets/structures/castle.glb',worldHeight:550},{id:'structure:rubble',model:'assets/structures/rubble.glb',worldHeight:45}];
const riftLegacyInit=init,riftLegacySpawn=spawnWave,riftNeutralGround=[];
const riftJunglePaths=[[[1450,9000],[3000,9500],[3800,9500],[5200,9000],[6200,6000]],[[2500,13000],[3800,11900],[5700,12300],[6500,11000],[7500,7500]],[[1400,6000],[2600,6800],[4000,6500],[5500,4800]]];
for(const line of [...riftJunglePaths])riftJunglePaths.push(line.map(([x,y])=>[W-x,H-y]));
const riftPolys=MAP.walls.map(points=>({points,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))}));
for(const poly of riftPolys)poly.edges=poly.points.map((a,i)=>{const b=poly.points[(i+1)%poly.points.length];return {a,b,minX:Math.min(a[0],b[0]),maxX:Math.max(a[0],b[0]),minY:Math.min(a[1],b[1]),maxY:Math.max(a[1],b[1])}});
const riftBins=new Map(),RIFT_BIN=600;
for(const p of riftPolys)for(let y=Math.floor(p.minY/RIFT_BIN);y<=Math.floor(p.maxY/RIFT_BIN);y++)for(let x=Math.floor(p.minX/RIFT_BIN);x<=Math.floor(p.maxX/RIFT_BIN);x++){const key=x+','+y;if(!riftBins.has(key))riftBins.set(key,[]);riftBins.get(key).push(p)}
function riftNear(p,line,r){return line.slice(1).some((b,i)=>segmentDistance(p,line[i],b)<r)}
function riftInside(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
function riftTerrainBlocked(x,y,r=45){const p={x,y};if(x<110+r||y<110+r||x>W-110-r||y>H-110-r)return true;
 // Authored roads and river banks are deliberately kept connected through the
 // supplied contour trace; these same corridors are painted over the wall art.
 if(MAP.fountains.some(b=>dist(p,b)<650)||bases.some(b=>dist(p,b)<2100)||lanes.some(l=>riftNear(p,l,MAP.laneWidth/2-r))||riftNear(p,river,MAP.riverWidth/2-r)||riftJunglePaths.some(l=>riftNear(p,l,230-r)))return false;
 const candidates=new Set();for(let by=Math.floor((y-r)/RIFT_BIN);by<=Math.floor((y+r)/RIFT_BIN);by++)for(let bx=Math.floor((x-r)/RIFT_BIN);bx<=Math.floor((x+r)/RIFT_BIN);bx++)for(const poly of riftBins.get(bx+','+by)||[])candidates.add(poly);
 for(const poly of candidates){if(x<poly.minX-r||x>poly.maxX+r||y<poly.minY-r||y>poly.maxY+r)continue;if(riftInside(p,poly.points)||poly.edges.some(e=>x>=e.minX-r&&x<=e.maxX+r&&y>=e.minY-r&&y<=e.maxY+r&&segmentDistance(p,e.a,e.b)<r))return true}return false;
}
blocked=function(x,y,r=45){if(riftTerrainBlocked(x,y,r))return true;for(const o of obstacles){const radius=o.r+r;if(radius>0&&Math.hypot(x-o.x,y-o.y)<radius)return true}return false};
walkablePoint=function(p,r=55){p={x:clamp(p.x,180,W-180),y:clamp(p.y,180,H-180)};if(!blocked(p.x,p.y,r))return p;for(let radius=50;radius<=1200;radius+=50)for(let a=0;a<TAU;a+=.25){const q={x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius};if(!blocked(q.x,q.y,r))return q}return p};
init=function(){riftLegacyInit();units=units.filter(u=>u.kind==='hero');obstacles=[];trees=[];rocks=[];brush=[];decals=[];
 for(let team=0;team<2;team++){
  const castle=add({...bases[team],team,kind:'castle',name:team?'Crimson Castle':'Verdant Castle',hp:6500,range:750,damage:110,radius:MAP.structureRadii.castle});obstacles.push({...bases[team],r:MAP.structureRadii.castle,structure:castle});
  for(let lane=0;lane<3;lane++){
   for(const [x,y]of MAP.towers[team][lane]){const tower=add({x,y,team,kind:'tower',name:'Watchtower',hp:2400,range:775,damage:100,radius:MAP.structureRadii.tower,lane,solid:true});obstacles.push({x,y,r:MAP.structureRadii.tower,structure:tower})}
   const [x,y]=MAP.barracks[team][lane],bar=add({x,y,team,kind:'barracks',name:'Barracks',hp:1500,radius:MAP.structureRadii.barracks,lane,range:0,damage:0});obstacles.push({x,y,r:MAP.structureRadii.barracks,structure:bar});
  }
 }
 for(const [x,y,name,hp,radius]of MAP.bosses)add({x,y,home:{x,y},team:2,kind:'boss',name,hp,damage:80,range:250,radius,speed:250});
 for(const [cx,cy,name]of MAP.camps){const {x,y}=walkablePoint({x:cx,y:cy},80);add({x,y,home:{x,y},team:2,kind:'camp',name,hp:850,damage:25,range:150,radius:45,speed:260})}
 riftNeutralGround.length=0;for(const u of units.filter(u=>u.team===2))riftNeutralGround.push({name:u.name,kind:u.kind,x:u.home.x,y:u.home.y,home:{...u.home}});
 buildNav();nextWave=5;terrainCache=null;mini.width=200;mini.height=202;
};
spawnWave=function(){riftLegacySpawn();const counts=new Map();for(const u of units.filter(u=>(u.kind==='minion'||u.kind==='siege')&&u.riftWave!==true)){u.riftWave=true;u.speed=u.kind==='siege'?300:325;u.radius*=1.8;u.range=u.ranged?500:140;const key=u.team+':'+u.lane,slot=counts.get(key)||0;counts.set(key,slot+1);const start=(u.team?.975:.025)+(u.team?1:-1)*slot*.002,p=walkablePoint(pointOnLane(u.lane,start));u.x=p.x;u.y=p.y;u.progress=start;u.path=[];u.navDest=null}};
// A fixed 2048px overview costs 16 MiB regardless of world dimensions. It is
// rendered once from our own vector terrain; dynamic gameplay stays full scale.
paintTerrain=function(){ctx.fillStyle='#274736';ctx.fillRect(0,0,W,H);
 const random=rng(58211);for(let i=0;i<1600;i++){const x=random()*W,y=random()*H;ellipse(x,y,90+random()*170,70+random()*110,i%2?'#31523c':'#35583e')}
 for(const poly of riftPolys){polygon(poly.points,'#142f28','#52715a');}
 for(const line of riftJunglePaths){path(line,470,'#314f38');path(line,390,'#61744d')}
 for(const l of lanes){path(l,MAP.laneWidth+110,'#1b382c');path(l,MAP.laneWidth,'#6d7b53');path(l,MAP.laneWidth-100,'#92946e');path(l,MAP.laneWidth-200,'#a0a17b')}
 path(river,MAP.riverWidth+150,'#668363');path(river,MAP.riverWidth,'#3a7778');path(river,MAP.riverWidth-180,'#398d99');
 for(const [i,b]of bases.entries()){ellipse(b.x,b.y,2050,2050,'#708577');ellipse(b.x,b.y,1800,1800,'#8a9884');ellipse(b.x,b.y,1500,1500,'#738778');for(let a=0;a<TAU;a+=.3){const x=b.x+Math.cos(a)*1850,y=b.y+Math.sin(a)*1850;ellipse(x,y,55,55,'#b8b99c')}const f=MAP.fountains[i];ellipse(f.x,f.y,460,460,'#415e55');ellipse(f.x,f.y,320,320,i?'#a56a68':'#438f9c');text('FOUNTAIN',f.x,f.y-450,110,'#e2ddbe')}
 // Repaint roads through base pads so their exits remain readable.
 for(const l of lanes){path(l,MAP.laneWidth-180,'#92946e')}
 path(river,MAP.riverWidth-80,'#3a8188');path(river,MAP.riverWidth-260,'#4696a0');
 for(const u of riftNeutralGround){ellipse(u.home.x,u.home.y,u.kind==='boss'?550:260,u.kind==='boss'?450:220,u.kind==='boss'?'#4f7771':'#697a54');if(u.kind==='boss')text(u.name==='Dragex'?'MOUNT YOKAI':'MORANE BAY',u.x,u.y+650,110,'#ded3ac')}
};
const riftTiles=new Map(),RIFT_TILE=1024;
terrain=function(){if(!terrainCache){riftTiles.clear();terrainCache=document.createElement('canvas');const scale=2048/Math.max(W,H);terrainCache.width=Math.ceil(W*scale);terrainCache.height=Math.ceil(H*scale);const live=ctx;ctx=terrainCache.getContext('2d');ctx.scale(scale,scale);paintTerrain();ctx=live}
 const x0=Math.max(0,Math.floor((camera.x-canvas.clientWidth/camera.zoom/2)/RIFT_TILE)),x1=Math.min(Math.ceil(W/RIFT_TILE)-1,Math.floor((camera.x+canvas.clientWidth/camera.zoom/2)/RIFT_TILE)),y0=Math.max(0,Math.floor((camera.y-canvas.clientHeight/(camera.zoom*.83)/2)/RIFT_TILE)),y1=Math.min(Math.ceil(H/RIFT_TILE)-1,Math.floor((camera.y+canvas.clientHeight/(camera.zoom*.83)/2)/RIFT_TILE));
 if(camera.zoom<.25||(x1-x0+1)*(y1-y0+1)>20){ctx.drawImage(terrainCache,0,0,W,H);return}
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const key=x+','+y;let tile=riftTiles.get(key);if(!tile){tile=document.createElement('canvas');tile.width=tile.height=RIFT_TILE+2;const live=ctx;ctx=tile.getContext('2d');ctx.translate(1-x*RIFT_TILE,1-y*RIFT_TILE);paintTerrain();ctx=live;riftTiles.set(key,tile)}else{riftTiles.delete(key);riftTiles.set(key,tile)}ctx.drawImage(tile,x*RIFT_TILE-1,y*RIFT_TILE-1)}
 while(riftTiles.size>24)riftTiles.delete(riftTiles.keys().next().value);
};
drawMini=function(){const mw=mini.width,mh=mini.height;mc.clearRect(0,0,mw,mh);if(terrainCache)mc.drawImage(terrainCache,0,0,mw,mh);else{mc.fillStyle='#254c39';mc.fillRect(0,0,mw,mh)}for(const u of units){if(u.hp<=0)continue;mc.fillStyle=u===selected?'#f4ef9a':u.team===0?'#78d4db':u.team===1?'#f18c7d':'#dfc894';mc.beginPath();mc.arc(u.x/W*mw,u.y/H*mh,u.kind==='hero'?3:u.kind==='castle'?4:1.7,0,TAU);mc.fill()}mc.strokeStyle='#fff2b9';mc.lineWidth=1;mc.strokeRect((camera.x-canvas.clientWidth/camera.zoom/2)/W*mw,(camera.y-canvas.clientHeight/(camera.zoom*.83)/2)/H*mh,canvas.clientWidth/camera.zoom/W*mw,canvas.clientHeight/(camera.zoom*.83)/H*mh)};
window.RiftMap={descriptor:MAP,terrainBlocked:riftTerrainBlocked,route:(a,b)=>route(a,b),laneLengths:laneMetrics.map(l=>l.total),benchmarkSpeed:350,terrainMemory:()=>({overviewBytes:terrainCache?terrainCache.width*terrainCache.height*4:0,tiles:riftTiles.size,tileBytes:riftTiles.size*(RIFT_TILE+2)*(RIFT_TILE+2)*4,limitTiles:24})};
}
