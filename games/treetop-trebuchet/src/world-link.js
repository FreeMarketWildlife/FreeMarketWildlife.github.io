import {decodeMapLink} from './map-link-codec.js?v=71';
/** Player-readable snapshots use only world data. No author UI, stylesheet or
 * second game is imported. Applying/restoring a snapshot never saves it. */
export function createWorldLinkLoader(world,{decode=decodeMapLink,canApply=()=>true}={}){
 let generation=0,local=null,activeToken=null;
 const result=extra=>({map:world.map,revision:world.revision,readOnly:world.readOnly,...extra});
 return Object.freeze({
  async load(hash=''){
   const request=++generation,token=new URLSearchParams(String(hash).replace(/^#/,'')).get('map');
   if(!token){
    if(!activeToken||!local)return result({changed:false});
    if(await canApply({map:local.map,restoring:true})===false)return result({changed:false,blocked:true});
    if(request!==generation)return result({changed:false,stale:true});
    const before=world.revision;world.replace(local.map,{readOnly:local.readOnly,dirty:local.dirty});local=null;activeToken=null;return result({changed:before!==world.revision,restored:true});
   }
   if(token===activeToken)return result({changed:false});
   let map;try{map=await decode(token);}catch(error){if(request!==generation)return result({changed:false,stale:true});throw error;}
   if(request!==generation)return result({changed:false,stale:true});
   if(await canApply({map,restoring:false})===false)return result({changed:false,blocked:true});
   if(request!==generation)return result({changed:false,stale:true});
   // world.replace validates again even when a caller supplies a custom decoder.
   // Capture local state only after validation succeeds, keeping failed links
   // from becoming the restore point for another successful navigation.
   const before=world.revision,previous={map:world.map,readOnly:world.readOnly,dirty:world.dirty};
   world.replace(map,{readOnly:true,dirty:false});if(!activeToken)local=previous;activeToken=token;return result({changed:before!==world.revision,selected:true});
  },
  adoptCurrent(){generation++;local=null;activeToken=null;},
  cancel(){generation++;},get active(){return activeToken!==null;}
 });
}
