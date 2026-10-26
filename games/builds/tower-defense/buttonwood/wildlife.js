/* Buttonwood wildlife. ART-BIBLE §§3–4, 7–12: native clusters, quiet motion,
 * real occupants, common pail vocabulary, separately composed 32px UI art. */
(() => {
  'use strict';
  const A = window.ButtonwoodArt, P = A.palette, cache = new Map();
  const species = ['bird', 'butterfly', 'worm', 'mole', 'rabbit', 'firefly'];
  A.wildlifeSizes = Object.freeze(Object.fromEntries(Object.entries({
    bird: [24,20], butterfly: [16,16], worm: [20,10], mole: [24,16], rabbit: [24,24], firefly: [12,12]
  }).map(([key,[width,height]]) => [key,Object.freeze({width,height,anchorX:width/2,anchorY:height})])));
  A.cageSizes = Object.freeze(Object.fromEntries(Object.entries({
    cageSmall: [64,64], cageMedium: [96,64], cageLarge: [128,96]
  }).map(([key,[width,height]]) => [key,Object.freeze({width,height,anchorX:width/2,anchorY:height})])));
  A.wildlifeFrameMs = Object.freeze({bird:150,butterfly:130,worm:220,mole:220,rabbit:180,firefly:160});
  function r(g,color,x,y,w,h) { g.fillStyle=color;g.fillRect(x,y,w,h); }
  function poly(g,color,points) {
    const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
    for(let y=top;y<bottom;y++) {
      const cuts=[];
      for(let i=0,j=points.length-1;i<points.length;j=i++) {
        const a=points[j],b=points[i],s=y+.5;
        if((a[1]<=s&&b[1]>s)||(b[1]<=s&&a[1]>s))cuts.push(a[0]+(s-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cuts.sort((a,b)=>a-b);
      for(let i=0;i+1<cuts.length;i+=2) {const left=Math.ceil(cuts[i]-.5);r(g,color,left,y,Math.ceil(cuts[i+1]-.5)-left,1);}
    }
  }
  function oct(g,color,x,y,w,h,c=2) {
    poly(g,color,[[x+c,y],[x+w-c,y],[x+w,y+c],[x+w,y+h-c],[x+w-c,y+h],[x+c,y+h],[x,y+h-c],[x,y+c]]);
  }
  function canvas(key,w,h,paint) {
    if(cache.has(key))return cache.get(key);
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g);cache.set(key,c);return c;
  }
  function bird(g,f) {
    // Rounded coral breast, mint flight feathers and a small cream cheek.
    poly(g,P.outline,[[2,10],[9,11],[10,8],[15,7],[17,5],[21,6],[22,10],[24,11],[21,13],[18,16],[11,17],[6,14],[1,13]]);
    poly(g,P.mintShade,[[2,11],[8,12],[11,10],[16,10],[18,14],[13,16],[8,14],[3,13]]);
    oct(g,P.coral,11,9,10,7,2);r(g,P.coralLight,12,10,4,3);r(g,P.cream,17,9,3,3);
    r(g,P.mint,17,6,3,2);r(g,P.ink,20,8,1,1);r(g,P.gold,22,10,2,1);
    const wings=[[[8,12],[6,8],[5,2],[8,3],[14,11]],[[7,12],[2,7],[5,7],[13,11]],[[8,11],[13,11],[13,18],[10,18]],[[7,11],[12,11],[8,16],[5,16]]];
    poly(g,P.outline,wings[f]);
    const inner=[[[8,11],[7,5],[11,10],[12,12]],[[7,11],[4,8],[11,11]],[[9,12],[12,12],[12,17],[11,16]],[[8,12],[11,12],[7,15],[6,15]]];
    poly(g,P.mint,inner[f]);r(g,P.mintLight,f===0?7:8,f===0?5:11,2,1);
  }
  function butterfly(g,f) {
    const spread=[5,3,1,3][f];
    for(const sign of [-1,1]) {
      const x=sign<0?7-spread:9;
      oct(g,P.outline,x,3,spread+1,7,1);oct(g,P.coral,x+1,4,Math.max(1,spread-1),5,1);
      oct(g,P.outline,x+(sign<0?1:0),9,Math.max(2,spread),4,1);
      r(g,P.gold,x+1,10,Math.max(1,spread-2),2);
      if(spread>2)r(g,P.creamLight,x+1,5,2,2);
    }
    r(g,P.outline,7,4,2,10);r(g,P.mintLight,7,6,1,5);r(g,P.ink,6,2,1,2);r(g,P.ink,9,2,1,2);
    r(g,P.cream,7,4,1,1);
  }
  function worm(g,f) {
    // Segmented waves describe the animal, without painting a fictitious tunnel.
    const heights=[[6,6,5,4,4,5],[6,5,4,4,5,6],[5,4,4,5,6,6],[4,4,5,6,6,5]][f];
    for(let i=0;i<6;i++)oct(g,P.outline,i*3,heights[i]-2,5,5,1);
    for(let i=0;i<6;i++) {r(g,P.coral,1+i*3,heights[i]-1,3,3);r(g,P.coralLight,1+i*3,heights[i]-1,2,1);}
    r(g,P.coralShade,11,heights[3],2,2);r(g,P.ink,18,heights[5]-1,1,1);
  }
  function mole(g,f,burrowing) {
    oct(g,P.outline,2,3,18,11,4);oct(g,P.deep,3,4,16,9,3);
    poly(g,P.deepLight,[[5,5],[9,4],[14,5],[15,7],[9,7],[5,9],[4,8]]);
    oct(g,P.outline,15,7,8,6,2);r(g,P.deepLight,17,8,4,3);
    r(g,P.coral,22,9,2,2);r(g,P.ink,18,7,1,1);r(g,P.cream,19,10,2,1);
    const step=[0,1,0,-1][f];
    r(g,P.outline,4+step,12,6,3);r(g,P.skinShade,5+step,12,4,2);
    r(g,P.cream,5+step,14,1,1);r(g,P.cream,7+step,14,1,1);
    r(g,P.outline,15-step,12,6,3);r(g,P.skin,16-step,12,4,2);
    r(g,P.creamLight,16-step,14,1,1);r(g,P.creamLight,18-step,14,1,1);
    if(burrowing) {r(g,P.dirt,2+f,14,3,1);r(g,P.dirtLight,20-f,15,2,1);}
  }
  function rabbit(g,f) {
    const crouch=f===2?1:0;
    oct(g,P.outline,3,12+crouch,15,10-crouch,3);oct(g,P.creamShade,4,13+crouch,13,8-crouch,3);
    oct(g,P.cream,5,13+crouch,10,6,2);oct(g,P.outline,1,14,5,5,1);oct(g,P.creamLight,2,15,3,3,1);
    poly(g,P.outline,[[12,11],[11,3],[13,1],[15,3],[15,9],[17,8],[17,2],[20,2],[21,5],[19,12]]);
    r(g,P.cream,12,4,2,8);r(g,P.coralLight,13,4,1,5);r(g,P.cream,18,3,2,8);r(g,P.coralLight,19,4,1,4);
    oct(g,P.outline,13,10+crouch,10,9,3);oct(g,P.cream,14,11+crouch,8,7,2);
    r(g,P.creamLight,15,11+crouch,4,2);r(g,P.ink,20,13+crouch,1,2);r(g,P.coral,22,15+crouch,2,1);
    r(g,P.outline,7,21,6,2);r(g,P.cream,8,21,4,1);
    r(g,P.outline,16+(f===1?1:0),21,5,2);r(g,P.creamLight,17+(f===1?1:0),21,3,1);
  }
  function firefly(g,f) {
    const lift=f%2;
    oct(g,P.outline,2,3-lift,4,5,1);oct(g,P.mintLight,3,4-lift,2,3,1);
    oct(g,P.outline,7,3-lift,4,5,1);oct(g,P.creamShade,8,4-lift,2,3,1);
    r(g,P.outline,5,3,3,8);r(g,P.mintShade,6,4,1,3);
    oct(g,P.outline,4,7,5,5,1);r(g,f===2?P.goldShade:P.gold,5,8,3,3);
    r(g,f===2?P.gold:P.creamLight,5,8,f===2?1:2,f===2?1:2);r(g,P.ink,5,2,1,2);
  }
  const painters={bird,butterfly,worm,mole,rabbit,firefly};
  A.wildlifeSprite=function(type,options={}) {
    if(!species.includes(type))return null;
    const f=((Math.floor(Number(options.frame)||0)%4)+4)%4,dir=options.direction<0?-1:1;
    const burrowing=type==='mole'&&Boolean(options.burrowing),s=A.wildlifeSizes[type];
    return canvas(`animal:${type}:${f}:${dir}:${burrowing}`,s.width,s.height,g=>{
      if(dir<0){g.translate(s.width,0);g.scale(-1,1);}painters[type](g,f,burrowing);
    });
  };
  // Portraits and bucket occupants use their own simplified native compositions.
  // These never drawImage/scale a world sprite, even where the animal is tiny.
  function miniature(g,type,x,y) {
    if(type==='bird') {
      poly(g,P.outline,[[x,y+6],[x+5,y+7],[x+7,y+3],[x+12,y+1],[x+16,y+3],[x+16,y+7],[x+19,y+8],[x+15,y+10],[x+9,y+12],[x+4,y+10]]);
      oct(g,P.coral,x+6,y+5,9,6,2);r(g,P.cream,x+12,y+4,3,3);r(g,P.mint,x+9,y+3,5,2);
      poly(g,P.mintShade,[[x+2,y+7],[x+7,y+7],[x+10,y+9],[x+7,y+10],[x+4,y+9]]);
      r(g,P.ink,x+14,y+4,1,1);r(g,P.gold,x+16,y+7,3,1);r(g,P.coralLight,x+9,y+7,3,2);
    }else if(type==='butterfly') {
      for(const dx of [0,9]) {oct(g,P.outline,x+dx,y+2,8,8,2);oct(g,P.coral,x+dx+1,y+3,6,6,2);oct(g,P.outline,x+dx+2,y+9,5,5,1);r(g,P.gold,x+dx+3,y+10,3,3);r(g,P.creamLight,x+dx+2,y+4,2,2);}
      r(g,P.outline,x+8,y+3,2,12);r(g,P.mintLight,x+8,y+6,1,5);r(g,P.ink,x+6,y+1,1,2);r(g,P.ink,x+11,y+1,1,2);
    }else if(type==='worm') {
      poly(g,P.outline,[[x,y+9],[x+4,y+7],[x+7,y+8],[x+9,y+3],[x+13,y+2],[x+17,y+4],[x+17,y+7],[x+14,y+8],[x+12,y+7],[x+10,y+12],[x+5,y+13],[x+1,y+12]]);
      poly(g,P.coral,[[x+1,y+9],[x+5,y+9],[x+8,y+10],[x+10,y+4],[x+13,y+3],[x+16,y+5],[x+16,y+6],[x+12,y+5],[x+10,y+11],[x+5,y+12],[x+1,y+11]]);
      r(g,P.coralLight,x+10,y+4,4,1);r(g,P.coralShade,x+8,y+9,2,2);r(g,P.ink,x+15,y+4,1,1);
    }else if(type==='mole') {
      oct(g,P.outline,x,y+4,16,10,3);oct(g,P.deep,x+1,y+5,14,8,3);r(g,P.deepLight,x+4,y+5,7,2);
      oct(g,P.outline,x+12,y+7,7,6,2);r(g,P.deepLight,x+14,y+8,4,3);r(g,P.coral,x+18,y+9,2,2);
      r(g,P.ink,x+15,y+7,1,1);r(g,P.cream,x+4,y+13,4,1);r(g,P.creamLight,x+13,y+13,4,1);
    }else if(type==='rabbit') {
      oct(g,P.outline,x+1,y+7,14,10,3);oct(g,P.cream,x+2,y+8,12,8,3);
      r(g,P.outline,x+9,y,3,10);r(g,P.cream,x+10,y+1,1,6);r(g,P.outline,x+14,y+1,3,9);r(g,P.coralLight,x+15,y+2,1,5);
      oct(g,P.outline,x+10,y+7,9,8,2);oct(g,P.creamLight,x+11,y+8,7,6,2);r(g,P.ink,x+16,y+9,1,1);r(g,P.coral,x+18,y+11,2,1);
      r(g,P.creamShade,x+5,y+15,7,1);r(g,P.creamLight,x,y+10,3,3);
    }else {
      for(const dx of [0,9]){oct(g,P.outline,x+dx,y+4,7,8,2);oct(g,P.mintLight,x+dx+1,y+5,5,6,2);}
      oct(g,P.outline,x+6,y+3,5,14,1);r(g,P.mintShade,x+7,y+4,3,6);r(g,P.gold,x+7,y+11,3,4);r(g,P.creamLight,x+7,y+11,2,2);
      r(g,P.ink,x+5,y+1,1,3);r(g,P.ink,x+11,y+1,1,3);
    }
  }
  A.wildlifeIcon=function(type) {
    if(!species.includes(type))return null;
    return canvas(`portrait:${type}`,32,32,g=>miniature(g,type,6,type==='rabbit'?6:8));
  };
  A.wildlifeBucketIcon=function(type) {
    if(!species.includes(type))return null;
    return canvas(`bucket:${type}`,32,32,g=>{
      r(g,P.outline,9,5,14,2);r(g,P.outline,7,7,2,11);r(g,P.outline,23,7,2,11);
      r(g,P.stoneLight,10,6,12,1);r(g,P.stoneLight,8,8,1,8);r(g,P.stone,23,8,1,8);
      // The animal peeks above a familiar pail; the pail occludes its lower body.
      miniature(g,type,6,type==='rabbit'?0:2);
      r(g,P.outline,5,15,22,3);r(g,P.outline,6,18,20,6);r(g,P.outline,8,24,16,4);
      r(g,P.stone,7,18,18,5);r(g,P.stoneShade,9,23,14,4);r(g,P.stoneLight,8,18,3,6);
      r(g,P.stone,11,25,9,1);r(g,P.stoneShade,22,18,2,5);r(g,P.creamLight,6,16,20,1);
      r(g,P.mintShade,14,20,5,3);r(g,P.mint,15,20,3,2);
    });
  };
  function cageBack(g,w,h) {
    // Open air stays transparent. Timber, a rear rail and straw make a home for
    // the real occupants, without painting inventory or extra animals into it.
    r(g,P.outline,3,h-9,w-6,9);r(g,P.wood,4,h-8,w-8,7);r(g,P.woodLight,5,h-8,w-10,2);
    r(g,P.woodShade,5,h-3,w-10,2);
    r(g,P.woodShade,5,12,3,h-21);r(g,P.woodShade,w-8,12,3,h-21);
    r(g,P.mintShade,7,13,w-14,2);
    for(let x=11;x<w-10;x+=13){r(g,P.creamShade,x,h-11,8,1);r(g,P.woodLight,x+3,h-12,5,1);}
    // The large cage has two occupant rows. A fixed timber shelf gives its
    // upper row a real visible footing instead of leaving rabbits in mid-air.
    if(h===96){r(g,P.woodLight,8,h-43,w-16,1);r(g,P.wood,8,h-42,w-16,2);r(g,P.woodShade,8,h-40,w-16,1);}
  }
  function cageFront(g,w,h) {
    // Low arched cap, thin ironwork and stout timber feet; every bar shares the
    // source pixel size of buildings and Workers.
    poly(g,P.outline,[[3,14],[7,8],[14,5],[w-14,5],[w-7,8],[w-3,14]]);
    poly(g,P.wood,[[5,13],[9,9],[15,7],[w-15,7],[w-9,9],[w-5,13]]);
    r(g,P.woodLight,15,7,w-30,1);r(g,P.woodShade,5,13,w-10,2);
    for(let x=12;x<w-10;x+=12){r(g,P.mintShade,x,15,2,h-23);r(g,P.stoneLight,x,15,1,h-25);}
    for(const x of [3,w-8]){r(g,P.outline,x,14,5,h-14);r(g,P.wood,x+1,15,3,h-16);r(g,P.woodLight,x+1,15,1,h-18);r(g,P.stoneShade,x,h-7,5,5);r(g,P.stoneLight,x+1,h-7,2,1);}
    r(g,P.outline,7,h-12,w-14,4);r(g,P.woodLight,8,h-11,w-16,1);r(g,P.wood,8,h-10,w-16,1);
    const doorX=Math.floor(w/2)-10;
    r(g,P.mintShade,doorX,18,1,h-30);r(g,P.mintShade,doorX+20,18,1,h-30);
    r(g,P.stone,doorX,18,21,1);r(g,P.stone,doorX,h-13,21,1);
    r(g,P.outline,doorX+17,Math.floor(h/2),5,5);r(g,P.gold,doorX+18,Math.floor(h/2)+1,3,2);
    // Discrete hinge pixels and latch identify the usable door without text.
    r(g,P.stoneLight,doorX-1,22,3,2);r(g,P.stoneLight,doorX-1,h-19,3,2);
  }
  A.cageSprite=function(type,options={}) {
    if(!Object.hasOwn(A.cageSizes,type))return null;
    const s=A.cageSizes[type],layer=['back','front'].includes(options.layer)?options.layer:'all';
    return canvas(`cage:${type}:${layer}`,s.width,s.height,g=>{
      if(layer!=='front')cageBack(g,s.width,s.height);if(layer!=='back')cageFront(g,s.width,s.height);
    });
  };
  A.cageIcon=function(type) {
    if(!Object.hasOwn(A.cageSizes,type))return null;
    return canvas(`cageIcon:${type}`,32,32,g=>{
      const level=['cageSmall','cageMedium','cageLarge'].indexOf(type),x=7-level*2,w=18+level*4,top=8-level*2;
      poly(g,P.outline,[[x,top+5],[x+3,top+1],[x+w-3,top+1],[x+w,top+5]]);
      r(g,P.woodLight,x+3,top+2,w-6,1);r(g,P.wood,x+1,top+4,w-2,2);
      r(g,P.outline,x,top+5,3,23-top);r(g,P.outline,x+w-3,top+5,3,23-top);
      r(g,P.wood,x+1,top+6,1,20-top);r(g,P.wood,x+w-2,top+6,1,20-top);
      for(let px=x+4;px<x+w-3;px+=4){r(g,P.mintShade,px,top+6,1,19-top);r(g,P.stoneLight,px,top+6,1,7);}
      r(g,P.outline,x,25,w,4);r(g,P.woodLight,x+1,26,w-2,1);r(g,P.wood,x+1,27,w-2,1);
      if(level===2){r(g,P.woodLight,x+3,18,w-6,1);r(g,P.wood,x+3,19,w-6,1);}
      r(g,P.outline,x+w-7,18,4,4);r(g,P.gold,x+w-6,19,2,1);
    });
  };
})();
