/* The round hall in the middle: floor, curved wall, the three arched doorways, signs and lighting. */
import * as THREE from "three";
import { DOME_RISE, DOOR_ANGLES, DOOR_HALF, GAP, HUB_H, R, SIGNS, SPRING, archFrameGeo, archLeafGeo, basic, box, canvasTex, hubObstacles, hubWallMat, interactables, mat, noise, scene, signMesh } from "./core.js";
import { openContact } from "./contact.js";

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
  const skyLight = new THREE.PointLight(0xfff3dc, 30, 14, 2);
  skyLight.position.set(0, top - 1.2, 0);
  scene.add(skyLight);
}

/* ---------- the mailbox: a post box on a wooden post. Clicking it opens the contact form. ---------- */

function buildMailbox(x, z) {
  const mb = new THREE.Group();
  mb.position.set(x, 0, z);
  mb.rotation.y = Math.atan2(-x, 5.5 - z);   // turn its door towards where visitors start
  scene.add(mb);

  const wood = mat(0x4a3020, { roughness: 0.7 });
  const body = mat(0x23395b, { roughness: 0.45, metalness: 0.2 });
  const brass = mat(0xc99a3b, { metalness: 0.6, roughness: 0.4 });
  box(0.3, 0.04, 0.3, wood, 0, 0.02, 0, mb);                      // foot
  box(0.09, 1.0, 0.09, wood, 0, 0.5, 0, mb);                       // post
  box(0.2, 0.04, 0.4, wood, 0, 0.99, 0, mb);                       // shelf it sits on
  box(0.26, 0.18, 0.48, body, 0, 1.1, 0, mb);                      // box
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.48, 24, 1, false, Math.PI / 2, Math.PI), body);
  roof.rotation.x = Math.PI / 2;                                   // half cylinder on top, axis front to back
  roof.position.y = 1.19;
  mb.add(roof);
  box(0.06, 0.03, 0.03, brass, 0, 1.17, 0.255, mb);                // door handle
  box(0.015, 0.22, 0.015, mat(0x2b2b2b), 0.14, 1.2, -0.08, mb);    // flag arm
  box(0.012, 0.08, 0.13, mat(0xc4261d, { roughness: 0.5 }), 0.145, 1.27, -0.03, mb); // red flag, up

  const plaque = signMesh(0.4, 0.13, (ctx, w, h) => {
    ctx.fillStyle = "#f6f2ea"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c7a97a"; ctx.lineWidth = 12; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = "#2b2b2b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 150px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Contact me", w / 2, h / 2 + 6);
  });
  plaque.position.set(0, 0.78, 0.075);
  mb.add(plaque);

  // one invisible box over the whole thing, so it's easy to click
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.7;
  mb.add(hit);
  interactables.push({ mesh: hit, hint: "Send me a message", mat: body, open: openContact });
  hubObstacles.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 });
}

/* ---------- the hall ---------- */

export function buildHub() {
  // floor: plain square tiles with grout lines
  const D = 2 * (R + 0.15);
  const TILE = 0.6; // tile size in metres
  const floorTex = canvasTex(2048, 2048, (ctx, w, h) => {
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
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.15, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  buildDome();

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
  const dark = mat(0x3a2619, { roughness: 0.6 });
  const exFrame = new THREE.Mesh(archFrameGeo(DOOR_HALF, 0.14, SPRING, 0.12), dark);
  ex.add(exFrame);
  const leaf = new THREE.Mesh(archLeafGeo(DOOR_HALF, SPRING, 0.06), mat(0x6b2d34, { roughness: 0.6 }));
  ex.add(leaf);
  box(0.07, 0.2, 0.05, mat(0xc99a3b, { metalness: 0.6, roughness: 0.4 }), 0.5, 1.05, 0.09, ex);
  const exSign = signMesh(1.7, 0.44, SIGNS.exit);
  exSign.position.set(0, 3.32, 0.1);
  ex.add(exSign);
  interactables.push({ mesh: leaf, hint: "Leave the room", mat: leaf.material, open: () => { location.href = "index.html"; } });

  buildMailbox(2.2, 2.0);

  // lighting
  scene.add(new THREE.HemisphereLight(0xe8eef5, 0x6a5a48, 0.55));
  const hubLight = new THREE.PointLight(0xfff0d8, 40, 17, 2);
  hubLight.position.set(0, 2.8, 0);
  scene.add(hubLight);
}

