/* The floor-plan map in the Esc menu. Drawn as SVG from the same numbers that place the rooms,
 * so it stays right if the layout changes. Each room (and the hall) is a button that takes you there. */
import { DOOR_HALF, FACE, NEAR, R, RD, RW, esc, hubObstacles, rooms, toWorld } from "./core.js";

const NS = "http://www.w3.org/2000/svg";
let playerEl = null;

const pts = (list) => list.map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join(" ");

/** Build the map inside `container`. onGo(key) is called with "hall" or a room key. */
export function buildMap(container, onGo) {
  const parts = [];
  let minX = -R, maxX = R, minZ = -R, maxZ = R;
  const grow = ([x, z]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); };

  for (const [key, room] of Object.entries(rooms)) {
    const a = room.angle;
    const corners = [[-RW / 2, -NEAR], [RW / 2, -NEAR], [RW / 2, -NEAR - RD], [-RW / 2, -NEAR - RD]].map(([x, z]) => toWorld(a, x, z));
    const passage = [[-DOOR_HALF, -FACE + 0.3], [DOOR_HALF, -FACE + 0.3], [DOOR_HALF, -NEAR - 0.05], [-DOOR_HALF, -NEAR - 0.05]].map(([x, z]) => toWorld(a, x, z));
    corners.forEach(grow);
    const [cx, cz] = toWorld(a, 0, -NEAR - RD / 2);
    parts.push(`
      <g class="map__place map__place--${esc(key)}" data-go="${esc(key)}" tabindex="0" role="button" aria-label="Go to ${esc(room.label)}">
        <polygon class="map__passage" points="${pts(passage)}"/>
        <polygon class="map__room" points="${pts(corners)}"/>
        <text x="${cx.toFixed(2)}" y="${cz.toFixed(2)}">${esc(room.label)}</text>
      </g>`);
  }

  // the hall goes last so its circle sits over the ends of the passages
  parts.push(`
    <g class="map__place map__place--hall" data-go="hall" tabindex="0" role="button" aria-label="Go to the hall">
      <circle class="map__room" cx="0" cy="0" r="${R}"/>
      <text x="0" y="-1.2">The hall</text>
    </g>
    <rect class="map__exit" x="${-DOOR_HALF}" y="${R - 0.25}" width="${DOOR_HALF * 2}" height="0.5"/>
    <text class="map__small" x="0" y="${R + 1.3}">Way out</text>`);
  hubObstacles.forEach((o) => {
    parts.push(`<rect class="map__thing" x="${o.x0}" y="${o.z0}" width="${o.x1 - o.x0}" height="${o.z1 - o.z0}"/>
      <text class="map__small" x="${(o.x0 + o.x1) / 2}" y="${o.z1 + 1.0}">Mailbox</text>`);
  });
  grow([0, R + 1.6]);

  const pad = 1;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `${minX - pad} ${minZ - pad} ${maxX - minX + pad * 2} ${maxZ - minZ + pad * 2}`);
  svg.setAttribute("class", "map__svg");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Floor plan. Choose a room to go there.");
  svg.innerHTML = parts.join("") + `
    <g class="map__player" aria-hidden="true">
      <path d="M0,-0.95 L0.55,0.45 L0,0.15 L-0.55,0.45 Z"/>
    </g>`;
  container.replaceChildren(svg);
  playerEl = svg.querySelector(".map__player");

  svg.querySelectorAll("[data-go]").forEach((el) => {
    const go = () => onGo(el.dataset.go);
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

/** Move the "you are here" arrow. yaw 0 faces 12 o'clock, positive turns left. */
export function updateMap(x, z, yaw) {
  if (!playerEl) return;
  playerEl.setAttribute("transform", `translate(${x.toFixed(2)} ${z.toFixed(2)}) rotate(${(-yaw * 180 / Math.PI).toFixed(1)})`);
}
