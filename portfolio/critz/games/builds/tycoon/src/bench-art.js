let art;
export async function loadBenchArt(){
 if(art)return art;
 const rows=await Promise.all(['down','up','left','right'].map(async direction=>{
  const load=async name=>{const img=new Image();img.src=new URL('../assets/review/bench-r1/'+name+'.png',import.meta.url).href;await img.decode();return img;};
  const [bench,front,hero]=await Promise.all([load('bench-'+direction),load('bench-'+direction+'-front'),load('hero-sit-'+direction)]);return [direction,{bench,front,hero}];
 }));art=new Map(rows);return art;
}
export function drawBench(c,o,direction,{front=false}={}){const a=art.get(direction),img=front?a.front:a.bench;c.drawImage(img,o.x*32,(o.y-1)*32);if(!front)c.drawImage(a.front,o.x*32,(o.y-1)*32);}
export function drawSeatedHero(c,p){const img=art.get(p.facing).hero;const hop=p.jump&&!matchMedia('(prefers-reduced-motion: reduce)').matches?Math.round(Math.sin((p.progress||0)*Math.PI)*8):0;c.drawImage(img,Math.round(p.px??p.x*32),Math.round((p.py??p.y*32)-42-hop));}
