/* WORK room (12 o'clock): a bright, minimal home office. */
import * as THREE from "three";
import { DOOR_ANGLES, NEAR, RD, RW, basic, box, canvasTex, createRoom, cyl, esc, fitText, interactables, makePlant, mat, noise, profile, projectsHtml, rand, resumeHtml, rooms, showPanel, wrapText } from "./core.js";
import { plasterTex } from "./shared.js";
import { perthSkylineTexture } from "./about.js";

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

/** The second monitor: a list of projects. */
function projectsScreenTexture() {
  const projects = (profile.projects || []).map((p) => p.title);
  return canvasTex(640, 380, (ctx, w, h) => {
    ctx.fillStyle = "#1e2530"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2b3442"; ctx.fillRect(0, 0, w, 44);
    ["#e9605a", "#f2be4c", "#5fc46a"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(24 + i * 22, 22, 7, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#e8edf3"; ctx.font = "800 34px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Projects", 30, 100);
    ctx.font = "500 22px 'Bricolage Grotesque', Arial, sans-serif";
    const list = projects.length ? projects.slice(0, 5) : ["Project list coming soon"];
    list.forEach((t, i) => {
      ctx.fillStyle = ["#7fc4ff", "#ffd27a", "#9be59b", "#e0a8ff", "#ff9f8f"][i % 5]; ctx.fillRect(30, 130 + i * 44, 8, 26);
      ctx.fillStyle = "#cfd8e3"; ctx.fillText(fitText(ctx, t, w - 90), 52, 151 + i * 44);
    });
    ctx.fillStyle = "#8a96a6"; ctx.font = "500 20px 'Literata', Georgia, serif";
    ctx.fillText("Click to open the project list", 30, h - 24);
  });
}

function boardTexture() {
  const projects = (profile.projects || []).map((p) => p.title);
  const pick = (i, d) => projects[i] || d;
  return canvasTex(1024, 540, (ctx, w, h) => {
    ctx.fillStyle = "#fbfbfa"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1d2b38"; ctx.font = "800 44px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Project board", 40, 70);
    ctx.strokeStyle = "#b9c3cc"; ctx.lineWidth = 3;
    const cw = (w - 80) / 3;
    ["To do", "In progress", "Done"].forEach((t, i) => {
      ctx.fillStyle = "#4d5d6b"; ctx.font = "700 28px 'Bricolage Grotesque', Arial, sans-serif";
      ctx.fillText(t, 40 + i * cw + 12, 130);
      ctx.strokeRect(40 + i * cw, 100, cw, h - 140);
    });
    const notes = [
      [0, 0, "#ffe27a", "New idea"], [0, 1, "#ffb3a7", "Plan the next release"],
      [1, 0, "#a8d8f0", pick(0, "Current project")], [1, 1, "#c8e6a8", "Review and test"],
      [2, 0, "#ffe27a", pick(1, "Shipped")], [2, 1, "#d9c4f0", pick(2, "Shipped")],
    ];
    notes.forEach(([c, r, col, text], k) => {
      ctx.save();
      ctx.translate(40 + c * cw + 18, 150 + r * 150);
      ctx.rotate((rand(k + 3) - 0.5) * 0.08);
      ctx.fillStyle = col; ctx.fillRect(0, 0, cw - 36, 120);
      ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.arc((cw - 36) / 2, 10, 7, 0, Math.PI * 2); ctx.fill();   // the pin
      ctx.fillStyle = "#1d2b38"; ctx.font = "600 26px 'Bricolage Grotesque', Arial, sans-serif";
      wrapText(ctx, text, 14, 44, cw - 64, 32, 3);
      ctx.restore();
    });
  });
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
 * Built along x, facing +z, standing on y = 0.
 */
function modularShelving(parent, cols, rows, cw, ch, d) {
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
  square.position.set(-0.5, 1.45, Zb + 0.005);

  const board = new THREE.Group();
  board.position.set(2.15, 1.55, Zb + 0.03);
  g.add(board);
  box(1.96, 1.08, 0.04, mat(0xd7d9dc, { metalness: 0.4, roughness: 0.4 }), 0, 0, 0, board);
  const bm = new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.12 });
  bm.emissiveMap = bm.map;
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 0.99), bm);
  bp.position.z = 0.025;
  board.add(bp);
  interactables.push({
    mesh: bp, hint: "Open the project list", mat: bm, base: 0.12,
    open: () => showPanel({ title: "Projects", meta: (profile.projects || []).length + " projects", html: projectsHtml(profile.projects || []) }),
  });

  // right wall: the shelving wall, 7 cells by 5
  const shelving = modularShelving(g, 7, 5, 0.76, 0.4, 0.38);
  shelving.rotation.y = -Math.PI / 2;
  shelving.position.set(RW / 2 - 0.21, 0, -9.0);
  room.obstacles.push({ x0: 3.5, x1: 4.0, z0: -11.8, z1: -6.2 });

  // left wall: the desk, side-on to the wall, with the chair on the room side; prints and awards above
  // 2.1 m long and 0.9 m deep, pushed to the wall, so the monitors, laptop, lamp and mouse all fit
  const desk = blackDesk(g, 2.1, 0.9);
  desk.rotation.y = Math.PI / 2;
  desk.position.set(-RW / 2 + 0.47, 0, -9.0);
  // two monitors at the back of the desk, angled in a little, with the laptop in front under them
  const resumeOpen = () => showPanel({ title: profile.name + "'s resume", meta: profile.headline || "", html: resumeHtml() });
  const projectsOpen = () => showPanel({ title: "Projects", meta: (profile.projects || []).length + " projects", html: projectsHtml(profile.projects || []) });
  monitor(g, -RW / 2 + 0.22, -8.7, Math.PI / 2 + 0.14, resumeScreenTexture(), "Read the resume", resumeOpen);
  monitor(g, -RW / 2 + 0.22, -9.36, Math.PI / 2 - 0.14, projectsScreenTexture(), "Open the project list", projectsOpen);
  laptop(g, -RW / 2 + 0.6, -9.03, Math.PI / 2);
  mouseOnPad(g, -RW / 2 + 0.62, -9.5, Math.PI / 2);
  deskLamp(g, -RW / 2 + 0.25, -8.2, Math.PI / 2);
  box(0.2, 0.012, 0.27, mat(0xfff7e6), -RW / 2 + 0.6, 0.758, -8.45, g);   // a notepad
  room.obstacles.push({ x0: -4.0, x1: -3.0, z0: -10.1, z1: -7.9 });
  officeChair(g, -RW / 2 + 1.55, -9.05, Math.PI / 2 + 0.25);
  room.obstacles.push({ x0: -2.75, x1: -2.15, z0: -9.4, z1: -8.7 });

  // a cream rug under the desk and chair
  const rugTex = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = "#ece6da"; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, 0.05, 3000); });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-RW / 2 + 1.25, 0.008, -9.0);
  g.add(rug);

  // awards over the desk in thin white frames, with colourful prints either side
  const accolades = (profile.accolades || []).slice(0, 12);
  const slots = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) slots.push({ z: -6.4 - col * 1.08, y: row === 0 ? 2.05 : 1.3 });
  accolades.forEach((a, i) => {
    const { z, y } = slots[i];
    const tex = canvasTex(512, 384, (ctx, w, h) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#e3e6e9"; ctx.lineWidth = 3; ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = "#c9a25a"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.font = "600 24px 'Bricolage Grotesque', Arial, sans-serif";
      ctx.fillText(String(a.kind || "award").toUpperCase(), w / 2, 68);
      ctx.fillStyle = "#1d2b38"; ctx.font = "800 42px 'Bricolage Grotesque', Arial, sans-serif";
      const yy = wrapText(ctx, a.title, w / 2, 130, w - 90, 48, 3);
      ctx.fillStyle = "#5a6a78"; ctx.font = "500 26px 'Literata', Georgia, serif";
      ctx.fillText(fitText(ctx, a.from, w - 90), w / 2, Math.min(yy + 14, h - 66));
      ctx.fillText(String(a.year || ""), w / 2, h - 34);
    });
    const f = new THREE.Group();
    f.position.set(-RW / 2 + 0.03, y, z);
    f.rotation.y = Math.PI / 2;
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
  // prints fill the free spots over the desk (between the door and the far corner)
  slots.slice(accolades.length).filter((s) => s.z > -10.4 && s.z < -6.0).slice(0, 4).forEach((s, i) => {
    const f = new THREE.Group();
    f.position.set(-RW / 2 + 0.03, s.y, s.z);
    f.rotation.y = Math.PI / 2;
    g.add(f);
    box(0.5, 0.62, 0.03, mat(0xf7f7f5, { roughness: 0.5 }), 0, 0, 0, f);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), new THREE.MeshStandardMaterial({ map: printTexture(i + 1), roughness: 0.9 }));
    p.position.z = 0.017;
    f.add(p);
  });

  // plants by the door, and one by the shelving
  makePlant(g, -3.45, -5.6, 1.4, 0xe8e6e1);
  room.obstacles.push({ x0: -3.8, x1: -3.1, z0: -5.95, z1: -5.25 });
  makePlant(g, 3.55, -5.7, 1.3, 0x2b2d31);
  room.obstacles.push({ x0: 3.25, x1: 3.9, z0: -6.05, z1: -5.3 });
  makePlant(g, 3.45, -12.4, 1.5, 0xe8e6e1);
  room.obstacles.push({ x0: 3.1, x1: 3.9, z0: -12.8, z1: -12.0 });

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
  sun(-0.5, 4.0, Zb - 1.8, -0.5, Zb + 2.0, 1.3, 0.4, 7);      // through the square window
  [Zc - 1.8, Zc + 1.8].forEach((z) => {
    const bounce = new THREE.PointLight(0xf1f4fb, 1.15, 7.5, 0);
    bounce.position.set(0, 1.5, z);
    g.add(bounce);
  });
}
