/* Entry point: builds the hall and the rooms, then handles input, picking and the render loop.
 * The rooms themselves live in assets/rooms/. */
import * as THREE from "three";
import { $, EYE, NEAR, SPEED, TOUCH, animations, resize, areaAt, camera, closePanel, crossEl, hintEl, inRoomArea, interactables, panelOpen, renderer, rooms, scene, showPanel, toLocal, toWorld, walkable } from "./rooms/core.js";
import { buildMap, updateMap } from "./rooms/map.js";
import { buildHub } from "./rooms/hub.js";
import { buildAbout } from "./rooms/about.js";
import { buildWork } from "./rooms/work.js";
import { buildHobbies } from "./rooms/hobbies.js";


/* ---------- build everything ---------- */

buildHub();
buildAbout();
buildWork();
buildHobbies();

// what can be clicked, grouped by room ("hall" for the hall), so looking round only tests the
// things where you are rather than all of them (hundreds of books and games) every frame
const meshesBy = { hall: [] };
interactables.forEach((it) => {
  let key = "hall";
  for (const [k, room] of Object.entries(rooms)) {
    let o = it.mesh;
    while (o && o !== room.group) o = o.parent;
    if (o) { key = k; break; }
  }
  (meshesBy[key] = meshesBy[key] || []).push(it.mesh);
});
const allMeshes = interactables.map((i) => i.mesh);

/* ---------- input ---------- */

const keys = new Set();
let yaw = 0, pitch = 0;
let started = false;

addEventListener("keydown", (e) => {
  if (e.code === "Escape" && panelOpen) { closePanel(); return; }
  if (panelOpen) return;
  keys.add(e.code);
  if (e.code === "KeyE") interact(null);
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());

const startEl = $("start");
function lockPointer() {
  if (TOUCH) return;
  try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {}
}
function resume() {
  started = true;
  startEl.hidden = true;
  lockPointer();
}
$("enter").addEventListener("click", resume);

/** The Esc menu: the same overlay as the welcome screen, plus the map and a way out. */
function showMenu() {
  keys.clear();
  $("enter").textContent = "Keep exploring";
  startEl.classList.add("is-paused");
  $("mapWrap").hidden = false;
  $("leave").hidden = false;
  updateMap(camera.position.x, camera.position.z, yaw);
  startEl.hidden = false;
}
document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && started && !panelOpen) showMenu();
});

// on touch screens there is no Esc key, so the top bar has a button instead
if (TOUCH) {
  $("optHint").hidden = true;
  $("optBtn").hidden = false;
  $("optBtn").addEventListener("click", () => { if (started && !panelOpen) showMenu(); });
}

const HOME = { x: camera.position.x, z: camera.position.z };
/** Jump to the hall, or to just inside a room's doorway, facing into the room. */
function goTo(key) {
  let x = HOME.x, z = HOME.z, facing = 0;
  const room = rooms[key];
  if (room) {
    facing = room.angle;
    for (let d = NEAR + 0.9; d < NEAR + 4; d += 0.2) {
      [x, z] = toWorld(room.angle, 0, -d);
      if (walkable(x, z)) break;
    }
  }
  camera.position.x = x;
  camera.position.z = z;
  yaw = facing;
  pitch = 0;
  resume();
}
buildMap($("map"), goTo);
document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  pitch = Math.max(-1.2, Math.min(1.2, pitch));
});
renderer.domElement.addEventListener("click", () => {
  if (TOUCH || panelOpen || !started) return;
  if (document.pointerLockElement) interact(null);
  else lockPointer();
});

// touch: left side walks, right side looks, a quick tap inspects what was tapped
const stick = { id: null, x0: 0, y0: 0, x: 0, y: 0 };
const look = { id: null, x: 0, y: 0, x0: 0, y0: 0, t0: 0 };
const stickKnob = document.querySelector("#stick i");

renderer.domElement.addEventListener("touchstart", (e) => {
  if (!started || panelOpen) return;
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.4 && stick.id === null) {
      stick.id = t.identifier; stick.x0 = stick.x = t.clientX; stick.y0 = stick.y = t.clientY;
    } else if (look.id === null) {
      look.id = t.identifier; look.x = look.x0 = t.clientX; look.y = look.y0 = t.clientY; look.t0 = performance.now();
    }
  }
}, { passive: true });
renderer.domElement.addEventListener("touchmove", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === stick.id) {
      stick.x = t.clientX; stick.y = t.clientY;
      const dx = Math.max(-40, Math.min(40, stick.x - stick.x0));
      const dy = Math.max(-40, Math.min(40, stick.y - stick.y0));
      stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (t.identifier === look.id) {
      yaw -= (t.clientX - look.x) * 0.005;
      pitch -= (t.clientY - look.y) * 0.005;
      pitch = Math.max(-1.2, Math.min(1.2, pitch));
      look.x = t.clientX; look.y = t.clientY;
    }
  }
  e.preventDefault();
}, { passive: false });
renderer.domElement.addEventListener("touchend", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === stick.id) { stick.id = null; stickKnob.style.transform = ""; }
    if (t.identifier === look.id) {
      const moved = Math.hypot(t.clientX - look.x0, t.clientY - look.y0);
      if (moved < 12 && performance.now() - look.t0 < 350) interact({ x: t.clientX, y: t.clientY });
      look.id = null;
    }
  }
});

/* ---------- interaction ---------- */

const ray = new THREE.Raycaster();
ray.far = 4.5;
let hovered = null;

function pick(screenPt) {
  const ndc = screenPt
    ? new THREE.Vector2((screenPt.x / innerWidth) * 2 - 1, -(screenPt.y / innerHeight) * 2 + 1)
    : new THREE.Vector2(0, 0);
  ray.setFromCamera(ndc, camera);
  // in the hall every room is in view through its doorway; inside a room, only that room
  const list = shownRoom ? [...(meshesBy[shownRoom] || []), ...meshesBy.hall] : allMeshes;
  const hit = ray.intersectObjects(list, false)[0];
  return hit ? interactables.find((i) => i.mesh === hit.object) : null;
}
function interact(screenPt) {
  if (!started || panelOpen) return;
  const item = pick(screenPt);
  if (item) item.open();
}
function setHover(item) {
  if (hovered === item) return;
  if (hovered && hovered.glow) hovered.mesh.material = hovered.glow[0];
  else if (hovered && hovered.mat) {
    if (hovered.base !== undefined) hovered.mat.emissiveIntensity = hovered.base;
    else hovered.mat.emissive?.setHex(0x000000);
  }
  hovered = item;
  // glow: [hidden, shown] materials for a pick box over something drawn in a batch (like a book)
  if (item && item.glow) item.mesh.material = item.glow[1];
  else if (item && item.mat) {
    if (item.base !== undefined) item.mat.emissiveIntensity = Math.min(item.base + 0.5, 1.3);
    else item.mat.emissive?.setHex(0x4a3510);
  }
  crossEl.classList.toggle("on", !!item);
  if (item && !TOUCH) {
    hintEl.textContent = item.hint + "  (click or E)";
    hintEl.classList.add("on");
  } else {
    hintEl.classList.remove("on");
  }
}

/* ---------- loop ---------- */

const whereEl = $("where");
let lastArea = "";
let shownRoom = null;

/** Which room the player is properly inside (not the doorway), or null. */
function roomAt(x, z) {
  for (const [key, room] of Object.entries(rooms)) {
    const [lx, lz] = toLocal(room.angle, x, z);
    if (inRoomArea(room, lx, lz, { zNear: -5.6, pad: 0 })) return key;
  }
  return null;
}

/** Hide the rooms you can't see from where you are. It saves drawing and lighting work. */
function showOnly(key) {
  shownRoom = key;
  for (const [k, room] of Object.entries(rooms)) room.group.visible = !key || k === key;
  // heavy things (like hundreds of game covers) load the first time you walk into their room
  const room = rooms[key];
  if (room && room.onEnter) { const once = room.onEnter; room.onEnter = null; once(); }
}
const clock = new THREE.Clock();
let bob = 0;

/*
 * Resolution that adapts: on a high-density screen the room is drawn at up to twice the pixels.
 * If frames take too long for a couple of seconds, step the detail down (2 -> 1.5 -> 1.25 -> 1).
 */
const startRatio = Math.max(1, Math.min(devicePixelRatio, 2));
const ratios = [startRatio, ...[1.5, 1.25, 1].filter((r) => r < startRatio)];
let ratioIdx = 0, slowTime = 0, sampleTime = 0;
function adaptResolution(raw) {
  if (!started || ratioIdx >= ratios.length - 1 || raw > 0.25) return;   // ignore pauses and tab switches
  sampleTime += raw;
  if (raw > 1 / 45) slowTime += raw;
  if (sampleTime < 2) return;
  if (slowTime / sampleTime > 0.5) {
    ratioIdx++;
    renderer.setPixelRatio(ratios[ratioIdx]);
    resize();
  }
  sampleTime = slowTime = 0;
}

function frame() {
  const raw = clock.getDelta();
  adaptResolution(raw);
  const dt = Math.min(raw, 0.05);
  const t = clock.elapsedTime;

  if (started && !panelOpen && (document.pointerLockElement || TOUCH)) {
    let f = 0, s = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) f += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) f -= 1;
    if (keys.has("KeyD")) s += 1;
    if (keys.has("KeyA")) s -= 1;
    if (keys.has("ArrowLeft")) yaw += 1.8 * dt;
    if (keys.has("ArrowRight")) yaw -= 1.8 * dt;
    if (stick.id !== null) {
      f += -Math.max(-1, Math.min(1, (stick.y - stick.y0) / 40));
      s += Math.max(-1, Math.min(1, (stick.x - stick.x0) / 40));
    }
    const len = Math.hypot(f, s);
    if (len > 0) {
      const k = (SPEED * dt) / Math.max(1, len);
      const sin = Math.sin(yaw), cos = Math.cos(yaw);
      const dx = (-sin * f + cos * s) * k;
      const dz = (-cos * f - sin * s) * k;
      const p = camera.position;
      if (walkable(p.x + dx, p.z)) p.x += dx;
      if (walkable(p.x, p.z + dz)) p.z += dz;
      bob += dt * 8;
    }
  }

  camera.position.y = EYE + Math.sin(bob) * 0.012;
  camera.rotation.set(pitch, yaw, 0);

  const area = areaAt(camera.position.x, camera.position.z);
  if (area && area !== lastArea) { lastArea = area; whereEl.textContent = area; }
  const inRoom = roomAt(camera.position.x, camera.position.z);
  if (inRoom !== shownRoom) showOnly(inRoom);

  animations.forEach((fn) => fn(t));

  if (started && !panelOpen && !TOUCH && document.pointerLockElement) setHover(pick(null));
  else if (TOUCH || panelOpen) setHover(null);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Compile the shaders for each view up front, so walking through a door doesn't stutter.
try {
  [null, ...Object.keys(rooms)].forEach((k) => { showOnly(k); renderer.compile(scene, camera); });
} catch (e) {}
showOnly(null);

$("loading").hidden = true;
startEl.hidden = false;
frame();

// hook for automated tests
window.__room = {
  camera, interactables, walkable, rooms,
  get stats() { let lights = 0; scene.traverseVisible((o) => { if (o.isLight) lights++; }); return { ...renderer.info.render, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries, programs: renderer.info.programs.length, lights, interactables: interactables.length }; },
  get started() { return started; },
  showPanel,
  setView(x, z, y, p) { camera.position.x = x; camera.position.z = z; yaw = y; pitch = p; },
};

