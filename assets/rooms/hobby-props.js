/* Props for the Hobbies room that aren't books or games: the other-hobbies shelf (climbing,
 * pickleball, snowboarding, chainmail, board games) and a suit of scale and chain armour on a stand. */
import * as THREE from "three";
import { box, canvasTex, cyl, esc, fitText, frontBox, interactables, mat, noise, rand, safeUrl, showPanel } from "./core.js";

const steel = () => mat(0xb9bec6, { metalness: 0.85, roughness: 0.3 });

/** An invisible box that makes a prop clickable, with a short card. */
function clickable(parent, w, h, d, x, y, z, title, text) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(x, y, z);
  parent.add(hit);
  interactables.push({ mesh: hit, hint: title, open: () => showPanel({ title, meta: "", html: `<p>${text}</p>` }) });
}

/* ---------- climbing ---------- */

/** One down-turned climbing shoe: heel at x = 0, toe towards +x, standing on y = 0, centred in z. */
function climbingShoe(colour) {
  const g = new THREE.Group();
  const up = new THREE.Shape();
  up.moveTo(0, 0.025);
  up.quadraticCurveTo(-0.012, 0.09, 0.035, 0.1);
  up.lineTo(0.095, 0.088);
  up.quadraticCurveTo(0.175, 0.078, 0.236, 0.028);
  up.quadraticCurveTo(0.248, 0.006, 0.226, 0.004);
  up.quadraticCurveTo(0.13, 0.026, 0.045, 0.004);
  up.quadraticCurveTo(0.002, 0.004, 0, 0.025);
  const bev = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 };
  const upper = new THREE.Mesh(new THREE.ExtrudeGeometry(up, bev), mat(colour, { roughness: 0.6 }));
  upper.position.z = -0.025;
  g.add(upper);
  // black rubber: the sole, the downturned arch and a rand round the toe
  const sole = new THREE.Shape();
  sole.moveTo(-0.006, 0.03);
  sole.quadraticCurveTo(-0.008, -0.004, 0.045, -0.004);
  sole.quadraticCurveTo(0.13, 0.018, 0.226, -0.004);
  sole.quadraticCurveTo(0.256, 0, 0.243, 0.04);
  sole.lineTo(0.228, 0.036);
  sole.quadraticCurveTo(0.236, 0.012, 0.224, 0.012);
  sole.quadraticCurveTo(0.13, 0.034, 0.045, 0.012);
  sole.quadraticCurveTo(0.01, 0.012, 0.01, 0.03);
  const rub = new THREE.Mesh(new THREE.ExtrudeGeometry(sole, { ...bev, bevelThickness: 0.017, bevelSize: 0.014 }), mat(0x161616, { roughness: 0.8 }));
  rub.position.z = -0.025;
  g.add(rub);
  // a velcro strap over the instep, and the dark opening
  const strap = box(0.032, 0.008, 0.094, mat(0x1d1d1f), 0.115, 0.09, 0, g);
  strap.rotation.z = -0.2;
  const hole = box(0.055, 0.004, 0.05, mat(0x0c0c0c), 0.058, 0.104, 0, g);
  hole.rotation.z = -0.12;
  return g;
}

/** A fleece-rimmed chalk bag with a brush in a loop on its side. */
function chalkBag() {
  const g = new THREE.Group();
  cyl(0.065, 0.07, 0.14, mat(0x1f7a8c, { roughness: 0.95 }), 0, 0.07, 0, g, 22);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.015, 8, 26), mat(0xf1efe8, { roughness: 1 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.143;
  g.add(rim);
  cyl(0.052, 0.052, 0.004, mat(0xffffff, { roughness: 1 }), 0, 0.142, 0, g, 20);   // chalk
  cyl(0.008, 0.008, 0.03, mat(0x222222), 0.03, 0.125, 0.06, g, 8);                  // drawstring toggle
  const handle = cyl(0.006, 0.006, 0.12, mat(0xd9a441, { roughness: 0.5 }), 0.075, 0.08, 0.0, g, 8);   // brush
  handle.rotation.z = 0.05;
  box(0.012, 0.03, 0.012, mat(0x2a2a2a), 0.075, 0.15, 0, g);
  box(0.016, 0.02, 0.03, mat(0x111111), 0.068, 0.07, 0, g);                         // its loop
  box(0.15, 0.025, 0.012, mat(0x111111), 0, 0.09, -0.07, g);                       // belt loop at the back
  return g;
}

/* ---------- pickleball ---------- */

/** A paddle standing on its handle, face towards +z. */
function pickleballPaddle() {
  const g = new THREE.Group();
  const W = 0.2, H = 0.26, r = 0.06, y0 = 0.13;
  const s = new THREE.Shape();
  s.moveTo(-W / 2 + 0.03, y0);
  s.lineTo(W / 2 - 0.03, y0);
  s.quadraticCurveTo(W / 2, y0, W / 2, y0 + 0.04);
  s.lineTo(W / 2, y0 + H - r);
  s.quadraticCurveTo(W / 2, y0 + H, W / 2 - r, y0 + H);
  s.lineTo(-W / 2 + r, y0 + H);
  s.quadraticCurveTo(-W / 2, y0 + H, -W / 2, y0 + H - r);
  s.lineTo(-W / 2, y0 + 0.04);
  s.quadraticCurveTo(-W / 2, y0, -W / 2 + 0.03, y0);
  // the face: the extruded shape's UVs are in metres, so map one face's width and height
  const face = canvasTex(256, 336, (ctx, w, h) => {
    ctx.fillStyle = "#1d5fa8"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f2c230";
    ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.35); ctx.lineTo(w, h * 0.47); ctx.lineTo(0, h * 0.87); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.lineTo(w, h * 0.5); ctx.lineTo(w, h * 0.54); ctx.lineTo(0, h * 0.94); ctx.fill();
    noise(ctx, w, h, 0.05, 800);
  });
  face.repeat.set(1 / W, 1 / H);
  face.offset.set(0.5, -y0 / H);
  const paddle = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false, curveSegments: 10 }),
    [mat(0xffffff, { map: face, roughness: 0.5 }), mat(0x111214, { roughness: 0.6 })]);   // faces, then the edge guard
  paddle.position.z = -0.007;
  g.add(paddle);
  cyl(0.016, 0.017, 0.13, mat(0x1b1b1d, { roughness: 0.9 }), 0, 0.065, 0, g, 12);        // grip
  cyl(0.02, 0.02, 0.012, mat(0x1d5fa8), 0, 0.006, 0, g, 12);                              // butt cap
  return g;
}

/** A yellow pickleball with its holes. */
function pickleball() {
  const tex = canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#d9e63a"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6e7a10";
    for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(((i * 53) % 13) * 20 + 10, 18 + Math.floor(i / 5) * 22 + ((i * 53) % 13) % 2 * 8, 5, 0, Math.PI * 2); ctx.fill(); }
  });
  return new THREE.Mesh(new THREE.SphereGeometry(0.037, 20, 14), mat(0xffffff, { map: tex, roughness: 0.6 }));
}

/* ---------- snowboarding ---------- */

/** A snowboard in the xy plane (length along x, width along y), top sheet facing +z, with bindings. */
function snowboard(L = 1.45, W = 0.27) {
  const g = new THREE.Group();
  const e = 0.13, cut = 0.012;   // e: how far the rounded nose and tail run; cut: the waist
  const s = new THREE.Shape();
  s.moveTo(-L / 2 + e, -W / 2);
  s.quadraticCurveTo(0, -W / 2 + cut, L / 2 - e, -W / 2);
  s.bezierCurveTo(L / 2 + 0.02, -W / 2, L / 2 + 0.02, W / 2, L / 2 - e, W / 2);
  s.quadraticCurveTo(0, W / 2 - cut, -L / 2 + e, W / 2);
  s.bezierCurveTo(-L / 2 - 0.02, W / 2, -L / 2 - 0.02, -W / 2, -L / 2 + e, -W / 2);
  const top = canvasTex(1024, 192, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, "#14233d"); gr.addColorStop(0.5, "#2a4f7c"); gr.addColorStop(1, "#14233d");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    // a mountain range across the middle
    ctx.fillStyle = "#e9eef5";
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.8);
    [[0.3, 0.3], [0.38, 0.6], [0.47, 0.18], [0.56, 0.55], [0.64, 0.32], [0.75, 0.8]].forEach(([x, y]) => ctx.lineTo(w * x, h * y));
    ctx.fill();
    ctx.fillStyle = "#ff6a3d"; ctx.fillRect(0, h * 0.86, w, h * 0.05);
    ctx.fillStyle = "#f2c230"; ctx.fillRect(0, h * 0.09, w, h * 0.04);
  });
  top.repeat.set(1 / L, 1 / W);
  top.offset.set(0.5, 0.5);
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false, curveSegments: 14 }),
    [mat(0xffffff, { map: top, roughness: 0.4 }), mat(0x9aa0a8, { metalness: 0.7, roughness: 0.4 })]));
  // bindings: a baseplate, a highback at the heel edge, and two straps over the foot
  const plastic = mat(0x16171a, { roughness: 0.5 }), strapM = mat(0xff6a3d, { roughness: 0.6 });
  [-0.26, 0.26].forEach((bx, i) => {
    const b = new THREE.Group();
    b.position.set(bx, 0, 0.012);
    b.rotation.z = i ? -0.25 : 0.25;
    g.add(b);
    box(0.12, 0.23, 0.014, plastic, 0, 0, 0.007, b);
    const hb = box(0.12, 0.014, 0.17, plastic, 0, -0.115, 0.085, b);
    hb.rotation.x = 0.18;
    [-0.02, 0.07].forEach((sy) => {
      box(0.012, 0.04, 0.07, plastic, -0.065, sy, 0.04, b);
      box(0.012, 0.04, 0.07, plastic, 0.065, sy, 0.04, b);
      box(0.14, 0.045, 0.014, strapM, 0, sy, 0.075, b);
    });
  });
  return g;
}

/* ---------- chainmail ---------- */

/** A small piece of European 4-in-1 chainmail lying flat, about cols x rows rings. */
function chainmailPatch(cols, rows) {
  const ringR = 0.0052, sp = 0.0082, rowSp = 0.0062;
  const geo = new THREE.TorusGeometry(ringR, 0.0009, 5, 14);
  const mesh = new THREE.InstancedMesh(geo, steel(), cols * rows);
  const d = new THREE.Object3D();
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    d.position.set(c * sp + (r % 2 ? sp / 2 : 0) - (cols * sp) / 2, 0.002 + (r % 2) * 0.0012, r * rowSp - (rows * rowSp) / 2);
    d.rotation.set(Math.PI / 2 + (r % 2 ? 0.5 : -0.5), 0, (rand(r * 31 + c) - 0.5) * 0.15);
    d.updateMatrix();
    mesh.setMatrixAt(k++, d.matrix);
  }
  return mesh;
}

/** Hand-sized needle-nose pliers lying flat, tips towards +x, holding a ring. */
function needleNosePliers() {
  const g = new THREE.Group();
  const st = steel(), grip = mat(0xc8202a, { roughness: 0.55 });
  cyl(0.006, 0.006, 0.008, st, 0, 0.006, 0, g, 12);                         // pivot
  [-1, 1].forEach((s) => {
    const jaw = cyl(0.0012, 0.0042, 0.058, st, 0.031, 0.006, s * 0.0022, g, 6);
    jaw.rotation.set(0, s * 0.03, -Math.PI / 2);
    const shank = box(0.03, 0.004, 0.006, st, -0.016, 0.006, s * 0.006, g);
    shank.rotation.y = -s * 0.12;
    const h = cyl(0.0058, 0.0048, 0.078, grip, -0.068, 0.006, s * 0.017, g, 10);
    h.rotation.set(0, s * 0.2, Math.PI / 2);
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0052, 0.0009, 5, 14), st);
  ring.position.set(0.062, 0.008, 0);
  g.add(ring);
  return g;
}

/* ---------- board games ---------- */

/** Box sizes: [width, height, depth] in metres. */
const BOX_SIZES = { large: [0.3, 0.075, 0.3], medium: [0.26, 0.06, 0.26], small: [0.2, 0.05, 0.13] };
const BOX_COLOURS = ["#b23a2e", "#2f5d8a", "#3c7a3b", "#d9a33a", "#6b3f7a", "#1f6f6b", "#8a5a2b", "#c4532a"];

/** One board game box lying flat, its long edge (with the title) facing +z. Clickable. */
function boardGameBox(game, i) {
  const [w, h, dd] = BOX_SIZES[game.size] || BOX_SIZES.large;
  const colour = /^#[0-9a-f]{6}$/i.test(game.colour || "") ? game.colour : BOX_COLOURS[i % BOX_COLOURS.length];
  const edge = canvasTex(512, Math.round((512 * h) / w), (ctx, cw, ch) => {
    ctx.fillStyle = colour; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(0, 0, cw, ch * 0.12); ctx.fillRect(0, ch * 0.88, cw, ch * 0.12);
    ctx.fillStyle = "#fbf6ea"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(ch * 0.5)}px 'Bricolage Grotesque', Arial, sans-serif`;
    ctx.fillText(fitText(ctx, game.title, cw - 40), cw / 2, ch / 2 + 2);
  });
  const front = new THREE.MeshStandardMaterial({ map: edge, roughness: 0.6 });
  const m = new THREE.Mesh(frontBox(w, h, dd), [mat(colour, { roughness: 0.6 }), front]);
  const html = [
    game.players ? `<p>${esc(game.players)} players</p>` : "",
    game.note ? `<p>${esc(game.note)}</p>` : "",
    safeUrl(game.link) ? `<p><a href="${esc(safeUrl(game.link))}" target="_blank" rel="noopener">More about ${esc(game.title)}</a></p>` : "",
  ].join("");
  interactables.push({ mesh: m, hint: "Board game: " + game.title, mat: front, open: () => showPanel({ title: game.title, meta: "Board game", html }) });
  return { m, w, h, d: dd };
}

/**
 * Stack board games on the given shelf rows, left to right: up to 4 to a stack (as high as the
 * row allows), biggest at the bottom of each stack. Games that don't fit are left off.
 */
function shelveBoardGames(shelf, games, rows, floor, rowH) {
  const boxes = games.map(boardGameBox);
  let ri = 0, x = -1.05, k = 0;
  while (k < boxes.length && ri < rows.length) {
    const stack = [];
    let height = 0;
    while (k < boxes.length && stack.length < 4 && height + boxes[k].h < rowH - 0.1) { height += boxes[k].h; stack.push(boxes[k++]); }
    stack.sort((a, b) => b.w - a.w);
    const sw = Math.max(...stack.map((b) => b.w));
    if (x + sw > 1.05) { ri++; x = -1.05; if (ri >= rows.length) break; }
    let y = floor(rows[ri]);
    stack.forEach((b, j) => {
      b.m.position.set(x + sw / 2 + (rand(k * 7 + j) - 0.5) * 0.02, y + b.h / 2, 0.21 - b.d / 2 - 0.01);
      b.m.rotation.y = (rand(k * 3 + j) - 0.5) * 0.08;
      shelf.add(b.m);
      y += b.h;
    });
    x += sw + 0.04;
  }
}

/* ---------- the shelf ---------- */

/**
 * Fill an empty shelf unit (w wide, rows of rowH, d deep, facing +z) with the other hobbies:
 * the snowboard at an angle on the bottom shelf; climbing shoes, chalk bag and pickleball at the
 * front of the next; chainmail at a height you look down on; board games on the top two.
 */
export function fillHobbyShelf(shelf, { rowH }, boardGames = []) {
  const floor = (row) => 0.04 + row * rowH;

  // bottom: the snowboard, running slightly uphill and leaning back so its top sheet shows
  const tilt = new THREE.Group();
  tilt.position.set(0, floor(0) + 0.2, -0.04);
  tilt.rotation.z = 0.1;
  shelf.add(tilt);
  const sb = snowboard();
  sb.rotation.x = -0.55;
  tilt.add(sb);
  clickable(shelf, 1.5, 0.45, 0.35, 0, floor(0) + 0.22, 0, "Snowboarding", "A snowboard with its bindings.");

  // row 1, at the front: blue climbing shoes and the chalk bag, then the pickleball paddle lying
  // face up with two balls
  [[-0.88, 0.12, 0.12], [-0.82, 0.01, -0.1]].forEach(([x, z, ry]) => {
    const sh = climbingShoe(0x2a6fdb);
    sh.position.set(x, floor(1), z);
    sh.rotation.y = ry;
    shelf.add(sh);
  });
  const bag = chalkBag();
  bag.position.set(-0.4, floor(1), 0.06);
  bag.rotation.y = -0.6;
  shelf.add(bag);
  clickable(shelf, 0.75, 0.2, 0.35, -0.65, floor(1) + 0.1, 0.05, "Climbing", "Climbing shoes and a chalk bag.");

  const padSpot = new THREE.Group();
  padSpot.position.set(0.18, floor(1) + 0.008, 0.02);
  padSpot.rotation.y = 0.45;
  shelf.add(padSpot);
  const pad = pickleballPaddle();
  pad.rotation.set(-Math.PI / 2, 0, Math.PI);   // face up, head towards the front
  pad.position.z = -0.19;
  padSpot.add(pad);
  [[0.55, 0.12], [0.63, 0.03]].forEach(([x, z], i) => {
    const ball = pickleball();
    ball.position.set(x, floor(1) + 0.037, z);
    ball.rotation.y = i * 1.3;
    shelf.add(ball);
  });
  clickable(shelf, 0.65, 0.1, 0.4, 0.35, floor(1) + 0.05, 0.03, "Pickleball", "A paddle and a couple of balls.");

  // row 2: the pliers on a piece of chainmail in progress, with a few loose rings
  const patch = chainmailPatch(13, 10);
  patch.position.set(0.35, floor(2), 0.05);
  shelf.add(patch);
  const pl = needleNosePliers();
  pl.position.set(0.37, floor(2) + 0.006, 0.06);
  pl.rotation.y = 0.35;
  shelf.add(pl);
  const loose = new THREE.TorusGeometry(0.0052, 0.0009, 5, 14), st = steel();
  for (let i = 0; i < 9; i++) {
    const r = new THREE.Mesh(loose, st);
    r.position.set(0.5 + rand(i) * 0.12, floor(2) + 0.002, -0.02 + rand(i + 5) * 0.1);
    r.rotation.set(Math.PI / 2 + (rand(i + 9) - 0.5) * 0.3, 0, rand(i + 2) * 3);
    shelf.add(r);
  }
  clickable(shelf, 0.4, 0.12, 0.3, 0.42, floor(2) + 0.06, 0.03, "Chainmail", "Needle-nose pliers, loose rings and a small piece of chainmail in progress.");

  // rows 3 and 4: board games
  shelveBoardGames(shelf, boardGames, [3, 4], floor, rowH);
}

/* ---------- the armour ---------- */

function chainTex() {
  const t = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#24262a"; ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < 18; r++) for (let c = 0; c < 17; c++) {
      const x = c * 16 + (r % 2) * 8, y = r * 15;
      ctx.strokeStyle = "#8e959e"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(x, y, 7, 5.5, r % 2 ? 0.5 : -0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y, 7, 5.5, r % 2 ? 0.5 : -0.5, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function scaleTex() {
  const t = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#1c1d20"; ctx.fillRect(0, 0, w, h);
    const sw = 32, sh = 24;
    // bottom rows first, so each row overlaps the one below it
    for (let r = Math.ceil(h / sh) + 1; r >= -1; r--) for (let c = -1; c <= w / sw + 1; c++) {
      const x = c * sw + (r % 2 ? sw / 2 : 0), y = r * sh;
      const gr = ctx.createLinearGradient(x, y, x, y + sh * 1.6);
      gr.addColorStop(0, "#9aa1aa"); gr.addColorStop(0.6, "#c9ced4"); gr.addColorStop(1, "#6d737b");
      ctx.fillStyle = gr; ctx.strokeStyle = "#2a2c30"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - sw / 2 + 1, y);
      ctx.lineTo(x - sw / 2 + 1, y + sh * 0.7);
      ctx.quadraticCurveTo(x - sw / 2 + 1, y + sh * 1.55, x, y + sh * 1.6);
      ctx.quadraticCurveTo(x + sw / 2 - 1, y + sh * 1.55, x + sw / 2 - 1, y + sh * 0.7);
      ctx.lineTo(x + sw / 2 - 1, y);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3a3d42"; ctx.beginPath(); ctx.arc(x, y + 5, 2, 0, Math.PI * 2); ctx.fill();   // the rivet
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A lathe from [radius, y] pairs listed bottom to top (so it faces outwards). */
const lathe = (pts, m, segs = 32) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs), m);

/**
 * A wooden mannequin on a stand wearing a scale mail cuirass over a chainmail hauberk, with
 * scale pauldrons, a chain coif and a nasal helmet. Faces +z, standing on y = 0.
 */
export function armourStand() {
  const g = new THREE.Group();
  const wood = mat(0x9a7350, { roughness: 0.7 }), dark = mat(0x3a2414, { roughness: 0.7 });
  const ct = chainTex(), st = scaleTex();
  const chain = (rx, ry) => { const t = ct.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, metalness: 0.7, roughness: 0.45, side: THREE.DoubleSide }); };
  const scales = (rx, ry) => { const t = st.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide }); };
  const brass = mat(0xc99a3b, { metalness: 0.7, roughness: 0.35 }), leather = mat(0x4a2c18, { roughness: 0.8 });
  const steelM = mat(0xaeb4bc, { metalness: 0.85, roughness: 0.28 });

  // the stand
  cyl(0.3, 0.32, 0.06, dark, 0, 0.03, 0, g, 32);
  cyl(0.026, 0.026, 0.8, dark, 0, 0.45, 0, g, 12);

  // the hauberk: skirt and body in mail, flattened front to back
  const skirt = lathe([[0.3, 0.66], [0.28, 0.8], [0.245, 0.95], [0.215, 1.08], [0.205, 1.16]], chain(14, 3));
  skirt.scale.z = 0.75;
  g.add(skirt);
  const body = lathe([[0.2, 1.12], [0.182, 1.25], [0.2, 1.38], [0.215, 1.5], [0.21, 1.6], [0.17, 1.68], [0.09, 1.74], [0.06, 1.77]], chain(14, 4));
  body.scale.z = 0.72;
  g.add(body);
  // the scale cuirass over it
  const cuirass = lathe([[0.213, 1.17], [0.195, 1.27], [0.214, 1.38], [0.229, 1.5], [0.223, 1.6], [0.186, 1.665]], scales(10, 3.2));
  cuirass.scale.z = 0.74;
  g.add(cuirass);
  // a brass edge round its neck and hem, and a belt with a buckle
  [[0.186, 1.665, 0.008], [0.213, 1.17, 0.008]].forEach(([r, y, t]) => {
    const e = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 40), brass);
    e.rotation.x = Math.PI / 2; e.scale.y = 0.74; e.position.y = y; g.add(e);
  });
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.206, 0.02, 6, 40), leather);
  belt.rotation.x = Math.PI / 2; belt.scale.y = 0.76; belt.position.y = 1.13; g.add(belt);
  box(0.06, 0.045, 0.015, brass, 0, 1.13, 0.16, g);

  // scale pauldrons over the shoulders, mail sleeves, and wooden forearms and hands
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), scales(4, 1.2));
    p.scale.set(1.05, 0.75, 1);
    p.position.set(s * 0.2, 1.6, 0);
    p.rotation.z = -s * 0.35;
    g.add(p);
    const sleeve = cyl(0.062, 0.056, 0.33, chain(4, 2), s * 0.255, 1.46, 0, g, 16);
    sleeve.rotation.z = s * 0.07;
    cyl(0.04, 0.034, 0.25, wood, s * 0.27, 1.17, 0.01, g, 12);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), wood);
    hand.scale.set(0.8, 1.2, 0.6);
    hand.position.set(s * 0.272, 1.02, 0.015);
    g.add(hand);
  });

  // head: a mannequin head in a mail coif (open at the face) under a nasal helmet
  cyl(0.05, 0.055, 0.1, wood, 0, 1.79, 0, g, 12);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), wood);
  head.scale.set(0.85, 1.05, 0.95);
  head.position.y = 1.93;
  g.add(head);
  // phi = PI/2 is the front: leave a gap there for the face
  const coif = new THREE.Mesh(new THREE.SphereGeometry(0.112, 24, 16, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.78), chain(6, 3));
  coif.position.y = 1.93;
  g.add(coif);
  g.add(lathe([[0.17, 1.7], [0.13, 1.76], [0.1, 1.83]], chain(10, 1)));   // the mantle over the shoulders
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), steelM);
  helm.scale.y = 1.25;
  helm.position.y = 1.96;
  g.add(helm);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.011, 6, 32), brass);
  brim.rotation.x = Math.PI / 2; brim.position.y = 1.965; g.add(brim);
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a) => {   // the frame bands of a spangenhelm
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.121, 0.006, 4, 16, Math.PI / 2), brass);
    band.scale.y = 1.25; band.position.y = 1.96; band.rotation.set(0, a, Math.PI / 2); g.add(band);
  });
  box(0.022, 0.1, 0.01, steelM, 0, 1.915, 0.113, g);                         // the nasal
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), brass);
  knob.position.y = 1.96 + 0.15; g.add(knob);

  clickable(g, 0.7, 2.1, 0.6, 0, 1.05, 0, "A suit of armour", "Scale mail over a chainmail hauberk, with a mail coif and a nasal helmet.");
  return g;
}
