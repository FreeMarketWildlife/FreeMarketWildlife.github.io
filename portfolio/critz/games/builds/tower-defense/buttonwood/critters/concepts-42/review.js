(async()=>{
 const A=window.ButtonwoodArt,c=document.getElementById('scene'),g=c.getContext('2d'),names=['mouse','turtle','lizard'];
 const images=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=name+'-42.png'})));
 g.imageSmoothingEnabled=false;g.fillStyle=A.palette.sky;g.fillRect(0,0,640,224);
 g.drawImage(A.building('home'),68,40);
 for(let x=0;x<640;x+=32){g.drawImage(A.terrain('dirt',x/32,0,{meadow:true,n:null,e:'dirt',w:'dirt',s:'dirt'}),x,168);g.drawImage(A.terrain('dirt',x/32,1,{n:'dirt',e:'dirt',w:'dirt',s:'dirt'}),x,200)}
 images.forEach((im,i)=>{g.drawImage(im,244+i*110,128);g.fillStyle=A.palette.ink;g.font='12px system-ui';g.fillText(names[i],244+i*110,110)});
 document.getElementById('native').onclick=()=>{c.style.width='640px'};
 document.getElementById('zoom').onclick=()=>{c.style.width='1920px';c.style.maxWidth='none'};
 window.__critter42Review={sizes:images.map(im=>[im.naturalWidth,im.naturalHeight]),ready:true};
})();
