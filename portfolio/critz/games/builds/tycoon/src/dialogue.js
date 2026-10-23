import {TICK_SECONDS} from './movement.js';
// Emerald FAST is delay 1, decremented to zero by AddTextPrinter. Ordinary
// glyphs then print once per source tick. No punctuation waits or slow option.
export const FAST_TEXT_SECONDS=TICK_SECONDS;
const graphemes=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(v=>v.segment):Array.from(text);
export function createPrinter(text){return {glyphs:graphemes(text),count:0,elapsed:0};}
export function advancePrinter(p,dt){p.elapsed+=Math.max(0,dt);const n=Math.floor((p.elapsed+1e-9)/FAST_TEXT_SECONDS);p.elapsed-=n*FAST_TEXT_SECONDS;p.count=Math.min(p.glyphs.length,p.count+n);return printerText(p);}
export const printerText=p=>p.glyphs.slice(0,p.count).join('');
export const printerComplete=p=>p.count>=p.glyphs.length;
export function finishPrinter(p){p.count=p.glyphs.length;return printerText(p);}
export function paginate(text,measure,width,maxLines=2){
 const lines=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  if(measure(line?`${line} ${word}`:word)<=width){line=line?`${line} ${word}`:word;continue;}
  if(line){lines.push(line);line='';}
  for(const glyph of graphemes(word)){if(line&&measure(line+glyph)>width){lines.push(line);line='';}line+=glyph;}
 }
 if(line)lines.push(line);const pages=[];for(let i=0;i<lines.length;i+=maxLines)pages.push(lines.slice(i,i+maxLines).join('\n'));return pages.length?pages:[''];
}
