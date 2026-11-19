/* ABOUT ME room (10 o'clock): a bright Scandinavian living room: white panelling, pale pine,
 * bamboo and rattan, with the Perth skyline through the big window. */
import * as THREE from "three";
import { DOOR_ANGLES, NEAR, RD, RW, basic, box, canvasTex, createRoom, cyl, esc, fitText, interactables, mat, noise, profile, rand, rooms, safeUrl, showPanel } from "./core.js";
import { addPicture, loadInto, plankTex, plasterTex } from "./shared.js";

/* ---------- Perth skyline, drawn for the big window ---------- */

/**
 * A bright daytime view across the Swan River to the Perth CBD, drawn as a stylised illustration.
 * The scene is a panorama W wide: this room's window shows x 0 to 1040 (Kings Park, the city and
 * the Bell Tower); further right are Matagarup Bridge, Optus Stadium and East Perth, which the
 * Work room (60 degrees round) sees. x0 and vw pick the slice to draw.
 */
export function perthSkylineTexture(x0 = 0, vw = 1040, { sun: showSun = true } = {}) {
  const S = 1.5, W = 1800, H = 440;
  return canvasTex(Math.round(vw * S), H * S, (ctx) => {
    ctx.scale(S, S);
    ctx.translate(-x0, 0);
    const HZ = 306;                                  // where the far bank meets the river

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, "#4f9fe6"); sky.addColorStop(0.7, "#a9d6f4"); sky.addColorStop(1, "#e3f3fb");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 2);
    // sun glow
    if (showSun) {
      const sun = ctx.createRadialGradient(880, 70, 6, 880, 70, 150);
      sun.addColorStop(0, "rgba(255,250,220,0.95)"); sun.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = sun; ctx.fillRect(700, 0, 340, 230);
    }
    // clouds
    const cloud = (x, y, s) => {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      [[0, 0, 46, 15], [-34, 7, 30, 11], [38, 8, 34, 12], [8, -9, 28, 12]].forEach(([dx, dy, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2); ctx.fill();
      });
    };
    cloud(150, 70, 1.1); cloud(560, 48, 0.9); cloud(760, 118, 0.8); cloud(985, 40, 0.7);
    cloud(1190, 84, 1.0); cloud(1420, 52, 0.85); cloud(1660, 110, 0.9);

    // far buildings, paler for depth
    const tower = (x, w, h, base, shade, top = "flat", lines = true) => {
      const y = HZ - h;
      ctx.fillStyle = base;
      ctx.beginPath();
      if (top === "slant") { ctx.moveTo(x, HZ); ctx.lineTo(x, y + 26); ctx.lineTo(x + w, y); ctx.lineTo(x + w, HZ); }
      else if (top === "round") { ctx.moveTo(x, HZ); ctx.lineTo(x, y + w / 2); ctx.ellipse(x + w / 2, y + w / 2, w / 2, w / 2, 0, Math.PI, 0); ctx.lineTo(x + w, HZ); }
      else if (top === "step") { ctx.moveTo(x, HZ); ctx.lineTo(x, y + 14); ctx.lineTo(x + w * 0.18, y + 14); ctx.lineTo(x + w * 0.18, y); ctx.lineTo(x + w * 0.82, y); ctx.lineTo(x + w * 0.82, y + 14); ctx.lineTo(x + w, y + 14); ctx.lineTo(x + w, HZ); }
      else { ctx.moveTo(x, HZ); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, HZ); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade; ctx.fillRect(x + w * 0.62, y + (top === "round" ? w / 2 : 0), w * 0.38, h);   // shaded side
      if (lines) {
        ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1;
        for (let yy = y + 12; yy < HZ - 4; yy += 9) { ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke(); }
      }
    };
    tower(262, 38, 70, "#b8cfe0", "rgba(80,110,140,0.18)");
    tower(300, 44, 96, "#aac4d8", "rgba(80,110,140,0.2)", "step");
    tower(640, 52, 88, "#b3cadc", "rgba(80,110,140,0.2)");
    tower(700, 40, 66, "#bdd2e2", "rgba(80,110,140,0.16)", "slant");
    // the main group
    tower(345, 40, 142, "#7f9fbb", "rgba(30,60,95,0.28)", "slant");                 // angled roof
    tower(392, 34, 108, "#8aa8c1", "rgba(30,60,95,0.26)", "step");
    // a tall, slender tower with a ribbed crown
    tower(432, 44, 238, "#6f8fae", "rgba(25,50,85,0.3)");
    ctx.fillStyle = "#5f7f9f"; ctx.fillRect(443, HZ - 238 - 14, 22, 14);
    ctx.fillStyle = "#4f6e8e"; ctx.fillRect(451, HZ - 238 - 30, 6, 16);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    for (let xx = 440; xx < 474; xx += 6) { ctx.beginPath(); ctx.moveTo(xx, HZ - 232); ctx.lineTo(xx, HZ - 6); ctx.stroke(); }
    tower(482, 56, 160, "#86a6c2", "rgba(30,60,95,0.25)", "round");                 // rounded top
    tower(546, 38, 122, "#6b8dab", "rgba(25,50,85,0.3)");
    tower(590, 44, 100, "#92b0c8", "rgba(30,60,95,0.22)", "step");
    // warm low blocks along the water
    [[326, 30, 36], [380, 22, 30], [624, 26, 34], [752, 34, 30]].forEach(([x, w, h], i) => tower(x, w, h, i % 2 ? "#d8cdbd" : "#cfc2ae", "rgba(90,70,40,0.15)", "flat", false));

    // the Bell Tower: copper and glass sails by Elizabeth Quay
    ctx.fillStyle = "rgba(160,205,225,0.85)";
    ctx.beginPath(); ctx.moveTo(792, HZ + 4); ctx.lineTo(808, HZ - 112); ctx.lineTo(836, HZ + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#c98a4b";
    ctx.beginPath(); ctx.moveTo(806, HZ + 4); ctx.lineTo(808, HZ - 136); ctx.lineTo(826, HZ + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e0a566";
    ctx.beginPath(); ctx.moveTo(808, HZ - 136); ctx.lineTo(817, HZ + 4); ctx.lineTo(826, HZ + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
    for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(808 - k * 2.4, HZ - 112 + k * 20); ctx.lineTo(808 + 6 + k * 3, HZ - 112 + k * 20); ctx.stroke(); }

    // Kings Park on the left: a green ridge of trees
    ctx.fillStyle = "#4f8a4e";
    ctx.beginPath(); ctx.moveTo(0, HZ + 2); ctx.lineTo(0, HZ - 70);
    ctx.bezierCurveTo(70, HZ - 92, 150, HZ - 70, 232, HZ - 20); ctx.lineTo(262, HZ + 2); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 46; i++) {
      const x = i * 5.2, ridge = HZ - 70 + Math.max(0, x - 70) * 0.55 - Math.sin(i * 0.6) * 6;
      ctx.fillStyle = i % 3 ? "#3f7a43" : "#58964f";
      ctx.beginPath(); ctx.arc(x, ridge + 10 + (i % 4) * 5, 11 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill();
    }
    // the park's lookout tower, small and pale
    ctx.fillStyle = "#e9e3d6"; ctx.fillRect(98, HZ - 112, 7, 38);
    ctx.fillStyle = "#cfc6b4"; ctx.fillRect(95, HZ - 116, 13, 5);

    // east of the bridge: low hills, the East Perth towers and Optus Stadium
    ctx.fillStyle = "#6f9e66";
    ctx.beginPath(); ctx.moveTo(1040, HZ + 2); ctx.bezierCurveTo(1300, HZ - 40, 1560, HZ - 30, W, HZ - 52); ctx.lineTo(W, HZ + 2); ctx.closePath(); ctx.fill();
    tower(1440, 40, 74, "#bccfdf", "rgba(80,110,140,0.18)");
    tower(1486, 34, 96, "#adc5d9", "rgba(80,110,140,0.2)", "step");
    tower(1528, 48, 62, "#c3d5e3", "rgba(80,110,140,0.16)");
    tower(1610, 30, 50, "#c7d8e5", "rgba(80,110,140,0.16)", "slant");
    for (let i = 0; i < 30; i++) {
      const x = 1030 + i * 14 + (i > 6 ? 230 : 0);
      ctx.fillStyle = i % 3 ? "#3f7a43" : "#58964f";
      ctx.beginPath(); ctx.arc(x, HZ - 6 - (i % 4) * 3, 10 + (i % 3) * 3, 0, Math.PI * 2); ctx.fill();
    }
    // the stadium: a bronze bowl with vertical fins under a white roof ring
    ctx.fillStyle = "#c48a4e";
    ctx.beginPath(); ctx.moveTo(1080, HZ); ctx.lineTo(1094, HZ - 60); ctx.quadraticCurveTo(1205, HZ - 82, 1316, HZ - 60); ctx.lineTo(1330, HZ); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = "rgba(255,230,190,0.45)"; ctx.lineWidth = 2;
    for (let x = 1084; x < 1330; x += 7) { ctx.beginPath(); ctx.moveTo(x, HZ); ctx.lineTo(x + 2, HZ - 90); ctx.stroke(); }
    ctx.fillStyle = "rgba(90,50,20,0.25)"; ctx.fillRect(1240, HZ - 90, 100, 90);
    ctx.restore();
    ctx.strokeStyle = "#f6f3ec"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(1092, HZ - 58); ctx.quadraticCurveTo(1205, HZ - 82, 1318, HZ - 58); ctx.stroke();
    [1110, 1300].forEach((x) => { ctx.fillStyle = "#e9e6df"; ctx.fillRect(x - 2, HZ - 96, 4, 40); ctx.fillRect(x - 7, HZ - 100, 14, 6); });

    // Matagarup Bridge: a white arch over the river on the right
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(840, HZ + 22); ctx.quadraticCurveTo(940, HZ - 120, 1040, HZ + 22); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.8)";
    for (let x = 858; x < 1040; x += 12) {
      const t = (x - 840) / 200, ay = (1 - t) * (1 - t) * (HZ + 22) + 2 * t * (1 - t) * (HZ - 120) + t * t * (HZ + 22);
      ctx.beginPath(); ctx.moveTo(x, ay + 2); ctx.lineTo(x, HZ + 22); ctx.stroke();
    }
    ctx.fillStyle = "#e6edf2"; ctx.fillRect(820, HZ + 21, 270, 5);

    // river
    const river = ctx.createLinearGradient(0, HZ, 0, H);
    river.addColorStop(0, "#5ec0e6"); river.addColorStop(0.5, "#2f95cf"); river.addColorStop(1, "#1d73ad");
    ctx.fillStyle = river; ctx.fillRect(0, HZ + 2, W, H - HZ);
    // far bank
    ctx.fillStyle = "#6aa164"; ctx.fillRect(250, HZ, W - 250, 5);
    ctx.fillStyle = "#d7c7a3"; ctx.fillRect(250, HZ + 5, W - 250, 3);
    // reflections of the towers
    ctx.save();
    ctx.beginPath(); ctx.rect(0, HZ + 8, W, H); ctx.clip();
    [[345, 40, "#6f8fae", 100], [432, 44, "#5f7f9f", 150], [482, 56, "#86a6c2", 100], [546, 38, "#6b8dab", 90], [800, 30, "#c98a4b", 90], [1090, 230, "#c48a4e", 60]].forEach(([x, w, c, h]) => {
      const g = ctx.createLinearGradient(0, HZ + 8, 0, HZ + 8 + h);
      g.addColorStop(0, c); g.addColorStop(1, "rgba(47,149,207,0)");
      ctx.globalAlpha = 0.3; ctx.fillStyle = g; ctx.fillRect(x, HZ + 8, w, h);
    });
    ctx.restore();
    ctx.globalAlpha = 1;
    // ripples
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 120; i++) {
      const y = HZ + 14 + ((i * 53) % (H - HZ - 20)), x = (i * 137) % W, l = 14 + (i % 5) * 9;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke();
    }
    // sailing boats
    const boat = (x, y, s, sail) => {
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(x, y - 54 * s); ctx.lineTo(x, y - 4 * s); ctx.lineTo(x + 26 * s, y - 4 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sail; ctx.beginPath(); ctx.moveTo(x - 3 * s, y - 40 * s); ctx.lineTo(x - 3 * s, y - 4 * s); ctx.lineTo(x - 22 * s, y - 4 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#274a66"; ctx.beginPath(); ctx.moveTo(x - 26 * s, y - 3 * s); ctx.lineTo(x + 30 * s, y - 3 * s); ctx.lineTo(x + 22 * s, y + 5 * s); ctx.lineTo(x - 18 * s, y + 5 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(x - 20 * s, y + 7 * s, 46 * s, 2);
    };
    boat(250, 372, 1.3, "#f4b9a2"); boat(620, 342, 0.8, "#f6d97a"); boat(710, 398, 1.05, "#9fd6ea"); boat(1180, 384, 1.2, "#f4b9a2"); boat(1520, 352, 0.85, "#f6d97a");
    // foreground bank with a couple of trees, bottom left
    ctx.fillStyle = "#4b8a4a";
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 398); ctx.bezierCurveTo(70, 388, 130, 408, 200, H); ctx.closePath(); ctx.fill();
    [[30, 392], [82, 400]].forEach(([x, y]) => {
      ctx.fillStyle = "#6b4a2f"; ctx.fillRect(x - 2, y - 14, 4, 20);
      ctx.fillStyle = "#3f7a43"; ctx.beginPath(); ctx.arc(x, y - 24, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#58964f"; ctx.beginPath(); ctx.arc(x + 6, y - 30, 11, 0, Math.PI * 2); ctx.fill();
    });
  });
}

/* ---------- large picture frames ---------- */

/** A soft landscape-style placeholder that says which file to replace. */
function largePlaceholderTexture(def, index) {
  return canvasTex(1024, 620, (ctx, w, h) => {
    const palettes = [["#bfe0f2", "#f1e7d3", "#a9bfa0", "#8aa88a"], ["#f4d9c3", "#f8efe0", "#cfae94", "#b88f78"], ["#cfd9ee", "#eef0f6", "#9fb3c9", "#7d97b4"]];
    const p = palettes[index % palettes.length];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, p[0]); g.addColorStop(0.62, p[1]); g.addColorStop(1, p[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.26, 52, 0, Math.PI * 2); ctx.fill();
    [[0.62, p[2], 0.0035], [0.72, p[3], 0.005]].forEach(([base, col, fr], k) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * base + Math.sin(x * fr * 6 + k * 2 + index) * 26 - k * 6);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    const bw = 700, bh = 150, bx = (w - bw) / 2, by = h * 0.3;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill();
    ctx.fillStyle = "#3d4a54"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "800 44px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Large picture " + (index + 1), w / 2, by + 58);
    ctx.font = "500 26px 'Literata', Georgia, serif";
    ctx.fillStyle = "#56646f";
    ctx.fillText(fitText(ctx, "Replace the file " + (def.src || "assets/photos/large-" + (index + 1) + ".jpg"), bw - 40), w / 2, by + 98);
    ctx.font = "italic 400 24px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, def.caption || "", bw - 40), w / 2, by + 134);
  });
}

/** A big wall frame with a mat. Shows a placeholder until the image file exists. */
function addLargeFrame(parent, def, index, x, y, z, rotY, w, h) {
  const f = new THREE.Group();
  f.position.set(x, y, z);
  f.rotation.y = rotY;
  parent.add(f);
  box(w, h, 0.07, mat(0xb98b5e, { roughness: 0.55 }), 0, 0, 0, f);
  box(w - 0.14, h - 0.14, 0.074, mat(0xfbf8f1, { roughness: 0.9 }), 0, 0, 0, f);
  const pw = w - 0.4, ph = h - 0.4;
  const tex = largePlaceholderTexture(def, index);
  const pm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.9 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pm);
  pic.position.z = 0.04;
  f.add(pic);
  loadInto(pm, def.src, pw / ph);
  interactables.push({
    mesh: pic, hint: "Look at picture", mat: pm, base: 0.25,
    open: () => showPanel({
      title: def.caption || "Picture",
      meta: "",
      html: (safeUrl(def.src) ? `<img src="${esc(safeUrl(def.src))}" alt="${esc(def.caption || "Picture")}" style="width:100%;border-radius:.4rem;display:block;margin:0 0 .75rem" onerror="this.remove()">` : "") + (def.text ? `<p>${esc(def.text)}</p>` : ""),
    }),
  });
  return f;
}

/* ---------- Scandinavian furnishings: bamboo, charcoal linen, rattan, glass and palms ---------- */

/** White walls with raised panels: a tall upper panel, a chair rail and a lower panel, 1.2 m wide. */
function panelWallTex() {
  return canvasTex(256, 683, (ctx, w, h) => {
    ctx.fillStyle = "#f7f4ee"; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 0.025, 900);
    const panel = (x0, y0, x1, y1) => {
      ctx.fillStyle = "rgba(0,0,0,0.035)"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(x0, y0, x1 - x0, 3); ctx.fillRect(x0, y0, 3, y1 - y0);
      ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.fillRect(x0, y1 - 3, x1 - x0, 3); ctx.fillRect(x1 - 3, y0, 3, y1 - y0);
    };
    panel(26, 70, w - 26, 395);
    panel(26, 465, w - 26, 640);
    ctx.fillStyle = "rgba(0,0,0,0.09)"; ctx.fillRect(0, 428, w, 10);
    ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fillRect(0, 418, w, 10);
  });
}

const BAMBOO = mat(0xc99a5f, { roughness: 0.55 });
const BAMBOO_NODE = mat(0xa5763f, { roughness: 0.6 });
const cushionSide = mat(0x3a3f47, { roughness: 0.95 });

/** One bamboo pole of length len centred on (x, y, z), along axis "x", "y" or "z", with two nodes. */
function pole(parent, len, x, y, z, axis) {
  const p = cyl(0.022, 0.022, len, BAMBOO, x, y, z, parent, 10);
  if (axis === "x") p.rotation.z = Math.PI / 2;
  if (axis === "z") p.rotation.x = Math.PI / 2;
  [-0.3, 0.3].forEach((t) => cyl(0.027, 0.027, 0.016, BAMBOO_NODE, 0, t * len, 0, p, 10));
  return p;
}

/** A bamboo-framed seat with charcoal cushions, w wide: an armchair at 0.72, a sofa at 2.3. Faces +z. */
function makeBambooSeat(w) {
  const g = new THREE.Group();
  const d = 0.78, hw = w / 2, hd = d / 2;
  [[-hw, hd, 0.62], [hw, hd, 0.62], [-hw, -hd, 0.86], [hw, -hd, 0.86]].forEach(([x, z, h]) => pole(g, h, x, h / 2, z, "y"));
  [-hw, hw].forEach((x) => {
    [0.62, 0.3, 0.12].forEach((y) => pole(g, d, x, y, 0, "z"));
    for (let k = 1; k < 4; k++) pole(g, 0.32, x, 0.46, -hd + (k * d) / 4, "y");   // slats under the arm
  });
  [hd, -hd].forEach((z) => { pole(g, w, 0, 0.3, z, "x"); pole(g, w, 0, 0.12, z, "x"); });
  pole(g, w, 0, 0.86, -hd, "x");
  const n = Math.max(3, Math.round(w / 0.16));
  for (let k = 1; k < n; k++) pole(g, 0.54, -hw + (k * w) / n, 0.58, -hd, "y");   // back slats
  box(w - 0.08, 0.13, d - 0.1, cushionSide, 0, 0.38, 0.03, g);
  const back = box(w - 0.12, 0.42, 0.12, cushionSide, 0, 0.67, -hd + 0.1, g);
  back.rotation.x = -0.12;
  return g;
}

/** Navy chevrons on white, for a cushion. */
function zigzagTex() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#f4f2ee"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1f3354"; ctx.lineWidth = 9; ctx.lineJoin = "miter";
    for (let y = -8; y < h + 16; y += 22) {
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + ((x / 16) % 2 ? 9 : 0));
      ctx.stroke();
    }
  });
}

/** A blue diamond lattice on white, for a cushion. */
function latticeTex() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#3f5f86"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#eef1f5";
    for (let y = 0; y < h + 16; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w + 16; x += 16) {
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.closePath(); ctx.fill();
    }
  });
}

const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false });

/** A glass hurricane lantern h tall with a lit candle, standing at (x, y, z). */
function lantern(parent, x, y, z, h) {
  const l = new THREE.Group();
  l.position.set(x, y, z);
  parent.add(l);
  const r = h * 0.32;
  cyl(r * 0.9, r * 0.9, h * 0.04, mat(0xbfc3c7, { metalness: 0.5, roughness: 0.4 }), 0, h * 0.02, 0, l, 20);
  cyl(r, r * 0.9, h * 0.86, glassMat, 0, h * 0.47, 0, l, 24);
  cyl(r * 0.5, r * 0.7, h * 0.08, mat(0xbfc3c7, { metalness: 0.5, roughness: 0.4 }), 0, h * 0.93, 0, l, 16);
  cyl(h * 0.11, h * 0.11, h * 0.42, mat(0xfbf8f0), 0, h * 0.25, 0, l, 16);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(h * 0.035, 8, 8), basic(0xffc866));
  flame.scale.y = 1.8;
  flame.position.set(0, h * 0.5, 0);
  l.add(flame);
  return l;
}

/** A tall black-framed glass cabinet with plants, baskets, blue vases and a photo. Its back is at z. */
function displayCabinet(g, x, z) {
  const c = new THREE.Group();
  c.position.set(x, 0, z - 0.21);
  c.rotation.y = Math.PI;   // faces into the room
  g.add(c);
  const W = 1.1, Hc = 1.95, D = 0.42;
  const black = mat(0x15161a, { roughness: 0.45, metalness: 0.3 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(0.03, Hc, 0.03, black, sx * (W / 2 - 0.015), Hc / 2, sz * (D / 2 - 0.015), c));
  box(W, 0.06, D, black, 0, Hc - 0.03, 0, c);
  box(W, 0.08, D, black, 0, 0.04, 0, c);
  box(W, Hc, 0.01, mat(0xf4f1ea), 0, Hc / 2, -D / 2 + 0.005, c);
  const shelves = [0.08, 0.52, 0.96, 1.4];
  shelves.forEach((y, i) => {
    if (i) box(W - 0.04, 0.02, D - 0.04, mat(0xffffff, { roughness: 0.4 }), 0, y, 0, c);
    box(W, 0.025, 0.025, black, 0, y, D / 2 - 0.0125, c);
  });
  [[0, D / 2, W, 0], [-W / 2, 0, D, Math.PI / 2], [W / 2, 0, D, Math.PI / 2]].forEach(([px, pz, pw, ry]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.02, Hc - 0.1), glassMat);
    p.position.set(px, Hc / 2, pz); p.rotation.y = ry; c.add(p);
  });
  box(0.01, Hc - 0.1, 0.02, black, 0.02, Hc / 2, D / 2 + 0.005, c);   // where the two doors meet

  const leaf = mat(0x5f8a55, { roughness: 0.8 }), pot = mat(0x8a7f74, { roughness: 0.7 });
  const rattan = mat(0xc49a63, { roughness: 0.9 }), blueGlass = new THREE.MeshStandardMaterial({ color: 0x3a6aa8, transparent: true, opacity: 0.75, roughness: 0.1 });
  const plant = (px, y) => {
    cyl(0.08, 0.06, 0.12, pot, px, y + 0.07, 0, c, 16);
    for (let k = 0; k < 6; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), leaf);
      s.position.set(px + Math.cos(k) * 0.06, y + 0.17 + (k % 2) * 0.04, Math.sin(k) * 0.05);
      c.add(s);
    }
  };
  const basket = (px, y, r, hgt) => cyl(r, r * 0.85, hgt, rattan, px, y + hgt / 2 + 0.01, 0, c, 20);
  const vase = (px, y, hgt) => cyl(0.05, 0.06, hgt, blueGlass, px, y + hgt / 2 + 0.01, 0, c, 16);
  const photo = (px, y) => {
    const f = box(0.18, 0.24, 0.02, black, px, y + 0.13, -0.08, c);
    f.rotation.x = -0.15;
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.2), mat(0xdfe6ea));
    pic.position.set(0, 0, 0.011); f.add(pic);
  };
  plant(-0.25, 1.41); plant(0.2, 1.41);
  photo(-0.2, 0.97); plant(0.25, 0.97);
  basket(0.22, 0.53, 0.14, 0.16); vase(-0.3, 0.53, 0.2); vase(-0.18, 0.53, 0.14);
  basket(-0.22, 0.08, 0.17, 0.22); vase(0.25, 0.08, 0.26);
}

/** A frond for the palms: a rib with leaflets either side, on a transparent canvas. */
let frondTexture = null;
function frondTex() {
  if (frondTexture) return frondTexture;
  frondTexture = canvasTex(128, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#5b7d3a"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 6); ctx.stroke();
    for (let y = h - 40; y > 10; y -= 14) {
      const len = 16 + 46 * Math.sin(((h - y) / h) * Math.PI);
      [-1, 1].forEach((s) => {
        ctx.fillStyle = (y / 14) % 2 ? "#4f7f3b" : "#5f9346";
        ctx.beginPath();
        ctx.moveTo(w / 2, y);
        ctx.quadraticCurveTo(w / 2 + s * len * 0.6, y - 12, w / 2 + s * len, y - 26);
        ctx.quadraticCurveTo(w / 2 + s * len * 0.5, y - 6, w / 2, y + 4);
        ctx.fill();
      });
    }
  });
  return frondTexture;
}

/** A kentia palm in a dark woven pot. */
function makePalm(g, x, z, s) {
  const p = new THREE.Group();
  p.position.set(x, 0, z);
  p.scale.setScalar(s);
  g.add(p);
  cyl(0.21, 0.17, 0.45, mat(0x26272b, { roughness: 0.9 }), 0, 0.225, 0, p, 20);
  cyl(0.2, 0.2, 0.02, mat(0x3b2e22), 0, 0.44, 0, p, 20);
  const frondMat = new THREE.MeshStandardMaterial({ map: frondTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  for (let i = 0; i < 11; i++) {
    const yaw = new THREE.Group();
    yaw.position.set(0, 0.44, 0);
    yaw.rotation.y = (i / 11) * Math.PI * 2 + rand(i + 3) * 0.4;
    p.add(yaw);
    const len = 0.9 + rand(i + 11) * 0.5;
    const geo = new THREE.PlaneGeometry(0.42, len);
    geo.translate(0, len / 2, 0);
    const f = new THREE.Mesh(geo, frondMat);
    f.rotation.x = 0.25 + rand(i + 21) * 0.75;   // lean outwards
    yaw.add(f);
  }
}

/** A solid bell pendant in pale rattan hanging from the ceiling at (x, ceilingY, z). */
function rattanPendant(g, x, ceilingY, z) {
  const drop = 0.75, bellH = 0.55;
  cyl(0.006, 0.006, drop, mat(0x1a1a1a), x, ceilingY - drop / 2, z, g, 6);
  cyl(0.05, 0.05, 0.03, mat(0x1a1a1a), x, ceilingY - 0.015, z, g, 12);
  // a closed shade: fine horizontal cane ribs, no gaps (an open weave shimmered at screen resolution)
  const weave = canvasTex(64, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c39363"; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { ctx.fillStyle = "rgba(90,55,25,0.35)"; ctx.fillRect(0, y, w, 3); ctx.fillStyle = "rgba(255,235,200,0.22)"; ctx.fillRect(0, y + 5, w, 4); }
  });
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(1, 1);
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(0.06 + 0.24 * Math.sin((t * Math.PI) / 2) ** 0.8, -t * bellH));
  }
  const bell = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ map: weave, color: 0xb8a48c, roughness: 0.95, side: THREE.BackSide }));
  bell.position.set(x, ceilingY - drop, z);
  g.add(bell);
  // the inside glows warm from the bulb (a lathe drawn top to bottom faces inwards, so the
  // outside of the shade is its back side and the inside its front)
  const inside = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshBasicMaterial({ color: 0xffd8a0 }));
  inside.scale.setScalar(0.985);
  inside.position.copy(bell.position);
  g.add(inside);
  // a darker rim along the bottom edge
  const rim = new THREE.Mesh(new THREE.TorusGeometry(pts[pts.length - 1].x, 0.012, 8, 48), mat(0x8a6238, { roughness: 0.7 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(x, ceilingY - drop - bellH, z);
  g.add(rim);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), basic(0xffe2a8));
  bulb.position.set(x, ceilingY - drop - 0.2, z);
  g.add(bulb);
}

export function buildAbout() {
  const H = 3.2;
  const g = createRoom("about", {
    angle: DOOR_ANGLES.about, H, label: "About me",
    wall: { tex: panelWallTex(), tw: 1.2, th: H },
    floor: { tex: plankTex("#e3cba3", 0.07, 64), tw: 2, th: 2, opts: { roughness: 0.6 } },
    ceil: { tex: plasterTex("#f6f3ec", 0.015), tw: 2, th: 2 },
    front: { tex: plasterTex("#f4f0e8"), tw: 1, th: 1 },
    bounds: { x0: -3.7, x1: 3.7, z0: -12.66, z1: -5.26 },
    frameMat: mat(0xf2ece0, { roughness: 0.5 }),
    doorStyle: "birch",
  });
  const room = rooms.about;
  const white = mat(0xffffff, { roughness: 0.6 });

  // white wall panelling: a cornice along the top and a deeper skirting
  const trim = mat(0xffffff, { roughness: 0.5 });
  const backZ = -(NEAR + RD), midZ = -(NEAR + RD / 2);
  box(RW, 0.16, 0.035, trim, 0, 0.08, backZ + 0.018, g);
  box(0.035, 0.16, RD, trim, -RW / 2 + 0.018, 0.08, midZ, g);
  box(0.035, 0.16, RD, trim, RW / 2 - 0.018, 0.08, midZ, g);
  box(RW, 0.14, 0.12, trim, 0, H - 0.07, backZ + 0.06, g);
  box(0.12, 0.14, RD, trim, -RW / 2 + 0.06, H - 0.07, midZ, g);
  box(0.12, 0.14, RD, trim, RW / 2 - 0.06, H - 0.07, midZ, g);
  box(RW, 0.05, 0.05, trim, 0, H - 0.17, backZ + 0.025, g);

  // big window on the back wall: a daytime view of the Perth skyline
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.2), new THREE.MeshBasicMaterial({ map: perthSkylineTexture() }));
  sky.position.set(0, 1.75, backZ + 0.01);
  g.add(sky);
  box(5.4, 0.08, 0.12, white, 0, 2.89, backZ + 0.06, g);
  box(5.4, 0.1, 0.2, white, 0, 0.62, backZ + 0.1, g);
  [-2.6, -0.87, 0.87, 2.6].forEach((x) => box(0.07, 2.3, 0.1, white, x, 1.75, backZ + 0.06, g));
  box(5.2, 0.05, 0.08, white, 0, 1.78, backZ + 0.06, g);

  // a pale jute rug
  const rugTex = canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#e6dac3"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,95,60,0.18)"; ctx.lineWidth = 2;
    for (let y = 6; y < h; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 2); ctx.stroke(); }
    ctx.strokeStyle = "#cdbb9b"; ctx.lineWidth = 12; ctx.strokeRect(14, 14, w - 28, h - 28);
    noise(ctx, w, h, 0.07, 3000);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.3), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.3, 0.012, -8.7);
  g.add(rug);

  // bamboo sofa against the left wall, with charcoal cushions and blue-and-white pillows
  const sofa = makeBambooSeat(2.3);
  sofa.position.set(-3.45, 0, -8.7);
  sofa.rotation.y = Math.PI / 2;
  g.add(sofa);
  room.obstacles.push({ x0: -3.85, x1: -2.9, z0: -9.9, z1: -7.5 });
  [[zigzagTex(), -9.45, 0.18], [latticeTex(), -9.05, -0.1], [zigzagTex(), -7.95, -0.16]].forEach(([tex, z, r]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.13), [cushionSide, cushionSide, cushionSide, cushionSide, mat(0xffffff, { map: tex, roughness: 0.95 }), cushionSide]);
    p.position.set(-3.38, 0.78, z);
    p.rotation.set(0, Math.PI / 2, r);
    p.rotateX(-0.22);
    g.add(p);
  });

  // round white coffee table with glass candle lanterns
  const table = new THREE.Group();
  table.position.set(-0.9, 0, -8.7);
  g.add(table);
  cyl(0.55, 0.55, 0.04, mat(0xf3f1ec, { roughness: 0.4 }), 0, 0.46, 0, table, 40);
  [0, 2.1, 4.2].forEach((a) => {
    const leg = cyl(0.022, 0.014, 0.46, mat(0xc8a06c, { roughness: 0.6 }), Math.cos(a) * 0.36, 0.22, Math.sin(a) * 0.36, table, 10);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
  });
  lantern(table, -0.15, 0.48, 0.05, 0.3);
  lantern(table, 0.12, 0.48, -0.12, 0.22);
  cyl(0.09, 0.06, 0.03, mat(0xdcd7cc), 0.3, 0.495, 0.15, table, 20);
  room.obstacles.push({ x0: -1.5, x1: -0.3, z0: -9.3, z1: -8.1 });

  // two bamboo armchairs facing the sofa
  [[2.2, -7.3, -1.9], [2.2, -10.1, -1.25]].forEach(([x, z, r]) => {
    const a = makeBambooSeat(0.72);
    a.position.set(x, 0, z);
    a.rotation.y = r;
    g.add(a);
    room.obstacles.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 });
  });
  const side = new THREE.Group();
  side.position.set(2.2, 0, -8.7);
  g.add(side);
  cyl(0.25, 0.25, 0.03, mat(0xf3f1ec, { roughness: 0.4 }), 0, 0.5, 0, side, 28);
  cyl(0.025, 0.025, 0.5, mat(0xc8a06c), 0, 0.25, 0, side, 10);
  cyl(0.16, 0.16, 0.02, mat(0xc8a06c), 0, 0.01, 0, side, 20);
  lantern(side, 0, 0.515, 0, 0.24);
  room.obstacles.push({ x0: 1.9, x1: 2.5, z0: -9.0, z1: -8.4 });

  // black-framed glass display cabinet, its back against the door wall
  displayCabinet(g, 2.55, -NEAR);
  room.obstacles.push({ x0: 1.95, x1: 3.15, z0: -5.45, z1: -4.9 });

  // palms in the corners
  makePalm(g, -3.35, -5.75, 1.0);
  makePalm(g, 3.35, -12.25, 1.25);
  room.obstacles.push({ x0: -3.7, x1: -3.0, z0: -6.1, z1: -5.4 }, { x0: 3.0, x1: 3.7, z0: -12.6, z1: -11.9 });

  // floor lamp in the back corner, by the window
  const lamp = new THREE.Group();
  lamp.position.set(-3.55, 0, -12.3);
  g.add(lamp);
  cyl(0.15, 0.15, 0.03, mat(0x2b2b2b), 0, 0.015, 0, lamp);
  cyl(0.015, 0.015, 1.5, mat(0x2b2b2b), 0, 0.78, 0, lamp, 8);
  cyl(0.18, 0.25, 0.3, new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2a8, emissiveIntensity: 0.7 }), 0, 1.65, 0, lamp, 24);
  room.obstacles.push({ x0: -3.75, x1: -3.35, z0: -12.5, z1: -12.1 });

  // a woven rattan pendant over the coffee table, and small flush lights elsewhere
  rattanPendant(g, -0.9, H, -8.7);
  [[1.6, -7.2], [0, -10.9]].forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.22, 28), basic(0xfffaf0));
    d.rotation.x = Math.PI / 2;
    d.position.set(x, H - 0.01, z);
    g.add(d);
  });

  // frames: gallery wall on the right, row above the sofa on the left
  const frameStyle = { bg: "#fbf8f1", ink: "#2b2b2b", sub: "#5a5a5a", edge: "#c7a97a", frame: 0xf4efe6, mat: 0xffffff, glow: 0.25 };
  // small frames: two between the big ones on the right, one pair flanking the sofa picture, one pair beside the window
  const slots = [
    [3.96, 2.2, -8.7, -Math.PI / 2], [3.96, 1.45, -8.7, -Math.PI / 2],
    [-3.96, 1.85, -6.3, Math.PI / 2], [-3.96, 1.85, -11.6, Math.PI / 2],
    [-3.3, 2.0, -(NEAR + RD) + 0.03, 0], [3.3, 2.0, -(NEAR + RD) + 0.03, 0],
  ];
  const frames = (profile.about && profile.about.frames) || [];
  frames.slice(0, slots.length).forEach((def, i) => {
    const [x, y, z, r] = slots[i];
    addPicture(g, def, x, y, z, r, 0.9, 0.68, frameStyle);
  });

  // large frames: two on the right wall, one over the sofa
  const largeFrames = (profile.about && profile.about.largeFrames) || [];
  const largeSlots = [
    [3.95, 1.85, -6.9, -Math.PI / 2, 2.0, 1.4],
    [3.95, 1.85, -10.5, -Math.PI / 2, 2.0, 1.4],
    [-3.95, 2.0, -8.7, Math.PI / 2, 2.4, 1.3],
  ];
  largeFrames.slice(0, largeSlots.length).forEach((def, i) => {
    const [x, y, z, r, w, h] = largeSlots[i];
    addLargeFrame(g, def, i, x, y, z, r, w, h);
  });

  // lights: a warm ceiling light and daylight from the window
  const ceilLight = new THREE.PointLight(0xfff0dc, 12, 12, 2);
  ceilLight.position.set(-0.9, 1.6, -8.7);   // just under the rattan pendant, so the shade isn't lit from inside
  g.add(ceilLight);
  const dayLight = new THREE.PointLight(0xe3f0ff, 9, 9, 2);
  dayLight.position.set(0, 1.7, -11.6);
  g.add(dayLight);
}

