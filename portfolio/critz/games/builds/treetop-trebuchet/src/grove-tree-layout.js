// Shared outline of solid limbs. Sampled curves are editable collision polygons.
const point=(a,b,c,d,t)=>{const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};};
export function ancientBough(tree,origin,row,side){
 const cx=tree.trunkX,w=tree.trunkWidth,h=tree.height,r=tree.crownRadius??500,parent=row<4?row:(row-4)%3;
 let a={x:cx+w*.16,y:h*(.51+parent*.065)-origin},b={x:cx+side*r*(.91-parent*.19),y:h*(.69+parent*.079)-origin},c1={x:a.x+side*r*.12,y:a.y+h*.12},c2={x:b.x-side*r*.19,y:b.y-h*.02},width=w*(.12-parent*.018);
 if(row>=4){const upper=row>=7;a=point(a,c1,c2,b,upper?.72:.48);b={x:b.x+side*r*(upper?.045:.13),y:b.y+h*(upper?.065:.025)};c1={x:a.x+side*r*.03,y:a.y+h*.08};c2={x:b.x-side*r*.08,y:b.y-h*.015};width*=upper?.19:.29;}
 const edge=[[],[]];
 for(let i=0;i<=7;i++){const t=i/7,u=1-t,p=point(a,c1,c2,b,t),dx=3*u*u*(c1.x-a.x)+6*u*t*(c2.x-c1.x)+3*t*t*(b.x-c2.x),dy=3*u*u*(c1.y-a.y)+6*u*t*(c2.y-c1.y)+3*t*t*(b.y-c2.y),L=Math.hypot(dx,dy),half=width*(1-t)*.5+.45;for(let j=0;j<2;j++){const sign=j?1:-1;edge[j].push({x:p.x-dy/L*half*sign,y:p.y+dx/L*half*sign});}}
 return[...edge[0],...edge[1].reverse()];
}
