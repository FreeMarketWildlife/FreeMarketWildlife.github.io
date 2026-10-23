/* Art inspection uses the same native assets as the opt-in game renderer. */
(()=>{
 const A=window.ButtonwoodArt,P=A.palette,scene=document.getElementById('scene'),g=scene.getContext('2d');
 const favicon=document.createElement('link');favicon.rel='icon';favicon.href=A.buildingIcon('home').toDataURL();document.head.append(favicon);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let paused=reduced,last=0,time=0,skyOffset=90;
 const skyTime=document.getElementById('sky-time');
 skyTime.onchange=()=>{skyOffset=({sunrise:0,day:90,sunset:150,night:210}[skyTime.value])-time/1000;paused=false;pauseLabel()};
 const pause=document.getElementById('pause');
 function pauseLabel(){pause.textContent=paused?'Play animation':'Pause animation';pause.setAttribute('aria-pressed',String(paused))}pauseLabel();
 pause.onclick=()=>{paused=!paused;pauseLabel()};
 for(const type of ['home','workshop','storehouse','forge','blacksmith'])document.getElementById(type+'-icon').getContext('2d').drawImage(A.buildingIcon(type),0,0);
 document.getElementById('worker-icon').getContext('2d').drawImage(A.workerIcon(),0,0);
 for(const material of ['dirt','stone','wood','leaves','deepslate','obsidian','copperOre']){
  const figure=document.createElement('figure'),c=document.createElement('canvas');c.width=c.height=32;c.setAttribute('role','img');c.setAttribute('aria-label',material==='copperOre'?'Copper ore':material);
  const cg=c.getContext('2d');cg.drawImage(A.tile(material==='copperOre'?'stone':material),0,0);if(material==='copperOre')cg.drawImage(A.ore('copperOre'),0,0);
  const caption=document.createElement('figcaption');caption.textContent=material==='copperOre'?'Copper ore':material[0].toUpperCase()+material.slice(1);figure.append(c,caption);document.getElementById('materials').append(figure);
 }
 for(const [kind,tier,label] of [['move',0,'Move'],['pick',0,'Stone'],['pick',1,'Iron'],['pick',2,'Steel'],['pick',3,'Titanium'],['craft',0,'Craft'],['info',0,'Details'],['wood',0,'Wood'],['stone',0,'Stone block'],['dirt',0,'Dirt'],['deepslate',0,'Deepslate'],['leaves',0,'Leaves'],['obsidian',0,'Obsidian'],['bucket',0,'Empty bucket'],['bucket','water','Water bucket'],['bucket','lava','Lava bucket']]){
  const figure=document.createElement('figure'),icon=A.uiIcon(kind,tier),caption=document.createElement('figcaption');
  icon.setAttribute('role','img');icon.setAttribute('aria-label',label);caption.textContent=label;figure.append(icon,caption);document.getElementById('ui-icons').append(figure);
 }
 // Extraction art uses native world canvases and separately drawn UI miniatures.
 for(const [mask,kind,label]of [[5,'oil','Oil riser'],[10,'water','Water line'],[3,'lava','Lava bend'],[11,'oil','Tee'],[15,'water','Cross'],[0,null,'Capped']]){
  const figure=document.createElement('figure'),c=A.extractionSprite('pipe',{mask,kind,active:true}),caption=document.createElement('figcaption');
  c.setAttribute('role','img');c.setAttribute('aria-label',label);caption.textContent=label;figure.append(c,caption);document.getElementById('extraction-pipes').append(figure);
 }
 for(const [type,label]of [['pumpjack','Pumpjack'],['tank','Tank'],['pipe','Pipe'],['oil','Oil'],['bucket:oil','Oil bucket'],['remove','Reclaim pipe']]){
  const c=A.extractionIcon(type);c.setAttribute('role','img');c.setAttribute('aria-label',label);c.title=label;document.getElementById('extraction-icons').append(c);
 }
 // Show an actual connected tile field, including cut corners and material joins.
 const field=['dddddddddddd','ddddddddddds','dddddddddsss','ddddd..dssss','ddd....sssss','ssssssssssss'];
 const terrainStudy=document.getElementById('terrain-study'),tg=terrainStudy.getContext('2d');
 const materialAt=(x,y)=>({d:'dirt',s:'stone'}[field[y]?.[x]]??null);
 tg.fillStyle=P.cave;tg.fillRect(0,0,384,192);
 for(let y=0;y<6;y++)for(let x=0;x<12;x++){
  const material=materialAt(x,y);if(!material)continue;
  const neighbors={meadow:y===0};
  for(const [side,dx,dy]of [['n',0,-1],['e',1,0],['s',0,1],['w',-1,0],['ne',1,-1],['se',1,1],['sw',-1,1],['nw',-1,-1]])neighbors[side]=materialAt(x+dx,y+dy);
  tg.drawImage(A.terrain(material,x,y,neighbors),x*32,y*32);
 }
 // ART-BIBLE §§3–5, 8, 10: unchanged native art under the shared depth lighting.
 const fogStudies=[],fogNeighbors=Object.fromEntries(['n','e','s','w','ne','se','sw','nw'].map(side=>[side,'stone']));
 for(let layer=0;layer<=A.burialFog.maxLayer;layer++){
  const figure=document.createElement('figure'),c=document.createElement('canvas'),caption=document.createElement('figcaption');
  c.width=c.height=32;c.dataset.fogLayer=String(layer);c.setAttribute('role','img');c.setAttribute('aria-label',(layer?'Buried layer '+layer:'Exposed block')+': stone, copper ore and a mole under the same lighting');
  caption.textContent=layer?String(layer):'Exposed';figure.append(c,caption);document.getElementById('fog-study').append(figure);fogStudies.push({c,layer});
 }
 const artZoom=document.getElementById('art-zoom');
 function setZoom(){const z=Number(artZoom.value);for(const c of document.querySelectorAll('[data-worker]')){c.style.width=40*z+'px';c.style.height=32*z+'px'}for(const c of document.querySelectorAll('[data-building]')){const scale=Math.max(1,Math.min(z,2,Math.floor(c.closest('.buildings').clientWidth/c.width)));c.style.width=c.width*scale+'px';c.style.height=c.height*scale+'px'}}
 if(innerWidth<640)artZoom.value='2';artZoom.onchange=setZoom;setZoom();
 addEventListener('resize',setZoom);
 const frame=(state)=>A.frameFor(state,time);
 const wildlifeStudies=[];
 for(const species of ['bird','butterfly','worm','mole','rabbit','firefly']){
  const sprite=A.wildlifeSprite(species,{}),c=document.createElement('canvas'),figure=document.createElement('figure'),caption=document.createElement('figcaption');
  c.width=sprite.width;c.height=sprite.height;c.style.width=c.width+'px';c.style.height=c.height+'px';c.setAttribute('role','img');c.setAttribute('aria-label',species+' animation');caption.textContent=species[0].toUpperCase()+species.slice(1);figure.append(c,caption);document.getElementById('wildlife-studies').append(figure);wildlifeStudies.push({c,species});
  const icon=A.wildlifeBucketIcon(species);icon.setAttribute('role','img');icon.setAttribute('aria-label','Bucket of '+species);icon.title='Bucket of '+species;document.getElementById('wildlife-icons').append(icon);
 }
 for(const [type,label]of [['cageSmall','Small cage'],['cageMedium','Medium cage'],['cageLarge','Large cage']]){
  const sprite=A.cageSprite(type,{layer:'all'}),figure=document.createElement('figure'),caption=document.createElement('figcaption');sprite.style.width=sprite.width+'px';sprite.style.height=sprite.height+'px';sprite.setAttribute('role','img');sprite.setAttribute('aria-label',label);caption.textContent=label;figure.append(sprite,caption);document.getElementById('cage-studies').append(figure);
  const icon=A.cageIcon(type);icon.title=label;icon.setAttribute('role','img');icon.setAttribute('aria-label',label);document.getElementById('wildlife-icons').append(icon);
 }
 const biomeStudy=document.getElementById('biome-study'),biomeSelect=document.getElementById('biome-study-select');
 const workers=[...document.querySelectorAll('[data-worker]')],buildings=[...document.querySelectorAll('[data-building]')],extraction=[...document.querySelectorAll('[data-extraction]')];
 function render(now){
  if(!paused&&last&&now-last<250)time+=now-last;last=now;
  const container=scene.parentElement.clientWidth,zoom=container>=800?2:1;
  if(scene.width!==Math.floor(container)||scene.height!==180*zoom){scene.width=Math.floor(container);scene.height=180*zoom}
  g.setTransform(zoom,0,0,zoom,0,0);g.imageSmoothingEnabled=false;
  const w=scene.width/zoom,offset=Math.floor((w-416)/2),ground=160;
  const clock=skyOffset+time/1000,day=Math.floor(clock/240)+1;
  const sky=A.paintSky(g,{width:Math.ceil(w),height:180,ground,camX:0,seconds:clock%240,day});skyTime.value=sky.phase;
  for(let x=0;x<w;x+=32)g.drawImage(A.terrain('dirt',Math.floor(x/32),0,{n:null,e:'dirt',s:'dirt',w:'dirt',ne:null,nw:null,se:'dirt',sw:'dirt',meadow:true}),x,ground);
  g.save();g.translate(offset+28,ground-128);A.paintBuilding(g,'home',time,false);g.restore();
  g.save();g.translate(offset+248,ground-128);A.paintBuilding(g,'workshop',time,true);g.restore();
  A.paintGarden(g,offset+5,ground);A.paintGarden(g,offset+391,ground);
  g.drawImage(A.worker({state:'idle',frame:frame('idle'),variant:0}),offset+174-18,ground-31);
  const wx=offset+211+Math.round(Math.sin(time/2500)*14);
  g.drawImage(A.worker({state:'walk',frame:frame('walk'),variant:1,dir:Math.cos(time/2500)<0?-1:1}),wx-18,ground-31);
  g.save();g.fillStyle=sky.tint.color;g.globalAlpha=sky.tint.alpha;g.fillRect(0,0,w,180);g.restore();
  for(const [type,x]of [['home',28],['workshop',248]]){g.save();g.translate(offset+x,ground-128);A.paintBuildingLights(g,type,sky.darkness,time);g.restore()}
  for(const [i,c] of workers.entries()){const cg=c.getContext('2d');cg.clearRect(0,0,40,32);cg.drawImage(A.worker({state:c.dataset.worker,frame:frame(c.dataset.worker),variant:i}),0,0)}
  for(const c of buildings){const cg=c.getContext('2d');cg.clearRect(0,0,c.width,c.height);A.paintBuilding(cg,c.dataset.building,time,['workshop','forge','blacksmith'].includes(c.dataset.building))}
  for(const c of extraction){const cg=c.getContext('2d');cg.clearRect(0,0,c.width,c.height);cg.drawImage(A.extractionSprite(c.dataset.extraction,{frame:Math.floor(time/A.extractionFrameMs)%6,active:c.dataset.active==='true',kind:c.dataset.kind||null,fill:Number(c.dataset.fill||0)}),0,0)}
  for(const {c,species}of wildlifeStudies){const cg=c.getContext('2d');cg.clearRect(0,0,c.width,c.height);cg.drawImage(A.wildlifeSprite(species,{frame:Math.floor(time/A.wildlifeFrameMs[species])%4,burrowing:['worm','mole'].includes(species)}),0,0)}
  for(const {c,layer}of fogStudies){
   const cg=c.getContext('2d');cg.imageSmoothingEnabled=false;
   cg.drawImage(A.terrain('stone',0,16,fogNeighbors),0,0);cg.drawImage(A.ore('copperOre',1),0,0);
   cg.drawImage(A.wildlifeSprite('mole',{frame:Math.floor(time/A.wildlifeFrameMs.mole)%4}),4,15);
   cg.save();cg.globalAlpha=A.burialFog.opacity(layer);cg.fillStyle=P.buriedShade;cg.fillRect(0,0,32,32);cg.restore();
  }
  biomeStudy.width=Math.floor(biomeStudy.parentElement.clientWidth);const bg=biomeStudy.getContext('2d');bg.imageSmoothingEnabled=false;
  A.paintSky(bg,{width:biomeStudy.width,height:320,ground:286,camX:time/45,seconds:clock%240,day,biomeSeed:1709,biomeWeights:{[biomeSelect.value]:1}});
  for(let x=0;x<biomeStudy.width;x+=32)bg.drawImage(A.terrain('dirt',Math.floor(x/32),0,{n:null,e:'dirt',s:'dirt',w:'dirt',meadow:true}),x,286);
  requestAnimationFrame(render);
 }
 requestAnimationFrame(render);
})();
