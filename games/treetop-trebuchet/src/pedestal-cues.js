/** Preparation-only attention cues. Times are active idle seconds, so pause,
 * dialogs and editing never advance a request for the player's attention. */
export function pedestalCues(idleSeconds,{available=true,reducedMotion=false}={}){
 const idle=Math.max(0,Number(idleSeconds)||0),cycle=idle%48;
 if(!available)return{bubble:false,hint:false,hintPhase:0,wave:0,hop:false};
 return{
  bubble:cycle>=8&&cycle<10.4,
  hint:cycle>=14&&cycle<18,
  hintPhase:Math.max(0,Math.min(1,(cycle-14)/4)),
  wave:reducedMotion?0:(cycle%6>=1.5&&cycle%6<3.2?Math.sin((cycle%6-1.5)/1.7*Math.PI)**2:0),
  hop:!reducedMotion&&idle>=3.5&&cycle%6>=3.5&&cycle%6<3.65,
 };
}
