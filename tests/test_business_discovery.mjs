import assert from 'node:assert/strict';
import {SKILLS,INTERESTS,recommend} from '../assets/js/business-model.js';
import {choiceDeck,nextChoiceBatch} from '../assets/js/business-discovery.js';
import {bubbleLayout} from '../assets/js/business-scene.js';
for(const tree of [SKILLS,INTERESTS]){
 const deck=choiceDeck(tree);assert.equal(new Set(deck.map(n=>n.label)).size,deck.length);
 for(let n=1;n<deck.length;n++)assert.ok(deck[n].depth>=deck[n-1].depth);
 const selected=[deck[0].label],seen=new Set();let cursor=0,current=[];
 for(let n=0;n<deck.length;n++){
  const next=nextChoiceBatch(deck,current,selected,6,cursor);assert.equal(next.nodes.length,6);
  assert.equal(new Set(next.nodes.map(n=>n.label)).size,6);assert.ok(next.nodes.every(n=>!selected.includes(n.label)));
  next.nodes.forEach(n=>seen.add(n.label));current=next.nodes;cursor=next.cursor;
 }
 assert.equal(seen.size,deck.length-1,'Every unselected choice is discoverable without selecting a parent');
 assert.deepEqual(nextChoiceBatch(deck,[],selected,6,0),nextChoiceBatch(deck,[],selected,6,0));
}
for(const [w,h] of [[1400,500],[1326,380],[748,500],[370,400],[300,250],[824,130],[300,110]]){
 for(const interests of [false,true]){const layout=bubbleLayout(w,h,interests);assert.ok(layout.count>=1);assert.ok(layout.radius*2<=h&&layout.radius*2<=w);assert.ok(layout.radius*2>=44);}
}
assert.equal(bubbleLayout(1400,500).count,15);assert.equal(bubbleLayout(370,400).count,6);
for(const [skills,interests] of [[['Systems'],['Dance']],[['Lighting'],['Native plants']],[['Dog walking'],['Music']],[['Music'],['Banking']],[['Appointment coordination'],['Worldbuilding']]]){
 const result=recommend(skills,interests);
 if(interests[0]==='Banking'){assert.deepEqual(result,[]);continue;}
 assert.ok(result.length>=1);assert.ok(result.every(b=>b.skillMatches.every(s=>skills.includes(s))));
 assert.deepEqual(result,recommend([...skills].reverse(),[...interests].reverse()));
 if(skills[0]==='Dog walking'){assert.equal(result[0].matchKind,'starter');assert.equal(result[0].sourceId,'pilot-pet-handoff');assert.deepEqual(result[0].interestMatches,[]);}
}
console.log('PASS: deterministic full-taxonomy rotation, direct leaf discovery, responsive target capacity/tap sizes, sparse/conflicting choices and explicit dog-walking gate.');
