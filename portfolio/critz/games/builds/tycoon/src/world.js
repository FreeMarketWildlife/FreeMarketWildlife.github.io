import {crossesFence} from './fence-crossing.js';
import {FRUIT_TREES,fruitCells} from './fruit-trees.js';
import {actorEntity} from './actors.js';
import {routeBear,northOfBear} from './route-bear.js';
import {TANOSHI} from './tanoshi.js';
import {buildings, liarsBuildings, overworldMaps} from './overworld.js';
// Coordinates are integer grid cells at actors' feet, rendered at x*16,y*16.
// Appearance bounds never determine collision: every solid has an explicit
// half-open [x,y,width,height] cell rectangle independent of its PNG.
export const TILE = 16;
const door = (id, name, x, y, to, spawn) => ({ id, name, x, y, type: "door", to, spawn });
// Indoor stairs have one south landing and one northward warp cell. The
// surrounding rail/back cells are solid, independently of the artwork.
const stairs = (name, x, y, to, spawn) => ({
  ...door("stairs", name, x, y, to, spawn), entryFacing: "up",
  stair: { footprint: [x - 1, y - 1, 3, 2], approach: [x, y + 1] },
});
const npc = (id, name, x, y, look = "adult") => ({ id, name, x, y, type: "npc", look, collision: [x, y, 1, 1] });
const item = (id, name, x, y, type = "inspect") => ({ id, name, x, y, type });
const furniture = (kind, x, y, w, h, collision, sprite = `prop.${kind}`) => ({ kind, x, y, w, h, collision, sprite });
const tree = (x, y) => furniture("tree", x, y, 2, 2, [x + 1, y + 2, 1, 1], "tree.clustered");

export {buildings} from './overworld.js';

const shop = (name, keeper, look = "adult", style = "shop") => ({
  name, w: 16, h: 12, style, safeSpawn: [8, 9],
  objects: [
    furniture("counter", 3, 4, 10, 2, [3, 5, 10, 1]),
    furniture("shelf", 2, 2, 3, 2, [2, 3, 3, 1]),
    furniture("shelf", 10, 2, 3, 2, [10, 3, 3, 1]),
  ],
  entities: [
    npc(keeper, name === "Glow n’ Blow" ? "Aunt Ember" : name === "Vet" ? "Dr. Fern" : name === "Critz" ? "Juniper" : name === "Drug Store" ? "Mina" : "Ollie", 8, 6, look),
    door("exit", "Rootport", 8, 11, "town", [8, 9]),
  ],
});

export const scenes = {
  bedroom: {
    name: "Your bedroom", w: 16, h: 12, style: "bedroom", safeSpawn: [8, 7],
    objects: [
      furniture("bed", 2, 3, 2, 3, [2, 4, 2, 2]),
      furniture("desk", 11, 3, 3, 2, [11, 4, 3, 1]),
      furniture("tank", 7, 2, 3, 3, [7, 3, 3, 2]),
      furniture("fern", 2, 7, 1, 2, [2, 8, 1, 1]),
      furniture("shelf", 1, 1, 2, 2, [1, 2, 2, 1], "prop.shelf.small"),
    ],
    entities: [
      item("tank", "Little Root · 25 gal", 8, 5, "tank"),
      item("sleep", "Your bed", 3, 6, "bed"),
      item("desk", "Your sketchbook", 12, 5),
      item("gecko", "A rustle behind the fern", 3, 8, "rescue"),
      stairs("Downstairs", 14, 10, "house", [14, 4]),
    ],
  },
  house: {
    name: "Home · downstairs", w: 16, h: 12, style: "house", safeSpawn: [8, 10],
    objects: [
      furniture("sofa", 2, 4, 4, 2, [2, 5, 4, 1]),
      furniture("table", 6, 7, 3, 2, [6, 8, 3, 1]),
      furniture("shelf", 10, 2, 2, 2, [10, 3, 2, 1], "prop.shelf.small"),
      furniture("kitchen", 2, 2, 5, 2, [2, 3, 5, 1]),
    ],
    entities: [
      npc("mom", "Mom", 5, 6, "mom"),
      item("snail", "A tiny trail by the books", 11, 4, "rescue"),
      stairs("Your bedroom", 14, 3, "bedroom", [14, 11]),
      door("exit", "The yard", 8, 11, "yard", [8, 4]),
    ],
  },
  yard: {
    name: "Home · the yard", w: 16, h: 12, style: "yard", safeSpawn: [8, 9],
    // The house stays solid; its explicit threshold connects to the yard path.
    visualHouse: { x: 5, y: -2, w: 6, h: 5, sprite: "building.yard" },
    objects: [
      furniture("log", 3, 6, 2, 1, [3, 6, 2, 1]),
      furniture("leaves", 11, 7, 2, 1, null),
      furniture("planter", 11, 2, 2, 2, [11, 3, 2, 1]),
      tree(1, 3), tree(13, 3),
    ],
    entities: [
      door("home", "Inside the house", 8, 3, "house", [8, 10]),
      door("gate", "Rootport", 8, 11, "town", [5, 8]),
      item("isopods", "Movement under the log", 5, 6, "rescue"),
      item("springtails", "Tiny specks in the leaves", 11, 8, "rescue"),
      item("forage", "Collect leaf litter", 13, 6, "forage"),
    ],
  },
  town: {
    name: "Rootport", w: 32, h: 27, style: "town", safeSpawn: [16, 9],
    objects: [
      tree(9, 4), tree(19, 4), tree(1, 8), tree(10, 13),
      tree(20, 13), tree(2, 19), tree(15, 21),
      furniture("pond", 28, 11, 3, 3, [28, 11, 3, 3], "ground.water"),
    ],
    entities: [
      ...buildings.map(building => door(building.scene, building.name, building.x + 3, building.y + 5, building.scene, [8, 10])),
      npc("nugget", "Professor Nugget", 19, 17, "professor"),
      npc("rival", "Your rival", 24, 9, "rival"),
      npc("kaid", "Kaid", 11, 9, "kaid"),
      item("route", "Forest route · Liarsville", 30, 17, "route"),
      item("townSign", "Rootport directory", 8, 17, "directory"),
    ],
  },
  critz: shop("Critz", "shop-critz", "shopkeeper"),
  vet: shop("Vet", "shop-vet", "doctor"),
  pharmacy: shop("Drug Store", "shop-pharmacy", "doctor"),
  bike: shop("Bike Shop", "shop-bike", "shopkeeper"),
  glass: shop("Glow n’ Blow", "shop-glass", "glassblower"),
  kaidHome: {
    name: "Kaid’s home", w: 16, h: 12, style: "house", safeSpawn: [8, 10],
    objects: [
      furniture("sofa", 2, 4, 4, 2, [2, 5, 4, 1]),
      furniture("table", 8, 5, 3, 2, [8, 6, 3, 1]),
      furniture("shelf", 10, 2, 3, 2, [10, 3, 3, 1]),
    ],
    entities: [npc("kaid", "Kaid", 6, 7, "kaid"), door("exit", "Rootport", 8, 11, "town", [15, 8])],
  },
  rivalHome: {
    name: "Your rival’s home", w: 16, h: 12, style: "house", safeSpawn: [8, 10],
    objects: [
      furniture("sofa", 2, 4, 4, 2, [2, 5, 4, 1]),
      furniture("tank", 10, 2, 3, 3, [10, 3, 3, 2]),
      furniture("table", 6, 7, 3, 2, [6, 8, 3, 1]),
    ],
    entities: [
      npc("rivalMom", "Rival’s mom", 4, 7, "mom"),
      npc("rivalDad", "Rival’s dad", 11, 7, "adult"),
      door("exit", "Rootport", 8, 11, "town", [25, 8]),
    ],
  },
};

// Runtime maps use the approved master tileset; old interior/story layouts remain.
for (const [id, map] of Object.entries(overworldMaps)) {
  const existing = scenes[id] || {name:id === 'forest' ? 'Mossway · forest route' : 'Liarsville', entities:[]};
  scenes[id] = {...existing, w:map.w, h:map.h, safeSpawn:map.safeSpawn, style:'outdoor', map, objects:map.objects};
}
scenes.town.entities = [
  ...buildings.map(b=>door(b.scene,b.name,b.doorX,b.doorY,b.scene,[8,10])),
  npc('nugget','Professor Nugget',22,24,'professor'),
  npc('rival','Your rival',30,13,'rival'), npc('kaid','Kaid',16,12,'kaid'),
  door('route','North · Mossway / Liarsville',21,2,'forest',[13,31]),
  item('townSign','Rootport directory',14,26,'directory'),
  door('lukeGreenhouse',"Luke’s Greenhouse",15,25,'greenhouseGrounds',[6,10]),
  {...item('spring','The Founders’ Spring',20,17),text:'Before these lanes had names, families shared this spring. The fountain still feeds the gardens; the old stone channel carries its overflow to Mossway.'},
];
scenes.forest.entities = [
  door('south','South · Rootport',13,32,'town',[21,3]),
  door('north','North · Liarsville',13,2,'liarsville',[14,28]),
  {...item('hollowLog','A fallen tree, still full of life',6,23),text:'Rain gathers in the hollow. Beetle tunnels and pale mushrooms thread the old wood. A fallen tree can shelter a whole neighborhood. Leave this little home where it is.'},
  {...item('spillway','The old spillway',19,12),text:'The stones once guided water toward Liarsville’s mill. Ferns now fill the joints, and the pool belongs to reeds and dragonflies.'},
  {...item('milepost','The northbound path',11,6),text:'NORTH — LIARSVILLE. SOUTH — ROOTPORT. Step through the meadow, then follow the bend beside the old spillway.'},
];
scenes.liarsville.entities = [
  door('south','South · Mossway / Rootport',14,29,'forest',[13,3]),
  door('waterworks','The old waterworks · local history',8,10,'waterworks',[8,9]),
  {...item('millHouse','Millkeeper’s house',28,11),text:'A brass plaque reads: “We kept the water moving; the town kept us fed.” Someone still polishes it. The family is out tending the riverbank.'},
  {...item('cottage','Gardener’s cottage',6,26),text:'Bundles of dried herbs hang inside the window. A note says: “At the shared beds. Please leave the gate as you found it.”'},
  {...item('seeds','The seed library',27,28),text:'Take a seed, grow a story, bring a seed back. Liarsville’s families keep the old mill garden together. Today’s seed exchange has finished.'},
  {...item('townStory','Why Liarsville?',18,18),text:'The old mill clock never agreed with the river bell. Each keeper insisted the other was lying. The teasing name stayed long after the mill retired; the neighbors stayed friends.'},
];
scenes.waterworks = {
  name:'Liarsville · the old waterworks',w:16,h:12,style:'house',safeSpawn:[8,9],
  objects:[furniture('shelf',2,2,3,2,[2,3,3,1]),furniture('shelf',10,2,3,2,[10,3,3,1]),furniture('table',6,5,3,2,[6,6,3,1])],
  entities:[door('exit','Liarsville',8,11,'liarsville',[8,11]),
    {...item('ledger','The gardeners’ ledger',3,4),text:'The first ledger lists repairs beside gifts of carrots, bread and seedlings. The waterworks belonged to the people who cared for it.'},
    {...item('model','A model of the old watercourse',7,7),text:'Spring, channel, mill, garden. When the mill closed, the town opened its side channels again. Slow water and planted banks brought the insects back.'},
    {...item('bell','Two clocks, one town',11,4),text:'A faded invitation: “Meet at noon, whichever clock you trust. Bring something to share.” A tradition worth keeping.'}],
};

scenes.greenhouseGrounds={name:'Luke’s Greenhouse · garden',w:13,h:13,style:'greenhouse',safeSpawn:[6,10],objects:[{kind:'greenhouse',sprite:'luke-greenhouse',x:1,y:2,w:11,h:6,collision:[1,2,11,6]}],entities:[{...item('greenhouse',"Luke’s Greenhouse · enter",6,8,'greenhouse'),entryFacing:'up'},door('exit','Rootport',6,12,'town',[15,26])]};

for(const t of FRUIT_TREES)scenes[t.scene].entities.push({...item(t.id,'Shake apple tree',t.x,t.y+1,'fruitTree'),interactionCells:fruitCells(t)});
for(const t of TANOSHI)scenes[t.scene].entities.push({...t,type:'tanoshi'});

// Every entrance declares its travel direction, including outdoor gates.
for (const scene of Object.values(scenes)) for (const e of scene.entities) {
  if (e.type !== 'door' || e.entryFacing) continue;
  e.entryFacing = scene.map
    ? (['gate','south'].includes(e.id) ? 'down' : 'up')
    : 'down';
}

export function getEntities(state) {
  const list = scenes[state.scene].entities.filter(entity => entity.type !== "rescue" || (state.stage === "morning" && !state.flags.rescued.includes(entity.id)));
  const visible = state.scene === "bedroom" && state.stage === "night" ? list.filter(entity => entity.type==='tanoshi' || ["tank", "desk", "sleep"].includes(entity.id)) : list;
  const bear=routeBear(state);if(bear)visible.push(bear);
  return visible.map(entity => actorEntity(state, entity.id === "rival" ? { ...entity, name: state.rival } : entity.id === "tank" && state.stage === "night" ? { ...entity, name: "Feed Pebble the gecko" } : entity));
}

// A acts on the current/adjacent cardinal cell; it cannot reach diagonally
// through a furniture corner. Facing breaks ties without hiding nearby actions.
export function nearestEntity(state, entities = getEntities(state)) {
  const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[state.player.facing] || [0, 0];
  let best = null, rank = Infinity;
  for (const entity of entities) {
    if (entity.stair && (state.player.x !== entity.stair.approach[0] ||
        state.player.y !== entity.stair.approach[1] || state.player.facing !== entity.entryFacing)) continue;
    for(const [x,y]of entity.interactionCells||[[entity.x,entity.y]]){
      const dx=x-state.player.x,dy=y-state.player.y,distance=Math.abs(dx)+Math.abs(dy);
      if(distance>1)continue;
      const score=distance-(dx===facing[0]&&dy===facing[1]?0.25:0);
      if(score<rank){best=entity.interactionCells?{...entity,x,y}:entity;rank=score;}
    }
  }
  return best;
}

const contains = (rect, x, y) => rect && x >= rect[0] && y >= rect[1] && x < rect[0] + rect[2] && y < rect[1] + rect[3];
export function isBlocked(sceneId, x, y, state) {
  const scene = scenes[sceneId];
  if (!scene || !Number.isInteger(x) || !Number.isInteger(y)) return true;
  const top = scene.map ? (sceneId === "yard" ? 4 : 1) : 3;
  if (x < 1 || x >= scene.w || y < 0 || y >= scene.h) return true;
  if (y < top && !scene.map?.portals.some(p => p.x === x && p.y === y)) return true;
  if (scene.map) { if (scene.map.solid.has(`${x},${y}`)) return true; }
  else if (scene.objects.some(object => contains(object.collision, x, y))) return true;
  if (scene.entities.some(e => e.stair && contains(e.stair.footprint, x, y) &&
      (x !== e.x || y !== e.y || (sceneId === 'bedroom' && state?.stage === 'night')))) return true;
  if (scene.style === "town" && buildings.some(building => contains(building.collision, x, y))) return true;
  return !!state && getEntities(state.scene===sceneId?state:{ ...state, scene: sceneId }).some(entity => ['npc','routeBlocker'].includes(entity.type) && (contains(entity.collision, x, y) || (entity.reserved?.[0]===x && entity.reserved?.[1]===y)));
}

export function fenceCrossing(sceneId,from,to){const map=scenes[sceneId]?.map;return !!map&&crossesFence(from,to,(x,y)=>{const o=map.objects.find(o=>o.kind==='fence'&&o.x===x&&o.y===y);return o?Number(o.id.split('.')[1]):null;});}
export function canStep(state, x, y) {
  if (isBlocked(state.scene, x, y, state)||fenceCrossing(state.scene,state.player,{x,y})) return false;
  for (const e of scenes[state.scene].entities.filter(e => e.stair)) {
    const [ax, ay] = e.stair.approach;
    if (x === e.x && y === e.y && (state.player.x !== ax || state.player.y !== ay)) return false;
    // Also allow a safe retreat for a caller already standing on the warp.
    if (state.player.x === e.x && state.player.y === e.y && (x !== ax || y !== ay)) return false;
  }
  return true;
}

// Recover only to the connected floor region containing the authored safe
// spawn. Scanning an arbitrary nearby free tile could strand a player behind
// new furniture. Selection is deterministic; no timers, I/O or story mutation.
export function safeGridPosition(sceneId, x, y, state) {
  const scene = scenes[sceneId];
  if (!scene) throw new RangeError(`Unknown scene: ${sceneId}`);
  // Old saves could stand anywhere on the stair art. Recover to its authored
  // landing, preserving every nonposition field and avoiding an immediate warp.
  const stair = scene.entities.find(e => e.stair && contains(e.stair.footprint, x, y));
  if (stair && !isBlocked(sceneId, ...stair.stair.approach, state))
    return { x: stair.stair.approach[0], y: stair.stair.approach[1] };
  const [sx, sy] = scene.safeSpawn;
  if (isBlocked(sceneId, sx, sy, state)) throw new Error(`Blocked safe spawn: ${sceneId}`);
  const targetX = Number.isFinite(x) ? x : sx, targetY = Number.isFinite(y) ? y : sy;
  const queue = [[sx, sy]], visited = new Set([`${sx},${sy}`]);
  let best = { x: sx, y: sy }, distance = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const [cx, cy] = queue[i];
    const d = (cx - targetX) ** 2 + (cy - targetY) ** 2;
    if (d < distance || (d === distance && (cy < best.y || (cy === best.y && cx < best.x)))) { best = { x: cx, y: cy }; distance = d; }
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const nx = cx + dx, ny = cy + dy, key = `${nx},${ny}`;
      if (!visited.has(key) && !isBlocked(sceneId, nx, ny, state)&&!fenceCrossing(sceneId,{x:cx,y:cy},{x:nx,y:ny})) { visited.add(key); queue.push([nx, ny]); }
    }
  }
  return best;
}

export function transition(state, entity) {
  if (entity.type !== "door" || !scenes[entity.to]) throw new Error("Invalid scene transition.");
  const previous = state.scene;
  if(northOfBear(state))state.liarsvilleBearAccess=true;
  state.scene = entity.to;
  let [x, y] = entity.spawn;
  // Every Rootport exterior has one explicit centered threshold. Returning
  // from any shop/home places the player one cell below that same threshold.
  if (state.scene === "town") {
    const building = buildings.find(candidate => candidate.scene === previous);
    if (building) { x = building.doorX; y = building.doorY + 1; }
  }
  state.player = { ...state.player, ...safeGridPosition(state.scene, x, y, state), facing: ["route","north"].includes(entity.id) ? "up" : "down" };
  if (!state.flags.visited.includes(state.scene)) state.flags.visited.push(state.scene);
}
