/** Tab/manual pause discards wall-clock gaps; no catch-up impulse or timer jump. */
export function createFrameClock(){let last=null;return {reset(){last=null;},advance(now,paused=false){if(!Number.isFinite(now))throw new Error('Finite frame time required');const dt=paused||last===null?0:Math.max(0,Math.min(.05,(now-last)/1000));last=now;return dt;}};}
/** Bounded, phase-labelled work and RAF intervals. Intervals include host scheduling. */
export function createRuntimeMetrics(capacity=240){
 const samples=[];let previous=null;
 const stats=values=>{const sorted=values.sort((a,b)=>a-b);return {samples:sorted.length,p95:sorted[Math.floor(sorted.length*.95)]??0,max:sorted.at(-1)??0};};
 return {
  record(ms,detail={}){if(!Number.isFinite(ms)||ms<0)return;const time=detail.frameTime,interval=Number.isFinite(time)&&previous!==null&&time>=previous?time-previous:null;previous=Number.isFinite(time)?time:null;
   samples.push({ms,interval,phase:detail.phase??'unknown',engineMs:detail.engineMs??0,predictionMs:detail.predictionMs??0,drawMs:detail.drawMs??0,steps:detail.steps??0});if(samples.length>capacity)samples.shift();
  },
  pause(){previous=null;},
  snapshot(){return {...stats(samples.map(s=>s.ms)),interval:stats(samples.filter(s=>s.interval!==null).map(s=>s.interval)),engine:stats(samples.map(s=>s.engineMs)),prediction:stats(samples.map(s=>s.predictionMs)),draw:stats(samples.map(s=>s.drawMs)),maxSteps:Math.max(0,...samples.map(s=>s.steps)),phases:Object.fromEntries([...new Set(samples.map(s=>s.phase))].map(phase=>[phase,stats(samples.filter(s=>s.phase===phase).map(s=>s.ms))]))};},
  reset(){samples.length=0;previous=null;}
 };
}
