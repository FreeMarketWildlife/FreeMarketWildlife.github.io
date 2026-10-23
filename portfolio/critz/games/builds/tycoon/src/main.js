import {initialState as greenhouseInitial,normalize as normalizeGreenhouse} from '../art-review/greenhouse-state.js';
import {ensureDayClock,advanceDayClock,endDay,paintClock} from './day-clock.js';
import {MusicDirector} from './audio/director.js';
import {harvestFruit,cueFruitShake,fruitTreeView} from './fruit-trees.js';
import {TANOSHI,discoverTanoshi,foundTanoshi} from './tanoshi.js';
import {createPrinter,advancePrinter,printerComplete,finishPrinter,paginate} from './dialogue.js';
import {worldViewport} from './world-space.js';
import {readSettings,writeSettings,FRAME_STYLES} from './ui-settings.js';
import {initializeActors,updateActors,facePlayer,releaseActors,cueActor,actorDebug} from './actors.js';
import {approachesDoor} from './lighting.js';
import {CRITTERS,HABITATS} from './living-art.js';
import {
  createState,
  startMorning,
  rescue,
  rescueInfo,
  manage,
  tick,
  scorePost,
  publish,
  save,
  load,
  spend,
  dollars,
  conditions,
  objective,
  HOUR_SECONDS,
} from "./state.js";
import {
  scenes,
  getEntities,
  nearestEntity,
  transition,
  isBlocked,
  fenceCrossing,
  canStep,
} from "./world.js";
import { renderTank, renderSpecimen } from "./tank-render.js";
import { initWorldArt, renderWorld, character } from "./render.js";
import { migrateGridState } from "./grid-save.js";
import { createMotion, getMotionView, advanceMotion, createMotionClock, advanceMotionClock, resetMotionClock } from "./movement.js";
import {HeldDirections,directionForKey,keyInputSource} from './held-input.js';
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let loaded = load(),
  state = migrateGridState(loaded.state || createState()),
  panelName = "",
  dialogue = null,
  dialogueDone = null;
ensureDayClock(state);
if (loaded.state) loaded.state = state;
let motion = createMotion(state.player), motionClock = createMotionClock(), pendingInteract = false;
function syncMotion() {
  if (motion.player !== state.player) {
    motion = createMotion(state.player);
    resetMotionClock(motionClock);
    pendingInteract = false;
  }
}
let gender = "boy",
  running = false,
  moving = false,
  transitioning = false,
  simAccumulator = 0,
  lastTime = performance.now(),
  visualTime = 0,
  pageActive = true,
  artworkReady = false,
  capture = null,
  recording = 0;
let camera = { kind: "photo", frame: 50, zoom: 1 },
  down = new HeldDirections(),
  lastSaved = 0;
const settings=readSettings({getItem:key=>localStorage.getItem(key)},matchMedia('(prefers-reduced-motion: reduce)').matches);
function applySettings(){document.documentElement.dataset.frame=settings.frame;document.documentElement.dataset.calm=String(settings.calm);}
applySettings();
const music=new MusicDirector({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},onChange:updateMusicOptions});
function updateMusicOptions(){
 const m=music.snapshot(),toggle=document.querySelector('[data-action="music-toggle"]'),volume=$('music-volume'),label=$('music-status');
 if(toggle){toggle.innerHTML=`Music <span>◀ ${m.enabled?'ON':'OFF'} ▶</span>`;toggle.setAttribute('aria-pressed',String(m.enabled));}
 if(volume){volume.value=Math.round(m.volume*100);$('music-volume-value').textContent=`${Math.round(m.volume*100)}%`;}
 if(label)label.textContent=m.error||(!m.enabled?'Music is off.':!m.volume?'Music volume is zero.':m.title?`Playing: ${m.title}`:'Music starts after a tap or keypress.');
}
const unlockMusic=()=>{void music.unlock();};
document.addEventListener('pointerdown',unlockMusic,{capture:true,passive:true});
document.addEventListener('keydown',unlockMusic,{capture:true});
document.addEventListener('click',unlockMusic,{capture:true});
document.addEventListener('touchend',unlockMusic,{capture:true,passive:true});
let printer=null,dialoguePages=[],dialogueSpeaker='',optionPrinter=null,startCursor='notebook',panelOrigin='',talkingTo=null;
const textMeasure=document.createElement('canvas').getContext('2d');
const canvas = $("world"),
  panel = $("panel"),
  overlay = $("overlay");
const button = (action, label, cls = "primary full", extra = "") =>
  `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
let saveError = '';
// Feedback belongs to the menu the player opened, never a floating world tip.
function reportStatus(message) {
  if (!message) return;
  $('game-status').textContent = message;
  const status = $('panel-status');
  if (status && panelName) { status.textContent = saveError || message; status.hidden = false; }
}
function persist(quiet = true) {
  const ok = save(state);
  saveError = ok ? '' : 'Could not save on this browser. Free storage or enable local storage.';
  if (saveError) reportStatus(saveError);
  else if (!quiet) reportStatus('Progress saved on this device.');
  return ok;
}
function fitWorld() {
  const viewport = $('viewport');
  const {width, height} = viewport.getBoundingClientRect();
  const field=worldViewport(width,height,settings.worldZoom);
  if(!field)return;
  const {width:w,height:h,scale}=field;
  if(canvas.width!==w)canvas.width=w;
  if(canvas.height!==h)canvas.height=h;
  canvas.style.width=`${w*scale}px`;
  canvas.style.height=`${h*scale}px`;
}
function fitOverlay() {
  const controls = $("controller").getBoundingClientRect();
  overlay.style.setProperty("--menu-top", `${Math.max(12,Math.min(72,$("viewport").getBoundingClientRect().top))}px`);
  if (innerWidth > innerHeight && innerHeight < 600) {
    overlay.style.bottom = "0px";
    overlay.style.right = `${Math.max(202, innerWidth - controls.left + 6)}px`;
  } else {
    overlay.style.right = "0px";
    overlay.style.bottom = `${Math.max(8, innerHeight - controls.top + 3)}px`;
  }
}
function showPanel(
  name,
  title,
  html,
  { back = true, eyebrow = "", keep = false } = {},
) {
  if (name !== "view") recording = 0;
  const scroll = keep ? panel.scrollTop : 0;
  if(name!==panelName)panelOrigin=['pause','title'].includes(panelName)?panelName:'';
  panelName = name;
  overlay.dataset.panel=name;
  panel.dataset.panel=name;
  down.clear();
  pendingInteract = false;
  resetMotionClock(motionClock);
  overlay.hidden = false;
  fitOverlay();
  panel.innerHTML = `${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}<div class="panel-heading"><h2 id="panel-title">${title}</h2>${back ? button("back", "×", "close", 'aria-label="Close or go back"') : ""}</div>${html}<p id="panel-status" class="notice" role="status" ${saveError ? "" : "hidden"}>${esc(saveError)}</p>`;
  panel.scrollTop = scroll;
  {
    const first = name==='pause'?panel.querySelector(`[data-action="${startCursor}"]`):panel.querySelector("input,button:not(.close)");
    if (first && !keep) first.focus({ preventScroll: true });
  }
}
function closePanel() {
  panelName = "";
  overlay.hidden = true;
  down.clear();
  recording = 0;
  capture = null;
  releaseActors(state);

}
function titleScreen() {
  showPanel(
    "title",
    "A little world, alive.",
    `<p>Some beginnings are small enough to fit in a glass tank.</p><canvas id="welcome-tank" class="welcome-art" width="384" height="288"></canvas>${loaded.state ? button("continue", `Continue ${esc(loaded.state.hero)}’s story`) : ""}${button("new", loaded.state ? "New story" : "Begin your story", loaded.state ? "secondary full" : "primary full")}${button("options", "Options", "secondary full")}<p class="hint">A cozy ecosystem RPG · original playable chapter<br>Touch controls or keyboard. Progress stays on this browser.</p>${loaded.recovered ? '<div class="notice">Your previous backup was recovered. You can continue safely.</div>' : ""}${loaded.damaged ? '<div class="notice">The saved file could not be read. Start a new story to recover.</div>' : ""}`,
    { back: false, eyebrow: "CRITZ: TYCOON / CHAPTER 01" },
  );
}
function setup() {
  gender = "boy";
  showPanel(
    "setup",
    "Who’s moving in?",
    `<p>You’re ten. You love tiny creatures. This is your story.</p><div class="choices"><button class="choice selected" data-action="boy" aria-pressed="true"><canvas id="boy-preview" class="hero-preview" width="32" height="64"></canvas>Boy</button><button class="choice" data-action="girl" aria-pressed="false"><canvas id="girl-preview" class="hero-preview" width="32" height="64"></canvas>Girl</button></div><label class="field-label" for="hero-name">Your name</label><input id="hero-name" type="text" placeholder="e.g. Ari" maxlength="16" autocomplete="off"><label class="field-label" for="rival-name">Your rival’s name <span id="rival-gender">(girl)</span></label><input id="rival-name" type="text" placeholder="e.g. Rowan" maxlength="16" autocomplete="off">${button("begin", "Let’s go to Rootport →")}<p class="hint">Opening: a difficult night at home. Every animal survives.</p>`,
    { back: false, eyebrow: "A NEW BEGINNING" },
  );
  for (const g of ["boy", "girl"]) {
    const c = $(g + "-preview").getContext("2d");
    character(c, 16, 64, { gender: g });
  }
}
function say(lines, done) {
  down.clear();
  dialogue = lines.map(l => typeof l === 'string' ? ['',l] : l);
  dialogueDone = done;
  printer=null;dialoguePages=[];
  nextDialogue();
}
function showDialoguePage(){
  const text=dialoguePages.shift();printer=createPrinter(text);
  $('speaker').textContent=dialogueSpeaker||'ROOTPORT';
  $('dialogue-text').textContent='';
  $('dialogue-accessible').textContent=`${dialogueSpeaker?dialogueSpeaker+': ':''}${text}`;
  $('dialogue').dataset.typing='true';
  $('dialogue-next').setAttribute('aria-label','Finish current message');
}
function nextDialogue() {
  if(!dialogue)return;
  if(printer&&!printerComplete(printer)){$('dialogue-text').textContent=finishPrinter(printer);updateDialoguePrompt();return;}
  if(dialoguePages.length){showDialoguePage();return;}
  if(!dialogue.length){
    dialogue=null;printer=null;$('dialogue').hidden=true;talkingTo=null;releaseActors(state);
    const cb=dialogueDone;dialogueDone=null;if(cb)cb();return;
  }
  const [speaker,body,beat,acting]=dialogue.shift();
  if(beat)state.storyBeat=beat;
  dialogueSpeaker=speaker;
  $('dialogue').hidden=false;
  const style=getComputedStyle($('dialogue-text'));textMeasure.font=style.font;
  dialoguePages=paginate(body,text=>textMeasure.measureText(text).width,Math.max(140,$('dialogue-text').clientWidth),2);
  const id=speaker===state.hero?'hero':speaker==='Mom'?'mom':speaker==='Kaid'?'kaid':speaker===state.rival?'rival':speaker==='Professor Nugget'?'nugget':talkingTo;
  if(id){facePlayer(state,id);if(acting)cueActor(state,id,acting);else if(body.includes('?'))cueActor(state,id,{mark:'?',look:true});else if(/Found you!|There you are!|early birthday|good news/i.test(body))cueActor(state,id,{mark:'!',hop:true});}
  if(beat==='broken')cueActor(state,'hero',{mark:'!',look:true});
  showDialoguePage();
}
function updateDialoguePrompt(){if(!printer)return;const done=printerComplete(printer);$('dialogue').dataset.typing=String(!done);$('dialogue-next').innerHTML=done?'A <span>Next</span> <i class="continue-arrow">▼</i>':'A <span>Show all</span>';$('dialogue-next').setAttribute('aria-label',done?'Continue dialogue':'Finish current message');}
function updateText(dt){if(printer){$('dialogue-text').textContent=advancePrinter(printer,dt);updateDialoguePrompt();}if(optionPrinter&&$('text-sample'))$('text-sample').textContent=advancePrinter(optionPrinter,dt);}
function opening() {
  say([
    [state.hero, "Just one more cricket, Pebble. Then we both have to sleep."],
    ["", "Walk with the D-pad. Press A when you’re near Pebble’s tank."],
  ]);
}
function openingIncident() {
  say(
    [
      [state.hero, "There you go. The mighty hunter strikes again.", "feeding"],
      [
        "Mom",
        `${state.hero}? I… I can’t get everything to quiet down tonight.`,
        "mom",
      ],
      [state.hero, "Mom? Please be careful—"],
      [
        "",
        "Mom bursts into the room. In the middle of her distress, she knocks the tanks from their stands.",
        "broken",
      ],
      [
        "",
        "Glass scatters. Tiny feet dart for cover. Every animal gets away safely.",
      ],
      [
        "Mom",
        "Oh, sweetheart. I’m so sorry. Step back from the glass. I’ll clean it up.",
      ],
      [state.hero, "I know you didn’t want this. I just… need to find them."],
      ["Kaid", "I heard the crash. What happened? Are you okay?", "kaid"],
      [state.hero, "I am. The tanks aren’t. Everybody’s hiding somewhere."],
      [
        "Kaid",
        "Then we’ll find everybody. First: early birthday delivery! Twenty-five gallons of possibilities.",
      ],
      [
        "Kaid",
        "Aunt Ember made the glass at Glow n’ Blow. I picked the corners. Rounded. Very important.",
      ],
      [
        "Kaid",
        "I can also lend you $100 from my savings. No interest. You decide when to pay it back.",
      ],
    ],
    () => loan(),
  );
}
function loan() {
  showPanel(
    "loan",
    "A little help from Kaid",
    `<p>The <b>25-gallon tank is a gift</b> either way. You have ${dollars(state.money)} and a small starter kit.</p><div class="notice">“Friends don’t come with repayment timers.” — Kaid</div>${button("accept-loan", "Accept the $100 loan")}${button("decline-loan", "Decline · start with $12", "secondary full")}<p class="hint">Optional, interest-free. Repay any time you can afford it. Declining means a slower start.</p>`,
    { back: false, eyebrow: "AN EARLY BIRTHDAY PRESENT" },
  );
}
function finishNight(accept) {
  startMorning(state, accept);
  delete state.storyBeat;
  closePanel();
  persist();

  say(
    [
      [
        "",
        "Later, the glass is cleared away. Kaid’s new tank rests safely on its stand. The house grows quiet.",
      ],
      ["", "The next morning…"],
      [
        "Mom",
        "I’m sorry about last night. I love you. I’m getting help, and I’ll help with the search.",
      ],
      [
        "Kaid",
        "Look behind the fern, by the books, and out in the yard. I saw something tiny under that old log.",
      ],
      [
        "",
        "Your starter kit has moss and leaf litter. Tap Start for the notebook, town guide, and saving.",
      ],
    ],
    () => announce("A new morning · Rootport"),
  );
}
function announce(label) { $('game-status').textContent = label; }
function travel(entity) {
  if (transitioning) return;
  transitioning = true;
  down.clear();
  $("fade").classList.add("on");
  setTimeout(() => {
    transition(state, entity);

    persist();
    announce(scenes[state.scene].name);
    $("fade").classList.remove("on");
    transitioning = false;
  }, 160);
}
function interact() {
  if (transitioning) return;
  if (dialogue) {
    nextDialogue();
    return;
  }
  if (panelName) {
    confirmPanel();
    return;
  }
  syncMotion();
  if (!getMotionView(motion).settled) {
    down.clear();
    pendingInteract = true;
    return;
  }
  const e = nearestEntity(state);
  if (!e) {
    return;
  }
  if(e.type==='greenhouse'){openGreenhouse();return;}
  if(e.type==='tanoshi'){
    const result=discoverTanoshi(state,e.id);
    if(!result)return;
    const saved=!result.first||persist();
    say([[result.first?'Found a Tanoshi!':e.name,result.first?e.greeting:e.revisit],['',result.first?(saved?'Tanoshi are a type of yokai. This hello is saved in your Notebook.':'Your Notebook remembers this hello for now. Saving failed; open Start to try again.'):'A familiar little hello.']]);
    return;
  }
  if(e.type==='fruitTree'){
    if(fruitTreeView(state,e.id,visualTime).active)return;
    const result=harvestFruit(state,e.id);
    if(result.reason==='distance')return;
    state.player.facing=e.x>state.player.x?'right':e.x<state.player.x?'left':e.y>state.player.y?'down':'up';
    cueFruitShake(state,e.id,visualTime,result.ok,settings.calm);
    if(result.ok){if(persist())reportStatus(`+${result.count} apples · Collected in your Bag!`);}
    else reportStatus(result.reason==='full'?'Your apple pouch is full.':`No ripe apples yet. More in ${Math.ceil(result.remaining)} habitat hours.`);
    return;
  }
  if(e.type==='npc'){talkingTo=e.id;facePlayer(state,e.id);cueActor(state,e.id,{mark:e.id==='rival'?'?':'!'});}
  if (e.type === "door") {
    travel(e);
    return;
  }
  if (e.text) { say([[e.name,e.text]]); return; }
  if (e.type === "rescue") {
    if (rescue(state, e.id)) {
      const isSmall = ["isopods", "springtails"].includes(e.id);
      say(
        [
          [state.hero, `Found you! ${rescueInfo[e.id].name} — safe and sound.`],
          [
            "",
            isSmall
              ? "You settle them into Little Root’s damp leaf litter. They begin exploring their new home."
              : "Mom calls the Vet. A safe temporary care box is ready; you can visit any time.",
          ],
          [
            "",
            `${state.flags.rescued.length} of 4 animal groups are safe.${state.flags.rescued.length === 4 ? " Professor Nugget should hear the good news." : ""}`,
          ],
        ],
        () => {
          persist();
        },
      );
    }
    return;
  }
  switch (e.id) {
    case "tank":
      state.stage === "night" ? openingIncident() : tankMenu();
      break;
    case "sleep":
      state.stage === "night"
        ? say([[state.hero, "Pebble gets dinner first."]])
        : showPanel(
            "sleep",
            "Sleep until morning?",
            `<p>Wake up in bed at 6:00am. Your animals keep living while you rest. Check food and moisture first.</p>${button("rest", "Sleep · until 6:00am")}${button("back", "Stay awake", "secondary full")}`,
          );
      break;
    case "desk":
      notebook();
      break;
    case "mom": {
      const lines = [
        [
          "Mom",
          `Morning, ${state.hero}. Whatever today brings, I’m glad we get to start it together.`,
        ],
      ];
      if (state.inventory.medicine) {
        state.inventory.medicine--;
        state.flags.medicineDelivered = true;
        lines.push([
          "Mom",
          "Thank you for picking up my prescription. The pharmacist and I have a plan. You don’t have to manage this alone.",
        ]);
        persist();
      } else
        lines.push([
          "Mom",
          "I’m arranging support for my treatment. In this chapter, there’s no weekly prescription deadline. Go enjoy your little world.",
        ]);
      say(lines);
      break;
    }
    case "nugget":
      meetNugget();
      break;
    case "kaid":
      kaidMenu();
      break;
    case "rival":
      state.flags.metRival = true;
      persist();
      say([
        [
          state.rival,
          "I spent all morning getting the perfect reflection in my tank photo. All morning!",
        ],
        [state.hero, "Did the animals mind?"],
        [
          state.rival,
          "They kept moving. Which… actually made the video better.",
        ],
        [
          state.rival,
          "Mom and Dad helped set up my lights. Come over sometime. And post something — I want to see your tank.",
        ],
      ]);
      break;
    case "rivalMom":
      say([
        [
          "Rival’s mom",
          `${state.rival} is out comparing camera angles again. We help with the tanks, but the patience is all theirs.`,
        ],
      ]);
      break;
    case "rivalDad":
      say([
        [
          "Rival’s dad",
          "A stable stand and a good routine. Those are my contributions. The tiny jungle is our kid’s work.",
        ],
      ]);
      break;
    case "forage":
      if (state.time - (state.flags.lastForage ?? -10) < 6) {
        reportStatus(
          "Let the yard rest. More litter will be ready in 6 habitat hours.",
        );
      } else {
        state.inventory.litter += 2;
        state.flags.lastForage = state.time;
        persist();
        reportStatus("Collected 2 portions of clean leaf litter.");
      }
      break;
    case "townSign":
      directory();
      break;
    default:
      if (e.id.startsWith("shop-")) shop(e.id.slice(5));
  }
}
function meetNugget() {
  if (!state.flags.notebook) {
    state.flags.notebook = true;
    state.notebookEntries.push(
      "Professor Nugget gave you a field notebook. Observe first; change one thing at a time.",
    );
    persist();
    say(
      [
        [
          "Professor Nugget",
          "There you are! I’m Nugget. Herpetologist, notebook enthusiast, occasional misplaced-pencil detective.",
        ],
        [
          "Professor Nugget",
          "This notebook is yours. Sketch what you notice. Animals tell us what they need, if we learn to look.",
        ],
        [
          "Professor Nugget",
          "A gecko needs much more than a sealed jar. For your first living system, start with moss and little decomposers.",
        ],
        [
          "",
          "Field notebook received. Open it with Start.",
        ],
      ],
      () => {
        if (state.flags.rescued.length === 4) meetNugget();
      },
    );
    return;
  }
  if (state.flags.rescued.length === 4 && !state.flags.questReward) {
    state.flags.questReward = true;
    state.money += 1500;
    persist();
    say(
      [
        [
          "Professor Nugget",
          "All four accounted for! Careful observation paid off.",
        ],
        [
          "Professor Nugget",
          "Here’s $15 from our community habitat fund. Put it toward their new beginning.",
        ],
        [
          "",
          "Search completed · $15 earned. Pebble and Button are safe at the Vet.",
        ],
      ],
    );
    return;
  }
  say([
    [
      "Professor Nugget",
      state.flags.rescued.length < 4
        ? "Check the bedroom fern, the downstairs bookshelf, the yard log, and the leaf pile. They’re hiding, not lost."
        : "Change one thing at a time. Then observe for a few hours. Your notebook is a better tool than a guess.",
    ],
  ]);
}
function kaidMenu() {
  showPanel(
    "kaid",
    "Kaid",
    `<p>“Aunt Ember handles all the hot glass. I draw tank ideas, decorate cool glass, and sweep up. Official corner inspector.”</p><div class="notice">${state.debt ? `Your loan: ${dollars(state.debt)} · no interest or deadline.` : "No outstanding loan. “You bring the ideas. I’ll bring the snacks.”"}</div>${state.debt ? button("repay", `Repay ${dollars(state.debt)}`, "primary full", state.money < state.debt ? "disabled" : "") : ""}${button("back", "See you around", "secondary full")}`,
  );
}
let collectionReturn = "tank";
function collectionPanel() {
  collectionReturn = panelName;
  const labels={'pebble-gecko':'Pebble · gecko','button-snail':'Button · snail','isopod':'Isopod','springtail':'Springtail','tree-frog':'Tree frog','cherry-shrimp':'Cherry shrimp','guppy':'Guppy','stag-beetle':'Stag beetle','mangrove-crab':'Mangrove crab','cory-catfish':'Cory catfish'};
  showPanel('collection','Small worlds, full of life',`<p class="hint">Aunt Ember’s habitat gallery and your illustrated field guide. These displays do not change the animals in Little Root.</p><div class="habitat-gallery">${HABITATS.map(h=>`<article class="habitat-card"><canvas width="384" height="288" data-habitat="${h}" aria-label="Animated ${h}"></canvas><h3>${h[0].toUpperCase()+h.slice(1)}</h3><p>${{terrarium:'Cork, leaf litter and a quiet perch · Pebble study',aquarium:'Submerged planting, driftwood and sand · guppy study',paludarium:'A planted bank above a gentle pool · crab study'}[h]}</p></article>`).join('')}</div><h3>Meet the little neighbors</h3><div class="specimen-grid">${CRITTERS.map(slug=>`<article><canvas width="32" height="32" data-specimen="${slug}" aria-label="Animated ${labels[slug]}"></canvas><strong>${labels[slug]}</strong></article>`).join('')}</div><p class="hint">Illustrated at observation scale. Each habitat features one animal study; these are design displays, not stocking or compatibility instructions.</p>`,{eyebrow:'GLOW N’ BLOW / LIVING COLLECTION'});
}
function tankMenu() {
  const t=state.tank;
  showPanel('tank','Little Root',`<nav class="tank-actions" aria-label="Tank actions">${[['manage','Manage','Care'],['stats','Stats','Conditions'],['view','View','Watch & frame']].map(([id,title,desc])=>`<button class="tank-choice" data-action="${id}"><img src="assets/playable/home-v2/icon-${id}.png" alt=""><strong>${title}</strong><small>${desc}</small></button>`).join('')}</nav><div class="tank-entry-preview"><canvas id="tank-preview" class="tank-canvas" width="384" height="288" aria-label="Little Root, your living terrarium"></canvas></div><p class="tank-caption">25-gallon ventilated terrarium · Kaid’s gift</p><div class="tank-census-line"><span><b data-live="isopods">${t.isopods}</b> isopods</span><span><b data-live="springtails">${t.springtails}</b> springtails</span><span><b data-live="moisture">${t.moisture}%</b> moisture</span></div>`,{eyebrow:'YOUR LIVING WORLD'});
}
function menuRow(action, icon, title, desc) {
  return `<button class="menu-row" data-action="${action}"><span class="menu-icon">${icon}</span><span><strong>${title}</strong><small>${desc}</small></span><span class="chevron">›</span></button>`;
}
function supply(label, desc, action, price, disabled = false) {
  return `<div class="supply-row"><div><strong>${label}</strong><small>${desc}</small></div>${button(action, price, "", disabled ? "disabled" : "")}</div>`;
}
function careAction(action,label,detail,disabled=false){return `<button class="care-action" data-action="${action}" ${disabled?'disabled':''}><strong>${label}</strong><small>${detail}</small></button>`;}
function managePanel(keep = false) {
  const t=state.tank;
  showPanel('manage','Care for Little Root',`<div class="care-overview"><canvas id="tank-preview" class="tank-canvas" width="384" height="288" aria-label="Your habitat responds to care"></canvas><div class="care-readouts"><div><span>Moisture</span><strong data-live="moisture">${t.moisture}%</strong><small>55–80% in this model</small></div><div><span>Leaf litter</span><strong data-live="food">${t.food}%</strong><small>Breeding needs at least 8%</small></div></div></div><div class="care-actions" aria-label="Everyday care">${careAction('mist','Mist substrate','Free · +14 moisture')}${careAction('feed','Add leaf litter',`${state.inventory.litter} portions · +25 food`,state.inventory.litter<1)}${careAction('moss','Plant moss',`${t.plants}/6 planted · ${state.inventory.moss} cuttings`,state.inventory.moss<1||t.plants>=6)}${careAction('clean','Clean glass','Less algae & waste')}</div>${button('observe','Observe · 1 habitat hour','secondary full')}<h3 class="care-settings-title">Light & airflow</h3><div class="setting"><div class="setting-header">Daily light <span>${t.light} h</span></div><p>Long days encourage algae. Eight hours is a useful starting point.</p><div class="segments">${[4,8,12].map(n=>button('light',`${n} hours`,n===t.light?'selected':'',`data-value="${n}" aria-pressed="${n===t.light}"`)).join('')}</div></div><div class="setting"><div class="setting-header">Ventilation</div><p>Fresh air dries substrate faster. A low setting can limit activity.</p><div class="segments">${['Low','Balanced','Open'].map((n,i)=>button('ventilation',n,t.ventilation===i+1?'selected':'',`data-value="${i+1}" aria-pressed="${t.ventilation===i+1}"`)).join('')}</div></div><p class="hint">One habitat hour passes every 8 seconds while playing. Dialogue and pause stop time. This is a simplified learning model.</p>`,{keep});
}
function stat(label, value, hint = "", live = "") {
  return `<div class="stat"><label>${label}</label><strong ${live ? `data-live="${live}"` : ""}>${value}</strong>${hint ? `<small>${hint}</small>` : ""}</div>`;
}
function statsPanel(keep = false) {
  const t = state.tank,
    c = conditions(t),
    old = t.history.at(-7);
  showPanel(
    "stats",
    "Life, by the numbers",
    `<span class="badge">LITTLE ROOT · HOUR <span data-live="hours">${t.hours}</span></span><div class="stat-grid">${stat("Isopods", t.isopods, "Leaf-litter recyclers", "isopods")}${stat("Springtails", t.springtails, "Tiny decomposers", "springtails")}${stat("Moss plantings", t.plants + "/6", "Shelter and moisture retention")}${stat("Daily light", t.light + " hours", "Ventilation: " + ["Low", "Balanced", "Open"][t.ventilation - 1])}${stat("Moisture", t.moisture + "%", "Target 55–80%", "moisture")}${stat("Leaf litter", t.food + "%", "Breeding needs at least 8%", "food")}${stat("Waste", t.waste + "%", "Microbes and springtails reduce it", "waste")}${stat("Nutrients", t.nutrients + "%", "Decomposition adds; plants use", "nutrients")}${stat("Microbe index", t.microbes, "Simplified activity index, not a count", "microbes")}${stat("Algae cover", t.algae + "%", "Light and dampness encourage it", "algae")}${stat("Births", t.births, "Over the life of this habitat", "births")}${stat("Deaths", 0, "Nonlethal learning mode in this slice")}</div><div class="notice">Activity: <b data-live="activity">${c.activity}/100</b>. Poor conditions slow animals and pause breeding. No animal deaths are simulated in this chapter.</div><h3>Recent trend</h3><p id="trend">${old ? `Over the last ${t.hours - old.hour} hours: moisture ${Math.round(t.moisture - old.moisture)} points, population ${t.isopods + t.springtails - old.population >= 0 ? "+" : ""}${t.isopods + t.springtails - old.population}.` : "Observe for a few hours to build a trend."}</p><h3>Habitat journal</h3><div id="habitat-events">${t.events.map((e) => `<div class="journal-entry"><p>${esc(e)}</p></div>`).join("")}</div>${button("observe", "Observe · 1 habitat hour", "secondary full")}`,
    { keep },
  );
}
function viewPanel() {
  capture = null;
  recording = 0;
  showPanel(
    "view",
    "Find a little wonder",
    `<canvas id="view-canvas" class="tank-canvas" width="384" height="288"></canvas><p class="hint">Frame the moss and moving animals. Your choices affect composition. The scene shows a sample of the colony; Stats has the full census.</p><div class="segments">${button("photo-mode", "Photo", camera.kind === "photo" ? "selected" : "")}${button("video-mode", "6-second simulated video", camera.kind === "video" ? "selected" : "")}</div><label class="field-label" for="frame">Pan the frame</label><input type="range" id="frame" min="0" max="100" value="${camera.frame}"><label class="field-label" for="zoom">Zoom</label><input type="range" id="zoom" min="100" max="160" value="${camera.zoom * 100}"><div id="camera-scores"></div>${button("capture", camera.kind === "photo" ? "◉ Take photo" : "● Record simulated video")}<p class="hint">Photos become in-game snapshots. Videos are simulated Critter clips; no real video file is recorded.</p>${button("collection", "Browse the living collection", "secondary full")}`,
    { eyebrow: "VIEW / CRITTER CAMERA" },
  );
  cameraScores();
}
function cameraScores() {
  const box = $("camera-scores");
  if (box) {
    const sc = scorePost(state, camera);
    box.innerHTML = `<div class="score-row"><span>Composition</span><b>${sc.composition}/100</b></div><div class="score-row"><span>Animal activity</span><b>${sc.activity}/100</b></div>`;
  }
}
function takeCapture() {
  const temp = document.createElement("canvas");
  temp.width = 384;
  temp.height = 288;
  renderTank(temp, state.tank, visualTime, camera);
  capture = { ...camera, image: temp.toDataURL("image/png") };
  const sc = scorePost(state, capture);
  showPanel(
    "capture",
    "A moment worth sharing",
    `<img class="tank-canvas" src="${capture.image}" alt="Your framed terrarium snapshot"><p>${capture.kind === "video" ? "6-second simulated tank clip" : "Tank photograph"} · Little Root</p>${scoreRows(sc)}<div class="notice">Estimated reach: <b>${sc.targetViews.toLocaleString()} views</b> over 4 habitat hours. Game ad rate: $1.20 per 1,000 views.</div>${button("publish", "Post to Critter")}${button("retake", "Reframe this moment", "secondary full")}<p class="hint">Score weights: activity 25%, composition 20%, appearance 25%, rarity 10%, audience interest 20%. Videos add 15% reach.</p>`,
    { eyebrow: "CRITTER / POST PREVIEW" },
  );
}
function scoreRows(sc) {
  return [
    ["activity", "Animal activity"],
    ["composition", "Composition"],
    ["appearance", "Tank appearance"],
    ["rarity", "Species rarity"],
    ["interest", "Audience interest"],
  ]
    .map(
      ([k, n]) =>
        `<div class="score-row"><span>${n}</span><b>${sc[k]}/100</b></div>`,
    )
    .join("");
}
function critterPanel(keep = false) {
  showPanel(
    "critter",
    "Your corner of Critter",
    `<div class="notice">Lifetime ad earnings: <b>${dollars(state.lifetimeEarned)}</b><br>Reach grows over 4 habitat hours. Posting the same tank within 6 hours lowers audience interest.</div>${state.posts.length ? state.posts.map((p) => `<article class="post"><div class="post-header"><b>@${esc(state.hero)} · Little Root</b><span>${p.kind === "video" ? "SIMULATED VIDEO" : "PHOTO"}</span></div><img src="${p.image.startsWith("data:image/png;base64,") ? p.image : ""}" alt="Saved tank snapshot"><div class="post-numbers"><span><b>${p.views.toLocaleString()}</b>views</span><span><b>${p.likes}</b>likes · ${p.comments} replies</span><span><b>${dollars(p.revenue)}</b>earned</span></div><p class="hint">${p.age < 4 ? "Finding its audience…" : "Reach complete"} · ${p.engagement}% engagement · score ${p.scores?.total ?? "—"}/100</p></article>`).join("") : "<p>Your first post is waiting to happen. Go to your bedroom tank and choose View.</p>"}${state.posts.length ? button("observe", "Let an hour pass", "secondary full") : ""}`,
    { eyebrow: "SMALL WORLDS. SHARED.", keep },
  );
}
function refreshLive() {
  for (const el of panel.querySelectorAll("[data-live]")) {
    const key = el.dataset.live;
    el.textContent =
      key === "activity"
        ? `${conditions(state.tank).activity}/100`
        : state.tank[key] +
          (["moisture", "food", "waste", "nutrients", "algae"].includes(key)
            ? "%"
            : "");
  }
  cameraScores();
  if (panelName === "stats") {
    $("habitat-events").innerHTML = state.tank.events
      .map((e) => `<div class="journal-entry"><p>${esc(e)}</p></div>`)
      .join("");
    const old = state.tank.history.at(-7),
      t = state.tank;
    if (old)
      $("trend").textContent =
        `Over ${t.hours - old.hour} hours: moisture ${Math.round(t.moisture - old.moisture)} points; population ${t.isopods + t.springtails - old.population >= 0 ? "+" : ""}${t.isopods + t.springtails - old.population}.`;
  }
}
function shop(type) {
  if (type === "critz")
    showPanel(
      "shop-critz",
      "Critz",
      `<p>Juniper: “Start with good habitat. The animals will tell you the rest.”</p><span class="badge">YOUR POCKET · ${dollars(state.money)}</span>${supply("Moss cutting", "Adds shelter and holds moisture", "buy-moss", "$3", state.money < 300)}${supply("Leaf litter · 3 portions", "Food for isopods and springtails", "buy-litter", "$1.50", state.money < 150)}${!state.flags.supplyGift ? button("supply-gift", "Collect a free welcome kit", "secondary full") : ""}<p class="hint">Live animal sales and additional habitat types arrive in future chapters.</p>`,
      { eyebrow: "PET SHOP / JUNIPER" },
    );
  if (type === "vet")
    showPanel(
      "shop-vet",
      "Small patients, big care",
      `<p>Dr. Fern: “Every escapee is safe. Your larger friends stay here while you prepare suitable homes.”</p>${["gecko", "snail"].map((id) => `<div class="journal-entry"><strong>${rescueInfo[id].name}</strong><p>${state.flags.rescued.includes(id) ? "Found, examined, and resting in a separate care habitat." : "Ready to help when you find them."}</p></div>`).join("")}<div class="notice">Free checkup: ${state.tank.moisture < 55 ? "Little Root needs misting." : state.tank.moisture > 80 ? "Little Root is very damp. Increase airflow and allow it to dry." : "Little Root’s moisture looks comfortable."} ${state.tank.food < 8 ? "Add leaf litter soon." : "Keep watching food and waste."}</div>${button("vet-talk", "Ask about gecko care", "secondary full")}`,
      { eyebrow: "ROOTPORT VET / DR. FERN" },
    );
  if (type === "pharmacy")
    showPanel(
      "shop-pharmacy",
      "Rootport Drug Store",
      `<p>Mina: “Your mom’s prescription is ready. We’re helping her make a treatment plan.”</p>${supply("Mom’s prescription", state.flags.medicineDelivered ? "Already delivered for this chapter" : state.inventory.medicine ? "Already in your bag · take it to Mom" : "One-week supply · take it to Mom", "buy-medicine", "$20", state.money < 2000 || state.inventory.medicine > 0 || state.flags.medicineDelivered)}<p class="hint">No recurring deadline or tank-breaking event is active in this first chapter.</p>`,
      { eyebrow: "PHARMACY / MINA" },
    );
  if (type === "bike")
    showPanel(
      "shop-bike",
      "A little more momentum",
      `<p>Ollie: “The safest fast wheels in Rootport? These little cruisers.”</p>${supply("Cruiser skateboard", "Run mode becomes 25% faster outdoors", "buy-board", state.flags.board ? "Owned" : "$45", state.money < 4500 || state.flags.board)}<p class="hint">Toggle RUN below the screen. Hold Shift on a keyboard. Bikes and OneWheels are planned.</p>`,
      { eyebrow: "BIKE SHOP / OLLIE" },
    );
  if (type === "glass")
    showPanel(
      "shop-glass",
      "Glow n’ Blow",
      `<p>Aunt Ember: “Kaid designs the shapes. I do the hot work. No ten-year-olds near the furnace.”</p>${supply("Carved cork hide", "A visible shelter · +8 appearance points", "buy-hide", state.tank.hide ? "Owned" : "$6", state.money < 600 || state.tank.hide)}<div class="notice">“That 25-gallon birthday tank? Rounded corners, as requested by the boss.”</div>${button("collection", "Browse the living collection", "secondary full")}<p class="hint">Larger tanks, including a possible 50-gallon upgrade, are planned. Your starter gift stays 25 gallons.</p>`,
      { eyebrow: "GLASS SHOP / AUNT EMBER" },
    );
}
function pause() {
  const commands=[...(state.stage==='morning'?[['greenhouse','Luke’s Greenhouse','Eight tubs, one scoop. Your adventure wallet and goldfish.'],['coast','Visit the coast','Beaches, shallows, turtles and reflections.'],['map-player','Play my map','Explore the map saved in Map Studio.'] ]:[]),['notebook','Notebook','Your finds, notes and next step.'],['bag','Bag','Supplies, savings and Kaid’s loan.'],['critter','Critter','Your photos, clips and earnings.'],['directory','Town guide','Places to visit and how to play.'],['options','Options','Music, window colors and quieter reactions.'],['save','Save','Save your progress on this device.'],['resume','Close','Back to your little world.']];
  showPanel('pause','Menu',`<p class="menu-status">${esc(state.scene === "bedroom" ? `${state.hero}’s room` : scenes[state.scene].name)} · ${state.stage === "night" ? "Night 01" : `Day ${Math.floor(state.time / 24) + 1} · ${String(state.time % 24).padStart(2,"0")}:00`}</p>${zoomControls()}<div class="command-list">${commands.map(([id,label,help])=>button(id,label,'command',`data-help="${help}"`)).join('')}</div><p id="menu-help" class="menu-help">Your finds, notes and next step.</p><div class="window-controls"><b>A</b> Choose <b>B</b> Back</div>`,{back:false,eyebrow:`${esc(state.hero)} · ${dollars(state.money)}`});
}
function zoomControls(){return `<div class="world-zoom" role="group" aria-label="World zoom"><span>World zoom</span><button data-action="zoom-out" aria-label="Zoom out" ${settings.worldZoom===0?'disabled':''}>−</button><output id="world-zoom-level" aria-live="polite">${settings.worldZoom+1} / 3</output><button data-action="zoom-in" aria-label="Zoom in" ${settings.worldZoom===2?'disabled':''}>+</button></div>`;}
function changeWorldZoom(delta){
 settings.worldZoom=Math.max(0,Math.min(2,settings.worldZoom+delta));fitWorld();
 const output=$('world-zoom-level');if(output)output.textContent=`${settings.worldZoom+1} / 3`;
 for(const [action,limit]of [['zoom-out',0],['zoom-in',2]]){const b=panel.querySelector(`[data-action="${action}"]`);if(b)b.disabled=settings.worldZoom===limit;}
 const saved=writeSettings({setItem:(k,v)=>localStorage.setItem(k,v)},settings);
 reportStatus(saved?'World zoom saved on this device.':'World zoom could not be saved on this browser.');
}
function optionsPanel(){
  const returnTo=panelName==='options'?panelOrigin:panelName;
  showPanel('options','Options',`<div class="option-row"><span>Text speed</span><strong>FAST</strong></div><div class="text-sample" id="text-sample" aria-label="Fast text preview"></div>${button('frame-style',`Window <span>◀ ${settings.frame.toUpperCase()} ▶</span>`,'option-row option-control','data-option="frame"')}${button('calm-motion',`Reactions <span>◀ ${settings.calm?'CALM':'LIVELY'} ▶</span>`,'option-row option-control','data-option="calm"')}${button('music-toggle',`Music <span>◀ ${music.settings.enabled?'ON':'OFF'} ▶</span>`,'option-row option-control',`data-option="music" aria-pressed="${music.settings.enabled}"`)}<label class="option-row" for="music-volume">Music volume <output id="music-volume-value">${Math.round(music.settings.volume*100)}%</output></label><input id="music-volume" aria-label="Music volume" type="range" min="0" max="100" step="10" value="${Math.round(music.settings.volume*100)}"><p id="music-status" class="hint" aria-live="polite"></p><p class="hint">A finishes a message. Press again for the next page. Calm keeps reaction symbols and turns off hops.</p>${button('back','Done','primary full')}${returnTo==='pause'?button('title','Save & return to title','secondary full'):''}`,{eyebrow:'MAKE YOURSELF AT HOME'});
  optionPrinter=createPrinter('A tiny world. A new beginning.');
  updateMusicOptions();
}
function notebook() {
  showPanel(
    "notebook",
    "The little things matter.",
    `<div class="notice">${esc(objective(state))}</div>${!state.flags.notebook ? "<p>Your own scrap notes, for now. Meet Professor Nugget near the Vet for a field notebook.</p>" : ""}${Object.entries(
      rescueInfo,
    )
      .map(
        ([id, a]) =>
          `<div class="journal-entry"><strong>${state.flags.rescued.includes(id) ? "✓" : "◇"} ${a.name}</strong><p>${state.flags.rescued.includes(id) ? a.description : a.location}</p></div>`,
      )
      .join(
        "",
      )}<h3>Tanoshi greetings · ${foundTanoshi(state).length}/${TANOSHI.length}</h3><p>Little yokai hide around familiar places. Stand beside one and press A to say hello.</p>${foundTanoshi(state).map(t=>`<div class="journal-entry"><strong>✓ ${esc(t.name)} · ${esc(t.personality)}</strong><p>${esc(t.greeting)}</p></div>`).join('')}<h3>Today’s notes</h3>${state.notebookEntries.length ? state.notebookEntries.map((n) => `<div class="journal-entry"><p>${esc(n)}</p></div>`).join("") : "<p>A fresh page. A new beginning.</p>"}<p class="hint">This chapter uses a compressed, simplified ecosystem. Later chapters will add richer study, sketches, and species-specific habitats.</p>`,
    {
      eyebrow: state.flags.notebook
        ? "PROFESSOR NUGGET’S FIELD NOTEBOOK"
        : "YOUR NOTES",
    },
  );
}
function openGreenhouse() {
  // The room shares the adventure wallet and collection. Review storage remains separate.
  window.critzGreenhouse = {
    gender:state.gender,
    read() {return {...(state.lukeGreenhouse || greenhouseInitial()),money:Math.floor(state.money/100)};},
    write(next) {
      try {next=normalizeGreenhouse(next);} catch {return false;}
      const oldMoney=state.money, oldCollection=state.lukeGreenhouse;
      state.money += (next.money-Math.floor(state.money/100))*100;
      if(state.money<0){state.money=oldMoney;return false;}
      state.lukeGreenhouse=next;
      if(!persist()){state.money=oldMoney;state.lukeGreenhouse=oldCollection;return false;}
      return true;
    },
  };
  showPanel('greenhouse', 'Luke’s Greenhouse', '<iframe class="game-room" title="Luke’s Greenhouse" src="art-review/greenhouse.html?game=1"></iframe>', {eyebrow:'ROOTPORT · EIGHT TUBS, ONE SCOOP'});
}
function openMapPlayer() {
  showPanel('map-player','Your Map Studio world','<iframe class="game-room" title="Play your Map Studio world" src="map-editor/play.html"></iframe>',{eyebrow:'EXPLORE YOUR MAP'});
}

function directory() {
  showPanel(
    "directory",
    "Welcome to Rootport",
    `<p>From home: bedroom stairs → downstairs → yard gate. Follow the cottage lanes to the spring fountain, garden beds and riverside workshops.</p><div class="map-grid"><span><b>Northwest</b>Your home & yard</span><span><b>North center</b>Kaid’s home</span><span><b>Northeast</b>Your rival’s home</span><span><b>Middle west</b>Critz · moss & litter</span><span><b>Middle center</b>Vet · Professor Nugget nearby</span><span><b>Middle east</b>Drug Store · medicine</span><span><b>Southwest</b>Bike Shop · skateboard</span><span><b>Southeast</b>Glow n’ Blow · glass & decor</span><span><b>Town square</b>Luke’s Greenhouse · beside the directory</span></div><h3>Make yourself at home</h3><p>D-pad / arrows / WASD: walk.<br>A / Z / Enter: interact or confirm.<br>B / X / Escape: go back.<br>Start / P: pause. RUN / Shift: move faster.<br>In menus, tap choices or use ↑ ↓ and A.</p><p class="hint">Walk into a doorway to enter or leave. No button press is needed. Look for sparkles when searching. Stand beside a red apple tree and press A to shake fruit into your Bag. Head north past the spring to Mossway. ${state.liarsvilleBearAccess?'Cross the tall-grass meadow and follow the spillway to Liarsville.':'A big resting bear blocks the Mossway path to Liarsville for now.'} Walk through the signed ends of the route to travel.</p><details class="studio-links"><summary>Studio & credits</summary><a href="sprite-editor/">Sprite Editor</a> · <a href="map-editor/">Map Studio</a> · <a href="art-review/walking.html">Art reviews</a> · <a href="music/">Listening room</a></details>`,
  );
}
function bag() {
  showPanel(
    "bag",
    "What you’re carrying",
    `<div class="stat-grid">${stat("Savings", dollars(state.money))}${stat("Kaid’s loan", dollars(state.debt))}${stat("Moss cuttings", state.inventory.moss)}${stat("Leaf litter", state.inventory.litter)}${stat("Prescriptions", state.inventory.medicine)}${stat("Orchard apples", state.inventory.apples??0)}${stat("Skateboard", state.flags.board ? "Owned" : "None")}</div><p class="hint">Clean water for misting is free. Collect two portions of leaf litter from the yard every six habitat hours. Shake red apple trees with A to collect three apples for your bag; each tree regrows after 24 habitat hours.</p>${state.debt ? button("repay", `Repay Kaid · ${dollars(state.debt)}`, "secondary full", state.money < state.debt ? "disabled" : "") : ""}`,
  );
}
function back() {
  if (dialogue) {
    nextDialogue();
    return;
  }
  if (["title", "setup", "loan", "confirm-new"].includes(panelName)) return;
  if(['options','notebook','bag','critter','directory'].includes(panelName)&&panelOrigin){const origin=panelOrigin;origin==='title'?titleScreen():pause();return;}
  if(panelName === "collection") { collectionReturn === "shop-glass" ? shop("glass") : collectionReturn === "view" ? viewPanel() : tankMenu(); return; }
  if (["manage", "stats", "view"].includes(panelName)) {
    recording = 0;
    tankMenu();
    return;
  }
  if (panelName === "capture") {
    viewPanel();
    return;
  }
  if (panelName) {
    closePanel();
    return;
  }
  pause();
}
function confirmPanel() {
  const active = document.activeElement;
  if (
    panel.contains(active) &&
    active.tagName === "BUTTON" &&
    !active.disabled
  ) {
    active.click();
    return;
  }
  const btn = panel.querySelector("button:not(.close):not(:disabled)");
  btn?.focus();
}
function moveMenu(dir) {
  if(['left','right'].includes(dir)&&document.activeElement?.dataset.option){doAction(document.activeElement.dataset.action,document.activeElement,dir==='left'?-1:1);return;}
  const controls = [...panel.querySelectorAll("button:not(.close):not(:disabled),input")];
  if (!controls.length) return;
  const index = controls.indexOf(document.activeElement);
  controls[
    (index + (dir === "up" || dir === "left" ? -1 : 1) + controls.length) %
      controls.length
  ].focus();
}
function doAction(action, el, delta=1) {
  if(action==='zoom-in'||action==='zoom-out'){changeWorldZoom(action==='zoom-in'?1:-1);return;}
  if(action==='music-toggle'){music.setEnabled(!music.settings.enabled);return;}
  if(action==='options'){optionsPanel();return;}
  if(action==='frame-style'||action==='calm-motion'){
    if(action==='frame-style')settings.frame=FRAME_STYLES[(FRAME_STYLES.indexOf(settings.frame)+delta+FRAME_STYLES.length)%FRAME_STYLES.length];else settings.calm=!settings.calm;
    applySettings();if(!writeSettings({setItem:(k,v)=>localStorage.setItem(k,v)},settings))reportStatus('Options could not be saved on this browser.');
    el.innerHTML=action==='frame-style'?`Window <span>◀ ${settings.frame.toUpperCase()} ▶</span>`:`Reactions <span>◀ ${settings.calm?'CALM':'LIVELY'} ▶</span>`;return;
  }
  if (["boy", "girl"].includes(action)) {
    gender = action;
    for (const b of panel.querySelectorAll(".choice")) {
      b.classList.toggle("selected", b.dataset.action === action);
      b.setAttribute("aria-pressed", b.dataset.action === action);
    }
    $("rival-gender").textContent = gender === "boy" ? "(girl)" : "(boy)";
    return;
  }
  if (
    ["mist", "moss", "feed", "clean", "light", "ventilation"].includes(action)
  ) {
    const result = manage(state, action, Number(el.dataset.value));
    if (result.ok) {
      persist();
      managePanel(true);
    }
    reportStatus(result.message);
    return;
  }
  if (action.startsWith("buy-")) {
    const goods = {
      moss: [300, () => state.inventory.moss++, "critz"],
      litter: [150, () => (state.inventory.litter += 3), "critz"],
      medicine: [2000, () => state.inventory.medicine++, "pharmacy"],
      board: [4500, () => (state.flags.board = true), "bike"],
      hide: [600, () => (state.tank.hide = true), "glass"],
    };
    const g = goods[action.slice(4)];
    if (g && spend(state, g[0])) {
      g[1]();
      persist();
      shop(g[2]);
      reportStatus("All yours. Added to your supplies.");
    }
    return;
  }
  switch (action) {
    case "reload":
      location.reload();
      break;
    case "new":
      if (loaded.state)
        showPanel(
          "confirm-new",
          "Start fresh?",
          `<p>This replaces your browser’s existing save when the new story begins.</p>${button("confirm-new", "Start a new story")}${button("cancel-new", "Keep my current story", "secondary full")}`,
          { back: false },
        );
      else setup();
      break;
    case "confirm-new":
      setup();
      break;
    case "cancel-new":
      titleScreen();
      break;
    case "begin": {
      const hero = $("hero-name").value.trim(),
        rival = $("rival-name").value.trim();
      if (!hero || !rival) {
        reportStatus("Give both characters a name to begin.");
        (!hero ? $("hero-name") : $("rival-name")).focus();
        return;
      }
      state = createState(hero, gender, rival);
      loaded = { state: null };
      simAccumulator = 0;
      closePanel();
      persist();
      opening();
      break;
    }
    case "continue":
      state = migrateGridState(loaded.state);
      loaded.state = state;
      closePanel();
      if (state.stage === "night") {
        state.scene = "bedroom";
        state.player = { x: 8, y: 6, facing: "up" };
        delete state.storyBeat;
        opening();
      }
      break;
    case "accept-loan":
      finishNight(true);
      break;
    case "decline-loan":
      finishNight(false);
      break;
    case "back":
      back();
      break;
    case "manage":
      managePanel();
      break;
    case "stats":
      statsPanel();
      break;
    case "collection":
      collectionPanel();
      break;
    case "view":
      viewPanel();
      break;
    case "photo-mode":
      camera.kind = "photo";
      viewPanel();
      break;
    case "video-mode":
      camera.kind = "video";
      viewPanel();
      break;
    case "capture":
      if (camera.kind === "video") {
        recording = 6;
        el.disabled = true;
        el.textContent = "● Recording… 6s";
      } else takeCapture();
      break;
    case "retake":
      viewPanel();
      break;
    case "publish":
      if (capture) {
        publish(state, capture);
        capture = null;
        persist();
        critterPanel();
        reportStatus("Posted! Your first viewers are finding it.");
      }
      break;
    case "critter":
      critterPanel();
      break;
    case "notebook":
      notebook();
      break;
    case "greenhouse":
      openGreenhouse();break;
    case "coast":
      window.critzCoast={state};showPanel('coast','The coast','<iframe class="game-room" title="Explore the coast" src="art-review/coast.html?game=1"></iframe>');break;
    case "map-player":
      openMapPlayer();break;
    case "directory":
      directory();
      break;
    case "bag":
      bag();
      break;
    case "resume":
      closePanel();
      break;
    case "save":
      persist(false);
      break;
    case "title":
      if (!persist()) break;
      loaded = load();
      titleScreen();
      break;
    case "repay":
      if (state.debt && spend(state, state.debt)) {
        state.debt = 0;
        persist();
        if (panelName === "bag") bag();
        else kaidMenu();
        reportStatus("Kaid’s loan repaid. “You remembered. Thanks, friend.”");
      }
      break;
    case "observe":
      tick(state);
      persist();
      if (panelName === "stats") statsPanel(true);
      else if (panelName === "critter") critterPanel(true);
      else refreshLive();
      reportStatus("One habitat hour passes.");
      break;
    case "rest":
      finishDay(false);
      break;
    case "supply-gift":
      if (!state.flags.supplyGift) {
        state.flags.supplyGift = true;
        state.inventory.litter += 3;
        state.inventory.moss++;
        persist();
        shop("critz");
        reportStatus("Welcome kit: 1 moss cutting and 3 leaf-litter portions.");
      }
      break;
    case "vet-talk":
      closePanel();
      say([
        [
          "Dr. Fern",
          "Geckos need appropriate temperatures, ventilation, fresh water, and the right food. Their needs depend on the species.",
        ],
        [
          "Dr. Fern",
          "Pebble stays with us until you have a suitable setup. A sealed plant terrarium isn’t a gecko home.",
        ],
      ]);
      break;
  }
}
panel.addEventListener('focusin',e=>{if(panelName==='pause'&&e.target.dataset.action){startCursor=e.target.dataset.action;$('menu-help').textContent=e.target.dataset.help||'';}});
panel.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el && !el.disabled) doAction(el.dataset.action, el);
});
panel.addEventListener("input", (e) => {
  if(e.target.id==='music-volume'){music.setVolume(Number(e.target.value)/100);return;}
  if (e.target.id === "frame") camera.frame = Number(e.target.value);
  if (e.target.id === "zoom") camera.zoom = Number(e.target.value) / 100;
  cameraScores();
});
function bindPress(el, onDown, onUp = () => {}) {
  const pointers=new Set();
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if(!artworkReady)return;
    el.setPointerCapture(e.pointerId);
    pointers.add(e.pointerId);
    el.classList.add("pressed");
    onDown(e);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    el.addEventListener(name, (e) => {
      pointers.delete(e.pointerId);
      if(!pointers.size)el.classList.remove("pressed");
      onUp(e);
    });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}
for (const b of document.querySelectorAll("[data-dir]"))
  bindPress(
    b,
    e => {
      if (panelName) moveMenu(b.dataset.dir);
      else down.press('pointer:'+e.pointerId,b.dataset.dir);
    },
    e => down.release('pointer:'+e.pointerId),
  );
bindPress($("a-button"), interact);
bindPress($("b-button"), back);
$("start").addEventListener("click", () => {
  if(!artworkReady)return;
  if (dialogue || ["title", "setup", "loan", "confirm-new"].includes(panelName))
    return;
  panelName === "pause" ? closePanel() : pause();
});
$("run").addEventListener("click", () => {
  if(!artworkReady)return;
  running = !running;
  $("run").setAttribute("aria-pressed", running);
});
$("dialogue-next").addEventListener("click", nextDialogue);
document.addEventListener("keydown", (e) => {
  if(!artworkReady)return;
  const textInput = e.target.tagName === "INPUT";
  if (textInput) {
    if (e.key === "Escape") {
      e.target.blur();
      e.preventDefault();
    }
    if (e.key === "Enter" && panelName === "setup") {
      e.preventDefault();
      doAction("begin");
    }
    if (e.key !== "Tab") return;
  }
  if (e.key === "Tab" && panelName) {
    const items = [...panel.querySelectorAll("button:not(:disabled),input")];
    const first = items[0],
      last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  if(panelName==='pause'&&['+','=','-','_'].includes(e.key)){e.preventDefault();if(!e.repeat)changeWorldZoom(['+','='].includes(e.key)?1:-1);return;}
  const dir = directionForKey(e.key);
  if (dir) {
    e.preventDefault();
    if (panelName) {
      if (!e.repeat) moveMenu(dir);
    } else down.press(keyInputSource(e),dir);
    return;
  }
  if (["z", "Z", "Enter", " "].includes(e.key)) {
    e.preventDefault();
    if (!e.repeat) interact();
  }
  if (["x", "X", "Escape"].includes(e.key)) {
    e.preventDefault();
    if (!e.repeat) back();
  }
  if (["p", "P"].includes(e.key)) {
    e.preventDefault();
    if (
      !dialogue &&
      !["title", "setup", "loan", "confirm-new"].includes(panelName)
    ) {
      panelName === "pause" ? closePanel() : pause();
    }
  }
});
let shift = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shift = artworkReady;
});
document.addEventListener("keyup", (e) => {
  down.release(keyInputSource(e));
  if (e.key === "Shift") shift = false;
});
function clearInput() {
  down.clear();
  shift = false;
  pendingInteract = false;
  resetMotionClock(motionClock);
  lastTime = performance.now();
  document
    .querySelectorAll(".pressed")
    .forEach((b) => b.classList.remove("pressed"));
}
window.addEventListener("blur", clearInput);
window.addEventListener("resize", () => { fitWorld(); fitOverlay(); if(dialogue){ const remaining=[printer.glyphs.join(''),...dialoguePages].join(' ').replace(/\n/g,' ');const style=getComputedStyle($('dialogue-text'));textMeasure.font=style.font;dialoguePages=paginate(remaining,t=>textMeasure.measureText(t).width,Math.max(140,$('dialogue-text').clientWidth),2);showDialoguePage();} });
new ResizeObserver(fitWorld).observe($("viewport"));
document.addEventListener("visibilitychange", () => {
  music.setVisible(!document.hidden);
  clearInput();
  lastTime = performance.now();
  if (artworkReady && document.hidden && !["title", "setup", "confirm-new", "asset-error"].includes(panelName))
    persist();
});
window.addEventListener("pagehide", () => {
  pageActive=false;
  clearInput();
  music.setVisible(false);
  if (artworkReady && !["title", "setup", "confirm-new", "asset-error"].includes(panelName)) persist();
});
window.addEventListener("pageshow", () => {pageActive=true;clearInput();music.setVisible(!document.hidden);});
function finishDay(passedOut) {
  if(transitioning)return;
  transitioning=true;closePanel();clearInput();$('fade').classList.add('on');
  setTimeout(()=>{
    const hours=endDay(state);
    // Whole habitat hours use the existing nonlethal model, independent of world time.
    tick(state,Math.floor(hours));
    simAccumulator=0;syncMotion();releaseActors(state);persist();
    $('fade').classList.remove('on');transitioning=false;lastTime=performance.now();
    say([[state.hero,passedOut?'I fell asleep at 2:00am. Now it’s 6:00am, safe in my bed.':'A new day. It’s 6:00am.']]);
  },settings.calm?0:350);
}
function frame(now) {
  music.update(state,panelName,panelOrigin);
  const elapsed = Math.max(0, (now - lastTime) / 1000);
  const dt = Math.min(0.05, elapsed);
  lastTime = now;
  if (!document.hidden && pageActive) {
    visualTime += dt;
    updateText(dt);
    initializeActors(state,scenes[state.scene].entities);
    updateActors(state,dt,{paused:!!(panelName||dialogue||transitioning||state.stage==='night'),calm:settings.calm,playerDestination:getMotionView(motion).destination,canEnter:(x,y,id,from)=>!fenceCrossing(state.scene,from,{x,y})&&!isBlocked(state.scene,x,y)&&!getEntities(state).some(e=>e.type==='door'&&e.x===x&&e.y===y)});
    moving = false;
    syncMotion();
    if (!panelName && !dialogue && !transitioning) {
      advanceMotionClock(motionClock, elapsed, () => {
        if (panelName || dialogue || transitioning) return;
        advanceMotion(motion, down, running || shift,
          (x,y) => canStep(state,x,y),
          { runAllowed: true, board: !!state.flags.board && ["town","yard","liarsville"].includes(state.scene) });
        const stepView = getMotionView(motion);
        if (stepView.moving && stepView.settled) {
          const gate = getEntities(state).find(e => e.type === 'door' && approachesDoor(!!scenes[state.scene].map,!!scenes[e.to].map,e,stepView.facing) && e.x === state.player.x && e.y === state.player.y);
          if (gate) { travel(gate); return; }
          const greenhouse=getEntities(state).find(e=>e.type==='greenhouse'&&e.x===state.player.x&&e.y===state.player.y&&stepView.facing==='up');if(greenhouse){openGreenhouse();return;}
        }
        if (pendingInteract && getMotionView(motion).settled) {
          pendingInteract = false;
          interact();
        }
      });
      moving = getMotionView(motion).moving;
    } else resetMotionClock(motionClock);
    const worldLive=state.stage==='morning'&&!panelName&&!dialogue&&!transitioning&&document.hasFocus();
    if(worldLive&&advanceDayClock(state,Math.min(elapsed,1)))finishDay(true);
    paintClock($('day-clock'),state,!worldLive);
    const live =
      state.stage === "morning" &&
      !dialogue &&
      !transitioning &&
      (!panelName ||
        ["manage", "stats", "view", "critter", "tank"].includes(panelName));
    if (live) {
      simAccumulator += dt;
      if (simAccumulator >= HOUR_SECONDS) {
        simAccumulator -= HOUR_SECONDS;
        tick(state);
        refreshLive();
        if (panelName === "critter") critterPanel(true);
      }
    }
    if (
      now - lastSaved > 15000 &&
      !["title", "setup", "confirm-new"].includes(panelName)
    ) {
      persist();
      lastSaved = now;
    }
    renderWorld(canvas, state, visualTime, getMotionView(motion));
    for (const id of ["tank-preview", "view-canvas"]) {
      const target = $(id);
      if (target)
        renderTank(
          target,
          state.tank,
          visualTime,
          id === "view-canvas" ? { ...camera, reticle: true } : {},
        );
    }
    for(const target of panel.querySelectorAll('[data-specimen]'))renderSpecimen(target,target.dataset.specimen,visualTime);
    for(const target of panel.querySelectorAll('[data-habitat]'))renderTank(target,state.tank,visualTime,{habitat:target.dataset.habitat,demonstration:true});
    const welcome = $("welcome-tank");
    if (welcome)
      renderTank(
        welcome,
        { ...state.tank, plants: 5, isopods: 8, springtails: 18 },
        visualTime,
      );
    if (recording > 0) {
      recording -= dt;
      const btn = panel.querySelector('[data-action="capture"]');
      if (btn) btn.textContent = `● Recording… ${Math.ceil(recording)}s`;
      if (recording <= 0) takeCapture();
    }
  }
  requestAnimationFrame(frame);
}
try {
  await initWorldArt();
  artworkReady=true;
  fitWorld();
  document.documentElement.dataset.gameReady = 'true';

  titleScreen();
  lastTime = performance.now();
  requestAnimationFrame(frame);
} catch (error) {
  showPanel('asset-error','Artwork could not load',`<p>Your saved game is safe. Please reload to try again.</p>${button('reload','Reload game')}<p class="hint">${esc(error.message)}</p>`,{back:false});
}
// Read-only development snapshot for integration tests and balancing tools.
export function getDebugSnapshot() {
  return structuredClone(state);
}
export function getDebugMovement() {
  syncMotion();
  return { ...getMotionView(motion), clock: { ...motionClock } };
}

export function getDebugActors(){return structuredClone(actorDebug(state));}
export function getDebugEntities(){return structuredClone(getEntities(state));}
export function getDebugUI(){return {panel:panelName,typing:!!printer&&!printerComplete(printer),remainingPages:dialoguePages.length,settings:{...settings}};}

export function getDebugFruit(){return getEntities(state).filter(e=>e.type==='fruitTree').map(e=>({id:e.id,...fruitTreeView(state,e.id,visualTime)}));}

export function getDebugAudio(){return music.snapshot();}
export function getDebugAudioEnergy(){if(!music.analyser)return 0;const a=new Float32Array(music.analyser.fftSize);music.analyser.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);}
