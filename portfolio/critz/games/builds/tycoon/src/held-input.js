// Several keys/fingers can own the same direction. Releasing one source must
// never release another source; blur, menus and visibility clear every source.
const keyDirections=new Map(Object.entries({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}));
export const directionForKey=key=>keyDirections.get(typeof key==='string'&&key.length===1?key.toLowerCase():key)||null;
// Shift/Caps Lock can change event.key between press and release. Physical
// codes preserve ownership; normalized symbolic keys cover synthetic events.
export const keyInputSource=event=>'key:'+(event.code&&event.code!=='Unidentified'?event.code:String(event.key).toLowerCase());
export class HeldDirections extends Set {
  constructor(){super();this.sources=new Map();}
  press(source,direction){
    if(this.sources.get(source)===direction)return;
    this.sources.delete(source);this.sources.set(source,direction);this.sync();
  }
  release(source){if(this.sources.delete(source))this.sync();}
  sync(){super.clear();for(const direction of this.sources.values())super.add(direction);}
  clear(){this.sources.clear();super.clear();}
  latest(){return [...this.sources.values()].at(-1)||null;}
}
