/* HOBBIES room (2 o'clock): a castle library with the bookcase and the game shelves. */
import * as THREE from "three";
import { DOOR_ANGLES, NEAR, RW, animations, archFrameGeo, basic, bookData, box, canvasTex, createRoom, cyl, esc, fitText, gameData, interactables, mat, noise, rand, rooms, safeUrl, showPanel, signMesh, tiled, wrapText } from "./core.js";
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
  "Other fiction": "#6e5a4a",
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

function spineTexture(title, color) {
  return canvasTex(64, 384, (ctx, w, h) => {
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
  });
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

/** Fill a bookcase with plain books. startX[row] (optional) is where to begin on a row that already holds real books. */
function decorativeBooks(caseGroup, { w, rows, rowH, d }, seed, startX = []) {
  const items = [];
  for (let r = 0; r < rows; r++) {
    let x = startX[r] ?? (-w / 2 + 0.1), i = 0;
    while (true) {
      const bw = 0.05 + rand(seed + r * 101 + i) * 0.06;
      if (x + bw > w / 2 - 0.1) break;
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

/** Put one real, clickable book on a case at (x, row). kind is "read", "current" or "want". Returns its width. */
function placeBook(caseGroup, spec, b, i, x, row, kind) {
  const K = BOOK_KINDS[kind];
  const bw = bookW(i);
  const bh = 0.31 + rand(i + 50) * 0.13;
  const bd = 0.22 + rand(i + 99) * 0.06;
  const color = genreColor(b.genre);
  const plain = mat(color);
  const spine = new THREE.MeshStandardMaterial({ map: spineTexture(b.title, color), roughness: 0.8 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [plain, plain, plain, plain, spine, plain]);
  m.position.set(x + bw / 2, 0.04 + row * spec.rowH + bh / 2, 0.02 + (0.27 - bd) * 0.5);
  caseGroup.add(m);
  const stars = kind === "read" && b.rating ? "★".repeat(b.rating) + "☆".repeat(5 - b.rating) : "";
  interactables.push({
    mesh: m, hint: K.hint + b.title, mat: spine,
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

/**
 * Shelve real books along a run of shelf rows that may span several cases.
 * runs: [{ c, row, from? }] in order, where c = { g, spec, fillSeed, skipRows? } is a case and
 * from (optional) is where the row starts. A series that won't fit at the end of a row starts
 * on the next one, unless it is longer than a whole row. Afterwards each case's free space
 * gets plain filler books. Returns how many books were shelved.
 */
function shelveAcross(runs, list, kind, seed) {
  const startOf = (r) => r.from ?? (-r.c.spec.w / 2 + 0.12);
  const endOf = (r) => r.c.spec.w / 2 - 0.1;
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

  // filler: after the last real book on each row, from the row's start on empty rows
  for (const c of new Set(runs.map((r) => r.c))) {
    const fillFrom = [];
    runs.filter((r) => r.c === c).forEach((r) => { fillFrom[r.row] = r.used ? r.used + 0.01 : r.from; });
    (c.skipRows || []).forEach((row) => { fillFrom[row] = c.spec.w; });   // starting past the end leaves the row empty
    decorativeBooks(c.g, c.spec, c.fillSeed, fillFrom);
  }
  return n;
}

/** A small brass-trimmed plaque that stands on a shelf, like "Currently reading". */
function shelfLabel(w, h, text) {
  return signMesh(w, h, (ctx, cw, ch) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 10; ctx.strokeRect(10, 10, cw - 20, ch - 20);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
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
  const backCases = [-1, 1].map((side, i) => {
    const c = buildCase(g, caseBack, wood, darkWood);
    c.g.position.set(side * (RW / 2 - caseBack.w / 2), 0, BACK + caseBack.d / 2);
    return { g: c.g, spec: caseBack, fillSeed: 100 + i * 50 };
  });
  decorativeBooks(backCases[1].g, caseBack, backCases[1].fillSeed);   // the left one holds want-to-read overflow
  const caseEnd = { w: 3.0, rows: ROWS, rowH: 0.5, d: 0.42 };
  const leftCase = (spec, z) => {
    const c = buildCase(g, spec, wood, darkWood);
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
  const CURRENT_ROW = 2;
  let cx = -readCase.w / 2 + 0.12;
  (bookData.currentlyReading || []).forEach((b, i) => {
    if (cx + 0.11 > readCase.w / 2 - 0.75) return;    // leave room for the label at the right end
    cx += placeBook(rc.g, readCase, b, 900 + i, cx, CURRENT_ROW, "current") + GAP;
  });
  const curLabel = shelfLabel(0.56, 0.15, "Currently reading");
  curLabel.position.set(readCase.w / 2 - 0.42, 0.04 + CURRENT_ROW * readCase.rowH + 0.09, 0.08);
  curLabel.rotation.x = -0.12;
  rc.g.add(curLabel);
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

  // far end: books you want to read, labelled on the eye-height shelf. Any that don't fit
  // carry on in the back-wall case to its right.
  const want = bookData.wantToRead || [];
  const wantCase = leftCase(caseEnd, -5.26 - caseEnd.w - readCase.w - caseEnd.w / 2);
  const wantC = { g: wantCase.g, spec: caseEnd, fillSeed: 450 };
  const LABEL_ROW = 2, labelW = 0.62;   // the middle shelf
  const wantLabel = shelfLabel(labelW, 0.17, want.length ? `Want to read · ${want.length}` : "Want to read");
  wantLabel.position.set(-caseEnd.w / 2 + 0.1 + labelW / 2, 0.04 + LABEL_ROW * caseEnd.rowH + 0.1, 0.08);
  wantLabel.rotation.x = -0.12;
  wantCase.g.add(wantLabel);
  shelveAcross([
    { c: wantC, row: LABEL_ROW, from: -caseEnd.w / 2 + 0.14 + labelW },
    ...EYE_FIRST.filter((r) => r !== LABEL_ROW).map((row) => ({ c: wantC, row })),
    // its first 0.4 m sits behind the want case's end, in the corner
    ...EYE_FIRST.map((row) => ({ c: backLeft, row, from: -backLeft.spec.w / 2 + 0.55 })),
  ], want, "want", 2000);

  // game shelves: two in the room either side of the game gallery, the rest down the gallery
  buildGameShelves(g, wood, darkWood, stoneM, textures);

  // rug in the middle of the room
  const rugTex = canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#5a1d22"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 10; ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = "rgba(240,217,168,0.5)"; ctx.lineWidth = 3; ctx.strokeRect(52, 52, w - 104, h - 104);
    ctx.fillStyle = "rgba(176,138,69,0.45)"; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 120, 80, 0, 0, Math.PI * 2); ctx.fill();
    noise(ctx, w, h, 0.1, 3000);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, MID);
  g.add(rug);

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
  shelfLight.position.set(2.4, 1.7, (HALL.z0 + HALL.z1) / 2);
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
const MAIN_HOLDS = 36;           // a console unit: 4 on show beside the console, 8 on each other shelf
const PER_ROW = 8;

/**
 * The game gallery: a hallway through the right wall, sized to fit every game. The console
 * units stand in the room either side of its opening (PlayStation, Steam) and at its far end
 * (Switch); the rest of each platform's games line the hallway walls.
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

function setCover(material, tex) {
  material.map = tex;
  material.emissiveMap = tex;
  material.needsUpdate = true;
}

/** Load a cover into a small canvas (cropped to fill), or draw the title if there is none. */
function loadCover(material, game, aspect) {
  const titleCard = () => setCover(material, gameCoverTexture(game));
  const src = game.thumb || game.cover;   // the 200x300 copy when there is one
  if (!src) { titleCard(); return; }
  imageLoader.load(src, (img) => {
    const H = 192, W = Math.round(H * aspect);
    const a = img.width / img.height;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (a > aspect) { sw = img.height * aspect; sx = (img.width - sw) / 2; }
    else { sh = img.width / aspect; sy = (img.height - sh) / 2; }
    setCover(material, canvasTex(W, H, (ctx) => ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)));
  }, undefined, titleCard);
}

/* ---------- one shelf unit ---------- */

/** A game box on a shelf. big = the showcase games beside a console. */
function addGame(shelf, key, game, x, row, big) {
  const P = platformOf(key);
  const gw = big ? 0.26 : 0.2, gh = big ? 0.37 : 0.29;
  const faces = mat(P.color);
  const front = new THREE.MeshStandardMaterial({ map: blankCover(key), emissive: 0xffffff, emissiveMap: blankCover(key), emissiveIntensity: 0.25, roughness: 0.6 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 0.03), [faces, faces, faces, faces, front, faces]);
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
const completion = (game) => (game.trophies ? game.trophies.progress ?? 0 : game.achievements ? game.achievements.progress : -1);

/**
 * Split a platform's games (newest first) into the 4 showcase games beside the console (highest
 * trophy or achievement completion, then most hours) and everything else, still newest first.
 */
export function showcaseFirst(games) {
  const best = [...games].sort((a, b) => completion(b) - completion(a) || (b.hours || 0) - (a.hours || 0)).slice(0, 4);
  return { showcase: best, rest: games.filter((g) => !best.includes(g)) };
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
    rest.slice(r * PER_ROW, r * PER_ROW + PER_ROW).forEach((game, i) => addGame(shelf, key, game, -0.91 + i * 0.26, row, false));
  });

  const con = CONSOLES[key]();
  con.position.set(0, 0.04 + consoleRow * SHELF.rowH + 0.005, -0.02);
  shelf.add(con);
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
        key === "switch" ? "<p>The Switch has no public game history, so these are added by hand in data/games.json.</p>" : "",
        games[0] ? `<p>Most recent: ${esc(games[0].title)}</p>` : "<p>No games here yet.</p>",
        more > 0 ? `<p>The other ${esc(more)} carry on down the game gallery.</p>` : "",
      ].join(""),
    }),
  });
  const sign = platformSign(`${P.label} · ${games.length}`);
  sign.position.set(0, h + 0.38, 0.2);
  shelf.add(sign);
}

/** A hallway unit: up to 40 games, 8 on each shelf, eye height first. */
function galleryUnit(g, key, games, x, z, rotY, wood, darkWood, label) {
  const { shelf, h } = placeUnit(g, x, z, rotY, wood, darkWood);
  [2, 3, 1, 4, 0].forEach((row, r) => {
    games.slice(r * PER_ROW, r * PER_ROW + PER_ROW).forEach((game, i) => addGame(shelf, key, game, -0.91 + i * 0.26, row, false));
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

function buildGameShelves(g, wood, darkWood, stone, textures) {
  const all = gameData.games || [];
  const of = (key) => all.filter((x) => x.platform === key);
  const psn = of("psn"), steam = of("steam"), sw = of("switch");
  // the gallery carries on with whatever didn't fit on the console unit
  const chunks = (list) => {
    const left = showcaseFirst(list).rest.slice(MAIN_HOLDS - 4), out = [];
    for (let i = 0; i < left.length; i += GALLERY_HOLDS) out.push(left.slice(i, i + GALLERY_HOLDS));
    return out;
  };
  // PlayStation's overflow lines the hallway wall on its side, Steam's the other; the Switch
  // (added by hand, usually a short list) stands at the far end
  const wallA = chunks(psn), wallB = chunks(steam);
  const X0 = RW / 2;                                           // the room's right wall
  const L = Math.max(4, 0.15 + Math.max(wallA.length, wallB.length) * UNIT + 0.1);
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
  const wallMat = (w, h) => tiled(textures.wall, w / 2, h / 2);
  plane(L, W, tiled(textures.floor, L / 2, W / 2, { roughness: 0.75 }), X0 + L / 2, 0, zc, -Math.PI / 2, 0);
  plane(L, W, tiled(textures.ceil, L / 2, W / 2), X0 + L / 2, HALL.h, zc, Math.PI / 2, 0);
  plane(L, HALL.h, wallMat(L, HALL.h), X0 + L / 2, HALL.h / 2, HALL.z1, 0, Math.PI);
  plane(L, HALL.h, wallMat(L, HALL.h), X0 + L / 2, HALL.h / 2, HALL.z0, 0, 0);
  plane(W, HALL.h, wallMat(W, HALL.h), X0 + L, HALL.h / 2, zc, 0, -Math.PI / 2);
  plane(SHELF.d, HALL.h, wallMat(SHELF.d, HALL.h), X0 + 0.001, HALL.h / 2, HALL.z1 - SHELF.d / 2, 0, Math.PI / 2);
  plane(SHELF.d, HALL.h, wallMat(SHELF.d, HALL.h), X0 + 0.001, HALL.h / 2, HALL.z0 + SHELF.d / 2, 0, Math.PI / 2);
  const openW = HALL_OPEN.z1 - HALL_OPEN.z0;
  plane(openW, HALL.h - HALL_OPEN.h, wallMat(openW, HALL.h - HALL_OPEN.h), X0 + 0.001, (HALL.h + HALL_OPEN.h) / 2, zc, 0, Math.PI / 2);

  // a dark wooden frame round the opening, and a sign over it
  [HALL_OPEN.z0, HALL_OPEN.z1].forEach((z) => box(0.2, HALL_OPEN.h, 0.14, darkWood, X0, HALL_OPEN.h / 2, z, g));
  box(0.2, 0.18, openW + 0.14, darkWood, X0, HALL_OPEN.h + 0.09, zc, g);
  const sign = platformSign("Game gallery");
  sign.position.set(X0 - 0.05, HALL_OPEN.h + 0.55, zc);
  sign.rotation.y = right;
  g.add(sign);

  // the units along each wall, from the opening outwards, then the Switch at the far end
  wallA.forEach((list, i) => galleryUnit(g, "psn", list, X0 + 0.15 + UNIT * (i + 0.5), HALL.z1 - SHELF.d / 2, Math.PI, wood, darkWood,
    i === 0 ? "PlayStation, continued" : ""));
  wallB.forEach((list, i) => galleryUnit(g, "steam", list, X0 + 0.15 + UNIT * (i + 0.5), HALL.z0 + SHELF.d / 2, 0, wood, darkWood,
    i === 0 ? "Steam, continued" : ""));
  consoleUnit(g, "switch", sw, X0 + L - SHELF.d / 2, zc, right, wood, darkWood);

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
    walk: { x0: 3.2, x1: X0 + L - SHELF.d - 0.3, z0: HALL_OPEN.z0 + 0.3, z1: HALL_OPEN.z1 - 0.3 },
    outline: { x0: X0, x1: X0 + L, z0: HALL.z0, z1: HALL.z1 },
  });
  rooms.hobbies.onEnter = () => coverQueue.splice(0).forEach((load) => load());
}
