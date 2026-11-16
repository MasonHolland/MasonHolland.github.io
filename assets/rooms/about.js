/* ABOUT ME room (9 o'clock): a bright, modern living room. */
import * as THREE from "three";
import { NEAR, RD, RW, basic, box, canvasTex, createRoom, cyl, esc, fitText, interactables, makeArmchair, makePlant, makeSofa, mat, noise, profile, rooms, safeUrl, showPanel } from "./core.js";
import { addPicture, loadInto, plankTex, plasterTex } from "./shared.js";

/* ---------- Perth skyline, drawn for the big window ---------- */

/** A bright daytime view across the Swan River to the Perth CBD, drawn as a stylised illustration. */
function perthSkylineTexture() {
  const S = 1.5, W = 1040, H = 440;
  return canvasTex(W * S, H * S, (ctx) => {
    ctx.scale(S, S);
    const HZ = 306;                                  // where the far bank meets the river

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, "#4f9fe6"); sky.addColorStop(0.7, "#a9d6f4"); sky.addColorStop(1, "#e3f3fb");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 2);
    // sun glow
    const sun = ctx.createRadialGradient(880, 70, 6, 880, 70, 150);
    sun.addColorStop(0, "rgba(255,250,220,0.95)"); sun.addColorStop(1, "rgba(255,250,220,0)");
    ctx.fillStyle = sun; ctx.fillRect(700, 0, 340, 230);
    // clouds
    const cloud = (x, y, s) => {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      [[0, 0, 46, 15], [-34, 7, 30, 11], [38, 8, 34, 12], [8, -9, 28, 12]].forEach(([dx, dy, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2); ctx.fill();
      });
    };
    cloud(150, 70, 1.1); cloud(560, 48, 0.9); cloud(760, 118, 0.8); cloud(985, 40, 0.7);

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

    // Matagarup Bridge: a white arch over the river on the right
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(840, HZ + 22); ctx.quadraticCurveTo(940, HZ - 120, 1040, HZ + 22); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.8)";
    for (let x = 858; x < 1040; x += 12) {
      const t = (x - 840) / 200, ay = (1 - t) * (1 - t) * (HZ + 22) + 2 * t * (1 - t) * (HZ - 120) + t * t * (HZ + 22);
      ctx.beginPath(); ctx.moveTo(x, ay + 2); ctx.lineTo(x, HZ + 22); ctx.stroke();
    }
    ctx.fillStyle = "#e6edf2"; ctx.fillRect(820, HZ + 21, 220, 5);

    // river
    const river = ctx.createLinearGradient(0, HZ, 0, H);
    river.addColorStop(0, "#5ec0e6"); river.addColorStop(0.5, "#2f95cf"); river.addColorStop(1, "#1d73ad");
    ctx.fillStyle = river; ctx.fillRect(0, HZ + 2, W, H - HZ);
    // far bank
    ctx.fillStyle = "#6aa164"; ctx.fillRect(250, HZ, 780, 5);
    ctx.fillStyle = "#d7c7a3"; ctx.fillRect(250, HZ + 5, 780, 3);
    // reflections of the towers
    ctx.save();
    ctx.beginPath(); ctx.rect(0, HZ + 8, W, H); ctx.clip();
    [[345, 40, "#6f8fae", 100], [432, 44, "#5f7f9f", 150], [482, 56, "#86a6c2", 100], [546, 38, "#6b8dab", 90], [800, 30, "#c98a4b", 90]].forEach(([x, w, c, h]) => {
      const g = ctx.createLinearGradient(0, HZ + 8, 0, HZ + 8 + h);
      g.addColorStop(0, c); g.addColorStop(1, "rgba(47,149,207,0)");
      ctx.globalAlpha = 0.3; ctx.fillStyle = g; ctx.fillRect(x, HZ + 8, w, h);
    });
    ctx.restore();
    ctx.globalAlpha = 1;
    // ripples
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 70; i++) {
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
    boat(250, 372, 1.3, "#f4b9a2"); boat(620, 342, 0.8, "#f6d97a"); boat(710, 398, 1.05, "#9fd6ea");
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

export function buildAbout() {
  const H = 3.2;
  const g = createRoom("about", {
    angle: Math.PI / 2, H, label: "About me",
    wall: { tex: plasterTex("#f4f0e8"), tw: 2, th: 2 },
    floor: { tex: plankTex("#c9a77c", 0.14), tw: 2, th: 2, opts: { roughness: 0.55 } },
    ceil: { tex: plasterTex("#e4dfd3", 0.02), tw: 2, th: 2 },
    front: { tex: plasterTex("#f4f0e8"), tw: 1, th: 1 },
    bounds: { x0: -3.7, x1: 3.7, z0: -12.66, z1: -5.26 },
    frameMat: mat(0xf2ece0, { roughness: 0.5 }),
  });
  const room = rooms.about;
  const white = mat(0xffffff, { roughness: 0.6 });

  // skirting
  const skirt = mat(0xffffff, { roughness: 0.5 });
  box(RW, 0.12, 0.03, skirt, 0, 0.06, -(NEAR + RD) + 0.015, g);
  box(0.03, 0.12, RD, skirt, -RW / 2 + 0.015, 0.06, -(NEAR + RD / 2), g);
  box(0.03, 0.12, RD, skirt, RW / 2 - 0.015, 0.06, -(NEAR + RD / 2), g);

  // big window on the back wall: a daytime view of the Perth skyline
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.2), new THREE.MeshBasicMaterial({ map: perthSkylineTexture() }));
  sky.position.set(0, 1.75, -(NEAR + RD) + 0.01);
  g.add(sky);
  box(5.4, 0.08, 0.12, white, 0, 2.89, -(NEAR + RD) + 0.06, g);
  box(5.4, 0.1, 0.2, white, 0, 0.62, -(NEAR + RD) + 0.1, g);
  [-2.6, -0.87, 0.87, 2.6].forEach((x) => box(0.07, 2.3, 0.1, white, x, 1.75, -(NEAR + RD) + 0.06, g));
  box(5.2, 0.05, 0.08, white, 0, 1.78, -(NEAR + RD) + 0.06, g);

  // rug, sofa, coffee table, armchairs
  const rugTex = canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#efe6d6"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a9b8a0"; ctx.lineWidth = 14; ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.strokeStyle = "#d9a38a"; ctx.lineWidth = 4; ctx.strokeRect(50, 50, w - 100, h - 100);
    noise(ctx, w, h, 0.08, 2500);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.3), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.3, 0.012, -8.7);
  g.add(rug);

  const sofa = makeSofa(0x8d9eab, 2.5);
  sofa.position.set(-3.3, 0, -8.7);
  sofa.rotation.y = Math.PI / 2;
  g.add(sofa);
  room.obstacles.push({ x0: -3.85, x1: -2.8, z0: -10.0, z1: -7.4 });
  [[0xd9a38a, -3.15, -9.6], [0xa9b8a0, -3.15, -7.8]].forEach(([c, x, z], i) => {
    const p = box(0.4, 0.4, 0.12, mat(c), x, 0.78, z, g);
    p.rotation.set(0, Math.PI / 2 + 0.2 * (i ? -1 : 1), 0.12);
  });

  const table = new THREE.Group();
  table.position.set(-0.9, 0, -8.7);
  g.add(table);
  box(1.3, 0.05, 0.7, mat(0xb98b5e, { roughness: 0.5 }), 0, 0.42, 0, table);
  box(1.1, 0.03, 0.5, mat(0xe9dfd0), 0, 0.2, 0, table);
  [[-0.58, -0.28], [0.58, -0.28], [-0.58, 0.28], [0.58, 0.28]].forEach(([x, z]) => box(0.05, 0.4, 0.05, mat(0x3a2a1c), x, 0.2, z, table));
  box(0.32, 0.03, 0.24, mat(0x2f4a5c), -0.2, 0.465, 0.05, table);
  box(0.28, 0.03, 0.2, mat(0xd9a38a), -0.18, 0.495, 0.04, table);
  cyl(0.06, 0.05, 0.1, mat(0xffffff), 0.35, 0.5, -0.1, table);
  room.obstacles.push({ x0: -1.55, x1: -0.25, z0: -9.05, z1: -8.35 });

  [[2.2, -7.3, -1.9], [2.2, -10.1, -1.25]].forEach(([x, z, r]) => {
    const a = makeArmchair(0xd9a38a);
    a.position.set(x, 0, z);
    a.rotation.y = r;
    g.add(a);
    room.obstacles.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 });
  });
  const side = new THREE.Group();
  side.position.set(2.2, 0, -8.7);
  g.add(side);
  cyl(0.28, 0.28, 0.5, mat(0xb98b5e, { roughness: 0.5 }), 0, 0.25, 0, side, 24);
  cyl(0.07, 0.07, 0.18, mat(0xffffff), 0, 0.59, 0, side);
  room.obstacles.push({ x0: 1.9, x1: 2.5, z0: -9.0, z1: -8.4 });

  // sideboard with a lamp by the door wall
  const sb = new THREE.Group();
  sb.position.set(2.5, 0, -5.4);
  g.add(sb);
  box(1.7, 0.7, 0.45, mat(0xb98b5e, { roughness: 0.5 }), 0, 0.5, 0, sb);
  [[-0.7], [0.7]].forEach(([x]) => box(0.05, 0.15, 0.05, mat(0x3a2a1c), x, 0.075, 0, sb));
  cyl(0.05, 0.08, 0.28, mat(0xe9dfd0), -0.5, 0.99, 0, sb);
  const shade = cyl(0.12, 0.17, 0.2, new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2a8, emissiveIntensity: 0.6 }), -0.5, 1.22, 0, sb, 20);
  room.obstacles.push({ x0: 1.65, x1: 3.35, z0: -5.7, z1: -5.2 });

  makePlant(g, -3.4, -5.7, 1.1, 0xe9dfd0);
  makePlant(g, 3.4, -12.3, 1.3, 0xd9a38a);
  makePlant(g, -3.4, -12.3, 1.0, 0xe9dfd0);
  room.obstacles.push({ x0: -3.7, x1: -3.1, z0: -6.0, z1: -5.4 }, { x0: 3.1, x1: 3.7, z0: -12.6, z1: -12.0 }, { x0: -3.7, x1: -3.1, z0: -12.6, z1: -12.0 });

  // floor lamp
  const lamp = new THREE.Group();
  lamp.position.set(-3.3, 0, -10.9);
  g.add(lamp);
  cyl(0.15, 0.15, 0.03, mat(0x2b2b2b), 0, 0.015, 0, lamp);
  cyl(0.015, 0.015, 1.5, mat(0x2b2b2b), 0, 0.78, 0, lamp, 8);
  cyl(0.18, 0.25, 0.3, new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2a8, emissiveIntensity: 0.7 }), 0, 1.65, 0, lamp, 24);
  room.obstacles.push({ x0: -3.5, x1: -3.1, z0: -11.1, z1: -10.7 });

  // ceiling lights
  [[-1.6, -7.2], [1.6, -7.2], [0, -10.6]].forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), basic(0xfffaf0));
    d.rotation.x = Math.PI / 2;
    d.position.set(x, H - 0.01, z);
    g.add(d);
  });

  // frames: gallery wall on the right, row above the sofa on the left
  const frameStyle = { bg: "#fbf8f1", ink: "#2b2b2b", sub: "#5a5a5a", edge: "#c7a97a", frame: 0xf4efe6, mat: 0xffffff, glow: 0.25 };
  // small frames: two between the big ones on the right, one pair flanking the sofa picture, one pair beside the window
  const slots = [
    [3.96, 2.2, -8.7, -Math.PI / 2], [3.96, 1.45, -8.7, -Math.PI / 2],
    [-3.96, 1.85, -6.3, Math.PI / 2], [-3.96, 2.2, -11.6, Math.PI / 2],
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
  const ceilLight = new THREE.PointLight(0xfff0dc, 16, 12, 2);
  ceilLight.position.set(0, 1.95, -8.7);
  g.add(ceilLight);
  const dayLight = new THREE.PointLight(0xe3f0ff, 9, 9, 2);
  dayLight.position.set(0, 1.7, -11.6);
  g.add(dayLight);
}

