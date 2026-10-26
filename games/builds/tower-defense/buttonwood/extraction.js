/* Native extraction art. ART-BIBLE sections 3-5 and 7-10 govern scale and states. */
(() => {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const sprites = new Map(), icons = new Map();
  const kinds = [null, 'oil', 'water', 'lava'];
  const poses = [-7, -3, 4, 7, 3, -4];

  A.extractionSizes = Object.freeze({
    pumpjack: Object.freeze({ width: 128, height: 96 }),
    tank: Object.freeze({ width: 96, height: 96 }),
    pipe: Object.freeze({ width: 32, height: 32 })
  });
  A.extractionPorts = Object.freeze({
    pumpjack: Object.freeze({ intake: Object.freeze({ x: 48, y: 96 }), outlet: Object.freeze({ x: 128, y: 80 }) }),
    tank: Object.freeze({ left: Object.freeze({ x: 0, y: 80 }), right: Object.freeze({ x: 96, y: 80 }) }),
    pipe: Object.freeze({ center: Object.freeze({ x: 16, y: 16 }), north: 1, east: 2, south: 4, west: 8 })
  });
  A.extractionFrameMs = 150;

  function rect(g, color, x, y, width, height) {
    g.fillStyle = color; g.fillRect(x, y, width, height);
  }
  // Native scanline polygons avoid canvas path antialiasing at every stepped edge.
  function poly(g, color, points) {
    const top = Math.min(...points.map(p => p[1])), bottom = Math.max(...points.map(p => p[1]));
    for (let y = top; y < bottom; y++) {
      const cuts = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[j], b = points[i], sample = y + .5;
        if ((a[1] <= sample && b[1] > sample) || (b[1] <= sample && a[1] > sample)) {
          cuts.push(a[0] + (sample - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      cuts.sort((a, b) => a - b);
      for (let n = 0; n + 1 < cuts.length; n += 2) {
        const left = Math.ceil(cuts[n] - .5), right = Math.ceil(cuts[n + 1] - .5);
        rect(g, color, left, y, right - left, 1);
      }
    }
  }
  function oct(g, color, x, y, w, h, cut) {
    poly(g, color, [[x+cut,y],[x+w-cut,y],[x+w,y+cut],[x+w,y+h-cut],
      [x+w-cut,y+h],[x+cut,y+h],[x,y+h-cut],[x,y+cut]]);
  }
  function line(g, color, x0, y0, x1, y1, size = 1) {
    const dx = Math.abs(x1-x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1-y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(g, color, x0, y0, size, size);
      if (x0 === x1 && y0 === y1) break;
      const twice = 2*error;
      if (twice >= dy) { error += dy; x0 += sx; }
      if (twice <= dx) { error += dx; y0 += sy; }
    }
  }
  function make(width, height, paint) {
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; paint(g, A.palette); return c;
  }
  function liquid(p, kind) {
    return kind === 'water' ? [p.waterShade,p.water,p.waterLight] :
      kind === 'lava' ? [p.lavaShade,p.lava,p.lavaLight] : [p.ink,p.deep,p.deepLight];
  }
  function foundation(g, p, x, width) {
    rect(g,p.outline,x,89,width,7); rect(g,p.stoneShade,x+1,90,width-2,5);
    rect(g,p.stoneLight,x+2,90,width-4,2); rect(g,p.stone,x+2,92,width-4,2);
    for (let i = x+15; i < x+width-5; i += 19) rect(g,p.stoneShade,i,90,1,4);
  }
  function coupling(g, p, x, y, vertical) {
    if (vertical) {
      rect(g,p.outline,x-7,y-3,14,6);rect(g,p.stoneShade,x-6,y-2,12,4);
      rect(g,p.stoneLight,x-5,y-2,10,1);rect(g,p.woodLight,x-4,y,8,1);
    } else {
      rect(g,p.outline,x-3,y-7,6,14);rect(g,p.stoneShade,x-2,y-6,4,12);
      rect(g,p.stoneLight,x-2,y-5,1,10);rect(g,p.woodLight,x,y-4,1,8);
    }
  }
  function horizontalPipe(g, p, x, y, width) {
    rect(g,p.outline,x,y-5,width,10);rect(g,p.woodLight,x,y-4,width,7);
    rect(g,p.coralLight,x,y-4,width,1);rect(g,p.wood,x,y+1,width,3);
  }
  function verticalPipe(g, p, x, y, height) {
    rect(g,p.outline,x-5,y,10,height);rect(g,p.woodLight,x-4,y,7,height);
    rect(g,p.coralLight,x-4,y,1,height);rect(g,p.wood,x+1,y,3,height);
  }
  function sight(g, p, x, y, kind, filled) {
    const ramp = liquid(p,kind);
    oct(g,p.outline,x,y,12,14,2);rect(g,p.stoneLight,x+2,y+2,8,10);
    rect(g,p.creamShade,x+3,y+3,6,8);
    if (kind && filled) {
      rect(g,ramp[0],x+3,y+5,6,6);rect(g,ramp[1],x+3,y+5,5,4);
      rect(g,kind==='oil'?p.mintShade:ramp[2],x+3,y+5,3,1);
    }
  }
  function pumpjack(g, p, frame, active, kind) {
    const pose = active ? poses[frame] : 0;
    // A fixed wellhead and outlet preserve the declared connector coordinates.
    foundation(g,p,8,112);verticalPipe(g,p,48,80,16);horizontalPipe(g,p,32,80,96);
    coupling(g,p,118,80,false);coupling(g,p,48,91,true);
    oct(g,p.outline,23,69,18,13,2);rect(g,p.mintShade,25,71,14,9);
    rect(g,p.mint,25,71,13,3);rect(g,p.mintLight,27,72,5,1);
    // Broad warm timber A-frame, with visible braces and iron foot shoes.
    poly(g,p.outline,[[62,28],[73,28],[89,89],[77,89]]);
    poly(g,p.woodShade,[[65,31],[71,31],[86,87],[80,87]]);
    poly(g,p.wood,[[64,31],[67,31],[82,85],[79,85]]);
    poly(g,p.outline,[[60,29],[69,29],[54,89],[41,89]]);
    poly(g,p.wood,[[62,31],[66,31],[52,87],[44,87]]);
    poly(g,p.woodLight,[[62,31],[64,31],[48,84],[45,84]]);
    rect(g,p.outline,46,70,35,7);rect(g,p.wood,47,71,32,4);rect(g,p.woodLight,48,71,30,1);
    for (const x of [44,77]) {rect(g,p.outline,x,84,11,6);rect(g,p.stone,x+1,85,9,4);rect(g,p.stoneLight,x+2,85,3,1);}
    // A mint flywheel shows a changing crank, rather than scaling a painted wheel.
    oct(g,p.outline,81,52,32,32,8);oct(g,p.mintShade,82,53,30,30,8);
    oct(g,p.mint,83,54,27,27,7);oct(g,p.mintLight,85,54,23,23,6);
    oct(g,p.mintShade,87,58,20,21,5);oct(g,p.ink,89,60,16,17,4);
    const spokes = [[9,0],[5,8],[-5,8],[-9,0],[-5,-8],[5,-8]];
    const [sx,sy] = spokes[active?frame:0];
    line(g,p.mint,96-sx,67-sy,96+sx,67+sy,2);
    line(g,p.mint,96+sy,67-sx,96-sy,67+sx,2);
    oct(g,p.outline,92,63,10,10,2);oct(g,p.goldShade,94,65,6,6,1);rect(g,p.gold,95,65,3,3);
    // Rod and linkage are connected to authored beam positions, never resampled.
    const headY = 29+pose, tailY = 29-pose;
    rect(g,p.outline,30,headY+4,4,73-headY);rect(g,p.stoneLight,31,headY+5,1,71-headY);
    line(g,p.outline,102,tailY+5,96+sx,67+sy,3);
    line(g,p.stone,103,tailY+6,97+sx,68+sy,1);
    poly(g,p.outline,[[25,headY-6],[34,headY-9],[106,tailY-4],[112,tailY],[110,tailY+7],[35,headY+3],[30,headY+13],[23,headY+13],[20,headY+6],[20,headY-1]]);
    poly(g,p.coralShade,[[25,headY-4],[34,headY-7],[106,tailY-2],[110,tailY+1],[109,tailY+5],[33,headY+1],[28,headY+11],[24,headY+11],[22,headY+5],[22,headY]]);
    poly(g,p.coral,[[25,headY-4],[34,headY-7],[105,tailY-2],[108,tailY+1],[33,headY-1],[28,headY+7],[24,headY+7],[23,headY+2]]);
    line(g,p.coralLight,29,headY-5,104,tailY-1);
    rect(g,p.coralLight,24,headY,2,5);rect(g,p.coralLight,27,headY-3,3,1);
    oct(g,p.outline,61,25,12,12,3);oct(g,p.stoneShade,63,27,8,8,2);
    rect(g,p.stoneLight,64,28,4,2);rect(g,p.gold,66,30,2,2);
    rect(g,p.outline,88,84,24,5);rect(g,p.creamShade,89,85,22,3);rect(g,p.creamLight,89,85,21,1);
    sight(g,p,44,74,kind,Boolean(kind));
  }
  function tank(g, p, kind, fill) {
    horizontalPipe(g,p,0,80,96);coupling(g,p,7,80,false);coupling(g,p,89,80,false);
    foundation(g,p,12,72);
    for (const x of [24,64]) {rect(g,p.outline,x,79,8,11);rect(g,p.wood,x+1,80,6,9);rect(g,p.woodLight,x+1,80,1,8);}
    // Frontal vessel with stepped caps, broad cream planes and mint lower enamel.
    oct(g,p.outline,16,12,64,73,9);oct(g,p.creamShade,17,13,62,70,8);
    oct(g,p.cream,19,14,57,65,7);rect(g,p.creamLight,25,17,3,52);
    rect(g,p.creamLight,30,14,31,2);rect(g,p.creamShade,70,24,5,45);
    poly(g,p.mintShade,[[18,65],[78,65],[78,75],[70,83],[25,83],[18,76]]);
    poly(g,p.mint,[[19,65],[71,65],[71,75],[66,79],[26,79],[19,73]]);
    rect(g,p.mintLight,21,66,49,2);
    for (const y of [28,62]) {
      rect(g,p.outline,16,y,64,6);rect(g,p.wood,17,y+1,62,4);rect(g,p.woodLight,18,y+1,60,1);
      for (const x of [22,71]) {rect(g,p.woodShade,x,y+2,3,3);rect(g,p.gold,x,y+2,1,1);}
    }
    rect(g,p.outline,38,6,21,8);rect(g,p.mintShade,39,7,19,6);rect(g,p.mint,39,7,17,3);
    rect(g,p.mintLight,41,7,13,1);rect(g,p.outline,42,4,13,3);rect(g,p.stone,43,5,11,1);
    // The gauge alone reveals fill. Quantization is confined to its 20 visible pixels.
    oct(g,p.outline,56,35,14,28,2);rect(g,p.woodLight,58,37,10,24);
    rect(g,p.ink,59,38,8,22);rect(g,p.creamShade,60,39,6,20);
    const height = kind ? Math.round(fill*20) : 0;
    if (height) {
      const ramp=liquid(p,kind),y=59-height;
      rect(g,ramp[0],60,y,6,height);rect(g,ramp[1],60,y,4,height);
      rect(g,kind==='oil'?p.mintShade:ramp[2],60,y,3,1);
      if(kind==='lava'&&height>5)rect(g,ramp[2],63,y+4,2,2);
    }
    for(const y of [40,46,52,58])rect(g,p.stoneLight,67,y,2,1);
    // Restrained enamel maker's medallion; no baked-in labels or capacity claims.
    oct(g,p.outline,31,42,16,15,3);oct(g,p.mintShade,32,43,14,13,3);
    rect(g,p.mint,34,44,9,8);rect(g,p.mintLight,35,44,6,1);
    rect(g,p.goldShade,37,46,4,5);rect(g,p.gold,37,46,3,3);
  }
  function pipe(g, p, mask, kind, active) {
    // Arm bounds terminate at the cell boundary; no dark end cap blocks a join.
    if(mask&1)verticalPipe(g,p,16,0,16);
    if(mask&2)horizontalPipe(g,p,16,16,16);
    if(mask&4)verticalPipe(g,p,16,16,16);
    if(mask&8)horizontalPipe(g,p,0,16,16);
    oct(g,p.outline,9,9,14,14,3);oct(g,p.woodShade,10,10,12,12,2);
    oct(g,p.woodLight,11,11,10,9,2);rect(g,p.coralLight,13,11,6,1);
    if(mask&1)coupling(g,p,16,4,true);
    if(mask&2)coupling(g,p,28,16,false);
    if(mask&4)coupling(g,p,16,28,true);
    if(mask&8)coupling(g,p,4,16,false);
    rect(g,p.outline,12,12,8,8);rect(g,p.stoneShade,13,13,6,6);
    if(kind) {
      const ramp=liquid(p,kind);rect(g,ramp[0],14,14,4,4);rect(g,ramp[1],14,14,3,3);
      if(active)rect(g,kind==='oil'?p.mintShade:ramp[2],14,14,2,1);
    } else {rect(g,p.stone,14,14,4,4);rect(g,p.stoneLight,14,14,3,1);}
  }

  A.extractionSprite = function (type, options = {}) {
    if(!Object.hasOwn(A.extractionSizes,type))return null;
    const size = A.extractionSizes[type];
    const kind=kinds.includes(options.kind)?options.kind:null,active=options.active===true;
    const number=Number(options.frame),frame=Number.isFinite(number)?((Math.floor(number)%6)+6)%6:0;
    const amount=Number(options.fill),fill=Number.isFinite(amount)?Math.round(Math.max(0,Math.min(1,amount))*20)/20:0;
    const value=Number(options.mask),mask=Number.isFinite(value)?Math.floor(value)&15:0;
    const key=type==='pumpjack'?`${type}:${active?frame:'rest'}:${kind}:${active}`:
      type==='tank'?`${type}:${kind}:${kind?fill:0}`:`${type}:${mask}:${kind}:${active}`;
    if(!sprites.has(key))sprites.set(key,make(size.width,size.height,(g,p)=>{
      if(type==='pumpjack')pumpjack(g,p,frame,active,kind);
      else if(type==='tank')tank(g,p,kind,fill);
      else pipe(g,p,mask,kind,active);
    }));
    return sprites.get(key);
  };

  A.extractionIcon = function (type) {
    if(!['pumpjack','tank','pipe','oil','bucket:oil','remove'].includes(type))return null;
    if(icons.has(type))return icons.get(type);
    const c=make(32,32,(g,p)=>{
      // Each miniature is independently composed on this 32px canvas.
      if(type==='pumpjack') {
        rect(g,p.outline,2,28,28,3);rect(g,p.stoneLight,3,28,26,1);
        poly(g,p.outline,[[14,10],[18,10],[22,28],[10,28]]);
        poly(g,p.wood,[[15,12],[17,12],[20,27],[18,27],[16,18],[13,27],[11,27]]);
        line(g,p.woodLight,15,12,11,26);rect(g,p.woodLight,12,23,8,1);
        rect(g,p.outline,6,9,2,19);rect(g,p.stoneLight,6,10,1,17);
        oct(g,p.outline,21,19,9,9,2);oct(g,p.mint,22,20,7,7,2);rect(g,p.mintLight,23,20,4,1);
        rect(g,p.ink,24,22,3,3);rect(g,p.gold,25,23,1,1);
        poly(g,p.outline,[[3,6],[8,4],[28,11],[29,15],[8,10],[7,14],[3,13]]);
        poly(g,p.coral,[[4,7],[8,5],[27,12],[27,13],[7,9],[6,12],[4,12]]);
        line(g,p.coralLight,8,5,26,11);rect(g,p.outline,14,9,4,4);rect(g,p.gold,15,10,2,2);
      } else if(type==='tank') {
        rect(g,p.outline,5,28,23,3);rect(g,p.stoneLight,6,28,21,1);
        rect(g,p.woodShade,8,25,3,4);rect(g,p.woodShade,22,25,3,4);
        oct(g,p.outline,6,6,21,21,3);oct(g,p.cream,7,7,19,19,3);
        rect(g,p.creamLight,9,9,2,13);rect(g,p.creamShade,24,10,2,12);
        rect(g,p.outline,12,3,9,4);rect(g,p.mint,13,4,7,2);
        for(const y of [11,23]){rect(g,p.woodShade,6,y,21,3);rect(g,p.woodLight,7,y,19,1);}
        rect(g,p.mintShade,9,25,15,1);rect(g,p.outline,19,14,5,8);
        rect(g,p.creamShade,20,15,3,6);rect(g,p.deep,20,18,3,3);rect(g,p.mintShade,20,18,2,1);
      } else if(type==='pipe') {
        // A composed elbow with breathing room, distinct from a cropped world cell.
        poly(g,p.outline,[[5,4],[15,4],[15,16],[28,16],[28,26],[5,26]]);
        poly(g,p.woodLight,[[6,5],[14,5],[14,18],[27,18],[27,24],[6,24]]);
        rect(g,p.coralLight,6,5,1,17);rect(g,p.wood,8,21,19,3);
        rect(g,p.outline,3,5,14,5);rect(g,p.stone,4,6,12,3);rect(g,p.stoneLight,4,6,11,1);
        rect(g,p.outline,23,14,5,14);rect(g,p.stone,24,15,3,12);rect(g,p.stoneLight,24,15,1,11);
        rect(g,p.woodShade,8,17,4,4);rect(g,p.gold,9,17,2,2);
      } else if(type==='remove') {
        // A wrench undoing a copper coupling; it remains recognizable without a symbol.
        rect(g,p.outline,3,20,18,9);rect(g,p.woodLight,4,21,16,6);rect(g,p.coralLight,4,21,15,1);
        rect(g,p.woodShade,4,26,16,2);rect(g,p.outline,8,18,6,12);rect(g,p.stone,9,19,4,10);
        rect(g,p.stoneLight,9,19,1,9);
        for(let i=0;i<11;i++){rect(g,p.outline,10+i,23-i,5,5);rect(g,p.stone,11+i,23-i,3,3);rect(g,p.stoneLight,11+i,23-i,1,2);}
        poly(g,p.outline,[[21,4],[25,3],[23,9],[26,12],[30,9],[30,15],[27,18],[22,18],[18,14],[18,8]]);
        poly(g,p.stone,[[21,6],[23,5],[21,10],[26,14],[29,12],[28,15],[26,17],[23,16],[20,13],[19,9]]);
        line(g,p.stoneLight,20,8,20,12);rect(g,p.stoneLight,21,13,2,2);
      } else if(type==='oil') {
        poly(g,p.ink,[[16,3],[19,9],[24,16],[26,22],[24,27],[20,30],[12,30],[7,27],[5,23],[7,17],[12,10]]);
        poly(g,p.deep,[[16,6],[18,11],[23,18],[24,23],[22,26],[18,28],[12,27],[8,24],[9,18],[13,12]]);
        poly(g,p.deepLight,[[14,12],[12,18],[11,23],[8,22],[9,18],[12,14]]);
        rect(g,p.mintShade,11,18,2,3);rect(g,p.mint,12,17,2,1);
      } else {
        // Same pail silhouette as the existing family; new oil surface and emblem.
        rect(g,p.outline,9,5,14,2);rect(g,p.outline,7,7,2,11);rect(g,p.outline,23,7,2,11);
        rect(g,p.stoneLight,10,6,12,1);rect(g,p.stoneLight,8,8,1,8);rect(g,p.stone,23,8,1,8);
        rect(g,p.outline,5,13,22,4);rect(g,p.outline,6,17,20,7);rect(g,p.outline,8,24,16,4);
        rect(g,p.stone,7,17,18,6);rect(g,p.stoneShade,9,23,14,4);rect(g,p.stoneLight,8,17,3,7);
        rect(g,p.stone,11,25,9,1);rect(g,p.stoneShade,22,18,2,5);rect(g,p.creamLight,6,14,20,2);
        rect(g,p.ink,8,13,16,2);rect(g,p.deepLight,10,13,6,1);rect(g,p.mintShade,17,13,3,1);
        poly(g,p.ink,[[17,17],[20,21],[19,24],[15,24],[14,21]]);rect(g,p.deep,16,20,3,3);rect(g,p.mintShade,16,20,1,1);
      }
    });
    icons.set(type,c);return c;
  };
})();
