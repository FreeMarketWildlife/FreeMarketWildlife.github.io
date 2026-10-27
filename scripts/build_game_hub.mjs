// One accepted listing, two hosts: the main site owns /game/, game runtimes stay /games/*.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const check=process.argv.includes('--check');
const original=await readFile(root+'games/index.html','utf8');
const catalog=JSON.parse(await readFile(root+'games/catalog.json','utf8'));
const expected=catalog.filter(game=>game.publicListing!==false).map(game=>game.id==='kingdom-conquest'?'critz-kingdom-conquest':game.id);
const actual=[...original.matchAll(/<a class="game-card" href="\.\/([^/]+)\/"/g)].map(match=>match[1]);
if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('Games hub differs from the accepted visibility catalog');
const nav='<nav aria-label="Primary"><a href="/build-a-business/">Build a Business</a><a href="/game/" aria-current="page">Games</a><a href="/blog/">Blog</a></nav>';
const hub=original.replace(/<meta http-equiv="refresh"[^>]*>/g,'')
  .replace('https://freemarketwildlife.com/games/','https://freemarketwildlife.com/game/')
  .replace(/<nav aria-label="Primary">.*?<\/nav>/,nav)
  .replace(/(href|src)="(?!\/|https?:|#)([^"]+)"/g,(_,attr,value)=>`${attr}="/games/${value.replace(/^\.\//,'')}"`)
  .replace('<h1 class="visually-hidden">Games</h1>','<h1>Games</h1>')
  .replace(/^[ \t]+$/gm,'');
const alias='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Games — Free Market Wildlife</title><link rel="canonical" href="https://freemarketwildlife.com/game/"><meta http-equiv="refresh" content="0;url=/game/"></head><body><main><h1>Games</h1><p><a href="/game/">Open Games</a></p></main></body></html>\n';
for(const [name,contents] of [['game/index.html',hub],['portfolio/critz/index.html',alias],['portfolio/critz/games/index.html',alias]]) {
  let previous;try{previous=await readFile(root+name,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(previous===contents)continue;
  if(check)throw Error('Games hub output out of date: '+name);
  await mkdir(root+name.slice(0,name.lastIndexOf('/')),{recursive:true});await writeFile(root+name,contents);
}
console.log(`PASS: /game/ uses ${expected.length} accepted listed games; legacy hub aliases retained.`);
