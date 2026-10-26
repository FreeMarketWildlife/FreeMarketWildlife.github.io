import {CONTACT_RULE} from './contact-rules.js';
import {loadAtlas} from './atlas.js';
import {expandContactCatalogue} from './contact-catalogue.js';
import {CONTACT_MANIFEST} from './asset-urls.js';
let atlas,manifest,entries,orchard,orchardEntries,loading,catalogueLoading;
export async function loadContactArt({catalogue=false}={}){
 if(!loading)loading=(async()=>{
  const url=new URL(CONTACT_MANIFEST,import.meta.url);
  const image=async()=>{const r=await fetch(url);if(!r.ok)throw Error('Approved B contact manifest unavailable');const m=await r.json(),img=new Image();img.src=new URL(m.image,url).href;await img.decode();return {m,img};};
  const [bank,home]=await Promise.all([image(),loadAtlas(new URL('../assets/playable/home-v2/atlas.json',import.meta.url))]);
  manifest=bank.m;atlas=bank.img;orchard=home;entries=new Map(manifest.assets.map(a=>[a.id,a]));orchardEntries=new Set(orchard.manifest.fruitContactIds);
 })().catch(error=>{loading=null;throw error;});
 await loading;
 // Source previews already have the full authored manifest. Production keeps
 // this catalogue separate so ordinary play does not download raw-tile metadata.
 if(catalogue&&!manifest.tiles){
  if(!catalogueLoading)catalogueLoading=(async()=>{const r=await fetch(new URL('../assets/playable/contact/catalogue.json',import.meta.url));if(!r.ok)throw Error('Contact catalogue unavailable');Object.assign(manifest,expandContactCatalogue(await r.json()));})().catch(error=>{catalogueLoading=null;throw error;});
  await catalogueLoading;
 }
}
export function drawContactArt(c,id,x,y){const a=entries?.get(id);if(!a)throw Error('Missing B contact assembly '+id);if(orchardEntries?.has(id.replace(/:ripe$/,'')))orchard.draw(c,id.endsWith(':ripe')?'orchard-ripe':'orchard-bare',x,y+a.offsetY);else c.drawImage(atlas,...a.rect,Math.round(x),Math.round(y+a.offsetY),a.w,a.h);return a;}
export const contactArtInfo=()=>({rule:CONTACT_RULE,assemblies:entries?.size||0});

export const contactEntry=id=>entries?.get(id);
export const contactSheet=()=>({m:manifest,img:atlas});
export const contactFrontiers=scene=>manifest?.frontiers?.[scene]||[];
