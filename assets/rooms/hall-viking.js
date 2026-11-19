/* The hall as a Viking great hall (HALL_STYLE "viking" in core.js): plank floor, timber walls with
 * carved bands, a planked roof on heavy rafters with a smoke hole, timber posts, painted shields
 * and a hearth in the middle. hub.js builds the classic hall when HALL_STYLE is "classic". */
import * as THREE from "three";
import { DOME_RISE, HUB_H, R, animations, basic, box, canvasTex, cyl, hubObstacles, mat, noise, rand, scene } from "./core.js";

const DEG = Math.PI / 180;
/** A point on the hall's floor plan at angle t (0 = 12 o'clock, positive turns left) and radius r. */
const at = (t, r) => [-r * Math.sin(t), -r * Math.cos(t)];

/** Wide, worn oak boards, D metres across. */
export function vikingFloorTex(D) {
  return canvasTex(2048, 2048, (ctx, w, h) => {
    const px = w / D, rowH = 0.26 * px;
    ctx.fillStyle = "#2a1a0e"; ctx.fillRect(0, 0, w, h);   // the gaps between boards
    for (let r = 0, y = 0; y < h; r++, y += rowH) {
      let x = -rand(r * 7) * 2.5 * px, k = 0;
      while (x < w) {
        const len = (1.4 + rand(r * 31 + k) * 1.8) * px, l = 22 + rand(r * 13 + k * 5) * 9;
        ctx.fillStyle = `hsl(${26 + rand(r + k * 3) * 6}, ${38 + rand(k + r * 2) * 10}%, ${l}%)`;
        ctx.fillRect(x + 2, y + 2, len - 4, rowH - 4);
        // grain along the board
        ctx.strokeStyle = "rgba(30,15,5,0.25)"; ctx.lineWidth = 1;
        for (let gi = 0; gi < 4; gi++) {
          const gy = y + 6 + rand(r * 3 + k * 11 + gi) * (rowH - 12);
          ctx.beginPath(); ctx.moveTo(x + 4, gy); ctx.bezierCurveTo(x + len * 0.3, gy + 3, x + len * 0.6, gy - 3, x + len - 4, gy); ctx.stroke();
        }
        // a pair of iron nails at each end
        ctx.fillStyle = "rgba(20,14,10,0.8)";
        [x + 8, x + len - 10].forEach((nx) => [y + rowH * 0.3, y + rowH * 0.7].forEach((ny) => ctx.fillRect(nx, ny, 3, 3)));
        x += len; k++;
      }
    }
    noise(ctx, w, h, 0.06, 26000);
  });
}

/** Wall texture: 2 m wide by HUB_H tall of upright planks, with carved bands at waist height and the top. */
export function vikingWallTex() {
  return canvasTex(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#24160c"; ctx.fillRect(0, 0, w, h);
    const n = 8, pw = w / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `hsl(${25 + rand(i * 3) * 6}, ${36 + rand(i + 9) * 10}%, ${20 + rand(i * 7) * 7}%)`;
      ctx.fillRect(i * pw + 2, 0, pw - 4, h);
      ctx.strokeStyle = "rgba(15,8,2,0.3)"; ctx.lineWidth = 1;
      for (let gi = 0; gi < 5; gi++) {
        const gx = i * pw + 6 + rand(i * 17 + gi) * (pw - 12);
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.bezierCurveTo(gx + 3, h * 0.3, gx - 3, h * 0.6, gx, h); ctx.stroke();
      }
      if (rand(i + 40) > 0.5) {   // a knot
        ctx.fillStyle = "rgba(20,10,4,0.5)";
        ctx.beginPath(); ctx.ellipse(i * pw + pw / 2, h * (0.2 + rand(i + 3) * 0.6), 5, 11, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // carved bands: a dark rail with a running zigzag, like interlace carving
    const band = (yTop, bh) => {
      ctx.fillStyle = "#1c1008"; ctx.fillRect(0, yTop, w, bh);
      ctx.fillStyle = "#4a2f18"; ctx.fillRect(0, yTop + 4, w, bh - 8);
      ctx.strokeStyle = "#a67c48"; ctx.lineWidth = 4;
      const step = w / 8;
      for (const off of [0, step / 2]) {
        ctx.beginPath();
        for (let x = -step + off; x <= w + step; x += step) { ctx.lineTo(x, yTop + 8); ctx.lineTo(x + step / 2, yTop + bh - 8); }
        ctx.stroke();
      }
    };
    band(h - (1.25 / HUB_H) * h, (0.18 / HUB_H) * h);
    band(0, (0.16 / HUB_H) * h);
    noise(ctx, w, h, 0.06, 2500);
  });
}

/** The hallways to the rooms: smaller dark planks. */
export function vikingHallwayTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#24160c"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `hsl(26, 38%, ${20 + rand(i * 5) * 7}%)`;
      ctx.fillRect(2, i * (h / 4) + 2, w - 4, h / 4 - 4);
    }
    noise(ctx, w, h, 0.06, 1200);
  });
}

/** A planked roof on heavy rafters in place of the dome, with a smoke hole letting daylight in. */
export function buildTimberRoof() {
  const stretch = DOME_RISE / R;
  const planks = canvasTex(2048, 256, (ctx, w, h) => {
    const n = 64, pw = w / n;
    ctx.fillStyle = "#1e1209"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `hsl(${24 + rand(i) * 6}, 35%, ${17 + rand(i * 3) * 7}%)`;
      ctx.fillRect(i * pw + 1.5, 0, pw - 3, h);
    }
    noise(ctx, w, h, 0.05, 3000);
  });
  const roof = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: planks, roughness: 0.9, emissive: 0x1a0f06, side: THREE.BackSide }));
  roof.scale.y = stretch;
  roof.position.y = HUB_H;
  scene.add(roof);

  const timber = mat(0x2e1c10, { roughness: 0.8 });
  const OCULUS = 0.9;
  const ribArc = Math.PI / 2 - Math.asin(OCULUS / R);
  for (let i = 0; i < 16; i++) {
    const rib = new THREE.Group();
    rib.position.y = HUB_H;
    rib.rotation.y = (i / 16) * Math.PI * 2 + Math.PI / 16;
    rib.scale.y = stretch;
    scene.add(rib);
    rib.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.1, 0.11, 6, 40, ribArc), timber));
  }
  // the wall plate: a heavy beam all round where the wall meets the roof
  const plate = new THREE.Mesh(new THREE.TorusGeometry(R - 0.12, 0.2, 6, 120), timber);
  plate.rotation.x = Math.PI / 2;
  plate.position.y = HUB_H - 0.05;
  scene.add(plate);

  // the smoke hole
  const top = HUB_H + DOME_RISE * Math.sqrt(1 - (OCULUS / R) ** 2);
  const sky = new THREE.Mesh(new THREE.CircleGeometry(OCULUS, 40), basic(0xdcecff));
  sky.rotation.x = Math.PI / 2;
  sky.position.y = top - 0.02;
  scene.add(sky);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(OCULUS, 0.12, 6, 40), timber);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = top - 0.05;
  scene.add(ring);
  const skyLight = new THREE.PointLight(0xe8f0ff, 14, 10, 2);
  skyLight.position.set(0, top - 1.2, 0);
  scene.add(skyLight);
}

/** Timber posts round the wall, between the doorways, each with a carved block on top. */
export function buildPosts() {
  const timber = mat(0x3a2414, { roughness: 0.75 }), dark = mat(0x22150b, { roughness: 0.8 });
  for (let k = 0; k < 12; k++) {
    const t = (15 + 30 * k) * DEG;
    const [x, z] = at(t, R - 0.14);
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    p.rotation.y = t;
    scene.add(p);
    box(0.26, HUB_H, 0.26, timber, 0, HUB_H / 2, 0, p);
    box(0.36, 0.28, 0.34, dark, 0, HUB_H - 0.3, 0, p);
    box(0.34, 0.16, 0.32, dark, 0, 0.08, 0, p);
    // two carved rings part way up
    [1.1, 2.6].forEach((y) => box(0.3, 0.06, 0.3, dark, 0, y, 0, p));
  }
}

/** One round shield's painted face: a different pattern for each. */
function shieldFace(k) {
  const pals = [["#8f1d1d", "#e8dcc0"], ["#1d3f6e", "#d9b44a"], ["#2f5a2a", "#e8dcc0"], ["#6b1f4f", "#d9b44a"]];
  const [a, b] = pals[k % pals.length];
  return canvasTex(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = a; ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b;
    const style = k % 4;
    if (style === 0) {          // quartered
      [0, 2].forEach((q) => { ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, c, (q * Math.PI) / 2, ((q + 1) * Math.PI) / 2); ctx.fill(); });
    } else if (style === 1) {   // a swirl of curved spokes
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.moveTo(c, c);
        const a0 = (i / 6) * Math.PI * 2;
        ctx.quadraticCurveTo(c + Math.cos(a0 + 0.6) * c * 0.8, c + Math.sin(a0 + 0.6) * c * 0.8, c + Math.cos(a0 + 1.2) * c, c + Math.sin(a0 + 1.2) * c);
        ctx.arc(c, c, c, a0 + 1.2, a0 + 1.55);
        ctx.quadraticCurveTo(c + Math.cos(a0 + 0.9) * c * 0.7, c + Math.sin(a0 + 0.9) * c * 0.7, c, c);
        ctx.fill();
      }
    } else if (style === 2) {   // halved, with a band
      ctx.fillRect(0, 0, c, h);
      ctx.fillStyle = a; ctx.fillRect(c - 14, 0, 28, h);
    } else {                    // rings
      [0.8, 0.5].forEach((r) => { ctx.lineWidth = 18; ctx.strokeStyle = b; ctx.beginPath(); ctx.arc(c, c, c * r, 0, Math.PI * 2); ctx.stroke(); });
    }
    // planks showing through the paint, and a worn rim
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2;
    for (let x = 32; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    noise(ctx, w, h, 0.12, 1500);
  });
}

/** Round painted shields hung on the wall between the doorways. */
export function buildShields() {
  const rim = mat(0x3b3b3e, { metalness: 0.5, roughness: 0.5 }), boss = mat(0x8a8d92, { metalness: 0.8, roughness: 0.35 });
  const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 40).rotateX(Math.PI / 2);   // its painted face looks along +z
  [30, 90, 120, 150, -30, -90, -120, -150].forEach((deg, k) => {
    const t = deg * DEG;
    const [x, z] = at(t, R - 0.07);
    const s = new THREE.Mesh(geo, [rim, mat(0xffffff, { map: shieldFace(k), roughness: 0.7 }), rim]);
    s.position.set(x, 2.55, z);
    s.rotation.y = t;
    scene.add(s);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), boss);
    b.rotation.x = Math.PI / 2;
    b.position.set(0, 0, 0.02);
    s.add(b);
  });
}

/** A stone-ringed hearth in the middle of the hall, with a flickering fire. */
export function buildHearth(x = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  const stoneGeo = new THREE.DodecahedronGeometry(0.13, 0);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = new THREE.Mesh(stoneGeo, mat(new THREE.Color().setHSL(0.08, 0.06, 0.32 + rand(i) * 0.12), { roughness: 0.95 }));
    s.position.set(Math.cos(a) * 0.62, 0.07, Math.sin(a) * 0.62);
    s.rotation.set(rand(i + 1) * 3, rand(i + 2) * 3, 0);
    s.scale.set(1.1, 0.7, 1);
    g.add(s);
  }
  cyl(0.58, 0.58, 0.03, mat(0x1d1a17, { roughness: 1 }), 0, 0.015, 0, g, 32);                       // ash
  cyl(0.32, 0.32, 0.035, basic(0xc2410c), 0, 0.03, 0, g, 24);                                        // embers
  const log = mat(0x3b2616, { roughness: 0.9 });
  [0, 1, 2].forEach((i) => {
    const l = cyl(0.06, 0.06, 0.8, log, 0, 0.11, 0, g, 10);
    l.rotation.set(Math.PI / 2 - 0.25, (i / 3) * Math.PI * 2, 0, "YXZ");
  });
  // flames: soft cones that sway and flicker
  const flames = [];
  const fm = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  [[0, 0, 0.5, 0.17, fm(0xff7a1a, 0.8)], [0.1, 0.05, 0.36, 0.11, fm(0xffa733, 0.8)], [-0.09, -0.06, 0.4, 0.12, fm(0xff8a1f, 0.8)], [0.02, -0.1, 0.3, 0.09, fm(0xffd27a, 0.7)], [-0.03, 0.09, 0.26, 0.08, fm(0xffd27a, 0.7)]]
    .forEach(([fx, fz, fh, fr, m], i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(fr, fh, 12, 1, true), m);
      f.position.set(fx, 0.16 + fh / 2, fz);
      g.add(f);
      flames.push({ f, fh, i });
    });
  const fire = new THREE.PointLight(0xff9440, 9, 9, 2);
  fire.position.set(0, 0.7, 0);
  g.add(fire);
  animations.push((t) => {
    flames.forEach(({ f, fh, i }) => {
      const k = 1 + Math.sin(t * (7 + i) + i * 2) * 0.12 + Math.sin(t * (13 + i * 2)) * 0.06;
      f.scale.set(1, k, 1);
      f.position.y = 0.16 + (fh * k) / 2;
      f.rotation.z = Math.sin(t * (3 + i) + i) * 0.08;
    });
    fire.intensity = 8.5 + Math.sin(t * 9) * 0.8 + Math.sin(t * 23) * 0.5;
  });
  hubObstacles.push({ x0: x - 0.75, x1: x + 0.75, z0: z - 0.75, z1: z + 0.75, label: "Hearth" });
}

/** Iron straps across the plank exit door (in the door's own frame, facing +z). */
export function doorStraps(door, halfW) {
  const iron = mat(0x2a2a2c, { metalness: 0.6, roughness: 0.5 });
  [0.45, 1.2, 1.95].forEach((y) => {
    box(halfW * 2 - 0.08, 0.07, 0.02, iron, 0, y, 0.07, door);
    [-1, 1].forEach((s) => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), iron); n.position.set(s * (halfW - 0.12), y, 0.08); door.add(n); });
  });
}

/** A plank texture for the exit door. */
export function doorPlanksTex() {
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = "#24160c"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `hsl(25, 40%, ${22 + rand(i * 9) * 8}%)`;
      ctx.fillRect(i * (w / 6) + 2, 0, w / 6 - 4, h);
    }
    noise(ctx, w, h, 0.07, 1500);
  });
}

