/* Recyke depth study. Each city stratum is independently authored and translated.
 * No flattened skyline image is sampled, cropped, duplicated, or loaded here.
 * Canvas 2D only; the same deterministic drawing runs in browsers and Node. */
(function (root) {
  'use strict';
  const W = 1280, H = 720, FLOOR = 593, TAU = Math.PI * 2;
  const layers = Object.freeze([
    { id: 'sky', label: 'Sky / high cloud', factor: .015 },
    { id: 'horizon', label: 'Remote industrial horizon', factor: .035 },
    { id: 'needles', label: 'Distant antenna district', factor: .070 },
    { id: 'towers', label: 'Corporate towers', factor: .120 },
    { id: 'transit', label: 'Elevated transit / moving train', factor: .185 },
    { id: 'apartments', label: 'Apartment towers', factor: .275 },
    { id: 'utilities', label: 'Cooling stacks / service roofs', factor: .370 },
    { id: 'bridges', label: 'Enclosed pedestrian bridges', factor: .455 },
    { id: 'signs', label: 'Holographic advertising', factor: .535 },
    { id: 'workshops', label: 'Workshop blocks', factor: .605 },
    { id: 'street', label: 'Occupied street / shops', factor: .700 },
    { id: 'wires', label: 'Local service wires / beacons', factor: .855 }
  ].map(Object.freeze));
  function transformX(worldX, camera, factor, parallax = true) {
    return worldX - camera * (parallax ? factor : 1);
  }
  const mod = (n,d) => ((n % d) + d) % d;
  const hash = (n) => { const k = Math.sin(n * 127.1 + 311.7) * 43758.5453; return k-Math.floor(k); };
  function line(g, p, c, w=1) { g.beginPath(); p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.strokeStyle=c;g.lineWidth=w;g.lineJoin='round';g.stroke(); }
  function poly(g,p,c,stroke=null,w=1) { g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fillStyle=c;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=w;g.stroke();} }
  function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
  function glow(g,x,y,r,c) { const f=g.createRadialGradient(x,y,0,x,y,r);f.addColorStop(0,c);f.addColorStop(1,'transparent');g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2); }
  function ellipse(g,x,y,rx,ry,c){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=c;g.fill();}
  function bands(g,y,h,color,alpha) { const grad=g.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'transparent');grad.addColorStop(.5,`rgba(${color},${alpha})`);grad.addColorStop(1,'transparent');g.fillStyle=grad;g.fillRect(0,y,W,h); }
  // Repeat an entire authored district, never a slice of a composite painting.
  function repeat(g, camera, factor, depth, period, callback) {
    const shift=camera*(depth?factor:1), start=Math.floor(shift/period)-1;
    for(let tile=start;tile<=start+Math.ceil(W/period)+2;tile++) {
      const dx=tile*period-shift;
      if(dx>W+100||dx+period<-100)continue;
      g.save();g.translate(dx,0);callback(dx);g.restore();
    }
  }
  function windows(g,x,y,w,h,seed,palette,spacing=12,detail=1) {
    const sx=spacing,sy=spacing*1.45, cols=Math.max(1,Math.floor((w-12)/sx));
    for(let row=0;row<Math.floor((h-14)/sy);row++)for(let col=0;col<cols;col++) {
      const r=hash(seed*311+row*43+col*17);
      if(r<.41)continue;
      const xx=x+6+col*sx,yy=y+8+row*sy;
      rect(g,xx,yy,detail===1?2:4,detail===1?3:6,palette[r>.89?2:r>.66?1:0]);
      if(detail>1&&r>.78)rect(g,xx+5,yy,2,6,palette[0]);
    }
  }
  // Faceted roof profiles, setback shoulders, service cores and actual open gaps.
  function tower(g,b,style,screenOffset=null) {
    const {x,y,w,h,seed,kind=0}=b,{body,side,edge,lit,dim,hot}=style;
    // The draw() clip is 0..W in this local space. Include contour/antenna margin;
    // only fully clipped towers may skip their windows and structural line work.
    if(screenOffset!==null&&(x+w+2+screenOffset<0||x-2+screenOffset>W)){
      // Later contours inherit the round joins set by line() in a full tower.
      g.lineJoin='round';return;
    }
    const roof=kind%4;
    let points;
    if(roof===0)points=[[x,y+h],[x,y+18],[x+w*.19,y+18],[x+w*.19,y],[x+w*.72,y],[x+w*.72,y+10],[x+w,y+10],[x+w,y+h]];
    else if(roof===1)points=[[x,y+h],[x,y+20],[x+w*.13,y+20],[x+w*.13,y+5],[x+w*.67,y],[x+w,y+17],[x+w,y+h]];
    else if(roof===2)points=[[x,y+h],[x,y+8],[x+w*.08,y],[x+w*.84,y],[x+w,y+16],[x+w,y+h]];
    else points=[[x,y+h],[x,y],[x+w*.72,y],[x+w*.72,y+32],[x+w,y+32],[x+w,y+h]];
    poly(g,points,body,edge,.9);
    poly(g,[[x+w*.77,y+16],[x+w,y+20],[x+w,y+h],[x+w*.77,y+h]],side);
    line(g,[[x+2,y+23],[x+2,y+h]],edge,.8);
    windows(g,x+4,y+22,w*.71,h-25,seed,[dim,lit,hot],style.spacing||12,style.detail||1);
    for(let yy=y+38;yy<y+h;yy+=style.spacing?style.spacing*5:54)line(g,[[x+3,yy],[x+w-3,yy]],edge,.65);
    if(kind%3===0){rect(g,x+w*.62,y+25,2,h-30,lit);rect(g,x+w*.68,y+25,1,h-30,edge);}
    // Facade recesses break the large shapes into structural volumes. Fine,
    // low-contrast hatching belongs to each tower rather than a screen overlay.
    rect(g,x+w*.78,y+25,w*.13,h-27,side);
    for(let yy=y+37;yy<y+h-6;yy+=11)line(g,[[x+w*.80,yy],[x+w*.91,yy+2]],edge,.35);
    if(w>58){
      line(g,[[x+w*.35,y+28],[x+w*.35,y+h]],edge,.5);
      for(let yy=y+45;yy<y+h-9;yy+=79){
        const xx=x+w*.40;rect(g,xx,yy,w*.21,19,side);
        for(let q=0;q<4;q++)line(g,[[xx+2,yy+3+q*4],[xx+w*.21-2,yy+3+q*4]],edge,.5);
      }
    }
    const aerial=x+w*.48;
    line(g,[[aerial,y+5],[aerial,y-21-seed%13]],edge,1.2);
    line(g,[[aerial-6,y-6],[aerial+6,y-6]],edge,.8);
    rect(g,aerial-1,y-23-seed%13,2,2,hot);
    if(style.detail>1){
      for(let i=0;i<2;i++){
        const xx=x+9+i*18;rect(g,xx,y+12,12,8,side);line(g,[[xx+2,y+14],[xx+9,y+14]],edge,.8);
      }
      for(let yy=y+62;yy<y+h;yy+=67){
        rect(g,x+w-15,yy,11,9,side);line(g,[[x+w-14,yy+2],[x+w-6,yy+2]],edge,.7);
        line(g,[[x+w-14,yy+5],[x+w-6,yy+5]],edge,.7);
      }
      const px=x+w*.71;
      line(g,[[px,y+28],[px,y+h]],side,4);
      line(g,[[px-1,y+28],[px-1,y+h]],edge,.9);
      for(let yy=y+51;yy<y+h;yy+=28)line(g,[[px-3,yy],[px+3,yy]],edge,1.5);
      // Service ladders, exhaust grids, vent housings and dishes establish a
      // lived-in industrial skyline without changing the distant silhouettes.
      const ladder=x+w-8;
      line(g,[[ladder-5,y+35],[ladder-5,y+h]],edge,.65);
      line(g,[[ladder,y+35],[ladder,y+h]],edge,.65);
      for(let yy=y+39;yy<y+h;yy+=6)line(g,[[ladder-5,yy],[ladder,yy]],edge,.5);
      if(seed%2){
        const dish=x+w*.30,dy=y-7;
        g.save();g.translate(dish,dy);g.rotate(-.48);
        ellipse(g,0,0,8,11,side);g.beginPath();g.ellipse(0,0,8,11,0,0,TAU);g.strokeStyle=edge;g.lineWidth=1;g.stroke();
        line(g,[[0,0],[12,-7]],edge,1);g.restore();line(g,[[dish,dy+9],[dish+5,y+8]],edge,2);
      }
    }
  }
  const styles={
    horizon:{body:'#674b80',side:'#60477a',edge:'#805b91',dim:'#886b9c',lit:'#ac82b3',hot:'#bd7ca8',spacing:12},
    needles:{body:'#4f466e',side:'#484369',edge:'#75618b',dim:'#697b97',lit:'#7ba9b7',hot:'#b17cae',spacing:10},
    towers:{body:'#3d365d',side:'#302f54',edge:'#625681',dim:'#526782',lit:'#88b7c8',hot:'#d26bad',spacing:12},
    apartments:{body:'#302b50',side:'#252640',edge:'#53516e',dim:'#47677e',lit:'#82b5ca',hot:'#c685af',spacing:13,detail:2},
    utilities:{body:'#28283f',side:'#20243b',edge:'#4b526b',dim:'#456d84',lit:'#74c1cc',hot:'#d478b6',spacing:17,detail:2},
    workshops:{body:'#252840',side:'#1c2037',edge:'#434966',dim:'#45657d',lit:'#81c4cf',hot:'#eda987',spacing:20,detail:2}
  };
  // Vary silhouette heights/widths/intervals for each plane; no shared skyline mask.
  function district(g,base,seed,spacing,count,height,style,dx=0,screenOffset=null){
    for(let i=0;i<count;i++){
      const n=seed+i*11, w=spacing*(.36+hash(n)*.44), h=height*(.43+hash(n+7)*.57);
      const x=dx+i*spacing+hash(n+1)*spacing*.17;
      tower(g,{x,y:base-h,w,h,seed:n,kind:i+seed},style,screenOffset);
    }
  }
  function sky(g,camera,depth,time,weather){
    const f=g.createLinearGradient(0,0,0,FLOOR);
    f.addColorStop(0,'#24213e');f.addColorStop(.27,'#674063');f.addColorStop(.53,'#b06386');f.addColorStop(.77,'#65527f');f.addColorStop(1,'#29445c');g.fillStyle=f;g.fillRect(0,0,W,FLOOR);
    repeat(g,camera,.015,depth,2700,()=>{
      const x=372,y=144,r=85;
      glow(g,x,y,230,'rgba(232,91,173,.19)');
      g.save();g.beginPath();g.arc(x,y,r,0,TAU);g.clip();
      const sun=g.createLinearGradient(0,y-r,0,y+r);sun.addColorStop(0,'#dcb099');sun.addColorStop(.47,'#d895a0');sun.addColorStop(1,'#ac658d');g.fillStyle=sun;g.fillRect(x-r,y-r,r*2,r*2);
      for(let i=0;i<8;i++)rect(g,x-r,y+15+i*11,r*2,2+i*.48,'#754769');g.restore();
      for(let j=0;j<32;j++){
        const xx=j*90+hash(j)*60,yy=20+hash(j+4)*200;
        const drift=weather?Math.sin(time*.028+j)*11:0;
        ellipse(g,xx+drift,yy,40+hash(j+6)*160,3+hash(j+7)*11,j%2?'rgba(42,35,67,.18)':'rgba(130,78,119,.17)');
      }
    });
  }
  function transit(g,camera,depth,time){
    repeat(g,camera,.185,depth,2100,()=>{
      for(let k=0;k<7;k++){
        const x=k*320;poly(g,[[x,342],[x+12,342],[x+19,FLOOR],[x+4,FLOOR]],'#403959');
        line(g,[[x+6,347],[x+12,530]],'#686280',1);
      }
      rect(g,0,334,2100,10,'#38364f');rect(g,0,337,2100,1,'#69a5b2');rect(g,0,346,2100,4,'#49425e');
      for(let k=0;k<105;k++){rect(g,k*20,331,1,5,'#746785');}
      const train=mod(time*41+230,2350)-250;
      for(let k=0;k<4;k++){
        const x=train+k*77;poly(g,[[x,318],[x+5,313],[x+70,313],[x+76,320],[x+75,332],[x,332]],'#51455f','#837286',.7);
        rect(g,x+4,319,67,5,'#86b9c5');for(let q=0;q<7;q++)rect(g,x+11+q*9,318,2,7,'#554c6a');rect(g,x+3,329,68,1,'#d284b1');
      }
    });
  }
  function utilities(g,camera,depth,time,weather){
    repeat(g,camera,.370,depth,2600,()=>{
      const blocks=[{x:65,y:293,w:143,h:300,seed:23,kind:0},{x:678,y:262,w:117,h:331,seed:61,kind:2},{x:1314,y:329,w:156,h:264,seed:89,kind:3},{x:2070,y:237,w:144,h:356,seed:98,kind:0}];
      blocks.forEach(b=>{
        tower(g,b,styles.utilities);
        const x=b.x+b.w*.74,y=b.y-50;
        rect(g,x,y,17,FLOOR-y,'#343049');rect(g,x+2,y,2,FLOOR-y,'#6d5b7a');
        for(let yy=y+8;yy<FLOOR;yy+=25)rect(g,x-3,yy,23,3,'#494058');
        poly(g,[[x-2,y],[x+3,y-6],[x+14,y-6],[x+20,y],[x+20,y+7],[x-2,y+7]],'#4b4059','#79617d',.8);
        if(weather)for(let j=0;j<7;j++){
          const a=mod(time*.075+j/7,1);ellipse(g,x+8+a*28+Math.sin(a*7)*9,y-a*87,8+a*24,5+a*9,`rgba(163,149,188,${(1-a)*.046})`);
        }
        line(g,[[b.x+16,b.y+2],[b.x+16,b.y-33],[b.x+49,b.y-33],[b.x+49,b.y+2]],'#56516d',5);
        line(g,[[b.x+15,b.y+2],[b.x+15,b.y-34],[b.x+48,b.y-34]],'#92809d',.8);
      });
    });
  }
  function bridges(g,camera,depth){
    repeat(g,camera,.455,depth,2500,()=>{
      for(const [x,y,w] of [[190,359,309],[1002,297,348],[1861,385,340]]){
        poly(g,[[x,y],[x+9,y-8],[x+w-10,y-8],[x+w,y],[x+w,y+24],[x,y+24]],'#252b43','#4c526a',1.2);
        rect(g,x+8,y+1,w-16,14,'#4d657a');
        for(let xx=x+11;xx<x+w-4;xx+=17){rect(g,xx,y,3,16,'#30394e');}
        line(g,[[x+3,y+21],[x+w-3,y+21]],'#d37baa',1.2);
        for(let xx=x+13;xx<x+w-12;xx+=39)line(g,[[xx,y+25],[xx+15,y+44],[xx+33,y+25]],'#374059',2);
        rect(g,x+6,y+26,8,FLOOR-y,'#292d44');rect(g,x+w-14,y+26,8,FLOOR-y,'#292d44');
      }
    });
  }
  function hologram(g,x,y,w,h,time,tint,seed){
    g.save();g.globalAlpha=.78;
    glow(g,x+w*.5,y+h*.5,Math.max(w,h)*.72,tint==='cyan'?'rgba(82,174,218,.10)':'rgba(233,88,187,.10)');
    const edge=tint==='cyan'?'#6dbfd2':'#bf76b9';
    rect(g,x-5,y-5,w+10,h+10,'#2c2945');rect(g,x,y,w,h,tint==='cyan'?'#324763':'#4a2c60');
    line(g,[[x,y+h],[x,y],[x+w,y],[x+w,y+h]],edge,1.5);
    g.save();g.beginPath();g.rect(x+2,y+2,w-4,h-4);g.clip();
    const cx=x+w*.5,cy=y+h*.40,r=w*.34;
    ellipse(g,cx,cy,r,r,tint==='cyan'?'#849bc4':'#d27bb5');
    for(let i=0;i<5;i++)rect(g,x,cy+i*5,w,1.2+i*.55,tint==='cyan'?'#35465f':'#493258');
    for(let i=0;i<5;i++)line(g,[[x+8,y+h-17-i*4],[x+w-8,y+h-17-i*4]],edge,.7);
    for(let yy=y+4;yy<y+h;yy+=4)rect(g,x,yy,w,.5,'rgba(14,14,43,.20)');
    const sweep=mod(time*12+seed*6,h);rect(g,x,y+sweep,w,1,'rgba(210,239,255,.19)');
    g.restore();g.restore();
    line(g,[[x+w*.5,y+h+5],[x+w*.5,FLOOR]],'#39384f',3);
  }
  function signs(g,camera,depth,time){
    repeat(g,camera,.535,depth,2650,()=>{
      hologram(g,300,217,51,118,time,'pink',3);
      hologram(g,917,153,63,157,time,'cyan',7);
      hologram(g,1733,250,68,117,time,'pink',12);
      hologram(g,2327,177,53,143,time,'cyan',14);
    });
  }
  function workshops(g,camera,depth,time){
    repeat(g,camera,.605,depth,2300,()=>{
      for(const b of [{x:4,y:353,w:139,h:240,seed:17,kind:3},{x:525,y:393,w:134,h:200,seed:71,kind:2},{x:1208,y:331,w:176,h:262,seed:91,kind:0},{x:1970,y:373,w:169,h:220,seed:52,kind:1}]){
        tower(g,b,styles.workshops);
        const wx=b.x+21,wy=b.y+58;
        rect(g,wx-4,wy-5,48,41,'#181e32');rect(g,wx,wy,40,31,'#b58388');
        rect(g,wx+19,wy,2,31,'#393048');rect(g,wx,wy+18,40,2,'#393048');
        glow(g,wx+20,wy+15,36,'rgba(239,166,136,.10)');
        // Small inhabitant behind glass: useful scale, deliberately quiet motion.
        const inhabitant=wx+14+Math.sin(time*.22+b.seed)*5;
        ellipse(g,inhabitant,wy+16,2.5,3,'#3e3246');rect(g,inhabitant-3,wy+19,6,10,'#3e3246');
        rect(g,wx-6,wy+32,52,4,'#484156');
        for(let yy=b.y+120;yy<FLOOR;yy+=41){line(g,[[b.x+7,yy],[b.x+b.w-7,yy]],'#575267',1);}
        const tankX=b.x+b.w*.65,tankY=b.y-21;
        rect(g,tankX,tankY,27,23,'#35354b');ellipse(g,tankX+13.5,tankY,13.5,3,'#4c4962');
        line(g,[[tankX+4,tankY+2],[tankX+4,tankY+22]],'#656078',1);
      }
    });
  }
  function street(g,image,camera,depth){
    if(!image)return;
    const h=444,w=h*image.width/image.height;
    repeat(g,camera,.700,depth,w*2,()=>{
      g.drawImage(image,0,185,w,h);
      g.save();g.translate(w*2,185);g.scale(-1,1);g.drawImage(image,0,0,w,h);g.restore();
    });
  }
  function wires(g,camera,depth,time){
    repeat(g,camera,.855,depth,2270,()=>{
      for(const [x,y,next] of [[80,202,569],[649,234,562],[1211,198,460],[1671,256,679]]){
        line(g,[[x,y+17],[x,y+72]],'#232a42',3);
        for(let k=0;k<3;k++){
          g.beginPath();g.moveTo(x,y+27+k*5);g.bezierCurveTo(x+next*.36,y+102+k*5,x+next*.72,y+77+k*5,x+next,y+56+k*5);g.strokeStyle=k===1?'#53647a':'#252a44';g.lineWidth=k===1?.6:1.5;g.stroke();
        }
        rect(g,x-5,y+12,10,14,'#303049');rect(g,x-2,y+14,4,3,Math.sin(time*.8+x)>.45?'#dd829e':'#744e73');
      }
    });
  }
  function draw(g,images={},opts={}){
    const {camera=0,time=0,parallax=true,weather=true,width=W,height=H,soloLayer=null,hiddenLayers=[],cull=true}=opts;
    const hidden=new Set(hiddenLayers), visible=id=>!hidden.has(id)&&(!soloLayer||soloLayer===id);
    const report=[];
    g.save();g.scale(width/W,height/H);g.beginPath();g.rect(0,0,W,FLOOR);g.clip();
    // A neutral matte in solo mode leaves all genuine holes visible.
    rect(g,0,0,W,FLOOR,soloLayer?'#141a2c':'#463759');
    for(const layer of layers){
      if(!visible(layer.id))continue;
      g.save();
      switch(layer.id){
      case 'sky':sky(g,camera,parallax,time,weather);break;
      case 'horizon':repeat(g,camera,layer.factor,parallax,2520,offset=>district(g,505,91,90,28,343,styles.horizon,0,cull?offset:null));break;
      case 'needles':repeat(g,camera,layer.factor,parallax,2600,offset=>district(g,552,41,130,20,475,styles.needles,0,cull?offset:null));break;
      case 'towers':repeat(g,camera,layer.factor,parallax,2700,offset=>district(g,586,12,225,12,557,styles.towers,0,cull?offset:null));break;
      case 'transit':transit(g,camera,parallax,time);break;
      case 'apartments':repeat(g,camera,layer.factor,parallax,2700,()=>district(g,593,73,300,9,419,styles.apartments,76));break;
      case 'utilities':utilities(g,camera,parallax,time,weather);break;
      case 'bridges':bridges(g,camera,parallax);break;
      case 'signs':signs(g,camera,parallax,time);break;
      case 'workshops':workshops(g,camera,parallax,time);break;
      case 'street':street(g,images.street,camera,parallax);break;
      case 'wires':wires(g,camera,parallax,time);break;
      }
      g.restore();
      // Haze lies BETWEEN opaque city layers; it cannot erase nearer silhouettes.
      if(!soloLayer){
        if(layer.id==='horizon')bands(g,265,276,'193,117,160',.10);
        if(layer.id==='needles')bands(g,366,213,'113,131,168',.15);
        if(layer.id==='towers')bands(g,417,173,'98,129,163',.12);
        if(layer.id==='apartments')bands(g,460,131,'87,116,154',.08);
      }
      report.push({...layer,effectiveFactor:parallax?layer.factor:1,offset:transformX(0,camera,layer.factor,parallax)});
    }
    g.restore();return report;
  }
  const api=Object.freeze({draw,layers,transformX,WIDTH:W,HEIGHT:H,FLOOR});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VaporBackground=api;
})(typeof window!=='undefined'?window:globalThis);
