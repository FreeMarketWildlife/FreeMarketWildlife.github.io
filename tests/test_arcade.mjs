import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../portfolio/critz/games/',import.meta.url));
const games=JSON.parse(await readFile(path.join(root,'catalog.json'),'utf8'));
assert.equal(new Set(games.map(g=>g.id)).size,games.length);
assert.equal(games.length,12);
for(const g of games){
 assert.equal(g.status,'Prototype');assert(g.controls.length>30);assert(g.src.startsWith('/portfolio/critz/games/builds/'));
 const file=path.join(root,g.src.split('/games/')[1]);assert((await stat(file)).isFile()||(await stat(path.join(file,'index.html'))).isFile());
 const html=await readFile(path.join(root,g.id,'index.html'),'utf8');assert(html.includes('id="direct"'));assert(html.includes('id="viewport-expand"'));assert(html.includes('id="exit"'));
}
let count=0;
async function audit(dir){for(const e of await readdir(dir,{withFileTypes:true})){assert(!['.git','.env','.dev.vars','AGENTS.md','node_modules'].includes(e.name),`Forbidden artifact: ${e.name}`);const p=path.join(dir,e.name);if(e.isDirectory())await audit(p);else{count++;assert((await stat(p)).size<25*1024*1024,'Cloudflare asset limit');assert(!/\.(?:zip|tar|gz|db|sqlite|log)$/.test(e.name));}}}
await audit(path.join(root,'builds'));
assert(!(await readdir(path.join(root,'builds'))).some(n=>/powvista|aram-house/i.test(n)));
console.log(`PASS: ${games.length} playable entries, public build targets, controls, expand/exit/direct fallback and ${count} sanitized runtime files.`);

const kingdom=JSON.parse(await readFile(path.join(root,'builds/kingdom-conquest/build-manifest.json'),'utf8'));assert.equal(kingdom.minionSpecies,18);assert.deepEqual(kingdom.conquerors,['lincoln','theodore']);assert((await stat(path.join(root,'builds/kingdom-conquest/classic.html'))).isFile());assert.equal((await readdir(path.join(root,'builds/kingdom-conquest/assets/minions'))).filter(n=>n.endsWith('.glb')).length,18);
