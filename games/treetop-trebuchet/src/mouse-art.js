/** Wood-mouse silhouette in the same metre envelope as its compound fixtures.
 * Head/body occupy the front 9 cm; the thin trailing tail occupies 9 cm.
 * All poses retain the caller's physical body transform. */
export function drawMouse(ctx,length,height,performance={}){
 const pose=performance.pose??'ready',hit=pose.startsWith('bonk'),dazed=pose==='stars'||pose==='dazed',walking=pose==='walking',air=pose==='flying'||hit,dive=performance.airPose==='dive';
 const ink='#332c2b',fur='#ac8665',light='#d4b18a',belly='#eee2ca',pink='#c88e86',flex=performance.flex??{};
 ctx.save();ctx.scale(length,height);ctx.translate(-.18,0);ctx.lineJoin='round';ctx.lineCap='round';
 const oval=(x,y,rx,ry,fill,stroke=ink,line=.012)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}};
 const line=(points,color,width)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 // Lightweight, tapered tail. It flexes at the root without rotating the torso.
 ctx.save();ctx.rotate(flex.tail??0);ctx.beginPath();ctx.moveTo(.01,.12);ctx.bezierCurveTo(-.12,.22,-.31,.20,-.495,.10);ctx.strokeStyle=ink;ctx.lineWidth=.013;ctx.stroke();ctx.strokeStyle='#ceaa98';ctx.lineWidth=.006;ctx.stroke();ctx.restore();
 // Far ear and far paws sit behind the body.
 oval(.32,-.31,.033,.17,'#96745c');
 for(const [i,x]of [[0,.09],[1,.29]]){
  const step=walking?Math.sin((performance.frame??0)+i*Math.PI):0;
  const y=hit?.26:air?(dive?.2:.33):.43-Math.max(0,step)*.10;
  line([[x,.22],[x+step*.022,y],[x+.045+step*.022,y]],pink,.015);
 }
 oval(.18,.055,.18,.40,fur);
 oval(.18,.26,.151,.15,belly,null);
 oval(.15,-.10,.105,.055,light,null);
 // A small pointed muzzle, prominent dark eye and large round mouse ears.
 ctx.save();ctx.translate(.30,0);ctx.rotate((flex.head??0)+(pose==='bonk-b'?.08:0));ctx.translate(-.30,0);
 ctx.beginPath();ctx.moveTo(.29,-.18);ctx.quadraticCurveTo(.37,-.30,.43,-.13);ctx.quadraticCurveTo(.47,-.03,.495,.08);ctx.quadraticCurveTo(.46,.23,.36,.26);ctx.quadraticCurveTo(.29,.19,.29,-.18);ctx.closePath();ctx.fillStyle=fur;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=.012;ctx.stroke();
 oval(.335,-.32,.035,.18,fur);oval(.335,-.32,.024,.125,pink,null);
 oval(.438,.14,.047,.09,belly,null);
 oval(.491,.078,.011,.027,'#735054',ink,.005);
 if(hit){line([[.387,-.11],[.416,.03]],ink,.010);line([[.415,-.11],[.386,.03]],ink,.010);}
 else{oval(.401,-.045,.022,dazed?.05:.08,'#22251f',null);if(!dazed)oval(.407,-.073,.007,.024,'#fff8e5',null);}
 if(air||hit||pose==='dazed')oval(.453,.205,.019,hit?.055:pose==='dazed'?.025:.04,'#664438',null);
 else line([[.445,.205],[.464,.19]],ink,.005);
 if((performance.tier??0)>=2){line([[.36,.14],[.39,.18]],'#a76b65',.009);}
 for(const [y,end]of [[.10,-.015],[.15,.18]])line([[.461,y],[.50,end]],'#766857',.0028);
 ctx.restore();
 // Near paws remain small instead of the old bulky oval feet.
 const stride=walking?Math.sin((performance.frame??0)+Math.PI):0;
 line([[.13,.22],[.11+stride*.025,air?.32:.46-Math.max(0,stride)*.09],[.165+stride*.025,air?.34:.46-Math.max(0,stride)*.09]],pink,.018);
 line([[.31,.17],[.32,air?.30:.40],[.355,air?.32:.40]],pink,.014);
 if(dazed){for(const [x,y]of [[.29,-.60],[.41,-.55]]){line([[x-.012,y],[x+.012,y]],'#d4af50',.009);line([[x,y-.04],[x,y+.04]],'#d4af50',.009);}}
 ctx.restore();
}
