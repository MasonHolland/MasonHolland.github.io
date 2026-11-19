/* HOBBIES room (2 o'clock): a castle library with the bookcase and the game shelves. */
import * as THREE from "three";
import { armourStand, fillHobbyShelf } from "./hobby-props.js";
import { DOOR_ANGLES, NEAR, RW, animations, boardGameData, archFrameGeo, basic, bookData, box, canvasTex, createRoom, cyl, esc, fitText, frontBox, gameData, interactables, mat, noise, rand, rooms, safeUrl, showPanel, signMesh, tiled, wrapText } from "./core.js";
import { plankTex } from "./shared.js";

/* ================================================================== *
 * HOBBIES (2 o'clock): a castle library with a game case
 * ================================================================== */

/**
 * Stone blocks in running bond: 4 rows of 3 equal blocks per 2 m tile, every other row shifted by
 * half a block. The tile repeats seamlessly: the block split by the left and right edges of a
 * shifted row is drawn twice from the same seed (once off each edge), so its two halves match,
 * and the even number of rows keeps the alternation going from one tile to the next.
 */
function stoneTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#2c2824"; ctx.fillRect(0, 0, w, h);
    const rows = 4, per = 3, rh = h / rows, bw = w / per;
    const block = (x, y, seed) => {
      const s = 62 + Math.floor(rand(seed) * 34);
      ctx.fillStyle = `rgb(${s + 14},${s + 8},${s})`;
      ctx.fillRect(x + 3, y + 3, bw - 6, rh - 6);
      for (let k = 0; k < 60; k++) {
        ctx.fillStyle = `rgba(${rand(seed + k) > 0.5 ? "255,255,255" : "0,0,0"},${rand(seed * 3 + k) * 0.1})`;
        ctx.fillRect(x + 3 + rand(seed + k + 9) * (bw - 9), y + 3 + rand(seed + k + 4) * (rh - 8), 3, 2);
      }
    };
    for (let r = 0; r < rows; r++) {
      const shift = r % 2 ? bw / 2 : 0;
      for (let i = 0; i < per; i++) {
        const seed = r * 31 + i * 7 + 1;
        block(shift + i * bw, r * rh, seed);
        if (shift + (i + 1) * bw > w) block(shift + i * bw - w, r * rh, seed);   // the half that wraps to the left edge
      }
    }
  });
}

function flagstoneTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#1c1916"; ctx.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const t = 52 + Math.floor(rand(r * 9 + c) * 26);
      ctx.fillStyle = `rgb(${t + 8},${t + 4},${t})`;
      ctx.fillRect(c * s + 3, r * s + 3, s - 6, s - 6);
    }
    noise(ctx, w, h, 0.1, 3000);
  });
}

/** Stained glass: a lattice of jewel-coloured quarries in black lead with a single sword down the middle. */
function glassTexture(w, rectH, seed) {
  const pw = 256, ph = Math.round(256 * (rectH + w / 2) / w);
  return canvasTex(pw, ph, (ctx) => {
    const r = pw / 2, cx = r, LEAD = "#0b0b10";
    ctx.clearRect(0, 0, pw, ph);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, ph); ctx.lineTo(0, r); ctx.arc(r, r, r, Math.PI, 0); ctx.lineTo(pw, ph); ctx.closePath(); ctx.clip();
    ctx.fillStyle = LEAD; ctx.fillRect(0, 0, pw, ph);
    const pal = ["#2646c9", "#b3262b", "#1f7a3f", "#c27a12", "#6d2aa8", "#117a96", "#b81f65"];
    ctx.save();
    ctx.translate(pw / 2, ph / 2); ctx.rotate(Math.PI / 4);
    const s = 34;
    for (let a = -14; a < 14; a++) for (let b = -14; b < 14; b++) {
      ctx.fillStyle = pal[Math.floor(rand(seed + a * 31 + b * 17) * pal.length)];
      ctx.fillRect(a * s + 1.5, b * s + 1.5, s - 3, s - 3);
      ctx.fillStyle = `rgba(255,255,255,${rand(seed + a * 7 + b * 13) * 0.18})`;
      ctx.fillRect(a * s + 1.5, b * s + 1.5, s - 3, s - 3);
    }
    ctx.restore();

    // the sword: a dark pointed panel behind it, then blade, guard, grip and pommel
    const top = r * 0.55, bottom = ph * 0.9, mid = (top + bottom) / 2;
    ctx.beginPath(); ctx.moveTo(cx, top - 14); ctx.quadraticCurveTo(cx + 46, mid, cx, bottom + 14); ctx.quadraticCurveTo(cx - 46, mid, cx, top - 14); ctx.closePath();
    ctx.fillStyle = "#14193a"; ctx.fill(); ctx.strokeStyle = LEAD; ctx.lineWidth = 5; ctx.stroke();
    const guardY = ph * 0.64;
    ctx.beginPath(); ctx.moveTo(cx - 8, guardY); ctx.lineTo(cx - 8, top + 24); ctx.lineTo(cx, top); ctx.lineTo(cx + 8, top + 24); ctx.lineTo(cx + 8, guardY); ctx.closePath();
    ctx.fillStyle = "#dfe6ee"; ctx.fill(); ctx.strokeStyle = LEAD; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.fillStyle = "#aab4c0"; ctx.fillRect(cx - 1.5, top + 24, 3, guardY - top - 28);
    ctx.beginPath(); ctx.rect(cx - 34, guardY, 68, 11); ctx.fillStyle = "#e3a82a"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - 6, guardY + 11, 12, 46); ctx.fillStyle = "#7a3b1d"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, guardY + 66, 10, 0, Math.PI * 2); ctx.fillStyle = "#e3a82a"; ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = LEAD; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, ph); ctx.lineTo(0, r); ctx.arc(r, r, r, Math.PI, 0); ctx.lineTo(pw, ph); ctx.stroke();
  });
}

function addGlassWindow(parent, x, y, z, rotY, w, rectH, seed, stone) {
  const gl = new THREE.Group();
  gl.position.set(x, y, z);
  gl.rotation.y = rotY;
  parent.add(gl);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, rectH + w / 2), new THREE.MeshBasicMaterial({ map: glassTexture(w, rectH, seed), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  pane.position.set(0, (rectH + w / 2) / 2, 0.02);
  gl.add(pane);
  const frame = new THREE.Mesh(archFrameGeo(w / 2, 0.2, rectH, 0.28), stone);
  gl.add(frame);
  box(w + 0.7, 0.12, 0.38, stone, 0, -0.02, 0.1, gl);
  return gl;
}

/** Plain filler books are muted leather, so the real ones (coloured by genre) stand out. */
const FILLER = ["#3b2b21", "#2f2721", "#45362b", "#362c26", "#2b2521", "#403028", "#33302b"];

/** One spine colour per genre (the groups come from scripts/sync-goodreads.mjs). */
export const GENRE_COLORS = {
  "Fantasy": "#5e2b8a",
  "Science fiction": "#1d5c8c",
  "Horror": "#8c1c22",
  "Mystery & thriller": "#1f6e63",
  "Historical fiction": "#9a5a14",
  "Classics & literature": "#7a2a55",
  "History": "#8f7414",
  "Philosophy & religion": "#4549b8",
  "Science & nature": "#3f7d2a",
  "Biography & memoir": "#b0582a",
  "Society & politics": "#5a6470",
  "Comics & graphic novels": "#c2a21f",
  "Self-help & family": "#b8407e",
  "Comedy": "#86b02c",
  "Other fiction": "#6e5a4a",
  "Other nonfiction": "#2f8f9d",
};
const NO_GENRE = "#7d6a55";
const genreColor = (g) => GENRE_COLORS[g] || NO_GENRE;

/** Keep each series together, in series order, where its most recent book would have been. */
function seriesGroups(list) {
  const groups = [], byName = new Map();
  for (const b of list) {
    const key = b.series ? b.series.toLowerCase() : null;
    if (key && byName.has(key)) { byName.get(key).push(b); continue; }
    const grp = [b];
    groups.push(grp);
    if (key) byName.set(key, grp);
  }
  groups.forEach((grp) => grp.sort((a, b) => (a.seriesNo ?? 0) - (b.seriesNo ?? 0)));
  return groups;
}

/** A spine in a w x h box: the genre colour, two bands and the title running up it. */
function drawSpine(ctx, w, h, title, color) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fillRect(0, 22, w, 3); ctx.fillRect(0, h - 25, w, 3);
  ctx.save();
  ctx.translate(w / 2, h - 36);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f1e9d6";
  ctx.font = "600 30px 'Bricolage Grotesque', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(fitText(ctx, title, h - 90), 0, 0);
  ctx.restore();
}

function buildCase(parent, { w, rows, rowH, d }, woodM, darkM) {
  const g = new THREE.Group();
  parent.add(g);
  const h = rows * rowH + 0.08;
  box(0.06, h, d, woodM, -w / 2 + 0.03, h / 2, 0, g);
  box(0.06, h, d, woodM, w / 2 - 0.03, h / 2, 0, g);
  box(w, h, 0.02, darkM, 0, h / 2, -d / 2 + 0.01, g);
  for (let i = 0; i <= rows; i++) box(w, 0.04, d, woodM, 0, 0.02 + i * rowH, 0, g);
  box(w + 0.16, 0.14, d + 0.1, woodM, 0, h + 0.05, 0.03, g);
  box(w + 0.08, 0.1, d + 0.06, woodM, 0, 0.05, 0.03, g);
  return { g, h };
}

/**
 * Fill a bookcase with plain books. spans[row] (optional) lists the [from, to] stretches to fill
 * on a row that already holds real books; other rows are filled end to end.
 */
function decorativeBooks(caseGroup, { w, rows, rowH, d }, seed, spans = []) {
  const items = [];
  for (let r = 0; r < rows; r++) for (const [from, to] of spans[r] || [[-w / 2 + 0.1, w / 2 - 0.1]]) {
    let x = from, i = Math.round(from * 100);
    while (true) {
      const bw = 0.05 + rand(seed + r * 101 + i) * 0.06;
      if (x + bw > to) break;
      const bh = 0.28 + rand(seed + r * 57 + i + 3) * 0.17;
      const bd = 0.2 + rand(seed + r * 13 + i + 9) * 0.08;
      if (rand(seed + r * 7 + i * 3) > 0.04) items.push({ x: x + bw / 2, y: 0.04 + r * rowH + bh / 2, z: 0.02 + (0.27 - bd) * 0.5, bw, bh, bd, c: FILLER[Math.floor(rand(seed + r * 29 + i) * FILLER.length)] });
      x += bw + 0.004;
      i++;
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.8 }), items.length);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, k) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.scale.set(it.bw, it.bh, it.bd);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
    col.set(it.c).multiplyScalar(0.75 + rand(seed + k) * 0.4);
    mesh.setColorAt(k, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  caseGroup.add(mesh);
}

const BOOK_KINDS = {
  read: { hint: "Inspect book: ", note: "" },
  current: { hint: "Currently reading: ", note: "Currently reading" },
  want: { hint: "Want to read: ", note: "On my want-to-read list" },
};

/** Spine width of real book i: paperback-thin so a few hundred fit. */
const bookW = (i) => 0.05 + rand(i + 1) * 0.03;
const GAP = 0.004;

/*
 * Real books are drawn in one batch per bookcase: one instanced mesh for the bodies and one mesh
 * for all the spines, which share a texture atlas. Hundreds of separate books (each its own
 * texture and six draw calls) made the room lag. Each book keeps an invisible pick box, which
 * lights up when you look at it.
 */
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const BOOK_GLOW = [new THREE.MeshBasicMaterial({ visible: false }), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.3, depthWrite: false })];
const bookBatches = new Map();   // case group -> [{ x, y, z, bw, bh, bd, color, title }]
const SPINE_W = 48, SPINE_H = 288, ATLAS_W = 2016;   // 42 spines a row

function flushBooks(caseGroup) {
  const list = bookBatches.get(caseGroup);
  bookBatches.delete(caseGroup);
  if (!list || !list.length) return;
  const bodies = new THREE.InstancedMesh(unitBox, mat(0xffffff, { roughness: 0.8 }), list.length);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  list.forEach((b, k) => {
    dummy.position.set(b.x, b.y, b.z);
    dummy.scale.set(b.bw, b.bh, b.bd);
    dummy.updateMatrix();
    bodies.setMatrixAt(k, dummy.matrix);
    bodies.setColorAt(k, col.set(b.color));
  });
  caseGroup.add(bodies);

  const per = Math.floor(ATLAS_W / SPINE_W), rowsN = Math.ceil(list.length / per);
  const AH = rowsN * SPINE_H, s = SPINE_W / 64;
  const atlas = canvasTex(ATLAS_W, AH, (ctx) => list.forEach((b, k) => {
    ctx.save();
    ctx.translate((k % per) * SPINE_W, Math.floor(k / per) * SPINE_H);
    ctx.scale(s, s);
    drawSpine(ctx, 64, 384, b.title, b.color);
    ctx.restore();
  }));
  const pos = [], uv = [], nrm = [], idx = [];
  list.forEach((b, k) => {
    const u0 = ((k % per) * SPINE_W + 0.5) / ATLAS_W, u1 = ((k % per + 1) * SPINE_W - 0.5) / ATLAS_W;
    const v1 = 1 - (Math.floor(k / per) * SPINE_H + 0.5) / AH, v0 = 1 - ((Math.floor(k / per) + 1) * SPINE_H - 0.5) / AH;
    const x0 = b.x - b.bw / 2, x1 = b.x + b.bw / 2, y0 = b.y - b.bh / 2, y1 = b.y + b.bh / 2, z = b.z + b.bd / 2 + 0.0008;
    const n = pos.length / 3;
    pos.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    nrm.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  caseGroup.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.8 })));
}

/** Put one real, clickable book on a case at (x, row). kind is "read", "current" or "want". Returns its width. */
function placeBook(caseGroup, spec, b, i, x, row, kind) {
  const K = BOOK_KINDS[kind];
  const bw = bookW(i);
  const bh = 0.31 + rand(i + 50) * 0.13;
  const bd = 0.22 + rand(i + 99) * 0.06;
  const at = { x: x + bw / 2, y: 0.04 + row * spec.rowH + bh / 2, z: 0.02 + (0.27 - bd) * 0.5 };
  if (!bookBatches.has(caseGroup)) bookBatches.set(caseGroup, []);
  bookBatches.get(caseGroup).push({ ...at, bw, bh, bd, color: genreColor(b.genre), title: b.title });
  const m = new THREE.Mesh(unitBox, BOOK_GLOW[0]);
  m.position.set(at.x, at.y, at.z);
  m.scale.set(bw + 0.004, bh + 0.004, bd + 0.004);
  caseGroup.add(m);
  const stars = kind === "read" && b.rating ? "★".repeat(b.rating) + "☆".repeat(5 - b.rating) : "";
  interactables.push({
    mesh: m, hint: K.hint + b.title, glow: BOOK_GLOW,
    open: () => showPanel({
      title: b.title, meta: b.author ? "by " + b.author : "",
      html: [
        K.note ? `<p>${K.note}</p>` : "",
        b.series ? `<p>${esc(b.series)}${b.seriesNo != null ? `, book ${esc(b.seriesNo)}` : ""}</p>` : "",
        b.genre ? `<p><span style="display:inline-block;width:0.8em;height:0.8em;border-radius:2px;vertical-align:-0.05em;margin-right:0.4em;background:${genreColor(b.genre)}"></span>${esc(b.genre)}</p>` : "",
        stars ? `<p aria-label="Rated ${b.rating} out of 5">${stars}</p>` : "",
        kind === "read" && b.dateRead ? `<p>Finished ${esc(b.dateRead)}</p>` : "",
        safeUrl(b.link) ? `<p><a href="${esc(safeUrl(b.link))}" target="_blank" rel="noopener">View on Goodreads</a></p>` : "",
      ].join(""),
    }),
  });
  return bw;
}

/** A cloth cover in the book's genre colour, for a book without cover art. */
function clothCover(b) {
  return canvasTex(200, 300, (ctx, w, h) => {
    ctx.fillStyle = genreColor(b.genre); ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(240,217,168,0.7)"; ctx.lineWidth = 4; ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#f1e9d6"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "700 24px 'Literata', Georgia, serif";
    wrapText(ctx, b.title, w / 2, 90, w - 44, 30, 5);
    ctx.font = "italic 400 17px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, b.author || "", w - 44), w / 2, h - 34);
  });
}

/** A book standing cover-out at (x, y) on a case, leaning back slightly, like the game boxes. */
function faceOutBook(caseGroup, b, x, y, seed) {
  const bw = 0.2, bh = 0.3, bd = 0.035;
  const spine = mat(genreColor(b.genre));
  const cloth = clothCover(b);
  const front = new THREE.MeshStandardMaterial({ map: cloth, emissive: 0xffffff, emissiveMap: cloth, emissiveIntensity: 0.22, roughness: 0.7 });
  const m = new THREE.Mesh(frontBox(bw, bh, bd), [spine, front]);
  const tilt = -0.12;
  m.position.set(x, y + (bh / 2) * Math.cos(tilt) + 0.005, 0.02 + rand(seed) * 0.02);
  m.rotation.x = tilt;
  caseGroup.add(m);
  if (b.cover) coverQueue.push(() => imageLoader.load(b.cover, (img) => setCover(front, canvasTex(160, 240, (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h)))));
  interactables.push({
    mesh: m, hint: BOOK_KINDS.current.hint + b.title, mat: front, base: 0.22,
    open: () => showPanel({
      title: b.title, meta: b.author ? "by " + b.author : "",
      html: [
        `<p>${BOOK_KINDS.current.note}</p>`,
        b.series ? `<p>${esc(b.series)}${b.seriesNo != null ? `, book ${esc(b.seriesNo)}` : ""}</p>` : "",
        b.genre ? `<p><span style="display:inline-block;width:0.8em;height:0.8em;border-radius:2px;vertical-align:-0.05em;margin-right:0.4em;background:${genreColor(b.genre)}"></span>${esc(b.genre)}</p>` : "",
        safeUrl(b.link) ? `<p><a href="${esc(safeUrl(b.link))}" target="_blank" rel="noopener">View on Goodreads</a></p>` : "",
      ].join(""),
    }),
  });
}

/**
 * Shelve real books along a run of shelf rows that may span several cases.
 * runs: [{ c, row, from?, to? }] in order, where c = { g, spec, fillSeed, skipRows? } is a case and
 * from and to (optional) are where the row starts and ends. A series that won't fit at the end of a row starts
 * on the next one, unless it is longer than a whole row. Afterwards each case's free space
 * gets plain filler books. Returns how many books were shelved.
 */
function shelveAcross(runs, list, kind, seed) {
  const startOf = (r) => r.from ?? (-r.c.spec.w / 2 + 0.12);
  const endOf = (r) => r.to ?? (r.c.spec.w / 2 - 0.1);
  let ri = 0, x = runs.length ? startOf(runs[0]) : 0, n = 0;
  const nextRow = () => { ri++; if (ri < runs.length) x = startOf(runs[ri]); };

  outer: for (const grp of seriesGroups(list)) {
    const total = grp.reduce((sum, _, k) => sum + bookW(seed + n + k) + GAP, 0);
    const r = runs[ri];
    if (r && x + total > endOf(r) && x > startOf(r) + 0.01 && total <= endOf(r) - startOf(r)) nextRow();
    for (const b of grp) {
      while (ri < runs.length && x + bookW(seed + n) > endOf(runs[ri])) nextRow();
      if (ri >= runs.length) break outer;
      const run = runs[ri];
      x += placeBook(run.c.g, run.c.spec, b, seed + n, x, run.row, kind) + GAP;
      run.used = x;
      n++;
    }
  }

  // filler: after the last real book in each run, or the whole run if it got none
  for (const c of new Set(runs.map((r) => r.c))) {
    flushBooks(c.g);
    const spans = [];
    runs.filter((r) => r.c === c).forEach((r) => {
      (spans[r.row] = spans[r.row] || []).push([r.used ? r.used + 0.01 : startOf(r), endOf(r)]);
    });
    (c.skipRows || []).forEach((row) => { spans[row] = []; });   // leave the row empty
    decorativeBooks(c.g, c.spec, c.fillSeed, spans);
  }
  return n;
}

/** The want-to-read colours: its sign, and a tint over its bookcases. */
const WANT = { bg: "#123b40", trim: "#5fb3a8", text: "#d8f1ec", wood: 0x2e4a47, darkWood: 0x16302d };

/** A small brass-trimmed plaque that stands on a shelf, like "Currently reading". */
function shelfLabel(w, h, text, { bg = "#2a1b12", trim = "#b08a45", ink = "#f0d9a8" } = {}) {
  return signMesh(w, h, (ctx, cw, ch) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = trim; ctx.lineWidth = 10; ctx.strokeRect(10, 10, cw - 20, ch - 20);
    ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 104px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, text, cw - 70), cw / 2, ch / 2 + 6);
  });
}

/** A key to the spine colours, for the genres actually on the shelves. */
function genreLegend(w, genres) {
  const rowH = 0.085, h = 0.16 + genres.length * rowH;
  const s = signMesh(w, h, (ctx, cw, ch) => {
    const px = cw / w;
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 6; ctx.strokeRect(8, 8, cw - 16, ch - 16);
    ctx.textBaseline = "middle";
    ctx.font = `500 ${Math.round(rowH * px * 0.62)}px 'Bricolage Grotesque', Arial, sans-serif`;
    genres.forEach((g, i) => {
      const y = (0.08 + rowH * (i + 0.5)) * px;
      ctx.fillStyle = genreColor(g);
      ctx.fillRect(0.08 * px, y - rowH * px * 0.32, 0.05 * px, rowH * px * 0.64);
      ctx.fillStyle = "#f0d9a8";
      ctx.fillText(fitText(ctx, g, cw - 0.22 * px), 0.17 * px, y + 2);
    });
  });
  return { mesh: s, h };
}

/** A dark wooden sign with brass trim, for the top of a bookcase (in the case's own frame). */
function caseSign(w, h, text, x, y) {
  const s = signMesh(w, h, (ctx, cw, ch) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 5; ctx.strokeRect(8, 8, cw - 16, ch - 16);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 64px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, text, cw - 60), cw / 2, ch / 2 + 4);
  });
  s.position.set(x, y, -0.11);
  return s;
}

const PLATFORMS = {
  steam: { label: "Steam", color: 0x1b2838, g1: "#1b2838", g2: "#2a475e" },
  psn: { label: "PlayStation", color: 0x0b57d0, g1: "#0b57d0", g2: "#0a2a6b" },
  switch: { label: "Nintendo Switch", color: 0xc4001a, g1: "#e60012", g2: "#8f000e" },
};
const platformOf = (p) => PLATFORMS[p] || PLATFORMS.steam;

function gameCoverTexture(game) {
  const P = platformOf(game.platform);
  return canvasTex(300, 420, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, P.g1); g.addColorStop(1, P.g2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "800 38px 'Bricolage Grotesque', Arial, sans-serif";
    wrapText(ctx, game.title, w / 2, 150, w - 40, 46, 5);
    ctx.font = "500 22px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(P.label, w / 2, h - 28);
  });
}

/** The library runs 11 m from the door to the stained glass, deeper than the other rooms, so every
 * bookcase can stay at a readable 5 shelves. */
const DEPTH = 11;
const BACK = -(NEAR + DEPTH);          // the back wall, in the room's frame
const MID = -(NEAR + DEPTH / 2);       // halfway down the room

export function buildHobbies() {
  const H = 5.0;
  const textures = { wall: stoneTex(), floor: flagstoneTex(), ceil: plankTex("#2a1b12", 0.2, 64) };
  const g = createRoom("hobbies", {
    angle: DOOR_ANGLES.hobbies, H, label: "Hobbies",
    wall: { tex: textures.wall, tw: 2, th: 2 },
    floor: { tex: textures.floor, tw: 2, th: 2, opts: { roughness: 0.75 } },
    ceil: { tex: textures.ceil, tw: 2, th: 2 },
    rightOpening: HALL_OPEN,
    front: { tex: stoneTex(), tw: 2, th: 2 },
    depth: DEPTH,
    bounds: { x0: -3.3, x1: 3.3, z0: BACK + 0.7, z1: -5.26 },
    frameMat: mat(0x3a2619, { roughness: 0.7 }),
    doorStyle: "glass",
  });
  const stoneM = mat(0x6c665c, { roughness: 0.95 });
  const wood = mat(0x4a3020, { roughness: 0.7 });
  const darkWood = mat(0x2a1a10, { roughness: 0.8 });

  // ceiling beams
  for (let z = -6.2; z > BACK + 0.5; z -= 1.8) box(RW, 0.3, 0.3, darkWood, 0, H - 0.15, z, g);
  [-2.7, 0, 2.7].forEach((x) => box(0.24, 0.24, DEPTH, darkWood, x, H - 0.34, MID, g));

  // stained glass: one tall window behind, jewel-coloured lattice with a single sword
  addGlassWindow(g, 0, 0.7, BACK + 0.01, 0, 2.2, 2.8, 3, stoneM);

  // bookcases, all 5 shelves tall. Two on the back wall, either side of the window, stopping short
  // of its sconces. Along the left wall, from the entrance: read-books overflow, the read-books case
  // (with the currently-reading shelf), then want-to-read.
  const ROWS = 5, EYE_FIRST = [2, 3, 1, 4, 0];
  const caseBack = { w: 2.25, rows: ROWS, rowH: 0.5, d: 0.42 };
  const wantWood = mat(WANT.wood, { roughness: 0.7 }), wantDark = mat(WANT.darkWood, { roughness: 0.8 });
  const backCases = [-1, 1].map((side, i) => {
    // the left one holds want-to-read overflow, so it shares that case's tint
    const c = buildCase(g, caseBack, side < 0 ? wantWood : wood, side < 0 ? wantDark : darkWood);
    c.g.position.set(side * (RW / 2 - caseBack.w / 2), 0, BACK + caseBack.d / 2);
    return { g: c.g, spec: caseBack, fillSeed: 100 + i * 50 };
  });
  decorativeBooks(backCases[1].g, caseBack, backCases[1].fillSeed);   // the left one holds want-to-read overflow
  const caseEnd = { w: 3.0, rows: ROWS, rowH: 0.5, d: 0.42 };
  const leftCase = (spec, z, woodM = wood, darkM = darkWood) => {
    const c = buildCase(g, spec, woodM, darkM);
    c.g.position.set(-RW / 2 + spec.d / 2, 0, z);
    c.g.rotation.y = Math.PI / 2;
    return c;
  };
  const nearCase = leftCase(caseEnd, -5.26 - caseEnd.w / 2);
  const near = { g: nearCase.g, spec: caseEnd, fillSeed: 400 };
  const backLeft = backCases[0];

  // centre: books you have finished, with the eye-height shelf kept for what you are reading now.
  // Read books that don't fit carry on in the case to its left (nearer the door).
  const readCase = { w: 4.4, rows: 5, rowH: 0.5, d: 0.42 };
  const rc = leftCase(readCase, -5.26 - caseEnd.w - readCase.w / 2);
  // the currently-reading shelf: its label in the middle, books either side with their covers
  // facing out, nearest the label first, and a thin brass frame round the shelf
  const CURRENT_ROW = 2;
  const curY = 0.04 + CURRENT_ROW * readCase.rowH;
  const curLabel = shelfLabel(0.56, 0.15, "Currently reading");
  curLabel.position.set(0, curY + 0.09, 0.08);
  curLabel.rotation.x = -0.12;
  rc.g.add(curLabel);
  const STEP = 0.23, firstOff = 0.28 + 0.13, perSide = Math.floor((readCase.w / 2 - 0.1 - firstOff + STEP / 2) / STEP);
  (bookData.currentlyReading || []).slice(0, perSide * 2).forEach((b, i) => {
    const side = i % 2 ? 1 : -1, k = Math.floor(i / 2);
    faceOutBook(rc.g, b, side * (firstOff + k * STEP), curY, 900 + i);
  });
  const brass = mat(0xb08a45, { metalness: 0.5, roughness: 0.4 });
  const fz = readCase.d / 2 + 0.006;
  box(readCase.w - 0.1, 0.018, 0.012, brass, 0, curY + 0.009, fz, rc.g);
  box(readCase.w - 0.1, 0.018, 0.012, brass, 0, curY + readCase.rowH - 0.03, fz, rc.g);
  [-1, 1].forEach((s) => box(0.018, readCase.rowH - 0.02, 0.012, brass, s * (readCase.w / 2 - 0.06), curY + readCase.rowH / 2 - 0.01, fz, rc.g));
  const read = bookData.books || [];
  const readC = { g: rc.g, spec: readCase, fillSeed: 700, skipRows: [CURRENT_ROW] };
  shelveAcross([
    ...[3, 1, 4, 0].map((row) => ({ c: readC, row })),
    ...EYE_FIRST.map((row) => ({ c: near, row })),
  ], read, "read", 0);
  rc.g.add(caseSign(1.9, 0.4, `${read.length} books read`, 0, rc.h + 0.47));

  // a key to the spine colours, either side of the count
  const shelved = [...read, ...(bookData.currentlyReading || []), ...(bookData.wantToRead || [])];
  const genres = Object.keys(GENRE_COLORS).filter((k) => shelved.some((b) => b.genre === k));
  const half = Math.ceil(genres.length / 2);
  [genres.slice(0, half), genres.slice(half)].forEach((list, i) => {
    if (!list.length) return;
    const { mesh, h } = genreLegend(1.05, list);
    mesh.position.set(i ? 1.6 : -1.6, rc.h + 0.2 + h / 2, -0.11);
    rc.g.add(mesh);
  });

  // far end: books you want to read, in a teal-tinted case with its label in the middle of the
  // eye-height shelf. Any that don't fit carry on in the back-wall case to its right.
  const want = bookData.wantToRead || [];
  const wantCase = leftCase(caseEnd, -5.26 - caseEnd.w - readCase.w - caseEnd.w / 2, wantWood, wantDark);
  const wantC = { g: wantCase.g, spec: caseEnd, fillSeed: 450 };
  const LABEL_ROW = 2, labelW = 0.62;   // the middle shelf
  const wantLabel = shelfLabel(labelW, 0.17, want.length ? `Want to read · ${want.length}` : "Want to read",
    { bg: WANT.bg, trim: WANT.trim, ink: WANT.text });
  wantLabel.position.set(0, 0.04 + LABEL_ROW * caseEnd.rowH + 0.1, 0.08);
  wantLabel.rotation.x = -0.12;
  wantCase.g.add(wantLabel);
  shelveAcross([
    { c: wantC, row: LABEL_ROW, to: -labelW / 2 - 0.03 },
    { c: wantC, row: LABEL_ROW, from: labelW / 2 + 0.03 },
    ...EYE_FIRST.filter((r) => r !== LABEL_ROW).map((row) => ({ c: wantC, row })),
    // its first 0.4 m sits behind the want case's end, in the corner
    ...EYE_FIRST.map((row) => ({ c: backLeft, row, from: -backLeft.spec.w / 2 + 0.55 })),
  ], want, "want", 2000);

  // a big rug over most of the floor, and a matching runner down the game gallery
  const rugMat = (w, h, px) => new THREE.MeshStandardMaterial({ roughness: 1, map: canvasTex(Math.round(w * px), Math.round(h * px), (ctx, cw, ch) => {
    const s = px / 100;                                     // canvas pixels per cm
    ctx.fillStyle = "#5a1d22"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 9 * s; ctx.strokeRect(14 * s, 14 * s, cw - 28 * s, ch - 28 * s);
    ctx.strokeStyle = "rgba(240,217,168,0.5)"; ctx.lineWidth = 3 * s; ctx.strokeRect(32 * s, 32 * s, cw - 64 * s, ch - 64 * s);
    // a row of gold diamonds down the middle: as many whole ones as fit inside the inner border,
    // centred along the rug, whatever its size
    ctx.fillStyle = "rgba(176,138,69,0.45)";
    const long = cw > ch, len = long ? cw : ch, across = long ? ch : cw, m = 48 * s;
    const d = Math.min(across * 0.22, (across - 2 * m) / 2 / 0.75), gap = d * 0.4;   // d: half a diamond's length
    const n = Math.max(1, Math.floor((len - 2 * m + gap) / (2 * d + gap)));
    const start = (len - (n * 2 * d + (n - 1) * gap)) / 2;
    for (let k = 0; k < n; k++) {
      const t = start + k * (2 * d + gap) + d;
      const x = long ? t : cw / 2, y = long ? ch / 2 : t;
      const a = long ? d : d * 0.75, b = long ? d * 0.75 : d;   // half-width along x, half-height along y
      ctx.beginPath(); ctx.moveTo(x, y - b); ctx.lineTo(x + a, y); ctx.lineTo(x, y + b); ctx.lineTo(x - a, y); ctx.fill();
    }
    noise(ctx, cw, ch, 0.1, Math.round(cw * ch / 60));
  }) });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 9.4), rugMat(6.2, 9.4, 90));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, MID);
  g.add(rug);

  // game shelves either side of the game gallery, a hallway through the right wall
  buildGameShelves(g, wood, darkWood, stoneM, textures, rugMat(3.8, 1.1, 120));

  // two chandeliers down the length of the room
  const flames = [];
  const CHANDELIERS = [MID + 2.3, MID - 2.3];
  CHANDELIERS.forEach((cz) => {
    const chand = new THREE.Group();
    chand.position.set(0, 3.9, cz);
    g.add(chand);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 40), mat(0x1a1612, { metalness: 0.6, roughness: 0.5 }));
    ring.rotation.x = Math.PI / 2;
    chand.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      cyl(0.03, 0.03, 0.2, mat(0xf2e8d0), Math.cos(a) * 0.8, 0.12, Math.sin(a) * 0.8, chand, 10);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), basic(0xffc866));
      f.scale.y = 1.6;
      f.position.set(Math.cos(a) * 0.8, 0.28, Math.sin(a) * 0.8);
      chand.add(f);
      flames.push(f);
    }
    [0, 2.1, 4.2].forEach((a) => cyl(0.012, 0.012, H - 3.9, mat(0x1a1612), Math.cos(a) * 0.5, (H - 3.9) / 2, Math.sin(a) * 0.5, chand, 6));
  });

  // wall sconces beside the back window
  [-1.5, 1.5].forEach((x) => {
    cyl(0.03, 0.03, 0.22, mat(0xf2e8d0), x, 2.2, BACK + 0.25, g, 10);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), basic(0xffc866));
    f.scale.y = 1.6; f.position.set(x, 2.38, BACK + 0.25); g.add(f);
    flames.push(f);
  });
  animations.push((t) => flames.forEach((f, i) => { f.scale.y = 1.5 + Math.sin(t * 9 + i * 2.1) * 0.25; }));

  // lights: candlelight from the chandelier, coloured light through the glass
  const candles = CHANDELIERS.map((cz) => {
    const l = new THREE.PointLight(0xffb36b, 28, 11, 2);
    l.position.set(0, 3.6, cz);
    g.add(l);
    return l;
  });
  animations.push((t) => candles.forEach((l, i) => { l.intensity = 28 + Math.sin(t * 7 + i) * 1.2 + Math.sin(t * 13.3 + i * 2) * 0.7; }));
  const blue = new THREE.PointLight(0x5b7bff, 16, 8, 2);
  blue.position.set(0, 2.4, BACK + 0.76);
  g.add(blue);
  // soft warm light on the game shelves
  const shelfLight = new THREE.PointLight(0xffc48a, 9, 6.5, 2);
  shelfLight.position.set(2.4, 1.7, MID);
  g.add(shelfLight);
}

/* ---------- game shelves: one bookcase per platform, with its console on the middle shelf ---------- */

function screenTex(a, b, tiles) {
  return canvasTex(256, 144, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    tiles.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(14 + i * 60, 74, 52, 52); });
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(14, 22, 90, 8); ctx.fillRect(14, 38, 50, 6);
  });
}

function litScreen(w, h, tex) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

/** PlayStation 5, standing: black core between white shells. About 42 cm tall. */
function makePS5() {
  const c = new THREE.Group();
  const white = mat(0xf2f3f5, { roughness: 0.3, emissive: 0x555555 }), black = mat(0x0c0d12, { roughness: 0.5 });
  box(0.07, 0.4, 0.22, black, 0, 0.225, 0, c);
  [-1, 1].forEach((s) => box(0.04, 0.43, 0.25, white, s * 0.055, 0.235, 0, c));
  box(0.2, 0.025, 0.17, white, 0, 0.0125, 0, c);
  box(0.078, 0.008, 0.2, basic(0x59b1ff), 0, 0.03, 0, c);
  c.rotation.y = 0.2;
  return c;
}

/** Nintendo Switch in its dock, with blue and red Joy-Cons. */
function makeSwitch() {
  const c = new THREE.Group();
  const dock = mat(0xeeeeee, { roughness: 0.4 }), dark = mat(0x16171b, { roughness: 0.5 });
  box(0.31, 0.012, 0.09, dock, 0, 0.006, 0, c);
  box(0.3, 0.17, 0.05, dock, 0, 0.097, -0.02, c);
  box(0.275, 0.145, 0.012, dark, 0, 0.1, 0.008, c);
  box(0.2, 0.118, 0.014, dark, 0, 0.1, 0.021, c);
  const scr = litScreen(0.19, 0.107, screenTex("#2b3a67", "#0f1830", ["#e60012", "#00a0e9", "#f5c400", "#7a7f8a"]));
  scr.position.set(0, 0.1, 0.0285); c.add(scr);
  box(0.034, 0.118, 0.016, mat(0x0ab9e6, { roughness: 0.4 }), -0.117, 0.1, 0.021, c);
  box(0.034, 0.118, 0.016, mat(0xff4554, { roughness: 0.4 }), 0.117, 0.1, 0.021, c);
  cyl(0.009, 0.009, 0.006, dark, -0.117, 0.122, 0.031, c, 10).rotation.x = Math.PI / 2;
  cyl(0.009, 0.009, 0.006, dark, 0.117, 0.078, 0.031, c, 10).rotation.x = Math.PI / 2;
  c.scale.setScalar(1.35);
  return c;
}

/** Steam Deck handheld on a small stand. */
function makeSteamDeck() {
  const c = new THREE.Group();
  const body = mat(0x1b1e24, { roughness: 0.55 }), dark = mat(0x0b0c0f, { roughness: 0.6 });
  const d = new THREE.Group();
  d.position.set(0, 0.105, 0); d.rotation.x = -0.28; c.add(d);
  box(0.34, 0.13, 0.045, body, 0, 0, 0, d);
  [-1, 1].forEach((s) => { const e = cyl(0.065, 0.065, 0.045, body, s * 0.17, 0, 0, d, 20); e.rotation.x = Math.PI / 2; });
  const scr = litScreen(0.21, 0.131 * 0.9, screenTex("#26466b", "#0b1624", ["#66c0f4", "#a4d007", "#ffffff", "#8f98a0"]));
  scr.position.set(0, 0, 0.0235); d.add(scr);
  [[-0.135, 0.03], [0.1, -0.035]].forEach(([x, y]) => { const s = cyl(0.017, 0.017, 0.012, dark, x, y, 0.028, d, 12); s.rotation.x = Math.PI / 2; });
  box(0.04, 0.012, 0.01, dark, -0.135, -0.035, 0.026, d); box(0.012, 0.04, 0.01, dark, -0.135, -0.035, 0.026, d);
  [[0.135, 0.055, 0xd9a21b], [0.135, 0.005, 0x4aa8ff], [0.16, 0.03, 0xd04040], [0.11, 0.03, 0x46b05a]].forEach(([x, y, col]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), mat(col)); b.position.set(x, y - 0.005, 0.026); d.add(b);
  });
  box(0.22, 0.012, 0.05, mat(0x3a3d44, { roughness: 0.5 }), 0, 0.006, 0.02, c);
  box(0.16, 0.12, 0.012, mat(0x3a3d44, { roughness: 0.5 }), 0, 0.07, -0.04, c);
  c.scale.setScalar(1.2);
  return c;
}

const CONSOLES = { psn: makePS5, switch: makeSwitch, steam: makeSteamDeck };
const SHELF = { w: 2.3, rows: 5, rowH: 0.54, d: 0.45 };
const UNIT = SHELF.w + 0.1;      // one shelf unit along a wall, with a small gap
const PER_ROW = 10;              // games on a full shelf
const STEP = 0.215;              // from one game to the next along a shelf
const MAIN_HOLDS = 4 + 4 * PER_ROW;   // a console unit: 4 on show beside the console, a full row on each other shelf
/** The Switch shelf has an "Under construction" sign above its console while this is true. */
const SWITCH_UNDER_CONSTRUCTION = true;

/**
 * Only games played at least this long go on the shelves. data/games.json keeps every game the
 * sync finds (5 hours or more, see MIN_HOURS in scripts/sync-games.mjs), so lowering this brings
 * the rest back. Games without hours (a Switch game you left them off) always show.
 */
export const SHOW_MIN_HOURS = 30;

function shownGames() {
  const all = (gameData.games || []).filter((x) => typeof x.hours !== "number" || x.hours >= SHOW_MIN_HOURS);
  const of = (key) => all.filter((x) => x.platform === key);
  return { psn: of("psn"), steam: of("steam"), sw: of("switch") };
}

/** What doesn't fit on a platform's console unit, in shelf-unit-sized chunks. */
function overflowUnits(list) {
  const left = showcaseFirst(list).rest.slice(MAIN_HOLDS - 4), out = [];
  for (let i = 0; i < left.length; i += GALLERY_HOLDS) out.push(left.slice(i, i + GALLERY_HOLDS));
  return out;
}

/**
 * The game gallery: a hallway through the right wall. PlayStation's console unit stands in the
 * room to the right of its opening and Steam's to the left; the Switch's lines the hallway's
 * left-hand wall. Any games that don't fit on a console unit carry on down the hallway walls.
 */
export const HALL = { z0: MID - 1.8, z1: MID + 1.8, h: 3.6 };                     // outer walls, room frame
export const HALL_OPEN = { z0: HALL.z0 + SHELF.d, z1: HALL.z1 - SHELF.d, h: 3.2 };

/* ---------- covers: loaded on first entry, and shrunk so hundreds fit in graphics memory ---------- */

const coverQueue = [];
const imageLoader = new THREE.ImageLoader();
const blankCovers = {};
const blankCover = (key) => blankCovers[key] || (blankCovers[key] = canvasTex(64, 90, (ctx, w, h) => {
  const P = platformOf(key), g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, P.g1); g.addColorStop(1, P.g2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}));

/*
 * Covers are put on a few at a time, each frame: every new cover is an image to send to the
 * graphics card, and a couple of hundred at once froze the room for a moment.
 */
const coverJobs = [];
animations.push(() => { for (let i = 0; i < 4 && coverJobs.length; i++) coverJobs.shift()(); });
function setCover(material, tex) {
  coverJobs.push(() => {
    material.map = tex;
    material.emissiveMap = tex;
    material.needsUpdate = true;
  });
}

/** Load a cover into a small canvas (cropped to fill), or draw the title if there is none. */
function loadCover(material, game, aspect) {
  const titleCard = () => setCover(material, gameCoverTexture(game));
  // the 200x300 copy when there is one: named in the data, or (for hand-added Switch games) found
  // by name in assets/covers/small/, falling back to the full-size cover if it isn't there
  const guess = !game.thumb && /^assets\/covers\/[^/]+$/.test(game.cover || "") ? game.cover.replace("assets/covers/", "assets/covers/small/") : "";
  const src = game.thumb || guess || game.cover;
  if (!src) { titleCard(); return; }
  const fallback = guess ? () => imageLoader.load(game.cover, drawn, undefined, titleCard) : titleCard;
  const drawn = (img) => {
    // the whole image, centred; any space around it (a full-size cover that isn't 2:3) gets a
    // blurred, darkened copy stretched to fill
    const H = 192, W = Math.round(H * aspect);
    const s = Math.min(W / img.width, H / img.height), dw = img.width * s, dh = img.height * s;
    setCover(material, canvasTex(W, H, (ctx) => {
      if (Math.abs(dw - W) > 1 || Math.abs(dh - H) > 1) {
        ctx.filter = "blur(6px) brightness(0.6)";
        ctx.drawImage(img, -8, -8, W + 16, H + 16);
        ctx.filter = "none";
      }
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }));
  };
  imageLoader.load(src, drawn, undefined, fallback);
}

/* ---------- one shelf unit ---------- */

const sideMats = {};   // one shared material for the box sides of each platform

/** A game box on a shelf. big = the showcase games beside a console. */
function addGame(shelf, key, game, x, row, big) {
  const P = platformOf(key);
  const gw = big ? 0.26 : 0.19, gh = gw * 1.5;         // 2:3, the shape of the cover images
  const faces = sideMats[key] || (sideMats[key] = mat(P.color));
  const front = new THREE.MeshStandardMaterial({ map: blankCover(key), emissive: 0xffffff, emissiveMap: blankCover(key), emissiveIntensity: 0.25, roughness: 0.6 });
  const m = new THREE.Mesh(frontBox(gw, gh, 0.03), [faces, front]);
  const tilt = big ? -0.2 : -0.1;
  m.position.set(x, 0.04 + row * SHELF.rowH + (gh / 2) * Math.cos(tilt) + 0.01, -SHELF.d / 2 + 0.2 + (big ? 0.03 : 0));
  m.rotation.x = tilt;
  shelf.add(m);
  coverQueue.push(() => loadCover(front, game, gw / gh));
  interactables.push({
    mesh: m, hint: "Inspect game: " + game.title, mat: front, base: 0.25,
    open: () => showPanel({
      title: game.title,
      meta: P.label,
      html: [
        game.hours ? `<p>${esc(Math.round(game.hours))} hours played in total</p>` : "",
        game.recentHours ? `<p>${esc(game.recentHours)} hours in the last two weeks</p>` : "",
        game.lastPlayed ? `<p>Last played ${esc(game.lastPlayed)}</p>` : "",
        game.trophies ? `<p>Trophies: ${esc(game.trophies.earned)} of ${esc(game.trophies.total)} (${esc(game.trophies.progress ?? 0)}%)</p>` : "",
        game.achievements ? `<p>Achievements: ${esc(game.achievements.earned)} of ${esc(game.achievements.total)} (${esc(game.achievements.progress)}%)</p>` : "",
        typeof game.completion === "number" ? `<p>${esc(game.completion)}% complete</p>` : "",
        game.note ? `<p>${esc(game.note)}</p>` : "",
      ].join(""),
    }),
  });
}

/** A platform sign for the top of a unit. */
function platformSign(text) {
  return signMesh(1.7, 0.36, (ctx, w, hh) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, w, hh);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 5; ctx.strokeRect(8, 8, w - 16, hh - 16);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 56px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, text, w - 60), w / 2, hh / 2 + 4);
  });
}

/** An empty game case at (x, z), turned rotY, facing the way its front points. */
function placeUnit(g, x, z, rotY, wood, darkWood) {
  const shelf = new THREE.Group();
  shelf.position.set(x, 0, z);
  shelf.rotation.y = rotY;
  g.add(shelf);
  const { h } = buildCase(shelf, SHELF, wood, darkWood);
  return { shelf, h };
}

/** Trophy or achievement completion, 0-100 (-1 when the game has neither). */
const completion = (game) => (game.trophies ? game.trophies.progress ?? 0 : game.achievements ? game.achievements.progress
  : typeof game.completion === "number" ? game.completion : -1);   // completion: set by hand for Switch games

/** Games kept out of the showcase and put on a console unit's top shelf instead. */
const NOT_FEATURED = [/^PUBG\b/i];
const notFeatured = (game) => NOT_FEATURED.some((re) => re.test(game.title || ""));
/** Platforms whose showcase is picked by most hours, with completion as the tie-breaker. */
const BY_HOURS = new Set(["steam"]);
const TOP_SHELF_AT = PER_ROW * 2;          // the console unit fills rows 3, 1, 4, 0: row 4 is the top

/**
 * Split a platform's games (newest first) into the 4 showcase games beside the console and
 * everything else, still newest first. The showcase is the highest trophy or achievement
 * completion, then most hours; on Steam, most hours, then achievements. NOT_FEATURED games never
 * make the showcase and go to the start of the top shelf.
 */
export function showcaseFirst(games) {
  const hours = (a, b) => (b.hours || 0) - (a.hours || 0), done = (a, b) => completion(b) - completion(a);
  const rank = BY_HOURS.has(games[0] && games[0].platform) ? (a, b) => hours(a, b) || done(a, b) : (a, b) => done(a, b) || hours(a, b);
  const best = games.filter((g) => !notFeatured(g)).sort(rank).slice(0, 4);
  const rest = games.filter((g) => !best.includes(g) && !notFeatured(g));
  rest.splice(Math.min(TOP_SHELF_AT, rest.length), 0, ...games.filter(notFeatured));
  return { showcase: best, rest };
}

/** The console unit: the console mid-shelf with the 4 most-completed games either side, 32 more around it. */
function consoleUnit(g, key, games, x, z, rotY, wood, darkWood) {
  const P = platformOf(key);
  const { shelf, h } = placeUnit(g, x, z, rotY, wood, darkWood);
  const consoleRow = 2;
  const spots = [0.5, -0.5, 0.78, -0.78];   // nearest the console first
  const { showcase, rest: others } = showcaseFirst(games);
  showcase.forEach((game, i) => addGame(shelf, key, game, spots[i], consoleRow, true));
  const rest = others.slice(0, MAIN_HOLDS - 4);
  [3, 1, 4, 0].forEach((row, r) => {
    rest.slice(r * PER_ROW, r * PER_ROW + PER_ROW).forEach((game, i) => addGame(shelf, key, game, rowX(i), row, false));
  });

  const con = CONSOLES[key]();
  con.position.set(0, 0.04 + consoleRow * SHELF.rowH + 0.005, -0.02);
  shelf.add(con);
  if (key === "switch" && SWITCH_UNDER_CONSTRUCTION) underConstruction(shelf, consoleRow);
  const total = games.reduce((n, x) => n + (x.hours || 0), 0);
  const earned = games.reduce((n, x) => n + (x.trophies ? x.trophies.earned : 0), 0);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.04 + consoleRow * SHELF.rowH + 0.22, 0);
  shelf.add(hit);
  const more = games.length - MAIN_HOLDS;
  interactables.push({
    mesh: hit, hint: "Look at the " + P.label + " shelf",
    open: () => showPanel({
      title: P.label,
      meta: games.length + (games.length === 1 ? " game played" : " games played"),
      html: [
        total ? `<p>${esc(Math.round(total))} hours across these games</p>` : "",
        earned ? `<p>${esc(earned)} trophies earned</p>` : "",
        key === "switch" ? "<p>The Switch has no public game history, so these are added by hand.</p>" : "",
        games[0] ? `<p>Most recent: ${esc(games[0].title)}</p>` : "<p>No games here yet.</p>",
        more > 0 ? `<p>The other ${esc(more)} carry on down the game gallery.</p>` : "",
      ].join(""),
    }),
  });
  const sign = platformSign(`${P.label} · ${games.length}`);
  sign.position.set(0, h + 0.38, 0.2);
  shelf.add(sign);
}

/** x of the i-th game on a full shelf, the row centred on the unit. */
const rowX = (i) => (i - (PER_ROW - 1) / 2) * STEP;

/** A small traffic cone, standing on y = 0. */
function trafficCone() {
  const c = new THREE.Group();
  const orange = mat(0xff6a13, { roughness: 0.6, emissive: 0x401800 }), white = mat(0xf4f4f0, { roughness: 0.5 });
  box(0.075, 0.008, 0.075, mat(0x1a1a1a), 0, 0.004, 0, c);
  cyl(0.006, 0.03, 0.11, orange, 0, 0.063, 0, c, 16);
  cyl(0.0175, 0.022, 0.018, white, 0, 0.063, 0, c, 16);
  return c;
}

/** An "Under construction" sign hanging just above the console, with a traffic cone either side. */
function underConstruction(shelf, consoleRow) {
  const w = 0.52, h = 0.1;
  const sign = signMesh(w, h, (ctx, cw, ch) => {
    ctx.fillStyle = "#f5c400"; ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.rect(22, 22, cw - 44, ch - 44); ctx.clip("evenodd");
    ctx.fillStyle = "#16161a";
    for (let x = -ch; x < cw + ch; x += 44) { ctx.beginPath(); ctx.moveTo(x, ch); ctx.lineTo(x + 22, ch); ctx.lineTo(x + 22 + ch, 0); ctx.lineTo(x + ch, 0); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = "#16161a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 74px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText(fitText(ctx, "UNDER CONSTRUCTION", cw - 90), cw / 2, ch / 2 + 6);
  });
  sign.scale.z = 0.3;
  const top = 0.02 + (consoleRow + 1) * SHELF.rowH - 0.02;   // underside of the shelf above
  const y = top - 0.075 - h / 2;
  sign.position.set(0, y, 0.12);
  shelf.add(sign);
  [-0.15, 0.15].forEach((x) => box(0.004, top - y - h / 2, 0.004, mat(0x2a2a2a), x, (top + y + h / 2) / 2, 0.12, shelf));   // the wires it hangs from
  [-1, 1].forEach((s) => {
    const cone = trafficCone();
    cone.position.set(s * (w / 2 + 0.06), 0.04 + consoleRow * SHELF.rowH, 0.12);
    shelf.add(cone);
  });
}

/** A hallway unit: up to 50 games, a full row on each shelf, eye height first. */
function galleryUnit(g, key, games, x, z, rotY, wood, darkWood, label) {
  const { shelf, h } = placeUnit(g, x, z, rotY, wood, darkWood);
  [2, 3, 1, 4, 0].forEach((row, r) => {
    games.slice(r * PER_ROW, r * PER_ROW + PER_ROW).forEach((game, i) => addGame(shelf, key, game, rowX(i), row, false));
  });
  if (label) {
    const sign = platformSign(label);
    sign.scale.setScalar(0.8);
    sign.position.set(0, h + 0.26, 0.2);
    shelf.add(sign);
  }
}
const GALLERY_HOLDS = PER_ROW * SHELF.rows;

/* ---------- the room's right wall and the hallway ---------- */

function buildGameShelves(g, wood, darkWood, stone, textures, runnerMat) {
  const { psn, steam, sw } = shownGames();
  // the Switch lines the hallway's left-hand wall (the one you see from the room), then Steam's
  // overflow; across from the Switch is the other-hobbies shelf, then PlayStation's overflow
  const wallA = [null, ...overflowUnits(psn)];
  const wallB = [{ key: "switch", list: sw, console: true }, ...overflowUnits(steam).map((list, i) => ({ key: "steam", list, label: i === 0 ? "Steam, continued" : "" }))];
  const X0 = RW / 2;                                           // the room's right wall
  const L = Math.max(3.4, 0.15 + Math.max(wallA.length, wallB.length) * UNIT + 0.5);
  const zc = (HALL.z0 + HALL.z1) / 2, W = HALL.z1 - HALL.z0;
  const right = -Math.PI / 2;

  // console units in the room, either side of the opening
  consoleUnit(g, "psn", psn, X0 - SHELF.d / 2, HALL_OPEN.z1 + SHELF.w / 2, right, wood, darkWood);
  consoleUnit(g, "steam", steam, X0 - SHELF.d / 2, HALL_OPEN.z0 - SHELF.w / 2, right, wood, darkWood);
  rooms.hobbies.obstacles.push(
    { x0: 3.1, x1: 3.8, z0: HALL_OPEN.z1, z1: HALL_OPEN.z1 + SHELF.w + 0.05 },
    { x0: 3.1, x1: 3.8, z0: HALL_OPEN.z0 - SHELF.w - 0.05, z1: HALL_OPEN.z0 },
  );

  // the hallway shell: floor, ceiling, side walls, far wall, and the hallway side of the opening
  const plane = (w, h, material, x, y, z, rx, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0);
    g.add(m);
  };
  // u0, v0: where the piece starts in the wall's pattern, so pieces line up with their neighbours
  const wallMat = (w, h, u0 = 0, v0 = 0) => { const m = tiled(textures.wall, w / 2, h / 2); m.map.offset.set(u0 / 2, v0 / 2); return m; };
  plane(L, W, tiled(textures.floor, L / 2, W / 2, { roughness: 0.75 }), X0 + L / 2, 0, zc, -Math.PI / 2, 0);
  plane(L, W, tiled(textures.ceil, L / 2, W / 2), X0 + L / 2, HALL.h, zc, Math.PI / 2, 0);
  plane(L, HALL.h, wallMat(L, HALL.h), X0 + L / 2, HALL.h / 2, HALL.z1, 0, Math.PI);
  plane(L, HALL.h, wallMat(L, HALL.h), X0 + L / 2, HALL.h / 2, HALL.z0, 0, 0);
  plane(W, HALL.h, wallMat(W, HALL.h), X0 + L, HALL.h / 2, zc, 0, -Math.PI / 2);
  plane(SHELF.d, HALL.h, wallMat(SHELF.d, HALL.h), X0 + 0.001, HALL.h / 2, HALL.z1 - SHELF.d / 2, 0, Math.PI / 2);
  plane(SHELF.d, HALL.h, wallMat(SHELF.d, HALL.h), X0 + 0.001, HALL.h / 2, HALL.z0 + SHELF.d / 2, 0, Math.PI / 2);
  const openW = HALL_OPEN.z1 - HALL_OPEN.z0;
  plane(openW, HALL.h - HALL_OPEN.h, wallMat(openW, HALL.h - HALL_OPEN.h, HALL.z1 - HALL_OPEN.z1, HALL_OPEN.h), X0 + 0.001, (HALL.h + HALL_OPEN.h) / 2, zc, 0, Math.PI / 2);

  // a dark wooden frame round the opening
  [HALL_OPEN.z0, HALL_OPEN.z1].forEach((z) => box(0.2, HALL_OPEN.h, 0.14, darkWood, X0, HALL_OPEN.h / 2, z, g));
  box(0.2, 0.18, openW + 0.14, darkWood, X0, HALL_OPEN.h + 0.09, zc, g);

  // the units along each hallway wall, from the opening outwards
  wallA.forEach((list, i) => {
    const x = X0 + 0.15 + UNIT * (i + 0.5), z = HALL.z1 - SHELF.d / 2;
    if (!list) {
      const { shelf, h } = placeUnit(g, x, z, Math.PI, wood, darkWood);
      // the top two shelves hold board games from data/board-games.json; until there are some,
      // plain books fill them
      const boardGames = (boardGameData.games || []).filter((x) => x && x.title);
      fillHobbyShelf(shelf, SHELF, boardGames);
      const top = boardGames.length ? [] : [[-1.05, 1.05]];
      decorativeBooks(shelf, SHELF, 7100, [[], [[0.85, 1.05]], [[-1.05, -0.45]], top, top]);
      const lamp = new THREE.PointLight(0xffc48a, 2.2, 3, 2);
      lamp.position.set(0, 1.9, 0.9);
      shelf.add(lamp);
      const sign = platformSign("Other hobbies");
      sign.position.set(0, h + 0.38, 0.2);
      shelf.add(sign);
    } else galleryUnit(g, "psn", list, x, z, Math.PI, wood, darkWood, i === 1 ? "PlayStation, continued" : "");
  });

  // a suit of armour on a stand in the corner to the right of the PlayStation shelf, turned to the room
  const armour = armourStand();
  armour.position.set(X0 - 0.55, 0, -NEAR - 0.62);
  armour.rotation.y = Math.atan2(-(X0 - 0.55), MID - (-NEAR - 0.62));
  g.add(armour);
  rooms.hobbies.obstacles.push({ x0: X0 - 0.95, x1: X0, z0: -NEAR - 1.0, z1: -NEAR - 0.2 });
  wallB.forEach((u, i) => {
    const x = X0 + 0.15 + UNIT * (i + 0.5), z = HALL.z0 + SHELF.d / 2;
    if (u.console) consoleUnit(g, u.key, u.list, x, z, 0, wood, darkWood);
    else galleryUnit(g, u.key, u.list, x, z, 0, wood, darkWood, u.label);
  });

  // a runner down the hallway, from just inside the room to the far wall
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(L + 0.4, 1.1), runnerMat);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(X0 + (L + 0.4) / 2 - 0.5, 0.013, zc);
  g.add(runner);

  // lanterns down the hallway
  const lights = Math.max(1, Math.round(L / 5));
  for (let i = 0; i < lights; i++) {
    const x = X0 + (L * (i + 0.5)) / lights;
    const lamp = new THREE.PointLight(0xffc48a, 7, 6.5, 2);
    lamp.position.set(x, HALL.h - 0.45, zc);
    g.add(lamp);
    cyl(0.012, 0.012, 0.3, mat(0x1a1612), x, HALL.h - 0.15, zc, g, 6);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), basic(0xffd9a0));
    glow.position.set(x, HALL.h - 0.38, zc);
    g.add(glow);
  }

  rooms.hobbies.annexes.push({
    walk: { x0: 3.2, x1: X0 + L - 0.3, z0: HALL_OPEN.z0 + 0.3, z1: HALL_OPEN.z1 - 0.3 },
    outline: { x0: X0, x1: X0 + L, z0: HALL.z0, z1: HALL.z1 },
  });
  rooms.hobbies.onEnter = () => coverQueue.splice(0).forEach((load) => load());
}
