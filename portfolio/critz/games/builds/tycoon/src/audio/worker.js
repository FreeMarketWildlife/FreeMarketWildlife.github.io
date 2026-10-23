import {decodeMidi} from './midi.js';
import {renderSequence} from './synth.js';
self.onmessage=({data})=>{
 try{const result=renderSequence(decodeMidi(data.bytes));self.postMessage({request:data.request,...result},[result.left.buffer,result.right.buffer]);}
 catch(error){self.postMessage({request:data.request,error:error.message});}
};
