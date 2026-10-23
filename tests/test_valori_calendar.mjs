import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/js/valori-calendar-model.js',import.meta.url),'utf8');
const {combinedItems,monthCells}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.deepEqual(combinedItems(),[]);
// Synthetic test fixtures never ship as workspace records.
const personal=[{date:'2028-02-29',title:'P'}],business=[{date:'2028-02-01',title:'B'}];
const items=combinedItems(personal,business);
assert.deepEqual(items.map(i=>[i.date,i.category]),[['2028-02-01','Bookkeeping Business'],['2028-02-29','Personal']]);
assert.equal(personal[0].category,undefined);
for(const [year,month,days,start] of [[2028,1,29,2],[2026,1,28,0],[2026,9,31,4],[2027,0,31,5]]) {
 const cells=monthCells(year,month);
 assert.equal(cells.filter(Boolean).length,days); assert.equal(cells.indexOf(1),start);
 assert.equal(cells.length%7,0); assert.equal(cells.filter(Boolean).at(-1),days);
}
console.log('PASS: empty combined calendar, both categories, chronological order, input isolation, leap year and month boundaries');
