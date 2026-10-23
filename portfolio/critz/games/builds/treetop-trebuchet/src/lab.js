import {workshopDefaults,workshopConfig,counterCenter} from './workshop.js?v=50-trebuchet';
import {createFlightTravelTracker} from './flight-travel.js?v=49';
import {createViewRecovery} from './view-recovery.js?v=49';
import {pickupFallback} from './pickup.js?v=49';
import {createProgressCoordinator,ProgressConflict,PROGRESS_KEY} from './progress-coordination.js?v=49';
import {readProgressBackup} from './progress-choice.js?v=49';
import {createWindingInput} from './winding-input.js?v=49';
import {createFrameClock,createRuntimeMetrics} from './runtime.js?v=49';
import {createLoadingCoach} from './loading-coach.js?v=49';
import {drawVolunteerPortrait,speciesTraits} from './species-art.js?v=49';
import {loadProgressConsent,saveProgressConsent} from './progress-preferences.js?v=49';
import {createJourneyTracker} from './journey.js?v=50-trebuchet';
import {loadAudioPreferences,saveAudioPreferences} from './audio-preferences.js?v=49';
import {STARTER_HARDWARE} from './starter.js?v=49';
import {CritterScene,gripParameters} from './articulated.js?v=50-trebuchet';
import {PhysicalHookScene} from './hook-experiment.js?v=50-trebuchet';
import {createGripController,isFlightControlKey} from './input.js?v=49';
import {createPredictionJob,capturePredictionPose,predictionPoseIsCurrent,predictionAdvice} from './prediction.js?v=49';
import {createRenderer} from './render.js?v=50-trebuchet';
import {installReviewExports} from './review.js?v=49';
import {profiles,createRig,createVolunteerQueue} from './species.js?v=49';
import {createAudio} from './audio.js?v=49';
import {catalog,createEconomyState,economyReducer,derivePhysicalConfig,shotReward} from './economy.js?v=49';
import {world as layout} from './world.js?v=49';
const $=id=>document.getElementById(id),canvas=$('view'),renderer=createRenderer(canvas);
installReviewExports(canvas,$('frameExport'),$('clipExport'));
const SceneType=()=>$('hook').checked?PhysicalHookScene:CritterScene;
$('reduced').checked=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let travelDistance=createFlightTravelTracker();
let storageBackend=null;try{storageBackend=window.localStorage;}catch{}
const audioPreferences=loadAudioPreferences(storageBackend),sound=createAudio();sound.setVolume(audioPreferences.volume);sound.setMuted(audioPreferences.muted);$('mute').checked=audioPreferences.muted;$('volume').value=audioPreferences.volume;
let economy=createEconomyState(),shotId=null,banked=false,shotCount=0,effects=[],launchStarted=null,runObstacle=null;
const progressEnabled=loadProgressConsent(storageBackend);$('save').checked=progressEnabled;
let startupWarning='',saveWarning='',coordinator=null,choiceRaw=null,saveQueue=Promise.resolve(),saveEnabled=progressEnabled,saveEpoch=0;
try{coordinator=createProgressCoordinator(storageBackend,navigator.locks);if(progressEnabled)economy=coordinator.load()??economy;}catch{startupWarning='Saved progress could not be read or storage is unavailable. Saving is off; stored data is kept. Play continues; restore a backup or choose to save this session.';saveEnabled=false;$('save').checked=false;}
if(!navigator.locks?.request){saveEnabled=false;$('save').checked=false;startupWarning='Safe saving is unavailable in this browser. Stored progress is kept; play continues in this session.';}
function showProgressConflict(){
 saveEpoch++;saveEnabled=false;$('save').checked=false;
 try{const c=coordinator.inspect(economy);choiceRaw=c.raw;$('progressChoice').hidden=false;$('restorePrevious').disabled=!c.previous;saveWarning=c.unreadable?'Stored progress is unreadable. Keep this session to preserve the original and save, or restore a backup.':`Another save is on this device (${c.previous?.points??0} points, ${c.previous?.bells??0} bells, ${c.previous?.owned.length??0} owned). This session has ${economy.points} points, ${economy.bells} bells, ${economy.owned.length} owned. Choose a version; the other is kept in a backup.`;}
 catch{saveWarning='Device storage is unavailable. Play continues; progress is session only.';}
 setText('progressStatus',saveWarning);updateBackupButton();
}
function saveProgress(){
 if(!saveEnabled)return;
 const snapshot=economy,epoch=saveEpoch;setText('progressStatus','Saving progress…');
 saveQueue=saveQueue.then(async()=>{if(!saveEnabled||epoch!==saveEpoch)return;try{await coordinator.save(snapshot,()=>saveEnabled&&epoch===saveEpoch);saveWarning='';setText('progressStatus','Progress saved on this device.');}catch(e){if(epoch!==saveEpoch)return;if(e instanceof ProgressConflict)showProgressConflict();else{saveEnabled=false;$('save').checked=false;saveWarning='Progress could not be saved. Play continues; new rewards and equipment are session only. Try Save again before leaving.';setText('progressStatus',saveWarning);}}});
}
window.addEventListener('storage',e=>{if(e.storageArea!==storageBackend)return;if(e.key===PROGRESS_KEY||e.key==='critz-prototype-progress-revision-v1'||e.key===null){try{if((saveEnabled||!$('progressChoice').hidden)&&coordinator.changed())showProgressConflict();}catch{showProgressConflict();}}else if(e.key==='critz-prototype-progress-enabled'&&e.newValue!=='1'){saveEpoch++;saveEnabled=false;$('save').checked=false;saveWarning='Saving was turned off in another tab. This session is not saved.';setText('progressStatus',saveWarning);}});
const setText=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
const equipmentNotes={'counterweight-heavy':'180 kg (starter 140 kg): more potential energy for the same drop, different balance and release timing. More weight does not guarantee more distance.','beam-long':'3.6 / 0.9 m arms, 9.9 kg beam: longer reach and changed leverage, with more mass to turn. Replaces the lighter beam.','beam-light':'3.0 / 0.8 m arms, 6.1 kg beam: less inertia than the 8.0 kg starter. Returns to starter reach; replaces the longer beam.','sling-long':'2.9 m (starter 2.5 m): changes swing timing and loading clearance. Can reduce forward speed or return the volunteer toward the rig; extra length does not guarantee distance. Compare winding and placement, or remove it for starter length.','frame-heavy':'50 kg instead of 30 kg, grip 0.65: less frame recoil; added weight can reduce range. Replaces grippier feet.','frame-grip':'Grip 0.85 instead of 0.65, 30 kg frame: resists sliding without the heavier frame. Replaces the heavier frame.'};
const seed=Date.now()>>>0,queue=createVolunteerQueue(seed);let fraction=.6,scene,preview=null,previewJob=null,previewSource=null,previewCapture=null,previewBasis=null,lastPredictionMs=0,nextStatus=0,statusPhase='',error='',accumulator=0,nextPreview=0,clock=0,held=false,journey=createJourneyTracker(),zoneNotice='',zoneNoticeUntil=0,contactNotice='',contactNoticeUntil=0;
const frameClock=createFrameClock(),runtimeMetrics=createRuntimeMetrics();let manualPaused=false,focusPaused=false,nextRuntime=0,loadingCoach=createLoadingCoach(),resizeNoticeUntil=0;const isPaused=()=>manualPaused||document.hidden||focusPaused||(banked&&scene?.phase==='flight');
let workshopChoice=null,aiming=false;
const settings=()=>{const base=derivePhysicalConfig(economy,{counterMass:Number($('mass').value),longArm:Number($('long').value),shortArm:Number($('short').value),pivotHeight:300,armDamping:Number($('friction').value),flightDrag:Number($('drag').value),initialArm:-3,mechanicalWinding:true,collisionSubsteps:true,collisionStepHz:2400,fastCollisionStepHz:4800,releaseHardware:'channel',stoppedSplitPouch:$('split').checked,...($('split').checked&&$('hook').checked?{pouchPanelMass:Number($('panelMass').value)}:{}),sling:Number($('sling').value),hookAngle:Number($('railAngle').value),channelLength:Number($('railLength').value)});return workshopChoice?workshopConfig(workshopChoice,base):{...base,counterKind:'rock'};};
function restoreStarterValues(){for(const [id,key]of Object.entries({mass:'counterMass',long:'longArm',short:'shortArm',sling:'sling',railAngle:'hookAngle',railLength:'channelLength',panelMass:'pouchPanelMass'}))$(id).value=STARTER_HARDWARE[key];}
restoreStarterValues();
let workshopWasPaused=false;
$('workshopOpen').onclick=()=>{workshopWasPaused=manualPaused;manualPaused=true;freezeInputs();const c=workshopChoice??{...workshopDefaults,counterMass:Number($('mass').value),longArm:Number($('long').value),shortArm:Number($('short').value),hookDegrees:Math.round(Number($('railAngle').value)*180/Math.PI*10)/10};for(const [id,key]of Object.entries({wsCounter:'counterKind',wsMount:'counterMount',wsHanger:'hangerLength',wsHook:'hookDegrees',wsMass:'counterMass',wsSling:'slingPieces',wsFoundation:'foundation',wsWood:'wood',wsLong:'longArm',wsShort:'shortArm'}))$(id).value=c[key];updateWorkshopFacts();setText('workshopStatus','');$('workshopDialog').showModal();};
function updateWorkshopFacts(){const a=Number($('wsLong').value),b=Number($('wsShort').value),l=2.5+Number($('wsSling').value)*.15,m=Number($('wsMass').value);$('wsHanger').disabled=$('wsMount').value!=='hinged';setText('workshopFacts',`Arm ratio ${(a/b).toFixed(2)}:1 • sling / long arm ${(l/a).toFixed(2)} • counterweight / volunteer ${(m/(scene?.rig.totalMass??1)).toFixed(0)}:1. Compare throws: extra weight or length does not guarantee more range.`);}
$('workshopForm').oninput=updateWorkshopFacts;
$('workshopClose').onclick=()=>$('workshopDialog').close();
$('workshopDialog').addEventListener('close',()=>{manualPaused=workshopWasPaused;frameClock.reset();});
$('workshopForm').onsubmit=e=>{e.preventDefault();const previous=workshopChoice;try{const c={counterKind:$('wsCounter').value,counterMount:$('wsMount').value,hangerLength:Number($('wsHanger').value),hookDegrees:Number($('wsHook').value),counterMass:Number($('wsMass').value),slingPieces:Number($('wsSling').value),foundation:Number($('wsFoundation').value),wood:$('wsWood').value,longArm:Number($('wsLong').value),shortArm:Number($('wsShort').value)};workshopConfig(c);workshopChoice=c;if(!reset())throw Error(error);$('workshopDialog').close();}catch(e){workshopChoice=previous;setText('workshopStatus',e.message);}};
$('starter').onclick=()=>{workshopChoice=null;restoreStarterValues();reset();};
$('species').innerHTML=profiles.map(p=>`<option value="${p.id}">${p.label}</option>`).join('');$('species').value=queue.current;
function clearPreview(){previewJob?.cancel();previewJob=null;previewSource=null;previewCapture=null;previewBasis=null;preview=null;}
let rosterKey='';
function updateRoster(){const ids=queue.peek(),key=ids.join(',');if(key===rosterKey)return;rosterKey=key;$('roster').replaceChildren(...ids.map((id,i)=>{const p=profiles.find(p=>p.id===id),card=document.createElement('div'),canvas=document.createElement('canvas'),label=document.createElement('span');card.className='volunteer-card';canvas.width=160;canvas.height=72;canvas.setAttribute('aria-hidden','true');label.textContent=`${i+1}. ${p.label}${id==='flying-squirrel'?' • rare':''}`;card.append(canvas,label);drawVolunteerPortrait(canvas.getContext('2d'),createRig(id),160,72);return card;}));}
function installScene(candidate){bank();travelDistance=createFlightTravelTracker();viewRecovery.reset();trigger.cancel();grip.reset();held=false;effects=[];runObstacle=null;journey=createJourneyTracker();loadingCoach=createLoadingCoach();zoneNotice='';zoneNoticeUntil=0;contactNotice='';contactNoticeUntil=0;shotId=null;banked=false;launchStarted=null;scene=candidate;fraction=.6;$('power').value=(fraction-.2)/.75;clearPreview();nextPreview=clock+.15;error='';accumulator=0;nextStatus=0;nextRuntime=0;frameClock.reset();runtimeMetrics.reset();economyUI();updateRoster();setText('speciesTrait',speciesTraits[scene.rig.id]);setText('rigFacts',`${scene.rig.label}: ${scene.rig.bodies.map(b=>`${b.id} ${(b.mass*1000).toFixed(0)} g`).join(' • ')}. Contact friction ${scene.rig.friction}; restitution ${scene.rig.restitution}. Prototype units, not biological measurements.`);}
function reset(){try{const candidate=new (SceneType())(settings(),$('species').value);installScene(candidate);return true;}catch(e){error=e.message;return false;}}
$('hook').onchange=reset;$('split').onchange=reset;
for(const id of ['species','mass','long','short','friction','drag','sling','railAngle','railLength','panelMass'])$(id).onchange=reset;
$('reset').onclick=reset;
$('next').onclick=()=>{try{const id=queue.peek()[0],candidate=new (SceneType())(settings(),id);bank();queue.consume();$('species').value=id;installScene(candidate);}catch(e){error=e.message;}};
function beginWinding(){if(isPaused())return;fraction=.2+.75*Number($('power').value);try{scene.startWinding(fraction);clearPreview();error='';const windingScene=scene;sound.unlock().then(ok=>{if(ok&&!isPaused()&&scene===windingScene&&scene.phase==='winding')sound.play('wind',{intensity:.35});});}catch(e){error=e.message;}}
let triggerCaptureTarget=$('time');
const trigger=createWindingInput({enabled:()=>!isPaused()&&!held&&scene?.phase==='loading'&&scene.isLoaded()&&scene.loadingStatus().contacting,onAim:()=>{aiming=true;sound.unlock();},onCommit:()=>{aiming=false;fire();},onCancel:()=>{aiming=false;},capture:id=>triggerCaptureTarget.setPointerCapture(id),releaseCapture:id=>{if(triggerCaptureTarget.hasPointerCapture(id))triggerCaptureTarget.releasePointerCapture(id);}});
for(const id of ['time','timeNear']){const button=$(id);button.onpointerdown=e=>{if(!trigger.active)triggerCaptureTarget=button;return trigger.pointerDown(e);};button.onpointerup=trigger.pointerUp;button.onpointercancel=trigger.pointerCancel;button.onlostpointercapture=trigger.lostPointerCapture;button.onkeydown=trigger.keyDown;button.onkeyup=trigger.keyUp;button.onclick=trigger.click;}
$('wind').onclick=beginWinding;
$('power').oninput=()=>{trigger.cancel();};$('power').onchange=()=>{if(['uncocked','loading','wind-stalled'].includes(scene.phase))beginWinding();};
$('retry').onclick=()=>{if(reset()){$('power').value=(.6-.2)/.75;beginWinding();}};
function freezeInputs(){grip.blur();trigger.cancel();if(scene)scene.control=0;accumulator=0;frameClock.reset();clearPreview();sound.pause();}
$('pause').onclick=()=>{manualPaused=!manualPaused;freezeInputs();if(!manualPaused)sound.unlock();setText('pause',manualPaused?'Resume':'Pause');setText('pauseStatus',manualPaused?'Paused. Resume when ready.':'');};
document.addEventListener('visibilitychange',()=>{freezeInputs();setText('pauseStatus',document.hidden?'Paused while this tab is hidden.':manualPaused?'Paused. Resume when ready.':'');});
const viewRecovery=createViewRecovery({reveal:()=>canvas.scrollIntoView({block:'start',behavior:'auto'})});
window.addEventListener('resize',()=>{const recover=viewRecovery.resize(grip.active);resizeNoticeUntil=recover?clock+3:0;grip.reset();trigger.cancel();if(scene)scene.control=0;clearPreview();});
$('dropGrip').onclick=()=>grip.reset();
function fire(){if(isPaused()||held||scene.phase!=='loading')return;sound.unlock();try{if(!scene.loadingStatus().contacting)throw new Error('Let the volunteer contact the cradle before unlatching');scene.unlatch();launchStarted=clock;scene.enableEncounters(seed+shotCount);shotId=`${seed}:${shotCount++}`;banked=false;clearPreview();error='';sound.play('unlatch');}catch(e){error=e.message;}}
$('launch').onclick=fire;
$('launchNear').onclick=()=>$('launch').click();
let pickupOffset={x:0,y:0};
const grip=createGripController({toPoint:e=>renderer.point(e),tapHold:()=>$('sticky').checked,
 onStart:p=>{if(isPaused())return false;sound.unlock();let grabbed=scene?.grab(p)??false;if(!grabbed){const target=pickupFallback(scene,p,renderer.cssPixelsPerMetre);if(target)grabbed=scene.grab(target);}held=grabbed;if(grabbed){pickupOffset={x:scene.hand.target.x-p.x,y:scene.hand.target.y-p.y};clearPreview();}return grabbed;},onMove:p=>scene?.move({x:p.x+pickupOffset.x,y:p.y+pickupOffset.y}),onEnd:reason=>{viewRecovery.ended(reason);held=false;pickupOffset={x:0,y:0};scene?.drop();},
 capture:id=>canvas.setPointerCapture(id),releaseCapture:id=>{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}});
canvas.onpointerdown=grip.pointerDown;canvas.onpointermove=grip.pointerMove;canvas.onpointerup=grip.pointerUp;canvas.onpointercancel=grip.pointerCancel;canvas.onlostpointercapture=grip.lostPointerCapture;
window.addEventListener('keydown',e=>{if(isFlightControlKey(e)&&scene?.phase==='flight'&&!isPaused()){e.preventDefault();scene.control=e.key==='ArrowRight'?1:-1;}});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')scene.control=0;});window.addEventListener('blur',()=>{focusPaused=true;freezeInputs();setText('pauseStatus','Paused while the game is unfocused.');});window.addEventListener('focus',()=>{focusPaused=false;frameClock.reset();setText('pauseStatus',manualPaused?'Paused. Resume when ready.':'');});
function economyUI(){
 const effective=settings();setText('shopPreview',`Next setup: ${effective.counterMass} kg counterweight • ${effective.longArm} / ${effective.shortArm} m beam (${((effective.longArm+effective.shortArm)*(effective.beamLinearDensity??8/3.8)).toFixed(1)} kg) • ${effective.sling} m sling • ${(effective.frameMass??30)} kg frame • grip ${(effective.frameFriction??.65).toFixed(2)}`);
 $('wallet').textContent=`Points ${economy.points} • Bells ${economy.bells} • prototype balance`;
 $('shop').innerHTML=catalog.map(item=>{const owned=economy.owned.includes(item.id),equipped=Object.values(economy.equipped).includes(item.id);return `<button data-item="${item.id}" ${!owned&&economy.bells<item.price?'disabled':''}>${item.label} — ${equipped?'Equipped · Remove':owned?'Owned · Equip':'Buy & equip · '+item.price+' bells'}<small>${owned?'Price '+item.price+' bells. ':''}${equipmentNotes[item.id]}${!owned&&economy.bells<item.price?' Need '+(item.price-economy.bells)+' more bells.':''}</small></button>`;}).join(' ');
 for(const button of $('shop').querySelectorAll('button'))button.onclick=()=>{sound.unlock();try{const id=button.dataset.item,item=catalog.find(item=>item.id===id);if(economy.equipped[item.slot]===id)economy=economyReducer(economy,{type:'unequip',slot:item.slot});else{if(!economy.owned.includes(id))economy=economyReducer(economy,{type:'purchase',id});economy=economyReducer(economy,{type:'equip',id});}saveProgress();economyUI();setText('shopNotice',`${item.label} ${economy.equipped[item.slot]===id?'equipped':'removed'} for the next setup. Reset or choose the next volunteer to use it.`);sound.play('shop');}catch(e){error=e.message;}};
}
function bank(){if(!shotId||banked||!scene?.release)return false;const c=scene.center(),action={type:'record-shot',shotId,distance:Math.max(0,c.x-scene.release.center.x),impacts:scene.impactCount},reward=shotReward(action);economy=economyReducer(economy,action);banked=true;scene.control=0;accumulator=0;frameClock.reset();saveProgress();economyUI();setText('shopNotice',`Collected ${reward.points} points and ${reward.bells} bells. Choose owned gear or buy an upgrade, then try the next setup.`);sound.play('coin');return true;}
$('bank').onclick=()=>{sound.unlock();if(bank()){const panel=$('shop').closest('details');panel.open=true;panel.scrollIntoView({block:'start',behavior:'auto'});}};
function rememberSound(){const status=sound.getStatus(),saved=saveAudioPreferences(storageBackend,status);setText('audioStatus',`${status.muted?'Muted':'Sound on'} • ${Math.round(status.volume*100)}% volume • ${saved?'remembered on this device':'session only'}`);}
$('mute').onchange=()=>{sound.setMuted($('mute').checked);if(!$('mute').checked)sound.unlock();rememberSound();};
$('volume').oninput=()=>{sound.setVolume(Number($('volume').value));if(!$('mute').checked)sound.unlock();rememberSound();};
setText('audioStatus',`${audioPreferences.muted?'Muted':'Sound on'} • ${Math.round(audioPreferences.volume*100)}% volume. Playback starts after interaction.`);
function updateBackupButton(){try{const candidate=readProgressBackup(storageBackend);$('restoreBackup').hidden=!candidate;if(candidate)setText('restoreBackup',`Restore backup · ${candidate.bells} bells · ${candidate.owned.length} owned`);}catch{$('restoreBackup').hidden=true;}}
let choosing=false;
async function finishProgressChoice(choice){
 if(choosing)return;choosing=true;saveEpoch++;saveEnabled=false;const current=economy,expected=choiceRaw;
 try{const selected=await coordinator.choose(current,choice,expected,()=>economy===current);if(economy!==current){showProgressConflict();return;}economy=selected;startupWarning='';saveWarning='';saveEnabled=saveProgressConsent(storageBackend,true);$('save').checked=saveEnabled;$('progressChoice').hidden=true;$('restorePrevious').disabled=false;setText('progressStatus',saveEnabled?'Progress saved. The other version stays in a backup.':'Progress saved once; saving preference could not be remembered. Play continues; enable Save to retry.');if(!saveEnabled)saveWarning='Automatic saving is off; preference could not be remembered.';economyUI();updateBackupButton();}
 catch(e){if(e instanceof ProgressConflict)showProgressConflict();else{saveEnabled=false;$('save').checked=false;saveWarning='Saving failed. Play continues; your current session and stored alternatives are kept. Try again before leaving.';setText('progressStatus',saveWarning);updateBackupButton();}}
 finally{choosing=false;}
}
$('save').onchange=()=>{if(!$('save').checked){saveEpoch++;saveEnabled=false;saveWarning='';saveProgressConsent(storageBackend,false);$('progressChoice').hidden=true;setText('progressStatus',startupWarning||'Saving off. Current session is not saved; stored progress and backup are kept.');return;}try{coordinator??=createProgressCoordinator(storageBackend,navigator.locks);const c=coordinator.inspect(economy);choiceRaw=c.raw;saveEnabled=false;if(c.conflict){$('save').checked=false;$('progressChoice').hidden=false;$('restorePrevious').disabled=!!c.unreadable;saveWarning=c.unreadable?'Stored progress is unreadable. Keep this session to preserve the original data and save it, or restore a backup.':`This session has ${economy.bells} bells; saved version has ${c.previous.bells}. Choose which to use. The other stays in a backup.`;setText('progressStatus',saveWarning);}else finishProgressChoice(c.previous?'previous':'current');}catch{saveEnabled=false;$('save').checked=false;saveWarning='Device storage is unavailable. Play continues; progress is session only.';setText('progressStatus',saveWarning);}};
$('keepCurrent').onclick=()=>finishProgressChoice('current');$('restorePrevious').onclick=()=>finishProgressChoice('previous');
$('restoreBackup').onclick=async()=>{if(choosing)return;choosing=true;saveEpoch++;const wasEnabled=saveEnabled;saveEnabled=false;const current=economy;try{const expected=coordinator.inspect(current).raw,selected=await coordinator.restore(current,expected,()=>economy===current);if(economy!==current){showProgressConflict();return;}economy=selected;saveEnabled=wasEnabled;$('save').checked=saveEnabled;startupWarning='';saveWarning='';$('progressChoice').hidden=true;economyUI();setText('shopNotice','Restored progress is shown above. Equipment applies to the next setup.');setText('progressStatus','Backup restored. Your previous session is now the backup.');updateBackupButton();}catch(e){if(e instanceof ProgressConflict)showProgressConflict();else{saveEnabled=false;$('save').checked=false;saveWarning='Backup could not be restored. Play continues; your current session is unchanged and saving is off.';setText('progressStatus',saveWarning);}}finally{choosing=false;}};
updateBackupButton();if(startupWarning)setText('progressStatus',startupWarning);
for(const [id,direction]of [['left',-1],['right',1]]){$(id).onpointerdown=e=>{if(isPaused()||scene?.phase!=='flight')return;e.preventDefault();$(id).setPointerCapture(e.pointerId);scene.control=direction;};$(id).onpointerup=$(id).onpointercancel=$(id).onlostpointercapture=()=>scene.control=0;}
economyUI();
function render(now){const frameBegan=performance.now(),samplePhase=scene?.phase,paused=isPaused(),dt=frameClock.advance(now,paused);clock+=dt;accumulator+=dt;
 try{if(scene){let steps=0;const engineBegan=performance.now();while(accumulator>=1/600){scene.step();if(scene.release&&scene.phase==='flight')travelDistance.update(scene.center().x,scene.release.center.x);accumulator-=1/600;steps++;}const engineMs=performance.now()-engineBegan;let predictionMs=0;
 const loading=scene.loadingStatus(),inContact=loading.contacting;
 const eligible=!paused&&scene.phase==='loading'&&!held&&!scene.control&&scene.isLoaded()&&inContact;
 if(!eligible){clearPreview();nextPreview=clock+.15;}
 else {
  if(preview&&!predictionPoseIsCurrent(scene,previewBasis)){preview=null;previewBasis=null;}
  if(previewJob&&previewSource!==scene)clearPreview();
  if(!previewJob&&clock>nextPreview){const cloneBegan=performance.now();previewJob=createPredictionJob(scene);previewSource=scene;previewCapture=capturePredictionPose(scene);predictionMs+=performance.now()-cloneBegan;}
  if(previewJob){const predictionBegan=performance.now();previewJob.advance({maxSteps:300,budgetMs:2.5});predictionMs+=performance.now()-predictionBegan;
   if(previewJob.done){lastPredictionMs=previewJob.stats.cpuMs;
    preview=predictionPoseIsCurrent(scene,previewCapture)?previewJob.result:null;previewBasis=preview?previewCapture:null;previewJob=null;nextPreview=clock+Math.max(.6,lastPredictionMs/1000*8);
   }
  }
 }
 $('launch').disabled=paused||scene.phase!=='loading'||held||!scene.isLoaded()||!inContact;$('launchNear').hidden=!['loading','launching'].includes(scene.phase);$('launchNear').disabled=$('launch').disabled;for(const id of ['left','right'])$(id).hidden=scene.phase!=='flight';$('time').disabled=$('launch').disabled;$('wind').disabled=paused||held||!['uncocked','loading','wind-stalled'].includes(scene.phase);$('power').disabled=$('wind').disabled;$('time').textContent=aiming?'Release to launch':'Hold to aim; release to launch';
 const c=scene.center(),release=scene.release?.center;
 $('dropGrip').hidden=!held;setText('gripStatus',held?(scene.forceCapped?'Grip stretched — move gently, then let go.':'Grip held — move above the cradle, then let go.'):clock<resizeNoticeUntil?'View resized; grip released. Re-grip the volunteer to continue.':'');
 const hints=[];if(scene.phase==='dead')hints.push('The critter died in deep space. Collect rewards, then choose the next volunteer.');if(startupWarning)hints.push(startupWarning);if(saveWarning)hints.push(saveWarning);if(clock<resizeNoticeUntil)hints.push('View resized; grip released. Re-grip the volunteer to continue.');const travel=journey.update(scene.phase,c.y);if(travel.changed){zoneNotice=`Entering ${travel.biome.label}`;zoneNoticeUntil=clock+2.5;if(travel.firstVisit)sound.play('zone',{biome:travel.biome.id});}if(clock<zoneNoticeUntil)hints.push(zoneNotice+'.');if(clock<contactNoticeUntil)hints.push(contactNotice+'.');
 if(scene.phase==='uncocked')hints.push('Choose a height and press Wind counterweight, then lift beside the green cradle before moving across above it.');
 $('bank').disabled=!scene.release||banked;const potential=scene.release&&!banked?shotReward({distance:Math.max(0,c.x-release.x),impacts:scene.impactCount}):null;setText('bank',banked?'Rewards collected':potential?`Collect ${potential.bells} bells`:'Collect rewards');$('bank').title=potential?`${potential.points} points and ${potential.bells} bells earned`:'Collect earned points and bells';$('pause').disabled=banked;for(const id of ['left','right'])$(id).disabled=paused||scene.phase!=='flight';setText('pauseStatus',banked?'Run complete. Rewards collected; choose the next volunteer or retry.':document.hidden?'Paused while this tab is hidden.':focusPaused?'Paused while the game is unfocused.':manualPaused?'Paused. Resume when ready.':'');
 setText('reset',scene.release?'Collect & retry setup':'Reset setup');
 if(!banked&&scene.phase==='flight'&&renderer.approachNotice)hints.push(renderer.approachNotice);
 if(banked)hints.push('Rewards collected. Shop, choose the next volunteer or retry.');
 if(runObstacle==='launch branch')hints.push('The volunteer hit the launch branch. Collect & retry keeps this run’s rewards; adjust the load or hardware before another shot.');
 if(scene.phase==='launching'&&launchStarted!==null&&clock-launchStarted>5)hints.push('Payload is still supported. Reset and try different rail mounting, sling length or counterweight.');
 $('preparation').hidden=!['uncocked','winding','loading','wind-stalled'].includes(scene.phase);$('timeNear').disabled=$('time').disabled;setText('timeNear',$('time').textContent);$('powerNear').value=Number($('power').value);
 const coaching=loadingCoach.update(scene,{fraction,held});setText('preparationStatus',scene.phase==='uncocked'?'Press Wind counterweight above. Load the cradle before holding Aim.':scene.phase==='winding'?'The motor is winding. Wait for the cradle to become available.':coaching.reason);$('retry').hidden=!coaching.retry||paused;if(coaching.reason)hints.push(coaching.reason);
 if(scene.phase==='loading'){
  if(held&&scene.hand?.body.getUserData()?.id==='head'&&scene.rig.bodies.some(b=>b.id==='torso'))hints.push('Head grip: try the torso for steadier loading.');
  if(held&&scene.rig.totalMass>=2)hints.push('Heavy load: move slowly.');
  const advice=predictionAdvice(preview);if(advice)hints.push(advice);else if(previewJob)hints.push('Updating the short physical hint…');
 }
 if(held&&scene.forceCapped)hints.push('Grip force limit reached. Move more gently.');
 setText('guidance',hints.join(' '));
 for(const event of scene.events.splice(0)){if(event.type==='impact'){runObstacle??=event.surface??null;if(event.encounter){contactNotice=event.encounter;contactNoticeUntil=clock+.9;}sound.play('impact',{intensity:Math.min(1,event.strength/5),material:event.material,mass:event.mass});if(!$('reduced').checked)effects.push({x:event.position.x,y:event.position.y,life:.4,material:event.material,strength:Math.min(1,event.strength/Math.max(.1,scene.rig.totalMass*10))});}else if(event.type==='launch')sound.play('launch');else if(event.type==='enemy')sound.play('enemy',{intensity:.3});}
 effects=effects.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0).slice(-20);
 if(clock>=nextStatus||statusPhase!==scene.phase){const audio=sound.getStatus();setText('audioEngine',audio.muted?'Audio muted; no cues are being scheduled.':audio.contextState==='running'?`Audio active • recent cue: ${audio.lastCue??'none'}`:'Audio waiting for an interaction.');nextStatus=clock+.25;statusPhase=scene.phase;
 setText('readout',error||`${scene.rig.label} • ${({uncocked:'Ready to wind',winding:'Winding',loading:'Load the cradle',launching:'Arm moving',flight:'In flight','wind-stalled':'Winding stalled'})[scene.phase]??scene.phase} • ${release?Math.max(0,c.x-release.x).toFixed(0)+' m • '+scene.impactCount+' bounces • '+(Math.atan2(release.vy,release.vx)*180/Math.PI).toFixed(1)+'° / '+Math.hypot(release.vx,release.vy).toFixed(1)+' m/s':'Counterweight '+(counterCenter(scene).y-scene.arm.getPosition().y).toFixed(2)+' m relative to axle'}`);
 setText('mechanicsReadout',`${scene.rig.label} • ${scene.phase} • ${release?(Math.atan2(release.vy,release.vx)*180/Math.PI).toFixed(1)+'° / '+Math.hypot(release.vx,release.vy).toFixed(2)+' m/s • ':''}hand work ${scene.handWork.toFixed(2)} J • arcade work ${scene.assistWork.toFixed(2)} J${scene.forceCapped?' ('+gripParameters(scene.rig.totalMass).maxForce.toFixed(0)+' N cap)':''} • motor net work ${scene.windingWork.toFixed(1)} J • counterweight height ${(counterCenter(scene).y-scene.arm.getPosition().y).toFixed(2)} m relative to pivot • frame x ${scene.frame.getPosition().x.toFixed(3)} m • queue seed ${seed}`);
 if(scene.release){const t=travelDistance.snapshot();$('mechanicsReadout').textContent+=` • travel forward ${t.forward.toFixed(2)} m / leftward ${t.backward.toFixed(2)} m (session observation)`;}
 setText('queue',`Next 3: ${queue.peek().map(id=>profiles.find(p=>p.id===id).label).join(' → ')}`);
 }
 const drawBegan=performance.now();renderer.draw(scene,preview,effects,clock,$('reduced').checked,window.innerWidth,window.innerHeight,clock<contactNoticeUntil?contactNotice:'');const drawMs=performance.now()-drawBegan;
 if(paused)runtimeMetrics.pause();else runtimeMetrics.record(performance.now()-frameBegan,{frameTime:now,phase:samplePhase,engineMs,predictionMs,drawMs,steps});if(clock>=nextRuntime){nextRuntime=clock+1;const stats=runtimeMetrics.snapshot();setText('runtimeReadout',`Simulation ${scene.elapsed.toFixed(2)} s • ${scene.world.getBodyCount()} bodies / ${scene.world.getJointCount()} joints • ${scene.enemies.size} encounters • ${sound.getStatus().voices} audio voices • frame CPU p95/max ${stats.p95.toFixed(2)}/${stats.max.toFixed(2)} ms • engine ${stats.engine.p95.toFixed(2)} / hint ${stats.prediction.p95.toFixed(2)} / draw ${stats.draw.p95.toFixed(2)} ms p95 • RAF interval p95/max ${stats.interval.p95.toFixed(2)}/${stats.interval.max.toFixed(2)} ms • max ${stats.maxSteps} steps/frame (last ${stats.samples} frames)${performance.memory?` • JS heap ${(performance.memory.usedJSHeapSize/1048576).toFixed(1)} MB (browser estimate)`:''}`);}
 }}catch(e){error=e.message;$('readout').textContent=error;}
 requestAnimationFrame(render);
}
reset();requestAnimationFrame(render);
