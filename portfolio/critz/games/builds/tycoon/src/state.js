import {normalize as normalizeGreenhouse} from '../art-review/greenhouse-state.js';
import {validDayClock} from './day-clock.js';
import {validFruitSave} from './fruit-trees.js';
import {validTanoshiSave} from './tanoshi.js';
export const SAVE_KEY = "critz-tycoon.save.v1";
export const PRE_WORLD_KEY = SAVE_KEY + ".pre-world-2";
export const PRE_WORLD_BACKUP_KEY = SAVE_KEY + ".pre-world-2.backup";
export const BACKUP_KEY = SAVE_KEY + ".backup";
// Immutable recovery snapshots from before the coordinate-grid conversion.
export const PRE_GRID_KEY = SAVE_KEY + ".pre-grid";
export const PRE_GRID_BACKUP_KEY = SAVE_KEY + ".pre-grid.backup";
export const SCHEMA = 1;
export const HOUR_SECONDS = 8;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const round = (n) => Math.round(n * 10) / 10;
export const dollars = (cents) => "$" + (cents / 100).toFixed(2);
export const rescueInfo = {
  gecko: {
    name: "Pebble the gecko",
    location: "Bedroom · behind the fern",
    description:
      "A crepuscular hunter. Needs a ventilated, species-appropriate habitat, heat, fresh water, and live food. Resting safely with the Vet during this slice.",
  },
  snail: {
    name: "Button the garden snail",
    location: "House · beside the bookshelf",
    description:
      "A land snail with a honey-colored whorl. Button explores one feeler at a time, then takes the long way around a leaf. Needs suitable food, calcium, moisture, and ventilation. Resting in a separate care box at the Vet.",
  },
  isopods: {
    name: "A family of 6 isopods",
    location: "Yard · under the old log",
    description:
      "Leaf-litter recyclers. Prefer moisture with some drier retreats. In this simplified habitat, they thrive near 55–80% moisture.",
  },
  springtails: {
    name: "12 tiny springtails",
    location: "Yard · in the leaf pile",
    description:
      "Small decomposers that graze on fungi and organic matter. Moist substrate helps them thrive; ventilation still matters.",
  },
};
export function createState(hero = "Hero", gender = "boy", rival = "Rowan") {
  return {
    version: SCHEMA,
    gridVersion: 1,
    worldVersion: 2,
    liarsvilleBearAccess: false,
    hero: hero.trim().slice(0, 16) || "Hero",
    gender,
    rival: rival.trim().slice(0, 16) || "Rowan",
    stage: "night",
    scene: "bedroom",
    player: { x: 8, y: 6, facing: "up" },
    money: 1200,
    debt: 0,
    time: 8,
    tankOwned: false,
    flags: {
      rescued: [],
      notebook: false,
      supplyGift: false,
      questReward: false,
      loanDecided: false,
      firstManage: false,
      metRival: false,
      visited: ["bedroom"],
    },
    inventory: { moss: 1, litter: 4, medicine: 0, filter: 0, apples: 0 },
    fruitHarvests: {},
    tank: {
      name: "Little Root",
      gallons: 25,
      type: "terrarium",
      moisture: 65,
      light: 8,
      ventilation: 2,
      plants: 2,
      algae: 4,
      nutrients: 45,
      waste: 8,
      microbes: 35,
      food: 30,
      isopods: 0,
      springtails: 0,
      births: 0,
      deaths: 0,
      stress: 0,
      hours: 0,
      history: [],
      events: [
        "Kaid’s 25-gallon tank: ventilated and ready for a fresh start.",
      ],
    },
    posts: [],
    nextPostId: 1,
    lifetimeEarned: 0,
    notebookEntries: [],
    savedAt: null,
  };
}
export function startMorning(s, acceptLoan) {
  if (s.flags.loanDecided) return;
  s.flags.loanDecided = true;
  s.tankOwned = true;
  if (acceptLoan) {
    s.money += 10000;
    s.debt = 10000;
  }
  s.dayClock={day:1,minute:360,remainder:0};
  s.stage = "morning";
  s.time = 8;
  s.scene = "bedroom";
  s.player = { x: 4, y: 7, facing: "down" };
}
export function rescue(s, id) {
  if (!rescueInfo[id] || s.flags.rescued.includes(id)) return false;
  s.flags.rescued.push(id);
  if (id === "isopods") s.tank.isopods += 6;
  if (id === "springtails") s.tank.springtails += 12;
  s.notebookEntries.push(
    `Found ${rescueInfo[id].name}. Safe and accounted for.`,
  );
  return true;
}
export function spend(s, cents) {
  if (!Number.isInteger(cents) || cents < 0 || s.money < cents) return false;
  s.money -= cents;
  return true;
}
export function manage(s, action, value) {
  const t = s.tank;
  if (!s.tankOwned)
    return { ok: false, message: "The starter tank arrives with Kaid." };
  let message;
  switch (action) {
    case "mist":
      t.moisture = clamp(t.moisture + 14, 0, 100);
      message = "A gentle mist. Moisture +14; watch it settle over time.";
      break;
    case "light":
      if (![4, 8, 12].includes(value)) return { ok: false };
      t.light = value;
      message = `Light set to ${value} hours a day.`;
      break;
    case "ventilation":
      if (![1, 2, 3].includes(value)) return { ok: false };
      t.ventilation = value;
      message = "Airflow adjusted. More air also means faster drying.";
      break;
    case "moss":
      if (s.inventory.moss < 1 || t.plants >= 6)
        return {
          ok: false,
          message: "You need moss and an open planting spot (6 maximum).",
        };
      s.inventory.moss--;
      t.plants++;
      message =
        "Moss planted. More shelter, moisture retention, and nutrient uptake.";
      break;
    case "feed":
      if (s.inventory.litter < 1)
        return {
          ok: false,
          message: "No leaf litter. Forage the yard or visit Critz.",
        };
      s.inventory.litter--;
      t.food = clamp(t.food + 25, 0, 100);
      t.waste = clamp(t.waste + 4, 0, 100);
      message =
        "Leaf litter added. Decomposers have food; excess litter adds waste.";
      break;
    case "clean":
      t.waste = Math.max(0, t.waste - 18);
      t.algae = Math.max(0, t.algae - 14);
      t.microbes = Math.max(0, t.microbes - 3);
      message =
        "Glass and excess waste cleaned. A few microbes were removed, too.";
      break;
    default:
      return { ok: false };
  }
  s.flags.firstManage = true;
  return { ok: true, message };
}
export function conditions(t) {
  const moisture = clamp(100 - Math.abs(67 - t.moisture) * 2.3, 0, 100);
  const food = Math.min(100, t.food * 5);
  const air = t.ventilation === 1 ? 60 : 100;
  const clean = clamp(100 - t.waste * 0.75, 0, 100);
  return {
    moisture,
    food,
    air,
    clean,
    activity: Math.round((moisture + food + air + clean) / 4),
  };
}
export function tick(s, count = 1) {
  if (s.stage !== "morning") return;
  for (let i = 0; i < count; i++) {
    s.time++;
    if (!s.tankOwned) continue;
    const t = s.tank;
    t.hours++;
    t.moisture = round(
      clamp(
        t.moisture - (0.65 + t.ventilation * 0.55) + t.plants * 0.15,
        0,
        100,
      ),
    );
    const microbialWork = t.microbes * 0.025 * clamp(t.moisture / 50, 0, 1);
    const consumption = t.isopods * 0.12 + t.springtails * 0.025;
    t.food = round(clamp(t.food - consumption, 0, 100));
    t.waste = round(
      clamp(
        t.waste +
          consumption * 0.6 +
          (t.food > 70 ? 2 : 0) -
          microbialWork -
          t.springtails * 0.025,
        0,
        100,
      ),
    );
    t.nutrients = round(
      clamp(t.nutrients + microbialWork * 0.9 - t.plants * 0.23, 0, 100),
    );
    t.microbes = round(
      clamp(t.microbes + (t.moisture > 40 && t.food > 0 ? 0.6 : -0.5), 5, 85),
    );
    t.algae = round(
      clamp(
        t.algae +
          (t.light - 7) * 0.3 +
          (t.moisture > 82 ? 0.5 : -0.35) -
          t.springtails * 0.008,
        0,
        100,
      ),
    );
    const c = conditions(t);
    const thriving =
      t.moisture >= 55 &&
      t.moisture <= 80 &&
      t.food >= 8 &&
      t.waste < 45 &&
      t.ventilation >= 2;
    t.stress = round(clamp(t.stress + (thriving ? -5 : 3), 0, 100));
    if (t.hours % 6 === 0 && thriving) {
      let born = 0;
      if (t.isopods > 0 && t.isopods < 24) {
        t.isopods++;
        born++;
      }
      if (t.springtails > 0 && t.springtails < 60) {
        const n = Math.min(3, 60 - t.springtails);
        t.springtails += n;
        born += n;
      }
      if (born) {
        t.births += born;
        t.events.unshift(
          `Hour ${t.hours}: ${born} births. Moisture, food, and airflow supported growth.`,
        );
      }
    }
    if (t.hours % 6 === 0 && !thriving)
      t.events.unshift(
        `Hour ${t.hours}: breeding paused. ${t.moisture < 55 ? "Substrate is too dry." : t.moisture > 80 ? "Substrate is too wet." : t.food < 8 ? "Leaf litter is running low." : t.ventilation < 2 ? "Airflow is too low." : "Waste needs attention."}`,
      );
    t.events = t.events.slice(0, 12);
    t.history.push({
      hour: t.hours,
      moisture: t.moisture,
      waste: t.waste,
      activity: c.activity,
      population: t.isopods + t.springtails,
    });
    t.history = t.history.slice(-24);
    for (const p of s.posts) {
      if (p.age >= 4) continue;
      p.age++;
      const views = Math.round(p.targetViews * (0.35 + p.age * 0.1625));
      const revenue = Math.floor(views * 0.12);
      const earned = revenue - p.revenue;
      s.money += earned;
      s.lifetimeEarned += earned;
      p.revenue = revenue;
      p.views = views;
      p.likes = Math.round((p.views * p.engagement) / 100);
      p.comments = Math.floor(p.likes / 18);
    }
  }
}
export function scorePost(s, { kind = "photo", frame = 50, zoom = 1 } = {}) {
  const t = s.tank;
  const c = conditions(t);
  const animals = t.isopods + t.springtails;
  const activity = animals ? c.activity : 12;
  const composition = Math.round(
    clamp(
      100 - Math.abs(frame - 55) * 1.3 - Math.abs(zoom - 1.2) * 45,
      15,
      100,
    ),
  );
  const appearance = Math.round(
    clamp(
      30 + t.plants * 11 + (t.hide ? 8 : 0) - t.algae * 0.45 - t.waste * 0.22,
      0,
      100,
    ),
  );
  const rarity = animals ? 25 : 10; // Common species remain common. No invented rarity rolls.
  const last = s.posts[0];
  const interest = last && s.time - last.createdAt < 6 ? 30 : 85;
  const total = Math.round(
    activity * 0.25 +
      composition * 0.2 +
      appearance * 0.25 +
      rarity * 0.1 +
      interest * 0.2,
  );
  const targetViews = Math.round(
    (120 + total * 22) * (kind === "video" ? 1.15 : 1),
  );
  return {
    activity,
    composition,
    appearance,
    rarity,
    interest,
    total,
    targetViews,
    engagement: round(2 + total * 0.075),
  };
}
export function publish(s, capture) {
  if (!capture || !["photo", "video"].includes(capture.kind)) return null;
  const scores = scorePost(s, capture);
  const views = Math.round(scores.targetViews * 0.35);
  const revenue = Math.floor(views * 0.12);
  const post = {
    id: s.nextPostId++,
    kind: capture.kind,
    image: capture.image || "",
    frame: capture.frame,
    zoom: capture.zoom,
    scores,
    createdAt: s.time,
    age: 0,
    views,
    targetViews: scores.targetViews,
    engagement: scores.engagement,
    likes: Math.round((views * scores.engagement) / 100),
    comments: Math.floor((views * scores.engagement) / 1800),
    revenue,
  };
  s.posts.unshift(post);
  s.posts = s.posts.slice(0, 12);
  s.money += revenue;
  s.lifetimeEarned += revenue;
  return post;
}
const sceneIds = [
  "forest", "liarsville", "waterworks", "greenhouseGrounds",
  "bedroom",
  "house",
  "yard",
  "town",
  "critz",
  "vet",
  "pharmacy",
  "bike",
  "glass",
  "kaidHome",
  "rivalHome",
];
function validNumber(n, min, max) {
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
}
export function validateState(s) {
  if(!validTanoshiSave(s)||s?.liarsvilleBearAccess!==undefined&&typeof s.liarsvilleBearAccess!=='boolean')return false;
  if(s?.lukeGreenhouse!==undefined){try{normalizeGreenhouse(s.lukeGreenhouse);}catch{return false;}}
  if(s?.dayClock!==undefined&&!validDayClock(s.dayClock))return false;
  if (
    !s ||
    s.version !== SCHEMA ||
    (s.gridVersion !== undefined && s.gridVersion !== 1) ||
    (s.worldVersion !== undefined && s.worldVersion !== 2) ||
    !["boy", "girl"].includes(s.gender) ||
    !["night", "morning"].includes(s.stage) ||
    !sceneIds.includes(s.scene)
  )
    return false;
  if (
    ![s.hero, s.rival].every(
      (x) => typeof x === "string" && x.length > 0 && x.length <= 16,
    )
  )
    return false;
  if (
    !validNumber(s.money, 0, 1e10) ||
    !validNumber(s.debt, 0, 10000) ||
    !validNumber(s.time, 0, 1e8) ||
    !validNumber(s.lifetimeEarned, 0, 1e10) ||
    !Number.isInteger(s.nextPostId)
  )
    return false;
  if (
    !s.player ||
    !validNumber(s.player.x, 0, s.worldVersion === 2 ? 44 : 32) ||
    !validNumber(s.player.y, 0, s.worldVersion === 2 ? 38 : 27) ||
    !["up", "down", "left", "right"].includes(s.player.facing)
  )
    return false;
  if (
    !s.flags ||
    !Array.isArray(s.flags.rescued) ||
    s.flags.rescued.some((x) => !Object.hasOwn(rescueInfo, x)) ||
    new Set(s.flags.rescued).size !== s.flags.rescued.length ||
    !Array.isArray(s.flags.visited)
  )
    return false;
  if (
    !s.inventory ||
    !["moss", "litter", "medicine", "filter"].every(
      (k) =>
        Number.isInteger(s.inventory[k]) &&
        s.inventory[k] >= 0 &&
        s.inventory[k] <= 10000,
    )
  )
    return false;
  if (!validFruitSave(s)) return false;
  const t = s.tank;
  if (
    !t ||
    t.gallons !== 25 ||
    ![
      "moisture",
      "algae",
      "nutrients",
      "waste",
      "microbes",
      "food",
      "stress",
    ].every((k) => validNumber(t[k], 0, 100))
  )
    return false;
  if (
    ![4, 8, 12].includes(t.light) ||
    ![1, 2, 3].includes(t.ventilation) ||
    !validNumber(t.plants, 0, 6) ||
    !validNumber(t.isopods, 0, 24) ||
    !validNumber(t.springtails, 0, 60) ||
    !validNumber(t.hours, 0, 1e8) ||
    !validNumber(t.births, 0, 1e8) ||
    t.deaths !== 0
  )
    return false;
  if (
    !Array.isArray(t.history) ||
    t.history.length > 24 ||
    t.history.some(
      (h) =>
        !h ||
        !validNumber(h.hour, 0, t.hours) ||
        !validNumber(h.moisture, 0, 100) ||
        !validNumber(h.population, 0, 84),
    ) ||
    !Array.isArray(t.events) ||
    t.events.some((e) => typeof e !== "string")
  )
    return false;
  if (
    !Array.isArray(s.posts) ||
    s.posts.length > 12 ||
    s.posts.some(
      (p) =>
        !p ||
        !["photo", "video"].includes(p.kind) ||
        !validNumber(p.views, 0, 1e8) ||
        !validNumber(p.revenue, 0, 1e8) ||
        !validNumber(p.age, 0, 4) ||
        !validNumber(p.targetViews, p.views, 1e8) ||
        !validNumber(p.engagement, 0, 100) ||
        !validNumber(p.createdAt, 0, s.time) ||
        typeof p.image !== "string" ||
        p.image.length > 250000 ||
        (p.image !== "" &&
          !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.image)) ||
        !validNumber(p.likes, 0, 1e8) ||
        !validNumber(p.comments, 0, 1e8) ||
        !Number.isInteger(p.id),
    )
  )
    return false;
  if (
    !Array.isArray(s.notebookEntries) ||
    s.notebookEntries.some((e) => typeof e !== "string") ||
    typeof s.tankOwned !== "boolean"
  )
    return false;
  return true;
}
export function save(s, storage = localStorage) {
  try {
    if (!validateState(s)) throw new Error("Invalid state");
    const previous = storage.getItem(SAVE_KEY);
    if (s.gridVersion === 1) {
      // Preserve exact original bytes once, before either normal save slot is
      // overwritten. A failed recovery write aborts the save, retaining v1.
      for (const [key, archive] of [[SAVE_KEY, PRE_GRID_KEY], [BACKUP_KEY, PRE_GRID_BACKUP_KEY]]) {
        const raw = storage.getItem(key);
        if (!raw || storage.getItem(archive)) continue;
        let old;
        try { old = JSON.parse(raw); } catch { continue; }
        if (validateState(old) && old.gridVersion !== 1) storage.setItem(archive, raw);
      }
    }
    if (s.worldVersion === 2) {
      for (const [key, archive] of [[SAVE_KEY, PRE_WORLD_KEY], [BACKUP_KEY, PRE_WORLD_BACKUP_KEY]]) {
        const raw = storage.getItem(key);
        if (!raw || storage.getItem(archive)) continue;
        let old; try { old = JSON.parse(raw); } catch { continue; }
        // Pre-grid archives above already preserve fractional v1 saves.
        if (validateState(old) && old.gridVersion === 1 && old.worldVersion !== 2) storage.setItem(archive, raw);
      }
    }
    let previousState;
    if (previous) {
      try { previousState = JSON.parse(previous); }
      catch { /* A malformed primary must not replace the last good backup. */ }
    }
    // Storage errors must escape to the outer guard: replacing the primary
    // after failing to retain its valid prior state would lose recovery data.
    if (validateState(previousState)) storage.setItem(BACKUP_KEY, previous);
    const savedAt = new Date().toISOString();
    storage.setItem(SAVE_KEY, JSON.stringify({ ...s, savedAt }));
    // A failed write is not a successful in-memory save either.
    s.savedAt = savedAt;
    return true;
  } catch {
    return false;
  }
}
export function load(storage = localStorage) {
  let damaged = false;
  for (const key of [SAVE_KEY, BACKUP_KEY, PRE_WORLD_KEY, PRE_WORLD_BACKUP_KEY, PRE_GRID_KEY, PRE_GRID_BACKUP_KEY]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (validateState(state)) return { state, recovered: key !== SAVE_KEY };
      damaged = true;
    } catch {
      damaged = true;
    }
  }
  return { state: null, damaged };
}
export function objective(s) {
  if (s.stage === "night") return "Feed Pebble. Press A beside the tank.";
  if (s.flags.rescued.length < 4)
    return `Find your little escapees · ${s.flags.rescued.length}/4 safe. Look for sparkles.`;
  if (!s.flags.notebook) return "Meet Professor Nugget outside the Vet.";
  if (!s.flags.firstManage) return "Your bedroom tank is ready. Try Manage.";
  if (!s.posts.length)
    return "Frame your first tank photo in View, then post to Critter.";
  if (!s.flags.questReward)
    return "Tell Professor Nugget all four animals are safe.";
  return "A little world, growing. Care, explore, and share on Critter.";
}
