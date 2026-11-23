/* WORK room (12 o'clock): a bright, minimal home office. */
import * as THREE from "three";
import { DOOR_ANGLES, NEAR, RD, RW, animations, basic, box, canvasTex, careerBeforeTech, createRoom, loadProjects, cyl, esc, fitText, frontBox, hintEl, interactables, makePlant, mat, noise, profile, projectsHtml, rand, resumeHtml, rooms, safeUrl, showPanel, wrapText } from "./core.js";
import { plasterTex } from "./shared.js";
import { perthSkylineTexture } from "./about.js";
import { BRAND, OUTLINE } from "./skill-icons.js";

/* ================================================================== *
 * WORK (12 o'clock): white walls, pale carpet, one black desk, a modular
 * steel-framed shelving wall, a high strip window and a garden view
 * ================================================================== */

/* ---------- textures ---------- */

function resumeScreenTexture() {
  const exp = profile.experience || [];
  return canvasTex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = "#f7f8fa"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1d2b38"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = "800 46px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText(fitText(ctx, profile.name || "", w - 70), 36, 74);
    ctx.font = "500 24px 'Literata', Georgia, serif"; ctx.fillStyle = "#4d5d6b";
    ctx.fillText(fitText(ctx, profile.headline || "", w - 70), 36, 112);
    ctx.fillStyle = "#2f6f8f"; ctx.fillRect(36, 130, 90, 4);
    ctx.fillStyle = "#1d2b38"; ctx.font = "600 25px 'Bricolage Grotesque', Arial, sans-serif";
    exp.slice(0, 3).forEach((x, i) => ctx.fillText(fitText(ctx, `${x.role}, ${x.org}`, w - 70), 36, 182 + i * 42));
    ctx.fillStyle = "#4d5d6b"; ctx.font = "500 22px 'Literata', Georgia, serif";
    ctx.fillText("Click to read the resume", 36, h - 28);
  });
}

/** Soft, pale wool carpet. */
function carpetTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c8c2ba"; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 0.09, 9000);
  });
}

/** A sunny sky with drifting cumulus, for the long strip of high windows. */
function skyTexture(w, h) {
  return canvasTex(w, h, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#3f8fdc"); sky.addColorStop(1, "#9fcdf2");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // sun glow towards the left
    const sun = ctx.createRadialGradient(w * 0.18, h * 0.2, 4, w * 0.18, h * 0.2, h * 1.4);
    sun.addColorStop(0, "rgba(255,252,230,0.9)"); sun.addColorStop(1, "rgba(255,252,230,0)");
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
    // clouds: clusters of soft puffs, flatter underneath
    for (let c = 0; c < 16; c++) {
      const cx = rand(c * 7 + 1) * w, cy = h * (0.35 + rand(c * 3 + 2) * 0.45), sz = (0.6 + rand(c + 5) * 0.8) * h * 0.22;
      for (let k = 0; k < 7; k++) {
        const px = cx + (k - 3) * sz * 0.7 + (rand(c * 11 + k) - 0.5) * sz * 0.5, py = cy - Math.sin((k / 6) * Math.PI) * sz * 0.6;
        const r = sz * (0.55 + rand(c * 13 + k) * 0.45);
        const gr = ctx.createRadialGradient(px, py - r * 0.3, r * 0.1, px, py, r);
        gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.75, "rgba(246,249,253,0.85)"); gr.addColorStop(1, "rgba(235,242,250,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
}

/** The second monitor: a list of projects. paint(titles) redraws it once they've loaded. */
function projectsScreenTexture() {
  const tex = canvasTex(640, 380, (ctx, w, h) => drawProjectsScreen(ctx, w, h, null));
  tex.paint = (titles) => { drawProjectsScreen(tex.image.getContext("2d"), 640, 380, titles); tex.needsUpdate = true; };
  return tex;
}
function drawProjectsScreen(ctx, w, h, projects) {
  {
    ctx.fillStyle = "#1e2530"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2b3442"; ctx.fillRect(0, 0, w, 44);
    ["#e9605a", "#f2be4c", "#5fc46a"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(24 + i * 22, 22, 7, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#e8edf3"; ctx.font = "800 34px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Projects", 30, 100);
    ctx.font = "500 22px 'Bricolage Grotesque', Arial, sans-serif";
    const list = projects === null ? [] : projects.length ? projects.slice(0, 5) : ["Project list coming soon"];
    list.forEach((t, i) => {
      ctx.fillStyle = ["#7fc4ff", "#ffd27a", "#9be59b", "#e0a8ff", "#ff9f8f"][i % 5]; ctx.fillRect(30, 130 + i * 44, 8, 26);
      ctx.fillStyle = "#cfd8e3"; ctx.fillText(fitText(ctx, t, w - 90), 52, 151 + i * 44);
    });
    ctx.fillStyle = "#8a96a6"; ctx.font = "500 20px 'Literata', Georgia, serif";
    ctx.fillText("Click to open the project list", 30, h - 24);
  }
}

/* ---------- props ---------- */

const chrome = () => mat(0xc9ccd0, { metalness: 0.85, roughness: 0.25 });

/** A window in a thin black aluminium frame, set into the wall (in the window's own frame, facing +z). */
function blackWindow(parent, w, h, viewTex, mullions = 1) {
  const g = new THREE.Group();
  parent.add(g);
  const frame = mat(0x1b1d20, { roughness: 0.5 });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: viewTex }));
  view.position.z = 0.004;
  g.add(view);
  const t = 0.05;
  box(w + t * 2, t, 0.06, frame, 0, h / 2 + t / 2, 0.03, g);
  box(w + t * 2, t, 0.06, frame, 0, -h / 2 - t / 2, 0.03, g);
  [-1, 1].forEach((s) => box(t, h, 0.06, frame, s * (w / 2 + t / 2), 0, 0.03, g));
  for (let i = 1; i <= mullions; i++) box(0.035, h, 0.05, frame, -w / 2 + (w * i) / (mullions + 1), 0, 0.03, g);
  // a white plaster reveal round it
  const white = mat(0xf4f3f0, { roughness: 0.7 });
  box(w + 0.24, 0.04, 0.12, white, 0, -h / 2 - t - 0.02, 0.06, g);
  return g;
}

/** Minimal black desk on slim chrome legs, long side along x. */
function blackDesk(parent, w, d) {
  const g = new THREE.Group();
  parent.add(g);
  box(w, 0.035, d, mat(0x17181a, { roughness: 0.35 }), 0, 0.735, 0, g);
  const leg = chrome();
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => box(0.03, 0.72, 0.03, leg, sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06), g));
    box(0.03, 0.03, d - 0.12, leg, sx * (w / 2 - 0.06), 0.7, 0, g);
  });
  box(w - 0.12, 0.03, 0.03, leg, 0, 0.7, -d / 2 + 0.06, g);
  return g;
}

/** Open laptop showing the resume. */
function laptop(parent, x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0.753, z);
  g.rotation.y = rotY;
  parent.add(g);
  const alu = mat(0xb8bcc2, { metalness: 0.6, roughness: 0.35 });
  box(0.34, 0.012, 0.23, alu, 0, 0.006, 0, g);
  box(0.28, 0.002, 0.1, mat(0x2a2c30), 0, 0.013, -0.03, g);
  const lid = new THREE.Group();
  lid.position.set(0, 0.012, -0.115);
  lid.rotation.x = -0.25;
  g.add(lid);
  box(0.34, 0.22, 0.008, alu, 0, 0.11, -0.004, lid);
  const tex = resumeScreenTexture();
  const sm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.8 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.194), sm);
  screen.position.set(0, 0.11, 0.001);
  lid.add(screen);
  interactables.push({
    mesh: screen, hint: "Read the resume", mat: sm, base: 0.8,
    open: () => showPanel({ title: profile.name + "'s resume", meta: profile.headline || "", html: resumeHtml() }),
  });
}

/** A slim-bezel monitor on a flat foot, screen facing local +z, standing on the desk top at (x, z). */
function monitor(parent, x, z, rotY, tex, hint, open) {
  const g = new THREE.Group();
  g.position.set(x, 0.753, z);
  g.rotation.y = rotY;
  parent.add(g);
  const black = mat(0x16171a, { roughness: 0.45 }), alu = mat(0xb8bcc2, { metalness: 0.6, roughness: 0.35 });
  box(0.24, 0.012, 0.17, alu, 0, 0.006, -0.03, g);              // foot
  box(0.05, 0.36, 0.025, alu, 0, 0.19, -0.08, g);               // neck
  const W = 0.62, H = 0.37, y = 0.46;
  box(W + 0.02, H + 0.02, 0.025, black, 0, y, -0.055, g);
  const sm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), sm);
  screen.position.set(0, y, -0.042);
  g.add(screen);
  interactables.push({ mesh: screen, hint, mat: sm, base: 0.85, open });
  return g;
}

/** A wireless mouse on a felt pad. */
function mouseOnPad(parent, x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0.753, z);
  g.rotation.y = rotY;
  parent.add(g);
  box(0.24, 0.004, 0.2, mat(0x3a3d42, { roughness: 1 }), 0, 0.002, 0, g);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), mat(0x1c1d20, { roughness: 0.35 }));
  m.scale.set(1, 0.55, 1.75);
  m.position.set(0.02, 0.016, 0);
  g.add(m);
}

/** Slim black LED desk lamp: a square foot, a tall upright and a long flat head. */
function deskLamp(parent, x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0.753, z);
  g.rotation.y = rotY;
  parent.add(g);
  const black = mat(0x141516, { roughness: 0.4 });
  box(0.18, 0.012, 0.18, black, 0, 0.006, 0, g);
  box(0.02, 0.62, 0.02, black, 0, 0.32, 0, g);
  box(0.04, 0.02, 0.42, black, 0, 0.63, 0.2, g);
  box(0.03, 0.004, 0.36, basic(0xfff4dc), 0, 0.618, 0.22, g);
  const glow = new THREE.PointLight(0xfff0d8, 0.4, 1.4, 2);
  glow.position.set(0, 0.5, 0.25);
  g.add(glow);
}

/** Black padded office chair on a chrome five-star base. */
function officeChair(parent, x, z, rotY) {
  const c = new THREE.Group();
  c.position.set(x, 0, z);
  c.rotation.y = rotY;
  parent.add(c);
  const leather = mat(0x1a1b1d, { roughness: 0.45 }), metal = chrome();
  // seat and back: a few padded ribs
  for (let i = 0; i < 4; i++) box(0.46, 0.05, 0.11, leather, 0, 0.48, -0.17 + i * 0.115, c);
  for (let i = 0; i < 5; i++) box(0.44, 0.1, 0.05, leather, 0, 0.62 + i * 0.105, 0.27 + i * 0.01, c);
  // side frames and arms
  [-1, 1].forEach((s) => {
    box(0.025, 0.025, 0.5, metal, s * 0.245, 0.47, 0.0, c);
    box(0.025, 0.6, 0.025, metal, s * 0.245, 0.77, 0.29, c);
    box(0.03, 0.025, 0.36, leather, s * 0.27, 0.68, 0.07, c);
    box(0.02, 0.2, 0.02, metal, s * 0.27, 0.57, -0.05, c);
  });
  cyl(0.025, 0.025, 0.36, metal, 0, 0.27, 0, c, 10);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.32, 0.025, 0.04, metal, Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16, c);
    leg.rotation.y = -a;
    cyl(0.02, 0.02, 0.05, mat(0x1d1d1f), Math.cos(a) * 0.31, 0.025, Math.sin(a) * 0.31, c, 8);
  }
  return c;
}

/**
 * A modular shelving wall in the steel-tube style of the photo: chrome frame, warm gold backs,
 * and a mix of open cells (books, ornaments) and doors (cream, white, graphite) with round knobs.
 * Built along x, facing +z, standing on y = 0. With fillCell(g, k, cx, cy), every cell is open and
 * filled by that instead (k counts from the top left, along each row).
 */
function modularShelving(parent, cols, rows, cw, ch, d, fillCell = null) {
  const g = new THREE.Group();
  parent.add(g);
  const W = cols * cw, foot = 0.06;
  const steel = chrome();
  const gold = mat(0xc9a25a, { roughness: 0.55 }), panel = mat(0xe4e2dc, { roughness: 0.5 });
  const doors = { C: mat(0xe2d3ad, { roughness: 0.5 }), W: mat(0xf1efe9, { roughness: 0.5 }), G: mat(0x58595d, { roughness: 0.45 }) };
  // top row first: B books, O ornament, E empty, C/W/G doors
  const layout = ["BGBEBOB", "EBCOBWE", "CWBGEBG", "BCWBGBO", "GGCBGCG"];
  const x0 = -W / 2, y0 = foot;

  // shelves (horizontal panels) and the chrome rails along their front and back edges
  for (let r = 0; r <= rows; r++) {
    const y = y0 + r * ch;
    box(W, 0.016, d, panel, 0, y, 0, g);
    [-1, 1].forEach((s) => box(W, 0.018, 0.018, steel, 0, y, s * d / 2, g));
  }
  // uprights and ball joints at each corner of the grid
  const ball = new THREE.SphereGeometry(0.017, 10, 8);
  for (let c = 0; c <= cols; c++) {
    const x = x0 + c * cw;
    [-1, 1].forEach((s) => {
      box(0.018, rows * ch, 0.018, steel, x, y0 + (rows * ch) / 2, s * d / 2, g);
      for (let r = 0; r <= rows; r++) { const b = new THREE.Mesh(ball, steel); b.position.set(x, y0 + r * ch, s * d / 2); g.add(b); }
    });
    box(0.016, rows * ch, d, panel, x, y0 + (rows * ch) / 2, 0, g);   // side panels between cells
    [-1, 1].forEach((s) => cyl(0.012, 0.012, foot, steel, x, foot / 2, s * (d / 2 - 0.02), g, 8));
  }

  if (fillCell) {
    for (let k = 0; k < cols * rows; k++) {
      const c = k % cols, r = rows - 1 - Math.floor(k / cols);
      const cx = x0 + (c + 0.5) * cw, cy = y0 + (r + 0.5) * ch;
      box(cw - 0.02, ch - 0.02, 0.01, gold, cx, cy, -d / 2 + 0.01, g);
      fillCell(g, k, cx, cy);
    }
    return g;
  }

  const books = [];
  const bookColors = ["#2f3a46", "#e9e4d8", "#8a2f2a", "#c9b48a", "#1f4e5f", "#f2efe6", "#6b6b6b", "#a8743a"];
  layout.forEach((line, k) => {
    const r = rows - 1 - k;
    [...line].forEach((code, c) => {
      const cx = x0 + (c + 0.5) * cw, cy = y0 + (r + 0.5) * ch;
      if (doors[code]) {
        box(cw - 0.03, ch - 0.03, 0.016, doors[code], cx, cy, d / 2 - 0.01, g);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), steel);
        knob.scale.z = 0.5;
        knob.position.set(cx, cy + ch * 0.28, d / 2 + 0.004);
        g.add(knob);
        return;
      }
      box(cw - 0.02, ch - 0.02, 0.01, gold, cx, cy, -d / 2 + 0.01, g);
      if (code === "B") {
        // a row of books, some lying flat in a stack at one end
        let bx = cx - cw / 2 + 0.04, i = 0;
        const stackRight = rand(r * 7 + c) > 0.5;
        const end = cx + cw / 2 - (stackRight ? 0.24 : 0.04);
        if (!stackRight) bx += 0.2;
        while (bx < end - 0.03) {
          const bw = 0.022 + rand(r * 31 + c * 7 + i) * 0.025, bh = ch * (0.62 + rand(r * 11 + c * 3 + i) * 0.25);
          books.push({ x: bx + bw / 2, y: cy - ch / 2 + 0.008 + bh / 2, z: 0, sx: bw, sy: bh, sz: d * 0.62, c: bookColors[Math.floor(rand(r * 5 + c * 13 + i) * bookColors.length)] });
          bx += bw + 0.003; i++;
        }
        const sx = stackRight ? cx + cw / 2 - 0.13 : cx - cw / 2 + 0.13;
        for (let s = 0; s < 4 + Math.floor(rand(r + c * 9) * 4); s++) {
          books.push({ x: sx, y: cy - ch / 2 + 0.008 + 0.014 + s * 0.028, z: 0, sx: 0.19, sy: 0.026, sz: d * 0.6, c: bookColors[(s * 3 + c) % bookColors.length] });
        }
      } else if (code === "O") {
        // an hourglass-like ornament and a small bowl
        const glass = new THREE.MeshStandardMaterial({ color: 0xe8d9b8, transparent: true, opacity: 0.6, roughness: 0.1 });
        cyl(0.035, 0.035, 0.012, mat(0x6a4a2a), cx - 0.12, cy - ch / 2 + 0.014, 0, g, 14);
        cyl(0.004, 0.032, 0.07, glass, cx - 0.12, cy - ch / 2 + 0.055, 0, g, 14);
        cyl(0.032, 0.004, 0.07, glass, cx - 0.12, cy - ch / 2 + 0.125, 0, g, 14);
        cyl(0.035, 0.035, 0.012, mat(0x6a4a2a), cx - 0.12, cy - ch / 2 + 0.166, 0, g, 14);
        cyl(0.07, 0.04, 0.05, mat(0x2b2d31, { roughness: 0.3 }), cx + 0.12, cy - ch / 2 + 0.033, 0, g, 18);
      }
    });
  });
  if (books.length) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.75 }), books.length);
    const dummy = new THREE.Object3D(), col = new THREE.Color();
    books.forEach((b, k) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
      mesh.setColorAt(k, col.set(b.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    g.add(mesh);
  }
  return g;
}

/** Set the biggest font (up to size) at which text fits in maxW, so nothing is ever cut off. */
function fitFont(ctx, text, weight, size, family, maxW) {
  for (let s = size; s >= 10; s--) {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxW) return;
  }
}

/**
 * A certificate for an accolade: cream paper in a double gold border, the school's seal at the top
 * when the accolade has a logo, then the kind, the title, who it's from and the year. Every line
 * shrinks to fit rather than being cut short.
 */
function certificateTexture(a) {
  const draw = (ctx, w, h, seal) => {
    ctx.fillStyle = "#fbf8ef"; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 0.025, 1500);
    ctx.strokeStyle = "#b8934a"; ctx.lineWidth = 8; ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.lineWidth = 2; ctx.strokeRect(44, 44, w - 88, h - 88);
    const serif = "'Literata', Georgia, serif", sans = "'Bricolage Grotesque', Arial, sans-serif";
    const maxW = w - 160;
    let y = seal ? 280 : 190;
    if (seal) ctx.drawImage(seal, w / 2 - 100, 66, 200, 200);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#a07c38";
    const kind = a.kind === "degree" ? "Certificate of completion" : String(a.kind || "award");
    fitFont(ctx, kind.toUpperCase(), 600, 28, sans, maxW);
    ctx.fillText(kind.toUpperCase(), w / 2, (y += 50));
    ctx.fillStyle = "#1d2b38";
    fitFont(ctx, a.title || "", 700, 70, serif, maxW);
    ctx.fillText(a.title || "", w / 2, (y += 100));
    ctx.fillStyle = "#4a5a68";
    fitFont(ctx, a.from || "", 500, 38, serif, maxW);
    ctx.fillText(a.from || "", w / 2, (y += 72));
    ctx.fillStyle = "#b8934a"; ctx.fillRect(w / 2 - 120, (y += 40), 240, 2);
    ctx.fillStyle = "#4a5a68";
    fitFont(ctx, String(a.year || ""), 500, 32, serif, maxW);
    ctx.fillText(String(a.year || ""), w / 2, (y += 64));
  };
  const tex = canvasTex(1024, 768, (ctx, w, h) => draw(ctx, w, h, null));
  if (a.logo) {
    const img = new Image();
    img.onload = () => { draw(tex.image.getContext("2d"), 1024, 768, img); tex.needsUpdate = true; };
    img.src = a.logo;
  }
  return tex;
}

/**
 * The resume, framed on the wall: a picture of the PDF (assets/work/resume.jpg, made with the
 * contact line removed, so no email or phone number) in a thin black frame with a white mat.
 * Clicking it opens the resume.
 */
function framedResume(g, x, y, z) {
  const f = new THREE.Group();
  f.position.set(x, y, z);
  g.add(f);
  const pw = 0.74, ph = pw * (1584 / 1224);
  box(pw + 0.16, ph + 0.16, 0.03, mat(0x1b1d20, { roughness: 0.5 }), 0, 0, 0, f);
  box(pw + 0.11, ph + 0.11, 0.032, mat(0xffffff, { roughness: 0.7 }), 0, 0, 0.001, f);
  const tex = new THREE.TextureLoader().load("assets/work/resume.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const pm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.2, roughness: 0.8 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pm);
  pic.position.z = 0.018;
  f.add(pic);
  interactables.push({
    mesh: pic, hint: "Read the resume", mat: pm, base: 0.2,
    open: () => showPanel({ title: profile.name + "'s resume", meta: profile.headline || "", html: resumeHtml() }),
  });
}

/* ---------- the project board and the big screen ---------- */

const NOTE_COLOURS = ["#ffe27a", "#a8d8f0", "#c8e6a8", "#ffb3a7", "#d9c4f0", "#ffd0a0", "#b8e0d8", "#f5c6dd"];
const sans = "'Bricolage Grotesque', Arial, sans-serif", serifFont = "'Literata', Georgia, serif";

/** A project's screenshots (paths), skipping blanks. */
const screenshotsOf = (p) => (p.screenshots || []).filter(Boolean);

/** Load an image once; later calls get the same promise. */
const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = reject; img.src = src; }));
  }
  return imageCache.get(src);
}

/** If the hint is showing (you're pointing at the thing that changed), update its text. */
function refreshHint(item) {
  if (hintEl.classList.contains("on")) hintEl.textContent = item.hint + "  (click or E)";
}

/**
 * The big screen on the left wall, with three buttons on the wall under it. Picking a project on
 * the board puts its blurb on the screen (p.blurb, or its summary). The buttons then open the live
 * site (p.url) in a new tab, step through its screenshots (p.screenshots) on the screen, or play its
 * demo video (p.video, an mp4, muted and looping). Buttons a project has nothing for are greyed out.
 * Until a project is picked, the screen says the board is connected. Clicking the screen opens the
 * project's details. Returns show(project).
 */
function bigScreen(g, x, y, z, rotY, W, H) {
  const tv = new THREE.Group();
  tv.position.set(x, y, z);
  tv.rotation.y = rotY;
  g.add(tv);
  box(W + 0.05, H + 0.05, 0.05, mat(0x0d0e10, { roughness: 0.35 }), 0, 0, 0.025, tv);
  const SW = 1600, SH = Math.round((1600 * H) / W);
  const canvas = document.createElement("canvas");
  canvas.width = SW; canvas.height = SH;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sm = new THREE.MeshBasicMaterial({ map: tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), sm);
  screen.position.z = 0.052;
  tv.add(screen);

  let projects = null;   // until the Work room's door opens (see buildWork)
  let current = null, mode = "idle", shot = 0, video = null, token = 0;

  const backdrop = () => {
    const bg = ctx.createLinearGradient(0, 0, SW, SH);
    bg.addColorStop(0, "#14202c"); bg.addColorStop(1, "#1f3346");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SW, SH);
  };
  const done = () => { tex.needsUpdate = true; };

  const idle = () => {
    backdrop();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#5fc46a"; ctx.beginPath(); ctx.arc(SW / 2 - 190, SH * 0.34 - 12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#9fe3a8"; ctx.font = `600 38px ${sans}`; ctx.textAlign = "left";
    ctx.fillText("Project board connected", SW / 2 - 160, SH * 0.34);
    ctx.textAlign = "center"; ctx.fillStyle = "#f2f5f8";
    const head = projects === null || projects.length ? "Click a project to see it in action" : "Projects coming soon";
    fitFont(ctx, head, 800, 84, sans, SW - 200);
    ctx.fillText(head, SW / 2, SH * 0.52);
    ctx.fillStyle = "#9fb0c2"; ctx.font = `500 38px ${serifFont}`;
    ctx.fillText(projects === null || projects.length ? "← pick one on the project board by the door" : "When they're up, click one on the board to see it in action", SW / 2, SH * 0.64);
    done();
  };

  // what the project does, with its first screenshot beside it when it has one
  const blurb = (p, img) => {
    backdrop();
    const pad = 110, textX = img ? SW * 0.5 + 40 : pad, textW = img ? SW - textX - pad : SW - pad * 2;
    if (img) {
      const bw = SW * 0.5 - pad - 20, bh = SH - pad * 2, s = Math.min(bw / img.width, bh / img.height), iw = img.width * s, ih = img.height * s;
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(pad - 10, (SH - ih) / 2 - 10, bw + 20, ih + 20);
      ctx.drawImage(img, pad + (bw - iw) / 2, (SH - ih) / 2, iw, ih);
    }
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#7fc4ff"; ctx.font = `600 32px ${sans}`;
    ctx.fillText((p.soon ? "Coming soon" : "What it does" + (p.year ? " · " + p.year : "")).toUpperCase(), textX, 190);
    ctx.fillStyle = "#f2f5f8"; ctx.font = `800 74px ${sans}`;
    const ty = wrapText(ctx, p.title || "", textX, 280, textW, 80, 2);
    ctx.fillStyle = "#d3dde7"; ctx.font = `500 38px ${serifFont}`;
    const by = wrapText(ctx, p.blurb || p.summary || "", textX, ty + 40, textW, 54, 7);
    // tags as little chips
    let cx = textX, cy = Math.min(by + 40, SH - 170);
    ctx.font = `600 28px ${sans}`;
    (p.tags || []).slice(0, 6).forEach((t) => {
      const tw = ctx.measureText(t).width + 36;
      if (cx + tw > textX + textW) return;
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(cx, cy - 34, tw, 48, 24); ctx.stroke();
      ctx.fillStyle = "#c6d2de"; ctx.fillText(t, cx + 18, cy);
      cx += tw + 12;
    });
    if (!p.soon) {
      const what = [safeUrl(p.url) && "the live site", screenshotsOf(p).length && "screenshots", p.video && "a demo video"].filter(Boolean);
      const foot = what.length ? "Buttons below: " + what.join(", ") + " · click the screen for details" : "Click the screen for details";
      ctx.fillStyle = "#8a96a6"; fitFont(ctx, foot, 500, 30, serifFont, textW);
      ctx.fillText(foot, textX, SH - 80);
    }
    done();
  };

  // one screenshot, as big as fits, with a caption bar
  const screenshot = (p, img, i, n) => {
    ctx.fillStyle = "#0b1118"; ctx.fillRect(0, 0, SW, SH);
    const barH = 80, s = Math.min(SW / img.width, (SH - barH) / img.height), iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, (SW - iw) / 2, (SH - barH - ih) / 2, iw, ih);
    ctx.fillStyle = "rgba(20,32,44,0.95)"; ctx.fillRect(0, SH - barH, SW, barH);
    ctx.fillStyle = "#f2f5f8"; ctx.font = `700 34px ${sans}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const cap = p.title + (p.captions && p.captions[i] ? ": " + p.captions[i] : "");
    fitFont(ctx, cap, 700, 34, sans, SW * 0.55);
    ctx.fillText(cap, 40, SH - barH / 2);
    ctx.fillStyle = "#9fb0c2"; ctx.textAlign = "right"; ctx.font = `500 30px ${serifFont}`;
    ctx.fillText(`Screenshot ${i + 1} of ${n}` + (n > 1 ? " · press Screenshots again for the next" : ""), SW - 40, SH - barH / 2);
    ctx.textBaseline = "alphabetic";
    done();
  };

  const message = (title, line) => {
    backdrop();
    ctx.textAlign = "center"; ctx.fillStyle = "#f2f5f8"; ctx.font = `800 64px ${sans}`;
    ctx.fillText(title, SW / 2, SH * 0.48);
    ctx.fillStyle = "#9fb0c2"; ctx.font = `500 36px ${serifFont}`;
    ctx.fillText(line, SW / 2, SH * 0.6);
    done();
  };

  const stopVideo = () => {
    if (!video) return;
    video.pause(); video.removeAttribute("src"); video.load(); video = null;
  };

  // while a video plays, draw each frame onto the screen as big as fits, with bars either side (demo
  // videos are often phone-shaped), and a caption bar like the screenshots have
  let lastFrame = -1;
  animations.push(() => {
    if (mode !== "video" || !video || video.readyState < 2 || video.currentTime === lastFrame) return;
    lastFrame = video.currentTime;
    const barH = 80, vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const s = Math.min(SW / vw, (SH - barH) / vh), iw = vw * s, ih = vh * s;
    ctx.fillStyle = "#0b1118"; ctx.fillRect(0, 0, SW, SH - barH);
    ctx.drawImage(video, (SW - iw) / 2, (SH - barH - ih) / 2, iw, ih);
    if (!videoCaption) {
      videoCaption = true;
      ctx.fillStyle = "rgba(20,32,44,0.95)"; ctx.fillRect(0, SH - barH, SW, barH);
      ctx.fillStyle = "#f2f5f8"; ctx.font = `700 34px ${sans}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(current.title + ": demo", 40, SH - barH / 2);
      ctx.fillStyle = "#9fb0c2"; ctx.textAlign = "right"; ctx.font = `500 30px ${serifFont}`;
      ctx.fillText("Press Demo video again to stop", SW - 40, SH - barH / 2);
      ctx.textBaseline = "alphabetic";
    }
    done();
  });
  let videoCaption = false;

  /* -- the buttons under the screen -- */
  const BW = 0.68, BH = 0.17;
  const icon = (c, kind, x, y, s, colour) => {
    c.save(); c.translate(x, y); c.strokeStyle = colour; c.fillStyle = colour; c.lineWidth = s * 0.12; c.lineCap = "round"; c.lineJoin = "round";
    if (kind === "live") {   // an arrow out of a box
      c.beginPath(); c.moveTo(-s * 0.1, -s * 0.45); c.lineTo(-s * 0.45, -s * 0.45); c.lineTo(-s * 0.45, s * 0.45); c.lineTo(s * 0.45, s * 0.45); c.lineTo(s * 0.45, s * 0.1); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.05, s * 0.05); c.lineTo(s * 0.5, -s * 0.5); c.moveTo(s * 0.1, -s * 0.5); c.lineTo(s * 0.5, -s * 0.5); c.lineTo(s * 0.5, -s * 0.1); c.stroke();
    } else if (kind === "shots") {   // a picture: frame, sun and hills
      c.strokeRect(-s * 0.5, -s * 0.4, s, s * 0.8);
      c.beginPath(); c.arc(s * 0.18, -s * 0.12, s * 0.1, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-s * 0.45, s * 0.35); c.lineTo(-s * 0.12, -s * 0.02); c.lineTo(s * 0.12, s * 0.2); c.lineTo(s * 0.25, s * 0.08); c.lineTo(s * 0.45, s * 0.35); c.stroke();
    } else {   // play
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.45); c.lineTo(s * 0.45, 0); c.lineTo(-s * 0.3, s * 0.45); c.closePath(); c.fill();
    }
    c.restore();
  };
  const buttons = [
    { key: "live", label: "Visit live site" },
    { key: "shots", label: "Screenshots" },
    { key: "video", label: "Demo video" },
  ].map((b, i) => {
    const bc = document.createElement("canvas");
    bc.width = 512; bc.height = Math.round((512 * BH) / BW);
    const btex = new THREE.CanvasTexture(bc);
    btex.colorSpace = THREE.SRGBColorSpace;
    const fm = new THREE.MeshStandardMaterial({ map: btex, roughness: 0.5, emissive: 0xffffff, emissiveMap: btex, emissiveIntensity: 0.2 });
    const mesh = new THREE.Mesh(frontBox(BW, BH, 0.025), [mat(0x1d2b38, { roughness: 0.5 }), fm]);
    mesh.position.set((i - 1) * (BW + 0.1), -H / 2 - 0.19, 0.0125);
    tv.add(mesh);
    const item = { ...b, mesh, mat: fm, base: 0.2, hint: "", canvas: bc, tex: btex, open: () => press(item) };
    interactables.push(item);
    return item;
  });
  const available = (key) => {
    if (!current || current.soon) return false;
    if (key === "live") return !!safeUrl(current.url);
    if (key === "shots") return screenshotsOf(current).length > 0;
    return !!current.video;
  };
  const paintButtons = () => {
    buttons.forEach((b) => {
      const c = b.canvas.getContext("2d"), w = b.canvas.width, h = b.canvas.height;
      const on = available(b.key), active = on && mode === b.key;
      c.fillStyle = active ? "#c99a3b" : on ? "#1d2b38" : "#d5d8dc"; c.fillRect(0, 0, w, h);
      const ink = active ? "#1d1a14" : on ? "#f2f5f8" : "#9aa3ad";
      icon(c, b.key, 62, h / 2, 46, ink);
      c.fillStyle = ink; c.textAlign = "left"; c.textBaseline = "middle";
      fitFont(c, b.label, 700, 46, sans, w - 130);
      c.fillText(b.label, 110, h / 2 + 2);
      b.tex.needsUpdate = true;
      b.hint = !current ? b.label + ": pick a project on the board first"
        : !on ? b.label + ": not available for " + current.title
        : b.key === "live" ? "Open " + current.title + " in a new tab"
        : b.key === "shots" ? (mode === "shots" ? "Next screenshot" : "Show screenshots on the screen")
        : mode === "video" ? "Stop the demo video" : "Play the demo video";
    });
  };

  const showShot = (p, i) => {
    const list = screenshotsOf(p), mine = token;
    loadImage(list[i]).then((img) => { if (mine === token && mode === "shots") screenshot(p, img, i, list.length); })
      .catch(() => { if (mine === token) message("Screenshot not found", list[i]); });
  };

  const showBlurb = (p) => {
    const mine = token, first = screenshotsOf(p)[0];
    blurb(p, null);
    if (first) loadImage(first).then((img) => { if (mine === token && mode === "blurb") blurb(p, img); }).catch(() => {});
  };

  function press(b) {
    if (!available(b.key)) return;
    const p = current;
    if (b.key === "live") { window.open(safeUrl(p.url), "_blank", "noopener"); return; }
    token++;
    if (b.key === "shots") {
      stopVideo();
      shot = mode === "shots" ? (shot + 1) % screenshotsOf(p).length : 0;
      mode = "shots";
      showShot(p, shot);
    } else if (mode === "video") {
      stopVideo(); mode = "blurb"; showBlurb(p);
    } else {
      stopVideo();
      mode = "video";
      message(p.title, "Loading the demo video...");
      const mine = token;
      video = document.createElement("video");
      Object.assign(video, { src: p.video, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
      videoCaption = false; lastFrame = -1;
      video.play().catch(() => { if (mine === token) message("The video couldn't play", String(p.video)); });
    }
    paintButtons();
    refreshHint(b);
  }

  const show = (p) => {
    token++;
    stopVideo();
    current = p; mode = "blurb"; shot = 0;
    showBlurb(p);
    paintButtons();
  };

  idle();
  paintButtons();
  interactables.push({
    mesh: screen, hint: "Open the project on screen",
    open: () => current && !current.soon
      ? showPanel({ title: current.title, meta: current.year || "Project", html: projectsHtml([current]) })
      : loadProjects().then((list) => showPanel({ title: "Projects", meta: list.length + " projects", html: list.length ? projectsHtml(list) : "<p>Projects are coming soon.</p>" })),
  });
  show.setProjects = (list) => { projects = list; if (mode === "idle") idle(); };
  return show;
}

/**
 * The project board: a whiteboard with a sticky note for each project (up to 8). Clicking a note
 * puts that project's blurb on the big screen. With no projects yet, four grey "Coming soon" notes
 * hold the places (they work the same way). The board is built straight away; the notes go up when
 * the returned function is handed the projects.
 */
function projectBoard(g, x, y, z, rotY, onPick) {
  const board = new THREE.Group();
  board.position.set(x, y, z);
  board.rotation.y = rotY;
  g.add(board);
  box(1.96, 1.08, 0.04, mat(0xd7d9dc, { metalness: 0.4, roughness: 0.4 }), 0, 0, 0, board);
  const bgTex = canvasTex(1024, 540, (ctx, w, h) => {
    ctx.fillStyle = "#fbfbfa"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1d2b38"; ctx.font = `800 44px ${sans}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Project board", 40, 70);
    ctx.fillStyle = "#5a6a78"; ctx.font = `500 24px ${serifFont}`; ctx.textAlign = "right";
    ctx.fillText("Click a project to show it on the screen →", w - 40, 68);
    ctx.strokeStyle = "#cfd6dc"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 92); ctx.lineTo(w - 40, 92); ctx.stroke();
  });
  const bm = new THREE.MeshStandardMaterial({ map: bgTex, roughness: 0.5, emissive: 0xffffff, emissiveMap: bgTex, emissiveIntensity: 0.12 });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 0.99), bm);
  bp.position.z = 0.021;
  board.add(bp);
  return (list) => {
  const real = list.filter((p) => p && p.title).slice(0, 8);
  const notes = real.length ? real : [1, 2, 3, 4].map(() => ({ title: "Coming soon", soon: true, summary: "A new project is on its way. Check back soon." }));
  notes.forEach((p, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const colour = p.soon ? "#e6e9ec" : NOTE_COLOURS[i % NOTE_COLOURS.length];
    const tex = canvasTex(256, 200, (ctx, w, h) => {
      ctx.fillStyle = colour; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, h - 14, w, 14);
      ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.arc(w / 2, 14, 8, 0, Math.PI * 2); ctx.fill();   // the pin
      ctx.fillStyle = p.soon ? "#7a8794" : "#1d2b38"; ctx.textAlign = "left"; ctx.font = `700 30px ${sans}`;
      const yy = wrapText(ctx, p.title || "", 16, 62, w - 32, 34, 3);
      if (p.year) { ctx.fillStyle = "#5a6a78"; ctx.font = `500 22px ${serifFont}`; ctx.fillText(String(p.year), 16, Math.min(yy + 8, h - 22)); }
    });
    const nm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.1 });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.3), nm);
    note.position.set(-0.69 + col * 0.46, 0.13 - row * 0.4, 0.025 + i * 0.0005);
    note.rotation.z = (rand(i + 3) - 0.5) * 0.08;
    board.add(note);
    interactables.push({ mesh: note, hint: p.soon ? "Coming soon" : "Show on the big screen: " + p.title, mat: nm, base: 0.1, open: () => onPick(p) });
  });
  };
}

/* ---------- the career timeline ---------- */

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
/** "Oct 2018" or "2017" to a sortable number. */
function when(s) {
  const m = String(s || "").match(/([a-z]{3})?[a-z]*\s*(\d{4})/i);
  return m ? +m[2] * 12 + (m[1] ? MONTHS[m[1].toLowerCase()] ?? 0 : 0) : 0;
}

const jobHtml = (e) => `<p>${esc(e.summary || "")}</p>${(e.highlights || []).length ? `<ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}`;
const jobItem = (e, colour) => ({
  sort: when(e.start), year: (String(e.start || "").match(/\d{4}/) || [""])[0], title: e.role, sub: e.org,
  dates: [e.start, e.end].filter(Boolean).join(" to "), colour, html: jobHtml(e),
});
const courseItem = (a) => ({
  sort: when(a.year), year: String(a.year || ""), title: a.title, sub: a.from, dates: String(a.year || ""), colour: "#b8934a",
  html: `<p>${esc(a.summary || "")}</p>`,
});

/**
 * The two stories the timeline can tell. In tech: each job (experience) and each degree or
 * certificate (accolades). Before tech: the jobs in data/career-before-tech.json, ending with the
 * course that started the move into tech (the degrees and certificates from before the first
 * tech job).
 */
function timelineStories() {
  const courses = (profile.accolades || []).filter((a) => ["degree", "certificate"].includes(a.kind));
  const inTech = [...(profile.experience || []).map((e) => jobItem(e, "#2f6f8f")), ...courses.map(courseItem)].sort((a, b) => a.sort - b.sort);
  const firstJob = Math.min(...(profile.experience || []).map((e) => when(e.start)).filter(Boolean), Infinity);
  const jobs = ((careerBeforeTech && careerBeforeTech.jobs) || []).filter((j) => j && j.role);
  const before = [
    ...jobs.map((j) => jobItem(j, "#6f8a5a")),
    ...courses.filter((a) => when(a.year) < firstJob).map(courseItem),
  ].sort((a, b) => a.sort - b.sort);
  if (!jobs.length) {
    before.unshift({ sort: 0, year: "2011", title: "Coming soon", sub: "My career before tech", dates: "2011 to 2017", colour: "#6f8a5a", html: "<p>This part of the story is on its way.</p>" });
  }
  return { inTech, before };
}

/**
 * One telling of the timeline in its own group: a heading, a line ending in an arrow, and for each
 * milestone a dot with the year above and a card below. Clicking a card opens the details. Cards
 * shrink when there are more milestones, so they never overlap.
 */
function timelineTrack(parent, items, heading, length) {
  const t = new THREE.Group();
  parent.add(t);
  const LINE_Y = 1.75, navy = mat(0x1d2b38, { roughness: 0.5 });
  const half = length / 2;
  box(length, 0.022, 0.012, navy, 0, LINE_Y, 0.006, t);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 12), navy);   // the story carries on
  head.rotation.z = -Math.PI / 2;
  head.position.set(half + 0.04, LINE_Y, 0.012);
  t.add(head);

  const headTex = canvasTex(512, 96, (ctx, w, h) => {
    ctx.fillStyle = "#1d2b38"; fitFont(ctx, heading, 800, 52, sans, w - 8); ctx.textBaseline = "middle";
    ctx.fillText(heading, 4, h / 2);
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.2625), new THREE.MeshBasicMaterial({ map: headTex, transparent: true }));
  title.position.set(-half + 0.7, 2.3, 0.004);
  t.add(title);

  const n = items.length;
  const step = n > 1 ? (length - 1.1) / (n - 1) : 0;
  const CW = Math.min(1.0, n > 1 ? step * 0.92 : 1.0), CH = CW * 0.586;
  items.forEach((it, i) => {
    const px = n > 1 ? -half + 0.55 + i * step : 0;
    const dot = cyl(0.065, 0.065, 0.02, mat(it.colour, { roughness: 0.4 }), px, LINE_Y, 0.014, t, 24);
    dot.rotation.x = Math.PI / 2;
    const yTex = canvasTex(256, 96, (ctx, w, h) => {
      ctx.fillStyle = it.colour; ctx.font = `800 64px ${sans}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(it.year, w / 2, h / 2);
    });
    const yr = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.2), new THREE.MeshBasicMaterial({ map: yTex, transparent: true }));
    yr.position.set(px, LINE_Y + 0.2, 0.004);
    t.add(yr);
    box(0.01, 0.12, 0.008, navy, px, LINE_Y - 0.11, 0.005, t);   // a stem down to the card
    const cTex = canvasTex(512, 300, (ctx, w, h) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = it.colour; ctx.fillRect(0, 0, w, 10);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#1d2b38";
      ctx.font = `800 40px ${sans}`;
      const y1 = wrapText(ctx, it.title, 28, 70, w - 56, 44, 2);
      ctx.fillStyle = "#4a5a68"; fitFont(ctx, it.sub || "", 500, 28, serifFont, w - 56);
      ctx.fillText(it.sub || "", 28, y1 + 22);
      ctx.fillStyle = "#7a8794"; fitFont(ctx, it.dates, 500, 24, serifFont, w - 56);
      ctx.fillText(it.dates, 28, h - 30);
    });
    const cm = new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.7, emissive: 0xffffff, emissiveMap: cTex, emissiveIntensity: 0.15 });
    const cardMesh = new THREE.Mesh(frontBox(CW, CH, 0.02), [mat(0xf4f3f0), cm]);
    cardMesh.position.set(px, LINE_Y - 0.17 - CH / 2, 0.012);
    t.add(cardMesh);
    interactables.push({ mesh: cardMesh, hint: "Read about: " + it.title, mat: cm, base: 0.15, open: () => showPanel({ title: it.title, meta: [it.sub, it.dates].filter(Boolean).join(" · "), html: it.html }) });
  });
  return t;
}

/**
 * The career timeline on a wall, with a switch at its top right between "In tech" (the default)
 * and "Before tech" (2011 to 2017, from data/career-before-tech.json). Both are built up front and
 * the switch shows one at a time.
 */
function careerTimeline(g, x, z, rotY, length) {
  const { inTech, before } = timelineStories();
  if (!inTech.length && !before.length) return;
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotY;
  g.add(root);
  const tracks = [timelineTrack(root, inTech, "My path so far", length), timelineTrack(root, before, "My career before tech", length)];
  let showing = 0;

  const SW = 1.0, SH = 0.16;
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 82;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const labels = ["In tech", "Before tech"];
  const paint = () => {
    const w = 512, h = 82, r = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#e4e7ea"; ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.fill();
    ctx.fillStyle = "#1d2b38"; ctx.beginPath(); ctx.roundRect(showing * (w / 2) + 5, 5, w / 2 - 10, h - 10, r - 5); ctx.fill();
    ctx.font = `700 32px ${sans}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    labels.forEach((l, i) => { ctx.fillStyle = i === showing ? "#ffffff" : "#4a5a68"; ctx.fillText(l, w / 4 + i * (w / 2), h / 2 + 2); });
    tex.needsUpdate = true;
  };
  const sm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 });
  const toggle = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), sm);
  toggle.position.set(length / 2 - SW / 2, 2.3, 0.006);
  root.add(toggle);
  const item = {
    mesh: toggle, hint: "", mat: sm, base: 0.15,
    open: () => { showing = 1 - showing; show(); },
  };
  const show = () => {
    tracks.forEach((t, i) => { t.visible = i === showing; });
    item.hint = "Show " + (showing ? "my career in tech" : "my career before tech");
    if (hintEl.classList.contains("on")) hintEl.textContent = item.hint + "  (click or E)";   // you're pointing at it
    paint();
  };
  show();
  interactables.push(item);
}

/* ---------- skills, one to a cubby ---------- */

/** Everything in profile.skills, one entry per cubby: areas of expertise, then each technical group. */
function skillList() {
  const s = profile.skills || {};
  return [
    ...(s.expertise || []).map((name) => ({ name, group: "Expertise", terms: [name] })),
    ...(s.technical || []).map((t) => ({ name: t.label, group: "Technical", items: t.items, terms: String(t.items || "").split(/,\s*/) })),
  ];
}

/** Lines from the resume that mention any of the skill's terms. */
function whereUsed(skill) {
  const lines = [...(profile.experience || []).flatMap((e) => (e.highlights || []).map((h) => ({ h, at: e.role }))), ...(profile.accomplishments || []).map((h) => ({ h, at: "" }))];
  const terms = skill.terms.map((t) => t.toLowerCase().replace(/-/g, " ")).filter((t) => t.length > 2);
  return lines.filter(({ h }) => { const l = String(h).toLowerCase().replace(/-/g, " "); return terms.some((t) => l.includes(t)); });
}

const TILE_STYLES = [
  { bg: "#1d2b38", ink: "#f2f5f8", sub: "#9fb0c2" }, { bg: "#e2d3ad", ink: "#2b2b2b", sub: "#6b5a3a" },
  { bg: "#f1efe9", ink: "#1d2b38", sub: "#6a7784" }, { bg: "#58595d", ink: "#f4f3f0", sub: "#c9ccd0" },
];

/**
 * Which icons a skill gets: the official logo of each tool it names (JavaScript, React, Docker...),
 * or failing that an outline icon in the spirit of a general skill. Skills with neither stay text.
 */
const BRAND_TERMS = {
  javascript: "javascript", typescript: "typescript", postgresql: "postgresql", git: "git", github: "github",
  react: "react", vue: "vue", s3: "s3", cloudfront: "aws", circleci: "circleci", jenkins: "jenkins", docker: "docker",
};
const OUTLINE_FOR = {
  "technical leadership": "compass", "full-stack development": "layers", accessibility: "accessibility",
  collaboration: "users", communication: "messages", "problem-solving": "puzzle", "customer engagement": "handshake",
  databases: "database",
};
function skillIcons(skill) {
  const brands = [...new Set(skill.terms.map((t) => BRAND_TERMS[t.toLowerCase().trim()]).filter((k) => k && BRAND[k]))];
  const name = OUTLINE_FOR[skill.name.toLowerCase()];
  return { brands, outline: brands.length ? null : name && OUTLINE[name] ? name : null };
}

/** A brand logo on a white rounded badge, size px square, its top left at (x, y). */
function drawBrandBadge(ctx, key, x, y, size) {
  const b = BRAND[key];
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(x, y, size, size, size * 0.18); ctx.fill();
  const pad = size * 0.16, s = (size - pad * 2) / 24;
  ctx.translate(x + pad, y + pad); ctx.scale(s, s);
  // JavaScript's logo is black letters on its yellow square: the path is the square with the
  // letters cut out, so put black behind it
  if (key === "javascript") { ctx.fillStyle = "#000000"; ctx.fillRect(1, 1, 22, 22); }
  ctx.fillStyle = b.hex;
  ctx.fill(new Path2D(b.d));
  ctx.restore();
}

/** An outline icon (24 x 24 grid, 2 px strokes) drawn size px square at (x, y). */
function drawOutlineIcon(ctx, key, x, y, size, colour) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = colour; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.stroke(new Path2D(OUTLINE[key]));
  ctx.restore();
}

/** A skill plaque standing in a cubby (centred at cx, cy in the shelving's frame). Clickable. */
function skillTile(shelf, skill, i, cx, cy, cw, ch, d) {
  const st = skill.group === "Technical" ? { bg: "#c9a25a", ink: "#1d1a14", sub: "#5a4720" } : TILE_STYLES[i % TILE_STYLES.length];
  const w = cw - 0.12, h = ch - 0.12;
  const tex = canvasTex(384, Math.round((384 * h) / w), (ctx, cw2, ch2) => {
    ctx.fillStyle = st.bg; ctx.fillRect(0, 0, cw2, ch2);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const icons = skillIcons(skill);
    if (icons.brands.length) {
      // official logos, each on a small white badge so its own colours show on any tile
      const B = 66, gap = 12, total = icons.brands.length * B + (icons.brands.length - 1) * gap;
      icons.brands.forEach((key, k) => drawBrandBadge(ctx, key, cw2 / 2 - total / 2 + k * (B + gap), 18, B));
    } else if (icons.outline) {
      drawOutlineIcon(ctx, icons.outline, cw2 / 2 - 34, 16, 68, st.ink);
    } else {
      ctx.fillStyle = st.sub; ctx.font = `600 22px ${sans}`;
      ctx.fillText(skill.group.toUpperCase(), cw2 / 2, 42);
    }
    const hasIcon = icons.brands.length || icons.outline;
    ctx.fillStyle = st.ink;
    fitFont(ctx, skill.name, 800, hasIcon ? 40 : 46, sans, cw2 - 36);
    ctx.fillText(skill.name, cw2 / 2, hasIcon ? (skill.items ? 136 : 150) : skill.items ? ch2 / 2 + 14 : ch2 / 2 + 28);
    if (skill.items) {
      ctx.fillStyle = st.sub; fitFont(ctx, skill.items, 500, hasIcon ? 25 : 28, serifFont, cw2 - 36);
      ctx.fillText(skill.items, cw2 / 2, ch2 - (hasIcon ? 26 : 34));
    }
  });
  const fm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 });
  const tile = new THREE.Mesh(frontBox(w, h, 0.03), [mat(st.bg, { roughness: 0.6 }), fm]);
  tile.position.set(cx, cy - ch / 2 + 0.008 + h / 2 + 0.01, d / 2 - 0.12);
  tile.rotation.x = -0.06;
  shelf.add(tile);
  const used = whereUsed(skill);
  interactables.push({
    mesh: tile, hint: "Skill: " + skill.name, mat: fm, base: 0.12,
    open: () => showPanel({
      title: skill.name, meta: skill.group === "Technical" ? skill.items : "Area of expertise",
      html: used.length ? `<p>Where it shows up:</p><ul>${used.map(({ h }) => `<li>${esc(h)}</li>`).join("")}</ul>` : `<p>${skill.group === "Technical" ? "Tools I work with." : "One of my areas of expertise."}</p>`,
    }),
  });
}

/* ---------- rugs ---------- */

/**
 * A flat-woven geometric rug, w x d metres: a navy border with a cream line inside it, then a cream
 * field crossed by a navy diamond trellis with gold dots where the lines meet. The diamonds are
 * sized so a whole number fit each way, so none are cut off at the border.
 */
function geoRugTex(w, d) {
  const PX = 200;   // pixels a metre
  return canvasTex(Math.round(w * PX), Math.round(d * PX), (ctx, cw, ch) => {
    const NAVY = "#1d2b38", CREAM = "#efe7d6", GOLD = "#c9a25a";
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, cw, ch);
    const b = 0.16 * PX;                       // border
    ctx.fillStyle = CREAM; ctx.fillRect(b * 0.45, b * 0.45, cw - b * 0.9, ch - b * 0.9);
    ctx.fillStyle = NAVY; ctx.fillRect(b * 0.6, b * 0.6, cw - b * 1.2, ch - b * 1.2);
    ctx.fillStyle = CREAM; ctx.fillRect(b, b, cw - b * 2, ch - b * 2);
    const fw = cw - b * 2, fh = ch - b * 2;
    const nx = Math.max(1, Math.round(fw / (0.42 * PX))), ny = Math.max(1, Math.round(fh / (0.42 * PX)));
    const sx = fw / nx, sy = fh / ny;
    ctx.save();
    ctx.translate(b, b);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 0.022 * PX;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = i * sx, y = j * sy;
      ctx.beginPath();
      ctx.moveTo(x + sx / 2, y + 6); ctx.lineTo(x + sx - 6, y + sy / 2); ctx.lineTo(x + sx / 2, y + sy - 6); ctx.lineTo(x + 6, y + sy / 2); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x + sx / 2, y + sy / 2, 0.03 * PX, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    noise(ctx, cw, ch, 0.06, Math.round((cw * ch) / 60));
  });
}

/** Lay a rug of w (along x) by d (along z) metres on the floor at (x, z). */
function layRug(g, x, z, w, d) {
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: geoRugTex(w, d), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(x, 0.01, z);
  g.add(rug);
}

/* ---------- wall art (not hung at the moment; kept for later) ---------- */

/** A print in a thin white frame on a wall (rotY turns it to face into the room). */
export function hangPrint(g, x, y, z, rotY, seed) {
  const f = new THREE.Group();
  f.position.set(x, y, z);
  f.rotation.y = rotY;
  g.add(f);
  box(0.5, 0.62, 0.03, mat(0xf7f7f5, { roughness: 0.5 }), 0, 0, 0, f);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), new THREE.MeshStandardMaterial({ map: printTexture(seed), roughness: 0.9 }));
  p.position.z = 0.017;
  f.add(p);
  return f;
}

/** Colourful zigzag and circle prints, like the ones over the desk in the photo. */
function printTexture(seed) {
  const palette = ["#e94f64", "#f6a623", "#3fb6c9", "#7d5ce0", "#4fbf6f", "#f2d43a"];
  return canvasTex(256, 320, (ctx, w, h) => {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 7; ctx.lineJoin = "round";
    if (seed % 2) {
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = palette[(i + seed) % palette.length];
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) ctx.lineTo(40 + k * 22, 70 + i * 32 + (k % 2 ? 14 : 0));
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = palette[(i * 2 + seed) % palette.length];
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(70 + rand(seed * 7 + i) * 116, 80 + rand(seed * 3 + i) * 160, 26 + rand(i + seed) * 22, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
}

/* ---------- the room ---------- */

export function buildWork() {
  const H = 3.2;
  const Zb = -(NEAR + RD);               // z of the back wall
  const Zc = -(NEAR + RD / 2);           // z of the room's middle
  const wallTex = plasterTex("#f3f2ef", 0.015);
  const g = createRoom("work", {
    angle: DOOR_ANGLES.work, H, label: "Work",
    wall: { tex: wallTex, tw: 2, th: 2 },
    floor: { tex: carpetTexture(), tw: 2, th: 2, opts: { roughness: 1, metalness: 0 } },
    ceil: { tex: plasterTex("#f6f5f2", 0.01), tw: 2, th: 2 },
    front: { tex: wallTex, tw: 2, th: 2 },
    bounds: { x0: -3.7, x1: 3.7, z0: -12.66, z1: -5.26 },
    frameMat: mat(0xe9e6e0, { roughness: 0.6 }),
    doorStyle: "white",
  });
  const room = rooms.work;
  const white = mat(0xf4f3f0, { roughness: 0.6 });

  // skirting boards all round
  box(RW, 0.08, 0.02, white, 0, 0.04, Zb + 0.02, g);
  box(0.02, 0.08, RD, white, -RW / 2 + 0.02, 0.04, Zc, g);
  box(0.02, 0.08, RD, white, RW / 2 - 0.02, 0.04, Zc, g);

  // recessed downlights, switched off: it's daytime
  const disc = new THREE.CircleGeometry(0.07, 20), lit = mat(0xe6e6e3, { roughness: 0.4, metalness: 0.3 });
  [-6.6, -9.0, -11.4].forEach((z) => [-1.8, 1.8].forEach((x) => {
    const m = new THREE.Mesh(disc, lit);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, H - 0.005, z);
    g.add(m);
  }));

  // back wall: a strip of high windows the full width of the room, showing sky and cloud, and a
  // square window below onto the same Perth view as the About room, seen 60 degrees further round
  // (this room faces 12 o'clock, About faces 10): Matagarup Bridge and Optus Stadium. The sun is
  // only in the strip windows above.
  const strip = blackWindow(g, RW - 0.4, 0.5, skyTexture(2432, 160), 5);
  strip.position.set(0, 2.72, Zb + 0.005);
  const square = blackWindow(g, 1.5, 1.25, perthSkylineTexture(820, 528, { sun: false }), 1);
  square.position.set(0, 1.45, Zb + 0.005);

  // back wall: the desk to the left of the window, the resume framed to its right
  const DX = -2.3, DZ = Zb + 0.47;   // the desk's middle
  blackDesk(g, 2.1, 0.9).position.set(DX, 0, DZ);
  const resumeOpen = () => showPanel({ title: profile.name + "'s resume", meta: profile.headline || "", html: resumeHtml() });
  const projectsOpen = () => loadProjects().then((list) => showPanel({ title: "Projects", meta: list.length + " projects", html: projectsHtml(list) }));
  const projectsScreen = projectsScreenTexture();
  // two monitors at the back of the desk, angled in a little, with the laptop in front under them
  monitor(g, DX - 0.33, Zb + 0.24, 0.14, resumeScreenTexture(), "Read the resume", resumeOpen);
  monitor(g, DX + 0.33, Zb + 0.24, -0.14, projectsScreen, "Open the project list", projectsOpen);
  laptop(g, DX, Zb + 0.6, 0);
  mouseOnPad(g, DX + 0.55, Zb + 0.62, 0);
  deskLamp(g, DX - 0.85, Zb + 0.2, 0.6);
  box(0.27, 0.012, 0.2, mat(0xfff7e6), DX - 0.65, 0.758, Zb + 0.6, g);   // a notepad
  room.obstacles.push({ x0: DX - 1.1, x1: DX + 1.1, z0: Zb, z1: Zb + 0.97 });
  officeChair(g, DX + 0.05, Zb + 1.45, 0.12);
  room.obstacles.push({ x0: DX - 0.3, x1: DX + 0.4, z0: Zb + 1.15, z1: Zb + 1.75 });
  // a cream rug under the desk and chair
  const rugTex = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = "#ece6da"; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, 0.05, 3000); });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(DX, 0.008, Zb + 1.15);
  g.add(rug);

  framedResume(g, 2.1, 1.5, Zb + 0.02);

  // left wall, from the door: the project board, then the big screen over a low console. Clicking a
  // project on the board puts it on the screen.
  const LW = -RW / 2 + 0.03, FACE_IN = Math.PI / 2;
  const show = bigScreen(g, LW, 1.78, -9.1, FACE_IN, 2.6, 1.4625);
  const pinNotes = projectBoard(g, LW, 1.55, -6.55, FACE_IN, show);
  // the projects load the first time this room comes into view (its door opening), not with the
  // rest of the site; their screenshots and videos only when one is clicked
  rooms.work.onEnter = () => loadProjects().then((list) => {
    pinNotes(list);
    show.setProjects(list);
    projectsScreen.paint(list.map((p) => p.title));
  });
  const media = new THREE.Group();
  media.position.set(-RW / 2 + 0.23, 0, -9.1);
  media.rotation.y = FACE_IN;
  g.add(media);
  box(2.4, 0.4, 0.42, mat(0xf1efe9, { roughness: 0.5 }), 0, 0.26, 0, media);
  [-0.8, 0, 0.8].forEach((cx) => box(0.76, 0.32, 0.005, mat(0xe8e6e0, { roughness: 0.5 }), cx, 0.26, 0.212, media));
  [-1, 1].forEach((sx) => box(0.03, 0.06, 0.38, chrome(), sx * 1.15, 0.03, 0, media));
  room.obstacles.push({ x0: -4.0, x1: -3.5, z0: -10.35, z1: -7.85 });

  // the certificates, beyond the screen
  const accolades = (profile.accolades || []).slice(0, 4);
  const slots = accolades.length <= 2
    ? [{ z: -11.25, y: 1.6 }, { z: -12.35, y: 1.6 }]
    : [{ z: -11.25, y: 1.95 }, { z: -12.35, y: 1.95 }, { z: -11.25, y: 1.2 }, { z: -12.35, y: 1.2 }];
  accolades.forEach((a, i) => {
    const { z, y } = slots[i];
    const tex = certificateTexture(a);
    const f = new THREE.Group();
    f.position.set(LW, y, z);
    f.rotation.y = FACE_IN;
    g.add(f);
    box(0.92, 0.72, 0.03, mat(0xf7f7f5, { roughness: 0.5 }), 0, 0, 0, f);
    const pm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18, roughness: 0.9 });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), pm);
    pic.position.z = 0.017;
    f.add(pic);
    interactables.push({
      mesh: pic, hint: "Inspect: " + a.title, mat: pm, base: 0.18,
      open: () => showPanel({ title: a.title, meta: [a.from, a.year].filter(Boolean).join(" · "), html: `<p>${esc(a.summary)}</p>` }),
    });
  });

  // right wall: the career timeline nearer the door, and a small shelving unit at the back with one
  // skill in each cubby (4 across, as many rows as the skills need)
  careerTimeline(g, RW / 2 - 0.01, -7.85, -Math.PI / 2, 3.7);
  const skills = skillList();
  const SC = 4, SR = Math.max(3, Math.ceil(skills.length / SC)), SCW = 0.62, SCH = 0.4, SD = 0.36;
  const shelving = modularShelving(g, SC, SR, SCW, SCH, SD, (shelf, k, cx, cy) => {
    if (skills[k]) skillTile(shelf, skills[k], k, cx, cy, SCW, SCH, SD);
  });
  shelving.rotation.y = -Math.PI / 2;
  shelving.position.set(RW / 2 - SD / 2 - 0.02, 0, -11.1);
  room.obstacles.push({ x0: 3.5, x1: 4.0, z0: -11.1 - (SC * SCW) / 2 - 0.05, z1: -11.1 + (SC * SCW) / 2 + 0.05 });

  // a geometric rug in the open middle of the room, and a runner of the same along the timeline
  layRug(g, -0.2, -8.6, 3.4, 2.6);
  layRug(g, 3.22, -7.85, 0.75, 3.6);

  // plants by the door, and one in the back corner by the shelving
  makePlant(g, -3.45, -5.6, 1.4, 0xe8e6e1);
  room.obstacles.push({ x0: -3.8, x1: -3.1, z0: -5.95, z1: -5.25 });
  makePlant(g, 3.55, -5.7, 1.3, 0x2b2d31);
  room.obstacles.push({ x0: 3.25, x1: 3.9, z0: -6.05, z1: -5.3 });
  makePlant(g, 3.45, -12.62, 1.5, 0xe8e6e1);
  room.obstacles.push({ x0: 3.1, x1: 3.9, z0: -13.0, z1: -12.3 });

  // light: nearly all of it is daylight. Sun from high outside the windows falls in a broad, soft
  // pool on the floor in front of them; skylight bounced round the white room is an even fill.
  // decay 0 means no bright spot near any light; the cutoff distances keep it out of the hall.
  const sun = (x, y, z, tx, tz, intensity, angle, dist) => {
    const l = new THREE.SpotLight(0xfff3e0, intensity, dist, angle, 1, 0);
    l.position.set(x, y, z);
    l.target.position.set(tx, 0, tz);
    g.add(l, l.target);
  };
  sun(0, 6.5, Zb - 2.5, 0, Zb + 4.0, 1.5, 0.75, 13);          // through the long strip windows
  sun(0, 4.0, Zb - 1.8, 0, Zb + 2.0, 1.3, 0.4, 7);            // through the square window
  [Zc - 1.8, Zc + 1.8].forEach((z) => {
    const bounce = new THREE.PointLight(0xf1f4fb, 1.15, 7.5, 0);
    bounce.position.set(0, 1.5, z);
    g.add(bounce);
  });
}
