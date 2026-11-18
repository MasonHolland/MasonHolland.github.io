/* Shared core: the data, the three.js scene, the building helpers, the walking rules, the info card,
 * and the shared room shell (createRoom). Every other file imports from here. */

import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * A round hall with three arched doors:
 *   10 o'clock  About me   a bright, modern living room
 *   12 o'clock Work       a modern tech office
 *   2 o'clock  Hobbies    an old castle library (books and a game case)
 * Content comes from data/profile.json, data/books.json, data/games.json.
 * Everything is built from simple shapes and canvas textures; there are
 * no model files.
 * ------------------------------------------------------------------ */

export const R = 8;                   // hall radius (big enough that rooms 60 degrees apart don't overlap)
export const HUB_H = 6;               // height of the hall wall, where the dome begins
export const DOME_RISE = 5;           // how far the dome rises above the wall (its top is HUB_H + DOME_RISE)
// Each room is built in its own frame, as if the hall had a 4.5 m radius, then pushed out by SHIFT.
export const FACE = 4.36;             // room frame: distance to the flat face of the door wall
export const NEAR = 4.96;             // room frame: distance to where the room starts
export const WALL_T = NEAR - FACE;    // thickness of the door wall (the passage length)
export const RW = 8, RD = 8;          // room width and depth
export const DOOR_HALF = 0.7;         // half the width of a doorway
export const SPRING = 2.15;           // height where the door arch begins
export const ARCH_TOP = SPRING + DOOR_HALF;
export const GAP = 1.12;              // half the width of the gap in the hall wall at each door
// how far each room is pushed out so its door wall meets the curved hall wall at the edge of the gap
export const SHIFT = Math.sqrt(R * R - GAP * GAP) - FACE;
// door directions: 0 is 12 o'clock, positive turns left. 10 o'clock and 2 o'clock are 60 degrees either side.
export const DOOR_ANGLES = { about: Math.PI / 3, work: 0, hobbies: -Math.PI / 3 };
export const EYE = 1.6;
export const SPEED = 3.5;
export const PR = 0.25;               // player radius for collisions
export const TOUCH = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
if (TOUCH) document.body.classList.add("touch");

export const $ = (id) => document.getElementById(id);
export const stage = $("stage");
export const hintEl = $("hint");
export const crossEl = $("cross");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const safeUrl = (u) => { try { const p = new URL(u, location.href); return /^https?:$/.test(p.protocol) ? p.href : ""; } catch (e) { return ""; } };

/* ---------- load data ---------- */

export async function loadJSON(url, fallback) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    return fallback;
  }
}

export const [profile, bookData, gameData] = await Promise.all([
  loadJSON("data/profile.json", { name: "Mason", accolades: [], projects: [], experience: [], about: { frames: [] } }),
  loadJSON("data/books.json", { books: [] }),
  loadJSON("data/games.json", { games: [] }),
]);

// Fonts must be ready before text is painted onto canvas textures. Give up after two seconds.
if (document.fonts && document.fonts.load) {
  const ready = Promise.all([
    document.fonts.load("800 44px 'Bricolage Grotesque'"),
    document.fonts.load("600 30px 'Bricolage Grotesque'"),
    document.fonts.load("500 26px 'Literata'"),
    document.fonts.load("italic 500 26px 'Literata'"),
  ]).catch(() => {});
  await Promise.race([ready, new Promise((r) => setTimeout(r, 2000))]);
}

document.title = profile.name + "'s place";
$("startTitle").textContent = profile.name + "'s place";
$("keysHelp").textContent = TOUCH
  ? "Drag on the right to look. Drag on the left to walk. Tap things to inspect them."
  : "Move with W A S D or the arrow keys. Look with the mouse. Click or press E to inspect what's in the crosshair.";

/* ---------- renderer, scene, camera ---------- */

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

export const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 60);
camera.rotation.order = "YXZ";
camera.position.set(0, EYE, 5.5);

export function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

/* ---------- helpers ---------- */

export const interactables = [];   // { mesh, hint, mat, base?, open() }
export const animations = [];      // functions called every frame with the time in seconds

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts });
}
export function basic(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}
export function box(w, h, d, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
export function cyl(rt, rb, h, material, x, y, z, parent = scene, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
export function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function tiled(tex, rx, ry, opts = {}) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...opts });
}
export function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const words = String(text || "").split(/\s+/);
  let line = "", n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      n++;
      if (n === maxLines) { ctx.fillText(line.replace(/\s+\S*$/, "") + "…", x, y); return y + lineH; }
      ctx.fillText(line, x, y);
      y += lineH;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, y); y += lineH; }
  return y;
}
export function fitText(ctx, text, maxW) {
  let t = String(text || "");
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
export function rand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
export function noise(ctx, w, h, amount, n = 2500) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rand(i) > 0.5 ? "255,255,255" : "0,0,0"},${rand(i + 7) * amount})`;
    ctx.fillRect(rand(i + 3) * w, rand(i + 11) * h, 2, 2);
  }
}

/* ---------- arches ---------- */

export function archFrameGeo(inner, thick, spring, depth) {
  const o = inner + thick;
  const s = new THREE.Shape();
  s.moveTo(-o, 0);
  s.lineTo(-o, spring);
  s.absarc(0, spring, o, Math.PI, 0, true);
  s.lineTo(o, 0);
  s.lineTo(inner, 0);
  s.lineTo(inner, spring);
  s.absarc(0, spring, inner, 0, Math.PI, false);
  s.lineTo(-inner, 0);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 28 });
}

export function archSlabGeo(halfW, height, depth, notch = true) {
  const s = new THREE.Shape();
  s.moveTo(-halfW, 0);
  s.lineTo(-DOOR_HALF, 0);
  s.lineTo(-DOOR_HALF, SPRING);
  s.absarc(0, SPRING, DOOR_HALF, Math.PI, 0, true);
  s.lineTo(DOOR_HALF, 0);
  s.lineTo(halfW, 0);
  s.lineTo(halfW, height);
  s.lineTo(-halfW, height);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 28 });
}

export function archLeafGeo(hw, spring, depth) {
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(-hw, spring);
  s.absarc(0, spring, hw, Math.PI, 0, true);
  s.lineTo(hw, 0);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 28 });
}

/* ---------- signs ---------- */

export function signMesh(w, h, draw) {
  const tex = canvasTex(1024, Math.round(1024 * h / w), draw);
  const faces = mat(0x222222);
  const front = new THREE.MeshBasicMaterial({ map: tex });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), [faces, faces, faces, faces, front, faces]);
  return m;
}

export const SIGNS = {
  about: (ctx, w, h) => {
    ctx.fillStyle = "#f6f2ea"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c7a97a"; ctx.lineWidth = 8; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#2b2b2b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 130px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("About me", w / 2, h / 2 + 6);
  },
  work: (ctx, w, h) => {
    ctx.fillStyle = "#34495e"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e0b05a"; ctx.fillRect(w / 2 - 90, h - 36, 180, 6);
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 130px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Work", w / 2, h / 2 - 8);
  },
  hobbies: (ctx, w, h) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = "rgba(176,138,69,0.5)"; ctx.lineWidth = 2; ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 128px 'Literata', Georgia, serif";
    ctx.fillText("Hobbies", w / 2, h / 2 + 6);
  },
  exit: (ctx, w, h) => {
    ctx.fillStyle = "#4a1f25"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c99a3b"; ctx.lineWidth = 6; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#f1e9d6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 130px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Exit", w / 2, h / 2 + 6);
  },
};

/* ---------- walking area ---------- */

export const rooms = {};   // key -> { angle, label, bounds, obstacles, group }

/** World position to a room's own frame (undoes the room's turn and its outward SHIFT). */
export function toLocal(angle, x, z) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x * c - z * s, x * s + z * c + SHIFT];
}

/** A point in a room's own frame to the world (the reverse of toLocal). */
export function toWorld(angle, lx, lz) {
  const c = Math.cos(angle), s = Math.sin(angle), z = lz - SHIFT;
  return [lx * c + z * s, -lx * s + z * c];
}

export const hubObstacles = [];   // world-space boxes in the hall, e.g. the mailbox: { x0, x1, z0, z1 }

export function walkable(x, z) {
  const hubR = R - 0.28;
  if (x * x + z * z <= hubR * hubR) {
    return !hubObstacles.some((o) => x > o.x0 - PR && x < o.x1 + PR && z > o.z0 - PR && z < o.z1 + PR);
  }
  for (const room of Object.values(rooms)) {
    const [lx, lz] = toLocal(room.angle, x, z);
    if (Math.abs(lx) <= DOOR_HALF - 0.24 && lz <= -4.0 && lz >= -5.45) return true;
    const b = room.bounds;
    if (lx >= b.x0 && lx <= b.x1 && lz >= b.z0 && lz <= b.z1) {
      let hit = false;
      for (const o of room.obstacles) {
        if (lx > o.x0 - PR && lx < o.x1 + PR && lz > o.z0 - PR && lz < o.z1 + PR) { hit = true; break; }
      }
      if (!hit) return true;
    }
  }
  return false;
}

export function areaAt(x, z) {
  if (x * x + z * z <= (R - 0.1) * (R - 0.1)) return "The hall";
  for (const room of Object.values(rooms)) {
    const [lx, lz] = toLocal(room.angle, x, z);
    if (lz < -4.95 && Math.abs(lx) < 4.05 && lz > -13) return room.label;
  }
  return null;
}

/* ---------- panel ---------- */

export const panel = $("panel");
export let panelOpen = false;
export let lastFocus = null;

export function showPanel({ title, meta, html }) {
  $("panelTitle").textContent = title;
  $("panelMeta").textContent = meta || "";
  $("panelBody").innerHTML = html || "";
  panel.hidden = false;
  panelOpen = true;
  lastFocus = document.activeElement;
  hintEl.classList.remove("on");
  if (document.pointerLockElement) document.exitPointerLock();
  $("panelClose").focus();
}
export function closePanel() {
  panel.hidden = true;
  panelOpen = false;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$("panelClose").addEventListener("click", closePanel);

export function projectsHtml(list) {
  return list.map((p) => `
    <div class="item">
      <h3>${esc(p.title)}${p.year ? ` <span style="font-weight:400;color:#4d5d6b">(${esc(p.year)})</span>` : ""}</h3>
      <p>${esc(p.summary)}</p>
      ${safeUrl(p.url) ? `<p><a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">View ${esc(p.title)}</a></p>` : ""}
    </div>`).join("");
}

export function resumeHtml() {
  const exp = (profile.experience || []).map((x) => `
    <div class="item">
      <h3>${esc(x.role)}, ${esc(x.org)}</h3>
      <p style="color:#4d5d6b;margin-bottom:.4rem">${esc(x.start)} to ${esc(x.end)}</p>
      <p>${esc(x.summary)}</p>
      ${(x.highlights || []).length ? `<ul>${x.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>`).join("");
  const links = (profile.links || []).map((l) => safeUrl(l.url) ? `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)}</a>` : "").filter(Boolean).join(" · ");
  return `<p>${esc(profile.summary)}</p>${links ? `<p>${links}</p>` : ""}${exp}<p class="item"><a href="resume.html">Open the full resume page</a></p>`;
}

/* ---------- shared props ---------- */

export function makePlant(parent, x, z, scale = 1, potColor = 0x6b2d34) {
  const plant = new THREE.Group();
  plant.position.set(x, 0, z);
  plant.scale.setScalar(scale);
  parent.add(plant);
  cyl(0.22, 0.17, 0.4, mat(potColor), 0, 0.2, 0, plant);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(i % 2 ? 0x4c7a4f : 0x3d6a45));
    const a = (i / 9) * Math.PI * 2;
    leaf.scale.set(0.7, 1.9, 0.35);
    leaf.position.set(Math.cos(a) * 0.12, 0.75 + (i % 3) * 0.1, Math.sin(a) * 0.12);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    plant.add(leaf);
  }
  return plant;
}

export function makeArmchair(color) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.9 });
  box(0.9, 0.3, 0.85, m, 0, 0.3, 0, g);
  box(0.9, 0.55, 0.2, m, 0, 0.72, -0.33, g);
  box(0.16, 0.3, 0.85, m, -0.37, 0.55, 0, g);
  box(0.16, 0.3, 0.85, m, 0.37, 0.55, 0, g);
  box(0.64, 0.12, 0.6, m, 0, 0.5, 0.07, g);
  [[-0.38, -0.36], [0.38, -0.36], [-0.38, 0.36], [0.38, 0.36]].forEach(([x, z]) => cyl(0.03, 0.025, 0.15, mat(0x2a2018), x, 0.075, z, g, 8));
  return g;
}

export function makeSofa(color, w = 2.3) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.95 });
  const cush = mat(new THREE.Color(color).offsetHSL(0, 0, 0.04), { roughness: 0.95 });
  box(w, 0.3, 0.95, m, 0, 0.3, 0, g);
  box(w, 0.5, 0.22, m, 0, 0.72, -0.36, g);
  box(0.2, 0.32, 0.95, m, -w / 2 + 0.1, 0.56, 0, g);
  box(0.2, 0.32, 0.95, m, w / 2 - 0.1, 0.56, 0, g);
  const n = 3, cw = (w - 0.4) / n;
  for (let i = 0; i < n; i++) box(cw - 0.03, 0.14, 0.72, cush, -w / 2 + 0.2 + cw * (i + 0.5), 0.52, 0.1, g);
  [[-w / 2 + 0.15, -0.38], [w / 2 - 0.15, -0.38], [-w / 2 + 0.15, 0.38], [w / 2 - 0.15, 0.38]].forEach(([x, z]) => cyl(0.03, 0.025, 0.15, mat(0x3a2a1c), x, 0.075, z, g, 8));
  return g;
}

/* ---------- room shell: floor, ceiling, walls, arched door wall ---------- */

export function createRoom(key, { angle, H, label, wall, floor, ceil, front, bounds, frameMat }) {
  const g = new THREE.Group();          // door wall, frames and sign: always visible
  g.rotation.y = angle;
  g.position.set(-SHIFT * Math.sin(angle), 0, -SHIFT * Math.cos(angle));
  scene.add(g);
  const inner = new THREE.Group();      // everything inside the room: hidden while you are in another room
  g.add(inner);
  rooms[key] = { angle, label, bounds, obstacles: [], group: inner, H };

  const Hp = Math.max(H, HUB_H);
  const zc = -(NEAR + RD / 2);

  const fl = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD + WALL_T), tiled(floor.tex, RW / floor.tw, (RD + WALL_T) / floor.th, floor.opts));
  fl.rotation.x = -Math.PI / 2;
  fl.position.set(0, 0, zc + WALL_T / 2);
  inner.add(fl);

  const ce = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), tiled(ceil.tex, RW / ceil.tw, RD / ceil.th, ceil.opts));
  ce.rotation.x = Math.PI / 2;
  ce.position.set(0, H, zc);
  inner.add(ce);

  const wm = () => tiled(wall.tex, RW / wall.tw, H / wall.th, wall.opts);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, H), wm());
  back.position.set(0, H / 2, -(NEAR + RD));
  inner.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(RD, H), wm());
  left.rotation.y = Math.PI / 2;
  left.position.set(-RW / 2, H / 2, zc);
  inner.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(RD, H), wm());
  right.rotation.y = -Math.PI / 2;
  right.position.set(RW / 2, H / 2, zc);
  inner.add(right);

  // the door wall: a thick slab with an arched passage cut through it
  const slab = new THREE.Mesh(archSlabGeo(RW / 2 + 0.3, Hp, WALL_T), tiled(front.tex, 1 / front.tw, 1 / front.th, front.opts));
  slab.position.z = -NEAR;
  g.add(slab);

  // skin on the hall side, so the hall's wall looks continuous
  const skin = new THREE.Mesh(archSlabGeo(GAP + 0.02, HUB_H, 0.02), hubWallMat(1 / 2, 1 / HUB_H));
  skin.position.z = -FACE;
  g.add(skin);

  // arched frames on both sides of the passage
  const fHall = new THREE.Mesh(archFrameGeo(DOOR_HALF, 0.14, SPRING, 0.12), frameMat);
  fHall.position.z = -FACE - 0.02;
  g.add(fHall);
  const fRoom = new THREE.Mesh(archFrameGeo(DOOR_HALF, 0.14, SPRING, 0.12), frameMat);
  fRoom.position.z = -NEAR - 0.12;
  g.add(fRoom);

  // sign above the doorway, on the hall side
  const sign = signMesh(1.7, 0.44, SIGNS[key]);
  sign.position.set(0, 3.32, -FACE + 0.14);
  g.add(sign);

  return inner;
}


export let hubWallTexture = null;
export function hubWallMat(rx, ry) {
  if (!hubWallTexture) {
    hubWallTexture = canvasTex(512, 1024, (ctx, w, h) => {
      // 2 m wide, 3.8 m tall: plaster above, panelled dado below
      ctx.fillStyle = "#ece6da"; ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 0.05, 1800);
      const dadoH = (1.15 / HUB_H) * h;
      ctx.fillStyle = "#c9c0ae"; ctx.fillRect(0, h - dadoH, w, dadoH);
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 4;
      ctx.strokeRect(36, h - dadoH + 26, w - 72, dadoH - 52);
      ctx.fillStyle = "#b5a98f"; ctx.fillRect(0, h - dadoH - 8, w, 8);
      ctx.fillStyle = "#c7a97a"; ctx.fillRect(0, 0, w, 10);
    });
  }
  return tiled(hubWallTexture, rx, ry, { side: THREE.FrontSide });
}

