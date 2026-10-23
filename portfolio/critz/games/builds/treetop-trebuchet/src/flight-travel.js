/** Observe real displacement only; useful for future backward-travel achievements. */
export function createFlightTravelTracker(saved=null){let state=saved?{...saved}:{lastX:null,forward:0,backward:0};
 if(!state||!(state.lastX===null||Number.isFinite(state.lastX))||![state.forward,state.backward].every(n=>Number.isFinite(n)&&n>=0))throw Error('Invalid travel snapshot');
 return {update(x,releaseX){if(![x,releaseX].every(Number.isFinite))throw Error('Finite travel coordinates required');const dx=x-(state.lastX??releaseX);state.forward+=Math.max(0,dx);state.backward+=Math.max(0,-dx);state.lastX=x;return {...state,net:x-releaseX};},snapshot(){return {...state};}};
}
