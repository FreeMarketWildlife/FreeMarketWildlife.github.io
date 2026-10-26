import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BUSINESSES,SKILLS,INTERESTS,allLabels,recommend} from '../assets/js/business-model.js';
const exactEligible=(b,s,i)=>b.skills.some(v=>s.includes(v))&&b.interests.some(v=>i.includes(v))&&(b.allInterests||[]).every(g=>g.some(v=>i.includes(v)));
test('500 structured distinct ideas and valid taxonomy gates',()=>{
 assert.equal(BUSINESSES.length,500);assert.equal(new Set(BUSINESSES.map(b=>b.id)).size,500);
 const skills=new Set(allLabels(SKILLS)),interests=new Set(allLabels(INTERESTS));
 for(const b of BUSINESSES){assert.ok(b.skills.every(v=>skills.has(v)),b.id);assert.ok(b.interests.every(v=>interests.has(v)),b.id);assert.ok(b.first&&b.customer&&b.service&&b.ratings,b.id);}
});
test('all dog-walking boolean/missing combinations require dogs AND walking',()=>{
 const dogWalkers=BUSINESSES.filter(b=>/dog.walk|walk.*dog/i.test(b.title+' '+b.service)&&!/(writing|guide|illustrat|photo|video|software|website|newsletter|tracker|template|portrait)/i.test(b.title));
 assert.ok(dogWalkers.length>0,'catalog contains actual walking services');
 for(const dogs of [true,false,undefined])for(const walking of [true,false,undefined]){
  const answers=[...(dogs===true?['Dogs']:[]),...(walking===true?['Walking']:[]),'Animals','Outdoors'];
  for(const b of dogWalkers){assert.equal(exactEligible(b,['Dog walking','Caring for animals','Pet care'],answers),dogs===true&&walking===true,`${b.id}: dogs ${dogs}, walking ${walking}`);assert.equal(recommend(['Dog walking'],answers).some(r=>r.id===b.id),dogs===true&&walking===true);}
 }
 for(const b of dogWalkers){assert.ok(exactEligible(b,['Dog walking'],['Dogs','Walking dogs']),b.id);}
});
test('unrelated, unknown and parent-only answers never fabricate eligibility',()=>{
 assert.deepEqual(recommend([],[]),[]);assert.deepEqual(recommend(['unknown talent'],['unknown passion']),[]);
 for(const [s,i] of [[['Writing'],['Gardens']],[['Writing'],['Outdoors']],[['Writing'],['Growing food']],[['Writing'],['Music']],[['Caring for animals'],['Outdoors']]]){
  for(const b of recommend(s,i)){
   assert.ok(exactEligible(b,s,i),b.id);assert.ok(b.skillMatches.every(v=>s.includes(v)));assert.ok(b.interestMatches.every(v=>i.includes(v)));
   if(s[0]==='Writing')assert.ok(!/(cleaning service|yard cleanup|garden maintenance|landscap|website build|logo design)/i.test(b.title),b.id);
  }
 }
});
test('deterministic ranking, real explanation evidence, deselection and diversity',()=>{
 const s=['Video editing','Writing','Organizing'],i=['Music','Independent musicians','Local bands'];
 const first=recommend(s,i);assert.equal(first.length,3);assert.deepEqual(recommend([...s].reverse(),[...i].reverse()),first);
 assert.equal(new Set(first.map(b=>b.id)).size,first.length);assert.ok(new Set(first.map(b=>b.family)).size>1);
 for(const b of first){assert.ok(b.skillMatches.every(v=>s.includes(v)));assert.ok(b.interestMatches.every(v=>i.includes(v)));}
 assert.deepEqual(recommend(s,[]),[]);
 const noDesign=recommend(['Writing'],['Art & design']);assert.ok(noDesign.every(b=>b.skillMatches.every(v=>v==='Writing')));
});
test('exhaustive single-answer coverage and eligibility audit',()=>{
 const skills=[...new Set(allLabels(SKILLS))],interests=[...new Set(allLabels(INTERESTS))];
 let zero=0,one=0,two=0,three=0;const examples=[];
 for(const s of skills)for(const i of interests){const result=recommend([s],[i]);assert.ok(result.length<=3);if(!result.length){zero++;if(examples.length<20)examples.push({skill:s,interest:i});}else if(result.length===1)one++;else if(result.length===2)two++;else three++;
 for(const b of result){assert.ok(exactEligible(b,[s],[i]),b.id);assert.deepEqual(b.skillMatches,[s]);assert.deepEqual(b.interestMatches,[i]);}}
 fs.mkdirSync('outputs/business-catalog',{recursive:true});fs.writeFileSync('outputs/business-catalog/coverage.json',JSON.stringify({skills:skills.length,interests:interests.length,pairs:skills.length*interests.length,zero,one,two,three,unmatchedExamples:examples},null,2));
});
