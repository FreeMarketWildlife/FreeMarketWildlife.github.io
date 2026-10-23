/* Buttonwood bible §§3–7, 9–10: native timber machinery and separate miniatures. */
(function () {
  "use strict";
  const A = window.ButtonwoodArt,
    P = A.palette,
    cache = new Map();
  function rect(g, x, y, w, h, color) {
    g.fillStyle = P[color];
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function line(g, x, y, u, v, color, width = 1) {
    x = Math.round(x);
    y = Math.round(y);
    u = Math.round(u);
    v = Math.round(v);
    const dx = Math.abs(u - x),
      dy = -Math.abs(v - y),
      sx = x < u ? 1 : -1,
      sy = y < v ? 1 : -1;
    let e = dx + dy;
    for (let n = 0; n < 1024; n++) {
      rect(g, x, y, width, width, color);
      if (x === u && y === v) break;
      const d = e * 2;
      if (d >= dy) {
        e += dy;
        x += sx;
      }
      if (d <= dx) {
        e += dx;
        y += sy;
      }
    }
  }
  function canvas(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    draw(g);
    return c;
  }
  function beam(g, x, y, u, v) {
    line(g, x, y, u, v, "outline", 6);
    line(g, x + 1, y + 1, u + 1, v + 1, "wood", 3);
    line(g, x + 1, y + 1, u + 1, v + 1, "woodLight");
  }
  function wheel(g, x, y) {
    rect(g, x - 6, y - 4, 13, 9, "outline");
    rect(g, x - 4, y - 6, 9, 13, "outline");
    rect(g, x - 4, y - 3, 9, 7, "wood");
    rect(g, x - 3, y - 4, 7, 9, "wood");
    line(g, x - 4, y, x + 4, y, "woodLight");
    line(g, x, y - 4, x, y + 4, "woodLight");
    rect(g, x - 1, y - 1, 3, 3, "stoneLight");
  }
  function gem(g, x, y, color = "water") {
    for (let y0 = -12; y0 <= 12; y0++) {
      const span = 6 - Math.floor(Math.abs(y0) / 2);
      rect(g, x - span, y + y0, span * 2 + 1, 1, "outline");
      if (span > 1) rect(g, x - span + 1, y + y0, span * 2 - 1, 1, color);
    }
    line(g, x - 2, y - 7, x - 2, y + 5, "creamLight");
    rect(g, x - 1, y - 8, 3, 2, "creamLight");
  }
  function mini(g, type) {
    const r = (...a) => rect(g, ...a);
    r(3, 27, 26, 3, "outline");
    r(5, 27, 22, 1, "stoneLight");
    if (type === "armory") {
      r(5, 12, 22, 15, "outline");
      r(7, 13, 18, 14, "cream");
      for (let y = 5; y < 13; y += 2)
        r(
          3 + Math.max(0, 9 - y),
          y,
          26 - Math.max(0, 9 - y) * 2,
          2,
          y === 5 ? "coralLight" : "coral",
        );
      r(3, 12, 26, 2, "woodShade");
      r(9, 16, 14, 11, "woodShade");
      r(10, 17, 12, 9, "ink");
      line(g, 12, 18, 20, 24, "stoneLight", 2);
      line(g, 20, 18, 12, 24, "stone", 2);
      r(10, 22, 4, 2, "gold");
    } else if (type === "ballista" || type === "repeatingCrossbow") {
      beam(g, 8, 26, 16, 17);
      beam(g, 24, 26, 16, 17);
      beam(g, 6, 16, 27, 16);
      line(g, 20, 7, 27, 16, "creamShade");
      line(g, 27, 16, 20, 24, "creamShade");
      beam(g, 20, 7, 24, 12);
      beam(g, 24, 20, 20, 24);
      line(g, 6, 15, 29, 15, "stoneLight");
      if (type === "repeatingCrossbow") {
        r(9, 10, 9, 5, "outline");
        r(10, 11, 7, 3, "mint");
      }
    } else if (type === "catapult" || type === "trebuchet") {
      beam(g, 6, 25, 23, 25);
      beam(g, 8, 24, 15, 12);
      beam(g, 23, 24, 15, 12);
      beam(g, 10, 23, 23, 5);
      r(21, 4, 7, 4, "outline");
      r(22, 4, 5, 2, "woodLight");
      wheel(g, 8, 26);
      wheel(g, 23, 26);
      if (type === "trebuchet") {
        r(5, 13, 6, 8, "outline");
        r(6, 14, 4, 6, "stone");
      }
    } else if (type === "oilDropper" || type === "rockChute") {
      beam(g, 6, 27, 6, 6);
      beam(g, 6, 7, 26, 7);
      r(16, 10, 12, 11, "outline");
      r(17, 11, 10, 7, type === "oilDropper" ? "deep" : "stone");
      r(18, 20, 8, 3, "stoneShade");
      r(17, 10, 10, 2, "stoneLight");
      r(21, 24, 3, 3, type === "oilDropper" ? "gold" : "stoneLight");
    } else if (type === "hangingRam") {
      beam(g, 4, 27, 4, 4);
      beam(g, 4, 5, 28, 5);
      line(g, 12, 6, 10, 18, "stoneLight");
      line(g, 25, 6, 23, 18, "stoneLight");
      r(8, 18, 21, 7, "outline");
      r(9, 19, 18, 4, "wood");
      r(24, 18, 4, 7, "stone");
    } else if (type === "brambleLauncher") {
      beam(g, 6, 26, 22, 26);
      beam(g, 12, 26, 18, 14);
      r(17, 9, 12, 9, "outline");
      r(18, 10, 10, 7, "grass");
      r(19, 11, 5, 2, "grassLight");
      line(g, 7, 18, 20, 5, "grassShade", 2);
      r(9, 14, 5, 2, "grass");
    } else {
      r(11, 19, 10, 8, "stoneShade");
      r(10, 25, 12, 2, "stoneLight");
      gem(g, 16, 12, type === "wardLantern" ? "gold" : "water");
      if (type === "wardLantern") {
        r(8, 7, 3, 15, "wood");
        r(22, 7, 3, 15, "wood");
        r(7, 4, 19, 3, "woodShade");
      }
    }
  }
  function world(g, type, w, h, pose) {
    const r = (...a) => rect(g, ...a);
    const base = h - 8;
    r(3, base, w - 6, 8, "outline");
    r(5, base + 1, w - 10, 5, "stoneShade");
    for (let x = 6; x < w - 6; x += 18) r(x, base + 1, 14, 2, "stoneLight");
    if (type === "armory") {
      r(10, 45, w - 20, h - 53, "outline");
      r(13, 47, w - 26, h - 55, "creamShade");
      r(15, 47, w - 30, h - 58, "cream");
      for (let y = 10; y < 47; y += 4) {
        const inset = Math.max(0, Math.floor((42 - y) * 0.7));
        r(2 + inset, y, w - 4 - inset * 2, 5, "coralShade");
        r(4 + inset, y, w - 8 - inset * 2, 2, y < 18 ? "coralLight" : "coral");
      }
      r(2, 45, w - 4, 5, "woodShade");
      r(5, 45, w - 10, 2, "woodLight");
      r(16, 52, 5, h - 62, "wood");
      r(w - 21, 52, 5, h - 62, "wood");
      r(39, 61, 50, h - 69, "outline");
      r(42, 64, 44, h - 72, "ink");
      r(46, 70, 35, 4, "woodLight");
      for (let x = 47; x < 80; x += 12) {
        line(g, x, 76, x, 102, "stone", 3);
        r(x - 3, 96, 9, 2, "gold");
        r(x, 99, 3, 9, "woodLight");
      }
      r(25, 53, 25, 8, "woodShade");
      r(27, 54, 21, 5, "mint");
      line(g, 35, 54, 40, 58, "stoneLight");
      r(88, 85, 23, 25, "outline");
      r(90, 87, 19, 21, "wood");
      line(g, 92, 90, 107, 104, "woodLight");
      r(90, 100, 19, 3, "woodShade");
      return;
    }
    const cy = base - 20,
      cx = Math.floor(w / 2);
    if (type === "ballista" || type === "repeatingCrossbow") {
      beam(g, 12, base, cx, cy - 5);
      beam(g, w - 13, base, cx, cy - 5);
      beam(g, 10, cy - 8, w - 6, cy - 8);
      const shift = pose ? 4 : 0;
      beam(g, w - 32, cy - 30, w - 15, cy - 17);
      beam(g, w - 15, cy + 1, w - 32, cy + 14);
      line(g, w - 32, cy - 30, w - 23 - shift, cy - 8, "creamShade");
      line(g, w - 23 - shift, cy - 8, w - 32, cy + 14, "creamShade");
      line(g, 12, cy - 10, w - 2, cy - 10, "stoneLight", 2);
      r(w - 6, cy - 12, 5, 5, "stone");
      if (type === "repeatingCrossbow") {
        r(14, cy - 23, 24, 12, "outline");
        r(16, cy - 21, 20, 8, "mint");
        r(18, cy - 20, 16, 2, "mintLight");
      }
    } else if (type === "catapult" || type === "trebuchet") {
      beam(g, 12, base - 6, w - 12, base - 6);
      beam(g, 20, base - 8, cx, base - 53);
      beam(g, w - 20, base - 8, cx, base - 53);
      beam(g, cx - 15, base - 18, cx + 25, pose ? 12 : 24);
      r(cx + 18, pose ? 6 : 18, 24, 10, "outline");
      r(cx + 20, pose ? 7 : 19, 20, 5, "woodLight");
      if (type === "trebuchet") {
        line(g, cx - 8, base - 32, cx - 18, base - 12, "creamShade");
        r(cx - 32, base - 35, 24, 22, "outline");
        r(cx - 30, base - 33, 20, 18, "stone");
        r(cx - 29, base - 32, 17, 3, "stoneLight");
      }
      wheel(g, 18, base - 3);
      wheel(g, w - 20, base - 3);
    } else if (type === "oilDropper" || type === "rockChute") {
      beam(g, 8, base, 8, 6);
      beam(g, 8, 8, w - 4, 8);
      line(g, w - 19, 10, w - 19, 19, "stoneLight", 2);
      r(w - 36, 20, 32, 26, "outline");
      r(w - 34, 22, 28, 19, type === "oilDropper" ? "deep" : "stoneShade");
      r(w - 32, 23, 24, 4, type === "oilDropper" ? "deepLight" : "stoneLight");
      r(w - 30, 45, 20, 4, "stone");
      r(w - 37, 20, 34, 3, "stoneLight");
      if (pose)
        r(w - 16, 50, 4, 9, type === "oilDropper" ? "goldShade" : "stone");
    } else if (type === "hangingRam") {
      beam(g, 8, base, 8, 8);
      beam(g, 8, 9, w - 8, 9);
      line(g, 28, 12, pose ? 40 : 28, base - 30, "stoneLight", 2);
      line(g, w - 22, 12, pose ? w - 10 : w - 22, base - 30, "stoneLight", 2);
      r(pose ? 30 : 18, base - 32, w - 32, 18, "outline");
      r(pose ? 32 : 20, base - 30, w - 36, 14, "wood");
      r(pose ? 32 : 20, base - 29, w - 40, 3, "woodLight");
      r(w - 26, base - 32, 9, 18, "stone");
    } else if (type === "brambleLauncher") {
      beam(g, 8, base, w - 10, base);
      beam(g, 14, base, cx, cy);
      beam(g, cx, cy, w - 12, 18);
      r(w - 32, 13, 28, 20, "outline");
      r(w - 30, 15, 24, 16, "grassShade");
      r(w - 28, 15, 20, 8, "grass");
      r(w - 26, 16, 14, 3, "grassLight");
      line(g, 14, cy, cx, 18, "grassShade", 3);
      r(18, cy - 12, 8, 4, "grass");
    } else {
      r(cx - 15, base - 18, 30, 18, "stoneShade");
      r(cx - 17, base - 4, 34, 4, "stoneLight");
      r(cx - 10, base - 26, 20, 8, "goldShade");
      gem(g, cx, base - 43, type === "wardLantern" ? "gold" : "water");
      if (type === "wardLantern") {
        beam(g, cx - 23, base - 23, cx - 23, base - 65);
        beam(g, cx + 21, base - 23, cx + 21, base - 65);
        beam(g, cx - 25, base - 65, cx + 23, base - 65);
      }
    }
  }
  A.defenseSprite = function (type, pose = 0) {
    const d = TowerDefense.structures[type];
    if (!d) return null;
    const k = type + ":" + (pose ? 1 : 0);
    if (!cache.has(k))
      cache.set(
        k,
        canvas(d.w * 32, d.h * 32, (g) =>
          world(g, type, d.w * 32, d.h * 32, pose),
        ),
      );
    return cache.get(k);
  };
  A.defenseIcon = function (type) {
    const k = "icon:" + type;
    if (!cache.has(k))
      cache.set(
        k,
        canvas(32, 32, (g) => {
          if (TowerDefense.structures[type]) mini(g, type);
          else equipment(g, type, 16, 16, 1);
        }),
      );
    return cache.get(k);
  };
  function equipment(g, type, x, y, dir = 1) {
    const r = (dx, dy, w, h, c) =>
        rect(g, x + dx * dir - (dir < 0 ? w : 0), y + dy, w, h, c),
      l = (a, b, c, d, p, w = 1) =>
        line(g, x + a * dir, y + b, x + c * dir, y + d, p, w);
    if (type === "sword") {
      l(-2, 9, 7, -12, "outline", 3);
      l(-1, 7, 7, -11, "stoneLight");
      l(-4, 3, 5, 7, "gold", 2);
      l(-2, 7, -4, 13, "wood", 2);
    } else if (type === "shield") {
      r(-9, -10, 18, 16, "outline");
      r(-7, -8, 14, 15, "wood");
      r(-6, -7, 12, 3, "stone");
      r(-6, 1, 12, 3, "stone");
      r(-1, -5, 2, 14, "mint");
      r(-4, 7, 8, 3, "outline");
      r(-2, 10, 4, 2, "outline");
    } else if (type === "bow") {
      l(-5, -12, 3, -7, "woodShade", 2);
      l(3, -7, 6, 0, "woodLight", 2);
      l(6, 0, 3, 8, "woodLight", 2);
      l(3, 8, -5, 12, "woodShade", 2);
      l(-5, -12, -5, 12, "creamShade");
      l(-10, 0, 10, 0, "stoneLight");
    } else if (type.endsWith("Staff")) {
      l(-4, 12, 3, -9, "woodShade", 3);
      l(-4, 11, 3, -9, "woodLight");
      const color =
        type === "fireStaff"
          ? "lava"
          : type === "frostStaff"
            ? "water"
            : type === "healingStaff"
              ? "mint"
              : "gold";
      if (type === "fireStaff") {
        r(0, -11, 9, 7, "outline");
        r(2, -12, 5, 9, "lava");
        r(4, -15, 2, 6, "lavaLight");
        r(3, -9, 3, 4, "gold");
      } else if (type === "frostStaff") {
        for (let dy = -5; dy <= 5; dy++) {
          const span = 5 - Math.abs(dy);
          r(4 - span, -10 + dy, span * 2 + 1, 1, "outline");
          if (span > 1) r(5 - span, -10 + dy, span * 2 - 1, 1, "water");
        }
        r(3, -12, 2, 4, "waterLight");
      } else if (type === "lightningStaff") {
        r(4, -15, 6, 3, "outline");
        r(1, -12, 7, 4, "outline");
        r(0, -8, 5, 5, "outline");
        r(5, -14, 4, 2, "gold");
        r(2, -11, 5, 2, "gold");
        r(1, -7, 3, 2, "gold");
      } else {
        r(-2, -11, 6, 4, "outline");
        r(5, -13, 6, 4, "outline");
        r(-1, -10, 5, 2, "mint");
        r(6, -12, 4, 2, "mintLight");
        r(3, -13, 3, 9, "woodLight");
        r(1, -9, 7, 2, "creamLight");
      }
    } else if (type === "arrow" || type === "bolt") {
      for (let i = 0; i < 3; i++) {
        l(-9 + i * 5, 10, -2 + i * 5, -10, "wood", 2);
        r(-3 + i * 5, -12, 4, 4, "stoneLight");
        r(-10 + i * 5, 8, 4, 3, "cream");
      }
    } else {
      const color =
        type === "oilCharge"
          ? "deep"
          : type === "waterCharge"
            ? "water"
            : type === "sapCharge"
              ? "goldShade"
              : "grass";
      r(-9, -5, 18, 15, "outline");
      r(-7, -4, 14, 12, color);
      r(-6, -3, 8, 2, type === "waterCharge" ? "waterLight" : "creamShade");
      r(-6, -9, 12, 4, "woodShade");
      r(-4, -10, 8, 2, "woodLight");
    }
  }
  A.paintDefenseGear = function (g, role, x, y, dir, pose = 0) {
    const d = TowerDefense.roles[role];
    if (!d) return;
    equipment(
      g,
      d.gear[0],
      x + dir * (role === "bow" ? 12 : 5) + dir * (pose ? 2 : 0),
      y - (pose ? 3 : 0),
      dir,
    );
    if (role === "sword") equipment(g, "shield", -x - dir * 10, y + 1, dir);
  };
  A.enemySprite = function (kind, frame = 0) {
    const k = "enemy:" + kind + ":" + frame;
    if (cache.has(k)) return cache.get(k);
    const giant = kind === "giant",
      siege = kind === "siege",
      w = giant ? 48 : siege ? 72 : 32,
      h = giant ? 64 : siege ? 48 : 40;
    const c = canvas(w, h, (g) => {
      if (siege) {
        beam(g, 8, h - 10, w - 8, h - 10);
        beam(g, 17, h - 12, 36, 10);
        beam(g, 56, h - 12, 36, 10);
        beam(g, 24, 30, 57, 3);
        rect(g, 53, 2, 14, 5, "stone");
        wheel(g, 12, h - 8);
        wheel(g, w - 12, h - 8);
        return;
      }
      if (kind === "flyer") {
        for (let i = 0; i < 5; i++) {
          rect(g, 2 + i * 2, 10 + i, 8, 2, "deepShade");
          rect(g, 22 - i * 2, 10 + i, 8, 2, "deepShade");
        }
        rect(g, 10, 13, 13, 17, "outline");
        rect(g, 12, 14, 9, 13, "deepLight");
        rect(g, 13, 17, 2, 2, "creamLight");
        rect(g, 19, 17, 2, 2, "creamLight");
        rect(g, 15, 24, 3, 3, "coral");
        return;
      }
      const cx = Math.floor(w / 2),
        body = giant ? 26 : 16,
        head = giant ? 24 : 16,
        top = giant ? 5 : 4,
        bottom = h - 7;
      rect(
        g,
        cx - body / 2 - 1,
        top + head,
        body + 2,
        bottom - top - head,
        "outline",
      );
      rect(
        g,
        cx - body / 2,
        top + head + 1,
        body,
        bottom - top - head - 2,
        kind === "armored" ? "stoneShade" : "deep",
      );
      rect(g, cx - head / 2 - 1, top, head + 2, head + 2, "outline");
      rect(g, cx - head / 2, top + 1, head, head, "creamShade");
      rect(
        g,
        cx - head / 2,
        top,
        head,
        5,
        kind === "armored" ? "stone" : "deepShade",
      );
      rect(g, cx - head / 2 + 2, top + 7, 3, 2, "ink");
      rect(g, cx + 3, top + 7, 3, 2, "ink");
      rect(g, cx - 3, top + head - 3, 6, 2, "woodShade");
      rect(g, cx - body / 2 - 2, bottom, 8, 5, "woodShade");
      rect(g, cx + body / 2 - 5, bottom + (frame ? 0 : 1), 8, 5, "woodShade");
      rect(g, cx - body / 2 - 4, top + head + 6, 5, 9, "creamShade");
      rect(g, cx + body / 2, top + head + 6, 5, 9, "creamShade");
      if (kind === "climber") {
        line(g, w - 4, 12, w - 4, 33, "stoneLight", 2);
        line(g, w - 8, 12, w - 4, 9, "stoneLight");
      } else {
        line(g, w - 5, 19, w - 2, 7, "stoneLight", 2);
        rect(g, w - 7, 21, 7, 2, "gold");
      }
      if (kind === "armored") {
        rect(g, cx - 6, top + head + 4, 12, 8, "stone");
        rect(g, cx - 5, top + head + 4, 3, 7, "stoneLight");
      }
    });
    cache.set(k, c);
    return c;
  };
})();
