/* The round hall in the middle: floor, curved wall, the three arched doorways, signs and lighting. */
import * as THREE from "three";
import { ARCH_TOP, HALL_STYLE, hallFrameMat, useHallLook, DOME_RISE, DOOR_ANGLES, DOOR_HALF, GAP, HUB_H, R, SIGNS, SPRING, animations, archFrameGeo, archLeafGeo, basic, box, canvasTex, cyl, hubObstacles, hubWallMat, interactables, mat, noise, scene, signMesh } from "./core.js";
import { openContact } from "./contact.js";
import { buildPosts, buildTimberRoof, doorPlanksTex, doorStraps, vikingFloorTex, vikingHallwayTex, vikingWallTex } from "./hall-viking.js";

const VIKING = HALL_STYLE === "viking";

/* ---------- the dome: a half-ellipsoid on top of the wall, with ribs, a cornice and a bright oculus ---------- */

function buildDome() {
  const stretch = DOME_RISE / R;                 // squash a hemisphere of radius R to the dome's rise
  const plaster = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.9, emissive: 0x2a2620, side: THREE.BackSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), plaster);
  dome.scale.y = stretch;
  dome.position.y = HUB_H;
  scene.add(dome);

  // ribs from the cornice up to the oculus
  const trim = mat(0xc7a97a, { roughness: 0.6 });
  const OCULUS = 1.1;
  const ribArc = Math.PI / 2 - Math.asin(OCULUS / R);  // stop the ribs at the oculus ring
  for (let i = 0; i < 12; i++) {
    const rib = new THREE.Group();
    rib.position.y = HUB_H;
    rib.rotation.y = (i / 12) * Math.PI * 2 + Math.PI / 12;  // offset so no rib lands over a doorway's centre
    rib.scale.y = stretch;
    scene.add(rib);
    rib.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.07, 6, 48, ribArc), trim));
  }

  // cornice where the wall meets the dome
  const cornice = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.12, 8, 160), trim);
  cornice.rotation.x = Math.PI / 2;
  cornice.position.y = HUB_H;
  scene.add(cornice);

  // the oculus: a glowing disc at the top, ringed in trim
  const top = HUB_H + DOME_RISE * Math.sqrt(1 - (OCULUS / R) ** 2);
  const sky = new THREE.Mesh(new THREE.CircleGeometry(OCULUS, 48), basic(0xfff6e0));
  sky.rotation.x = Math.PI / 2;
  sky.position.y = top - 0.02;
  scene.add(sky);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(OCULUS, 0.09, 8, 64), trim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = top - 0.04;
  scene.add(ring);

  // light falling from the oculus, so the dome isn't dark
  const skyLight = new THREE.PointLight(0xfff3dc, 24, 11, 2);
  skyLight.position.set(0, top - 1.2, 0);
  scene.add(skyLight);
}

/* ---------- the contact pigeon: a carrier pigeon on a wooden perch stand. Clicking it opens the contact form. ---------- */

function buildPigeon(x, z) {
  const st = new THREE.Group();
  st.position.set(x, 0, z);
  st.rotation.y = Math.atan2(-x, (R - 2) - z);   // face where visitors start
  scene.add(st);

  // the stand: a round foot, a turned post and a T-shaped perch with a seed cup at one end
  const wood = mat(0x6b4a2f, { roughness: 0.6 }), dark = mat(0x4a3020, { roughness: 0.6 });
  const brass = mat(0xc99a3b, { metalness: 0.6, roughness: 0.4 });
  cyl(0.22, 0.24, 0.05, dark, 0, 0.025, 0, st, 28);
  cyl(0.05, 0.08, 0.1, wood, 0, 0.1, 0, st, 16);
  cyl(0.028, 0.032, 1.1, wood, 0, 0.7, 0, st, 14);
  [0.35, 1.0].forEach((y) => cyl(0.045, 0.045, 0.03, dark, 0, y, 0, st, 16));
  const bar = cyl(0.022, 0.022, 0.56, wood, 0, 1.27, 0, st, 12);
  bar.rotation.z = Math.PI / 2;
  [-0.29, 0.29].forEach((bx) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), dark); k.position.set(bx, 1.27, 0); st.add(k); });
  cyl(0.05, 0.035, 0.05, brass, 0.22, 1.31, 0, st, 16);          // seed cup
  cyl(0.04, 0.04, 0.012, mat(0xc9b27a, { roughness: 1 }), 0.22, 1.33, 0, st, 16);

  // the pigeon, perched in the middle of the bar and facing forward (+z)
  const bird = new THREE.Group();
  bird.position.set(-0.04, 1.29, 0);
  st.add(bird);
  const grey = mat(0x9aa2b0, { roughness: 0.7 }), wingM = mat(0x7d8696, { roughness: 0.7 });   // wingM: the tail
  const neckM = mat(0x4f7d6e, { metalness: 0.55, roughness: 0.3, emissive: 0x2a1840, emissiveIntensity: 0.4 });
  const ink = mat(0x22252b, { roughness: 0.6 });
  const ell = (r, sx, sy, sz, m, px, py, pz, parent = bird) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m);
    e.scale.set(sx, sy, sz); e.position.set(px, py, pz); parent.add(e); return e;
  };
  const body = ell(0.1, 0.82, 0.78, 1.3, grey, 0, 0.1, -0.01);
  body.rotation.x = 0.35;                                          // chest up, tail down
  ell(0.054, 1, 1.12, 0.95, neckM, 0, 0.165, 0.075);              // the shimmering neck
  // folded wings with the two black wing bars painted on, so they follow the wing's curve.
  // The sphere is turned so its poles point front and back: the texture's top is the front.
  const wingTex = canvasTex(64, 128, (ctx, w, h) => {
    ctx.fillStyle = "#7d8696"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#23262c"; ctx.fillRect(0, h * 0.5, w, h * 0.06); ctx.fillRect(0, h * 0.64, w, h * 0.06);
    ctx.fillStyle = "#5d6574"; ctx.fillRect(0, h * 0.86, w, h * 0.14);   // darker flight feathers at the tip
  });
  const wingGeo = new THREE.SphereGeometry(0.09, 20, 16).rotateX(Math.PI / 2);
  const wingMat = mat(0xffffff, { map: wingTex, roughness: 0.7 });
  [-1, 1].forEach((sd) => {
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.scale.set(0.3, 0.6, 1.35);
    w.position.set(sd * 0.068, 0.11, -0.03);
    w.rotation.x = 0.35;
    bird.add(w);
  });
  const tail = box(0.085, 0.018, 0.12, wingM, 0, 0.045, -0.15, bird);
  tail.rotation.x = -0.45;
  const band = box(0.087, 0.02, 0.025, ink, 0, 0.012, -0.2, bird);
  band.rotation.x = -0.45;

  const head = new THREE.Group();
  head.position.set(0, 0.24, 0.1);
  bird.add(head);
  ell(0.048, 1, 0.95, 1.05, grey, 0, 0, 0, head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.045, 10), mat(0x3a3330, { roughness: 0.5 }));
  beak.rotation.x = Math.PI / 2 + 0.2;
  beak.position.set(0, -0.008, 0.062);
  head.add(beak);
  ell(0.012, 1.2, 0.8, 1, mat(0xece6dc, { roughness: 0.9 }), 0, 0.004, 0.045, head);   // the pale cere at the base of the beak
  [-1, 1].forEach((sd) => {
    ell(0.011, 1, 1, 0.6, mat(0xe0782a, { roughness: 0.3 }), sd * 0.04, 0.012, 0.02, head);
    ell(0.006, 1, 1, 0.6, basic(0x0d0d0d), sd * 0.046, 0.012, 0.022, head);
  });

  // pink legs gripping the bar, and a brass message tube on one leg with a rolled note
  const legM = mat(0xc4545a, { roughness: 0.6 });
  [-1, 1].forEach((sd) => {
    cyl(0.008, 0.008, 0.05, legM, sd * 0.03, 0.015, 0.0, bird, 8);
    [-0.5, 0, 0.5].forEach((a) => { const toe = box(0.006, 0.006, 0.035, legM, sd * 0.03 + Math.sin(a) * 0.01, -0.005, 0.015, bird); toe.rotation.y = a; });
  });
  cyl(0.013, 0.013, 0.045, brass, 0.042, 0.02, 0.0, bird, 12);
  cyl(0.008, 0.008, 0.02, mat(0xf2ead6, { roughness: 1 }), 0.042, 0.05, 0.0, bird, 8);

  // now and then the pigeon bobs its head and glances round
  animations.push((t) => {
    const k = t % 6;
    head.position.z = 0.1 + (k < 0.6 ? Math.sin((k / 0.6) * Math.PI * 2) * 0.012 : 0);
    head.rotation.y = k > 3 && k < 4.4 ? Math.sin(((k - 3) / 1.4) * Math.PI) * 0.5 : 0;
  });

  const plaque = signMesh(0.4, 0.13, (ctx, w, h) => {
    ctx.fillStyle = "#f6f2ea"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c7a97a"; ctx.lineWidth = 12; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#2b2b2b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 150px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Contact me", w / 2, h / 2 + 6);
  });
  plaque.position.set(0, 0.78, 0.06);
  st.add(plaque);

  // one invisible box over the whole thing, so it's easy to click
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.8;
  st.add(hit);
  interactables.push({ mesh: hit, hint: "Send me a message by pigeon", mat: neckM, base: 0.4, open: openContact });
  hubObstacles.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, label: "Contact pigeon" });
}

/* ---------- the hall ---------- */

export function buildHub() {
  if (VIKING) {
    const t = doorPlanksTex();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / (DOOR_HALF * 2), 1 / (SPRING + DOOR_HALF));   // door UVs are in metres
    useHallLook({ wallTex: vikingWallTex(), hallwayTex: vikingHallwayTex(), doorMat: mat(0xffffff, { map: t, roughness: 0.75 }) });
  }
  // floor: plank boards in the Viking hall, otherwise plain square tiles with grout lines
  const D = 2 * (R + 0.15);
  const TILE = 0.6; // tile size in metres
  const floorTex = VIKING ? vikingFloorTex(D) : canvasTex(2048, 2048, (ctx, w, h) => {
    const px = w / D;
    const step = TILE * px;
    ctx.fillStyle = "#bfb6a6"; ctx.fillRect(0, 0, w, h); // grout
    const n = Math.ceil(w / step) + 1;
    const off = (w / 2) % step; // keep a grout line through the centre
    for (let i = -1; i < n; i++) {
      for (let j = -1; j < n; j++) {
        const shade = 214 + Math.floor(Math.random() * 10) - 5;
        ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 16})`;
        ctx.fillRect(off + i * step + 2, off + j * step + 2, step - 4, step - 4);
      }
    }
    noise(ctx, w, h, 0.05, 24000);
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.15, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: VIKING ? 0.8 : 0.55, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // (hall-viking.js also has buildShields and buildHearth, left out to keep the hall simple)
  if (VIKING) { buildTimberRoof(); buildPosts(); }
  else buildDome();

  // round wall in pieces, leaving a gap at each door (10, 12 and 2 o'clock).
  // The cylinder measures angles from 6 o'clock, so a door turned by a sits at PI + a.
  const g = Math.asin(GAP / R);
  const gaps = Object.values(DOOR_ANGLES).map((a) => Math.PI + a).sort((x, y) => x - y);
  const segs = [];
  let from = 0;
  gaps.forEach((t) => { segs.push([from, t - g]); from = t + g; });
  segs.push([from, 2 * Math.PI]);
  segs.forEach(([start, end]) => {
    const len = end - start;
    const geo = new THREE.CylinderGeometry(R, R, HUB_H, 48, 1, true, start, len);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len * R) / 2);
    const m = hubWallMat(1, 1);
    m.side = THREE.BackSide;
    const wall = new THREE.Mesh(geo, m);
    wall.position.y = HUB_H / 2;
    scene.add(wall);
  });

  // exit door at 6 o'clock
  const ex = new THREE.Group();
  ex.position.set(0, 0, R - 0.02);
  ex.rotation.y = Math.PI;
  scene.add(ex);
  const exFrame = new THREE.Mesh(archFrameGeo(DOOR_HALF, 0.14, SPRING, 0.12), hallFrameMat());   // the same pale trim as the room doorways
  ex.add(exFrame);
  let leafMat = mat(0x6b2d34, { roughness: 0.6 });
  if (VIKING) {
    const t = doorPlanksTex();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / (DOOR_HALF * 2), 1 / (SPRING + DOOR_HALF));   // the door's UVs are in metres
    t.offset.set(0.5, 0);
    leafMat = mat(0xffffff, { map: t, roughness: 0.75 });
  }
  const leaf = new THREE.Mesh(archLeafGeo(DOOR_HALF, SPRING, 0.06), leafMat);
  ex.add(leaf);
  if (VIKING) doorStraps(ex, DOOR_HALF);
  box(0.07, 0.2, 0.05, mat(0xc99a3b, { metalness: 0.6, roughness: 0.4 }), 0.5, 1.05, 0.09, ex);
  const exSign = signMesh(1.7, 0.44, SIGNS.exit);
  exSign.position.set(0, ARCH_TOP + 0.5, 0.1);
  ex.add(exSign);
  interactables.push({ mesh: leaf, hint: "Leave the room", mat: leaf.material, open: () => { location.href = "index.html"; } });

  buildPigeon(3.0, 1.2);

  // lighting
  scene.add(VIKING ? new THREE.HemisphereLight(0xffe6c8, 0x3a2614, 0.6) : new THREE.HemisphereLight(0xe8eef5, 0x6a5a48, 0.55));
  const hubLight = VIKING ? new THREE.PointLight(0xffd2a0, 18, 13, 2) : new THREE.PointLight(0xfff0d8, 30, 13, 2);
  hubLight.position.set(0, 2.8, 0);
  scene.add(hubLight);
}

