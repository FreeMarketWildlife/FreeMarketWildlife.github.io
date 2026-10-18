// Observational comparison helpers. These do not establish causal effects.
export function summarizeCohort(rows) {
 const valid=rows.filter(r=>Number.isFinite(r.views)&&Number.isFinite(r.estimatedMinutesWatched));
 if(!valid.length)return {videos:0,views:null,watchMinutes:null,weightedAverageViewSeconds:null};
 const views=valid.reduce((s,r)=>s+r.views,0),minutes=valid.reduce((s,r)=>s+r.estimatedMinutesWatched,0);
 return {videos:valid.length,views,watchMinutes:minutes,weightedAverageViewSeconds:views?minutes*60/views:null};
}
export function comparable(a,b){return a.ageWindowDays===b.ageWindowDays&&a.creatorContentType===b.creatorContentType&&a.durationBand===b.durationBand;}
