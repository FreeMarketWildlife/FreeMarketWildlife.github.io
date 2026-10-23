// Local, user-triggered game-canvas exports; no screen capture or network upload.
export function installReviewExports(canvas,frameButton,clipButton){
 const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
 frameButton.onclick=()=>canvas.toBlob(blob=>{if(blob)save(blob,`treetop-review-${Date.now()}.png`);},'image/png');
 clipButton.onclick=()=>{if(!canvas.captureStream || typeof MediaRecorder==='undefined'){clipButton.textContent='Clip export unavailable';return;}
  clipButton.disabled=true;clipButton.textContent='Recording 10 seconds…';const stream=canvas.captureStream(20),chunks=[],recorder=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm'});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());save(new Blob(chunks,{type:'video/webm'}),`treetop-review-${Date.now()}.webm`);clipButton.disabled=false;clipButton.textContent='Save 10-second review clip';};recorder.start();setTimeout(()=>recorder.stop(),10000);
 };
}
