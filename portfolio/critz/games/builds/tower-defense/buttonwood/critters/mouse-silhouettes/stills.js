/* Three still mouse silhouettes, individually authored pixel clusters at two budgets. */
(() => {
 'use strict';
 const A=window.ButtonwoodArt,P=A.palette;
 const colors={O:P.outline,I:P.ink,b:P.woodShade,f:P.wood,h:P.woodLight,g:P.goldShade,t:P.soilRoot,c:P.cream,s:P.creamShade,v:P.creamLight,p:P.skin,l:P.skinLight,r:P.skinShade,k:P.coral};
 const earLarge=[
 '....OOOOOO....',
 '..OOhhhhffOO..',
 '.OhhhggpppffO.',
 'OhhgppllllprfO',
 'OhgppllllllprO',
 'OhgpllllllllprO',
 'OhgpllllllllprO',
 'OhgplllllllpprO',
 'OhgpllllllppprO',
 '.OhgpllllppprO.',
 '.OhgpppppprrO..',
 '..OhgppprrbrO..',
 '...OhgprrbbO...',
 '....OOfbbOO....',
 '......OOO......'];
 const farEarLarge=[
 '...OOOO...',
 '..OhffbO..',
 '.OhhprfbO.',
 '.OhpprrfO.',
 'OhhpprrrfO',
 'OhhpprrrfO',
 'OhhpprrrfO',
 '.OhpprrfO.',
 '.OhpprrfO.',
 '..OffrrO..',
 '..OffbO...',
 '...OOO....'];
 const faceLarge=[
 '........OOOOOOOO..............',
 '.....OOOhhhhggffOO............',
 '...OOhhhhhhhggggffOO..........',
 '..OhhhhghhhhhggggfffO.........',
 '.OhhhhhhhhhhhhhgggfffO........',
 '.OhhghhhhhhhhhhhhggffO........',
 'OhhghhhhhhhhhhggggggffO.......',
 'OhghhhghhhhhhhhgcOOOggfO......',
 'OhghhhhhhhhhhhgcOIIIOgfO......',
 'OhghhhhhhhhhhhgcOIvIOggfO.....',
 '.OghhhhhhhhhhhgcOIIIOggfO.....',
 '.OhghhhhhhhhhhhgcOIIIOggfO....',
 '..OhgghhhhhhhhhhgcOOOggfOO...',
 '..OhhggghhhhhhgggggccccccpO..',
 '.OhhggghhhhhgggggccccvvcckrO.',
 '..OhhgggggggccccccvvvvcckpO..',
 '...OhhgggggcccccIccvvccpOO...',
 '..OhhggggggccccccIIccccOO....',
 '...OhhhgggcccccccccIIcOO.....',
 '....OhgggccccccccsssOO.......',
 '.....OgggcccccssssOO.........',
 '......OffgcsssssOO...........',
 '.......OffssssOO.............'];
 const uprightBodyLarge=[
 '.........OOOOOO.........',
 '.......OOffhcccOO.......',
 '......OffhhccccccO......',
 '.....OffhhcccvvcccO.....',
 '....OffhhcccvvvcccffO...',
 '...OffhhhcccvvvcccfffO..',
 '..OffhhhhcccvvvcccfffO..',
 '..OffhhhhcccvvccccfffO..',
 '.OffghhhhhcccccccssfffO.',
 '.OfgghhhhhcccccccssfffO.',
 'OfggghhhhhcccccccssfffO.',
 'OfggghhhhhcccccccssfffO.',
 'OfggghhhhhccccccsssfffO.',
 'OfggghhhhhcccccssssfffO.',
 'OfggghhhhhcccccssssfffO.',
 'OffgghhhhhcccccsssffffO.',
 '.OffgghhhhccccsssffffO..',
 '.OffgghhhhcccsssffffO...',
 '..OffghhhhhsssbffffO....',
 '..OfffhhhhffbbbfffO.....',
 '...OffffffffbbbffO.....',
 '....OffffffbOOOffO.....',
 '.....OOOOOO...OOO......'];
 const lowBodyLarge=[
 '..........OOOOOOOOOOOO............',
 '.......OOOhhggggggggffOO..........',
 '.....OOhhhhggghhhhgggfffOO........',
 '....OhhhhhghhhhhhhhhhggfffO.......',
 '...OhhhhghhhhhhhhhhhhhggfffO......',
 '..OffhhghhhhhhhhhhhhhhhggfffO.....',
 '.OffhhhghhhhhhhhhhhhhhhggffffO....',
 '.OfghhhghhhhhhhhhhhhhhhggffffO....',
 'OffgghhghhhhhhhhhhhhhgggfffffO....',
 'OffgghhghhhhhhhhhhhggggfffffffO...',
 'OffgghhghhhhhhhhhhgggccccfffffO...',
 'OffgghhghhhhhhhhggggccccccfffO....',
 '.OfgghhghhhhhhhgggcccccccccffO....',
 '.OffghhghhhhhhhggccccccccccffO....',
 '..OffhhghhhhhhhggcccccccssffO.....',
 '..OffhhghhhhhhhggcccccssssffO.....',
 '...OffghhhhhhhgcccccsssssffO......',
 '....OfffhhhhgggssssssssfffO.......',
 '.....OfffggggfffbbbfffffO.........',
 '......OOffffffbbbbbffOO...........',
 '........OOOOOOOOOOOO.............'];
 const haunchLarge=[
 '....OOOOOO....',
 '..OOhhggffOO..',
 '.OhhghhhhfffO.',
 'OhhghhhhhhfffO',
 'OhghhhhhhhfffO',
 'OhghhhhhhhfffO',
 'OfghhhhhhhfffO',
 'OfghhhhhhffffO',
 'OfghhhhhhffffO',
 '.OfghhhhffffO.',
 '.OffghhhfffO..',
 '..OfffffffO...',
 '...OOfffOO....',
 '.....OOO......'];
 const pawLarge=['..OOOO..','.OhhhfO.','OhhhhffO','OhhhpppO','.OppplpO','..OrprpO','...OOOO.'];
 const footLarge=['..OOOOOO..','.OffppppO.','OffpppllpO','.OrprprrpO','..OOOOOOO.'];
 const frontLegLarge=['..OOO...','.OhffO..','.OhhfO..','.OhhfO..','.OhhfO..','.OhhfO..','.OfffO..','.OffpO..','..OppOO.','.OppllpO','..OrprrO','...OOOO.'];
 const earSmall=['..OOOO..','.OhhpfO.','OhplllrO','OhplllrO','OhpplprO','.OhprbO.','..OfbO..','...OO...'];
 const farEarSmall=['.OOO.','OhpfO','OhprO','OhprO','.OfO.','..O..'];
 const faceSmall=[
 '....OOOOOO........',
 '..OOhhhggfOO......',
 '.OhhhhhhhggfO.....',
 'OhhghhhhhhggfO....',
 'OhghhhhgcOOggfO...',
 'OhghhhgcOIvOggO...',
 '.OhghhgcOIIgggfO..',
 '.OhhghhhgOOgcccprO',
 '..OhgggccccvvckpO.',
 '.OhgggccccIccpOO..',
 '..OhggccccsIccO...',
 '...OffccsssOOO....',
 '....OfsssOO.......'];
 const bodySmall=['....OOOOO....','...OfhcccO...','..OfhccvccO..','.OfhhccvccfO.','OfghhccccsfO.','OfghhccccsfO.','OfghhcccssfO.','.OfghccsssO..','..OffffbbO...','...OOO.OO....'];
 const bodyLowSmall=['....OOOOOOOO.....','..OOhhhggfffOO...','.OhghhhhhggfffO..','OfghhhhhhhggfffO.','OfghhhhhhggccffO.','OfghhhhhggcccffO.','.OfghhhggcccssO..','..OffgggssssfO...','...OOffffffOO....','.....OOOOOO......'];
 const pawSmall=['.OO.','OhfO','OppO','.OO.'];
 const footSmall=['.OOOO.','OfpppO','OrprpO','.OOOO.'];
 function stamp(g,x,y,rows){for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){const c=colors[rows[j][i]];if(c){g.fillStyle=c;g.fillRect(x+i,y+j,1,1);}}}
 function line(g,x,y,xx,yy,color){g.fillStyle=color;let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;while(true){g.fillRect(x,y,1,1);if(x===xx&&y===yy)break;const ee=e*2;if(ee>=dy){e+=dy;x+=sx;}if(ee<=dx){e+=dx;y+=sy;}}}
 function tail(g,points,large){for(let n=1;n<points.length;n++){const[a,b]=points[n-1],[c,d]=points[n];line(g,a,b+1,c,d+1,P.outline);line(g,a-1,b,c-1,d,P.outline);line(g,a,b,c,d,P.skinShade);line(g,a,b-1,c,d-1,P.skin);if(large)line(g,a+1,b,c+1,d,P.skin);}}
 function head64(g,x,y){stamp(g,x+16,y-11,farEarLarge);stamp(g,x-3,y-10,earLarge);stamp(g,x,y,faceLarge);line(g,x+28,y+14,x+33,y+12,P.woodShade);line(g,x+29,y+16,x+33,y+16,P.woodShade);}
 function head40(g,x,y){stamp(g,x+9,y-5,farEarSmall);stamp(g,x-3,y-5,earSmall);stamp(g,x,y,faceSmall);}
 function draw(g,size,pose){
  if(size===64){
   if(pose==='upright'){
    tail(g,[[24,54],[17,52],[12,47],[10,40],[10,34],[8,32],[5,32],[3,35]],true);
    stamp(g,23,35,uprightBodyLarge);stamp(g,24,44,haunchLarge);stamp(g,25,57,footLarge);stamp(g,41,57,footLarge);head64(g,23,14);stamp(g,34,42,pawLarge);stamp(g,44,42,pawLarge);
   }else if(pose==='mostly'){
    tail(g,[[20,55],[13,52],[9,47],[8,40],[8,35],[6,33],[3,35]],true);
    stamp(g,15,39,lowBodyLarge);stamp(g,17,46,haunchLarge);stamp(g,20,57,footLarge);stamp(g,39,57,footLarge);head64(g,26,24);stamp(g,39,49,pawLarge);stamp(g,47,48,pawLarge);
   }else{
    tail(g,[[20,55],[13,52],[9,47],[8,40],[8,35],[6,33],[3,35]],true);
    stamp(g,15,39,lowBodyLarge);stamp(g,18,46,haunchLarge);stamp(g,21,57,footLarge);stamp(g,46,50,frontLegLarge);stamp(g,39,50,frontLegLarge);head64(g,27,26);
   }
  }else{
   if(pose==='upright'){
    tail(g,[[13,27],[8,26],[5,23],[4,18],[4,15],[2,14],[1,16]],false);
    stamp(g,13,18,bodySmall);stamp(g,13,28,footSmall);stamp(g,23,28,footSmall);head40(g,15,6);stamp(g,19,21,pawSmall);stamp(g,25,20,pawSmall);
   }else if(pose==='mostly'){
    tail(g,[[11,27],[6,25],[4,22],[4,17],[2,15],[1,17]],false);
    stamp(g,9,20,bodyLowSmall);stamp(g,12,28,footSmall);stamp(g,23,28,footSmall);head40(g,18,12);stamp(g,24,24,pawSmall);stamp(g,29,23,pawSmall);
   }else{
    tail(g,[[11,27],[6,25],[4,22],[4,17],[2,15],[1,17]],false);
    stamp(g,9,20,bodyLowSmall);stamp(g,12,28,footSmall);stamp(g,25,25,['.OfO.','.OhO.','.OfO.','.OppO','..OO.']);stamp(g,30,25,['.OfO.','.OhO.','.OfO.','.OppO','..OO.']);head40(g,19,13);
   }
  }
 }
 const designs=[];
 for(const size of [40,64])for(const pose of ['upright','mostly','quadrupedal']){const c=document.createElement('canvas');c.width=size;c.height=size===40?32:64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,size,pose);designs.push(Object.freeze({id:`${pose}-${size}`,pose,width:c.width,height:c.height,anchor:Object.freeze({x:size===40?18:32,y:size===40?31:61}),canvas:c}));}
 A.mouseSilhouettes=Object.freeze({designs:Object.freeze(designs),draw});
})();
