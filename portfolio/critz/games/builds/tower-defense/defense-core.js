/* Shared combat rules. World adapters own physics, inventory and settlement routes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TowerDefense = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const structures = {
    armory: {
      name: "Armory",
      w: 4,
      h: 4,
      cost: { wood: 20, stone: 10, ironIngot: 3 },
      capacity: 500,
      note: "Stores weapons and ammunition. Equip Fey and assign defensive posts.",
    },
    ballista: {
      name: "Ballista",
      w: 3,
      h: 2,
      cost: { wood: 16, ironIngot: 4 },
      range: 640,
      min: 40,
      reload: 4200,
      damage: 18,
      ammo: "bolt",
      pierce: 3,
      speed: 650,
      note: "Piercing bolts. Clear firing lane; one operator.",
    },
    catapult: {
      name: "Catapult",
      w: 3,
      h: 3,
      cost: { wood: 20, stone: 8, ironIngot: 2 },
      range: 650,
      min: 150,
      reload: 5500,
      damage: 13,
      ammo: "stone",
      arc: true,
      splash: 64,
      note: "Arcing stones scatter groups. Cannot fire close.",
    },
    trebuchet: {
      name: "Trebuchet",
      w: 5,
      h: 4,
      cost: { wood: 40, stone: 25, ironIngot: 6 },
      range: 1200,
      min: 300,
      reload: 10000,
      damage: 38,
      ammo: "stone",
      costPerShot: 3,
      arc: true,
      splash: 85,
      heavy: true,
      note: "Long-range siege. Needs a broad stone foundation and clear arm space.",
    },
    oilDropper: {
      name: "Oil dropper",
      w: 2,
      h: 2,
      cost: { wood: 8, ironIngot: 6 },
      range: 250,
      min: 0,
      reload: 6500,
      damage: 8,
      ammo: "oilCharge",
      drop: true,
      splash: 42,
      burn: 5000,
      note: "Tips hot oil over the selected edge. Can also drop sap or water.",
    },
    rockChute: {
      name: "Rock chute",
      w: 2,
      h: 2,
      cost: { wood: 8, stone: 6 },
      range: 320,
      min: 0,
      reload: 4000,
      damage: 14,
      ammo: "stone",
      drop: true,
      splash: 30,
      note: "Drops a stone load straight down. Needs an exposed edge.",
    },
    repeatingCrossbow: {
      name: "Repeating crossbow",
      w: 2,
      h: 2,
      cost: { wood: 15, ironIngot: 5 },
      range: 440,
      min: 20,
      reload: 650,
      damage: 4,
      ammo: "bolt",
      speed: 700,
      note: "Rapid bolts for swarms and flyers; weak against armor.",
    },
    hangingRam: {
      name: "Hanging ram",
      w: 3,
      h: 3,
      cost: { wood: 18, ironIngot: 3 },
      range: 100,
      min: 0,
      reload: 3500,
      damage: 20,
      ammo: null,
      ram: true,
      note: "A swinging log knocks nearby attackers back. Keep its swing clear.",
    },
    brambleLauncher: {
      name: "Bramble launcher",
      w: 2,
      h: 2,
      cost: { wood: 15, leaves: 12, ironIngot: 2 },
      range: 450,
      min: 80,
      reload: 4500,
      damage: 2,
      ammo: "seedPod",
      arc: true,
      splash: 55,
      slow: 6000,
      note: "Seed pods make temporary slowing tangles.",
    },
    stormCrystal: {
      name: "Storm crystal",
      w: 2,
      h: 3,
      cost: { stone: 20, copperIngot: 8, goldIngot: 2 },
      range: 380,
      min: 0,
      reload: 3000,
      damage: 10,
      ammo: null,
      magic: true,
      chain: 4,
      note: "Charged lightning jumps between nearby enemies.",
    },
    wardLantern: {
      name: "Ward lantern",
      w: 2,
      h: 2,
      cost: { wood: 10, copperIngot: 5, goldIngot: 1 },
      range: 180,
      min: 0,
      reload: 6000,
      damage: 0,
      ammo: null,
      magic: true,
      ward: true,
      note: "A charged ward protects nearby defenders and tower blocks.",
    },
  };
  const items = {
    sword: { name: "Sword", inputs: { wood: 2, ironIngot: 2 }, n: 1 },
    shield: { name: "Shield", inputs: { wood: 4, ironIngot: 1 }, n: 1 },
    bow: { name: "Bow", inputs: { wood: 5 }, n: 1 },
    arrow: { name: "Arrows", inputs: { wood: 2, stone: 1 }, n: 20 },
    bolt: { name: "Bolts", inputs: { wood: 3, ironIngot: 1 }, n: 12 },
    fireStaff: {
      name: "Fire staff",
      inputs: { wood: 4, copperIngot: 2, coal: 2 },
      n: 1,
    },
    frostStaff: {
      name: "Frost staff",
      inputs: { wood: 4, copperIngot: 2, stone: 3 },
      n: 1,
    },
    lightningStaff: {
      name: "Lightning staff",
      inputs: { wood: 4, copperIngot: 3, goldIngot: 1 },
      n: 1,
    },
    healingStaff: {
      name: "Healing staff",
      inputs: { wood: 4, copperIngot: 2, leaves: 8 },
      n: 1,
    },
    seedPod: { name: "Seed pods", inputs: { wood: 1, leaves: 4 }, n: 10 },
    sapCharge: { name: "Sticky sap", inputs: { wood: 2, leaves: 3 }, n: 3 },
    oilCharge: { name: "Oil load", liquid: "oil" },
    waterCharge: { name: "Water load", liquid: "water" },
  };
  const roles = {
    sword: { gear: ["sword", "shield"], range: 42, reload: 900, damage: 7 },
    bow: { gear: ["bow"], range: 360, reload: 1600, damage: 6, ammo: "arrow" },
    fire: {
      gear: ["fireStaff"],
      range: 300,
      reload: 2000,
      damage: 9,
      magic: true,
      burn: 3000,
    },
    frost: {
      gear: ["frostStaff"],
      range: 280,
      reload: 2200,
      damage: 4,
      magic: true,
      slow: 4000,
    },
    lightning: {
      gear: ["lightningStaff"],
      range: 280,
      reload: 2400,
      damage: 7,
      magic: true,
      chain: 3,
    },
    healing: {
      gear: ["healingStaff"],
      range: 220,
      reload: 2400,
      damage: 0,
      magic: true,
      heal: 8,
    },
  };
  const enemyTypes = {
    raider: { hp: 28, speed: 43, damage: 1, range: 34, reload: 1500, armor: 0 },
    climber: {
      hp: 24,
      speed: 36,
      damage: 1,
      range: 36,
      reload: 1800,
      armor: 0,
      climb: true,
    },
    flyer: {
      hp: 18,
      speed: 55,
      damage: 1,
      range: 38,
      reload: 1500,
      armor: 0,
      fly: true,
    },
    armored: {
      hp: 60,
      speed: 27,
      damage: 2,
      range: 38,
      reload: 1800,
      armor: 3,
    },
    giant: {
      hp: 180,
      speed: 20,
      damage: 3,
      range: 65,
      reload: 2500,
      armor: 2,
      size: 2,
    },
    siege: {
      hp: 100,
      speed: 15,
      damage: 3,
      range: 850,
      min: 260,
      reload: 7500,
      armor: 2,
    },
  };
  const finite = (n, d = 0) => (Number.isFinite(n) ? n : d),
    cap = (n, a, b) => Math.max(a, Math.min(b, n)),
    distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function segment(a, b, r) {
    let lo = 0,
      hi = 1;
    for (const axis of ["x", "y"]) {
      const d = b[axis] - a[axis];
      if (Math.abs(d) < 1e-8) {
        if (a[axis] < r.min[axis] || a[axis] > r.max[axis]) return null;
        continue;
      }
      let u = (r.min[axis] - a[axis]) / d,
        v = (r.max[axis] - a[axis]) / d;
      if (u > v) [u, v] = [v, u];
      lo = Math.max(lo, u);
      hi = Math.min(hi, v);
      if (lo > hi) return null;
    }
    return lo;
  }
  function trajectory(a, b, arc = false, speed = 650) {
    const t = arc
        ? cap(Math.abs(b.x - a.x) / 280, 0.6, 2.7)
        : Math.max(0.08, distance(a, b) / speed),
      g = arc ? 240 : 0;
    return {
      vx: (b.x - a.x) / t,
      vy: (b.y - a.y) / t - (g * t) / 2,
      g,
      life: t + 1,
    };
  }
  function create(api) {
    let state = {
      version: 1,
      time: 0,
      next: 1,
      wave: 0,
      phase: "peace",
      phaseTime: 0,
      spawn: 0,
      queue: [],
      enemies: [],
      shots: [],
      fields: [],
      orders: {},
      stations: {},
      kills: 0,
      outcome: "Ready",
      anchor: null,
    };
    let actorCache = null;
    const actors = () => actorCache || api.actors(),
      buildings = () => api.buildings(),
      getActor = (id) => actors().find((a) => a.id === id),
      getBuilding = (id) => buildings().find((b) => b.id === id),
      stock = (b) => api.stock(b),
      near = (a, b, r = 30) => distance(a, b) < r;
    const station = (b) =>
      state.stations[b.id] ||
      (state.stations[b.id] = {
        facing: 1,
        priority: "auto",
        load: "oilCharge",
        cooldown: 0,
        charge: 100,
        ward: 0,
        status: "Needs crew",
      });
    const point = (b) => api.stationPoint(b),
      door = (b, a) => api.door(b, a),
      busy = () => ["warning", "battle"].includes(state.phase);
    function order(id, options = {}) {
      const a = getActor(id);
      if (
        !a ||
        (!a.fey && options.job !== "Supply" && options.job !== "Repair")
      )
        return false;
      let o = state.orders[id];
      if (!o)
        o = state.orders[id] = {
          role: "bow",
          alarm: true,
          job: "Defend",
          post: { x: a.x, y: a.y },
          gear: [],
          ammo: 0,
          hp: 35,
          charge: 100,
          cooldown: 0,
          stun: 0,
          active: false,
        };
      if (options.role && !roles[options.role]) return false;
      if (options.job && !["Defend", "Supply", "Repair"].includes(options.job))
        return false;
      if (options.job && options.job !== "Defend" && o.gear.length)
        o.returning = true;
      if (options.role && options.role !== o.role && o.gear.length) {
        o.pendingRole = options.role;
        o.returning = true;
      } else if (options.role) o.role = options.role;
      for (const k of ["alarm", "job", "station", "helper"])
        if (options[k] !== undefined) o[k] = options[k];
      if (
        options.post &&
        [options.post.x, options.post.y].every(Number.isFinite)
      )
        o.post = { ...options.post };
      const wasActive = o.active;
      o.active = options.active ?? (!o.alarm || busy());
      if (o.active && !wasActive) {
        const previous = api.suspendTask(id);
        o.previous = o.previous || previous;
      }
      reserve(id, o);
      api.changed();
      return true;
    }
    function refundCargo(o) {
      if (o.cargo) {
        api.refund(o.cargo.item, o.cargo.n, o.cargo.source);
        o.cargo = null;
      }
    }
    function giveBack(o) {
      for (const k of o.gear) api.refund(k, 1, o.source);
      o.gear = [];
      if (o.ammo) api.refund("arrow", o.ammo, o.source);
      o.ammo = 0;
      refundCargo(o);
      o.source = null;
      o.reservation = null;
      o.returning = false;
      if (o.pendingRole) {
        o.role = o.pendingRole;
        delete o.pendingRole;
      }
      api.changed();
    }
    function remove(id) {
      const o = state.orders[id];
      if (!o) return;
      giveBack(o);
      api.restoreTask(id, o.previous);
      delete state.orders[id];
      api.changed();
    }
    function availableEquipment(b, owner, item) {
      const reserved = Object.entries(state.orders).filter(
        ([id, o]) =>
          id !== owner &&
          o.reservation?.source === b.id &&
          o.reservation.gear.includes(item),
      ).length;
      return (stock(b)[item] || 0) - reserved;
    }
    function reserve(id, o) {
      if (o.gear.length || o.job !== "Defend") return;
      const d = roles[o.pendingRole || o.role],
        b = buildings().find(
          (b) =>
            b.type === "armory" &&
            d.gear.every((k) => availableEquipment(b, id, k) > 0),
        );
      o.reservation = b ? { source: b.id, gear: [...d.gear] } : null;
    }
    function equip(a, o) {
      const role = roles[o.role],
        armories = buildings().filter((b) => b.type === "armory");
      if (!armories.length) {
        o.status = "Needs Armory";
        return false;
      }
      const available = (b) =>
          role.gear.every((k) => availableEquipment(b, a.id, k) > 0),
        b = armories
          .filter(available)
          .sort((b, c) => distance(a, door(b, a)) - distance(a, door(c, a)))[0];
      if (!b) {
        o.status = "Needs " + role.gear.join(" + ");
        return false;
      }
      if (!near(a, door(b, a), 36)) {
        api.move(a, door(b, a));
        o.status = "Collecting equipment";
        return false;
      }
      for (const k of role.gear) {
        stock(b)[k]--;
        o.gear.push(k);
      }
      o.source = b.id;
      o.reservation = null;
      o.status = "Equipped";
      api.changed();
      return true;
    }
    function begin() {
      if (busy() || state.phase === "recovery") return false;
      const anchor = api.anchor();
      if (!anchor) return false;
      state.wave++;
      state.anchor = anchor;
      state.phase = "warning";
      state.phaseTime = 12000;
      state.outcome = "Incoming";
      state.spawn = 0;
      const roster = [
        "raider",
        ...(state.wave >= 2 ? ["climber", "flyer"] : []),
        ...(state.wave >= 3 ? ["armored"] : []),
        ...(state.wave >= 4 ? ["siege", "giant"] : []),
      ];
      state.queue = Array.from(
        { length: Math.min(36, 4 + state.wave * 2) },
        (_, i) => roster[i % roster.length],
      );
      for (const [id, o] of Object.entries(state.orders)) {
        o.active = true;
        o.returning = false;
        const a = getActor(id);
        if (a) {
          const previous = api.suspendTask(id);
          o.previous = o.previous || previous;
        }
      }
      api.event("alarm", anchor);
      api.changed();
      return true;
    }
    function spawn(kind, position) {
      if (!enemyTypes[kind] || state.enemies.length >= 64) return null;
      const t = enemyTypes[kind],
        e = {
          id: state.next++,
          kind,
          x: position.x,
          y: position.y,
          hp: t.hp,
          cooldown: 0,
          slow: 0,
          burn: 0,
          age: 0,
        };
      state.enemies.push(e);
      api.spawn?.(e);
      return e;
    }
    function damage(e, n, opts = {}) {
      if (!e || e.hp <= 0) return;
      const t = enemyTypes[e.kind];
      e.hp -= Math.max(opts.pierce ? 0 : 0.5, n - (opts.pierce ? 0 : t.armor));
      if (opts.slow) e.slow = Math.max(e.slow, opts.slow);
      if (opts.burn) e.burn = Math.max(e.burn, opts.burn);
      if (opts.knock) api.knock?.(e, opts.knock);
      if (e.hp <= 0) {
        state.kills++;
        api.removeEnemy?.(e);
        api.event("defeat", e);
      } else api.event("hit", e);
    }
    function wardAt(p) {
      return buildings().some(
        (b) =>
          structures[b.type]?.ward &&
          station(b).ward > 0 &&
          distance(p, point(b)) < structures[b.type].range,
      );
    }
    function hurtActor(a, n) {
      const o = state.orders[a.id];
      if (!o || o.stun > 0) return;
      if (wardAt(a)) n *= 0.4;
      if (o.gear.includes("shield")) n *= 0.55;
      o.hp -= n;
      if (o.hp <= 0) {
        o.hp = 1;
        o.stun = 12000;
        o.returning = true;
        api.event("hurt", a);
      }
    }
    function worldHit(target, n) {
      if (wardAt(target)) n *= 0.4;
      api.damageWorld(target, n);
      api.changed();
    }
    function choose(
      from,
      candidates,
      range,
      min = 0,
      priority = "nearest",
      facing = 0,
    ) {
      return candidates
        .filter(
          (e) =>
            e.hp > 0 &&
            distance(from, e) <= range + Math.max(0, e.y - from.y) * 0.4 &&
            distance(from, e) >= min &&
            (!facing || (e.x - from.x) * facing >= -8),
        )
        .sort((a, b) => {
          const score = (e) =>
            priority === "large"
              ? -enemyTypes[e.kind].hp
              : priority === "flyers"
                ? (enemyTypes[e.kind].fly ? -10000 : 0) + distance(from, e)
                : priority === "groups"
                  ? -candidates.filter((c) => distance(c, e) < 80).length *
                      1000 +
                    distance(from, e)
                  : distance(from, e);
          return score(a) - score(b);
        })[0];
    }
    function clear(a, b, ignore) {
      return !api.obstruction(a, b, ignore);
    }
    function chain(from, e, n, count, opts = {}, ignore) {
      const hit = new Set();
      let p = from;
      for (let i = 0; e && i < count; i++) {
        if (!clear(p, e, ignore)) break;
        damage(e, n, opts);
        hit.add(e.id);
        state.fields.push({
          kind: "spark",
          x: p.x,
          y: p.y,
          tx: e.x,
          ty: e.y,
          left: 180,
        });
        p = e;
        e = state.enemies
          .filter((q) => q.hp > 0 && !hit.has(q.id) && distance(p, q) < 110)
          .sort((a, b) => distance(p, a) - distance(p, b))[0];
      }
    }
    function shoot(from, target, d, owner, enemy = false) {
      if (state.shots.length >= 160) return false;
      const launch = trajectory(from, target, d.arc, d.speed);
      state.shots.push({
        id: state.next++,
        x: from.x,
        y: from.y,
        ...launch,
        damage: d.damage,
        splash: d.splash || 0,
        pierce: d.pierce || 1,
        hit: [],
        owner,
        enemy,
        kind: d.kind || "bolt",
        slow: d.slow || 0,
        burn: d.burn || 0,
        age: 0,
      });
      api.event("fire", from);
      return true;
    }
    function loadAmmo(a, o) {
      if (o.ammo >= 1) return true;
      const b = getBuilding(o.source);
      if (!b || !(stock(b).arrow > 0)) {
        o.status = "Needs arrows";
        return false;
      }
      if (!near(a, door(b, a), 36)) {
        api.move(a, door(b, a));
        o.status = "Collecting arrows";
        return false;
      }
      const n = Math.min(12, stock(b).arrow);
      stock(b).arrow -= n;
      o.ammo += n;
      api.changed();
      return true;
    }
    function defense(a, o, dt) {
      const d = roles[o.role];
      if (!o.gear.length && !equip(a, o)) return;
      if (d.ammo && !loadAmmo(a, o)) return;
      const b = getBuilding(o.station);
      if (b && structures[b.type] && !structures[b.type].capacity) {
        api.move(a, door(b, a));
        o.status = near(a, door(b, a), 40)
          ? o.helper
            ? "Helping reload"
            : "Operating"
          : "To station";
        return;
      }
      const goal = o.post || a,
        range = d.range;
      if (distance(a, goal) > 40) {
        api.move(a, goal);
        o.status = "To post";
        return;
      }
      if (d.heal) {
        const ally = actors()
          .filter((p) => state.orders[p.id]?.hp < 35 && near(a, p, d.range))
          .sort((p, q) => state.orders[p.id].hp - state.orders[q.id].hp)[0];
        if (ally && o.cooldown <= 0 && o.charge >= 20) {
          state.orders[ally.id].hp = Math.min(
            35,
            state.orders[ally.id].hp + d.heal,
          );
          o.charge -= 20;
          o.cooldown = d.reload;
          state.fields.push({ kind: "heal", x: ally.x, y: ally.y, left: 500 });
          api.event("magic", ally);
        }
        return;
      }
      const e = choose(a, state.enemies, o.role === "sword" ? 180 : range);
      if (e && o.role === "sword" && distance(a, e) > range) {
        api.move(a, e);
        o.status = "Intercepting";
        return;
      }
      if (!e) {
        api.move(a, goal);
        o.status = "Guarding";
        return;
      }
      if (!clear(a, e)) {
        o.status = "Blocked";
        return;
      }
      api.face?.(a, e);
      if (o.cooldown > 0) return;
      if (d.magic && o.charge < 20) {
        o.status = "Recharging";
        return;
      }
      if (d.ammo && o.ammo < 1) return;
      let fired = true;
      if (o.role === "sword") {
        damage(e, d.damage);
        api.event("slash", a);
      } else if (d.chain) chain(a, e, d.damage, d.chain, d);
      else
        fired = shoot(
          a,
          e,
          {
            ...d,
            speed: d.magic ? 400 : 600,
            kind: d.magic ? o.role : "arrow",
          },
          a.id,
        );
      if (fired) {
        o.cooldown = d.reload;
        if (d.ammo) o.ammo--;
        if (d.magic) o.charge -= 20;
        o.pose = 250;
        o.status = "Fighting";
        api.changed();
      }
    }
    function supplyAmount(b, item) {
      return api.supplyAmount ? api.supplyAmount(b, item) : stock(b)[item] || 0;
    }
    function deliver(a, o) {
      let c = o.cargo;
      if (c) {
        const b = getBuilding(c.target);
        if (!b) {
          refundCargo(o);
          return;
        }
        if (!near(a, door(b, a), 36)) {
          api.move(a, door(b, a));
          o.status = "Delivering";
          return;
        }
        stock(b)[c.item] = (stock(b)[c.item] || 0) + c.n;
        o.cargo = null;
        o.status = "Delivered";
        api.changed();
        return;
      }
      const wants = buildings()
        .filter((b) => structures[b.type] && !structures[b.type].capacity)
        .map((b) => ({
          b,
          item:
            b.type === "oilDropper" ? station(b).load : structures[b.type].ammo,
        }))
        .filter((v) => v.item && (stock(v.b)[v.item] || 0) < 6);
      for (const { b, item } of wants) {
        const source = buildings()
          .filter((s) => s.id !== b.id && supplyAmount(s, item) > 0)
          .sort((s, t) => distance(a, door(s, a)) - distance(a, door(t, a)))[0];
        if (!source) continue;
        if (!near(a, door(source, a), 36)) {
          api.move(a, door(source, a));
          o.status = "To supplies";
          return;
        }
        const n = Math.min(12, supplyAmount(source, item));
        if (api.takeSupply) {
          if (!api.takeSupply(source, item, n)) continue;
        } else stock(source)[item] -= n;
        o.cargo = { item, n, source: source.id, target: b.id };
        o.status = "Carrying";
        api.changed();
        return;
      }
      o.status = "No supplies needed";
    }
    function repair(a, o) {
      const t = api.repairTargets().find((t) => distance(a, t) < 1000);
      if (!t) {
        o.status = "No repairs needed";
        return;
      }
      if (!o.cargo) {
        const source = buildings().find((b) => (stock(b)[t.material] || 0) > 0);
        if (!source) {
          o.status = "Needs repair materials";
          return;
        }
        if (!near(a, door(source, a), 36)) {
          api.move(a, door(source, a));
          o.status = "To materials";
          return;
        }
        stock(source)[t.material]--;
        o.cargo = { item: t.material, n: 1, source: source.id, repair: true };
        api.changed();
      }
      if (o.cargo.item !== t.material) {
        refundCargo(o);
        return;
      }
      if (!near(a, t, 55)) {
        api.move(a, api.repairPoint(t));
        o.status = "To repair";
        return;
      }
      if (o.cooldown <= 0) {
        api.repair(t);
        o.cargo = null;
        o.cooldown = 1200;
        o.status = "Repairing";
        api.changed();
      }
    }
    function turrets(dt) {
      const crew = new Set();
      for (const b of buildings()) {
        const d = structures[b.type];
        if (!d || d.capacity) continue;
        const s = station(b);
        s.cooldown = Math.max(0, s.cooldown - dt);
        s.charge = Math.min(100, s.charge + dt * 0.004);
        s.ward = Math.max(0, s.ward - dt);
        const operators = actors().filter((a) => {
            const o = state.orders[a.id];
            return (
              o?.active &&
              o.job === "Defend" &&
              o.station === b.id &&
              o.stun <= 0 &&
              o.gear.length &&
              !crew.has(a.id) &&
              near(a, door(b, a), 42)
            );
          }),
          op = operators.find((a) => !state.orders[a.id].helper);
        if (!op) {
          s.status = "Needs crew";
          continue;
        }
        crew.add(op.id);
        const helper = operators.find(
          (a) => a !== op && state.orders[a.id].helper,
        );
        if (helper) {
          crew.add(helper.id);
          s.cooldown = Math.max(0, s.cooldown - dt * 0.35);
        }
        if (b.paused) {
          s.status = "Paused";
          continue;
        }
        if (!api.supported(b)) {
          s.status = "Needs support";
          continue;
        }
        if (s.cooldown > 0) {
          s.status = "Reloading";
          continue;
        }
        if (d.ward) {
          if (s.charge >= 40) {
            s.ward = 6500;
            s.charge -= 40;
            s.cooldown = d.reload;
            api.event("magic", point(b));
          }
          s.status = "Warding";
          continue;
        }
        const p = point(b),
          load = b.type === "oilDropper" ? s.load : d.ammo,
          water = load === "waterCharge",
          targets = water ? api.fires() : state.enemies;
        const e = d.drop
          ? targets
              .filter(
                (e) =>
                  e.y > p.y &&
                  e.y - p.y < d.range &&
                  Math.abs(e.x - (p.x + s.facing * (b.w || d.w) * 16)) < 48,
              )
              .sort((a, b) => a.y - b.y)[0]
          : choose(
              p,
              targets,
              d.range,
              d.min,
              s.priority === "auto"
                ? d.pierce || d.heavy
                  ? "large"
                  : d.splash
                    ? "groups"
                    : "nearest"
                : s.priority,
              s.facing,
            );
        if (!e) {
          s.status = "Guarding";
          continue;
        }
        if (d.magic && s.charge < 30) {
          s.status = "Recharging";
          continue;
        }
        const n = d.costPerShot || 1;
        if (load && (stock(b)[load] || 0) < n) {
          s.status = "Needs " + (items[load]?.name || load);
          continue;
        }
        if (d.ram) {
          const end = { x: p.x + s.facing * 100, y: p.y };
          if (api.obstruction(p, end, b.id)) {
            s.status = "Swing blocked";
            continue;
          }
          for (const q of state.enemies)
            if (distance(p, q) < d.range)
              damage(q, d.damage, { knock: s.facing * 5 });
          state.fields.push({ kind: "swing", x: p.x, y: p.y, left: 350 });
        } else if (d.magic) {
          chain(p, e, d.damage, d.chain || 1, {}, b.id);
        } else {
          const origin = d.drop ? { x: p.x + s.facing * d.w * 16, y: p.y } : p;
          const desc = {
            ...d,
            kind: load || "stone",
            burn: load === "oilCharge" ? 5000 : 0,
            slow: load === "sapCharge" ? 6000 : d.slow,
          };
          const solution = trajectory(origin, e, desc.arc, desc.speed);
          let previous = origin,
            blocked = false;
          const duration = Math.max(0.1, solution.life - 1);
          for (let t = 0.05; t <= duration + 0.05; t += 0.05) {
            const u = Math.min(t, duration),
              q = {
                x: origin.x + solution.vx * u,
                y: origin.y + solution.vy * u + (solution.g * u * u) / 2,
              };
            if (api.obstruction(previous, q, b.id)) {
              blocked = true;
              break;
            }
            previous = q;
          }
          if (blocked) {
            s.status = "Blocked";
            continue;
          }
          if (!shoot(origin, e, desc, b.id)) continue;
        }
        if (load) stock(b)[load] -= n;
        if (d.magic) s.charge -= 30;
        s.cooldown = d.reload;
        s.status = "Firing";
        api.changed();
      }
    }
    function impact(p, pos, enemy) {
      if (p.kind === "waterCharge") {
        api.extinguish(pos, p.splash || 48);
        return;
      }
      if (p.splash) {
        for (const e of state.enemies)
          if (e.hp > 0 && distance(e, pos) < p.splash) damage(e, p.damage, p);
        if (p.slow)
          state.fields.push({
            kind: "bramble",
            x: pos.x,
            y: pos.y,
            left: p.slow,
            radius: p.splash,
          });
        if (p.burn) api.ignite?.(pos);
      } else if (enemy) damage(enemy, p.damage, p);
      api.event("impact", pos);
    }
    function shots(dt) {
      const seconds = dt / 1000;
      for (const p of state.shots) {
        const start = { x: p.x, y: p.y },
          end = {
            x: p.x + p.vx * seconds,
            y: p.y + p.vy * seconds + (p.g * seconds * seconds) / 2,
          };
        p.vy += p.g * seconds;
        p.life -= seconds;
        p.age += dt;
        let collision = api.obstruction(start, end, p.owner),
          limit = collision ? collision.t : 1;
        if (p.enemy) {
          const hits = actors()
            .filter((a) => state.orders[a.id]?.active)
            .map((a) => ({
              a,
              t: segment(start, end, {
                min: { x: a.x - 10, y: a.y - 14 },
                max: { x: a.x + 10, y: a.y + 14 },
              }),
            }))
            .filter((v) => v.t !== null && v.t < limit)
            .sort((a, b) => a.t - b.t);
          if (hits[0]) {
            hurtActor(hits[0].a, p.damage * 4);
            p.life = 0;
          } else if (collision) {
            worldHit(collision.target, p.damage);
            p.life = 0;
          }
        } else {
          const hits = state.enemies
            .filter((e) => e.hp > 0 && !p.hit.includes(e.id))
            .map((e) => ({
              e,
              t: segment(start, end, {
                min: { x: e.x - 12, y: e.y - 18 },
                max: { x: e.x + 12, y: e.y + 18 },
              }),
            }))
            .filter((v) => v.t !== null && v.t <= limit)
            .sort((a, b) => a.t - b.t);
          for (const { e, t } of hits) {
            const pos = {
              x: start.x + (end.x - start.x) * t,
              y: start.y + (end.y - start.y) * t,
            };
            impact(p, pos, e);
            p.hit.push(e.id);
            if (--p.pierce <= 0) {
              p.life = 0;
              limit = t;
              break;
            }
          }
          if (collision && p.life > 0) {
            impact(p, {
              x: start.x + (end.x - start.x) * limit,
              y: start.y + (end.y - start.y) * limit,
            });
            p.life = 0;
          }
        }
        p.x = start.x + (end.x - start.x) * limit;
        p.y = start.y + (end.y - start.y) * limit;
      }
      state.shots = state.shots.filter((p) => p.life > 0);
    }
    function enemies(dt) {
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        const d = enemyTypes[e.kind];
        e.age += dt;
        e.cooldown = Math.max(0, e.cooldown - dt);
        e.slow = Math.max(0, e.slow - dt);
        if (e.burn > 0) {
          e.burn -= dt;
          damage(e, dt * 0.0015, { pierce: true });
          if (e.hp <= 0) continue;
        }
        for (const f of state.fields)
          if (f.kind === "bramble" && distance(e, f) < f.radius)
            e.slow = Math.max(e.slow, 500);
        const allies = actors().filter(
            (a) => state.orders[a.id]?.active && state.orders[a.id].stun <= 0,
          ),
          ally = choose(
            e,
            allies.map((a) => ({ ...a, hp: 35 })),
            Math.min(200, d.range),
            0,
          ),
          world = api.enemyTarget(e, state.anchor),
          target = ally || world || state.anchor;
        if (!target) continue;
        const dist = distance(e, target),
          attack =
            dist < d.range &&
            dist >= (d.min || 0) &&
            clear(e, target, target.buildingId);
        if (!attack) {
          api.moveEnemy(e, target, dt, e.slow > 0 ? 0.4 : 1);
          continue;
        }
        api.stopEnemy?.(e);
        if (e.cooldown > 0) continue;
        if (d.min) {
          shoot(
            e,
            target,
            { damage: d.damage, arc: true, kind: "stone" },
            "enemy",
            true,
          );
        } else if (ally) hurtActor(ally, d.damage * 4);
        else worldHit(target, d.damage);
        e.cooldown = d.reload;
        api.event("enemyAttack", e);
      }
      state.enemies = state.enemies.filter((e) => e.hp > 0);
    }
    function step(ms) {
      if (!Number.isFinite(ms) || ms <= 0 || api.paused()) return;
      const dt = Math.min(ms, 100);
      if (
        state.phase === "peace" &&
        !Object.keys(state.orders).length &&
        !state.enemies.length &&
        !state.shots.length &&
        !state.fields.length
      ) {
        state.time += dt;
        api.tickFires?.(dt);
        return;
      }
      actorCache = api.actors();
      state.time += dt;
      api.syncEnemies?.(state.enemies);
      const live = new Set(actors().map((a) => a.id));
      for (const [id, o] of Object.entries(state.orders)) {
        if (!live.has(id)) {
          remove(id);
          continue;
        }
        const a = getActor(id);
        if (a.sleeping) {
          o.status = "Sleeping";
          continue;
        }
        o.cooldown = Math.max(0, o.cooldown - dt);
        const stunned = o.stun > 0;
        o.stun = Math.max(0, o.stun - dt);
        if (stunned && o.stun === 0) o.hp = 35;
        o.pose = Math.max(0, (o.pose || 0) - dt);
        o.charge = Math.min(100, o.charge + dt * 0.006);
        if (o.stun > 0) {
          o.status = "Recovering";
          continue;
        }
        if (o.hp < 35 && !busy()) o.hp = Math.min(35, o.hp + dt * 0.002);
        if (o.returning) {
          const b = getBuilding(o.source);
          if (b && !near(a, door(b, a), 36)) {
            api.move(a, door(b, a));
            o.status = "Returning equipment";
            continue;
          }
          giveBack(o);
          if (!busy()) {
            o.active = !o.alarm;
            if (o.alarm) api.restoreTask(id, o.previous);
          }
          continue;
        }
        if (!o.active) continue;
        if (o.job === "Supply") deliver(a, o);
        else if (o.job === "Repair") repair(a, o);
        else defense(a, o, dt);
        if (
          !busy() &&
          o.alarm &&
          ["No supplies needed", "No repairs needed", "Needs repair materials"].includes(o.status)
        ) {
          o.active = false;
          api.restoreTask(id, o.previous);
        }
      }
      if (state.phase === "warning") {
        state.phaseTime -= dt;
        if (state.phaseTime <= 0) {
          state.phase = "battle";
          state.phaseTime = 180000;
          state.spawn = 0;
        }
      }
      if (state.phase === "battle") {
        state.phaseTime -= dt;
        state.spawn -= dt;
        if (state.queue.length && state.spawn <= 0) {
          const kind = state.queue.shift(),
            side = state.queue.length % 2 ? 1 : -1;
          spawn(kind, api.spawnPoint(state.anchor, side, kind));
          state.spawn = 1800;
        }
        enemies(dt);
        turrets(dt);
        shots(dt);
        if (state.phaseTime <= 0 || api.lost(state.anchor)) {
          state.outcome = "Retreated";
          for (const e of state.enemies) api.removeEnemy?.(e);
          state.enemies = [];
          state.queue = [];
          finish();
        } else if (!state.queue.length && !state.enemies.length) {
          state.outcome = "Defended";
          api.reward(state.wave * 5);
          finish();
        }
      } else {
        turrets(dt);
        shots(dt);
      }
      if (state.phase === "recovery") {
        state.phaseTime -= dt;
        if (state.phaseTime <= 0) {
          state.phase = "peace";
          api.changed();
        }
      }
      for (const f of state.fields) f.left -= dt;
      state.fields = state.fields.filter((f) => f.left > 0).slice(-160);
      api.tickFires?.(dt);
      actorCache = null;
    }
    function finish() {
      state.phase = "recovery";
      state.phaseTime = 5000;
      state.shots = [];
      for (const o of Object.values(state.orders))
        if (o.job === "Defend") o.returning = true;
      api.event("end", state.anchor);
      api.changed();
    }
    function configure(id, options) {
      const b = getBuilding(id);
      if (!b || !structures[b.type] || structures[b.type].capacity)
        return false;
      const s = station(b);
      if (options.facing === 1 || options.facing === -1)
        s.facing = options.facing;
      if (
        ["auto", "nearest", "large", "flyers", "groups"].includes(
          options.priority,
        )
      )
        s.priority = options.priority;
      if (["oilCharge", "sapCharge", "waterCharge"].includes(options.load))
        s.load = options.load;
      api.changed();
      return true;
    }
    function save() {
      return JSON.parse(JSON.stringify(state));
    }
    function restore(raw) {
      if (!raw || raw.version !== 1) return;
      for (const e of state.enemies) api.removeEnemy?.(e);
      const clean = JSON.parse(JSON.stringify(raw)),
        number = (v, a = 0, b = 1e7) => cap(finite(v), a, b),
        point = (p) =>
          p &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y) &&
          Math.abs(p.x) < 1e7 &&
          Math.abs(p.y) < 1e7;
      state.time = number(clean.time);
      state.next = number(clean.next, 1);
      state.wave = number(clean.wave, 0, 10000);
      state.phase = ["peace", "warning", "battle", "recovery"].includes(
        clean.phase,
      )
        ? clean.phase
        : "peace";
      state.phaseTime = number(clean.phaseTime, 0, 180000);
      state.spawn = number(clean.spawn, 0, 5000);
      state.outcome = clean.outcome === "Defended" ? "Defended" : "Ready";
      state.anchor = point(clean.anchor) ? clean.anchor : null;
      state.queue = (Array.isArray(clean.queue) ? clean.queue : [])
        .filter((k) => enemyTypes[k])
        .slice(0, 36);
      state.kills = number(clean.kills);
      state.orders = {};
      for (const [id, o] of Object.entries(clean.orders || {}).slice(0, 256)) {
        if (!o || !/^[fw]\d+$/.test(id) || !roles[o.role] || !point(o.post))
          continue;
        state.orders[id] = {
          ...o,
          hp: number(o.hp, 1, 35),
          charge: number(o.charge, 0, 100),
          cooldown: number(o.cooldown, 0, 10000),
          stun: number(o.stun, 0, 12000),
          ammo: number(o.ammo, 0, 12),
          reservation:
            o.reservation &&
            Number.isSafeInteger(o.reservation.source) &&
            Array.isArray(o.reservation.gear)
              ? {
                  source: o.reservation.source,
                  gear: o.reservation.gear.filter((k) =>
                    roles[o.role].gear.includes(k),
                  ),
                }
              : null,
          job: ["Defend", "Supply", "Repair"].includes(o.job)
            ? o.job
            : "Defend",
          station: Number.isSafeInteger(o.station) ? o.station : null,
          pendingRole: roles[o.pendingRole] ? o.pendingRole : undefined,
          gear: (Array.isArray(o.gear) ? o.gear : [])
            .filter((k) => roles[o.role].gear.includes(k))
            .filter((k, i, a) => a.indexOf(k) === i),
        };
        const c = state.orders[id].cargo;
        if (
          c &&
          ((!items[c.item] &&
            ![
              "wood",
              "stone",
              "dirt",
              "deepslate",
              "obsidian",
              "ironIngot",
            ].includes(c.item)) ||
            !Number.isInteger(c.n) ||
            c.n < 1 ||
            c.n > 12)
        )
          state.orders[id].cargo = null;
      }
      state.stations = {};
      for (const [id, s] of Object.entries(clean.stations || {}).slice(
        0,
        256,
      )) {
        if (!s || !/^\d+$/.test(id)) continue;
        state.stations[id] = {
          facing: s.facing === -1 ? -1 : 1,
          priority: ["auto", "nearest", "large", "flyers", "groups"].includes(
            s.priority,
          )
            ? s.priority
            : "auto",
          load: ["oilCharge", "sapCharge", "waterCharge"].includes(s.load)
            ? s.load
            : "oilCharge",
          cooldown: number(s.cooldown, 0, 10000),
          charge: number(s.charge, 0, 100),
          ward: number(s.ward, 0, 6500),
        };
      }
      state.enemies = (Array.isArray(clean.enemies) ? clean.enemies : [])
        .filter(
          (e) =>
            e &&
            enemyTypes[e.kind] &&
            point(e) &&
            Number.isSafeInteger(e.id) &&
            e.id > 0,
        )
        .slice(0, 64)
        .map((e) => ({
          ...e,
          hp: number(e.hp, 0, enemyTypes[e.kind].hp),
          cooldown: number(e.cooldown, 0, 10000),
          slow: number(e.slow, 0, 6000),
          burn: number(e.burn, 0, 5000),
          age: number(e.age),
        }));
      state.shots = (Array.isArray(clean.shots) ? clean.shots : [])
        .filter(
          (p) =>
            point(p) &&
            [p.vx, p.vy, p.g, p.life, p.damage].every(Number.isFinite) &&
            Math.abs(p.vx) < 5000 &&
            Math.abs(p.vy) < 5000 &&
            p.life > 0 &&
            p.life < 10,
        )
        .slice(0, 160)
        .map((p) => ({
          ...p,
          hit: Array.isArray(p.hit) ? p.hit.slice(0, 64) : [],
          pierce: number(p.pierce, 1, 4),
          damage: number(p.damage, 0, 50),
          splash: number(p.splash, 0, 100),
        }));
      state.fields = (Array.isArray(clean.fields) ? clean.fields : [])
        .filter(point)
        .slice(0, 160)
        .map((f) => ({ ...f, left: number(f.left, 0, 6500) }));
      state.next = Math.max(
        state.next,
        ...state.enemies.map((e) => e.id + 1),
        ...state.shots.map((p) => finite(p.id) + 1),
      );
      state.enemies = state.enemies.filter(
        (e, i, a) => a.findIndex((q) => q.id === e.id) === i,
      );
      if (["battle", "warning"].includes(state.phase) && !state.anchor) {
        state.phase = "peace";
        state.queue = [];
        state.shots = [];
        for (const e of state.enemies) api.removeEnemy?.(e);
        state.enemies = [];
      }
      for (const e of state.enemies) api.spawn?.(e);
    }
    return {
      get state() {
        return state;
      },
      order,
      remove,
      begin,
      spawn,
      damage,
      step,
      configure,
      station,
      save,
      restore,
      wardAt,
      worldHit,
      shoot,
      finish,
    };
  }
  return { structures, items, roles, enemyTypes, segment, trajectory, create };
});
