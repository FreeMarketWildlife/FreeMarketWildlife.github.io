import {
  TILE as T,
  scenes,
  buildings,
  getEntities,
  nearestEntity,
} from "./world.js";
const C = {
  grass: "#79a85b",
  grassDark: "#689750",
  grassLight: "#8eb868",
  path: "#d9c08a",
  pathLight: "#e5cf9c",
  ink: "#314842",
};
// Read-only art catalog uses these exact renderers; game rendering is unchanged.
export { tree, flower, plant, furniture, building };
const r = (c, x, y, w, h, color) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
};
const hash = (x, y) => (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
const oval = (c, x, y, rx, ry, color) => {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2);
  c.fill();
};
function text(c, str, x, y, color = "#fff6cf", size = 8, align = "center") {
  c.font = `bold ${size}px monospace`;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(str, Math.round(x), Math.round(y));
}
function plant(c, x, y, scale = 1, color = "#528858") {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  r(c, -2, -18, 3, 20, "#45734e");
  [
    [-9, -17, 9, 5],
    [-10, -12, 11, 5],
    [2, -21, 8, 5],
    [1, -14, 10, 5],
    [-5, -24, 5, 8],
  ].forEach((a, i) => r(c, ...a, i % 2 ? "#80b26b" : color));
  c.restore();
}
function tree(c, x, y, variant = 0) {
  oval(c, x + 3, y + 7, 20, 7, "#476e494f");
  r(c, x - 4, y - 10, 8, 18, "#79543e");
  r(c, x - 2, y - 8, 3, 15, "#a27850");
  const shades = variant
    ? ["#326c53", "#448557", "#62a260"]
    : ["#376b46", "#4d884b", "#71a456"];
  r(c, x - 18, y - 36, 36, 22, shades[0]);
  r(c, x - 22, y - 30, 44, 13, shades[0]);
  r(c, x - 13, y - 47, 26, 13, shades[0]);
  r(c, x - 16, y - 35, 30, 18, shades[1]);
  r(c, x - 19, y - 29, 36, 11, shades[1]);
  r(c, x - 10, y - 44, 19, 13, shades[1]);
  r(c, x - 9, y - 41, 11, 5, shades[2]);
  r(c, x - 14, y - 31, 9, 5, shades[2]);
  r(c, x + 3, y - 24, 11, 4, shades[2]);
}
function flower(c, x, y, color = "#f2d999") {
  r(c, x, y, 1, 5, "#4d884f");
  r(c, x - 2, y - 3, 5, 3, color);
  r(c, x - 1, y - 4, 3, 5, color);
  r(c, x, y - 2, 1, 1, "#b88a47");
}
export function character(
  c,
  x,
  y,
  { look = "hero", gender = "boy", facing = "down", walk = 0 } = {},
) {
  x = Math.round(x);
  y = Math.round(y);
  const step = Math.sin(walk) * 2;
  oval(c, x, y + 1, 8, 3, "#1e393c45");
  if (look === "kaid") {
    r(c, x + 6, y - 20, 6, 3, "#9fced0");
    r(c, x + 10, y - 18, 3, 8, "#9fced0");
    r(c, x + 7, y - 12, 6, 3, "#9fced0");
    r(c, x - 7, y - 24, 14, 4, "#d0e9d3");
    r(c, x - 10, y - 23, 4, 5, "#a1cecc");
    r(c, x - 7, y - 20, 15, 16, "#6dabad");
    r(c, x - 5, y - 17, 11, 10, "#e8b563");
    r(c, x - 4, y - 21, 2, 12, "#daf3d466");
    r(c, x - 4, y - 12, 2, 2, "#294650");
    r(c, x + 3, y - 12, 2, 2, "#294650");
    r(c, x - 1, y - 8, 3, 1, "#795740");
    r(c, x - 6, y - 4, 13, 3, "#537492");
    r(c, x - 5, y - 1, 4, 3 + step, "#344c65");
    r(c, x + 3, y - 1, 4, 3 - step, "#344c65");
    return;
  }
  const isHero = look === "hero" || look === "rival";
  const skin =
    look === "hero"
      ? "#a46b45"
      : look === "mom"
        ? "#ae7951"
        : look === "rival"
          ? "#deb685"
          : "#d2a878";
  const hair =
    look === "professor"
      ? "#dad9b8"
      : look === "hero" || look === "mom"
        ? "#302c30"
        : look === "rival"
          ? "#87583b"
          : "#5f4c3d";
  const shirt =
    look === "hero"
      ? "#efa756"
      : look === "rival"
        ? "#9b83b6"
        : look === "mom"
          ? "#ce9290"
          : look === "professor" || look === "doctor"
            ? "#e7e8ce"
            : look === "glassblower"
              ? "#ca9956"
              : "#6eb4a3";
  r(c, x - 6, y - 10, 12, 7, shirt);
  r(c, x - 8, y - 10, 3, 7, skin);
  r(c, x + 6, y - 10, 3, 7, skin);
  r(c, x - 5, y - 4, 4, 5 + step, "#3a6178");
  r(c, x + 2, y - 4, 4, 5 - step, "#3a6178");
  r(c, x - 6, y + step, 5, 2, "#313d46");
  r(c, x + 2, y - step, 5, 2, "#313d46");
  r(c, x - 6, y - 22, 12, 12, skin);
  r(c, x - 7, y - 22, 14, 5, hair);
  r(c, x - 5, y - 24, 10, 3, hair);
  if ((isHero && gender === "girl") || look === "mom") {
    r(c, x - 10, y - 23, 5, 6, hair);
    r(c, x + 6, y - 23, 5, 6, hair);
    r(c, x - 9, y - 23, 2, 2, "#eab766");
    r(c, x + 8, y - 23, 2, 2, "#eab766");
  }
  if (facing === "up") {
    r(c, x - 6, y - 19, 12, 7, hair);
    r(c, x - 3, y - 10, 6, 2, shirt);
  } else {
    r(c, x - 4 + (facing === "right" ? 2 : 0), y - 17, 2, 2, "#2b3436");
    r(c, x + 3 - (facing === "left" ? 2 : 0), y - 17, 2, 2, "#2b3436");
    r(c, x - 1, y - 13, 3, 1, "#7b4a37");
  }
  if (look === "professor") {
    r(c, x - 8, y - 23, 16, 3, "#acb493");
    r(c, x - 5, y - 26, 10, 4, "#c8cca3");
    r(c, x - 6, y - 18, 5, 4, "#527b75");
    r(c, x + 2, y - 18, 5, 4, "#527b75");
    r(c, x - 1, y - 17, 3, 1, "#527b75");
    r(c, x - 3, y - 10, 6, 7, "#8cac88");
  }
  if (look === "doctor") {
    r(c, x - 3, y - 8, 6, 2, "#c97f74");
    r(c, x - 1, y - 10, 2, 6, "#c97f74");
  }
  if (look === "glassblower") {
    r(c, x - 4, y - 10, 9, 8, "#5b7e88");
    r(c, x - 7, y - 21, 15, 3, "#81b6be");
  }
}
function furniture(c, o, s, time) {
  const x = o.x * T,
    y = o.y * T,
    w = o.w * T,
    h = o.h * T;
  r(c, x + 3, y + 5, w, h, "#4c524c27");
  if (o.kind === "bed") {
    r(c, x - 2, y - 4, w + 4, h + 6, "#855e47");
    r(c, x, y, w, h, "#e0dab2");
    r(c, x + 3, y + 3, w - 6, 18, "#f8efd1");
    r(c, x + 3, y + 23, w - 6, h - 26, "#6a9d9c");
    r(c, x + 3, y + 27, w - 6, 3, "#85b5af");
    r(c, x + 8, y + 34, 5, h - 42, "#7eaaa2");
    r(c, x + w - 11, y + 34, 5, h - 42, "#7eaaa2");
  } else if (o.kind === "tank") {
    r(c, x, y + 14, w, h - 10, "#986e50");
    r(c, x + 4, y + 23, w - 8, 2, "#bc9160");
    r(c, x + 4, y + 29, 3, 7, "#735842");
    r(c, x + w - 7, y + 29, 3, 7, "#735842");
    if (s.stage === "night" && ["broken", "kaid"].includes(s.storyBeat)) {
      for (let i = 0; i < 9; i++) {
        r(c, x + 5 + ((i * 17) % w), y + 31 + ((i * 11) % 20), 5, 2, "#d8e1c1");
        r(c, x + 6 + ((i * 17) % w), y + 29 + ((i * 11) % 20), 2, 2, "#b0d4c5");
      }
      r(c, x + 7, y + 2, 19, 11, "#72543e");
      r(c, x + 38, y + 7, 27, 6, "#72543e");
      return;
    }
    r(c, x - 1, y - 17, w + 2, 36, "#365f59");
    r(c, x + 2, y - 14, w - 4, 30, "#87b6a1");
    r(c, x + 4, y - 12, w - 8, 24, "#477b74");
    r(c, x + 4, y + 8, w - 8, 6, "#997959");
    plant(c, x + 15, y + 10, 0.65);
    plant(c, x + w - 17, y + 10, 0.8);
    r(c, x + 5, y - 13, 2, 23, "#cce4c766");
    r(c, x + w - 9, y - 9, 2, 15, "#cce4c733");
    r(c, x - 2, y - 19, w + 4, 4, "#d3dab0");
    if (s.stage === "night") {
      r(c, x + 33 + Math.sin(time) * 3, y + 6, 13, 4, "#e1bb69");
      r(c, x + 44, y + 3, 5, 5, "#e1bb69");
      r(c, x + 47, y + 4, 1, 1, "#31443b");
    }
  } else if (o.kind === "desk" || o.kind === "table" || o.kind === "counter") {
    r(c, x, y, w, h, "#8f644b");
    r(c, x - 2, y - 6, w + 4, h - 4, "#c8a375");
    r(c, x, y - 5, w, 3, "#e1bd86");
    r(c, x + 3, y + h - 11, 4, 12, "#78523e");
    r(c, x + w - 7, y + h - 11, 4, 12, "#78523e");
    if (o.kind === "desk") {
      r(c, x + 12, y - 2, 20, 13, "#edebc9");
      r(c, x + 22, y - 1, 1, 11, "#a19e83");
      r(c, x + 42, y - 5, 12, 14, "#689086");
      r(c, x + 43, y - 3, 10, 8, "#abd1b0");
    }
    if (o.kind === "table") {
      r(c, x + 25, y, 20, 17, "#e4d3a4");
      r(c, x + 32, y + 3, 7, 7, "#afc793");
    }
    if (o.kind === "counter") {
      r(c, x + 20, y - 10, 19, 16, "#56736b");
      r(c, x + 23, y - 7, 13, 7, "#a1c1a0");
      for (let i = 0; i < 3; i++) {
        r(
          c,
          x + 140 + i * 17,
          y - 8,
          11,
          14,
          ["#a1ba81", "#d9ae77", "#b7b8ce"][i],
        );
        r(c, x + 142 + i * 17, y - 11, 7, 4, "#e7dfb7");
      }
    }
  } else if (o.kind === "shelf" || o.kind === "kitchen") {
    r(c, x, y - 10, w, h + 10, "#85664d");
    r(c, x + 3, y - 7, w - 6, h + 3, "#bf9b6d");
    for (let i = 5; i < w - 7; i += 9)
      r(
        c,
        x + i,
        y - 5,
        6,
        h - 2,
        ["#779b92", "#c99373", "#d9c489", "#9aa07c"][Math.floor(i / 9) % 4],
      );
    r(c, x - 2, y + h - 4, w + 4, 5, "#9a7850");
  } else if (o.kind === "fern" || o.kind === "planter") {
    r(c, x, y + 4, w, h - 3, "#b17b54");
    r(c, x - 2, y, w + 4, 7, "#d29968");
    for (let a = 0; a < o.w; a++) plant(c, x + 12 + a * T, y + 3, 1);
  } else if (o.kind === "sofa") {
    r(c, x, y - 9, w, h + 7, "#5a8480");
    r(c, x + 5, y - 4, w - 10, h - 4, "#81a69b");
    r(c, x + w / 2, y - 4, 2, h - 3, "#5c8b83");
    r(c, x - 3, y + 2, 10, h - 1, "#71998f");
    r(c, x + w - 7, y + 2, 10, h - 1, "#71998f");
  } else if (o.kind === "log") {
    r(c, x, y, w, h, "#806247");
    r(c, x + 2, y + 3, w - 4, 4, "#a38152");
    r(c, x + 4, y + h - 5, w - 8, 2, "#5b503c");
    r(c, x + w - 7, y + 1, 8, h - 2, "#c39c64");
    r(c, x + w - 5, y + 4, 4, h - 8, "#a77d4e");
  } else if (o.kind === "leaves") {
    for (let i = 0; i < 18; i++)
      r(
        c,
        x + ((i * 13) % w),
        y + ((i * 7) % h),
        7,
        4,
        ["#a88b48", "#c09d54", "#6f904d"][i % 3],
      );
  }
}
function building(c, b) {
  const x = b.x * T,
    y = b.y * T,
    w = b.w * T,
    h = b.h * T;
  r(c, x + 6, y + 10, w, h, "#456b4538");
  r(c, x, y + 38, w, h - 38, b.color);
  r(c, x, y + h - 8, w, 9, "#ad9a6d");
  r(c, x - 5, y + 5, w + 10, 41, b.roof);
  r(c, x - 1, y, w + 2, 8, b.roof);
  r(c, x + 4, y - 4, w - 8, 8, b.roof);
  for (let i = 10; i < 42; i += 9) {
    r(c, x - 3, y + i, w + 6, 2, "#344a4030");
    for (let j = (i % 2) * 7; j < w; j += 19)
      r(c, x + j, y + i - 7, 1, 7, "#fff3c525");
  }
  r(c, x - 6, y + 43, w + 12, 4, "#725e4b");
  r(c, x + 13, y + 60, 25, 25, "#7c8f79");
  r(c, x + 15, y + 62, 21, 20, "#a8d2c1");
  r(c, x + 24, y + 62, 2, 20, "#f3e0b4");
  r(c, x + 15, y + 72, 21, 2, "#f3e0b4");
  r(c, x + w - 38, y + 60, 25, 25, "#7c8f79");
  r(c, x + w - 36, y + 62, 21, 20, "#a8d2c1");
  r(c, x + w - 27, y + 62, 2, 20, "#f3e0b4");
  r(c, x + w - 36, y + 72, 21, 2, "#f3e0b4");
  r(c, x + w / 2 - 12, y + h - 32, 24, 32, "#645e46");
  r(c, x + w / 2 - 9, y + h - 30, 18, 30, "#476861");
  r(c, x + w / 2 + 4, y + h - 16, 2, 3, "#e9c585");
  r(c, x + w / 2 - 39, y + 50, 78, 13, "#f2e4b9");
  r(c, x + w / 2 - 39, y + 62, 78, 2, "#b79c69");
  text(c, b.name, x + w / 2, y + 59, "#4b6459", b.name.length > 10 ? 6 : 7);
  r(c, x + w / 2 - 18, y + h, 36, 7, "#dfc98e");
  flower(c, x + 9, y + h - 2, "#e7b5a1");
  flower(c, x + w - 9, y + h - 2, "#e7b5a1");
}
export function renderWorld(canvas, s, time = 0, moving = false) {
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  const scene = scenes[s.scene];
  const camX = Math.max(
    0,
    Math.min(scene.w * T - canvas.width, s.player.x * T - canvas.width / 2),
  );
  const camY = Math.max(
    0,
    Math.min(scene.h * T - canvas.height, s.player.y * T - canvas.height / 2),
  );
  c.save();
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.translate(-Math.round(camX), -Math.round(camY));
  const outdoor = scene.style === "yard" || scene.style === "town";
  for (let y = 0; y < scene.h; y++)
    for (let x = 0; x < scene.w; x++) {
      if (outdoor) {
        const path =
          scene.style === "town"
            ? y === 8 ||
              y === 9 ||
              y === 17 ||
              y === 18 ||
              y === 25 ||
              x === 9 ||
              x === 10 ||
              x === 19 ||
              x === 20 ||
              (y > 5 && y < 9 && [4, 5, 14, 15, 24, 25].includes(x)) ||
              (y > 14 && y < 18 && [4, 5, 14, 15, 24, 25].includes(x))
            : x >= 7 && x <= 8;
        r(c, x * T, y * T, T, T, path ? C.path : C.grass);
        if (path) {
          r(c, x * T + Math.abs(hash(x, y)) * 16, y * T + 6, 3, 1, C.pathLight);
          r(c, x * T + 12, y * T + 18, 4, 1, "#cbb17c");
        } else {
          r(c, x * T + 3, y * T + 7, 2, 2, C.grassDark);
          r(c, x * T + 15, y * T + 17, 3, 1, C.grassLight);
          if ((x * 7 + y * 3) % 11 === 0) {
            r(c, x * T + 17, y * T + 5, 1, 3, C.grassDark);
            r(c, x * T + 19, y * T + 6, 1, 2, C.grassDark);
          }
        }
      } else {
        r(c, x * T, y * T, T, T, (x + y) % 3 === 0 ? "#c4a279" : "#c9a77d");
        r(c, x * T, y * T, T, 1, "#b18c68");
        r(c, x * T + (y % 2 ? 12 : 0), y * T, 1, T, "#b99672");
        r(c, x * T + 5, y * T + 12, 12, 1, "#d0ae83");
      }
    }
  if (!outdoor) {
    r(
      c,
      0,
      0,
      scene.w * T,
      65,
      scene.style === "bedroom" ? "#bad0ad" : "#c4d1ad",
    );
    r(c, 0, 0, scene.w * T, 9, "#7c9e83");
    for (let x = 0; x < scene.w * T; x += 24) {
      r(c, x, 10, 1, 51, "#acbc9b");
      r(c, x + 5, 18, 4, 3, "#a6be9d40");
    }
    r(c, 0, 61, scene.w * T, 7, "#776e52");
    r(c, 0, 58, scene.w * T, 4, "#e1d7ac");
    r(c, 0, 65, 10, scene.h * T, "#77725a");
    r(c, scene.w * T - 10, 65, 10, scene.h * T, "#77725a");
    r(c, 0, scene.h * T - 8, scene.w * T, 8, "#776e52");
    r(c, 178, 18, 44, 33, "#768e74");
    r(c, 181, 21, 38, 26, s.stage === "night" ? "#476079" : "#99c9c3");
    r(c, 198, 21, 3, 26, "#ece6c1");
    r(c, 181, 34, 38, 3, "#ece6c1");
    r(c, 174, 16, 9, 39, "#d7be91");
    r(c, 219, 16, 8, 39, "#d7be91");
    const rug =
      scene.style === "bedroom" ? [116, 148, 132, 78] : [110, 149, 131, 85];
    r(c, ...rug, "#769d90");
    r(c, rug[0] + 5, rug[1] + 5, rug[2] - 10, rug[3] - 10, "#aac1a0");
    r(c, rug[0] + 9, rug[1] + 9, rug[2] - 18, rug[3] - 18, "#81a699");
    for (let a = 0; a < 6; a++) {
      r(c, rug[0] + 20 + a * 18, rug[1] + 13, 3, 3, "#c4cfaa");
      r(c, rug[0] + 20 + a * 18, rug[1] + rug[3] - 16, 3, 3, "#c4cfaa");
    }
    if (s.scene === "bedroom") {
      r(c, 316, 246, 20, 32, "#6c6352");
      for (let a = 0; a < 4; a++) r(c, 318, 249 + a * 7, 16, 3, "#dfc29a");
      r(c, 34, 46, 18, 12, "#507465");
      text(c, "✦", 43, 55, "#edcb8f");
    } else {
      r(c, 178, 267, 28, 15, "#546957");
      r(c, 181, 269, 22, 13, "#c7c191");
    }
  }
  if (scene.style === "yard") {
    r(c, 111, 0, 168, 74, "#caaa80");
    r(c, 105, 0, 180, 22, "#ab6751");
    r(c, 171, 27, 42, 48, "#56766a");
    r(c, 200, 53, 3, 4, "#eac18a");
    for (let y = 3; y < 11; y++) {
      r(c, 14, y * T, 5, 23, "#c5b98a");
      r(c, scene.w * T - 20, y * T, 5, 23, "#c5b98a");
    }
    r(c, 12, 86, 7, 164, "#b4a16e");
    r(c, 365, 86, 7, 164, "#b4a16e");
    tree(c, 45, 111);
    tree(c, 345, 123, 1);
    for (let i = 0; i < 6; i++)
      flower(c, 42 + i * 13, 250, ["#f2d999", "#ebc0a2"][i % 2]);
  }
  if (scene.style === "town") {
    for (let x = 1; x < 32; x += 2) {
      tree(c, x * T, 42, x % 3);
      tree(c, x * T, 27 * T + 16, x % 3);
    }
    for (let y = 4; y < 26; y += 3) {
      tree(c, 8, y * T, 1);
      if (y !== 16 && y !== 19) tree(c, 31.5 * T, y * T);
    }
    // Water garden creates a landmark between the residential street and shops.
    r(c, 27.7 * T, 10.3 * T, 65, 72, "#b7bf8a");
    r(c, 28 * T, 10.5 * T, 56, 60, "#74a8a3");
    r(c, 28.2 * T, 10.8 * T, 47, 49, "#619c9d");
    for (let i = 0; i < 5; i++)
      r(c, 28.3 * T + ((i * 11) % 40), 11 * T + i * 8, 13, 1, "#a2cfbd");
    r(c, 29 * T, 11.3 * T, 10, 4, "#98bb78");
    r(c, 29.1 * T, 11.2 * T, 4, 3, "#e6c4aa");
    buildings.forEach((b) => building(c, b));
    for (const [x, y] of [
      [10, 6],
      [20, 6],
      [1, 10],
      [11, 15],
      [21, 15],
      [3, 21],
      [16, 23],
    ])
      tree(c, x * T, y * T, y % 2);
    for (let i = 0; i < 20; i++)
      flower(c, (3 + i * 1.2) * T, 10.3 * T, i % 3 ? "#f2d999" : "#dfafa0");
    r(c, 8.3 * T, 16.1 * T, 3, 20, "#846a48");
    r(c, 7.8 * T, 16 * T, 29, 14, "#e8d7a4");
    text(c, "MAP", 8.4 * T, 16.4 * T, "#5a7756", 7);
    r(c, 29.7 * T, 16.3 * T, 4, 23, "#846a48");
    r(c, 29 * T, 16 * T, 41, 14, "#e8d7a4");
    text(c, "ROUTE →", 29.8 * T, 16.4 * T, "#5a7756", 6);
  }
  const drawables = scene.objects.map((o) => ({
    y: o.y + o.h,
    draw: () => furniture(c, o, s, time),
  }));
  if (s.stage === "night" && s.storyBeat && s.storyBeat !== "feeding")
    drawables.push({
      y: 6.5,
      draw: () => character(c, 11 * T, 6.5 * T, { look: "mom" }),
    });
  if (s.storyBeat === "kaid")
    drawables.push({
      y: 8.4,
      draw: () => character(c, 12 * T, 8.4 * T, { look: "kaid" }),
    });
  for (const e of getEntities(s))
    if (e.type === "npc")
      drawables.push({
        y: e.y,
        draw: () =>
          character(c, e.x * T, e.y * T, {
            look: e.look,
            gender:
              e.look === "rival"
                ? s.gender === "boy"
                  ? "girl"
                  : "boy"
                : "boy",
            walk: 0,
          }),
      });
  drawables.push({
    y: s.player.y,
    draw: () =>
      character(c, s.player.x * T, s.player.y * T, {
        gender: s.gender,
        facing: s.player.facing,
        walk: moving ? time * 12 : 0,
      }),
  });
  drawables.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
  for (const e of getEntities(s))
    if (e.type === "rescue") {
      const bob = Math.sin(time * 3 + e.x) * 2;
      const x = e.x * T,
        y = e.y * T - 16 + bob;
      r(c, x - 1, y - 5, 2, 10, "#fff4bc");
      r(c, x - 5, y - 1, 10, 2, "#fff4bc");
      r(c, x - 2, y - 2, 4, 4, "#fffbdc");
    }
  if (s.stage === "night") {
    r(c, 0, 0, scene.w * T, scene.h * T, "#20345655");
    r(c, 7 * T, 2 * T, 3 * T, 4 * T, "#f4d78c12");
  }
  const near = nearestEntity(s);
  if (near && near.type === "npc") {
    text(c, "•", near.x * T, near.y * T - 32, "#fff4bc", 14);
  }
  c.restore();
}
export function renderTank(
  canvas,
  t,
  time = 0,
  { frame = 50, zoom = 1, reticle = false } = {},
) {
  const c = canvas.getContext("2d"),
    W = canvas.width,
    H = canvas.height;
  c.imageSmoothingEnabled = false;
  r(c, 0, 0, W, H, "#163d3e");
  c.save();
  c.translate(W / 2, H / 2);
  c.scale(zoom, zoom);
  c.translate(-W / 2 - (frame - 50) * 0.6, -H / 2);
  const bottom = H * 0.83;
  for (let j = 0; j < 6; j++)
    r(
      c,
      0,
      (j * H) / 7,
      W,
      H / 7,
      ["#23484b", "#284f4e", "#2c5551", "#335d54", "#3a6659", "#3b6956"][j],
    );
  for (let i = 0; i < 7; i++) {
    r(c, 15 + i * 51, 0, 6, H * 0.8, "#b6df9c08");
    r(c, 20 + i * 51, 0, 2, H * 0.8, "#c9e9b20c");
  }
  r(c, 0, bottom, W, H - bottom, "#6b5642");
  r(c, 0, bottom + 4, W, 4, "#9c7d50");
  r(c, 0, bottom + 12, W, 3, "#4f4639");
  for (let i = 0; i < 45; i++)
    r(
      c,
      (i * 39) % W,
      bottom + 6 + ((i * 13) % (H - bottom - 6)),
      3,
      2,
      ["#a68a5d", "#514a39", "#87704c"][i % 3],
    );
  // Original hardscape: driftwood, stones, leaf litter, and layered moss.
  r(c, W * 0.45, bottom - 21, W * 0.27, 18, "#735e43");
  r(c, W * 0.47, bottom - 25, W * 0.22, 7, "#927952");
  r(c, W * 0.5, bottom - 19, W * 0.18, 3, "#ab925c");
  r(c, W * 0.62, bottom - 20, 8, 16, "#4f503c");
  r(c, W * 0.73, bottom - 17, 29, 19, "#849485");
  r(c, W * 0.75, bottom - 23, 21, 8, "#9bab91");
  r(c, W * 0.72, bottom - 6, 35, 7, "#6e8073");
  if (t.hide) {
    r(c, W * 0.25, bottom - 15, 28, 15, "#96794f");
    r(c, W * 0.25 + 4, bottom - 19, 20, 5, "#b79460");
    r(c, W * 0.25 + 9, bottom - 9, 11, 9, "#3f4935");
  }
  for (let i = 0; i < t.plants; i++) {
    const x = 30 + ((i * 67) % (W - 40)),
      height = 38 + ((i * 17) % 39),
      sway = Math.sin(time * 0.8 + i) * 2;
    r(c, x + sway, bottom - height, 3, height, "#61986d");
    for (let j = 0; j < 5; j++) {
      const y = bottom - 10 - (j * height) / 5,
        width = 12 - j;
      r(c, x - width + sway, y - 3, width, 5, j % 2 ? "#79b87a" : "#65a66e");
      r(c, x + 3 + sway, y - 8, width, 5, j % 2 ? "#9ccc8a" : "#87bf7f");
    }
    r(c, x - 17, bottom - 3, 37, 6, "#6a9963");
    r(c, x - 12, bottom - 6, 26, 5, "#91b86b");
  }
  for (let i = 0; i < Math.floor(t.food / 6); i++) {
    const x = (i * 43 + 12) % W;
    r(c, x, bottom - 3 - (i % 3) * 2, 10, 3, "#c09b5e");
    r(c, x + 2, bottom - 5 - (i % 3) * 2, 5, 2, "#a88a51");
  }
  for (let i = 0; i < Math.min(24, t.isopods); i++) {
    const speed = t.stress > 50 ? 0.3 : 1;
    const x = 16 + ((i * 41 + time * (3 + (i % 3)) * speed) % (W - 35)),
      y = bottom - 7 - (i % 3) * 4;
    oval(c, x, y, 5, 3, "#b8b6a0");
    r(c, x - 3, y - 3, 6, 1, "#d3d1b6");
    for (let j = -3; j <= 3; j += 2) r(c, x + j, y - 2, 1, 4, "#7b8276");
    r(c, x + 5, y - 1, 2, 1, "#454f43");
    r(c, x - 3, y + 3, 1, 2, "#aaa78f");
    r(c, x + 2, y + 3, 1, 2, "#aaa78f");
  }
  for (let i = 0; i < Math.min(35, t.springtails); i++) {
    const x = 10 + ((i * 31 + time * 2) % (W - 20)),
      jump = Math.sin(time * 2 + i) > 0.95 ? 4 : 0;
    r(c, x, bottom - 1 - (i % 6) * 2 - jump, 2, 1, "#ebebcd");
  }
  for (let i = 0; i < Math.floor(t.algae / 4); i++) {
    r(c, (i * 37) % W, 30 + ((i * 29) % (bottom - 30)), 6, 3, "#8faa4970");
  }
  for (let i = 0; i < Math.floor(t.waste / 9); i++)
    r(c, 25 + ((i * 71) % (W - 40)), bottom - 2, 7, 3, "#594838");
  if (t.moisture > 78)
    for (let i = 0; i < 14; i++) {
      r(c, 10 + i * 23, 10 + ((i * 31) % 90), 2, 3, "#cae7c170");
    }
  c.restore();
  r(c, 0, 0, W, 4, "#b0c9a4");
  r(c, 0, H - 4, W, 4, "#749989");
  r(c, 0, 0, 4, H, "#a5c3a0");
  r(c, W - 4, 0, 4, H, "#749989");
  r(c, 8, 8, 2, H - 17, "#dbf1ce33");
  if (reticle) {
    const pad = 17,
      len = 13;
    for (const [x, y, sx, sy] of [
      [pad, pad, 1, 1],
      [W - pad, pad, -1, 1],
      [pad, H - pad, 1, -1],
      [W - pad, H - pad, -1, -1],
    ]) {
      r(c, x + (sx < 0 ? -len : 0), y, len, 1, "#f2f3cb");
      r(c, x, y + (sy < 0 ? -len : 0), 1, len, "#f2f3cb");
    }
    r(c, W / 3, 17, 1, H - 34, "#f2f3cb25");
    r(c, (W * 2) / 3, 17, 1, H - 34, "#f2f3cb25");
    r(c, 17, H / 3, W - 34, 1, "#f2f3cb25");
    r(c, 17, (H * 2) / 3, W - 34, 1, "#f2f3cb25");
  }
}
