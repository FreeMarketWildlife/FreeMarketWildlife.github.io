// Breadth-first, deterministic discovery. Browsing never selects an ancestor.
export function choiceDeck(nodes) {
 const flatten=(rows,path=[])=>rows.flatMap(node=>[{...node,depth:path.length,path},...flatten(node.children,[...path,node.label])]);
 return flatten(nodes).filter((node,index,all)=>all.findIndex(other=>other.label===node.label)===index).sort((a,b)=>a.depth-b.depth);
}
export function nextChoiceBatch(deck,current,selected,count,cursor=0) {
 const excluded=new Set(selected),shown=new Set(current.map(node=>node.label)),nodes=[];
 let scanned=0;
 while(scanned<deck.length&&nodes.length<count){
  const node=deck[(cursor+scanned)%deck.length];scanned++;
  if(!excluded.has(node.label)&&!shown.has(node.label))nodes.push(node);
 }
 for(const node of deck)if(nodes.length<count&&!excluded.has(node.label)&&!nodes.some(n=>n.label===node.label))nodes.push(node);
 return {nodes,cursor:(cursor+scanned)%Math.max(1,deck.length)};
}
