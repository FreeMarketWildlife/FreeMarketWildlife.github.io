import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.document = {querySelector: () => null};
const source = await readFile(new URL('../assets/js/blog.js', import.meta.url), 'utf8');
const {comparePosts} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const posts = [
  {id:'b', publishedAt:200, popularity:null},
  {id:'a', publishedAt:200, popularity:0},
  {id:'c', publishedAt:100, popularity:10},
  {id:'d', publishedAt:100, popularity:10},
];
const ids = (items, order) => [...items].sort((a,b) => comparePosts(a,b,order)).map(p => p.id);
assert.deepEqual(ids(posts, 'newest'), ['a','b','c','d']);
assert.deepEqual(ids(posts, 'oldest'), ['c','d','a','b']);
assert.deepEqual(ids(posts, 'popular'), ['c','d','a','b']); // real zero precedes missing
assert.deepEqual(ids(posts.map(p => ({...p, popularity:null})), 'popular'), ['a','b','c','d']);
assert.deepEqual(ids([...posts].reverse(), 'newest'), ids(posts, 'newest')); // stable ties
assert.deepEqual(ids([], 'popular'), []);
console.log('PASS: Blog dates, stable ties, popularity, missing-data fallback, and empty list.');
