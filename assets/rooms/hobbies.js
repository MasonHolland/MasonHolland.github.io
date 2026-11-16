/* HOBBIES room (3 o'clock): a castle library with the bookcase and the game shelves. */
import * as THREE from "three";
import { NEAR, RD, RW, animations, archFrameGeo, basic, bookData, box, canvasTex, createRoom, cyl, esc, fitText, gameData, interactables, makeArmchair, mat, noise, rand, rooms, safeUrl, showPanel, signMesh, wrapText } from "./core.js";
import { loadInto, plankTex } from "./shared.js";

/* ================================================================== *
 * HOBBIES (3 o'clock): a castle library with a game case
 * ================================================================== */

function stoneTex() {
  return canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#2c2824"; ctx.fillRect(0, 0, w, h);
    const rows = 3, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -(rand(r + 3) * 120);
      let i = 0;
      while (x < w) {
        const bw = 150 + rand(r * 17 + i) * 110;
        const s = 62 + Math.floor(rand(r * 31 + i * 7) * 34);
        ctx.fillStyle = `rgb(${s + 14},${s + 8},${s})`;
        ctx.fillRect(x + 3, r * rh + 3, bw - 6, rh - 6);
        for (let k = 0; k < 60; k++) {
          ctx.fillStyle = `rgba(${rand(k + i) > 0.5 ? "255,255,255" : "0,0,0"},${rand(k * 3 + r + i) * 0.1})`;
          ctx.fillRect(x + rand(k + 9 + i) * bw, r * rh + rand(k + 4) * rh, 3, 2);
        }
        x += bw;
        i++;
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

const SPINES = ["#7a2e2e", "#2f4a5c", "#3d5a40", "#8a6a2f", "#4b3a5c", "#5c4033", "#2e4d4a", "#6b3b4f", "#33465e", "#7b5b2a"];

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
      if (rand(seed + r * 7 + i * 3) > 0.04) items.push({ x: x + bw / 2, y: 0.04 + r * rowH + bh / 2, z: 0.02 + (0.27 - bd) * 0.5, bw, bh, bd, c: SPINES[Math.floor(rand(seed + r * 29 + i) * SPINES.length)], tilt: rand(seed + i + r) > 0.97 ? 0.12 : 0 });
      x += bw + 0.004;
      i++;
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.8 }), items.length);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, k) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(0, 0, it.tilt);
    dummy.scale.set(it.bw, it.bh, it.bd);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
    col.set(it.c).multiplyScalar(0.55 + rand(seed + k) * 0.5);
    mesh.setColorAt(k, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  caseGroup.add(mesh);
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

export function buildHobbies() {
  const H = 5.0;
  const g = createRoom("hobbies", {
    angle: -Math.PI / 2, H, label: "Hobbies",
    wall: { tex: stoneTex(), tw: 2, th: 1.5 },
    floor: { tex: flagstoneTex(), tw: 2, th: 2, opts: { roughness: 0.75 } },
    ceil: { tex: plankTex("#2a1b12", 0.2, 64), tw: 2, th: 2 },
    front: { tex: stoneTex(), tw: 2, th: 1.5 },
    bounds: { x0: -3.3, x1: 3.3, z0: -12.26, z1: -5.26 },
    frameMat: mat(0x3a2619, { roughness: 0.7 }),
  });
  const room = rooms.hobbies;
  const stoneM = mat(0x6c665c, { roughness: 0.95 });
  const wood = mat(0x4a3020, { roughness: 0.7 });
  const darkWood = mat(0x2a1a10, { roughness: 0.8 });
  const brass = mat(0xb08a45, { metalness: 0.6, roughness: 0.4 });

  // ceiling beams
  [-6.2, -8.0, -9.8, -11.6].forEach((z) => box(RW, 0.3, 0.3, darkWood, 0, H - 0.15, z, g));
  [-2.7, 0, 2.7].forEach((x) => box(0.24, 0.24, RD, darkWood, x, H - 0.34, -(NEAR + RD / 2), g));

  // stained glass: one tall window behind, jewel-coloured lattice with a single sword
  addGlassWindow(g, 0, 0.7, -(NEAR + RD) + 0.01, 0, 2.2, 2.8, 3, stoneM);

  // bookcases: two decorative ones on the back wall, the read-books case in the middle of the left wall
  const caseBack = { w: 2.8, rows: 8, rowH: 0.5, d: 0.42 };
  [-2.6, 2.6].forEach((x, i) => {
    const c = buildCase(g, caseBack, wood, darkWood);
    c.g.position.set(x, 0, -(NEAR + RD) + caseBack.d / 2);
    decorativeBooks(c.g, caseBack, 100 + i * 50);
  });
  const caseEnd = { w: 1.5, rows: 8, rowH: 0.5, d: 0.42 };
  [-6.0, -11.9].forEach((z, i) => {
    const c = buildCase(g, caseEnd, wood, darkWood);
    c.g.position.set(-RW / 2 + caseEnd.d / 2, 0, z);
    c.g.rotation.y = Math.PI / 2;
    decorativeBooks(c.g, caseEnd, 400 + i * 50);
  });

  const readCase = { w: 4.4, rows: 5, rowH: 0.5, d: 0.42 };
  const rc = buildCase(g, readCase, wood, darkWood);
  rc.g.position.set(-RW / 2 + readCase.d / 2, 0, -8.95);
  rc.g.rotation.y = Math.PI / 2;
  const books = (bookData.books || []).slice(0, 220);
  const rowOrder = [2, 3, 1, 4, 0];
  const cursor = rowOrder.map(() => -readCase.w / 2 + 0.12);
  let rIdx = 0;
  books.forEach((b, i) => {
    const bw = 0.07 + rand(i + 1) * 0.04;
    const bh = 0.31 + rand(i + 50) * 0.13;
    const bd = 0.22 + rand(i + 99) * 0.06;
    while (rIdx < rowOrder.length && cursor[rIdx] + bw > readCase.w / 2 - 0.1) rIdx++;
    if (rIdx >= rowOrder.length) return;
    const row = rowOrder[rIdx];
    const color = SPINES[i % SPINES.length];
    const plain = mat(color);
    const spine = new THREE.MeshStandardMaterial({ map: spineTexture(b.title, color), roughness: 0.8 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [plain, plain, plain, plain, spine, plain]);
    m.position.set(cursor[rIdx] + bw / 2, 0.04 + row * readCase.rowH + bh / 2, 0.02 + (0.27 - bd) * 0.5);
    m.rotation.z = rand(i + 7) > 0.93 ? 0.12 : 0;
    rc.g.add(m);
    cursor[rIdx] += bw + 0.004;
    const stars = b.rating ? "★".repeat(b.rating) + "☆".repeat(5 - b.rating) : "";
    interactables.push({
      mesh: m, hint: "Inspect book: " + b.title, mat: spine,
      open: () => showPanel({
        title: b.title, meta: "by " + b.author,
        html: [
          stars ? `<p aria-label="Rated ${b.rating} out of 5">${stars}</p>` : "",
          b.dateRead ? `<p>Finished ${esc(b.dateRead)}</p>` : "",
          safeUrl(b.link) ? `<p><a href="${esc(safeUrl(b.link))}" target="_blank" rel="noopener">View on Goodreads</a></p>` : "",
        ].join(""),
      }),
    });
  });
  // plain books fill whatever space is left, so the case always looks full and your own books stand out in brighter colours
  const fillFrom = [];
  rowOrder.forEach((row, k) => { if (cursor[k] > -readCase.w / 2 + 0.13) fillFrom[row] = cursor[k] + 0.01; });
  decorativeBooks(rc.g, readCase, 700, fillFrom);

  const bookSign = signMesh(1.9, 0.4, (ctx, w, h) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 5; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 64px 'Literata', Georgia, serif";
    ctx.fillText(`${(bookData.books || []).length} books read`, w / 2, h / 2 + 4);
  });
  bookSign.position.set(-RW / 2 + 0.1, 3.05, -8.95);
  bookSign.rotation.y = Math.PI / 2;
  g.add(bookSign);

  // one game shelf per platform along the right wall
  buildGameShelves(g, wood, darkWood);

  // reading table, chairs, rug, globe, candle
  const rugTex = canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#5a1d22"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 10; ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = "rgba(240,217,168,0.5)"; ctx.lineWidth = 3; ctx.strokeRect(52, 52, w - 104, h - 104);
    ctx.fillStyle = "rgba(176,138,69,0.45)"; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 120, 80, 0, 0, Math.PI * 2); ctx.fill();
    noise(ctx, w, h, 0.1, 3000);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, -8.9);
  g.add(rug);

  const table = new THREE.Group();
  table.position.set(0.3, 0, -8.9);
  g.add(table);
  box(1.7, 0.07, 0.9, wood, 0, 0.78, 0, table);
  [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(([x, z]) => box(0.1, 0.75, 0.1, darkWood, x, 0.375, z, table));
  box(0.5, 0.03, 0.34, mat(0xe8dcc0), -0.2, 0.835, 0.05, table);
  box(0.02, 0.03, 0.34, mat(0x5c4033), -0.2, 0.84, 0.05, table);
  cyl(0.03, 0.03, 0.2, mat(0xf2e8d0), 0.5, 0.92, -0.2, table, 12);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), basic(0xffc866));
  flame.scale.y = 1.6;
  flame.position.set(0.5, 1.05, -0.2);
  table.add(flame);
  const globe = new THREE.Group();
  globe.position.set(0.6, 0.82, 0.2);
  table.add(globe);
  cyl(0.08, 0.1, 0.03, brass, 0, 0.015, 0, globe, 16);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), mat(0x2f5a7a, { roughness: 0.5 }));
  ball.position.y = 0.2; globe.add(ball);
  room.obstacles.push({ x0: -0.6, x1: 1.2, z0: -9.4, z1: -8.4 });

  [[0.3, -7.6, Math.PI], [0.3, -10.2, 0]].forEach(([x, z, r]) => {
    const a = makeArmchair(0x6b2d2d);
    a.position.set(x, 0, z);
    a.rotation.y = r;
    g.add(a);
    room.obstacles.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 });
  });
  // the armchairs face the table, which is at z=-8.9
  // chandelier
  const chand = new THREE.Group();
  chand.position.set(0, 3.9, -8.9);
  g.add(chand);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 40), mat(0x1a1612, { metalness: 0.6, roughness: 0.5 }));
  ring.rotation.x = Math.PI / 2;
  chand.add(ring);
  const flames = [];
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

  // wall sconces beside the back window
  [-1.5, 1.5].forEach((x) => {
    cyl(0.03, 0.03, 0.22, mat(0xf2e8d0), x, 2.2, -(NEAR + RD) + 0.25, g, 10);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), basic(0xffc866));
    f.scale.y = 1.6; f.position.set(x, 2.38, -(NEAR + RD) + 0.25); g.add(f);
    flames.push(f);
  });
  animations.push((t) => flames.forEach((f, i) => { f.scale.y = 1.5 + Math.sin(t * 9 + i * 2.1) * 0.25; }));

  // lights: candlelight from the chandelier, coloured light through the glass
  const candle = new THREE.PointLight(0xffb36b, 36, 12, 2);
  candle.position.set(0, 3.6, -8.9);
  g.add(candle);
  animations.push((t) => { candle.intensity = 36 + Math.sin(t * 7) * 1.4 + Math.sin(t * 13.3) * 0.8; });
  const blue = new THREE.PointLight(0x5b7bff, 16, 8, 2);
  blue.position.set(0, 2.4, -12.2);
  g.add(blue);
  // soft warm light on the game shelves
  const shelfLight = new THREE.PointLight(0xffc48a, 9, 6.5, 2);
  shelfLight.position.set(2.4, 1.7, -8.95);
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

function buildPlatformShelf(g, key, z, wood, darkWood) {
  const P = platformOf(key);
  const games = (gameData.games || []).filter((x) => x.platform === key).slice(0, 36);
  const shelf = new THREE.Group();
  shelf.position.set(RW / 2 - SHELF.d / 2, 0, z);
  shelf.rotation.y = -Math.PI / 2;           // faces into the room
  g.add(shelf);
  const { h } = buildCase(shelf, SHELF, wood, darkWood);
  const topOf = (row) => 0.04 + row * SHELF.rowH;

  const addGame = (game, x, row, big) => {
    const gw = big ? 0.26 : 0.2, gh = big ? 0.37 : 0.29;
    const faces = mat(P.color);
    const tex = gameCoverTexture(game);
    const front = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.6 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 0.03), [faces, faces, faces, faces, front, faces]);
    const tilt = big ? -0.2 : -0.1;
    m.position.set(x, topOf(row) + (gh / 2) * Math.cos(tilt) + 0.01, -SHELF.d / 2 + 0.2 + (big ? 0.03 : 0));
    m.rotation.x = tilt;
    shelf.add(m);
    loadInto(front, game.cover, gw / gh);
    interactables.push({
      mesh: m, hint: "Inspect game: " + game.title, mat: front, base: 0.25,
      open: () => showPanel({
        title: game.title,
        meta: P.label,
        html: [
          game.hours ? `<p>${esc(Math.round(game.hours))} hours played in total</p>` : "",
          game.recentHours ? `<p>${esc(game.recentHours)} hours in the last two weeks</p>` : "",
          game.lastPlayed ? `<p>Last played ${esc(game.lastPlayed)}</p>` : "",
          game.trophies ? `<p>Trophies: ${esc(game.trophies.earned)} of ${esc(game.trophies.total)}</p>` : "",
          game.note ? `<p>${esc(game.note)}</p>` : "",
        ].join(""),
      }),
    });
  };

  // the console sits in the middle of the third shelf, with two games on show either side
  const consoleRow = 2;
  const showcase = [0.5, -0.5, 0.78, -0.78];
  games.slice(0, 4).forEach((game, i) => addGame(game, showcase[i], consoleRow, true));
  const rest = games.slice(4);
  [3, 1, 4, 0].forEach((row, r) => {
    rest.slice(r * 8, r * 8 + 8).forEach((game, i) => addGame(game, -0.91 + i * 0.26, row, false));
  });

  const con = CONSOLES[key]();
  con.position.set(0, topOf(consoleRow) + 0.005, -0.02);
  shelf.add(con);
  const total = games.reduce((n, x) => n + (x.hours || 0), 0);
  const earned = games.reduce((n, x) => n + (x.trophies ? x.trophies.earned : 0), 0);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, topOf(consoleRow) + 0.22, 0);
  shelf.add(hit);
  interactables.push({
    mesh: hit, hint: "Look at the " + P.label + " shelf",
    open: () => showPanel({
      title: P.label,
      meta: games.length + (games.length === 1 ? " game on this shelf" : " games on this shelf"),
      html: [
        total ? `<p>${esc(Math.round(total))} hours across these games</p>` : "",
        earned ? `<p>${esc(earned)} trophies earned</p>` : "",
        key === "switch" ? "<p>The Switch has no public game history, so these are added by hand in data/games.json.</p>" : "",
        games[0] ? `<p>Most recent: ${esc(games[0].title)}</p>` : "<p>No games here yet.</p>",
      ].join(""),
    }),
  });

  const sign = signMesh(1.7, 0.36, (ctx, w, hh) => {
    ctx.fillStyle = "#2a1b12"; ctx.fillRect(0, 0, w, hh);
    ctx.strokeStyle = "#b08a45"; ctx.lineWidth = 5; ctx.strokeRect(8, 8, w - 16, hh - 16);
    ctx.fillStyle = "#f0d9a8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 500 56px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, `${P.label} · ${games.length}`, w - 60), w / 2, hh / 2 + 4);
  });
  sign.position.set(0, h + 0.38, 0.2);
  shelf.add(sign);
}

function buildGameShelves(g, wood, darkWood) {
  buildPlatformShelf(g, "psn", -6.5, wood, darkWood);
  buildPlatformShelf(g, "switch", -8.95, wood, darkWood);
  buildPlatformShelf(g, "steam", -11.4, wood, darkWood);
  rooms.hobbies.obstacles.push({ x0: 3.1, x1: 3.8, z0: -12.3, z1: -5.3 });
}
