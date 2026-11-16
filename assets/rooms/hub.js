/* The round hall in the middle: floor, curved wall, the three arched doorways, signs and lighting. */
import * as THREE from "three";
import { DOOR_HALF, GAP, HUB_H, R, SIGNS, SPRING, archFrameGeo, archLeafGeo, basic, box, canvasTex, hubWallMat, interactables, mat, noise, profile, scene, signMesh } from "./core.js";

/* ---------- the hall ---------- */

export function buildHub() {
  // floor medallion
  const D = 2 * (R + 0.15);
  const floorTex = canvasTex(1024, 1024, (ctx, w, h) => {
    const px = w / D;
    ctx.fillStyle = "#d9d2c4"; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 0.07, 6000);
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = "#8a6f3f"; ctx.lineWidth = 6;
    [4.2, 3.0].forEach((r) => { ctx.beginPath(); ctx.arc(0, 0, r * px, 0, Math.PI * 2); ctx.stroke(); });
    // lines towards the three doors: 12 o'clock is up, 3 is right, 9 is left
    ctx.lineWidth = 10; ctx.strokeStyle = "#b08a45";
    [[0, -1], [1, 0], [-1, 0]].forEach(([dx, dz]) => {
      ctx.beginPath(); ctx.moveTo(dx * 1.2 * px, dz * 1.2 * px); ctx.lineTo(dx * 4.1 * px, dz * 4.1 * px); ctx.stroke();
    });
    ctx.fillStyle = "#2b2b2b"; ctx.beginPath(); ctx.arc(0, 0, 1.15 * px, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#c7a97a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 1.05 * px, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#f6f2ea"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 78px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText(String(profile.name || "").slice(0, 12), 0, 0);
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.15, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R + 0.15, 96), mat(0xf1ece2));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = HUB_H;
  scene.add(ceil);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.07, 10, 80), basic(0xfff3d6));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = HUB_H - 0.06;
  scene.add(ring);

  // round wall in pieces, leaving a gap at 9, 12 and 3 o'clock
  const g = Math.asin(GAP / R);
  const segs = [[0, Math.PI / 2 - g], [Math.PI / 2 + g, Math.PI - g], [Math.PI + g, 1.5 * Math.PI - g], [1.5 * Math.PI + g, 2 * Math.PI]];
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

  // lighting
  scene.add(new THREE.HemisphereLight(0xe8eef5, 0x6a5a48, 0.55));
  const hubLight = new THREE.PointLight(0xfff0d8, 20, 11, 2);
  hubLight.position.set(0, 2.8, 0);
  scene.add(hubLight);
}

