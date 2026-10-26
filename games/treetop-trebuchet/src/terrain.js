// Shared authored contact geometry for the solver, renderer and advisory preview.
export const surfaceY=(surface,x)=>surface.y+(surface.slope??0)*(x-surface.minX);
export function surfaceVertices(s){return [{x:s.minX,y:s.y-.08},{x:s.maxX,y:surfaceY(s,s.maxX)-.08},{x:s.maxX,y:surfaceY(s,s.maxX)},{x:s.minX,y:s.y}];}
export function surfaceCrossing(a,b,s,{clearance=0,bothDirections=false}={}){
 const da=a.y-surfaceY(s,a.x)-clearance,db=b.y-surfaceY(s,b.x)-clearance;
 if(bothDirections?da*db>0:da<0||db>0||db>=da)return null;
 if(da===db)return null;const fraction=da/(da-db),x=a.x+(b.x-a.x)*fraction;
 return fraction>=0&&fraction<=1&&x>=s.minX-clearance&&x<=s.maxX+clearance?{surface:s,fraction,x}:null;
}
export const surfaceNear=(s,p,margin=.15)=>p.x>=s.minX-margin&&p.x<=s.maxX+margin&&Math.abs(p.y-surfaceY(s,p.x))<margin;
