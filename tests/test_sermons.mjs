import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('assets/js/sermons.js','utf8');
const {validateSermons,mergeSermons,sermonStorageKey,safeMapUrl}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const entry={id:'qa-fixture',date:'2026-01-01',speaker:'QA speaker',passages:'QA passage',title:'',theme:'',notes:'Test notes'};
const backup={version:1,workspace:'philip-aram',kind:'sermons',entries:[entry]};
assert.equal(validateSermons(backup),backup);assert.equal(mergeSermons(backup,backup).entries.length,1);
assert.equal(mergeSermons(backup,{...backup,entries:[{...entry,notes:'Older backup'}]}).entries[0].notes,'Test notes');
assert.equal(mergeSermons(backup,{...backup,entries:[{...entry,id:'new'}]}).entries.length,2);
for(const patch of [{date:'2026-02-30'},{date:'invalid'},{speaker:''},{passages:''},{notes:'x'.repeat(50001)}])assert.throws(()=>validateSermons({...backup,entries:[{...entry,...patch}]}));
assert.throws(()=>mergeSermons(backup,{...backup,workspace:'kat-kai'}));assert.throws(()=>mergeSermons(backup,{...backup,kind:'quiet-time'}));
assert.throws(()=>validateSermons({...backup,entries:[entry,entry]}));
assert.notEqual(sermonStorageKey,'fmw:philip-aram:quiet-time:v1');
const html=readFileSync('philip-aram/index.html','utf8');assert.match(html,/data-sermon-notebook/);assert.match(source,/kind:'sermons',entries:\[\]/,'public notebook must start empty');
console.log('PASS: sermon dates/fields, separate store, repeat-safe/non-overwriting imports, cross-workspace/type rejection, and no personal public seed.');

const located={...entry,locationName:'QA location',locationAddress:'QA address',mapUrl:'https://example.com/maps?q=test'};
assert.equal(validateSermons({...backup,entries:[located]}).entries[0].locationName,'QA location');
assert.equal(validateSermons(backup).entries[0].locationName,undefined,'legacy notes remain valid and unchanged');
for(const url of ['javascript:alert(1)','data:text/html,x','//example.com','http://example.com','https://user:password@example.com','https://example.com/\n']){assert.equal(safeMapUrl(url),false);assert.throws(()=>validateSermons({...backup,entries:[{...located,mapUrl:url}]}));}
assert.throws(()=>validateSermons({...backup,entries:[{...entry,locationAddress:'x'.repeat(501)}]}));
console.log('PASS: optional location fields, backward compatibility, and safe HTTPS map URLs.');
