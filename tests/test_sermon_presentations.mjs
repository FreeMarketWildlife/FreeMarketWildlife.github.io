import assert from 'node:assert/strict';
import {validateDeck,mergeDecks} from '../assets/js/sermon-presentations.js';
const deck={version:1,workspace:'philip-aram',kind:'sermon-presentation',id:'synthetic',title:'Test presentation',slides:[{id:'one',title:'Test',body:['Synthetic text'],notes:'Synthetic notes',status:'Interpretation',visual:'days',appendix:false,section:'Test',day:1,readings:[{reference:'Genesis 1',url:'https://www.esv.org/Genesis+1/'}],sources:[]}],sourceDocuments:[{name:'Original',text:'Keep original'}]};
assert.equal(validateDeck(structuredClone(deck)).id,'synthetic');
for(const edit of [d=>d.workspace='another',d=>d.slides.push(d.slides[0]),d=>d.slides[0].day=8,d=>d.slides[0].readings[0].url='javascript:alert(1)',d=>d.slides[0].sources=['https://user:secret@example.com'],d=>d.slides[0].status='Guaranteed proof',d=>d.sourceDocuments=[{name:'Broken',text:42}]]){const d=structuredClone(deck);edit(d);assert.throws(()=>validateDeck(d));}
const first=mergeDecks([],deck);assert.deepEqual(first,[deck]);assert.deepEqual(mergeDecks(first,deck),first);const changed=structuredClone(deck);changed.slides[0].notes='Incoming changed notes';const merged=mergeDecks(first,changed);assert.equal(merged.length,2);assert.deepEqual(merged[0],deck);assert.notEqual(merged[1].id,deck.id);assert.equal(merged[1].sourceDocuments[0].text,'Keep original');assert.equal(first.length,1);console.log('PASS: bounded schema, workspace/day/ID/URL validation, immutable conflict copies and source preservation.');

const positioned=structuredClone(deck);positioned.lastSlideId='one';assert.equal(mergeDecks([positioned],deck).length,1,'remembered presentation position is not a content conflict');const long=structuredClone(deck);long.id='x'.repeat(120);long.title='x'.repeat(180);const longChanged=structuredClone(long);longChanged.slides[0].notes='Change';assert.doesNotThrow(()=>mergeDecks([long],longChanged).forEach(validateDeck));

assert.equal(mergeDecks(merged,changed).length,2,'repeated identical conflict import does not multiply copies');

const exportedConflict=structuredClone(merged[1]);exportedConflict.slides[0].notes='Edited export of preserved copy';const nested=mergeDecks(merged,exportedConflict);assert.equal(nested.length,3);assert.equal(mergeDecks(nested,exportedConflict).length,3,'nested conflict-copy imports remain repeat safe');
