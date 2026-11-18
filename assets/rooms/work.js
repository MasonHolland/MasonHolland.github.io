/* WORK room (12 o'clock): a modern office. */
import * as THREE from "three";
import { DOOR_ANGLES, NEAR, RD, RW, animations, basic, box, canvasTex, createRoom, cyl, esc, fitText, interactables, makePlant, mat, noise, profile, projectsHtml, rand, resumeHtml, rooms, showPanel, wrapText } from "./core.js";
import { plasterTex } from "./shared.js";

/* ================================================================== *
 * WORK (12 o'clock): a bright, modern office
 * ================================================================== */

/* ---------- textures ---------- */

function codeScreenTexture() {
  const lines = [
    [["const ", "#ff79c6"], ["portfolio", "#f8f8f2"], [" = ", "#ff79c6"], ["await ", "#ff79c6"], ["build", "#50fa7b"], ["({", "#f8f8f2"]],
    [["  name: ", "#8be9fd"], [`"${profile.name || "Mason"}"`, "#f1fa8c"], [",", "#f8f8f2"]],
    [["  stack: ", "#8be9fd"], ['["HTML", "CSS", "JS"]', "#f1fa8c"], [",", "#f8f8f2"]],
    [["  accessible: ", "#8be9fd"], ["true", "#bd93f9"], [",", "#f8f8f2"]],
    [["});", "#f8f8f2"]],
    [["", "#f8f8f2"]],
    [["portfolio", "#f8f8f2"], [".", "#ff79c6"], ["open", "#50fa7b"], ["();", "#f8f8f2"]],
  ];
  return canvasTex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = "#12161f"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1c2230"; ctx.fillRect(0, 0, w, 34);
    ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(24 + i * 24, 17, 7, 0, Math.PI * 2); ctx.fill(); });
    ctx.font = "26px ui-monospace, Menlo, Consolas, 'Courier New', monospace";
    ctx.textBaseline = "alphabetic";
    lines.forEach((parts, i) => {
      ctx.fillStyle = "#44506a"; ctx.fillText(String(i + 1), 8, 88 + i * 40);
      let x = 46;
      parts.forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, x, 88 + i * 40); x += ctx.measureText(t).width; });
    });
  });
}

function calendarScreenTexture() {
  return canvasTex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = "#f7f8fa"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2f6f8f"; ctx.fillRect(0, 0, w, 56);
    ctx.fillStyle = "#fff"; ctx.font = "700 28px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("This week", 24, 29);
    const cw = (w - 48) / 5;
    ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((d, i) => {
      ctx.fillStyle = "#4d5d6b"; ctx.font = "600 20px 'Bricolage Grotesque', Arial, sans-serif";
      ctx.fillText(d, 24 + i * cw + 8, 84);
      ctx.strokeStyle = "#dde2e7"; ctx.strokeRect(24 + i * cw, 100, cw, h - 124);
    });
    const colors = ["#6fb3d2", "#f2b05e", "#8fc9a0", "#e58f8f", "#a99bd6"];
    [[0, 0.1, 0.3], [1, 0.4, 0.25], [2, 0.05, 0.2], [2, 0.5, 0.35], [3, 0.25, 0.3], [4, 0.1, 0.25], [4, 0.55, 0.2]].forEach(([c, y, hh], k) => {
      ctx.fillStyle = colors[k % colors.length];
      ctx.fillRect(24 + c * cw + 6, 106 + y * (h - 136), cw - 12, hh * (h - 136));
    });
  });
}

function projectsScreenTexture() {
  const projects = profile.projects || [];
  return canvasTex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = "#13202c"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#7cc4ff"; ctx.font = "800 40px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Projects", 36, 70);
    ctx.fillStyle = "#e4e9ec"; ctx.font = "500 28px 'Literata', Georgia, serif";
    projects.slice(0, 6).forEach((p, i) => ctx.fillText(fitText(ctx, p.title + "  " + (p.year || ""), w - 72), 36, 132 + i * 44));
    ctx.fillStyle = "#9fb0bd"; ctx.font = "500 22px 'Literata', Georgia, serif";
    ctx.fillText("Click to open the list", 36, h - 28);
  });
}

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

function carpetTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    const s = w / 4;   // four 50 cm tiles per 2 m
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = Math.floor(rand(r * 7 + c * 3 + 1) * 14);
      ctx.fillStyle = `rgb(${96 + v},${112 + v},${126 + v})`;
      ctx.fillRect(c * s, r * s, s, s);
    }
    noise(ctx, w, h, 0.12, 5000);
    ctx.strokeStyle = "rgba(20,30,40,0.35)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke(); }
  });
}

function woodGrainTexture(base, dark = 0.12) {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(60,35,15,${rand(i + 5) * dark})`;
      ctx.fillRect(0, rand(i * 3 + 1) * h, w, 1 + rand(i + 9) * 2);
    }
    noise(ctx, w, h, 0.05, 600);
  });
}

function skylineTexture() {
  return canvasTex(768, 480, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#6fb2ea"); g.addColorStop(1, "#d6ebf8");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    [[130, 90, 80, 24], [190, 78, 60, 20], [520, 130, 90, 26], [590, 118, 60, 20]].forEach(([x, y, rw, rh]) => { ctx.beginPath(); ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2); ctx.fill(); });
    const row = (baseY, colA, colB, seed, minW, maxW, minH, maxH, lit) => {
      let x = -20, i = 0;
      while (x < w) {
        const bw = minW + rand(seed + i) * (maxW - minW), bh = minH + rand(seed + i * 5 + 2) * (maxH - minH);
        ctx.fillStyle = rand(seed + i * 3) > 0.5 ? colA : colB;
        ctx.fillRect(x, baseY - bh, bw, bh + 200);
        ctx.fillStyle = lit;
        for (let wy = baseY - bh + 10; wy < baseY - 6; wy += 16) for (let wx = x + 7; wx < x + bw - 10; wx += 14) {
          if (rand(seed + wx * 0.3 + wy) > 0.35) ctx.fillRect(wx, wy, 7, 9);
        }
        x += bw + 3;
        i++;
      }
    };
    row(330, "#a9c1d6", "#b9cde0", 11, 50, 90, 90, 220, "rgba(255,255,255,0.55)");
    row(400, "#7f9bb4", "#8aa5bd", 41, 50, 100, 70, 190, "rgba(235,245,255,0.5)");
    ctx.fillStyle = "#5f9467"; ctx.fillRect(0, 410, w, 70);
    ctx.fillStyle = "#4a7f55"; for (let x = 0; x < w; x += 46) { ctx.beginPath(); ctx.arc(x + 20, 412, 24, 0, Math.PI * 2); ctx.fill(); }
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
      ctx.fillStyle = "#1d2b38"; ctx.font = "600 26px 'Bricolage Grotesque', Arial, sans-serif";
      wrapText(ctx, text, 14, 40, cw - 64, 32, 3);
      ctx.restore();
    });
  });
}

function corkTexture() {
  return canvasTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = "#c39a69"; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 0.25, 6000);
    const cols = ["#fff3a8", "#bfe3f5", "#ffc9c9", "#cfeccb", "#ffffff"];
    for (let i = 0; i < 9; i++) {
      ctx.save();
      ctx.translate(40 + (i % 5) * 96 + rand(i) * 14, 40 + Math.floor(i / 5) * 130 + rand(i + 20) * 20);
      ctx.rotate((rand(i + 40) - 0.5) * 0.25);
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(0, 0, 78, 84);
      ctx.fillStyle = "rgba(60,70,80,0.45)";
      for (let l = 0; l < 4; l++) ctx.fillRect(8, 18 + l * 14, 40 + rand(i * 4 + l) * 24, 3);
      ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.arc(39, 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });
}

function clockFaceTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#fafafa"; ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "#1d232b";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      ctx.lineWidth = big ? 5 : 2;
      ctx.beginPath(); ctx.moveTo(Math.sin(a) * (big ? 98 : 106), -Math.cos(a) * (big ? 98 : 106)); ctx.lineTo(Math.sin(a) * 116, -Math.cos(a) * 116); ctx.stroke();
    }
    ctx.fillStyle = "#1d232b"; ctx.font = "700 34px 'Bricolage Grotesque', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    [[12, 0, -74], [3, 74, 2], [6, 0, 78], [9, -74, 2]].forEach(([n, x, y]) => ctx.fillText(String(n), x, y));
  });
}

/* ---------- props ---------- */

function makeClock(parent, x, y, z) {
  const c = new THREE.Group();
  c.position.set(x, y, z);
  parent.add(c);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.27, 48), new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.6 }));
  face.position.z = 0.012;
  c.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.02, 8, 48), mat(0x1d232b));
  rim.position.z = 0.014;
  c.add(rim);
  const hand = (len, w, color) => {
    const geo = new THREE.BoxGeometry(w, len, 0.008);
    geo.translate(0, len / 2, 0);
    const m = new THREE.Mesh(geo, basic(color));
    m.position.z = 0.03;
    c.add(m);
    return m;
  };
  const hh = hand(0.13, 0.018, 0x1d232b), mh = hand(0.2, 0.012, 0x1d232b), sh = hand(0.22, 0.005, 0xc0392b);
  animations.push(() => {
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000;
    const mi = d.getMinutes() + s / 60;
    const hr = (d.getHours() % 12) + mi / 60;
    hh.rotation.z = -(hr / 12) * Math.PI * 2;
    mh.rotation.z = -(mi / 60) * Math.PI * 2;
    sh.rotation.z = -(s / 60) * Math.PI * 2;
  });
  return c;
}

function makeChair(color = 0x38424e) {
  const c = new THREE.Group();
  const m = mat(color, { roughness: 0.85 });
  const metal = mat(0x6d757f, { metalness: 0.7, roughness: 0.4 });
  cyl(0.27, 0.26, 0.08, m, 0, 0.5, 0, c, 20);
  box(0.46, 0.46, 0.06, m, 0, 0.82, 0.26, c);
  box(0.04, 0.2, 0.04, metal, 0, 0.62, 0.26, c);
  [-0.27, 0.27].forEach((x) => {
    box(0.04, 0.04, 0.3, m, x, 0.68, 0.06, c);
    box(0.03, 0.15, 0.03, metal, x, 0.6, 0.0, c);
  });
  cyl(0.03, 0.03, 0.4, metal, 0, 0.28, 0, c, 8);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.28, 0.03, 0.04, metal, Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14, c);
    leg.rotation.y = -a;
    cyl(0.025, 0.025, 0.03, mat(0x1d232b), Math.cos(a) * 0.27, 0.03, Math.sin(a) * 0.27, c, 8);
  }
  return c;
}

function makeDesk(parent, x, z, w, topMat) {
  const d = new THREE.Group();
  d.position.set(x, 0, z);
  parent.add(d);
  const white = mat(0xeceef0, { roughness: 0.5 });
  box(w, 0.04, 0.85, topMat, 0, 0.74, 0, d);
  box(0.04, 0.72, 0.78, white, -w / 2 + 0.08, 0.36, 0, d);
  box(0.04, 0.72, 0.78, white, w / 2 - 0.08, 0.36, 0, d);
  box(w - 0.16, 0.45, 0.02, white, 0, 0.5, -0.38, d);
  // drawer pedestal on the right
  box(0.42, 0.6, 0.7, white, w / 2 - 0.34, 0.3, 0, d);
  [0.1, 0.3, 0.5].forEach((y) => box(0.3, 0.012, 0.01, mat(0xc4c9ce), w / 2 - 0.34, y + 0.02, 0.355, d));
  return d;
}

function makeMonitor(parent, x, y, z, w, h, tex, interact) {
  const m = new THREE.Group();
  m.position.set(x, y, z);
  parent.add(m);
  const bezel = mat(0x20262e, { roughness: 0.5 });
  box(w + 0.05, h + 0.05, 0.035, bezel, 0, h / 2 + 0.12, 0, m);
  box(0.06, 0.12, 0.05, mat(0x9aa3ad, { metalness: 0.5 }), 0, 0.06, -0.02, m);
  box(0.26, 0.012, 0.18, mat(0x9aa3ad, { metalness: 0.5 }), 0, 0.006, -0.02, m);
  const sm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.8 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm);
  screen.position.set(0, h / 2 + 0.12, 0.02);
  m.add(screen);
  if (interact) interactables.push({ mesh: screen, hint: interact.hint, mat: sm, base: 0.8, open: interact.open });
  return m;
}

/** Keyboard, mouse, mug, lamp and notepad on a desk. */
function deskThings(desk, { lampX = -0.95, mugX = 0.95 } = {}) {
  const y = 0.76;
  box(0.44, 0.015, 0.14, mat(0xd7dbe0), -0.1, y + 0.008, 0.26, desk);
  box(0.07, 0.02, 0.1, mat(0xd7dbe0), 0.3, y + 0.01, 0.26, desk);
  cyl(0.04, 0.035, 0.09, mat(0xf4f4f2), mugX, y + 0.045, 0.2, desk, 14);
  box(0.2, 0.012, 0.27, mat(0xfff7d6), lampX + 0.4, y + 0.006, 0.18, desk);
  // desk lamp
  const metal = mat(0x2c333b, { metalness: 0.5, roughness: 0.5 });
  cyl(0.08, 0.09, 0.02, metal, lampX, y + 0.01, -0.12, desk, 16);
  const arm = box(0.015, 0.4, 0.015, metal, lampX, y + 0.22, -0.12, desk);
  arm.rotation.z = 0.0;
  const shade = cyl(0.04, 0.09, 0.1, mat(0xf2efe6, { emissive: 0xffe8b8, emissiveIntensity: 0.35 }), lampX + 0.06, y + 0.44, -0.08, desk, 16);
  shade.rotation.z = 0.3;
}

function binderShelf(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const woodM = new THREE.MeshStandardMaterial({ map: woodGrainTexture("#d3b185", 0.08), roughness: 0.6 });
  const W = 1.7, Hh = 2.0, D = 0.38;
  box(0.04, Hh, D, woodM, -W / 2 + 0.02, Hh / 2, 0, g);
  box(0.04, Hh, D, woodM, W / 2 - 0.02, Hh / 2, 0, g);
  box(W, Hh, 0.015, mat(0x9d7c55), 0, Hh / 2, -D / 2 + 0.008, g);
  const rows = 4, rowH = 0.48;
  for (let i = 0; i <= rows; i++) box(W, 0.035, D, woodM, 0, 0.02 + i * rowH, 0, g);
  const palette = ["#2f4458", "#5a6b7a", "#c9d1d8", "#3f7d86", "#b9503f", "#d6a43a", "#e8e6e1", "#6f8f6a"];
  const items = [];
  for (let r = 0; r < rows; r++) {
    let bx = -W / 2 + 0.07, i = 0;
    while (true) {
      const bw = 0.035 + rand(r * 71 + i + 3) * 0.035;
      if (bx + bw > W / 2 - 0.07) break;
      if (rand(r * 13 + i * 5) > 0.08) {
        const bh = 0.3 + rand(r * 37 + i) * 0.13;
        items.push({ x: bx + bw / 2, y: 0.04 + r * rowH + bh / 2, bw, bh, c: palette[Math.floor(rand(r * 29 + i + 8) * palette.length)] });
      }
      bx += bw + 0.003;
      i++;
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.7 }), items.length);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  items.forEach((it, k) => {
    dummy.position.set(it.x, it.y, 0.02);
    dummy.scale.set(it.bw, it.bh, 0.28);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
    col.set(it.c);
    mesh.setColorAt(k, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  g.add(mesh);
  const plant = makePlant(g, 0.5, 0, 0.55, 0xe8e6e1);
  plant.position.y = Hh + 0.02;
  return g;
}

function filingCabinet(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const body = mat(0xb4bcc4, { metalness: 0.4, roughness: 0.45 });
  box(0.46, 1.3, 0.6, body, 0, 0.65, 0, g);
  [0.22, 0.65, 1.08].forEach((y) => {
    box(0.4, 0.38, 0.012, mat(0xc4ccd3, { metalness: 0.35, roughness: 0.45 }), 0, y, 0.306, g);
    box(0.18, 0.025, 0.02, mat(0x4a525b), 0, y + 0.1, 0.32, g);
  });
  return g;
}

function printer(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  box(0.5, 0.72, 0.7, mat(0xd2d6db, { roughness: 0.5 }), 0, 0.36, 0, g);
  box(0.46, 0.28, 0.62, mat(0xf0f0ee, { roughness: 0.5 }), 0, 0.86, 0, g);
  box(0.47, 0.04, 0.63, mat(0xb9bec4), 0, 1.02, 0, g);
  box(0.2, 0.015, 0.4, mat(0xf5f5f3), 0.28, 0.82, 0, g);
  box(0.02, 0.06, 0.18, mat(0x20262e), 0.235, 0.95, -0.2, g);
  return g;
}

function waterCooler(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  box(0.34, 0.95, 0.34, mat(0xeceff2, { roughness: 0.5 }), 0, 0.475, 0, g);
  box(0.22, 0.04, 0.02, mat(0x3a8fd0), -0.0, 0.8, 0.175, g);
  box(0.06, 0.05, 0.05, mat(0xc0392b), -0.06, 0.74, 0.19, g);
  box(0.06, 0.05, 0.05, mat(0x3a8fd0), 0.06, 0.74, 0.19, g);
  cyl(0.14, 0.16, 0.42, new THREE.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.55, roughness: 0.2 }), 0, 1.18, 0, g, 20);
  cyl(0.06, 0.06, 0.03, mat(0x9fd3ff), 0, 1.4, 0, g, 12);
  return g;
}

function meetingTable(parent, x, z, topMat, obstacles) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  cyl(0.72, 0.72, 0.05, topMat, 0, 0.74, 0, g, 32);
  cyl(0.07, 0.07, 0.72, mat(0xeceef0), 0, 0.36, 0, g, 12);
  cyl(0.36, 0.38, 0.03, mat(0xeceef0), 0, 0.015, 0, g, 24);
  // laptop, notebook and a mug
  box(0.32, 0.012, 0.22, mat(0xaab2ba, { metalness: 0.5 }), -0.15, 0.775, -0.1, g);
  const lid = box(0.32, 0.21, 0.01, mat(0x9aa3ad, { metalness: 0.5 }), -0.15, 0.88, -0.22, g);
  lid.rotation.x = -0.25;
  box(0.2, 0.012, 0.27, mat(0xfff7d6), 0.3, 0.771, 0.15, g);
  cyl(0.04, 0.035, 0.09, mat(0xc0504a), 0.15, 0.82, -0.3, g, 14);
  [0.4, 2.5, 4.6].forEach((a) => {
    const dx = Math.cos(a) * 0.98, dz = Math.sin(a) * 0.98;
    const ch = makeChair(0x3f6f7e);
    ch.position.set(dx, 0, dz);
    ch.rotation.y = Math.atan2(dx, dz);
    g.add(ch);
  });
  obstacles.push({ x0: x - 1.05, x1: x + 1.05, z0: z - 1.05, z1: z + 1.05 });
  return g;
}

/* ---------- the room ---------- */

export function buildWork() {
  const H = 3.2;
  const Zb = -(NEAR + RD);               // z of the back wall
  const Zc = -(NEAR + RD / 2);           // z of the room's middle
  const wallTex = plasterTex("#e9e7e2", 0.025);
  const g = createRoom("work", {
    angle: DOOR_ANGLES.work, H, label: "Work",
    wall: { tex: wallTex, tw: 2, th: 2 },
    floor: { tex: carpetTexture(), tw: 2, th: 2, opts: { roughness: 0.95, metalness: 0 } },
    ceil: { tex: plasterTex("#cfcac0", 0.02), tw: 2, th: 2 },
    front: { tex: wallTex, tw: 2, th: 2 },
    bounds: { x0: -3.7, x1: 3.7, z0: -12.66, z1: -5.26 },
    frameMat: mat(0xb98a5b, { roughness: 0.6 }),
  });
  const room = rooms.work;
  const white = mat(0xf4f3f0, { roughness: 0.6 });
  const deskTop = new THREE.MeshStandardMaterial({ map: woodGrainTexture("#bf935f"), roughness: 0.55 });

  // accent wall at the back, skirting boards all round
  const accent = new THREE.Mesh(new THREE.PlaneGeometry(RW, H), mat(0x34495e, { roughness: 0.9 }));
  accent.position.set(0, H / 2, Zb + 0.01);
  g.add(accent);
  box(RW, 0.1, 0.02, white, 0, 0.05, Zb + 0.02, g);
  box(0.02, 0.1, RD, white, -RW / 2 + 0.02, 0.05, Zc, g);
  box(0.02, 0.1, RD, white, RW / 2 - 0.02, 0.05, Zc, g);

  // ceiling light panels
  const panel = new THREE.MeshBasicMaterial({ color: 0xfff6e6 });
  [-6.5, -8.9, -11.3].forEach((z) => [-2.1, 0, 2.1].forEach((x) => {
    box(1.3, 0.025, 0.7, mat(0xdcdad4), x, H - 0.012, z, g);
    box(1.2, 0.02, 0.6, panel, x, H - 0.03, z, g);
  }));

  // back wall: bookshelf with binders, clock, corkboard, filing cabinets
  binderShelf(g, -2.4, Zb + 0.2);
  room.obstacles.push({ x0: -3.3, x1: -1.5, z0: Zb, z1: Zb + 0.5 });
  makeClock(g, 0.2, 2.3, Zb + 0.03);
  const cork = new THREE.Group();
  cork.position.set(2.2, 1.75, Zb + 0.03);
  g.add(cork);
  box(1.55, 1.0, 0.04, mat(0x8a6a45), 0, 0, 0, cork);
  const corkPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.9), new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 1 }));
  corkPlane.position.z = 0.022;
  cork.add(corkPlane);
  filingCabinet(g, -0.4, Zb + 0.33);
  filingCabinet(g, 0.1, Zb + 0.33);
  room.obstacles.push({ x0: -0.7, x1: 0.4, z0: Zb, z1: Zb + 0.65 });

  // accolades on the left wall: simple black frames with a white mat
  const accolades = (profile.accolades || []).slice(0, 12);
  accolades.forEach((a, i) => {
    const row = Math.floor(i / 6), col = i % 6;
    const z = -6.1 - col * 1.1;
    const y = row === 0 ? 2.05 : 1.25;
    const tex = canvasTex(512, 384, (ctx, w, h) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#cfd6dc"; ctx.lineWidth = 3; ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.fillStyle = "#2f6f8f"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
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
    box(0.98, 0.78, 0.04, mat(0x1d232b, { roughness: 0.5 }), 0, 0, 0, f);
    box(0.9, 0.7, 0.042, mat(0xffffff), 0, 0, 0, f);
    const pm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22, roughness: 0.9 });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), pm);
    pic.position.z = 0.025;
    f.add(pic);
    interactables.push({
      mesh: pic, hint: "Inspect: " + a.title, mat: pm, base: 0.22,
      open: () => showPanel({ title: a.title, meta: [a.from, a.year].filter(Boolean).join(" · "), html: `<p>${esc(a.summary)}</p>` }),
    });
  });

  // printer in the back-left corner
  printer(g, -3.7, -12.3);
  room.obstacles.push({ x0: -4.0, x1: -3.4, z0: -12.7, z1: -11.9 });

  // right wall: window with a daytime city view, project board, water cooler
  const win = new THREE.Group();
  win.position.set(RW / 2 - 0.02, 1.75, -7.9);
  win.rotation.y = -Math.PI / 2;
  g.add(win);
  const view = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.45), new THREE.MeshBasicMaterial({ map: skylineTexture() }));
  view.position.z = 0.005;
  win.add(view);
  box(2.5, 0.08, 0.1, white, 0, 0.76, 0.04, win);
  box(2.5, 0.08, 0.1, white, 0, -0.76, 0.04, win);
  box(0.08, 1.6, 0.1, white, -1.21, 0, 0.04, win);
  box(0.08, 1.6, 0.1, white, 1.21, 0, 0.04, win);
  box(0.05, 1.45, 0.06, white, 0, 0, 0.04, win);
  box(2.2, 0.04, 0.06, white, 0, 0.0, 0.04, win);
  box(2.7, 0.05, 0.18, white, 0, -0.82, 0.1, win);

  const board = new THREE.Group();
  board.position.set(RW / 2 - 0.03, 1.65, -10.7);
  board.rotation.y = -Math.PI / 2;
  g.add(board);
  box(2.42, 1.32, 0.04, mat(0xc9ced4, { metalness: 0.5, roughness: 0.4 }), 0, 0, 0, board);
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(2.32, 1.22), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.12 }));
  bp.material.emissiveMap = bp.material.map;
  bp.position.z = 0.025;
  board.add(bp);
  box(1.0, 0.03, 0.08, mat(0xb9bfc6), 0, -0.68, 0.05, board);

  waterCooler(g, 3.65, -12.3);
  room.obstacles.push({ x0: 3.4, x1: 4.0, z0: -12.65, z1: -11.95 });

  // two work desks facing the back wall, with a clear aisle down the middle
  const leftDesk = makeDesk(g, -1.75, -9.2, 2.1, deskTop);
  makeMonitor(leftDesk, -0.5, 0.76, -0.02, 0.8, 0.5, codeScreenTexture(), null);
  makeMonitor(leftDesk, 0.4, 0.76, -0.02, 0.8, 0.5, resumeScreenTexture(), { hint: "Read the resume", open: () => showPanel({ title: profile.name + "'s resume", meta: profile.headline || "", html: resumeHtml() }) });
  deskThings(leftDesk, { lampX: -0.95, mugX: -0.1 });
  room.obstacles.push({ x0: -2.85, x1: -0.65, z0: -9.65, z1: -8.75 });
  const chair1 = makeChair(0x3f6f7e);
  chair1.position.set(-1.75, 0, -8.05);
  chair1.rotation.y = 0.6;
  g.add(chair1);
  room.obstacles.push({ x0: -2.1, x1: -1.4, z0: -8.4, z1: -7.7 });

  const rightDesk = makeDesk(g, 1.95, -9.2, 2.1, deskTop);
  makeMonitor(rightDesk, -0.45, 0.76, -0.02, 0.8, 0.5, projectsScreenTexture(), { hint: "Open the project list", open: () => showPanel({ title: "Projects", meta: (profile.projects || []).length + " projects", html: projectsHtml(profile.projects || []) }) });
  makeMonitor(rightDesk, 0.45, 0.76, -0.02, 0.8, 0.5, calendarScreenTexture(), null);
  deskThings(rightDesk, { lampX: 0.95, mugX: -0.9 });
  room.obstacles.push({ x0: 0.85, x1: 3.05, z0: -9.65, z1: -8.75 });
  const chair2 = makeChair(0x3f6f7e);
  chair2.position.set(1.95, 0, -8.05);
  chair2.rotation.y = -0.5;
  g.add(chair2);
  room.obstacles.push({ x0: 1.6, x1: 2.3, z0: -8.4, z1: -7.7 });

  // small meeting table near the door
  meetingTable(g, 2.3, -6.4, deskTop, room.obstacles);

  // plants by the door
  makePlant(g, -3.45, -5.6, 1.5, 0xe8e6e1);
  room.obstacles.push({ x0: -3.8, x1: -3.1, z0: -5.95, z1: -5.25 });
  makePlant(g, 3.6, -5.6, 1.3, 0xe8e6e1);
  room.obstacles.push({ x0: 3.3, x1: 3.9, z0: -5.95, z1: -5.25 });

  // lights: two warm ceiling lights (the panels glow on their own)
  const top = new THREE.PointLight(0xfff0dc, 22, 14, 2);
  top.position.set(0, 2.0, -8.8);
  g.add(top);
  const front = new THREE.PointLight(0xffecd2, 3.5, 8, 2);
  front.position.set(0, 1.9, -6.6);
  g.add(front);
}
