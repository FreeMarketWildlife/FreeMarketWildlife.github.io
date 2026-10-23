(function () {
  'use strict';

  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  const sprites = Object.create(null);
  const miniatures = Object.create(null);

  // Scanline fills keep every edge on the same one-pixel grid as the world.
  function rect(g, color, x, y, w, h) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }

  function polygon(g, color, points) {
    let top = 128, bottom = -1;
    for (const point of points) {
      top = Math.min(top, point[1]);
      bottom = Math.max(bottom, point[1]);
    }
    for (let y = top; y < bottom; y++) {
      const cuts = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[j], b = points[i];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
          cuts.push(a[0] + (y + 0.5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      cuts.sort((a, b) => a - b);
      for (let x = 0; x + 1 < cuts.length; x += 2) {
        const left = Math.ceil(cuts[x] - 0.5);
        rect(g, color, left, y, Math.ceil(cuts[x + 1] - 0.5) - left, 1);
      }
    }
  }

  function line(g, color, x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
    const dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(g, color, x1, y1, 1, 1);
      if (x1 === x2 && y1 === y2) break;
      const twice = 2 * error;
      if (twice >= dy) { error += dy; x1 += sx; }
      if (twice <= dx) { error += dx; y1 += sy; }
    }
  }

  function octagon(g, color, x, y, w, h, corner) {
    polygon(g, color, [[x + corner,y],[x + w - corner,y],[x + w,y + corner],
      [x + w,y + h - corner],[x + w - corner,y + h],[x + corner,y + h],
      [x,y + h - corner],[x,y + corner]]);
  }

  function canvas(width, height, draw) {
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    const g = result.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, A.palette);
    return result;
  }

  function button(g, p, x, y, size) {
    const small = size < 12;
    const border = small ? 1 : 2;
    octagon(g, p.outline, x, y, size, size, small ? 2 : 5);
    octagon(g, p.goldShade, x + border, y + border, size - border * 2, size - border * 2, small ? 1 : 4);
    octagon(g, p.gold, x + border, y + border, size - border * 2 - 1, size - border * 2 - 2, small ? 1 : 3);
    if (!small) {
      rect(g, p.creamShade, x + 5, y + 3, size - 11, 1);
      rect(g, p.woodLight, x + size - 4, y + 6, 1, size - 12);
    }
    const hole = small ? 1 : 3;
    const start = small ? 3 : 6;
    const gap = small ? 3 : size - 15;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        rect(g, p.outline, x + start + col * gap, y + start + row * gap, hole, hole);
      }
    }
  }

  function chimney(g, p, x, y, workshop) {
    const w = workshop ? 15 : 18;
    rect(g, p.outline, x + 2, y + 7, w - 4, 41);
    rect(g, p.cream, x + 4, y + 8, w - 8, 35);
    rect(g, p.creamShade, x + w - 6, y + 8, 2, 35);
    rect(g, p.creamLight, x + 4, y + 9, 2, 16);
    rect(g, p.creamShade, x + 4, y + 22, 4, 2);
    rect(g, p.creamShade, x + 8, y + 31, w - 12, 2);
    polygon(g, p.outline, [[x + 2,y],[x + w - 2,y],[x + w,y + 3],[x + w,y + 9],[x,y + 9],[x,y + 3]]);
    rect(g, p.coralShade, x + 1, y + 3, w - 2, 5);
    rect(g, p.coral, x + 2, y + 1, w - 4, 5);
    rect(g, p.coralLight, x + 3, y + 1, w - 6, 1);
    rect(g, p.coralLight, x + 3, y + 3, 3, 1);
  }

  function walls(g, p) {
    // The face is entirely frontal; the roof overhang does not expose a side wall.
    polygon(g, p.outline, [[13,64],[61,26],[69,26],[116,64],[116,127],[13,127]]);
    polygon(g, p.creamShade, [[16,65],[62,29],[68,29],[113,65],[113,124],[16,124]]);
    polygon(g, p.cream, [[18,65],[62,30],[67,30],[110,65],[110,120],[18,120]]);
    rect(g, p.creamLight, 20, 75, 89, 3);
    // Quiet plaster patches leave the façade readable at gameplay scale.
    rect(g, p.creamShade, 23, 72, 6, 2);
    rect(g, p.creamShade, 25, 74, 4, 1);
    rect(g, p.creamShade, 57, 80, 5, 2);
    rect(g, p.creamShade, 102, 100, 5, 2);
    rect(g, p.creamShade, 23, 113, 5, 2);
    rect(g, p.creamShade, 28, 116, 6, 2);
    rect(g, p.creamShade, 56, 119, 7, 2);
    // Posts and rounded shoes establish the common building family.
    for (const x of [14,109]) {
      rect(g, p.outline, x, 65, 6, 58);
      rect(g, p.wood, x + 1, 67, 4, 54);
      rect(g, p.woodLight, x + 1, 69, 1, 48);
      rect(g, p.woodShade, x + 4, 72, 1, 45);
      octagon(g, p.outline, x - 1, 116, 8, 10, 1);
      rect(g, p.wood, x, 118, 6, 7);
      rect(g, p.woodLight, x, 118, 5, 1);
    }
    rect(g, p.outline, 10, 126, 111, 2);
    rect(g, p.stoneShade, 21, 121, 87, 5);
    rect(g, p.stoneLight, 21, 121, 87, 2);
    for (const x of [30,47,64,81,98]) rect(g, p.stoneShade, x, 121, 1, 3);
  }

  function roof(g, p, workshop) {
    // Layered, gently bell-shaped eaves are the signature Buttonwood silhouette.
    polygon(g, p.outline, [[1,59],[1,66],[6,71],[16,73],[30,65],[45,47],[59,32],
      [65,29],[72,33],[88,52],[104,66],[119,71],[126,67],[128,60],[115,56],
      [104,50],[91,35],[80,23],[70,16],[55,16],[44,23],[30,39],[19,50],[10,55]]);
    polygon(g, p.woodShade, [[5,63],[6,68],[15,71],[29,63],[44,45],[59,29],[65,26],
      [73,31],[89,50],[105,64],[119,69],[125,64],[115,60],[103,54],[86,35],[72,23],[56,24],[36,43],[20,58]]);
    polygon(g, p.coralShade, [[3,59],[3,65],[8,68],[15,69],[28,61],[43,43],[58,28],
      [65,25],[74,29],[91,49],[107,62],[120,66],[125,63],[126,60],[114,58],
      [102,51],[89,35],[79,25],[69,18],[55,18],[45,25],[31,41],[20,52],[10,57]]);
    polygon(g, p.coral, [[4,59],[4,64],[10,66],[15,66],[26,59],[41,41],[56,26],
      [64,23],[70,24],[79,30],[94,47],[108,58],[120,63],[124,62],[114,58],
      [102,51],[89,35],[79,25],[69,18],[55,18],[45,25],[31,41],[20,52],[10,57]]);
    polygon(g, p.coralLight, [[9,58],[19,54],[33,40],[46,26],[55,20],[68,20],
      [75,24],[68,22],[56,22],[47,29],[35,43],[21,57],[11,61],[5,61],[5,60]]);
    // Sparse tile clusters follow the roof's sweep, leaving generous flat color.
    const tileHighlights = [[15,58,6,2],[26,51,5,2],[35,42,5,2],[44,32,5,2],
      [54,24,7,2],[67,20,3,2],[77,27,4,2],[86,37,4,2],[96,48,5,2],[109,57,5,2],[118,61,5,1]];
    for (const [x,y,w,h] of tileHighlights) rect(g, p.coralLight, x, y, w, h);
    const tileShadows = [[17,62,4,1],[27,55,4,1],[36,46,3,1],[45,36,3,1],
      [57,27,3,1],[72,26,3,1],[84,35,3,1],[93,45,3,1],[104,55,3,1],[114,61,3,1]];
    for (const [x,y,w,h] of tileShadows) rect(g, p.coralShade, x, y, w, h);
    // A stout fascia ties the front gable to the eave posts.
    rect(g, p.outline, 25, 63, 75, 6);
    rect(g, p.wood, 26, 64, 73, 3);
    rect(g, p.woodLight, 28, 64, 69, 1);
    rect(g, p.woodShade, 29, 67, 69, 1);
    if (workshop) {
      polygon(g, p.outline, [[61,33],[67,33],[67,63],[61,63]]);
      rect(g, p.wood, 62, 34, 4, 29);
      rect(g, p.woodLight, 62, 35, 1, 26);
      polygon(g, p.outline, [[41,49],[45,46],[59,60],[56,63]]);
      polygon(g, p.wood, [[43,48],[45,49],[57,61],[55,62]]);
      polygon(g, p.outline, [[73,60],[84,47],[88,51],[78,63]]);
      polygon(g, p.wood, [[76,60],[85,50],[86,52],[78,61]]);
      rect(g, p.woodLight, 60, 32, 8, 3);
    } else {
      rect(g, p.woodShade, 60, 33, 7, 5);
      rect(g, p.wood, 61, 33, 5, 4);
      rect(g, p.woodLight, 61, 33, 1, 3);
      button(g, p, 52, 41, 23);
    }
  }

  function archedDoor(g, p, x, y, width, height, hasHandle = true) {
    const shoulder = 7;
    polygon(g, p.creamShade, [[x + 8,y - 5],[x + width - 8,y - 5],[x + width - 2,y],
      [x + width + 2,y + shoulder],[x + width + 2,y + height],[x - 2,y + height],[x - 2,y + shoulder],[x + 2,y]]);
    polygon(g, p.creamLight, [[x + 8,y - 4],[x + width - 8,y - 4],[x + width - 3,y + 1],
      [x + width,y + shoulder],[x + width,y + height],[x,y + height],[x,y + shoulder],[x + 3,y + 1]]);
    polygon(g, p.outline, [[x + 8,y],[x + width - 8,y],[x + width - 3,y + 4],
      [x + width - 1,y + shoulder],[x + width - 1,y + height],[x + 1,y + height],[x + 1,y + shoulder],[x + 3,y + 4]]);
    polygon(g, p.woodShade, [[x + 8,y + 2],[x + width - 8,y + 2],[x + width - 5,y + 5],
      [x + width - 3,y + 8],[x + width - 3,y + height - 2],[x + 3,y + height - 2],[x + 3,y + 8],[x + 5,y + 5]]);
    polygon(g, p.wood, [[x + 8,y + 2],[x + width - 9,y + 2],[x + width - 6,y + 5],
      [x + width - 5,y + 8],[x + width - 5,y + height - 3],[x + 4,y + height - 3],[x + 4,y + 8],[x + 6,y + 5]]);
    for (let plank = x + 8; plank < x + width - 5; plank += 5) {
      rect(g, p.woodShade, plank, y + 8, 1, height - 12);
      rect(g, p.woodLight, plank + 1, y + 8, 1, height - 14);
    }
    rect(g, p.woodLight, x + 6, y + 9, 1, height - 16);
    rect(g, p.woodShade, x + 6, y + 21, 2, 2);
    // A small iron loop is deliberately quieter than the gable button.
    if (hasHandle) {
      octagon(g, p.ink, x + width - 9, y + height - 18, 5, 7, 1);
      rect(g, p.stoneShade, x + width - 8, y + height - 17, 3, 5);
      rect(g, p.stoneLight, x + width - 8, y + height - 17, 2, 1);
      rect(g, p.woodShade, x + width - 7, y + height - 15, 1, 2);
    }
    rect(g, p.creamShade, x - 1, y + 16, 2, 1);
    rect(g, p.creamShade, x - 1, y + 27, 2, 1);
    rect(g, p.creamShade, x + width - 1, y + 16, 2, 1);
    rect(g, p.creamShade, x + width - 1, y + 27, 2, 1);
    line(g, p.creamShade, x + 5, y - 1, x + 7, y + 1);
    line(g, p.creamShade, x + width - 6, y - 1, x + width - 8, y + 1);
    rect(g, p.outline, x, y + height - 1, width, 2);
    rect(g, p.creamLight, x + 1, y + height - 2, width - 2, 1);
  }

  function flower(g, p, x, y, coral) {
    rect(g, p.mintShade, x, y + 1, 1, 5);
    const petals = coral ? p.coralLight : p.creamLight;
    rect(g, petals, x - 1, y - 2, 3, 5);
    rect(g, petals, x - 2, y - 1, 5, 3);
    rect(g, p.gold, x, y, 1, 1);
  }

  function windowBox(g, p, x, y) {
    polygon(g, p.outline, [[x + 5,y],[x + 15,y],[x + 19,y + 4],[x + 19,y + 27],[x + 1,y + 27],[x + 1,y + 4]]);
    polygon(g, p.wood, [[x + 6,y + 2],[x + 14,y + 2],[x + 17,y + 5],[x + 17,y + 25],[x + 3,y + 25],[x + 3,y + 5]]);
    polygon(g, p.waterShade, [[x + 7,y + 4],[x + 13,y + 4],[x + 15,y + 6],[x + 15,y + 23],[x + 5,y + 23],[x + 5,y + 6]]);
    rect(g, p.water, x + 6, y + 6, 3, 8);
    rect(g, p.waterLight, x + 6, y + 6, 1, 5);
    rect(g, p.water, x + 12, y + 8, 2, 6);
    rect(g, p.water, x + 6, y + 17, 3, 5);
    rect(g, p.woodLight, x + 9, y + 4, 2, 19);
    rect(g, p.woodLight, x + 5, y + 14, 10, 2);
    for (const sx of [x - 7,x + 20]) {
      octagon(g, p.outline, sx, y + 5, 8, 22, 1);
      rect(g, p.mint, sx + 1, y + 6, 6, 20);
      rect(g, p.mintLight, sx + 1, y + 6, 5, 1);
      rect(g, p.mintShade, sx + 6, y + 7, 1, 18);
      rect(g, p.mintShade, sx + 2, y + 10, 3, 2);
      rect(g, p.mintShade, sx + 2, y + 20, 3, 2);
    }
    polygon(g, p.outline, [[x - 2,y + 26],[x + 22,y + 26],[x + 21,y + 33],[x,y + 33]]);
    rect(g, p.wood, x, y + 28, 20, 4);
    rect(g, p.woodLight, x, y + 28, 20, 1);
    rect(g, p.woodShade, x + 3, y + 30, 1, 2);
    rect(g, p.woodShade, x + 16, y + 30, 1, 2);
    polygon(g, p.mintShade, [[x - 1,y + 25],[x + 2,y + 21],[x + 5,y + 25],[x + 8,y + 22],
      [x + 11,y + 25],[x + 14,y + 21],[x + 17,y + 25],[x + 21,y + 23],[x + 22,y + 27],[x,y + 28]]);
    rect(g, p.mint, x + 2, y + 24, 3, 4);
    rect(g, p.mint, x + 9, y + 25, 2, 4);
    rect(g, p.mintLight, x + 15, y + 24, 3, 3);
    flower(g, p, x + 4, y + 23, false);
    flower(g, p, x + 16, y + 23, true);
  }

  function lantern(g, p, x, y) {
    rect(g, p.outline, x + 3, y - 4, 2, 4);
    rect(g, p.outline, x + 2, y - 3, 4, 1);
    polygon(g, p.ink, [[x + 2,y - 1],[x + 6,y - 1],[x + 8,y + 2],[x + 7,y + 14],[x + 1,y + 14],[x,y + 2]]);
    rect(g, p.mintShade, x + 2, y + 3, 4, 9);
    rect(g, p.gold, x + 3, y + 4, 2, 6);
    rect(g, p.creamLight, x + 3, y + 4, 1, 4);
    rect(g, p.mint, x + 1, y + 2, 6, 1);
    rect(g, p.mint, x + 2, y + 11, 4, 1);
  }

  function sprig(g, p, x, y, flip) {
    const direction = flip ? -1 : 1;
    line(g, p.mintShade, x, y, x + direction * 2, y - 8);
    polygon(g, p.mint, [[x,y - 2],[x - 5,y - 5],[x - 5,y - 9],[x - 2,y - 8],[x + 1,y - 3]]);
    polygon(g, p.mintShade, [[x,y],[x + 6,y - 4],[x + 7,y - 9],[x + 4,y - 8],[x + 1,y - 3]]);
    rect(g, p.mintLight, x - 4, y - 8, 1, 3);
  }

  function drawHome(g, p) {
    chimney(g, p, 17, 11, false);
    walls(g, p);
    roof(g, p, false);
    windowBox(g, p, 32, 80);
    archedDoor(g, p, 75, 86, 25, 40);
    lantern(g, p, 102, 82);
    // A short picket and a tiny planting are part of the silhouette, never collision.
    rect(g, p.outline, 119, 110, 3, 17);
    rect(g, p.wood, 120, 111, 1, 15);
    rect(g, p.outline, 114, 119, 12, 3);
    rect(g, p.woodLight, 115, 119, 10, 1);
    rect(g, p.outline, 124, 114, 3, 14);
    rect(g, p.wood, 125, 115, 1, 12);
    sprig(g, p, 10, 126, false);
    sprig(g, p, 58, 126, true);
    rect(g, p.mint, 54, 125, 9, 2);
    rect(g, p.ink, 8, 127, 117, 1);
  }

  function awning(g, p) {
    polygon(g, p.outline, [[17,70],[79,70],[83,84],[81,89],[13,89],[11,84]]);
    polygon(g, p.cream, [[18,72],[78,72],[80,83],[78,87],[15,87],[14,83]]);
    for (const x of [22,39,56,73]) {
      polygon(g, p.mint, [[x,72],[x + 8,72],[x + 5,83],[x + 4,87],[x - 4,87],[x - 4,83]]);
      rect(g, p.mintLight, x, 72, 8, 1);
    }
    rect(g, p.creamLight, 18, 72, 60, 1);
    for (let x = 15; x < 79; x += 17) {
      rect(g, p.creamShade, x, 84, 9, 3);
      rect(g, p.cream, x, 84, 8, 1);
      rect(g, p.mintShade, x + 9, 84, 8, 3);
      rect(g, p.mint, x + 9, 84, 7, 1);
    }
    rect(g, p.outline, 13, 88, 68, 1);
  }

  function crate(g, p, x, y, width, height, hasButton) {
    rect(g, p.outline, x, y, width, height);
    rect(g, p.wood, x + 1, y + 1, width - 2, height - 2);
    rect(g, p.woodShade, x + 2, y + 3, width - 4, height - 5);
    rect(g, p.woodLight, x + 1, y + 1, width - 2, 2);
    rect(g, p.wood, x + 3, y + 4, width - 6, height - 7);
    rect(g, p.woodLight, x + 1, y + 3, 2, height - 4);
    rect(g, p.woodLight, x + 3, y + height - 3, width - 5, 1);
    if (hasButton) button(g, p, x + 4, y + 4, 10);
    else rect(g, p.woodShade, x + Math.floor(width / 2), y + 4, 1, height - 7);
  }

  function shopInterior(g, p) {
    rect(g, p.outline, 18, 77, 63, 49);
    rect(g, p.woodShade, 21, 81, 57, 44);
    rect(g, p.ink, 24, 84, 51, 27);
    rect(g, p.outline, 24, 101, 51, 9);
    rect(g, p.wood, 23, 89, 1, 34);
    rect(g, p.wood, 76, 89, 2, 33);
    rect(g, p.woodLight, 77, 90, 1, 29);
    // Three deliberately different tool silhouettes, with warm handles and cool heads.
    rect(g, p.woodLight, 32, 94, 2, 10);
    rect(g, p.stoneShade, 28, 92, 10, 4);
    rect(g, p.stoneLight, 29, 92, 7, 2);
    rect(g, p.ink, 33, 92, 2, 1);
    rect(g, p.woodLight, 48, 96, 2, 8);
    polygon(g, p.stoneShade, [[44,92],[52,92],[53,97],[48,99],[44,96]]);
    rect(g, p.stoneLight, 45, 92, 6, 2);
    rect(g, p.woodLight, 64, 96, 2, 9);
    polygon(g, p.stone, [[61,92],[63,92],[63,95],[66,95],[66,92],[68,92],[68,97],[66,99],[63,99],[61,97]]);
    rect(g, p.stoneLight, 61, 92, 1, 4);
    // Workbench, vise, pots, and two compact stores beneath the bench.
    rect(g, p.outline, 22, 110, 57, 6);
    rect(g, p.woodLight, 23, 111, 55, 2);
    rect(g, p.wood, 23, 113, 55, 2);
    rect(g, p.outline, 27, 116, 5, 10);
    rect(g, p.wood, 28, 116, 3, 10);
    rect(g, p.outline, 71, 116, 5, 10);
    rect(g, p.wood, 72, 116, 3, 10);
    rect(g, p.stoneShade, 30, 106, 10, 4);
    rect(g, p.stone, 29, 105, 11, 2);
    rect(g, p.stoneLight, 29, 105, 4, 1);
    rect(g, p.stoneShade, 31, 109, 2, 4);
    rect(g, p.woodShade, 56, 107, 7, 3);
    rect(g, p.gold, 57, 106, 5, 3);
    rect(g, p.wood, 66, 108, 5, 2);
    rect(g, p.goldShade, 67, 106, 3, 3);
    crate(g, p, 35, 117, 15, 9, false);
    crate(g, p, 52, 119, 16, 7, false);
  }

  function barrel(g, p, x, y) {
    octagon(g, p.outline, x, y, 13, 21, 2);
    rect(g, p.wood, x + 2, y + 1, 9, 19);
    rect(g, p.woodLight, x + 3, y + 2, 2, 17);
    rect(g, p.woodShade, x + 7, y + 2, 1, 17);
    rect(g, p.woodShade, x + 10, y + 2, 1, 17);
    rect(g, p.stoneShade, x + 1, y + 5, 11, 3);
    rect(g, p.stoneShade, x + 1, y + 14, 11, 3);
    rect(g, p.stone, x + 2, y + 5, 8, 1);
    rect(g, p.stone, x + 2, y + 14, 8, 1);
  }

  function drawWorkshop(g, p) {
    chimney(g, p, 103, 17, true);
    walls(g, p);
    shopInterior(g, p);
    roof(g, p, true);
    archedDoor(g, p, 88, 87, 23, 39);
    awning(g, p);
    // A hanging button sign is a shared hamlet motif, with a unique Workshop silhouette.
    rect(g, p.outline, 9, 44, 6, 30);
    rect(g, p.wood, 10, 45, 4, 28);
    rect(g, p.woodLight, 10, 45, 1, 25);
    rect(g, p.outline, 1, 47, 25, 6);
    rect(g, p.wood, 2, 48, 23, 4);
    rect(g, p.woodLight, 3, 48, 21, 1);
    rect(g, p.outline, 5, 52, 2, 8);
    rect(g, p.outline, 21, 52, 2, 8);
    rect(g, p.goldShade, 5, 54, 1, 4);
    rect(g, p.goldShade, 21, 54, 1, 4);
    button(g, p, 3, 58, 23);
    crate(g, p, 9, 108, 18, 19, true);
    barrel(g, p, 114, 106);
    sprig(g, p, 5, 127, false);
    rect(g, p.ink, 1, 127, 127, 1);
  }

  function drawMiniature(g, p, type) {
    // These are drawn at 32 × 32, with their own intentionally simplified clusters.
    const workshop = type === 'workshop';
    const cx = workshop ? 25 : 5;
    rect(g, p.outline, cx, 3, 4, 12);
    rect(g, p.cream, cx + 1, 5, 2, 9);
    rect(g, p.coral, cx, 3, 4, 2);
    polygon(g, p.outline, [[4,15],[14,6],[17,6],[28,15],[28,31],[4,31]]);
    polygon(g, p.cream, [[5,16],[14,8],[17,8],[27,16],[27,29],[5,29]]);
    rect(g, p.creamShade, 5, 17, 22, 2);
    rect(g, p.wood, 4, 17, 2, 13);
    rect(g, p.wood, 26, 17, 2, 13);
    polygon(g, p.outline, [[0,15],[1,18],[4,19],[8,16],[14,10],[17,10],[23,16],[28,19],[31,18],[32,15],
      [28,14],[23,10],[19,5],[16,4],[13,5],[8,10],[4,13]]);
    polygon(g, p.coralShade, [[1,15],[2,17],[4,18],[8,15],[14,9],[17,9],[23,15],[28,18],[30,17],[31,15],
      [27,14],[22,10],[18,6],[16,5],[13,6],[9,10],[5,14]]);
    polygon(g, p.coral, [[1,15],[3,16],[5,16],[9,12],[14,7],[17,7],[22,12],[27,16],[30,16],
      [27,14],[22,10],[18,6],[16,5],[13,6],[9,10],[5,14]]);
    rect(g, p.coralLight, 13, 6, 5, 1);
    rect(g, p.coralLight, 7, 12, 3, 1);
    rect(g, p.coralLight, 3, 15, 3, 1);
    rect(g, p.coralLight, 22, 12, 2, 1);
    rect(g, p.woodShade, 8, 17, 16, 2);
    rect(g, p.woodLight, 8, 17, 16, 1);
    rect(g, p.stoneShade, 5, 29, 22, 1);
    rect(g, p.outline, 3, 30, 26, 1);
    if (workshop) {
      rect(g, p.wood, 15, 10, 2, 7);
      rect(g, p.ink, 6, 21, 14, 8);
      rect(g, p.wood, 7, 26, 12, 2);
      rect(g, p.woodLight, 7, 26, 12, 1);
      rect(g, p.woodLight, 9, 23, 1, 3);
      rect(g, p.stone, 8, 22, 3, 1);
      rect(g, p.woodLight, 15, 23, 1, 3);
      rect(g, p.stoneLight, 14, 22, 3, 2);
      rect(g, p.outline, 5, 19, 16, 4);
      rect(g, p.creamLight, 6, 19, 14, 3);
      for (const x of [7,12,17]) rect(g, p.mint, x, 19, 2, 3);
      rect(g, p.outline, 22, 22, 4, 7);
      rect(g, p.woodLight, 23, 22, 2, 7);
      rect(g, p.ink, 24, 26, 1, 1);
      rect(g, p.wood, 4, 12, 1, 9);
      rect(g, p.wood, 1, 13, 6, 1);
      octagon(g, p.outline, 0, 16, 6, 6, 1);
      rect(g, p.gold, 1, 17, 4, 4);
      rect(g, p.outline, 2, 18, 1, 1);
      rect(g, p.outline, 4, 20, 1, 1);
      rect(g, p.woodLight, 7, 28, 4, 2);
    } else {
      octagon(g, p.outline, 13, 11, 6, 6, 1);
      rect(g, p.gold, 14, 12, 4, 4);
      rect(g, p.outline, 14, 12, 1, 1);
      rect(g, p.outline, 16, 12, 1, 1);
      rect(g, p.outline, 14, 14, 1, 1);
      rect(g, p.outline, 16, 14, 1, 1);
      polygon(g, p.creamLight, [[19,20],[23,20],[25,22],[25,29],[17,29],[17,22]]);
      polygon(g, p.outline, [[20,21],[22,21],[24,23],[24,29],[18,29],[18,23]]);
      rect(g, p.wood, 19, 23, 4, 6);
      rect(g, p.woodLight, 19, 23, 1, 5);
      rect(g, p.ink, 22, 26, 1, 1);
      rect(g, p.outline, 8, 21, 6, 6);
      rect(g, p.waterShade, 9, 22, 4, 4);
      rect(g, p.woodLight, 10, 22, 1, 4);
      rect(g, p.woodLight, 9, 23, 4, 1);
      rect(g, p.mint, 6, 22, 2, 5);
      rect(g, p.mint, 14, 22, 2, 5);
      rect(g, p.wood, 8, 27, 6, 2);
      rect(g, p.mintShade, 8, 26, 6, 1);
      rect(g, p.creamLight, 9, 25, 1, 2);
      rect(g, p.coralLight, 12, 25, 1, 2);
    }
  }

  function wideWalls(g, p, peak) {
    polygon(g, p.outline, [[12,64],[peak,24],[148,64],[148,127],[12,127]]);
    polygon(g, p.creamShade, [[15,64],[peak,27],[145,64],[145,124],[15,124]]);
    polygon(g, p.cream, [[17,65],[peak,29],[142,65],[142,120],[17,120]]);
    rect(g, p.creamLight, 19, 72, 120, 3);
    for (const x of [13,141]) {
      rect(g, p.outline, x, 65, 6, 59);
      rect(g, p.wood, x + 1, 67, 4, 56);
      rect(g, p.woodLight, x + 1, 69, 1, 50);
      octagon(g, p.outline, x - 1, 117, 8, 10, 1);
      rect(g, p.wood, x, 119, 6, 7);
      rect(g, p.woodLight, x, 119, 5, 1);
    }
    rect(g, p.outline, 8, 126, 145, 2);
    rect(g, p.stoneShade, 20, 120, 120, 6);
    rect(g, p.stoneLight, 20, 120, 120, 2);
    for (let x = 31; x < 139; x += 17) rect(g, p.stoneShade, x, 121, 1, 3);
  }

  function wideRoof(g, p, smith) {
    // Both faces are frontal. A longer lower sweep makes the working bay feel broad.
    const peak = smith ? 92 : 78;
    polygon(g, p.outline, [[0,61],[1,67],[8,72],[19,72],[36,63],[peak-18,34],
      [peak-4,26],[peak+3,27],[peak+20,43],[141,65],[151,70],[157,67],[160,60],
      [148,57],[133,48],[peak+21,27],[peak+8,16],[peak-6,15],[peak-18,21],[27,51],[13,57]]);
    polygon(g, p.woodShade, [[3,63],[4,67],[10,70],[18,70],[36,60],[peak-18,32],
      [peak-4,24],[peak+4,25],[peak+22,43],[142,63],[152,68],[156,64],[144,59],
      [peak+6,19],[peak-8,18],[31,52],[16,61]]);
    polygon(g, p.coralShade, [[2,60],[3,65],[9,68],[18,68],[35,58],[peak-19,31],
      [peak-5,23],[peak+4,24],[peak+22,41],[143,61],[152,65],[157,61],[148,59],
      [132,50],[peak+20,28],[peak+7,18],[peak-6,17],[peak-18,23],[28,53],[14,59]]);
    polygon(g, p.coral, [[3,60],[4,63],[10,65],[18,65],[34,55],[peak-20,29],
      [peak-6,21],[peak+5,22],[peak+23,39],[143,58],[153,62],[148,59],[132,50],
      [peak+20,28],[peak+7,18],[peak-6,17],[peak-18,23],[28,53],[14,59]]);
    polygon(g, p.coralLight, [[7,60],[17,58],[32,51],[peak-18,24],[peak-6,19],
      [peak+6,20],[peak+12,24],[peak+5,22],[peak-5,21],[peak-18,26],[33,54],[18,61],[9,63],[5,62]]);
    for (const [x,y] of [[19,58],[31,52],[44,44],[56,36],[peak-10,23],[peak+16,29],[peak+27,40],[134,54],[148,60]]) {
      rect(g, p.coralLight, x, y, 5, 1);
      rect(g, p.coralShade, x + 2, y + 4, 3, 1);
    }
    rect(g, p.outline, 24, 63, 112, 6);
    rect(g, p.wood, 25, 64, 110, 3);
    rect(g, p.woodLight, 27, 64, 106, 1);
    rect(g, p.woodShade, 27, 67, 106, 1);
    if (smith) {
      rect(g, p.outline, peak - 3, 31, 6, 32);
      rect(g, p.wood, peak - 2, 32, 4, 31);
      rect(g, p.woodLight, peak - 2, 33, 1, 28);
      polygon(g, p.outline, [[peak-22,43],[peak-18,41],[peak-3,59],[peak-6,62]]);
      line(g, p.woodLight, peak - 20, 43, peak - 6, 59);
    } else button(g, p, peak - 11, 37, 23);
  }

  function drawStorehouse(g, p) {
    wideWalls(g, p, 78);
    wideRoof(g, p, false);
    // An arch shared with the Home becomes a pair of generous loading doors.
    archedDoor(g, p, 55, 77, 50, 49, false);
    rect(g, p.outline, 79, 81, 2, 44);
    rect(g, p.woodLight, 81, 83, 1, 41);
    rect(g, p.woodShade, 60, 104, 17, 4);
    rect(g, p.woodShade, 84, 104, 16, 4);
    rect(g, p.woodLight, 60, 104, 17, 1);
    rect(g, p.woodLight, 84, 104, 16, 1);
    for (const x of [73,85]) {
      octagon(g, p.ink, x, 102, 5, 7, 1);
      rect(g, p.goldShade, x + 1, 103, 3, 5);
      rect(g, p.gold, x + 1, 103, 2, 1);
      rect(g, p.woodShade, x + 2, 105, 1, 2);
    }
    // Quiet shuttered clerestory and a stout loading hatch keep the silhouette useful.
    rect(g, p.outline, 25, 79, 19, 21);
    rect(g, p.woodLight, 26, 80, 17, 19);
    rect(g, p.waterShade, 28, 82, 13, 14);
    rect(g, p.water, 29, 83, 4, 5);
    rect(g, p.waterLight, 29, 83, 1, 3);
    rect(g, p.wood, 33, 82, 2, 14);
    rect(g, p.wood, 28, 88, 13, 2);
    rect(g, p.mint, 21, 82, 3, 18);
    rect(g, p.mintShade, 22, 86, 2, 1);
    rect(g, p.mintShade, 22, 95, 2, 1);
    rect(g, p.mint, 45, 82, 3, 18);
    rect(g, p.mintShade, 46, 86, 2, 1);
    rect(g, p.mintShade, 46, 95, 2, 1);
    lantern(g, p, 113, 81);
    rect(g, p.wood, 126, 78, 9, 3);
    rect(g, p.woodShade, 129, 80, 2, 14);
    octagon(g, p.mintShade, 124, 87, 13, 11, 2);
    rect(g, p.mint, 125, 88, 10, 8);
    rect(g, p.mintLight, 126, 89, 3, 2);
    rect(g, p.creamShade, 110, 105, 7, 2);
    crate(g, p, 8, 108, 22, 19, false);
    crate(g, p, 30, 112, 19, 15, true);
    crate(g, p, 15, 94, 20, 14, false);
    // A soft tied sack is a different cluster from the square timber stores.
    polygon(g, p.outline, [[131,105],[133,99],[141,99],[142,104],[148,110],[149,122],[145,127],[129,127],[126,122],[127,112]]);
    polygon(g, p.creamShade, [[132,106],[134,101],[140,101],[139,105],[145,111],[147,121],[143,125],[130,125],[128,121],[129,113]]);
    polygon(g, p.cream, [[133,107],[139,107],[144,113],[144,121],[141,124],[131,124],[130,120],[131,113]]);
    rect(g, p.mintShade, 132, 104, 10, 2);
    rect(g, p.mint, 133, 104, 8, 1);
    rect(g, p.creamLight, 132, 111, 2, 7);
    sprig(g, p, 3, 127, false);
    sprig(g, p, 154, 127, true);
  }

  function kilnFire(g, p, frame, bright) {
    // All four flame silhouettes are integer clusters inside the same firemouth.
    const heights = [[7,15,10],[10,12,17],[14,9,13],[10,17,8]][frame];
    rect(g, p.lavaShade, 28, 75, 35, 13);
    for (let i = 0; i < 3; i++) {
      const x = 30 + i * 10, h = heights[i];
      polygon(g, bright ? p.lava : p.coralShade, [[x,87],[x,82-h/2|0],[x+3,84-h],[x+5,86-h],
        [x+5,81-h],[x+8,85-h],[x+10,81],[x+10,87]]);
      if (bright) polygon(g, p.lavaLight, [[x+3,87],[x+3,82],[x+5,78-Math.floor(h/4)],[x+7,81],[x+8,87]]);
    }
    rect(g, p.ink, 27, 87, 38, 2);
    for (const x of [31,42,54]) {
      rect(g, p.woodShade, x, 84, 7, 3);
      rect(g, bright ? p.lavaLight : p.lava, x, 83, 5, 1);
    }
  }

  function drawForge(g, p) {
    // Tall flue, low rounded kiln: identifiable without borrowing a house façade.
    rect(g, p.outline, 61, 13, 20, 41);
    rect(g, p.stone, 63, 15, 16, 37);
    rect(g, p.stoneLight, 63, 16, 4, 32);
    rect(g, p.stoneShade, 77, 17, 2, 34);
    for (const [x,y,w] of [[64,24,9],[72,33,7],[64,42,8]]) rect(g, p.stoneShade, x, y, w, 1);
    rect(g, p.stoneShade, 71, 18, 1, 6);
    rect(g, p.stoneShade, 69, 34, 1, 8);
    octagon(g, p.outline, 58, 9, 26, 9, 2);
    rect(g, p.coralShade, 60, 11, 22, 5);
    rect(g, p.coral, 61, 10, 20, 4);
    rect(g, p.coralLight, 62, 10, 18, 1);
    polygon(g, p.outline, [[22,41],[29,34],[57,32],[70,38],[81,48],[86,61],[86,92],[80,96],[14,96],[9,91],[9,65],[13,52]]);
    polygon(g, p.stoneShade, [[23,42],[30,36],[57,34],[69,40],[79,50],[83,62],[83,91],[78,94],[16,94],[12,90],[12,65],[16,53]]);
    polygon(g, p.stone, [[23,44],[30,38],[56,36],[67,42],[76,52],[79,64],[79,89],[16,89],[15,65],[19,53]]);
    // A shallow curved coral hood gives this industrial building its Buttonwood kinship.
    polygon(g, p.outline, [[9,49],[19,43],[30,32],[43,27],[54,28],[66,36],[75,43],[88,48],[88,53],[83,56],[75,55],[64,49],[53,41],[43,39],[33,44],[21,53],[12,55],[7,53]]);
    polygon(g, p.coralShade, [[10,49],[20,45],[31,34],[43,29],[54,30],[65,38],[76,46],[86,49],[86,52],[81,54],[75,53],[63,47],[53,39],[43,37],[32,42],[20,51],[12,53],[9,51]]);
    polygon(g, p.coral, [[10,49],[21,45],[32,35],[44,30],[53,31],[65,39],[76,46],[84,49],[83,51],[75,51],[63,45],[53,37],[44,35],[32,40],[20,49],[12,51]]);
    rect(g, p.coralLight, 39, 31, 13, 1);
    rect(g, p.coralLight, 28, 39, 6, 1);
    rect(g, p.coralLight, 15, 48, 6, 1);
    rect(g, p.coralLight, 70, 44, 5, 1);
    rect(g, p.stoneLight, 15, 64, 11, 2);
    rect(g, p.stoneLight, 67, 64, 11, 2);
    rect(g, p.stoneShade, 16, 73, 9, 1);
    rect(g, p.stoneShade, 68, 76, 11, 1);
    rect(g, p.stoneLight, 15, 80, 9, 1);
    rect(g, p.stoneLight, 70, 84, 8, 1);
    rect(g, p.stoneShade, 20, 65, 1, 8);
    rect(g, p.stoneShade, 73, 65, 1, 11);
    polygon(g, p.creamShade, [[34,53],[56,53],[64,58],[69,68],[69,90],[24,90],[24,68],[28,59]]);
    polygon(g, p.cream, [[35,54],[55,54],[62,59],[67,69],[67,88],[26,88],[26,68],[30,60]]);
    polygon(g, p.outline, [[35,59],[55,59],[61,64],[64,70],[64,88],[28,88],[28,70],[31,64]]);
    polygon(g, p.ink, [[36,61],[54,61],[59,65],[62,71],[62,88],[30,88],[30,71],[33,65]]);
    rect(g, p.stoneShade, 43, 55, 1, 4);
    line(g, p.stoneShade, 31, 60, 34, 63);
    line(g, p.stoneShade, 59, 60, 57, 63);
    rect(g, p.stoneShade, 25, 74, 3, 1);
    rect(g, p.stoneShade, 64, 75, 4, 1);
    kilnFire(g, p, 0, false);
    rect(g, p.outline, 23, 89, 47, 6);
    rect(g, p.stoneLight, 24, 89, 45, 2);
    rect(g, p.stoneShade, 24, 92, 45, 2);
    // Bellows and a fuel basket balance the heavy masonry without changing its footprint.
    polygon(g, p.outline, [[1,72],[6,68],[12,72],[15,78],[12,83],[15,89],[11,94],[0,94],[0,81]]);
    polygon(g, p.mintShade, [[2,75],[6,71],[10,74],[12,79],[9,83],[12,89],[9,92],[2,92],[2,81]]);
    rect(g, p.mint, 3, 77, 6, 4);
    rect(g, p.mintLight, 3, 77, 4, 1);
    rect(g, p.woodLight, 1, 72, 11, 2);
    rect(g, p.wood, 1, 89, 11, 3);
    crate(g, p, 82, 80, 14, 15, false);
    octagon(g, p.deepShade, 83, 77, 6, 5, 1);
    octagon(g, p.deep, 88, 76, 6, 6, 1);
    rect(g, p.deepLight, 89, 77, 2, 1);
    rect(g, p.ink, 8, 95, 87, 1);
  }

  function anvil(g, p, x, y) {
    // Anvil top is 21px above the ground, comfortable for the adult Worker scale.
    octagon(g, p.outline, x + 10, y + 13, 17, 11, 1);
    rect(g, p.wood, x + 11, y + 14, 15, 9);
    rect(g, p.woodLight, x + 12, y + 14, 2, 8);
    rect(g, p.woodShade, x + 19, y + 16, 1, 6);
    rect(g, p.woodShade, x + 23, y + 15, 1, 7);
    polygon(g, p.ink, [[x,y+1],[x+28,y+1],[x+35,y+4],[x+27,y+8],[x+22,y+8],
      [x+20,y+10],[x+26,y+12],[x+26,y+15],[x+8,y+15],[x+8,y+12],[x+13,y+10],[x+11,y+7],[x+3,y+7],[x,y+4]]);
    polygon(g, p.stoneShade, [[x+2,y+3],[x+27,y+3],[x+31,y+4],[x+26,y+6],[x+21,y+6],
      [x+18,y+10],[x+23,y+13],[x+11,y+13],[x+16,y+10],[x+12,y+5],[x+4,y+5]]);
    rect(g, p.stoneLight, x + 2, y + 2, 25, 1);
    rect(g, p.stone, x + 6, y + 3, 20, 2);
    rect(g, p.stone, x + 15, y + 6, 4, 4);
    rect(g, p.stoneLight, x + 12, y + 12, 9, 1);
  }

  function hammer(g, p, x, y, pose) {
    // Each pose is drawn directly; no resampled rotations or detached tool heads.
    if (pose === 0) {
      rect(g, p.outline, x + 4, y + 5, 4, 17);
      rect(g, p.woodLight, x + 5, y + 6, 2, 15);
      octagon(g, p.ink, x, y, 13, 8, 1);
      rect(g, p.stone, x + 1, y + 1, 11, 6);
      rect(g, p.stoneLight, x + 1, y + 1, 10, 2);
      rect(g, p.stoneShade, x + 10, y + 3, 2, 4);
    } else if (pose === 1) {
      polygon(g, p.outline, [[x+2,y+6],[x+5,y+4],[x+15,y+16],[x+12,y+19]]);
      line(g, p.woodLight, x + 4, y + 6, x + 13, y + 17);
      line(g, p.wood, x + 3, y + 6, x + 12, y + 17);
      polygon(g, p.ink, [[x-2,y+5],[x+7,y-2],[x+13,y+4],[x+3,y+12]]);
      polygon(g, p.stone, [[x,y+5],[x+7,y],[x+11,y+4],[x+3,y+10]]);
      line(g, p.stoneLight, x, y + 5, x + 7, y);
    } else {
      rect(g, p.outline, x + 4, y + 4, 20, 4);
      rect(g, p.woodLight, x + 5, y + 5, 17, 2);
      octagon(g, p.ink, x, y, 9, 13, 1);
      rect(g, p.stone, x + 1, y + 1, 7, 11);
      rect(g, p.stoneLight, x + 1, y + 1, 2, 10);
      rect(g, p.stoneShade, x + 5, y + 10, 3, 2);
    }
  }

  function drawBlacksmith(g, p, resting = true) {
    chimney(g, p, 21, 13, false);
    wideWalls(g, p, 92);
    rect(g, p.outline, 19, 70, 93, 56);
    rect(g, p.woodShade, 22, 72, 86, 52);
    rect(g, p.ink, 25, 77, 80, 42);
    rect(g, p.outline, 26, 96, 77, 4);
    rect(g, p.wood, 29, 83, 1, 26);
    rect(g, p.wood, 103, 79, 2, 43);
    rect(g, p.woodLight, 104, 80, 1, 41);
    // Hanging tongs and horseshoes are bold enough to read over the dark bay.
    rect(g, p.wood, 31, 82, 37, 3);
    rect(g, p.woodLight, 31, 82, 36, 1);
    line(g, p.stone, 35, 87, 42, 96);
    line(g, p.stone, 42, 87, 35, 96);
    rect(g, p.stoneLight, 35, 87, 2, 2);
    rect(g, p.stoneShade, 39, 92, 1, 1);
    polygon(g, p.stoneShade, [[49,87],[51,87],[51,92],[53,94],[57,94],[59,92],[59,87],[61,87],[61,93],[58,97],[52,97],[49,94]]);
    rect(g, p.stoneLight, 49, 87, 2, 4);
    rect(g, p.stone, 59, 87, 2, 4);
    // A compact coal hearth sits beside, rather than replacing, the anvil workspace.
    rect(g, p.stoneShade, 84, 96, 19, 26);
    rect(g, p.stone, 85, 96, 17, 4);
    rect(g, p.stoneLight, 85, 96, 16, 1);
    rect(g, p.outline, 87, 102, 13, 17);
    rect(g, p.lavaShade, 88, 105, 11, 12);
    rect(g, p.coralShade, 89, 111, 9, 6);
    rect(g, p.lava, 91, 113, 4, 3);
    rect(g, p.stoneLight, 84, 121, 19, 2);
    wideRoof(g, p, true);
    archedDoor(g, p, 117, 86, 24, 40);
    // Three mint scallops soften the work shelter, without repeating Workshop stripes.
    rect(g, p.outline, 19, 70, 91, 8);
    rect(g, p.mintShade, 20, 71, 89, 5);
    rect(g, p.mint, 21, 71, 87, 2);
    for (const x of [23,49,75]) {
      polygon(g, p.outline, [[x,73],[x+24,73],[x+22,80],[x+18,82],[x+5,82],[x+1,79]]);
      polygon(g, p.mint, [[x+1,73],[x+23,73],[x+21,78],[x+17,80],[x+6,80],[x+2,77]]);
      rect(g, p.mintLight, x + 2, 73, 20, 1);
      rect(g, p.mintShade, x + 6, 79, 11, 1);
    }
    anvil(g, p, 38, 104);
    // The resting hammer is replaced by the active stepped poses during forging.
    if (resting) hammer(g, p, 56, 94, 2);
    rect(g, p.outline, 127, 44, 4, 27);
    rect(g, p.wood, 128, 45, 2, 24);
    rect(g, p.outline, 122, 45, 36, 5);
    rect(g, p.wood, 123, 46, 34, 3);
    rect(g, p.woodLight, 124, 46, 32, 1);
    rect(g, p.outline, 133, 50, 1, 6);
    rect(g, p.outline, 150, 50, 1, 6);
    octagon(g, p.outline, 128, 54, 28, 25, 3);
    octagon(g, p.wood, 129, 55, 26, 23, 2);
    octagon(g, p.mintShade, 131, 57, 22, 19, 2);
    rect(g, p.mint, 133, 58, 17, 1);
    rect(g, p.woodLight, 140, 62, 3, 11);
    octagon(g, p.ink, 135, 60, 14, 7, 1);
    rect(g, p.stoneLight, 136, 61, 12, 2);
    rect(g, p.stone, 136, 63, 12, 3);
    lantern(g, p, 109, 80);
    barrel(g, p, 2, 106);
    crate(g, p, 146, 112, 14, 15, false);
    rect(g, p.stone, 148, 108, 9, 4);
    rect(g, p.stoneLight, 148, 108, 8, 1);
    sprig(g, p, 19, 127, false);
    rect(g, p.ink, 2, 127, 157, 1);
  }

  function drawIndustryMiniature(g, p, type) {
    // The UI artwork has its own silhouettes and clusters, never a scaled world image.
    if (type === 'forge') {
      rect(g, p.outline, 22, 2, 7, 14);
      rect(g, p.stoneLight, 23, 4, 4, 11);
      rect(g, p.stoneShade, 26, 5, 2, 10);
      rect(g, p.outline, 21, 2, 9, 3);
      rect(g, p.coral, 22, 2, 7, 2);
      polygon(g, p.outline, [[7,14],[11,10],[19,10],[24,14],[28,20],[28,30],[4,30],[3,25],[3,20]]);
      polygon(g, p.stone, [[8,15],[12,12],[19,12],[23,16],[26,21],[26,29],[5,29],[5,21]]);
      polygon(g, p.outline, [[1,16],[7,13],[12,9],[17,8],[22,11],[28,15],[31,16],[30,19],[26,19],[18,14],[13,13],[7,18],[2,19]]);
      polygon(g, p.coral, [[2,16],[8,14],[12,10],[17,9],[22,12],[29,16],[29,17],[26,17],[18,12],[13,11],[7,16],[3,17]]);
      rect(g, p.coralLight, 12, 10, 5, 1);
      polygon(g, p.cream, [[11,18],[19,18],[23,22],[23,29],[8,29],[8,22]]);
      polygon(g, p.ink, [[12,20],[18,20],[21,23],[21,28],[10,28],[10,23]]);
      polygon(g, p.lava, [[11,27],[12,23],[14,25],[16,22],[18,24],[19,27]]);
      rect(g, p.lavaLight, 15, 25, 2, 2);
      rect(g, p.stoneLight, 8, 29, 15, 1);
      rect(g, p.mintShade, 1, 24, 3, 6);
      rect(g, p.mint, 1, 24, 2, 2);
      rect(g, p.wood, 28, 25, 4, 5);
      rect(g, p.deepShade, 29, 23, 3, 2);
      return;
    }
    if (type === 'blacksmith') {
      rect(g, p.outline, 5, 2, 4, 13);
      rect(g, p.cream, 6, 4, 2, 9);
      rect(g, p.coral, 5, 2, 4, 2);
    }
    polygon(g, p.outline, [[3,16],[16,5],[20,6],[29,16],[29,31],[3,31]]);
    polygon(g, p.cream, [[4,17],[16,7],[19,8],[28,17],[28,29],[4,29]]);
    rect(g, p.wood, 3, 17, 2, 13);
    rect(g, p.wood, 27, 17, 2, 13);
    polygon(g, p.outline, [[0,15],[4,14],[10,9],[15,4],[19,4],[25,10],[29,14],[32,15],[31,18],[28,19],[22,15],[17,10],[12,13],[5,19],[1,18]]);
    polygon(g, p.coralShade, [[1,15],[5,15],[11,10],[15,5],[19,5],[25,11],[30,15],[31,16],[28,17],[22,13],[17,8],[12,11],[5,17],[2,17]]);
    polygon(g, p.coral, [[2,15],[5,14],[11,9],[15,5],[18,5],[24,11],[29,15],[28,16],[22,12],[17,7],[12,10],[5,16]]);
    rect(g, p.coralLight, 14, 6, 5, 1);
    rect(g, p.coralLight, 7, 12, 3, 1);
    rect(g, p.woodShade, 6, 17, 20, 2);
    rect(g, p.woodLight, 7, 17, 18, 1);
    rect(g, p.outline, 2, 30, 29, 1);
    if (type === 'storehouse') {
      button(g, p, 13, 11, 6);
      polygon(g, p.creamLight, [[13,20],[19,20],[22,23],[22,29],[10,29],[10,23]]);
      polygon(g, p.outline, [[14,21],[18,21],[21,24],[21,29],[11,29],[11,24]]);
      rect(g, p.wood, 12, 24, 8, 5);
      rect(g, p.woodLight, 12, 24, 1, 5);
      rect(g, p.woodShade, 15, 22, 1, 7);
      rect(g, p.gold, 14, 26, 1, 1);
      rect(g, p.gold, 17, 26, 1, 1);
      rect(g, p.mintShade, 5, 21, 4, 4);
      rect(g, p.water, 6, 21, 2, 3);
      rect(g, p.wood, 2, 26, 8, 4);
      rect(g, p.woodLight, 3, 26, 6, 1);
      rect(g, p.woodShade, 5, 27, 1, 3);
      rect(g, p.woodLight, 3, 23, 5, 2);
      octagon(g, p.outline, 24, 25, 7, 6, 1);
      rect(g, p.creamShade, 25, 26, 5, 4);
      rect(g, p.mint, 26, 24, 3, 2);
    } else {
      rect(g, p.ink, 5, 20, 16, 10);
      rect(g, p.mint, 5, 18, 16, 3);
      rect(g, p.mintLight, 6, 18, 14, 1);
      rect(g, p.wood, 10, 27, 6, 3);
      polygon(g, p.stoneShade, [[7,24],[18,24],[20,25],[16,26],[14,27],[16,28],[9,28],[11,26],[8,26]]);
      rect(g, p.stoneLight, 7, 24, 11, 1);
      rect(g, p.woodLight, 12, 21, 1, 3);
      rect(g, p.stone, 10, 21, 5, 2);
      rect(g, p.outline, 23, 23, 4, 7);
      rect(g, p.woodLight, 24, 24, 2, 5);
      rect(g, p.wood, 27, 12, 1, 8);
      rect(g, p.wood, 24, 13, 8, 1);
      rect(g, p.outline, 25, 16, 7, 6);
      rect(g, p.mintShade, 26, 17, 5, 4);
      rect(g, p.woodLight, 28, 18, 1, 3);
      rect(g, p.stoneLight, 27, 18, 3, 1);
    }
  }

  const drawers = Object.freeze({ home: drawHome, workshop: drawWorkshop, storehouse: drawStorehouse, forge: drawForge, blacksmith: drawBlacksmith });
  A.buildingSizes = Object.freeze({
    home: Object.freeze({ width: 128, height: 128 }),
    workshop: Object.freeze({ width: 128, height: 128 }),
    storehouse: Object.freeze({ width: 160, height: 128 }),
    forge: Object.freeze({ width: 96, height: 96 }),
    blacksmith: Object.freeze({ width: 160, height: 128 })
  });

  A.building = function (type) {
    if (!Object.hasOwn(drawers, type)) return null;
    const size = A.buildingSizes[type];
    return sprites[type] || (sprites[type] = canvas(size.width, size.height, drawers[type]));
  };

  A.buildingIcon = function (type) {
    if (!Object.hasOwn(drawers, type)) return null;
    return miniatures[type] || (miniatures[type] = canvas(32, 32, (g, p) => {
      if (type === 'home' || type === 'workshop') drawMiniature(g, p, type);
      else drawIndustryMiniature(g, p, type);
    }));
  };

  function activeSmith(g, p, timeMs) {
    const phase = Math.floor(timeMs / 135) % 6;
    if (phase < 2) hammer(g, p, 56, 83, 0);
    else if (phase === 2) hammer(g, p, 56, 90, 1);
    else if (phase === 3) hammer(g, p, 56, 94, 2);
    else hammer(g, p, 56, 90, 1);
    rect(g, p.lava, 88, 109, 11, 8);
    rect(g, p.lavaLight, 91 + phase % 2, 109 - phase % 3, 3, 7 + phase % 3);
    if (phase === 3) {
      rect(g, p.gold, 51, 104, 2, 1);
      rect(g, p.creamLight, 50, 100, 1, 2);
      rect(g, p.gold, 66, 102, 2, 1);
    }
  }

  A.paintBuilding = function (g, type, timeMs = 0, active = false) {
    const sprite = A.building(type);
    if (!sprite) return;
    const painted = active && type === 'blacksmith'
      ? sprites.blacksmithActive || (sprites.blacksmithActive = canvas(160, 128, (ctx, p) => drawBlacksmith(ctx, p, false)))
      : sprite;
    g.drawImage(painted, 0, 0);
    if (!active) return;
    const p = A.palette;
    if (type === 'forge') {
      kilnFire(g, p, Math.floor(timeMs / 180) % 4, true);
      const puff = Math.floor(timeMs / 280) % 4;
      octagon(g, p.creamShade, 67 + (puff > 1 ? 1 : 0), 6 - puff, 6, 3, 1);
      octagon(g, p.cream, 73 + puff % 2, 1, 5, 3, 1);
    } else if (type === 'blacksmith') {
      activeSmith(g, p, timeMs);
      const puff = Math.floor(timeMs / 280) % 4;
      octagon(g, p.creamShade, 27 + puff % 2, 9 - puff * 2, 5, 3, 1);
    } else if (type === 'home' || type === 'workshop') {
      const frame = Math.floor(timeMs / 280) % 4;
      const x = type === 'workshop' ? 109 : 24;
      const y = type === 'workshop' ? 14 : 8;
      // Sparse, stepped puffs remain inside the native canvas and never stretch.
      octagon(g, p.creamShade, x + (frame > 1 ? 1 : 0), y - frame * 2, 4, 3, 1);
      if (type === 'workshop') {
        octagon(g, p.cream, x + 2 + (frame % 2), 3 + (3 - frame), 5, 3, 1);
        if (frame === 1) {
          rect(g, p.gold, 42, 107, 2, 1);
          rect(g, p.creamLight, 44, 104, 1, 2);
        }
      }
    }
  };

  A.paintBuildingLights = function (g, type, amount = 1, timeMs = 0) {
    if (!Object.hasOwn(drawers, type) || amount <= 0) return;
    const p = A.palette;
    g.save();
    g.globalAlpha *= Math.min(1, amount);
    const pane = (x, y, w, h) => {
      rect(g, p.gold, x, y, w, h);
      rect(g, p.creamLight, x, y, Math.max(1, w - 1), 1);
    };
    if (type === 'home') {
      pane(38, 86, 3, 8); pane(43, 86, 3, 8);
      pane(38, 96, 3, 6); pane(43, 96, 3, 6);
      pane(105, 86, 2, 6);
    } else if (type === 'workshop') {
      pane(58, 108, 3, 2);
      rect(g, p.goldShade, 25, 109, 49, 1);
    } else if (type === 'storehouse') {
      pane(29, 83, 4, 5); pane(35, 83, 5, 5);
      pane(29, 90, 4, 5); pane(35, 90, 5, 5);
      pane(116, 85, 2, 6);
    } else if (type === 'forge') {
      kilnFire(g, p, Math.floor(timeMs / 180) % 4, true);
    } else if (type === 'blacksmith') {
      pane(112, 84, 2, 6);
      rect(g, p.lava, 88, 110, 11, 7);
      rect(g, p.lavaLight, 91, 108 + Math.floor(timeMs / 240) % 2, 4, 8);
      rect(g, p.goldShade, 85, 120, 17, 1);
    }
    g.restore();
  };

  A.buildingAnchors = Object.freeze({
    home: Object.freeze({ doorX: 87, doorY: 126, groundY: 127 }),
    workshop: Object.freeze({ doorX: 99, doorY: 126, groundY: 127, workX: 46, workY: 110 }),
    storehouse: Object.freeze({ doorX: 80, doorY: 126, groundY: 127 }),
    forge: Object.freeze({ doorX: 46, doorY: 94, groundY: 95, workX: 46, workY: 87 }),
    blacksmith: Object.freeze({ doorX: 129, doorY: 126, groundY: 127, workX: 60, workY: 106 })
  });
}());
