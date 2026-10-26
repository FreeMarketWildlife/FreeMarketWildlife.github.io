// A small user-authorized discovery slice. No economy, quest or movement rules.
export const TANOSHI = Object.freeze([
  {id:'tanoshi-blush',variant:'blush',size:'tiny-blush',name:'Blush Tanoshi',personality:'Shy',scene:'bedroom',x:5,y:6,
    greeting:'A blush-colored Tanoshi peeks beside the bed. It hesitates, then offers a tiny wave.',
    revisit:'The shy Tanoshi recognizes you. A little wave, a little less hesitation.'},
  {id:'tanoshi-mint',variant:'mint',size:'small-mint',name:'Mint Tanoshi',personality:'Curious',scene:'town',x:19,y:16,
    greeting:'A mint-colored Tanoshi peers around the spring bench. It tilts its flame-shaped head, curious about you.',
    revisit:'The curious Tanoshi tilts its head again. You pause together beside the spring.'},
  {id:'tanoshi-apricot',variant:'apricot',name:'Apricot Tanoshi',personality:'Easygoing',scene:'forest',x:7,y:24,
    greeting:'An apricot-colored Tanoshi rests beside the hollow log. It gives you a slow, friendly nod.',
    revisit:'The easygoing Tanoshi seems happy with a quiet hello. The log is still its favorite seat.'},
  {id:'tanoshi-lilac',variant:'lilac',size:'large-lilac',name:'Lilac Tanoshi',personality:'Patient',scene:'yard',x:11,y:9,
    greeting:'A lilac-colored Tanoshi waits beside the garden. It takes its time, then gives you a warm little nod.',
    revisit:'The patient Tanoshi makes room for a quiet moment in the garden.'},
]);
export const foundTanoshi = state => TANOSHI.filter(t => state.tanoshiDiscoveries?.includes(t.id));
export function validTanoshiSave(state) {
  const ids=state?.tanoshiDiscoveries;
  return ids===undefined || (Array.isArray(ids) && ids.every(id=>TANOSHI.some(t=>t.id===id)) && new Set(ids).size===ids.length);
}
export function discoverTanoshi(state,id) {
  const individual=TANOSHI.find(t=>t.id===id);
  if(!individual || individual.scene!==state.scene || Math.abs(individual.x-state.player.x)+Math.abs(individual.y-state.player.y)>1) return null;
  if(state.tanoshiDiscoveries?.includes(id)) return {individual,first:false};
  (state.tanoshiDiscoveries ||= []).push(id);
  return {individual,first:true};
}
